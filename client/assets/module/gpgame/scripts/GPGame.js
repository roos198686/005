// 关牌（扑克）客户端主脚本
// 2人局/3人局各用一个独立场景(mjgame_gp2 / mjgame_gp3)，共用本脚本，maxPlayers 由场景序列化决定。
// 牌面：场景 cardTemplates 节点下预置 48 个牌面模板(Spade3..DiamondA)，运行时按 key 克隆使用。
cc.Class({
    extends: cc.Component,

    properties: {
        maxPlayers: {
            default: 3,
            type: cc.Integer
        }
    },

    onLoad: function () {
        if (!cc.vv) {
            cc.director.loadScene("loading");
            return;
        }
        this._cards = [];
        this._selected = {};
        this._mySeat = -1;
        this._turn = -1;
        this._freePlay = true;
        this._lastPlay = null;
        this._deadline = 0;
        this._over = false;
        this._final = false;
        this._selectUpOffset = 28;
        this._gpConf = {}; // 关牌玩法配置(来自服务端 gp_start)
        // 开局发牌动画状态
        this._dealAnimating = false;
        this._dealAnimNodes = null;
        this._dealAnimId = 0;
        // 出牌消失动画状态
        this._playAnimBusy = false;
        this._pendingRenderPais = null;
        // 记牌历史: [{round, seatIndex, type, key, pais:[id,...]}]
        this._playHistory = [];
        this._historyRound = 0;

        //Alert 组件正常由场景文件提供(gp2/gp3 的 Canvas 已挂),预览缓存旧场景时兜底补挂,否则退出/解散弹窗空调用直接中断
        if (!this.node.getComponent('Alert')) {
            var AlertCls = cc.js.getClassByName('Alert');
            if (AlertCls) { this.node.addComponent(AlertCls); }
        }

        if (!cc.sys.isNative) {
            var cvs = this.node.getComponent(cc.Canvas);
            if (cvs) {
                cvs.fitHeight = true;
                cvs.fitWidth = false;
            }
        }

        this.initView();
        this.initEvents();
        this.refreshFromState();
        //对局背景音乐(与麻将一致)
        if (cc.vv.audioMgr) cc.vv.audioMgr.playBGM("bgFight.mp3");
    },

    onDestroy: function () {
        if (this._sio && this._sioListeners) {
            this._sio.removeListener('exit_result', this._sioListeners.exit_result);
            this._sio.removeListener('dispress_push', this._sioListeners.dispress_push);
            this._sioListeners = null;
        }
        if (cc.vv && cc.vv.gameNetMgr && cc.vv.gameNetMgr.dataEventHandler == this.node) {
            cc.vv.gameNetMgr.dataEventHandler = null;
        }
    },

    // ===== 视图初始化 =====
    findNode: function (root, name) {
        if (root == null) return null;
        if (root.name == name) return root;
        var cs = root.children;
        for (var i = 0; i < cs.length; ++i) {
            var n = this.findNode(cs[i], name);
            if (n) return n;
        }
        return null;
    },

    initView: function () {
        this._n = {};
        var names = ["bg", "game", "prepare", "titleLabel", "roundLabel", "tipLabel", "countdownLabel", "handArea", "playArea",
            "playOwnerLabel", "cardsContainer", "playBtn", "passBtn", "hintBtn", "readyBtn", "exitBtn", "dissolveBtn",
            "prepareInfo", "settlePanel", "settleTitle", "settleContent", "settleAgainBtn", "settleAgainLabel",
            "settleCloseBtn",
            "settleExitBtn", "finalSettlePanel", "finalSettleTitle", "finalSettleContent", "finalSettleExitBtn", "dissolvePanel", "dissolveLabel", "dissolveAgreeBtn", "dissolveRejectBtn"];
        for (var i = 0; i < names.length; ++i) {
            this._n[names[i]] = this.findNode(this.node, names[i]);
        }

        this._seatViews = [];
        for (var s = 0; s < 3; ++s) {
            var box = this.findNode(this.node, "seatInfo" + s);
            this._seatViews.push(box ? {
                root: box,
                name: this.findNode(box, "nameLabel"),
                count: this.findNode(box, "countLabel"),
                remain: this.findNode(box, "remainLabel"),
                state: this.findNode(box, "stateLabel")
            } : null);
        }
        // 隐藏所有 ChatBubble (从麻将场景复制来时默认 active=true, 但文字为空或带麻将残留)
        var self = this;
        function hideChatBubbles(node) {
            if (!node) return;
            if (node._name === 'ChatBubble') node.active = false;
            (node._children || []).forEach(function(c) { hideChatBubbles(c); });
        }
        hideChatBubbles(this.node);
        // 显示索引→实际座位索引的映射。seatInfo0(下方)永远是自己, seatInfo1/2(上方)永远是对家
        this._seatMap = null;

        this._refreshTitle();
        if (this._n.settleAgainBtn) {
            this._n.settleAgainLabel = this.findNode(this._n.settleAgainBtn, "settleAgainBtnLabel");
            this._n.settleAgainBtn.active = false; //结算后才显示
            //按钮文字只保留按钮自身 Label(文字"准备"),子节点 Label 是历史遗留的重复文字,隐藏避免重叠
            if (this._n.settleAgainLabel) this._n.settleAgainLabel.active = false;
            var ownLb = this._n.settleAgainBtn.getComponent(cc.Label);
            //场景里该 Label 默认是禁用的,必须显式启用,否则按钮文字不显示
            if (ownLb) { ownLb.enabled = true; ownLb.string = "准备"; }
        }
        this._n.settlePanel.active = false;
        if (this._n.finalSettlePanel) this._n.finalSettlePanel.active = false;
        this._n.dissolvePanel.active = false;
        this._n.prepareInfo.active = false;
        // 准备阶段全部隐藏:等 gp_start_push → updateTurnUI 才显示
        var ops = this.findNode(this.node, "ops");
        if (ops) ops.active = false;
        this._n.playBtn.active = false;
        this._n.passBtn.active = false;
        if (this._n.hintBtn) this._n.hintBtn.active = false;
        // arrow 不在 _n 清单里,必须先判空:否则 TypeError 会让整个 initView 中断,
        // 下游的按钮绑定/容器隐藏(退出解散点不动、准备阶段满桌牌)全部不会执行
        var arrowNode = this.findNode(this.node, "arrow");
        if (arrowNode) arrowNode.active = false;
        this.setStr(this._n.tipLabel, "");
        this.setStr(this._n.countdownLabel, "");
        this.setStr(this._n.playOwnerLabel, "");

        // 桌中央方位箭头+倒计时
        this._n.arrow = this.findNode(this.node, "arrow");
        if (this._n.arrow) {
            this._n.arrowPointer = this.findNode(this._n.arrow, "pointer");
            this._n.arrowTime = this.findNode(this._n.arrow, "lblTime");
            this._n.arrow.active = false;
        }
        this.setArrowTime("");

        // 隐藏从麻将场景复制过来的残留节点 (holds/folds/penggangs/牌模板等和关牌无关)
        ["holds", "folds", "penggangs", "ChuPai", "settlePokerResult"].forEach(function (name) {
            var n = this.findNode(this.node, name);
            if (n) n.active = false;
        }.bind(this));

        // cardTemplates 下 48 个牌面节点已在场景里绑定好图集 spriteFrame, 直接从场景取
        // cardTemplates 节点本身 active=false (隐藏), 但子节点的 Sprite.spriteFrame 可正常读取
        this._cardFrames = {};
        var cardTplRoot = this.findNode(this.node, "cardTemplates");
        if (cardTplRoot) {
            var cs = cardTplRoot.children;
            for (var i = 0; i < cs.length; ++i) {
                var nm = cs[i].name;
                var sp = cs[i].getComponent(cc.Sprite);
                if (sp && sp.spriteFrame) {
                    this._cardFrames[nm] = sp.spriteFrame;
                }
            }
            cardTplRoot.active = false;
        }
        // 场景里的牌面引用失效(uuid 缺失)时, 回退到 resources/images/atlas/cards 图集按帧名加载
        this.loadCardFramesFromRes();

        // 手牌位/出牌位均为场景预置节点，JS 只填牌面与显隐，不创建/移动节点
        this._handSlots = [];
        this._playSlots = [];
        var self2 = this;
        for (var si = 0; si < 16; ++si) {
            var hs = this.findNode(this._n.handArea, "handSlot" + si);
            if (hs) {
                hs.on(cc.Node.EventType.TOUCH_END, (function (slot) {
                    return function () { self2.onSlotTouched(slot); };
                })(hs));
                // 隐藏选中钩标记，选中态仅靠牌面上移表示
                var mk = hs.getChildByName("selMark");
                if (mk) mk.active = false;
                this._handSlots.push(hs);
            }
            var ps = this.findNode(this._n.cardsContainer, "playSlot" + si);
            if (ps) this._playSlots.push(ps);
        }
        //兜底:如果 cardsContainer 找不到或 playSlots 为空,直接从场景根节点找
        if (this._playSlots.length == 0) {
            for (var si2 = 0; si2 < 16; ++si2) {
                var ps2 = this.findNode(this.node, "playSlot" + si2);
                if (ps2) this._playSlots.push(ps2);
            }
        }
        console.log('[GP] init cardsContainer=', this._n.cardsContainer ? 'OK' : 'NULL', '_playSlots.length=', this._playSlots.length);
        console.log('[GP] _handSlots.length=', this._handSlots.length, '_cardFrames count=', Object.keys(this._cardFrames).length);

        // 右上设置/聊天/语音按钮（与麻将一致）
        this._n.btnSettings = this.findNode(this.node, "btn_settings");
        this._n.btnChat = this.findNode(this.node, "btn_chat");
        this._n.btnVoice = this.findNode(this.node, "btn_voice");
        this._n.settingsPanel = this.findNode(this.node, "settings");
        this._n.chatPanel = this.findNode(this.node, "chat");
        // 右上设置/聊天/语音按钮：显隐统一由 updateActionBtns 控制（结算/整场结束时必须隐藏，否则会露在结算弹窗后面）
        if (this._n.settingsPanel) this._n.settingsPanel.active = false;
        if (this._n.chatPanel) this._n.chatPanel.active = false;
        this.bindButton(this._n.btnSettings, this.onBtnSettings, this);
        this.bindButton(this._n.btnChat, this.onBtnChat, this);
        this.bindButton(this._n.btnVoice, this.onBtnVoice, this);

        // 设置面板内的按钮（关闭/解散/退出）
        if (this._n.settingsPanel) {
            this._n.btnSettingsClose = this.findNode(this._n.settingsPanel, "btn_close");
            this._n.btnSettingsDissolve = this.findNode(this._n.settingsPanel, "btn_sqjsfj");
            this._n.btnSettingsExit = this.findNode(this._n.settingsPanel, "btn_exit");
            this.bindButton(this._n.btnSettingsClose, this.onBtnSettingsClose, this);
            this.bindButton(this._n.btnSettingsDissolve, this.onBtnSettingsDissolve, this);
            this.bindButton(this._n.btnSettingsExit, this.onExit, this);
        }
        // 聊天面板内的按钮（发送/快捷语/表情）
        if (this._n.chatPanel) {
            this._n.btnChatSend = this.findNode(this._n.chatPanel, "btnSend");
            this._n.iptChat = this.findNode(this._n.chatPanel, "iptChat");
            this._n.tabQuick = this.findNode(this._n.chatPanel, "tabQuick");
            this._n.tabEmoji = this.findNode(this._n.chatPanel, "tabEmoji");
            this._n.quickchatlist = this.findNode(this._n.chatPanel, "quickchatlist");
            this._n.emojis = this.findNode(this._n.chatPanel, "emojis");
            this.bindButton(this._n.btnChatSend, this.onBtnChatSend, this);
            this.bindButton(this._n.tabQuick, this.onTabQuick, this);
            this.bindButton(this._n.tabEmoji, this.onTabEmoji, this);
            // 点击聊天面板背景关闭
            var chatBg = this.findNode(this._n.chatPanel, "bg");
            this.bindButton(chatBg, this.onBtnChatClose, this);
            // 快捷语条目
            this._quickChatInfo = {
                item0: "快点啊，都等到我花儿都谢了！",
                item1: "怎么又断线了，网络怎么这么差啊！",
                item2: "不要走，决战到天亮！",
                item3: "你的牌打得也太好了！",
                item4: "你是妹妹还是哥哥啊？",
                item5: "和你合作真是太愉快了！",
                item6: "大家好，很高兴见到各位！",
                item7: "各位，真是不好意思，我得离开一会儿。",
                item8: "不要吵了，专心玩游戏吧！"
            };
            // 快捷语条目点击:发送 quick_chat(itemN),服务端广播 quick_chat_push
            var qself = this;
            var qlist = this.findNode(this._n.quickchatlist, "content") || this._n.quickchatlist;
            if (qlist) {
                qlist.children.forEach(function (item) {
                    if (!/^item\d+$/.test(item.name)) return;
                    qself.bindButton(item, function () {
                        cc.vv.net.send("quick_chat", item.name);
                        if (qself._n.chatPanel) qself._n.chatPanel.active = false;
                    }, qself);
                });
            }
        }

        // 对家牌背槽位（场景预置，按剩余张数显隐）
        this._oppSlots = [];
        for (var oi = 0; oi < 2; ++oi) {
            var row = [];
            for (var ci = 0; ci < 16; ++ci) {
                var oc = this.findNode(this.node, "oppCard" + oi + "_" + ci);
                if (oc) { oc.active = false; row.push(oc); }
            }
            if (row.length > 0) this._oppSlots.push(row);
        }
        // 牌背图已打进 resources/images/atlas/cards 图集, 加载后贴到所有对家牌背节点
        this.loadCardBack();

        this.bindButton(this._n.playBtn, this.onPlay, this);
        this.bindButton(this._n.passBtn, this.onPass, this);
        this.bindButton(this._n.hintBtn, this.onHint, this);
        this.bindButton(this._n.readyBtn, this.onReady, this);
        this.bindButton(this._n.exitBtn, this.onExit, this);
        this.bindButton(this._n.dissolveBtn, this.onDissolve, this);
        this.bindButton(this._n.settleAgainBtn, this.onSettleAgain, this);
        this.bindButton(this._n.settleExitBtn, this.onExit, this);
        // 单局结算弹窗右上角关闭按钮:收起弹窗并准备下一局
        this.bindButton(this._n.settleCloseBtn, this.onSettleClose, this);
        // 结算弹窗内的 New Sprite 按钮:同样是"关闭弹窗并开始下一局"
        this._n.settleNewBtn = this._n.settlePanel ? this._n.settlePanel.getChildByName("New Sprite") : null;
        this.bindButton(this._n.settleNewBtn, this.onSettleClose, this);
        //整场结算弹窗(独立节点)只带"退出房间"
        this.bindButton(this._n.finalSettleExitBtn, this.onExit, this);
        this.bindButton(this._n.dissolveAgreeBtn, this.onDissolveAgree, this);
        this.bindButton(this._n.dissolveRejectBtn, this.onDissolveReject, this);
        // ops 容器里只留三个按钮,其他麻将残留/默认垃圾全部隐藏
        var ops = this.findNode(this.node, "ops");
        if (ops) ops.children.forEach(function(c) { if (c.name !== 'playBtn' && c.name !== 'passBtn' && c.name !== 'hintBtn') c.active = false; });

        // 准备阶段:牌面全部清空(与麻将 MJGameZP.initView 一致:spriteFrame=null + 隐藏牌节点),
        // game 里只保留 up/myself(有 seatInfo0/1 头像),其余对局 UI 全关
        this._clearBoard();
        if (ops) ops.active = false;
        // arrow 不在 _n 清单里,必须用 findNode 取,否则 this._n.arrow 恒为 undefined 导致隐藏无效
        var arrowNode = this.findNode(this.node, "arrow");
        if (arrowNode) arrowNode.active = false;
        this.setStr(this._n.playOwnerLabel, "");

        // 记牌按钮与出牌记录面板(场景固化):后台 gp_card_history=1 时开局后显示按钮,点击展开/收起面板
        this._n.historyBtn = this.findNode(this.node, "historyBtn");
        this._n.historyPanel = this.findNode(this.node, "historyPanel");
        this._n.historyContent = this._n.historyPanel ? this.findNode(this._n.historyPanel, "content") : null;
        if (this._n.historyBtn) { this._n.historyBtn.active = false; this.bindButton(this._n.historyBtn, this.onHistoryBtn, this); }
        if (this._n.historyPanel) this._n.historyPanel.active = false;

        // 整场结算弹窗:直接使用场景自带的 game_result 节点(底图+关闭按钮已固化),内容由数据生成
        this._n.gameResult = this.node.getChildByName("game_result");
        if (this._n.gameResult) {
            this._n.gameResult.active = false;
            var grShare = this._n.gameResult.getChildByName("btnShare");
            if (grShare) this.bindButton(grShare, this.onExit, this);
            var grClose = this._n.gameResult.getChildByName("btnClose");
            if (grClose) { grClose.active = false; this.bindButton(grClose, this.onExit, this); }
        }

        // 关键:准备阶段按钮状态(未准备→退出,已准备→解散)
        this.updateActionBtns();
    },

    bindButton: function (node, fn, self) {
        if (node == null) return;
        var btnName = node.name;
        // 用 click 事件 (Button 组件触发), 比 TOUCH_END 可靠: active 切换不影响派发
        node.on('click', function () {
            console.log('[GP] btn click:', btnName);
            if (cc.vv.audioMgr) cc.vv.audioMgr.playSFX("ui_click.mp3");
            fn.call(self);
        });
    },

    // ===== 记牌历史(面板与按钮均为场景固化节点,JS只写文字与显隐) =====
    _isHistoryEnabled: function () {
        var conf = this._gpConf || {};
        return !!conf.gp_card_history;
    },

    // 记牌按钮:展开/收起出牌记录面板
    onHistoryBtn: function () {
        if (!this._n.historyPanel) return;
        this._renderHistory();
        this._n.historyPanel.active = !this._n.historyPanel.active;
    },

    _showHistoryIfEnabled: function () {
        var enabled = this._isHistoryEnabled();
        if (this._n.historyBtn) this._n.historyBtn.active = enabled;
        if (!enabled && this._n.historyPanel) this._n.historyPanel.active = false;
    },

    // 把一张牌的 id 转成可读字符串: 只显示点数(不带花色), A/J/Q/K 保留字母
    _formatPaiId: function (id) {
        if (id == null) return "";
        var r = this.rankOf(id);
        if (r === 14) return "A";
        if (r === 11) return "J";
        if (r === 12) return "Q";
        if (r === 13) return "K";
        return String(r);
    },

    // 推入一条出牌记录
    _addHistory: function (entry) {
        this._playHistory.push(entry);
        if (this._playHistory.length > 60) this._playHistory.shift(); // 最多保留60条
        this._renderHistory();
    },

    // 标记一轮结束(所有人 pass / 自由出牌)
    _historyNextRound: function () {
        this._historyRound++;
        if (this._playHistory.length > 0) {
            this._playHistory.push({ roundBreak: true });
        }
    },

    _renderHistory: function () {
        var node = this._n && this._n.historyContent;
        var lb = node ? node.getComponent(cc.Label) : null;
        if (!lb) return;
        var lines = [];
        for (var i = 0; i < this._playHistory.length; ++i) {
            var e = this._playHistory[i];
            if (e.roundBreak) {
                lines.push("── 第" + (this._historyRound + 1) + "轮 ──");
                continue;
            }
            var cardsStr = "";
            if (e.pais) {
                for (var j = 0; j < e.pais.length; j++) {
                    cardsStr += this._formatPaiId(e.pais[j]) + " ";
                }
            }
            lines.push(this._shortName(this.seatName(e.seatIndex)) + "(" + (this._comboName(e.type) || "") + "): " + cardsStr);
        }
        //面板高度固定,按字号算出能完整显示的行数,超出从最早记录截掉,避免顶部被裁
        var nodeH = (node.height || 250) - 8;
        var maxLines = Math.max(4, Math.floor(nodeH / (lb.fontSize * 1.45)));
        if (lines.length > maxLines) lines = lines.slice(lines.length - maxLines);
        node.color = cc.color(255, 255, 255, 255); //记录文字统一白色,深色面板上清晰可见
        lb.string = lines.join("\n");
    },

    //记牌器内昵称限长:含汉字只留3个字符,纯英文/数字留5个字符,超出加…,避免撑乱记录排版
    _shortName: function (name) {
        var s = String(name == null ? "" : name);
        var max = /[\u4e00-\u9fa5]/.test(s) ? 3 : 5;
        return s.length > max ? s.substr(0, max) + "…" : s;
    },

    //牌型英文标识 → 中文显示(记牌器里显示 "欧阳(单张): 3", 而不是 "(single)")
    _comboName: function (type) {
        var map = {
            single: "单张", pair: "对子", triple: "三张",
            triple_one: "三带一", triple_pair: "三带二",
            four_two: "四带二", four_three: "四带三",
            straight: "顺子", pair_straight: "连对", triple_straight: "飞机",
            bomb: "炸弹"
        };
        return map[type] || "";
    },

    //顶部标题: 房号+玩法+人数+底分
    _refreshTitle: function () {
        var nm = cc.vv.gameNetMgr || {};
        // 优先用开局下发的 conf，其次用 login_result 里 GameNetMgr 存的 conf
        var conf = this._gpConf || nm.conf || {};
        var roomId = nm.roomId || "";
        var baseScore = conf.baseScore || 1;
        var parts = [];
        if (roomId) parts.push("房号 " + roomId);
        parts.push("关牌·" + this.maxPlayers + "人");
        parts.push("底分:" + baseScore);
        if (this._n.titleLabel) this.setStr(this._n.titleLabel, parts.join(" · "));
    },

    // ===== 牌面模板 =====
    rankOf: function (id) { return Math.floor(id / 4) + 3; },
    suitOf: function (id) { return id % 4; },

    cardFrameKey: function (id) {
        var suits = ["Spade", "Heart", "Club", "Diamond"];
        var ranks = ["", "", "", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A", "2"];
        return suits[this.suitOf(id)] + ranks[this.rankOf(id)];
    },

    // 从图集 resources/images/atlas/cards 取全部牌面 + 牌背
    // 帧名与场景 cardTemplates 子节点名一致: Spade3 / Heart10 / ClubK / DiamondA / card_back
    loadCardFramesFromRes: function () {
        var self = this;
        cc.resources.load("images/atlas/cards", cc.SpriteAtlas, function (err, atlas) {
            if (err || !atlas) { console.log('[GP] 牌面图集加载失败:', err); return; }
            function get(nm) { return atlas.getSpriteFrame(nm + ".png") || atlas.getSpriteFrame(nm); }
            var suits = ["Spade", "Heart", "Club", "Diamond"];
            var ranks = ["3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A", "2"];
            for (var i = 0; i < suits.length; ++i) {
                for (var j = 0; j < ranks.length; ++j) {
                    var nm = suits[i] + ranks[j];
                    var fr = get(nm);
                    if (fr) self._cardFrames[nm] = fr; // 图集为唯一来源, 覆盖场景模板里可能残留的旧帧(如黑桃3绑了麻将图)
                }
            }
            self._cardBack = get("card_back") || self._cardBack;
            console.log('[GP] 牌面图集加载完成, 缓存张数=', Object.keys(self._cardFrames).length);
            self.applyCardBack();
            // 图集是异步加载的: 进房瞬间 gp_start 可能先到, frameOf 还返回 null 导致手牌空白,
            // 图集就绪后补一次渲染(否则要等玩家点提示/出牌/过才刷新出来)
            if (self._cards && self._cards.length) self.renderAll();
        });
        // 聊天气泡底色(场景里 chatbg_ld 的 spriteFrame 是空的, 需要补一张)
        cc.resources.load("images/chatbg", cc.SpriteFrame, function (e2, sf) {
            if (!e2 && sf) self._chatBgFrame = sf;
        });
    },

    // 牌背: 已包含在图集内, 这里只负责贴到对家牌位
    loadCardBack: function () {
        this.applyCardBack();
    },

    applyCardBack: function () {
        if (!this._cardBack || !this._oppSlots) return;
        var frame = this._cardBack;
        this._oppSlots.forEach(function (row) {
            row.forEach(function (n) {
                var sp = n.getComponent(cc.Sprite);
                if (sp) sp.spriteFrame = frame;
            });
        });
        this._blankStrayCardBacks();
    },

    // 场景里残留的"牌背"节点(不在对家牌位里)会显示成一张怪牌混在手牌区, 统一清掉
    _blankStrayCardBacks: function () {
        if (!this._cardBack) return;
        var allowed = {};
        (this._oppSlots || []).forEach(function (row) {
            row.forEach(function (n) { allowed[n.uuid] = true; });
        });
        var self = this;
        var strays = [];
        (function walk(n) {
            var sp = n.getComponent(cc.Sprite);
            if (sp && sp.spriteFrame === self._cardBack && !allowed[n.uuid]) {
                sp.spriteFrame = null;
                strays.push(n.name);
            }
            var kids = n.children || [];
            for (var i = 0; i < kids.length; ++i) walk(kids[i]);
        })(this.node);
        if (strays.length) console.log('[GP] 清理残留牌背节点: ' + strays.join(','));
    },

    // 牌面 PNG 资源加载: resources/poker/{Suit}{Rank}.png, 异步加载并缓存
    // 牌面贴图从场景 cardTemplates 子节点预绑定的 Sprite.spriteFrame 取
    frameOf: function (id) {
        if (!this._cardFrames) return null;
        var key = this.cardFrameKey(id);
        return this._cardFrames[key] || null;
    },

    // ===== 牌型识别（与服务端 gamemgr_guanpai.identify 保持一致）=====
    // 返回 {type,key,len,bombLevel} 或 null
    _identifyCards: function (pais, isLastHand) {
        if (!pais || pais.length == 0) return null;
        var n = pais.length;
        var selfId = this;
        var ranks = pais.map(function (c) { return selfId.rankOf(c); }).sort(function (a, b) { return a - b; });
        var cnt = {};
        for (var i = 0; i < ranks.length; ++i) { cnt[ranks[i]] = (cnt[ranks[i]] || 0) + 1; }
        var keys = Object.keys(cnt).map(Number).sort(function (a, b) { return a - b; });
        var maxCount = 0, maxCountKey = -1, count4Key = -1;
        for (var k = 0; k < keys.length; ++k) {
            var c = cnt[keys[k]];
            if (c > maxCount) { maxCount = c; maxCountKey = keys[k]; }
            if (c == 4) count4Key = keys[k];
        }
        var conf = this._gpConf || {};
        var bombOn = conf.gp_bomb != null ? !!conf.gp_bomb : true;
        var bombFourOn = conf.gp_bomb_four != null ? !!conf.gp_bomb_four : true;

        // 炸弹优先级: A炸(4张) > 纯四张同点(4张) > 四带一(5张)
        if (bombOn) {
            // A炸: AAAA 或 AAA+1, 最大炸弹 (bombLevel=2)
            if (n == 4 && cnt[14] >= 3) return { type: 'bomb', key: 14, len: 4, bombLevel: 2 };
            // 纯四张同点炸弹 (bombLevel=1)
            if (n == 4 && count4Key > 0 && bombFourOn) return { type: 'bomb', key: count4Key, len: 4, bombLevel: 1 };
            // 普通四带一炸弹 (bombLevel=0)
            if (n == 5 && count4Key > 0) return { type: 'bomb', key: count4Key, len: 5, bombLevel: 0 };
        }
        if (n == 1) return { type: 'single', key: ranks[0], len: 1 };
        if (n == 2 && keys.length == 1) return { type: 'pair', key: keys[0], len: 2 };
        if (n == 3 && keys.length == 1) return { type: 'triple', key: keys[0], len: 3 };
        // 三带一(3+1)：常规允许由 gp_three_one 控制；脱手额外由 gp_last_three_one 控制
        if (n == 4 && maxCount == 3) {
            var threeOneOk = (conf.gp_three_one != null ? !!conf.gp_three_one : true)
                          || (isLastHand && (conf.gp_last_three_one != null ? !!conf.gp_last_three_one : false));
            if (threeOneOk) return { type: 'triple_one', key: maxCountKey, len: 4 };
            return null;
        }
        // 三带二
        if (n == 5 && maxCount == 3 && keys.length == 2 && cnt[maxCountKey] == 3) {
            return { type: 'triple_pair', key: maxCountKey, len: 5 };
        }
        // 四带二 / 四带三
        if (n == 6 && count4Key > 0) {
            var ok42 = (conf.gp_four_two != null && conf.gp_four_two) || (isLastHand && conf.gp_last_four_two_three);
            if (ok42) return { type: 'four_two', key: count4Key, len: 6 };
            return null;
        }
        if (n == 7 && count4Key > 0) {
            var ok43 = (conf.gp_four_three != null && conf.gp_four_three) || (isLastHand && conf.gp_last_four_two_three);
            if (ok43) return { type: 'four_three', key: count4Key, len: 7 };
            return null;
        }
        // 顺子(≥5)
        if (n >= 5 && keys.length == n) {
            var allOne = true;
            for (var kk in cnt) { if (cnt[kk] != 1) { allOne = false; break; } }
            if (allOne) {
                var allowA2 = conf.gp_straight_a2 != null ? !!conf.gp_straight_a2 : true;
                var sk = this._straightKey(keys, allowA2);
                if (sk > 0) return { type: 'straight', key: sk, len: n };
                return null;
            }
        }
        // 连对(≥2组)
        if (n >= 4 && n % 2 == 0 && keys.length * 2 == n) {
            var allTwo = true;
            for (var kk2 in cnt) { if (cnt[kk2] != 2) { allTwo = false; break; } }
            if (allTwo) {
                var pk = this._pairStraightKey(keys, allowA2);
                if (pk > 0) return { type: 'pair_straight', key: pk, len: n };
                return null;
            }
        }
        // 三顺(≥2组)
        if (n >= 6 && n % 3 == 0 && keys.length * 3 == n) {
            var allThree = true;
            for (var kk3 in cnt) { if (cnt[kk3] != 3) { allThree = false; break; } }
            if (allThree) {
                var tk = this._pairStraightKey(keys, allowA2);
                if (tk > 0) return { type: 'triple_straight', key: tk, len: n };
                return null;
            }
        }
        return null;
    },

    // 顺子比较点数：3~A 永远合法(不关开关, key=最高rank)；
    // allowA2=true 时环状合法(A/2都可参与环状低端, key=虚拟最高位)；纯自然2345也属环状
    _virtRank: function (r) { return r == 14 ? 1 : (r == 15 ? 2 : r); },

    _straightKey: function (keys, allowA2) {
        if (keys.length < 5) return -1;
        var last = keys[keys.length - 1];
        // 1) 自然连续: 3~A 都允许
        if (last != 15) {
            var seq = true;
            for (var j = 1; j < keys.length; ++j) { if (keys[j] != keys[j - 1] + 1) { seq = false; break; } }
            if (seq) return last;
        }
        // 2) 环状(allowA2=true): 虚拟映射后从 vkeys[0] 连续, 且原始含 A(14)或2(15)
        if (allowA2 && (keys.indexOf(14) >= 0 || keys.indexOf(15) >= 0)) {
            var vkeys = keys.map(this._virtRank).sort(function (a, b) { return a - b; });
            var vseq = true;
            for (var j = 1; j < vkeys.length; ++j) { if (vkeys[j] != vkeys[j - 1] + 1) { vseq = false; break; } }
            if (vseq) return vkeys[vkeys.length - 1];
        }
        return -1;
    },

    _pairStraightKey: function (keys, allowA2) {
        if (keys.length < 2) return -1;
        var last = keys[keys.length - 1];
        if (last != 15) {
            var seq = true;
            for (var i = 1; i < keys.length; ++i) { if (keys[i] != keys[i - 1] + 1) { seq = false; break; } }
            if (seq) return last;
        }
        if (allowA2 && (keys.indexOf(14) >= 0 || keys.indexOf(15) >= 0)) {
            var vkeys = keys.map(this._virtRank).sort(function (a, b) { return a - b; });
            var vseq = true;
            for (var i = 1; i < vkeys.length; ++i) { if (vkeys[i] != vkeys[i - 1] + 1) { vseq = false; break; } }
            if (vseq) return vkeys[vkeys.length - 1];
        }
        return -1;
    },

    _canBeat: function (next, prev) {
        if (!next || !prev) return false;
        var nb = next.type == 'bomb', pb = prev.type == 'bomb';
        if (nb && !pb) return true;
        if (!nb && pb) return false;
        if (nb && pb) {
            if (next.bombLevel != prev.bombLevel) return next.bombLevel > prev.bombLevel;
            return next.key > prev.key;
        }
        if (next.type != prev.type || next.len != prev.len) return false;
        return next.key > prev.key;
    },

    // 收集所有能压住上家的合法组合（返回牌 id 数组的数组）
    // 同时缓存到 this._playableCombos，供提示按钮轮换使用
    collectPlayableCombos: function () {
        var result = [];
        if (!this._lastPlay) {
            this._playableCombos = result;
            return result;
        }
        var prev = this._lastPlay;
        var prevType = { type: prev.type, key: prev.key, len: prev.len, bombLevel: prev.bombLevel || 0 };
        var cards = this._cards;
        var n = cards.length;
        var fullLen = n;
        var seen = {};
        for (var mask = 1; mask < (1 << n); ++mask) {
            var subset = [];
            for (var b = 0; b < n; ++b) { if (mask & (1 << b)) subset.push(cards[b]); }
            var isLast = (subset.length == fullLen);
            var t = this._identifyCards(subset, isLast);
            if (t && this._canBeat(t, prevType)) {
                // 去重：按牌面 id 排序生成 key
                var sorted = subset.slice().sort(function (a, b) { return a - b; });
                var key = sorted.join(',');
                if (!seen[key]) {
                    seen[key] = true;
                    result.push(sorted);
                }
            }
        }
        // 按牌型+张数+点数排序，优先展示更小的可压组合
        result.sort(function (a, b) {
            if (a.length !== b.length) return a.length - b.length;
            return a[0] - b[0];
        });
        this._playableCombos = result;
        return result;
    },

    // 是否存在能压住上家的组合
    hasPlayable: function () {
        if (!this._lastPlay) return true;
        return this.collectPlayableCombos().length > 0;
    },

    // 提示按钮：轮换选中一组能压住上家的牌
    onHint: function () {
        if (!this.isMyTurn() || this._freePlay || !this._lastPlay) {
            this.showTip("自由出牌无需提示");
            return;
        }
        var combos = this._playableCombos;
        if (!combos || combos.length === 0) combos = this.collectPlayableCombos();
        if (combos.length === 0) {
            this.showTip("没有能压过上家的牌");
            return;
        }
        if (this._hintIndex == null || this._hintIndex >= combos.length) this._hintIndex = 0;
        var combo = combos[this._hintIndex];
        this._selected = {};
        for (var i = 0; i < combo.length; ++i) this._selected[combo[i]] = true;
        this.renderHand();
        this.updateTurnUI(); //提示选牌后刷新出牌按钮
        this._hintIndex = (this._hintIndex + 1) % combos.length;
    },

    // 轮到自己且非自由出牌时，若无法压牌则自动过（延迟执行以展示过牌过程）
    checkAutoPass: function () {
        if (!this.isMyTurn()) return;
        if (this._freePlay || !this._lastPlay) return;
        var combos = this.collectPlayableCombos();
        if (combos.length === 0) {
            // 无牌可压：播过按钮动画+音效，短暂延迟后自动过
            this._selected = {};
            this.renderHand();
            this._playAutoPassAnim();
            var self = this;
            if (this._autoPassTimer) clearTimeout(this._autoPassTimer);
            this._autoPassTimer = setTimeout(function () {
                if (!self.isMyTurn() || self._over) return;
                cc.vv.net.send("guo");
            }, 600);
        }
    },

    // 自动过牌动画: passBtn 弹出+音效
    _playAutoPassAnim: function () {
        var btn = this._n.passBtn;
        if (!btn) { if (cc.vv.audioMgr) cc.vv.audioMgr.playSFX("pass.mp3"); return; }
        // 音效
        if (cc.vv.audioMgr) cc.vv.audioMgr.playSFX("pass.mp3");
        // 动画: 放大→缩小→弹一下
        btn.active = true;
        btn.stopAllActions();
        var self = this;
        var origScale = btn.scale;
        btn.scale = origScale * 1.3;
        cc.tween(btn)
            .to(0.12, { scale: origScale * 1.15 })
            .to(0.1, { scale: origScale })
            .start();
    },

    // 重置提示/自动过牌状态（轮次或桌面变化时调用）
    resetHintState: function () {
        this._playableCombos = null;
        this._hintIndex = 0;
        if (this._autoPassTimer) {
            clearTimeout(this._autoPassTimer);
            this._autoPassTimer = null;
        }
    },

    // ===== 事件 =====
    initEvents: function () {
        var self = this;
        var nm = cc.vv.gameNetMgr;
        nm.dataEventHandler = this.node;

        this.node.on('gp_start', function (d) { self.onGpStart(d && d.detail); });
        this.node.on('gp_chupai', function (d) { self.onGpChupai(d && d.detail); });
        this.node.on('gp_turn', function (d) { self.onGpTurn(d && d.detail); });
        this.node.on('gp_pass', function (d) { self.onGpPass(d && d.detail); });
        this.node.on('gp_newround', function (d) { self.onGpNewRound(d && d.detail); });
        this.node.on('gp_error', function (d) { self.showTip((d && d.detail && d.detail.msg) || "操作失败"); });
        this.node.on('game_over', function (d) { self.onGameOver(d && d.detail); });
        this.node.on('game_end', function (d) { self.onGameEnd(d && d.detail); });
        this.node.on('game_begin', function () { self.onNewGameBegin(); });
        this.node.on('game_num', function () { self.updateRoundLabel(); });
        this.node.on('user_ready', function (d) { self.onUserReady(d && d.detail); });
        this.node.on('new_user', function () { self.renderSeats(); });
        this.node.on('user_state_changed', function () { self.renderSeats(); });

        // 重进房间时, 服务端的 gp_start/gp_resend 往往在场景加载完成之前就到了,
        // 那时 dataEventHandler 还是 null, 事件被 GameNetMgr 入队; 这里补一次重放,
        // 否则要等玩家点提示/出牌/过触发重绘才看到牌
        var pending = nm._pendingEvents;
        if (pending && pending.length) {
            nm._pendingEvents = null;
            console.log('[GP] 重放场景加载前的推送 ' + pending.length + ' 条');
            for (var pi = 0; pi < pending.length; ++pi) {
                this.node.emit(pending[pi].event, { detail: pending[pi].data });
            }
        }
        // 兜底: 推送可能被上一个场景的 dataEventHandler 吃掉(重进房间场景切换期间),
        // 这里直接用 GameNetMgr 里缓存的对局状态重绘, 保证进房立刻看到牌
        if ((!this._cards || this._cards.length == 0) && nm.gpMyCards && nm.gpMyCards.length) {
            console.log('[GP] 用缓存状态直接重绘 ' + nm.gpMyCards.length + ' 张');
            self.onGpStart({
                myCards: nm.gpMyCards.slice(),
                mySeat: nm.gpMySeat,
                startSeat: nm.gpTurn,
                freePlay: nm.gpFreePlay,
                lastPlay: nm.gpLastPlay,
                seats: nm.gpSeats,
                turnDeadline: nm.gpTurnDeadline
            });
        }
        // 聊天消息: 找到发言者座位框上的 ChatBubble, 显示 3 秒
        function showBubble(seatIdx, content) {
            if (seatIdx == null || seatIdx < 0) return;
            var views = self._seatViews;
            var map = self._seatMap;
            // 未开局时 _seatMap 还没生成,按座位固定关系兜底:seatInfo0 是自己,其余是对家
            var viewIdx = (map && map.length) ? map.indexOf(seatIdx) : (seatIdx === nm.seatIndex ? 0 : 1);
            if (viewIdx < 0 || !views[viewIdx]) return;
            var bubble = views[viewIdx].root.getChildByName('ChatBubble');
            if (!bubble) return;
            bubble.active = true;
            // 只用一个 Label 显示文字: 之前同时写 ChatBubble 自身的 Label 和子节点 New Label,
            // 两个 Label 叠在一起 => 聊天文字"重字"
            var lbl = bubble.getComponent(cc.Label);
            if (lbl) {
                lbl.string = content;
                lbl.node.color = cc.color(255, 255, 255); // 深色气泡 + 白字, 不用棕色(会连带把气泡底色染棕)
            }
            var inner = bubble.getChildByName('New Label');
            if (inner) inner.active = false;
            // 气泡底色: 场景里 chatbg_ld 没有图, 运行时补一张九宫格白底
            var bg = bubble.getChildByName('chatbg_ld');
            if (bg) {
                bg.active = true;
                var sp = bg.getComponent(cc.Sprite);
                if (sp) {
                    if (self._chatBgFrame) {
                        sp.spriteFrame = self._chatBgFrame;
                        sp.type = cc.Sprite.Type.SLICED;
                        sp.sizeMode = cc.Sprite.SizeMode.CUSTOM;
                    }
                }
                var w = Math.min(420, Math.max(80, String(content).length * 26 + 36));
                bg.setContentSize(w, 52);
                bg.color = cc.color(45, 40, 38, 210); // 半透明深底, 白字可读
            }
            if (bubble.getContentSize().width < 10) bubble.setContentSize(220, 68);
            self._chatBubbleTimers = self._chatBubbleTimers || {};
            if (self._chatBubbleTimers[seatIdx]) clearTimeout(self._chatBubbleTimers[seatIdx]);
            self._chatBubbleTimers[seatIdx] = setTimeout(function () { bubble.active = false; }, 3000);
        }
        this.node.on('chat_push', function (d) {
            var data = d.detail;
            showBubble(nm.getSeatIndexByID(data.sender), data.content);
        });
        this.node.on('quick_chat_push', function (d) {
            var data = d.detail;
            // 服务端只回传 itemN,文字在前端固定映射里取
            var txt = (self._quickChatInfo && self._quickChatInfo[data.content]) || data.content;
            showBubble(nm.getSeatIndexByID(data.sender), txt);
        });
        this.node.on('dissolve_notice', function (d) { self.onDissolveNotice(d && d.detail); });
        this.node.on('dissolve_cancel', function () { if (self._n.dissolvePanel) self._n.dissolvePanel.active = false; });
        this.node.on('room_exit', function () { self.leaveRoom(); });
        this.node.on('room_dispress', function () { self.leaveRoom(); });
        // 直接监听 socket 层(与麻将 MJRoom 一致):
        // GameNetMgr 的 exit_result/dispress_push 只清本地状态、不派发事件,
        // 之前依赖的 room_exit/room_dispress 永远不会触发 => 点退出/解散后卡在房间页
        var sio = cc.vv.net ? cc.vv.net.sio : null;
        if (sio) {
            var onExitResult = function () {
                console.log('[GP] exit_result: 退出成功, 返回大厅/俱乐部');
                self.leaveRoom();
            };
            var onDispress = function () {
                console.log('[GP] dispress_push: 房间已解散, 返回大厅/俱乐部');
                self.leaveRoom();
            };
            sio.on('exit_result', onExitResult);
            sio.on('dispress_push', onDispress);
            this._sio = sio;
            this._sioListeners = { exit_result: onExitResult, dispress_push: onDispress };
        }
        this.node.on('disconnect', function () { self.showTip("网络已断开，正在重连..."); });
        this.node.on('reconnect', function () { self.setStr(self._n.tipLabel, ""); });
    },

    leaveRoom: function () {
        if (this._leaving) return;
        this._leaving = true;
        // 防重复:若场景已在 hall/club 就不再 loadScene
        var curScene = cc.director.getScene ? cc.director.getScene() : null;
        var curName = (curScene && curScene.name) ? curScene.name : "";
        if (curName === "hall" || curName === "club") return;
        //从俱乐部进的房间退出回俱乐部(直达玩法详情页),从大厅进的房间退出回大厅牌桌页面
        console.log('[GP] leaveRoom fromClub=' + cc.vv.fromClub + ' fromClubId=' + cc.vv.fromClubId);
        if (cc.vv.fromClub || cc.vv.fromClubId) cc.director.loadScene("club");
        else cc.director.loadScene("hall");
    },

    // 场景加载时：若牌局已在进行(开局事件早于场景就绪被丢弃)，直接用GameNetMgr缓存恢复
    refreshFromState: function () {
        //先彻底清空牌面,再按真实状态决定是否重绘:否则上一局/上一次会话的残留牌会直接留在桌上
        this._clearBoard();
        var nm = cc.vv.gameNetMgr;
        if (nm.conf) this._gpConf = nm.conf;
        this._refreshTitle();
        if (nm.gamestate == "begin" && nm.gpMyCards && nm.gpMyCards.length > 0) {
            this.applyGame(nm.gpMyCards, nm.gpMySeat, nm.gpTurn, nm.gpFreePlay, nm.gpLastPlay, nm.gpSeats, nm.gpTurnDeadline, false);
            return;
        }
        this.showPrepare();
        this.renderSeats();
        this.updateRoundLabel();
        // 已准备但场景重新加载：保持"等待其他玩家"状态，不再显示准备按钮
        var selfSeat = nm.seats ? nm.seats[nm.seatIndex] : null;
        if (selfSeat && selfSeat.ready) {
            this._n.readyBtn.active = false;
            this._n.prepareInfo.active = true;
            this.setLabel(this._n.prepareInfo, "已准备，等待其他玩家…");
        }
        if (nm.numOfGames >= nm.maxNumOfGames && nm.maxNumOfGames > 0) {
            this._final = true;
        }
    },

    // ===== 开局/接续 =====
    applyGame: function (cards, mySeat, turn, freePlay, lastPlay, seats, deadline, fromStart) {
        this.resetHintState();
        this._cards = (cards instanceof Array) ? cards.slice() : [];
        this._mySeat = (mySeat != null) ? mySeat : 0;
        this._turn = (turn != null) ? turn : 0;
        this._freePlay = (freePlay != null) ? !!freePlay : true;
        this._lastPlay = lastPlay || null;
        this._deadline = deadline || 0;
        this._over = false;
        this.restoreSettleBg();
        this._selected = {};
        this._n.readyBtn.active = false;
        this._n.prepareInfo.active = false;
        //单局结算弹窗不自动关闭(只由玩家点关闭按钮收起),新一局开始也不覆盖
        if (this._n.finalSettlePanel) this._n.finalSettlePanel.active = false;
        this._n.handArea.active = true;
        this._n.playArea.active = true;
        this.renderSeats();
        this.renderHand();
        this.renderLastPlay();
        this.updateTurnUI();
        this.updateRoundLabel();
        this.updateActionBtns();
        //重进房间/断线重连时服务端走 gp_resend_push,事件可能早于场景加载被丢弃,
        //这里按玩法配置恢复记牌按钮显隐,不再只依赖 gp_start
        this._showHistoryIfEnabled();
        this.checkAutoPass();
        // 开局首次发牌:手牌从桌中央依次飞出(仅 gp_start 触发且无任何出牌记录;断线重连保持瞬间渲染)
        if (fromStart && this._isFreshDeal()) {
            this._playDealAnim();
        }
    },

    // 是否本局首次发牌:全场无出牌记录(对家剩余牌数等于初始手牌数),且非回放
    _isFreshDeal: function () {
        if (cc.vv.replayMgr && cc.vv.replayMgr.isReplay()) { return false; }
        var nm = cc.vv.gameNetMgr;
        var seats = nm.gpSeats;
        if (!seats) { return false; }
        // 初始手牌数:关牌统一每人16张
        var initCount = 16;
        for (var i = 0; i < seats.length; ++i) {
            var s = seats[i];
            if (!s) { continue; }
            if ((s.count || 0) != initCount) { return false; }
        }
        return true;
    },

    // 发牌动画:原渲染逻辑已把所有牌摆到最终位,此处记录最终状态→移到桌中央并透明→逐张飞回
    _playDealAnim: function () {
        var STEP = 0.06; // 每张起飞间隔
        var FLY = 0.15;  // 单张飞行时长
        if (cc.vv.audioMgr) cc.vv.audioMgr.playSFX("deal.mp3"); //发牌音效
        this._cancelDealAnim(); // 防御:清掉可能未播完的上一次动画
        // 桌中央(画布坐标(0,0))换算到各牌父节点坐标系
        var centerWorld = this.node.convertToWorldSpaceAR(cc.v2(0, 0));
        var animNodes = [];
        var maxEnd = 0;
        var self = this;
        var collect = function (nodes, parent, orderFn) {
            if (parent == null || nodes.length == 0) { return; }
            var start = parent.convertToNodeSpaceAR(centerWorld);
            if (orderFn) { nodes.sort(orderFn); }
            for (var i = 0; i < nodes.length; ++i) {
                var nc = nodes[i];
                var fx = nc.x, fy = nc.y, fop = nc.opacity;
                animNodes.push({ node: nc, fx: fx, fy: fy, op: fop });
                nc.setPosition(start);
                nc.opacity = 0;
                nc.runAction(cc.sequence(
                    cc.delayTime(i * STEP),
                    cc.spawn(cc.moveTo(FLY, cc.v2(fx, fy)), cc.fadeTo(FLY, fop))
                ));
                var end = i * STEP + FLY;
                if (end > maxEnd) { maxEnd = end; }
            }
        };
        // 自己手牌:从左到右依次飞出
        var myCards = [];
        var myParent = null;
        for (var i = 0; i < this._handSlots.length; ++i) {
            var hs = this._handSlots[i];
            if (hs && hs.active && hs._cardId != null) {
                myCards.push(hs);
                myParent = hs.parent;
            }
        }
        collect(myCards, myParent, function (a, b) { return a.x - b.x; });
        // 对家牌背
        for (var r = 0; r < this._oppSlots.length; ++r) {
            var row = this._oppSlots[r];
            if (!row) continue;
            var oppCards = [];
            var oppParent = null;
            for (var ci = 0; ci < row.length; ++ci) {
                var oc = row[ci];
                if (oc && oc.active) {
                    oppCards.push(oc);
                    oppParent = oc.parent;
                }
            }
            if (oppCards.length > 0) {
                // 按 x 排序(牌背通常横向排列)
                collect(oppCards, oppParent, function (a, b) { return a.x - b.x; });
            }
        }
        if (animNodes.length == 0) { return; }
        this._dealAnimNodes = animNodes;
        this._dealAnimating = true; // 动画期间屏蔽自己手牌触摸
        this._dealAnimUntil = Date.now() + (maxEnd + 0.3) * 1000; // 解锁截止时间(兜底)
        this._dealAnimId = (this._dealAnimId || 0) + 1;
        var animId = this._dealAnimId;
        this.scheduleOnce(function () {
            if (self._dealAnimId == animId) {
                self._dealAnimating = false;
                self._dealAnimNodes = null;
                // 动画结束后再重绘一次确保手牌居中 (出牌可能在动画期间触发)
                if (self._cards && self._cards.length > 0) {
                    self.renderHand();
                }
            }
        }, maxEnd + 0.05);
    },

    // 取消发牌动画并瞬间归位:任何手牌重绘(出牌/过牌/新轮次)到来时调用
    _cancelDealAnim: function () {
        if (!this._dealAnimating) { return; }
        this._dealAnimating = false;
        this._dealAnimId = (this._dealAnimId || 0) + 1;
        var list = this._dealAnimNodes || [];
        for (var i = 0; i < list.length; ++i) {
            var it = list[i];
            if (cc.isValid(it.node)) {
                it.node.stopAllActions();
                // 归位到"最终值"而不是"发牌前值"(最终值来自 renderHand 的居中计算)
                it.node.setPosition(it.fx, it.fy);
                it.node.opacity = it.op;
            }
        }
        this._dealAnimNodes = null;
    },

    onGpStart: function (d) {
        if (!d) return;
        if (d.conf) this._gpConf = d.conf;
        this._refreshTitle();
        // 重置记牌历史(每局开始清空)
        this._playHistory = [];
        this._historyRound = 0;
        this._showHistoryIfEnabled();
        this._renderHistory();
        var nm = cc.vv.gameNetMgr;
        var turn = (d.startSeat != null) ? d.startSeat : ((d.turn != null) ? d.turn : nm.gpTurn);
        this.applyGame(d.myCards, (d.mySeat != null ? d.mySeat : nm.gpMySeat), turn,
            d.freePlay, d.lastPlay, d.seats, d.turnDeadline, true);
    },

    onGpChupai: function (d) {
        if (!d) return;
        this.resetHintState();
        this._lastPlay = {
            seatIndex: d.seatIndex, type: d.type, key: d.key, len: d.len,
            bombLevel: d.bombLevel || 0, pais: (d.pais || []).slice()
        };
        this._freePlay = false;
        this._selected = {};
        this._cards = (cc.vv.gameNetMgr.gpMyCards || []).slice();
        // 记牌: 推入一条
        if (this._isHistoryEnabled()) {
            this._addHistory({
                round: this._historyRound,
                seatIndex: d.seatIndex,
                type: d.type,
                pais: (d.pais || []).slice()
            });
        }
        this.renderSeats();
        this.renderHand();
        this.renderLastPlay();
    },

    onGpTurn: function (d) {
        if (!d) return;
        var nm = cc.vv.gameNetMgr;
        this.resetHintState();
        this._turn = d.turn;
        this._freePlay = !!d.freePlay;
        this._lastPlay = d.lastPlay || null;
        this._deadline = d.turnDeadline || 0;
        this._cards = (nm.gpMyCards || []).slice();
        this.renderSeats();
        this.renderHand();
        this.renderLastPlay();
        this.updateTurnUI();
        this.checkAutoPass();
    },

    onGpPass: function (d) {
        if (!d) return;
        this.resetHintState();
        this.renderSeats();
    },

    onGpNewRound: function (d) {
        if (!d) return;
        this.resetHintState();
        this._turn = d.turn;
        this._freePlay = true;
        this._lastPlay = null;
        this._deadline = d.turnDeadline || 0;
        // 一轮结束,记牌历史加分隔线
        if (this._isHistoryEnabled()) {
            this._historyNextRound();
        }
        this.renderSeats();
        this.renderLastPlay();
        this.updateTurnUI();
    },

    onNewGameBegin: function () {
        if (this._final) this._overRounds = []; //上一场已结束,再开新的一场时清空明细
        this._over = false;
        this._final = false;
        this._selected = {};
        //单局结算弹窗不自动关闭:只由玩家点击右上角关闭按钮收起
        if (this._n.finalSettlePanel) this._n.finalSettlePanel.active = false;
        if (this._n.gameResult) this._n.gameResult.active = false; //新一场开始,收起整场结算
        this._n.prepareInfo.active = false;
        this._n.readyBtn.active = false;
        this._n.handArea.active = true;
        this._n.playArea.active = true;
        if (this._n.settleAgainBtn) {
            var againLb = this._n.settleAgainBtn.getComponent(cc.Label);
            if (againLb) { againLb.enabled = true; againLb.string = "准备"; }
        }
        this.updateActionBtns();
    },

    // ===== 出牌操作 =====
    isMyTurn: function () {
        return !this._over && this._turn == this._mySeat;
    },

    onPlay: function () {
        if (!this.isMyTurn()) {
            this.showTip("还没轮到你出牌");
            return;
        }
        var ids = [];
        for (var id in this._selected) {
            if (this._selected[id]) ids.push(parseInt(id));
        }
        if (ids.length == 0) {
            this.showTip("请先选择要出的牌");
            return;
        }
        this.resetHintState();
        if (cc.vv.audioMgr) cc.vv.audioMgr.playSFX("deal.mp3"); //出牌音效(与发牌同用甩牌声)
        cc.vv.net.send("chupai", ids);
    },

    onPass: function () {
        if (!this.isMyTurn()) return;
        this.resetHintState();
        cc.vv.net.send("guo");
        this._selected = {};
        this.renderHand();
    },

    onSlotTouched: function (slot) {
        // 开局发牌动画播放中,屏蔽手牌触摸,防止误点
        if (this._dealAnimating) {
            if (Date.now() < (this._dealAnimUntil || 0)) { return; }
            this._dealAnimating = false; // 动画解锁回调丢失时按时间戳兜底解锁
        }
        if (!this.isMyTurn() || this._over) return;
        var id = slot._cardId;
        if (id == null) return;
        this._selected[id] = !this._selected[id];
        // 选中的牌上移，未选中归位；出牌按钮出已选中的牌（不显示钩标记）
        slot.y = this._selected[id] ? this._selectUpOffset : 0;
        if (cc.vv.audioMgr) cc.vv.audioMgr.playSFX("select.mp3"); //选牌音效
        this.updateTurnUI(); //选牌/取消选牌后刷新出牌按钮显隐
    },

    // ===== 渲染 =====
    renderAll: function () {
        this.renderHand();
        this.renderLastPlay();
        this.renderSeats();
        this.updateRoundLabel();
        this.updateTurnUI();
    },

    renderHand: function () {
        this._cancelDealAnim(); // 手牌重绘到来即终止发牌动画并归位
        var ids = this._cards.slice();
        var self = this;
        ids.sort(function (a, b) {
            var r = self.rankOf(a) - self.rankOf(b);
            return r != 0 ? r : (self.suitOf(a) - self.suitOf(b));
        });
        // 手牌始终居中: 间距 60px, N 张时从 -(N-1)/2*60 开始
        var N = ids.length;
        var selfDbg = this;
        var dbg = ids.map(function (cid) {
            var fr = selfDbg.frameOf(cid);
            return cid + '=' + (fr ? fr.name : 'NULL');
        });
        console.log('[GP] renderHand N=' + N + ' slots=' + this._handSlots.length + ' 牌=' + dbg.join(' | '));
        for (var i = 0; i < this._handSlots.length; ++i) {
            var slot = this._handSlots[i];
            if (i < N) {
                var id = ids[i];
                slot._cardId = id;
                slot.getComponent(cc.Sprite).spriteFrame = this.frameOf(id);
                slot.active = true;
                slot.x = (i - (N - 1) / 2) * 60;
                slot.y = this._selected[id] ? this._selectUpOffset : 0;
            } else {
                slot._cardId = null;
                slot.active = false;
            }
        }
        if (ids.length == 0) {
            this.setStr(this._n.tipLabel, "");
        }
    },

    // 桌面出牌区: 一组 playSlot 节点，直接填 spriteFrame
    // 被压住/一轮结束时先播放淡出动画，再渲染新牌淡入
    renderLastPlay: function () {
        var lp = this._lastPlay;
        var pais = (lp && lp.pais) ? lp.pais.slice() : [];
        //确保出牌区域可见
        if (this._n.playArea) this._n.playArea.active = true;
        if (this._n.cardsContainer) this._n.cardsContainer.active = true;

        // 防重入: 动画进行中缓存新请求，动画结束后再渲染
        if (this._playAnimBusy) {
            this._pendingRenderPais = pais;
            return;
        }

        // 判断当前桌面是否有牌(任一 playSlot active)
        var hasCurCards = false;
        for (var i = 0; i < this._playSlots.length; ++i) {
            if (this._playSlots[i].active) { hasCurCards = true; break; }
        }

        // 有旧牌 → 先淡出再渲染新牌；没旧牌 → 直接渲染
        if (hasCurCards) {
            this._playAnimBusy = true;
            var self = this;
            var container = this._n.cardsContainer;
            if (container) {
                var origOpacity = 255;
                cc.tween(container)
                    .to(0.07, { opacity: 0 })
                    .call(function () {
                        self._fillPlaySlots(pais);
                        cc.tween(container)
                            .to(0.07, { opacity: origOpacity })
                            .call(function () {
                                self._playAnimBusy = false;
                                // 动画期间有新请求缓存了，继续处理
                                if (self._pendingRenderPais != null) {
                                    var pending = self._pendingRenderPais;
                                    self._pendingRenderPais = null;
                                    self._playAnimBusy = false;
                                    self._lastPlay = { pais: pending };
                                    self.renderLastPlay();
                                }
                            })
                            .start();
                    })
                    .start();
            } else {
                self._fillPlaySlots(pais);
                self._playAnimBusy = false;
            }
        } else {
            this._fillPlaySlots(pais);
        }
    },

    // 直接往 playSlots 填牌面（无动画版）
    _fillPlaySlots: function (pais) {
        var self0 = this;
        var dbgFrames = [];
        for (var d = 0; d < (pais || []).length; ++d) {
            var f0 = self0.frameOf(pais[d]);
            dbgFrames.push(pais[d] + ':' + (f0 ? f0.name : 'NULL'));
        }
        console.log('[GP] fillPlaySlots slots=' + this._playSlots.length + ' 牌=' + JSON.stringify(pais) + ' 帧=' + JSON.stringify(dbgFrames));
        for (var i = 0; i < this._playSlots.length; ++i) {
            var slot = this._playSlots[i];
            if (i < pais.length) {
                var sp = this.frameOf(pais[i]);
                slot.getComponent(cc.Sprite).spriteFrame = sp;
                slot.active = true;
            } else {
                slot.active = false;
            }
        }
        this.setStr(this._n.playOwnerLabel, "");
    },

    seatName: function (idx, seats) {
        var list = seats || (cc.vv.gameNetMgr ? cc.vv.gameNetMgr.seats : null);
        if (list && list[idx]) {
            var s = list[idx];
            if (s.name) return s.name;
            if (s.userid == cc.vv.userMgr.userId) return cc.vv.userMgr.userName || "我";
        }
        if (idx == this._mySeat) return "我";
        return "玩家" + (idx + 1);
    },

    renderSeats: function () {
        this._cancelDealAnim(); // 座位/对家牌背重绘到来即终止发牌动画并归位
        var nm = cc.vv.gameNetMgr;
        var gpSeats = nm.gpSeats;
        var roomSeats = nm.seats;
        var playing = (nm.gamestate == "begin") && gpSeats && gpSeats.length > 0;

        // 构建显示索引→座位索引的映射:
        // seatInfo0(下方)=自己, seatInfo1/2(上方)=对家,不管实际seat index是多少
        var mySeatIdx = (playing && gpSeats) ? (this._mySeat != null ? this._mySeat : nm.gpMySeat) : nm.seatIndex;
        if (mySeatIdx == null || mySeatIdx < 0) mySeatIdx = 0;
        var map = [];
        var used = {};
        map.push(mySeatIdx);
        used[mySeatIdx] = true;
        var seatCount = playing ? (gpSeats ? gpSeats.length : 0) : (roomSeats ? roomSeats.length : 0);
        if (seatCount <= 0) seatCount = this.maxPlayers || 2;
        for (var si = 0; si < seatCount && map.length < 3; ++si) {
            if (!used[si]) { map.push(si); used[si] = true; }
        }
        this._seatMap = map;

        for (var i = 0; i < this._seatViews.length; ++i) {
            var v = this._seatViews[i];
            if (!v || !v.root) continue;
            var seatIdx = (i < map.length) ? map[i] : i;
            if (seatIdx >= seatCount) {
                v.root.active = false;
                continue;
            }
            v.root.active = true;
            var isMine = (seatIdx == mySeatIdx);
            var name = "";
            var score = 0;
            var countText = "";
            var state = "";
            if (playing) {
                var gs = gpSeats[seatIdx];
                if (gs) {
                    name = gs.name || (isMine ? "我" : "玩家" + (seatIdx + 1));
                    score = gs.score || 0;
                    countText = "剩" + (gs.count || 0) + "张";
                    if (gs.count == 0) state = "已出完";
                    else if (gs.passed) state = "不要";
                    else if (seatIdx == this._turn && !this._over) state = "出牌中";
                }
            } else {
                var rs = roomSeats ? roomSeats[seatIdx] : null;
                if (rs && rs.userid > 0) {
                    name = rs.name || (isMine ? "我" : "玩家" + (seatIdx + 1));
                    score = rs.score || 0;
                    countText = rs.ready ? "已准备" : "未准备";
                    state = isMine ? "我" : "";
                } else {
                    name = "等待玩家";
                    countText = "";
                }
            }
            //昵称行只放昵称;原剩余牌数位置只显示总积分;剩余牌数放到头像框下方
            var hasUser = name !== "等待玩家";
            if (v.name) this.setStr(v.name, name);
            if (v.count) this.setStr(v.count, hasUser ? ("" + score) : "");
            if (v.remain) this.setStr(v.remain, countText);
            if (v.state) {
                this.setStr(v.state, state);
                v.state.color = (seatIdx == this._turn && playing && !this._over) ? cc.color(255, 230, 90) : cc.color(200, 200, 200);
            }
        }
        this.renderOppHands(gpSeats, playing);
        this.updateTurnUI();
    },

    // 渲染对家手牌（牌背，按剩余张数显隐）
    renderOppHands: function (gpSeats, playing) {
        var nm = cc.vv.gameNetMgr;
        var seats = gpSeats || (nm ? nm.gpSeats : null);
        var map = this._seatMap || [];
        for (var di = 1; di < this.maxPlayers; ++di) {
            var row = this._oppSlots[di - 1];
            if (!row) continue;
            var seatIdx = (di < map.length) ? map[di] : di;
            var count = (playing && seats && seats[seatIdx]) ? (seats[seatIdx].count || 0) : 0;
            for (var ci = 0; ci < row.length; ++ci) {
                row[ci].active = ci < count;
            }
        }
    },

    // 清掉牌节点上的 spriteFrame(与麻将 initView 的 sprite.spriteFrame=null 完全一致):
    // 只关 active 不够,节点一旦被重新激活,场景里预置的牌面会立刻显形
    _blankSprite: function (node) {
        if (node == null) return;
        var sp = node.getComponent(cc.Sprite);
        if (sp) sp.spriteFrame = null;
    },

    // 清空全部牌面显示(手牌/出牌区/对家牌背/倒计时)。准备阶段与场景重载必须调用,
    // 否则上一局残留在场景里的牌节点会直接显示,出现"一进房间全是牌"
    _clearBoard: function () {
        this._cards = [];
        this._lastPlay = null;
        this._selected = {};
        var i;
        var handSlots = this._handSlots || [];
        for (i = 0; i < handSlots.length; ++i) {
            handSlots[i]._cardId = null;
            this._blankSprite(handSlots[i]);
            handSlots[i].active = false;
        }
        var playSlots = this._playSlots || [];
        for (i = 0; i < playSlots.length; ++i) {
            this._blankSprite(playSlots[i]);
            playSlots[i].active = false;
        }
        var oppSlots = this._oppSlots || [];
        for (i = 0; i < oppSlots.length; ++i) {
            var row = oppSlots[i];
            for (var c = 0; c < row.length; ++c) {
                //对家牌背只用显隐控制,不能清 spriteFrame(清掉后重新激活就是空白,牌背消失)
                row[c].active = false;
            }
        }
        if (this._n.handArea) this._n.handArea.active = false;
        if (this._n.playArea) this._n.playArea.active = false;
        if (this._n.cardsContainer) this._n.cardsContainer.active = false;
        if (this._n.countdownLabel) this.setStr(this._n.countdownLabel, "");
        if (this._n.playOwnerLabel) this.setStr(this._n.playOwnerLabel, "");
        if (this._n.tipLabel) this.setStr(this._n.tipLabel, "");
    },

    updateTurnUI: function () {
        if (this._n.playBtn == null) return;
        var ops = this.findNode(this.node, "ops");
        var arrowNode = this.findNode(this.node, "arrow");
        //准备阶段(未开局):renderSeats 末尾也会调到这里,必须保持对局UI隐藏,否则一进房就亮出牌按钮/提示
        if (!cc.vv.gameNetMgr || cc.vv.gameNetMgr.gamestate != "begin") {
            if (ops) ops.active = false;
            if (arrowNode) arrowNode.active = false;
            this._n.playBtn.active = false;
            this._n.passBtn.active = false;
            if (this._n.hintBtn) this._n.hintBtn.active = false;
            this.setStr(this._n.tipLabel, "");
            this.setStr(this._n.playOwnerLabel, "");
            return;
        }
        // 开局后 ops/arrow/tipLabel 全显示(准备阶段已被 initView 隐藏)
        if (ops) {
            ops.active = true;
            ops.opacity = 255;
        }
        if (arrowNode) arrowNode.active = true;
        var myTurn = this.isMyTurn();
        console.log('[GP] updateTurnUI turn=', this._turn, 'mySeat=', this._mySeat, 'myTurn=', myTurn, 'freePlay=', this._freePlay);
        // 三个按钮始终显示(轮到自己时),出牌按钮没选牌则置灰
        var hasSel = false;
        for (var k in this._selected) { if (this._selected[k]) { hasSel = true; break; } }
        // 出牌:轮到自己就显示,没选牌时灰色 disabled
        this._n.playBtn.active = myTurn;
        this._n.playBtn.opacity = 255;
        this._n.playBtn.zIndex = 999; // 确保不被遮挡
        this.setBtnEnabled(this._n.playBtn, hasSel);
        // 过:轮到自己且非自由出牌时显示
        this._n.passBtn.active = myTurn && !this._freePlay;
        if (this._n.passBtn) { this._n.passBtn.opacity = 255; this._n.passBtn.zIndex = 999; }
        // 提示:轮到自己就显示(非自由出牌时才有用,自由出牌时也显示但置灰)
        if (this._n.hintBtn) {
            this._n.hintBtn.opacity = 255;
            this._n.hintBtn.zIndex = 999;
            var showHint = myTurn && !this._freePlay && this._lastPlay;
            if (showHint) {
                var combos = this._playableCombos;
                if (!combos) combos = this.collectPlayableCombos();
                this.setBtnEnabled(this._n.hintBtn, combos.length > 0);
            } else {
                this.setBtnEnabled(this._n.hintBtn, false);
            }
            this._n.hintBtn.active = myTurn;
        }
        // 牌桌中间方位箭头：指向当前出牌者
        this.updateArrowPointer();
        if (myTurn) {
            this.setStr(this._n.tipLabel, this._freePlay ? "请出牌" : "请出牌");
        } else if (!this._over && this._turn >= 0) {
            this.setStr(this._n.tipLabel, "上家出牌中…");
        }
    },

    // 设置按钮 enabled/disabled(灰色半透明)
    setBtnEnabled: function (btn, enabled) {
        if (!btn) return;
        var sprite = btn.getComponent(cc.Sprite);
        var labelNode = btn.getChildByName("settleAgainBtnLabel") || btn.getChildByName("lblTip") || null;
        // 找第一个 Label
        if (!labelNode) {
            for (var i = 0; i < btn.children.length; ++i) {
                if (btn.children[i].getComponent(cc.Label)) { labelNode = btn.children[i]; break; }
            }
        }
        if (enabled) {
            btn.opacity = 255;
            btn.interactable = true;
            if (labelNode) {
                var lb = labelNode.getComponent(cc.Label);
                if (lb) lb.color = cc.color(255, 255, 255);
            }
        } else {
            btn.opacity = 130;
            btn.interactable = false;
            if (labelNode) {
                var lb2 = labelNode.getComponent(cc.Label);
                if (lb2) lb2.color = cc.color(200, 200, 200);
            }
        }
    },

    // pointer 子节点位置固定: 0=下(自家) 1=右 2=上(对家) 3=左
    // 用 _seatMap 把实际 turn 座位索引转成显示位置: 0=下, 1=上/右, 2=左
    updateArrowPointer: function () {
        if (!this._n.arrowPointer) return;
        var show = !this._over && this._turn >= 0;
        if (this._n.arrow) this._n.arrow.active = show;
        if (!show) return;
        var map = this._seatMap || [];
        var displayIdx = 0;
        for (var i = 0; i < map.length; ++i) {
            if (map[i] === this._turn) { displayIdx = i; break; }
        }
        var childIdx;
        if (this.maxPlayers >= 3) {
            childIdx = (displayIdx === 0) ? 0 : (displayIdx === 1 ? 1 : 3);
        } else {
            childIdx = (displayIdx === 0) ? 0 : 2;
        }
        var ch = this._n.arrowPointer.children;
        for (var i = 0; i < ch.length; ++i) {
            ch[i].active = (i === childIdx);
        }
    },

    setArrowTime: function (txt) {
        if (this._n.arrowTime) this.setStr(this._n.arrowTime, txt);
    },

    updateRoundLabel: function () {
        var nm = cc.vv.gameNetMgr;
        if (this._n.roundLabel == null) return;
        var cur = nm.numOfGames || 0;
        var max = nm.maxNumOfGames || 0;
        this.setStr(this._n.roundLabel, max > 0 ? ("第" + cur + "/" + max + "局") : "");
    },

    update: function () {
        if (this._over || this._deadline <= 0) {
            this.setArrowTime("");
            if (this._n.countdownLabel) this.setStr(this._n.countdownLabel, "");
            return;
        }
        var remain = Math.ceil((this._deadline - Date.now()) / 1000);
        if (remain < 0) remain = 0;
        var s = String(remain);
        if (s.length < 2) s = "0" + s;
        this.setArrowTime(s);
        this.setStr(this._n.countdownLabel, String(remain)); //倒计时只显示秒数
    },

    showTip: function (msg) {
        if (this._n.tipLabel == null) return;
        this.setStr(this._n.tipLabel, msg || "");
        this._lastTip = msg || "";
    },

    setLabel: function (node, text) {
        if (node == null) return;
        var lb = node.getComponent(cc.Label);
        if (lb) lb.string = text;
    },

    // 节点上取 Label 组件再设文字，禁止直接对节点 .string 赋值（静默无效）
    setStr: function (node, text) {
        if (node == null) return;
        var lb = node.getComponent(cc.Label);
        if (lb) lb.string = text || "";
    },

    // 结算文字专用：设文字并强制黑色（Label 渲染用节点颜色，组件 _N$color 也一并覆盖，
    // 避免场景里残留的白色/编辑器缓存导致结算内容还是白字）
    setBlackStr: function (node, text) {
        if (node == null) return;
        node.color = cc.color(0, 0, 0, 255);
        var lb = node.getComponent(cc.Label);
        if (!lb) return;
        lb.string = text || "";
        if (lb._N$color) lb._N$color = cc.color(0, 0, 0, 255);
        if (lb.setColor) lb.setColor(cc.color(0, 0, 0, 255));
    },

    // ===== 准备流程 =====
    showPrepare: function () {
        this.restoreSettleBg();
        //准备界面必须干净:手牌/对家牌背/出牌区/倒计时一律清空(准备层与对局层互斥)
        this._clearBoard();
        this._n.readyBtn.active = true;
        this._n.prepareInfo.active = false;
        this._n.handArea.active = false;
        this._n.playArea.active = false;
        this._n.playBtn.active = false;
        this._n.passBtn.active = false;
        if (this._n.hintBtn) this._n.hintBtn.active = false;
        this.setStr(this._n.countdownLabel, "");
        this.setStr(this._n.tipLabel, "等待所有玩家准备后开始");
        if (this._n.historyBtn) this._n.historyBtn.active = false;
        if (this._n.historyPanel) this._n.historyPanel.active = false;
        this.updateActionBtns();
    },

    onReady: function () {
        cc.vv.net.send("ready");
        this._n.readyBtn.active = false;
        this._n.prepareInfo.active = true;
        this.setLabel(this._n.prepareInfo, "已准备，等待其他玩家…");
        this.setStr(this._n.tipLabel, "已准备，等待其他玩家…");
        this.updateActionBtns();
    },

    onUserReady: function (d) {
        if (!d) return;
        this.renderSeats();
        if (d.userid == cc.vv.userMgr.userId) {
            this._n.readyBtn.active = false;
            this._n.prepareInfo.active = true;
            this.setLabel(this._n.prepareInfo, "已准备，等待其他玩家…");
        }
        this.updateActionBtns();
    },

    onSettleAgain: function () {
        if (this._final) {
            cc.vv.net.send("exit");
            return;
        }
        this._n.settlePanel.active = false;
        this._n.readyBtn.active = false;
        this._n.prepareInfo.active = true;
        this.setLabel(this._n.prepareInfo, "已准备，等待其他玩家…");
        this.restoreSettleBg(); // 结算时 prepare 被整体隐藏,收起结算后必须恢复,否则退出/解散按钮永久消失
        this._over = false;
        this.updateActionBtns();
        cc.vv.net.send("ready");
    },

    //单局结算关闭:收起弹窗后才向服务端准备,开始下一局
    onSettleClose: function () {
        if (this._n.settlePanel) this._n.settlePanel.active = false;
        if (this._final) return;
        this.setStr(this._n.tipLabel, "等待其他玩家准备…");
        this.restoreSettleBg();
        this._over = false;
        this.updateActionBtns();
        cc.vv.net.send("ready");
    },

    // ===== 结算 =====
    // 单局结算用 settlePanel(带"准备下一局");整场结束用独立的 finalSettlePanel(只带"退出房间")
    onGameOver: function (results) {
        if (!results) return;
        var nm = cc.vv.gameNetMgr;
        this._over = true;
        this.updateActionBtns();
        this.resetHintState();
        // 结算后隐藏出牌相关UI
        var ops = this.findNode(this.node, "ops");
        if (ops) ops.active = false;
        this.hideSettleBg(); // 隐藏结算弹窗后面的残留元素(准备层/顶部信息条/消息条/右上按钮)
        this._n.playBtn.active = false;
        this._n.passBtn.active = false;
        if (this._n.hintBtn) this._n.hintBtn.active = false;
        if (this._n.arrow) this._n.arrow.active = false;
        this.setStr(this._n.tipLabel, "");
        this.setStr(this._n.countdownLabel, "");
        //结算输赢音效(按本人本局分数)
        var myDelta = 0;
        for (var wi = 0; wi < results.length; ++wi) {
            if (results[wi].seatindex == cc.vv.gameNetMgr.seatIndex) { myDelta = results[wi].delta || 0; break; }
        }
        if (cc.vv.audioMgr) {
            if (myDelta > 0) cc.vv.audioMgr.playSFX("win.mp3");
            else if (myDelta < 0) cc.vv.audioMgr.playSFX("lose.mp3");
        }
        // reset() 在 game_over 事件分发后才执行（gamestate 置空、ready 清零），
        // 延迟一拍刷新退出/解散按钮显隐
        var self = this;
        setTimeout(function () { self.updateActionBtns(); }, 0);
        var lines = [];
        var totals = [];
        for (var i = 0; i < results.length; ++i) {
            var r = results[i];
            var name = r.name || ("玩家" + (r.seatindex + 1));
            var line = name + "：";
            if (r.isWinner) {
                line += "出完手牌  赢 +" + r.delta + "分";
            } else {
                line += "剩" + r.remain + "张";
                if (r.allClosed) line += "（全关×2）";
                line += "  " + r.delta + "分";
            }
            lines.push(line);
            totals.push(name + " " + (r.totalscore != null ? r.totalscore : r.score));
        }
        lines.push("");
        lines.push("总分：" + totals.join("   "));
        //累积本场每局明细:整场结算面板用(服务端 game_end 也会下发 roundHistory,这里做兜底)
        this._overRounds = this._overRounds || [];
        var roundScores = [];
        for (var ri = 0; ri < results.length; ++ri) {
            var rr = results[ri];
            roundScores.push({ name: rr.name || ("玩家" + (rr.seatindex + 1)), score: rr.delta || 0 });
        }
        this._overRounds.push({ index: nm.numOfGames, scores: roundScores });
        //一局打完发现总局数已满:直接弹整场结算弹窗,不再显示"准备下一局"
        if (nm.maxNumOfGames > 0 && nm.numOfGames >= nm.maxNumOfGames) {
            this.onGameEnd({ roundHistory: this._overRounds });
            return;
        }
        this.setBlackStr(this._n.settleTitle, "本局结算");
        this.setBlackStr(this._n.settleContent, lines.join("\n"));
        //结算弹窗保留"准备下一局"按钮:玩家点它(或右上角关闭)后才准备下一局
        if (this._n.settleAgainBtn) this._n.settleAgainBtn.active = true;
        if (this._n.settleExitBtn) this._n.settleExitBtn.active = false;
        if (this._n.finalSettlePanel) this._n.finalSettlePanel.active = false;
        this._n.settlePanel.active = true;
        if (this._n.settleNewBtn) this._n.settleNewBtn.active = true; //关闭按钮必须可见
        this.setStr(this._n.tipLabel, "本局结束");
    },

    // 整场结束:关闭单局弹窗,弹出独立的整场结算弹窗(仅"退出房间",不含"准备下一局")
    onGameEnd: function (d) {
        this._final = true;
        var nm = cc.vv.gameNetMgr;
        var totals = [];
        var seats = nm.seats || [];
        for (var k = 0; k < seats.length; ++k) {
            var sd = seats[k];
            if (sd && sd.userid > 0) totals.push((sd.name || "玩家") + " " + (sd.score > 0 ? "+" + sd.score : sd.score));
        }
        // 最终总分放最前,其后是逐局明细
        var lines = ["最终总分：" + totals.join("   ")];
        var history = (d && d.roundHistory && d.roundHistory.length) ? d.roundHistory : (this._overRounds || []);
        if (history.length) lines.push("");
        for (var i = 0; i < history.length; ++i) {
            var h = history[i] || {};
            var parts = [];
            var scores = h.scores || [];
            for (var j = 0; j < scores.length; ++j) {
                var s = scores[j] || {};
                parts.push((s.name || "玩家") + " " + (s.score > 0 ? "+" + s.score : s.score));
            }
            lines.push("第" + (h.index || (i + 1)) + "局  " + parts.join("   "));
        }
        var content = lines.join("\n");
        //整场结算用场景自带的 game_result 弹窗(内容按数据生成),不再新增面板节点
        if (this._showFinalResult(lines)) {
            if (this._n.settlePanel) this._n.settlePanel.active = false;
            if (this._n.finalSettlePanel) this._n.finalSettlePanel.active = false;
            this.setStr(this._n.tipLabel, "整场结束");
            return;
        }
        if (this._n.finalSettlePanel == null) {
            //兜底:场景里没有独立弹窗时复用单局弹窗,只保留"退出房间",内容同样写整场结算
            if (this._n.settleAgainBtn) this._n.settleAgainBtn.active = false;
            if (this._n.settleCloseBtn) this._n.settleCloseBtn.active = false; //整场结算不收关闭按钮,避免关掉后无退出入口
            if (this._n.settleExitBtn) {
                this._n.settleExitBtn.active = true;
                this._n.settleExitBtn.x = 0;
                if (this._n.settleAgainBtn) this._n.settleExitBtn.y = this._n.settleAgainBtn.y;
            }
            this.setBlackStr(this._n.settleTitle, "整场结算");
            this._fitSettleFont(this._n.settleContent, lines);
            this.setBlackStr(this._n.settleContent, content);
            this._n.settlePanel.active = true;
            this.setStr(this._n.tipLabel, "整场结束");
            return;
        }
        this._n.settlePanel.active = false;
        this.setBlackStr(this._n.finalSettleTitle, "整场结算");
        this._fitSettleFont(this._n.finalSettleContent, lines);
        this.setBlackStr(this._n.finalSettleContent, content);
        this._n.finalSettlePanel.active = true;
        this.setStr(this._n.tipLabel, "整场结束");
    },

    // 整场结算:写入场景自带的 game_result 弹窗(内容按行数据生成,黑字居中),返回是否可用
    _showFinalResult: function (lines) {
        var root = this._n.gameResult;
        if (root == null) return false;
        var old = root.getChildByName("resultList");
        if (old) old.destroy();
        var maxW = 0;
        for (var i = 0; i < lines.length; ++i) {
            var w = 0, str = lines[i] || "";
            for (var j = 0; j < str.length; ++j) { w += str.charCodeAt(j) > 255 ? 2 : 1; }
            if (w > maxW) maxW = w;
        }
        //同时受面板宽(860)和高(480)限制,避免局数多时超出底图
        var fs = maxW > 0 ? Math.floor(860 / maxW) : 30;
        var byH = Math.floor(480 / Math.max(1, lines.length) / 1.3);
        if (fs > byH) fs = byH;
        if (fs > 30) fs = 30;
        if (fs < 14) fs = 14;
        var node = new cc.Node("resultList");
        var lb = node.addComponent(cc.Label);
        lb.string = lines.join("\n");
        lb.fontSize = fs;
        lb.lineHeight = fs + 10;
        lb.enableWrapText = false;
        lb.overflow = cc.Label.Overflow.NONE;
        lb.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
        lb.verticalAlign = cc.Label.VerticalAlign.CENTER;
        node.color = cc.color(0, 0, 0, 255);
        node.setPosition(0, 20);
        root.addChild(node);
        root.active = true;
        return true;
    },

    // 结算内容按最长行自动缩字号,避免整场明细超出弹窗
    _fitSettleFont: function (node, lines) {
        if (node == null) return;
        var lb = node.getComponent(cc.Label);
        if (!lb) return;
        var maxW = 0;
        for (var i = 0; i < lines.length; ++i) {
            var w = 0, str = lines[i] || "";
            for (var j = 0; j < str.length; ++j) { w += str.charCodeAt(j) > 255 ? 2 : 1; }
            if (w > maxW) maxW = w;
        }
        var width = node.width > 0 ? node.width : (node.parent ? node.parent.width * 0.9 : 630);
        var fs = maxW > 0 ? Math.floor(width / maxW) : 32;
        if (fs > 32) fs = 32;
        if (fs < 14) fs = 14;
        lb.fontSize = fs;
        lb.lineHeight = fs + 4;
    },

    // ===== 设置/聊天/语音 =====
    onBtnSettings: function () {
        if (this._n.settingsPanel) this._n.settingsPanel.active = !this._n.settingsPanel.active;
    },

    onBtnChat: function () {
        if (this._n.chatPanel) this._n.chatPanel.active = !this._n.chatPanel.active;
    },

    onBtnVoice: function () {
        this.showTip("语音功能开发中");
    },

    // 设置面板：关闭
    onBtnSettingsClose: function () {
        if (this._n.settingsPanel) this._n.settingsPanel.active = false;
    },

    // 设置面板：申请解散房间(与麻将一致,不区分房主)
    onBtnSettingsDissolve: function () {
        if (this._n.settingsPanel) this._n.settingsPanel.active = false;
        var nm = cc.vv.gameNetMgr;
        if (nm.gamestate == "begin") {
            cc.vv.net.send("dissolve_request");
            this.showTip("已发起解散申请，等待其他玩家同意");
        } else {
            cc.vv.net.send("dispress");
        }
    },

    // 聊天面板：发送文字
    onBtnChatSend: function () {
        if (!this._n.iptChat) return;
        var eb = this._n.iptChat.getComponent(cc.EditBox);
        var txt = eb ? (eb.string || "") : "";
        if (txt == "") return;
        cc.vv.net.send("chat", txt);
        if (eb) eb.string = "";
        if (this._n.chatPanel) this._n.chatPanel.active = false;
    },

    // 聊天面板：切换到快捷语
    onTabQuick: function () {
        if (this._n.quickchatlist) this._n.quickchatlist.active = true;
        if (this._n.emojis) this._n.emojis.active = false;
    },

    // 聊天面板：切换到表情
    onTabEmoji: function () {
        if (this._n.quickchatlist) this._n.quickchatlist.active = false;
        if (this._n.emojis) this._n.emojis.active = true;
    },

    // 聊天面板：点击背景关闭
    onBtnChatClose: function () {
        if (this._n.chatPanel) this._n.chatPanel.active = false;
    },

    // 结算时隐藏弹窗后面残留的元素：准备层(准备/退出/解散)、顶部信息条、消息条、右上按钮
    hideSettleBg: function () {
        this._settleHidden = [];
        var names = ["prepare", "infobar", "msg_set_bg"];
        for (var i = 0; i < names.length; ++i) {
            var n = this.findNode(this.node, names[i]);
            if (n && n.active) {
                n.active = false;
                this._settleHidden.push(n);
            }
        }
        var btns = [this._n.btnSettings, this._n.btnChat, this._n.btnVoice];
        for (var k = 0; k < btns.length; ++k) {
            if (btns[k]) btns[k].active = false;
        }
        if (this._n.prepareInfo) this._n.prepareInfo.active = false;
    },

    // 新一局/回到准备页时恢复被结算隐藏的元素
    restoreSettleBg: function () {
        var list = this._settleHidden || [];
        for (var i = 0; i < list.length; ++i) list[i].active = true;
        this._settleHidden = [];
    },

    // 退出/解散按钮显隐(与麻将原版 MJRoom.refreshBtns 完全对齐)
    // isIdle=未开局; isReady=本人已准备; isCreator=房主
    // 未准备→所有人都显示"退出"; 已准备→房主显示"解散",非房主显示"退出"; 开局中→两个都隐藏
    updateActionBtns: function () {
        var nm = cc.vv.gameNetMgr;
        //未开局(含局间等待准备):只要不在出牌中、整场未结束,就显示退出/解散
        //原逻辑要求 numOfGames==0 且非结算中,导致第一局结束后(局间等待)退出/解散永久消失,用户无法离开
        var isIdle = nm.gamestate != "begin" && !this._final;
        var selfSeat = nm.seats ? nm.seats[nm.seatIndex] : null;
        var isReady = !!(selfSeat && selfSeat.ready);
        if (isIdle) {
            //与麻将 refreshBtns 一致:未准备→只显示退出;已准备→收起退出、显示解散(不区分房主)
            if (this._n.exitBtn) this._n.exitBtn.active = !isReady;
            if (this._n.dissolveBtn) this._n.dissolveBtn.active = isReady;
        } else {
            // 开局中:两个都隐藏
            if (this._n.exitBtn) this._n.exitBtn.active = false;
            if (this._n.dissolveBtn) this._n.dissolveBtn.active = false;
        }
        // 结算中/整场结束:右上设置、聊天、语音按钮及弹出的面板全部隐藏
        var showTop = !this._over && !this._final;
        if (this._n.btnSettings) this._n.btnSettings.active = showTop;
        if (this._n.btnChat) this._n.btnChat.active = showTop;
        if (this._n.btnVoice) this._n.btnVoice.active = showTop;
        if (!showTop) {
            if (this._n.settingsPanel) this._n.settingsPanel.active = false;
            if (this._n.chatPanel) this._n.chatPanel.active = false;
        }
    },

    // ===== 退出/解散 =====
    onExit: function () {
        var self = this;
        var doSend = function () {
            //整场结算完成:先关闭整场结算弹窗,再按"整场已打完"走释放式退出
            //(不能用 exit:服务端在对局中会当成断线保留座位,回来还弹同一个结算窗)
            if (self._final) {
                if (self._n.gameResult) self._n.gameResult.active = false;
                if (self._n.finalSettlePanel) self._n.finalSettlePanel.active = false;
                if (self._n.settlePanel) self._n.settlePanel.active = false;
                cc.vv.net.send("leave_room");
                //兜底:socket已断开/服务端未回包时本地直接离场,避免弹窗关掉后卡在空白牌桌
                setTimeout(function () { if (!self._leaving) self.leaveRoom(); }, 800);
                return;
            }
            cc.vv.net.send("exit");
            //与麻将 doExitRoom 一致:2秒内没收到 exit_result(服务端未回/回包丢失)则强制离开,防止点了没反应
            setTimeout(function () {
                if (cc.isValid(self.node) && !self._leaving && cc.vv.gameNetMgr.roomId != null) {
                    cc.vv.gameNetMgr.clearRoomState && cc.vv.gameNetMgr.clearRoomState();
                    self.leaveRoom();
                }
            }, 2000);
        };
        if (!this._final && cc.vv.alert && cc.vv.alert.show) {
            cc.vv.alert.show(null, "是否确定退出房间？", doSend, true);
        } else {
            doSend();
        }
    },

    onDissolve: function () {
        var self = this;
        var doSend = function () {
            if (cc.vv.gameNetMgr.gamestate == "begin") {
                cc.vv.net.send("dissolve_request");
                self.showTip("已发起解散申请，等待其他玩家同意");
            } else {
                cc.vv.net.send("dispress");
            }
        };
        if (cc.vv.alert && cc.vv.alert.show) {
            cc.vv.alert.show(null, "解散房间不扣房卡，是否确定解散？", doSend, true);
        } else {
            doSend();
        }
    },

    onDissolveNotice: function (d) {
        if (this._n.dissolvePanel == null) return;
        this._n.dissolvePanel.active = true;
        if (this._n.dissolveLabel) this.setStr(this._n.dissolveLabel, "有玩家申请解散房间，是否同意？");
    },

    onDissolveAgree: function () {
        cc.vv.net.send("dissolve_agree");
        this._n.dissolvePanel.active = false;
    },

    onDissolveReject: function () {
        cc.vv.net.send("dissolve_reject");
        this._n.dissolvePanel.active = false;
    }
});
