// 浙江诸暨麻将 - 自选财神(2人)游戏主脚本：克隆自MJGameZP，改为发牌不定财神、玩家可胡牌时自选 无财/单财/双财
cc.Class({
    extends: cc.Component,

    properties: {
        gameRoot:{
            default:null,
            type:cc.Node
        },
        prepareRoot:{
            default:null,
            type:cc.Node
        },

        _myMJArr:[],  //自己麻将手牌
        _options:null,  //操作选择
        _selectedMJ:null,
        _chupaiSprite:[], //出牌数组
        _mjcount:null,
        _gamecount:null,
        _hupaiTips:[],
        _hupaiLists:[],
        _playEfxs:[],
        _opts:[], //胡牌自摸数组
        _chiPanel:null, //吃牌组合选择面板
        _chiSelect:null, //吃牌手牌二选状态 {pai,tiles:[]}
        _chiHint:null, //吃牌选牌提示Label节点
        _huaAreas:[], //各座位花牌区(按本机localIndex)
        _youjinLabels:[], //各座位游金等级Label(按本机localIndex)
        _youjinPanel:null, //游金选牌面板
        _dealAnimating:false, //开局发牌动画播放中(期间屏蔽自己手牌触摸)
        _dealAnimNodes:null,  //发牌动画节点最终状态备份(取消时瞬间归位用)
        _dealAnimId:0,        //发牌动画令牌(防止过期的结束回调误清状态)
        _pendingPlans:null,   //自选财神待选方案
        _caishenPlanPanel:null, //自选财神选择面板节点
        // 出牌倒计时显示(绑定场景内已固化的 countdownLabel 节点,位置在编辑器里手动调整)
        _countdownLabel:null,
        _countdownId:null,
        _countdownSec:0,
    },

    onLoad: function () {
        try {
        var cvs = this.node.getComponent(cc.Canvas);
        if(cvs == null){
            //场景内存在误挂本脚本的游离节点(无Canvas组件),跳过初始化,避免整场景激活报错
            return;
        }
        if(!cc.sys.isNative){
            cvs.fitHeight = true;
            cvs.fitWidth = false;
            //相机清屏色用牌桌边缘深棕色:即使有亚像素缝隙也露深色不露白
            var cams = cc.director.getScene().getComponentsInChildren(cc.Camera);
            for(var ci = 0; ci < cams.length; ci++){
                cams[ci].clearFlags = cc.Camera.ClearFlags.COLOR;
                cams[ci].backgroundColor = cc.color(30, 18, 12);
            }
            //背景图完全由场景文件控制,代码不再动态拉伸/替换
        }
        if(!cc.vv){
            cc.director.loadScene("loading");
            return;
        }
        //加载以下脚本（漳浦玩法无定缺/换三张）;组件已固化到场景,存在则跳过避免重复挂载
        var deps = ["NoticeTip","GameOver","PengGangs","MJRoom","TimePointer","GameResult","Chat","Folds","ReplayCtrl","PopupMgr","ReConnect","Voice","UserInfoShow"];
        for(var di = 0; di < deps.length; ++di){
            if(this.getComponent(deps[di]) == null){
                this.addComponent(deps[di]);
            }
        }
        this.initView();
        this.initEventHandlers();

        this.gameRoot.active = false;
        this.prepareRoot.active = true;
        this.initWanfaLabel();
        this.onGameBeign();
        this.initCaishenTip(); //场景加载时若已开局(错过game_start事件)也补绘金牌
        this.initCaishenPlanPanel(); //自选财神选择面板初始化
        // 场景加载前若已收到财神方案推送, 补弹选择窗
        if(cc.vv.gameNetMgr.waitCaishenPlans && cc.vv.gameNetMgr.waitCaishenPlans.length > 0){
            this._pendingPlans = cc.vv.gameNetMgr.waitCaishenPlans;
            cc.vv.gameNetMgr.waitCaishenPlans = null;
            this.showCaishenPlanPanel();
        }
        cc.vv.audioMgr.playBGM("bgFight.mp3");
        } catch(e) {
            console.error('[ZJZX] onLoad CRASH:', e.message);
            console.error(e.stack);
        }
    },

    //初始化
    initView:function(){
        // 强制重置所有状态变量(重进房间/新一局/场景重建时,上一局残留会导致手牌错乱/出牌拦截)
        this._selectedMJ = null;
        this._chiSelect = null;
        this._pendingPlans = null;
        this._opts = [];
        if(this._caishenPlanPanel) this._caishenPlanPanel.active = false;
        if(this._chiHint) this._chiHint.active = false;

        //game节点
        var gameChild = this.node.getChildByName("game");
        //mj剩余数和剩余局数
        this._mjcount = gameChild.getChildByName('mjcount').getComponent(cc.Label);
        this._mjcount.string = "剩余" + cc.vv.gameNetMgr.numOfMJ + "张";
        this._gamecount = gameChild.getChildByName('gamecount').getComponent(cc.Label);
        this._gamecount.string = "" + cc.vv.gameNetMgr.numOfGames + "/" + cc.vv.gameNetMgr.maxNumOfGames + "局";
        // 出牌倒计时显示(绑定场景内已有节点,用户在编辑器里手动摆好位置)
        var infobar = this.node.getChildByName("infobar");
        if(infobar){
            this._countdownLabel = infobar.getChildByName("countdownLabel");
            if(this._countdownLabel && !this._countdownLabel.getComponent(cc.Label)){
                this._countdownLabel.addComponent(cc.Label);
            }
        }
        //剩余牌数放到中间局数的左侧(下一拍等Label宽度更新后再对齐)
        var mjcountNode = this._mjcount.node, gamecountNode = this._gamecount.node;
        this.scheduleOnce(function(){
            if(!cc.isValid(mjcountNode) || !cc.isValid(gamecountNode)){ return; }
            mjcountNode.setPosition(gamecountNode.x - gamecountNode.width/2 - mjcountNode.width/2 - 12, gamecountNode.y);
        }, 0);
        //取到手牌节点
        var myselfChild = gameChild.getChildByName("myself");
        var myholds = myselfChild.getChildByName("holds");

        //手牌数放到myMjarr数组中
        for(var i = 0; i < myholds.children.length; ++i){
            var sprite = myholds.children[i].getComponent(cc.Sprite);
            this._myMJArr.push(sprite);
            sprite.spriteFrame = null;
        }
        //获取真实宽度(2.4无cc.director.getVisibleSize,必须用cc.view)
        var realwidth = cc.view.getVisibleSize().width;
        var mjscale = realwidth/1280;
        if(mjscale < 1){ //仅窄屏时缩放手牌,宽屏保持原始布局防止手牌超出屏幕右缘
            myholds.scaleX *= mjscale;
            myholds.scaleY *= mjscale;
        }
        //加载前后左右(按本机座位取方位:2人玩法对手在上方,4人玩法保持原方位)
        var seatCount = cc.vv.gameNetMgr.seats ? cc.vv.gameNetMgr.seats.length : 2;
        for(var i = 0; i < seatCount; ++i){
            var side = cc.vv.mahjongmgr.getSide(i);
            var sideChild = gameChild.getChildByName(side);
            if(sideChild == null){ continue; }
            this._hupaiTips.push(sideChild.getChildByName("HuPai"));
            this._hupaiLists.push(sideChild.getChildByName("hupailist"));
            this._playEfxs.push(sideChild.getChildByName("play_efx").getComponent(cc.Animation));
            //出牌数组将出牌节点获取进来
            this._chupaiSprite.push(sideChild.getChildByName("ChuPai").children[0].getComponent(cc.Sprite));
            //获取胡后显示节点
            var opt = sideChild.getChildByName("opt");
            opt.active = false;
            var sprite = opt.getChildByName("pai").getComponent(cc.Sprite);
            var data = {
                node:opt,
                sprite:sprite
            };
            this._opts.push(data);
        }
        //获取到ops节点
        var opts = gameChild.getChildByName("ops");
        this._options = opts;
        // 碰/杠/胡/过走场景固化clickEvent绑定;btnChi场景未固化,这里补绑(已绑过则跳过,防止双触发)
        if(opts){
            for(var _i = 0; _i < opts.childrenCount; ++_i){
                var _op = opts.children[_i];
                if(_op.name != "op") continue;
                var _b = _op.getChildByName("btnChi");
                if(_b){
                    var _bc = _b.getComponent(cc.Button);
                    if(_bc && _bc.clickEvents.length == 0){ cc.vv.utils.addClickEvent(_b, this.node, "MJGameZJZX", "onOptionClicked"); }
                }
            }
        }
        //ops下的全屏New Layout挂了无事件Button,操作栏弹出时会吞掉全屏触摸导致吃牌无法选手牌,永久禁用其Button
        //并直接隐藏该遮罩节点(视觉上不再出现全屏暗色遮罩)
        var opsMask = opts ? opts.getChildByName("New Layout") : null;
        if(opsMask){
            var maskBtn = opsMask.getComponent(cc.Button);
            if(maskBtn){ maskBtn.enabled = false; }
            opsMask.active = false;
        }
        this.hideOptions();
        this.hideChupai();
    },

    //隐藏出牌
    hideChupai:function(){
        for(var i = 0; i < this._chupaiSprite.length; ++i){
            this._chupaiSprite[i].node.active = false;
        }
    },

    //事件监听
    initEventHandlers:function(){
        cc.vv.gameNetMgr.dataEventHandler = this.node;
        //重进房间竞态修复:补发牌局状态的game_start_push可能在场景加载完成前到达(dataEventHandler未绑定/指向已销毁旧场景,事件被丢弃),
        //场景就绪后若牌局已在进行(gamestate=begin且有手牌数据),下一拍补发事件恢复牌面/局数/牌墙
        var nm = cc.vv.gameNetMgr;
        if(nm.gamestate == "begin" && nm.seats){
            var hasHolds = false;
            for(var hi = 0; hi < nm.seats.length; ++hi){
                var st = nm.seats[hi];
                if(st && (st.holds instanceof Array) && st.holds.length > 0){ hasHolds = true; break; }
            }
            if(hasHolds){
                var evtNode = this.node;
                var self = this;
                this.scheduleOnce(function(){
                    if(!cc.isValid(evtNode)){ return; }
                    evtNode.emit('game_num',{detail:nm.numOfGames});
                    evtNode.emit('mj_count',{detail:null});
                    evtNode.emit('game_start',{detail:null});
                    //兜底:开局操作(如胡)事件若在监听器绑定前到达被丢弃,此处补发确保胡/碰/杠按钮一定显示
                    if(nm.curaction){
                        var action = nm.curaction;
                        nm.curaction = null;
                        evtNode.emit('game_action',{detail:action});
                    }
                    // 自选财神:补发漏掉的caishen_plans(服务端game_caishen_plans_push可能在场景加载前到达,
                    // dispatchEvent因dataEventHandler未绑定被丢弃,waitCaishenPlans缓存了plans)
                    if(nm.waitCaishenPlans && nm.waitCaishenPlans.length > 0){
                        self._pendingPlans = nm.waitCaishenPlans;
                        nm.waitCaishenPlans = null;
                        self.showCaishenPlanPanel();
                    }
                },0);
            }
        }

        var self = this;
        // 重置财神选择相关状态(防止上次会话残留导致重进后无法出牌)
        self._pendingPlans = null;
        //开始（zp协议开局完整座位数据）
        this.node.on('game_start',function(data){
            self.onGameBeign(true, data && data.detail);
            self.initCaishenTip();
            //开局庄家直接出牌(无 game_mopai 事件),补启动倒计时
            if(cc.vv.gameNetMgr.turn == cc.vv.gameNetMgr.seatIndex){
                self._startCountdown();
            }
        });

        this.node.on('game_begin',function(data){
            self.onGameBeign();
        });

        // 翻财神/包麻将: 选完财神后 caishen/caishen2 被更新, 重新刷
        this.node.on('bao_result',function(data){
            self.initCaishenTip();
        });

        //出牌轮次切换
        this.node.on('game_chupai',function(data){
            data = data.detail;
            if(!data){ return; }
            self._stopCountdown(); //任何出牌事件(自己的/对手的)都先清倒计时,下家 game_mopai 会重新 start
            self.hideChupai();
            if(data.last != cc.vv.gameNetMgr.seatIndex){
                self.initMopai(data.last,null);
            }
            if(!cc.vv.replayMgr.isReplay() && data.turn != cc.vv.gameNetMgr.seatIndex){
                self.initMopai(data.turn,-1);
            }
        });
        //摸牌
        this.node.on('game_mopai',function(data){
            data = data.detail;
            if(!data){ return; }
            //不再隐藏上家打出的牌：出牌标记要保留到下一次出牌，否则摸牌后打出的牌立刻消失
            var pai = data.pai;
            var localIndex = cc.vv.gameNetMgr.getLocalIndex(data.seatIndex);
            if(localIndex == 0){
                //自己摸牌:轮到自己出牌,启动倒计时
                self._startCountdown();
                //手牌已由服务端holds覆盖,直接重排(末张为摸到的牌)
                self.initMahjongs(true);
            }
            else if(cc.vv.replayMgr.isReplay()){
                self.initMopai(data.seatIndex,pai);
            }
        });

        this.node.on('game_action',function(data){
            self.showAction(data.detail);
        });

        this.node.on('hupai',function(data){
            var data = data.detail;
            var seatIndex = data.si != null ? data.si : data.seatindex;
            var localIndex = cc.vv.gameNetMgr.getLocalIndex(seatIndex);
            var hupai = self._hupaiTips[localIndex];
            hupai.active = true;

            if(localIndex == 0){
                self.hideOptions();
            }
            var seatData = cc.vv.gameNetMgr.seats[seatIndex];
            seatData.hued = true;
            hupai.getChildByName("sprHu").active = !data.zimo;
            hupai.getChildByName("sprZimo").active = !!data.zimo;

            self.initMopai(seatIndex,data.pai);

            if(data.zimo){
                self.playEfx(localIndex,"play_zimo");
            }
            else{
                self.playEfx(localIndex,"play_hu");
            }

            cc.vv.audioMgr.playSFX("nv/hu.mp3");
        });

        //自选财神：服务端推可选方案
        this.node.on('game_caishen_plans',function(data){
            data = data.detail;
            if(!data || !data.plans || data.plans.length === 0){ return; }
            self._pendingPlans = data.plans;
            self.showCaishenPlanPanel();
        });

        this.node.on('mj_count',function(data){
            self._mjcount.string = "剩余" + cc.vv.gameNetMgr.numOfMJ + "张";
        });

        this.node.on('game_num',function(data){
            self._gamecount.string = "" + cc.vv.gameNetMgr.numOfGames + "/" + cc.vv.gameNetMgr.maxNumOfGames + "局";
        });

        this.node.on('game_over',function(data){
            self.gameRoot.active = false;
            self.prepareRoot.active = true;
            self.hideChiPanel();
            self.hideYoujinPanel();
        });

        //漳浦:补花通知 {si,pai,hua,numofmj}
        this.node.on('game_hua',function(data){
            var d = data.detail;
            if(!d){ return; }
            self.initHuaArea(d.si);
            self._mjcount.string = "剩余" + cc.vv.gameNetMgr.numOfMJ + "张";
        });

        //漳浦:游金等级通知 {si,level}
        this.node.on('game_youjin',function(data){
            var d = data.detail;
            if(!d){ return; }
            self.showYoujinLevel(d.si, d.level);
        });

        //漳浦:分饼通知(仅4人) {si,score}
        this.node.on('game_fenbing',function(data){
            var d = data.detail;
            if(!d){ return; }
            var seat = cc.vv.gameNetMgr.seats[d.si];
            var name = seat ? seat.name : ("" + d.si);
            if(cc.vv.wc && cc.vv.wc.showError){
                cc.vv.wc.showError(name + " 分饼 " + d.score + " 分");
            }
        });

        this.node.on('game_chupai_notify',function(data){
            self.hideChupai();
            //打出牌即视为放弃摸牌后的杠/胡选择:自动收起操作弹窗(不点过直接打出时,提示自动消失)
            self.hideOptions();
            var d = data.detail;
            if(!d || !d.seatData){ return; }
            var seatData = d.seatData;
            //如果是自己，则刷新手牌（seatindex 可能缺失，用 userId 兜底判定）
            var isSelf = (seatData.seatindex == cc.vv.gameNetMgr.seatIndex) || (seatData.userid != null && seatData.userid == cc.vv.userMgr.userId);
            if(isSelf){
                self.initMahjongs();
            }
            else{
                self.initOtherMahjongs(seatData);
            }
            self.showChupai();
            var audioUrl = cc.vv.mahjongmgr.getAudioURLByMJID(d.pai);
            cc.vv.audioMgr.playSFX(audioUrl);
        });

        //碰
        this.node.on('peng_notify',function(data){
            self.hideChupai();

            var seatData = data.detail;
            console.log('[peng_notify] seatData.userid=',seatData.userid,'seatindex=',seatData.seatindex,'holds=',typeof seatData.holds === 'object' ? seatData.holds.length+':'+JSON.stringify(seatData.holds) : seatData.holds);
            var isSelf = (seatData.seatindex == cc.vv.gameNetMgr.seatIndex) || (seatData.userid != null && seatData.userid == cc.vv.userMgr.userId);
            console.log('[peng_notify] selfId=',cc.vv.userMgr.userId,'seatIndex=',cc.vv.gameNetMgr.seatIndex,'isSelf=',isSelf);
            if(isSelf){
                self.initMahjongs(false, seatData);
            }
            else{
                self.initOtherMahjongs(seatData);
            }
            var localIndex = self.getLocalIndex(seatData.seatindex);
            self.playEfx(localIndex,"play_peng");
            cc.vv.audioMgr.playSFX("nv/peng.mp3");
            self.hideOptions();
        });
        //杠
        this.node.on('gang_notify',function(data){
            self.hideChupai();
            var data = data.detail;
            var seatData = data.seatData;
            var gangtype = data.gangtype;
            console.log('[gang_notify] seatData.userid=',seatData.userid,'holds=',typeof seatData.holds === 'object' ? seatData.holds.length+':'+JSON.stringify(seatData.holds) : seatData.holds);
            var isSelf = (seatData.seatindex == cc.vv.gameNetMgr.seatIndex) || (seatData.userid != null && seatData.userid == cc.vv.userMgr.userId);
            if(isSelf){
                self.initMahjongs(false, seatData);
            }
            else{
                self.initOtherMahjongs(seatData);
            }

            var localIndex = self.getLocalIndex(seatData.seatindex);
            if(gangtype == "wangang"){
                self.playEfx(localIndex,"play_guafeng");
                cc.vv.audioMgr.playSFX("guafeng.mp3");
            }
            else{
                self.playEfx(localIndex,"play_xiayu");
                cc.vv.audioMgr.playSFX("rain.mp3");
            }
            self.hideOptions();
        });
        //吃
        this.node.on('chi_notify',function(data){
            self.hideChupai();
            var seatData = data.detail;
            console.log('[chi_notify] seatData.userid=',seatData.userid,'holds=',typeof seatData.holds === 'object' ? seatData.holds.length+':'+JSON.stringify(seatData.holds) : seatData.holds);
            var isSelf = (seatData.seatindex == cc.vv.gameNetMgr.seatIndex) || (seatData.userid != null && seatData.userid == cc.vv.userMgr.userId);
            if(isSelf){
                self.initMahjongs(false, seatData);
            }
            else{
                self.initOtherMahjongs(seatData);
            }
            var localIndex = self.getLocalIndex(seatData.seatindex);
            self.playEfx(localIndex,"play_peng");
            cc.vv.audioMgr.playSFX("nv/peng.mp3");
            self.hideOptions();
        });
    },
    //显示出牌节点
    showChupai:function(){
        var pai = cc.vv.gameNetMgr.chupai;
        if( pai >= 0 ){
            var localIndex = this.getLocalIndex(cc.vv.gameNetMgr.turn);
            var sprite = this._chupaiSprite[localIndex];
            sprite.spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID("M_",pai);
            sprite.node.active = true;
        }
    },

    //出牌位置显示
    addOption:function(btnName,pai){
        for(var i = 0; i < this._options.childrenCount; ++i){
            var child = this._options.children[i];
            if(child.name == "op" && child.active == false){
                child.active = true;
                var sprite = child.getChildByName("opTarget").getComponent(cc.Sprite);
                sprite.spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID("M_",pai);
                var btn = child.getChildByName(btnName);
                btn.active = true;
                btn.pai = pai;
                return;
            }
        }
    },
    //吃按钮选项：与碰/杠/胡同级显示在op栏（全新创建按钮，克隆btnPeng会残留"碰"字精灵）
    addChiOption:function(pai){
        for(var i = 0; i < this._options.childrenCount; ++i){
            var child = this._options.children[i];
            if(child.name == "op" && child.active == false){
                child.active = true;
                var sprite = child.getChildByName("opTarget").getComponent(cc.Sprite);
                sprite.spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID("M_",pai);
                var btn = this.getChiButton(child);
                if(btn){
                    btn.active = true;
                    btn.pai = pai;
                }
                return;
            }
        }
    },

    getChiButton:function(opChild){
        var btn = opChild.getChildByName("btnChi");
        if(btn){ return btn; } //场景已固化并绑定ClickEvent,代码不再重复绑定
        var srcBtn = opChild.getChildByName("btnPeng");
        btn = new cc.Node("btnChi");
        opChild.addChild(btn);
        if(srcBtn){
            btn.setPosition(srcBtn.getPosition());
            btn.setContentSize(srcBtn.getContentSize());
            btn.scaleX = srcBtn.scaleX;
            btn.scaleY = srcBtn.scaleY;
        }
        var sp = btn.addComponent(cc.Sprite);
        sp.type = cc.Sprite.Type.SIMPLE;
        sp.sizeMode = cc.Sprite.SizeMode.CUSTOM;
        cc.resources.load("images/atlas/other_a/btn_red3", cc.SpriteFrame, function(err, frame){
            if(!err && frame && cc.isValid(btn)){
                var s = btn.getComponent(cc.Sprite);
                if(s){ s.spriteFrame = frame; }
            }
        });
        //自定义"吃"字图(已并入game_ui图集mj_btn_chi.png帧)：存在则替换背景并隐藏文字Label,不存在保持红底白字
        cc.resources.load("images/atlas/game_ui", cc.SpriteAtlas, function(err, atlas){
            var frame = atlas ? atlas.getSpriteFrame("mj_btn_chi.png") : null;
            if(frame && cc.isValid(btn)){
                var s = btn.getComponent(cc.Sprite);
                if(s){ s.spriteFrame = frame; }
                var lblNode = btn.getChildByName("btnLabel");
                if(lblNode){ lblNode.active = false; }
            }
        });
        btn.addComponent(cc.Button);
        var ln = new cc.Node("btnLabel");
        btn.addChild(ln);
        var lb = ln.addComponent(cc.Label);
        lb.string = "吃";
        lb.fontSize = 40;
        lb.lineHeight = 40;
        lb.overflow = cc.Label.Overflow.NONE;
        lb.enableWrapText = false;
        lb.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
        lb.verticalAlign = cc.Label.VerticalAlign.CENTER;
        ln.color = cc.color(255,255,255);
        ln.setPosition(0,0);
        cc.vv.utils.addClickEvent(btn, this.node, "MJGameZJZX", "onOptionClicked");
        btn.active = false;
        return btn;
    },

    //漳浦玩法操作按钮(抢金/游金/继续游金):场景已固化,这里仅在场景缺失时兜底创建
    getZpOpButton:function(opChild, btnName, text, fontSize){
        var btn = opChild.getChildByName(btnName);
        if(btn){ return btn; } //场景已固化并绑定ClickEvent,代码不再重复绑定
        var srcBtn = opChild.getChildByName("btnPeng");
        btn = new cc.Node(btnName);
        opChild.addChild(btn);
        if(srcBtn){
            btn.setPosition(srcBtn.getPosition());
            btn.setContentSize(srcBtn.getContentSize());
            btn.scaleX = srcBtn.scaleX;
            btn.scaleY = srcBtn.scaleY;
        }
        var sp = btn.addComponent(cc.Sprite);
        sp.type = cc.Sprite.Type.SIMPLE;
        sp.sizeMode = cc.Sprite.SizeMode.CUSTOM;
        cc.resources.load("images/atlas/other_a/btn_red3", cc.SpriteFrame, function(err, frame){
            if(!err && frame && cc.isValid(btn)){
                var s = btn.getComponent(cc.Sprite);
                if(s){ s.spriteFrame = frame; }
            }
        });
        btn.addComponent(cc.Button);
        var ln = new cc.Node("btnLabel");
        btn.addChild(ln);
        var lb = ln.addComponent(cc.Label);
        lb.string = text;
        lb.fontSize = fontSize || 40;
        lb.lineHeight = lb.fontSize;
        lb.overflow = cc.Label.Overflow.NONE;
        lb.enableWrapText = false;
        lb.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
        lb.verticalAlign = cc.Label.VerticalAlign.CENTER;
        ln.color = cc.color(255,255,255);
        ln.setPosition(0,0);
        cc.vv.utils.addClickEvent(btn, this.node, "MJGameZJZX", "onOptionClicked");
        btn.active = false;
        return btn;
    },

    //漳浦自定义操作选项:抢金/游金/继续游金按钮占用一个空闲op槽
    addZpOption:function(btnName, text, pai, fontSize){
        for(var i = 0; i < this._options.childrenCount; ++i){
            var child = this._options.children[i];
            if(child.name == "op" && child.active == false){
                child.active = true;
                var sprite = child.getChildByName("opTarget").getComponent(cc.Sprite);
                sprite.spriteFrame = (pai != null && pai >= 0) ? cc.vv.mahjongmgr.getSpriteFrameByMJID("M_",pai) : null;
                var btn = this.getZpOpButton(child, btnName, text, fontSize);
                btn.active = true;
                btn.pai = pai;
                return;
            }
        }
    },

    // ===== 吃牌：从手牌中自选两张 =====
    enterChiSelect:function(pai){
        this.cancelChiSelect();
        this._chiSelect = { pai: pai, tiles: [] };
        var gameChild = this.node.getChildByName("game") || this.node;
        //优先复用场景固化的 chiHint,没有才运行时创建
        var hint = gameChild.getChildByName("chiHint");
        this._chiHintBaked = !!hint;
        if(hint == null){
            hint = new cc.Node("chiHint");
            hint.setPosition(0, -200);
            gameChild.addChild(hint);
            var lb = hint.addComponent(cc.Label);
            lb.string = "请选择两张手牌";
            lb.fontSize = 36;
            lb.lineHeight = 40;
            lb.overflow = cc.Label.Overflow.NONE;
            hint.color = cc.color(255, 220, 80);
            var ol = hint.addComponent(cc.LabelOutline);
            ol.color = cc.color(60, 30, 0);
            ol.width = 3;
        }
        hint.active = true;
        hint.setPosition(0, -200);
        this._chiHint = hint;
    },

    cancelChiSelect:function(){
        if(this._chiSelect){
            for(var i = 0; i < this._chiSelect.tiles.length; ++i){
                var t = this._chiSelect.tiles[i];
                if(cc.isValid(t)){ t.y = 0; }
            }
        }
        this._chiSelect = null;
        if(this._chiHint && cc.isValid(this._chiHint)){
            //场景固化的只隐藏,运行时建的才销毁
            if(this._chiHintBaked){ this._chiHint.active = false; }
            else{ this._chiHint.destroy(); }
        }
        this._chiHint = null;
    },

    //隐藏轮到自己后选择碰杠胡过操作
    hideOptions:function(data){
        if(this._options == null){ return; }
        this._options.active = false;
        for(var i = 0; i < this._options.childrenCount; ++i){
            var child = this._options.children[i];
            if(child.name == "op"){
                child.active = false;
                child.getChildByName("btnPeng").active = false;
                child.getChildByName("btnGang").active = false;
                child.getChildByName("btnHu").active = false;
                var btnChi = child.getChildByName("btnChi");
                if(btnChi){ btnChi.active = false; }
                var btnQJ = child.getChildByName("btnQiangJin");
                if(btnQJ){ btnQJ.active = false; }
                var btnYJ = child.getChildByName("btnYouJin");
                if(btnYJ){ btnYJ.active = false; }
                var btnYJG = child.getChildByName("btnYouJinGo");
                if(btnYJG){ btnYJG.active = false; }
            }
        }
        this.hideChiPanel();
        this.cancelChiSelect();
        this.hideYoujinPanel();
    },
    //显示动作
    showAction:function(data){
        // 任何 game_action 都先关财神选择弹窗(超时自动过/弃胡/操作切换都要关)
        this.hideCaishenPlanPanel();
        if(this._options.active){
            this.hideOptions();
        }
        //兜底:New Layout是全屏且挂着Button的遮罩,未禁用会吞掉操作栏的所有点击
        var opsMask = this._options.getChildByName("New Layout");
        if(opsMask){ opsMask.active = false; }

        var hasYouJin = !!(data && data.youjin && data.youjin.length > 0);
        if(data && (data.hu || data.gang || data.peng || data.chi || data.qiangjin || hasYouJin || data.youjingo)){
            this._options.active = true;
            if(data.hu){
                this.addOption("btnHu",data.pai);
            }
            if(data.peng){
                this.addOption("btnPeng",data.pai);
            }

            if(data.gang){
                for(var i = 0; i < data.gangpai.length;++i){
                    var gp = data.gangpai[i];
                    this.addOption("btnGang",gp);
                }
            }

            if(data.chi){
                //吃：显示"吃"按钮，点击后从手牌中自选两张（服务端已保证存在可吃组合，否则chi为false按钮不显示）
                this.addChiOption(data.pai);
            }
            //漳浦:抢金(等同胡,点击发hu)
            if(data.qiangjin){
                this.addZpOption("btnQiangJin","抢金",data.pai,32);
            }
            //漳浦:可宣告游金(从候选牌中选一张打出)
            if(hasYouJin){
                this.addZpOption("btnYouJin","游金",data.pai);
            }
            //漳浦:继续游金(放弃本次胡,提升倍数),与胡按钮并存
            if(data.youjingo){
                this.addZpOption("btnYouJinGo","继续游金",data.pai,28);
            }
            //"过"按钮常驻，便于跳过任意可选操作
            var btnGuo = this._options.getChildByName("btnGuo");
            if(btnGuo){ btnGuo.active = true; }
        }
    },
    //加载玩法
    initWanfaLabel:function(){
        var wanfaNode = cc.find("Canvas/infobar/wanfa") || cc.find("Canvas/infobar/New Sprite/wanfa");
        if(wanfaNode == null){ return; }
        var wanfa = wanfaNode.getComponent(cc.Label);
        if(wanfa){ wanfa.string = cc.vv.gameNetMgr.getWanfa(); }
    },

    //金牌提示（漳浦玩法：开局即显示金牌）
    //节点结构在场景文件中(caishenTip下title/cs1/cs2),位置缩放在编辑器里手动调,代码只设牌面与显隐
    initCaishenTip:function(){
        var gameChild = this.node.getChildByName("game");
        if(gameChild == null){ return; }
        var tipNode = gameChild.getChildByName("caishenTip");
        if(tipNode == null){ return; }
        //自选麻将:财神只在胡牌弹窗展示,左上角财神展示区始终隐藏
        tipNode.active = false;
        return;
        var conf = cc.vv.gameNetMgr.conf;
        var csA = conf ? conf.caishen : null;
        var csB = conf ? conf.caishen2 : null;
        var has = csA != null && csA >= 0;
        var cs1 = tipNode.getChildByName("cs1");
        var cs2 = tipNode.getChildByName("cs2");

        if(!has){
            tipNode.active = false;
            return;
        }

        tipNode.active = true;
        // 强制提到最上层
        tipNode.setSiblingIndex(tipNode.parent.children.length - 1);

        var setIcon = function(node, pai){
            if(!node){ console.log("[caishenTip] node null, pai=" + pai); return null; }
            var sp = node.getComponent(cc.Sprite);
            if(!sp){ console.log("[caishenTip] 缺 Sprite 组件 node=" + node.name); return null; }
            var sf = cc.vv.mahjongmgr.getSpriteFrameByMJID("M_", pai);
            console.log("[caishenTip] pai=" + pai + " frame=" + (sf ? "OK" : "NULL"));
            if(sf){ sp.spriteFrame = sf; }
            return sp;
        };

        var has2 = csB != null && csB >= 0;
        var sp1 = null, sp2 = null;
        if(has2){
            if(cs1){ cs1.active = true; sp1 = setIcon(cs1, csA); }
            if(cs2){ cs2.active = true; sp2 = setIcon(cs2, csB); }
        }else{
            if(cs1){ cs1.active = false; }
            if(cs2){ cs2.active = true; sp2 = setIcon(cs2, csA); }
        }

        // 牌图集可能还没加载好 -> 逐帧补画
        var self = this;
        var needRetry = (sp1 != null && sp1.spriteFrame == null) || (sp2 != null && sp2.spriteFrame == null);
        if(needRetry && (!this._csRetryScheduled) && (this._csRetryCount == null || this._csRetryCount < 600)){
            this._csRetryScheduled = true;
            if(this._csRetryCount == null){ this._csRetryCount = 0; }
            var token = csA;
            this.scheduleOnce(function(){
                self._csRetryScheduled = false;
                if(!cc.isValid(self.node)){ return; }
                if(self._caishen != null && self._caishen !== token){ return; }
                self._csRetryCount++;
                self.initCaishenTip();
            }, 0);
        }else if(!needRetry){
            this._csRetryCount = 0;
        }
    },

    // ===== 漳浦:花牌区（使用图集中真实花牌图片,34-41 → 梅兰竹菊春夏秋冬） =====
    //花牌在 Z_my/Z_left/Z_right 图集中的英文名（M_ 前缀，bottomAtlas 含全部8张）

    //花牌区各方位锚点(相对game节点)
    _huaAreaPos:function(side){
        if(side == "myself"){ return cc.v2(-540, -230); }
        if(side == "up"){ return cc.v2(430, 210); }
        if(side == "right"){ return cc.v2(540, 40); }
        return cc.v2(-540, 40);
    },

    //取某座位的花牌区容器(按座位index,首次用时创建,挂在game节点下)
    getHuaArea:function(seatIndex){
        var localIndex = cc.vv.gameNetMgr.getLocalIndex(seatIndex);
        if(this._huaAreas[localIndex] && cc.isValid(this._huaAreas[localIndex])){
            return this._huaAreas[localIndex];
        }
        var side = cc.vv.mahjongmgr.getSide(localIndex);
        var gameChild = this.node.getChildByName("game") || this.node;
        var area = new cc.Node("huaArea_" + side);
        var pos = this._huaAreaPos(side);
        area.setPosition(pos.x, pos.y);
        gameChild.addChild(area);
        this._huaAreas[localIndex] = area;
        return area;
    },

    //按座位当前 hua 数组重绘花牌区（使用真实花牌图片）
    initHuaArea:function(seatIndex){
        var seat = cc.vv.gameNetMgr.seats ? cc.vv.gameNetMgr.seats[seatIndex] : null;
        if(seat == null){ return; }
        var area = this.getHuaArea(seatIndex);
        area.removeAllChildren();
        var hua = seat.hua || [];
        if(hua.length == 0){ return; }
        var atlas = cc.vv.mahjongmgr.bottomAtlas; // Z_my.plist 含全部8张花牌
        var TW = 44, TH = 64, GAP = 4;
        for(var i = 0; i < hua.length; ++i){
            var pai = hua[i];
            var tn = new cc.Node("hua" + i);
            tn.setContentSize(TW, TH);
            tn.setPosition(i * (TW + GAP) + TW / 2, 0);
            area.addChild(tn);
            var sp = tn.addComponent(cc.Sprite);
            sp.sizeMode = cc.Sprite.SizeMode.CUSTOM;
            var idx = pai - 34;
            var huaNames = ["plum","orchid","bamboo","chrysanthemum","spring","summer","autumn","winter"];
            var frameName = (idx >= 0 && idx < 8) ? ("M_" + huaNames[idx]) : null;
            var sf = frameName ? atlas.getSpriteFrame(frameName) : null;
            if(sf != null){
                sp.spriteFrame = sf;
            } else {
                //兜底:牌底+花名
                var baseFrame = cc.vv.mahjongmgr.getEmptySpriteFrame("myself");
                sp.spriteFrame = baseFrame;
                var ln = new cc.Node("name");
                tn.addChild(ln);
                var lb = ln.addComponent(cc.Label);
                lb.string = (idx >= 0 && idx < 8) ? ["梅","兰","竹","菊","春","夏","秋","冬"][idx] : "花";
                lb.fontSize = 26;
                lb.lineHeight = 28;
                lb.overflow = cc.Label.Overflow.NONE;
                lb.enableWrapText = false;
                lb.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
                lb.verticalAlign = cc.Label.VerticalAlign.CENTER;
                ln.color = cc.color(220, 40, 40);
                ln.setPosition(0, 0);
            }
        }
    },

    //开局/重连时全量重绘所有座位花牌区与游金等级
    initAllHuaAreas:function(){
        var seats = cc.vv.gameNetMgr.seats;
        if(!seats){ return; }
        for(var i = 0; i < seats.length; ++i){
            this.initHuaArea(i);
            this.showYoujinLevel(i, seats[i].youjinLevel || 0);
        }
    },

    //漳浦:游金等级显示(座位旁"单游/双游/三游"),level=0时隐藏
    showYoujinLevel:function(seatIndex, level){
        var localIndex = cc.vv.gameNetMgr.getLocalIndex(seatIndex);
        var lblNode = this._youjinLabels[localIndex];
        if(!lblNode || !cc.isValid(lblNode)){
            var side = cc.vv.mahjongmgr.getSide(localIndex);
            var area = this.getHuaArea(seatIndex);
            lblNode = new cc.Node("youjin_" + side);
            area.parent.addChild(lblNode);
            var lb = lblNode.addComponent(cc.Label);
            lb.fontSize = 30;
            lb.lineHeight = 34;
            lb.overflow = cc.Label.Overflow.NONE;
            lb.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
            lb.verticalAlign = cc.Label.VerticalAlign.CENTER;
            lblNode.color = cc.color(255, 90, 90);
            var ol = lblNode.addComponent(cc.LabelOutline);
            ol.color = cc.color(80, 0, 0);
            ol.width = 2;
            this._youjinLabels[localIndex] = lblNode;
        }
        //挂在花牌区上方,花牌区为空时也按固定锚点显示
        var area2 = this.getHuaArea(seatIndex);
        lblNode.setPosition(area2.x, area2.y + 80);
        var names = ["", "单游", "双游", "三游"];
        if(level > 0){
            lblNode.active = true;
            lblNode.getComponent(cc.Label).string = names[level] || (level + "游");
        }
        else{
            lblNode.active = false;
        }
    },

    // ===== 漳浦:游金选牌面板（从候选牌中选一张打出,发 'youjin'） =====
    showYoujinPanel:function(pais){
        this.hideYoujinPanel();
        if(!pais || pais.length == 0){ return; }
        var parent = this.node.getChildByName("game");
        if(parent == null){ parent = this.node; }
        var TW = 62, TH = 90, GAP = 16, PADX = 20, PADY = 14, CAPH = 28;
        var w = PADX * 2 + pais.length * TW + (pais.length - 1) * GAP;
        var h = PADY * 2 + TH + CAPH;
        var panel = new cc.Node("youjinPanel");
        panel.setContentSize(w, h);
        panel.setPosition(0, -30);
        parent.addChild(panel);
        var bgn = new cc.Node("bg");
        bgn.setContentSize(w, h);
        panel.addChild(bgn);
        var g = bgn.addComponent(cc.Graphics);
        g.fillColor = cc.color(18, 18, 24, 235);
        g.strokeColor = cc.color(255, 200, 90, 255);
        g.lineWidth = 3;
        g.rect(-w / 2, -h / 2, w, h);
        g.fill();
        g.stroke();
        var cap = new cc.Node("cap");
        cap.setContentSize(w, CAPH);
        cap.setPosition(0, h / 2 - PADY - CAPH / 2 + 4);
        panel.addChild(cap);
        var capLbl = cap.addComponent(cc.Label);
        capLbl.string = "选择一张牌宣告游金";
        capLbl.fontSize = 22;
        capLbl.lineHeight = CAPH;
        capLbl.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
        capLbl.verticalAlign = cc.Label.VerticalAlign.CENTER;
        cap.color = cc.color(255, 225, 150);

        for(var c = 0; c < pais.length; ++c){
            var item = new cc.Node("yjItem" + c);
            item.setContentSize(TW, TH);
            item.setPosition(-w / 2 + PADX + TW / 2 + c * (TW + GAP), -h / 2 + PADY + TH / 2);
            panel.addChild(item);
            item.addComponent(cc.Button);
            item.pai = pais[c];
            cc.vv.utils.addClickEvent(item, this.node, "MJGameZJZX", "onYoujinItemClicked");
            var sp = item.addComponent(cc.Sprite);
            sp.spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID("B_", pais[c]);
            sp.sizeMode = cc.Sprite.SizeMode.CUSTOM;
        }
        this._youjinPanel = panel;
    },

    hideYoujinPanel:function(){
        if(this._youjinPanel && cc.isValid(this._youjinPanel)){
            this._youjinPanel.destroy();
        }
        this._youjinPanel = null;
    },

    onYoujinItemClicked:function(event){
        var pai = event.target.pai;
        if(pai != null){
            cc.vv.net.send("youjin", pai);
        }
        this.hideYoujinPanel();
        this.hideOptions();
    },

    //碰杠胡行为实现
    playEfx:function(index,name){
        this._playEfxs[index].node.active = true;
        this._playEfxs[index].play(name);
    },
    //游戏开始
    onGameBeign:function(fromGameStart, startData){

        for(var i = 0; i < this._playEfxs.length; ++i){
            this._playEfxs[i].node.active = false;
        }

        for(var i = 0; i < this._hupaiLists.length; ++i){
            for(var j = 0; j < this._hupaiLists[i].childrenCount; ++j){
                this._hupaiLists[i].children[j].active = false;
            }
        }

        if(cc.vv.gameNetMgr.seats){ //无房间数据时跳过,避免null.length崩溃
        for(var i = 0; i < cc.vv.gameNetMgr.seats.length; ++i){
            var seatData = cc.vv.gameNetMgr.seats[i];
            var localIndex = cc.vv.gameNetMgr.getLocalIndex(i);
            var hupai = this._hupaiTips[localIndex];
            hupai.active = seatData.hued;
            if(seatData.hued){
                hupai.getChildByName("sprHu").active = !seatData.iszimo;
                hupai.getChildByName("sprZimo").active = seatData.iszimo;
            }
        }
        }

        this.hideChupai();
        this.hideOptions();
        var gameChild = this.node.getChildByName("game");
        //漳浦玩法没有换三张:隐藏左上角换三张占位牌(hp1/hp2/hp3),该位置改用于显示金牌
        var huanpaiinfo = gameChild.getChildByName("huanpaiinfo");
        if(huanpaiinfo != null){ huanpaiinfo.active = false; }
        //对家方位:2人玩法只保留上方(up),4人玩法右/上/左三方位全留
        var sides = ["right","up","left"];
        for(var i = 0; i < sides.length; ++i){
            var sideChild = gameChild.getChildByName(sides[i]);
            if(sideChild == null){ continue; }
            //该方位对应的本机座位,-1表示本局不参与
            var li = cc.vv.mahjongmgr.getLocalIndexBySlot(i + 1);
            if(li < 0){
                sideChild.active = false;
                continue;
            }
            sideChild.active = true;
            var holds = sideChild.getChildByName("holds");
            //场景固化14个手牌槽,这里一律先全暗;点亮由 initOtherMahjongs 按真实手牌数负责,
            //否则无对局数据(重进房间/结算后)时会残留显示满手的牌背
            for(var j = 0; j < holds.childrenCount; ++j){
                holds.children[j].active = false; //只切显隐,贴图/缩放完全由场景控制
            }
        }

        if(cc.vv.gameNetMgr.gamestate == "" && cc.vv.replayMgr.isReplay() == false){
            return;
        }

        this.gameRoot.active = true;
        this.prepareRoot.active = false;
        // 重进时原样显示服务端手牌数, 不pop不脑补
        // 摸牌位只在真正收到game_mopai_push事件时才弹(那是真摸到牌了)
        // 服务端发13张就是没摸, 发14张就是已摸等出, 客户端别瞎改
        this.initMahjongs(false);
        var seats = cc.vv.gameNetMgr.seats;
        for(var i in seats){
            var seatData = seats[i];
            var localIndex = cc.vv.gameNetMgr.getLocalIndex(i);
            if(localIndex != 0){
                this.initOtherMahjongs(seatData);
                if(i == cc.vv.gameNetMgr.turn){
                    this.initMopai(i,-1);
                }
                else{
                    this.initMopai(i,null);
                }
            }
        }
        //漳浦:重绘全部花牌区与游金等级(开局/重连)
        this.initAllHuaAreas();
        this.showChupai();
        //重进恢复操作栏:延迟到下一拍执行。onLoad会直调一次onGameBeign,补发的game_start再触发一次,
        //若此处同步恢复,第一次恢复的操作栏会被第二次onGameBeign开头的hideOptions又藏掉,
        //表现为重进后吃/碰/杠/胡栏闪一下消失、非本人轮次牌打不出去。下一拍恢复保证最终显示。
        var selfAct = this;
        this.scheduleOnce(function(){
            if(!cc.isValid(selfAct.node)){ return; }
            if(cc.vv.gameNetMgr.curaction != null){
                selfAct.showAction(cc.vv.gameNetMgr.curaction);
                cc.vv.gameNetMgr.curaction = null;
            }
        },0);
        //开局首次发牌:手牌从牌墙依次飞出(仅game_start触发且本局无任何弃牌/副露/补花;断线重连保持瞬间渲染)
        if(fromGameStart && this._isFreshDeal()){
            this._playDealAnim();
        }
    },

    // ===== 开局发牌动画：手牌从牌墙依次飞出（仅开局首次发牌触发） =====
    //是否本局首次发牌:全场无弃牌/无吃碰杠/无人补花,且非回放。断线重连局已进行时返回false,保持瞬间渲染
    _isFreshDeal:function(){
        if(cc.vv.replayMgr && cc.vv.replayMgr.isReplay()){ return false; }
        var seats = cc.vv.gameNetMgr ? cc.vv.gameNetMgr.seats : null;
        if(!seats){ return false; }
        for(var i = 0; i < seats.length; ++i){
            var s = seats[i];
            if(!s){ continue; }
            if(s.folds instanceof Array && s.folds.length > 0){ return false; }
            if(s.pengs instanceof Array && s.pengs.length > 0){ return false; }
            if(s.chis instanceof Array && s.chis.length > 0){ return false; }
            if(s.angangs instanceof Array && s.angangs.length > 0){ return false; }
            if(s.diangangs instanceof Array && s.diangangs.length > 0){ return false; }
            if(s.wangangs instanceof Array && s.wangangs.length > 0){ return false; }
            if(s.hua instanceof Array && s.hua.length > 0){ return false; }
        }
        return true;
    },

    //发牌动画:原渲染逻辑已把所有手牌摆到最终位,此处仅记录最终状态→移到牌墙起始位并透明→逐张飞回
    _playDealAnim:function(){
        var STEP = 0.06; //每张起飞间隔
        var FLY = 0.15;  //单张飞行时长
        this._cancelDealAnim(); //防御:清掉可能未播完的上一次动画
        //桌子中央牌墙区域(画布坐标(0,80))换算到各手牌父节点坐标系
        var wallWorld = this.node.convertToWorldSpaceAR(cc.v2(0, 80));
        var animNodes = [];
        var maxEnd = 0;
        var collect = function(nodes, parent, orderFn){
            if(parent == null || nodes.length == 0){ return; }
            var start = parent.convertToNodeSpaceAR(wallWorld);
            nodes.sort(orderFn);
            for(var i = 0; i < nodes.length; ++i){
                var nc = nodes[i];
                var fx = nc.x, fy = nc.y, fop = nc.opacity;
                animNodes.push({node:nc, x:fx, y:fy, op:fop});
                nc.setPosition(start);
                nc.opacity = 0;
                nc.runAction(cc.sequence(
                    cc.delayTime(i * STEP),
                    cc.spawn(cc.moveTo(FLY, cc.v2(fx, fy)), cc.fadeTo(FLY, fop))
                ));
                var end = i * STEP + FLY;
                if(end > maxEnd){ maxEnd = end; }
            }
        };
        //自己手牌:从左到右依次飞出
        var myTiles = [];
        var myParent = null;
        for(var i = 0; i < this._myMJArr.length; ++i){
            var sp = this._myMJArr[i];
            if(sp && sp.node && sp.node.active && sp.node.mjId != null){
                myTiles.push(sp.node);
                myParent = sp.node.parent;
            }
        }
        collect(myTiles, myParent, function(a, b){ return a.x - b.x; });
        //对手手牌(牌背):up从右到左,left从上到下,right从下到上
        var gameChild = this.node.getChildByName("game");
        var seats = cc.vv.gameNetMgr.seats || [];
        for(var si = 0; si < seats.length; ++si){
            var localIndex = cc.vv.gameNetMgr.getLocalIndex(si);
            if(localIndex == 0){ continue; }
            var side = cc.vv.mahjongmgr.getSide(localIndex);
            var sideRoot = gameChild ? gameChild.getChildByName(side) : null;
            var sideHolds = sideRoot ? sideRoot.getChildByName("holds") : null;
            if(sideHolds == null){ continue; }
            var tiles = [];
            for(var ci = 0; ci < sideHolds.childrenCount; ++ci){
                var child = sideHolds.children[ci];
                if(child.active){ tiles.push(child); }
            }
            var orderFn;
            if(side == "up"){
                orderFn = function(a, b){ return b.convertToWorldSpaceAR(cc.v2(0,0)).x - a.convertToWorldSpaceAR(cc.v2(0,0)).x; };
            }
            else if(side == "left"){
                orderFn = function(a, b){ return b.convertToWorldSpaceAR(cc.v2(0,0)).y - a.convertToWorldSpaceAR(cc.v2(0,0)).y; };
            }
            else{
                orderFn = function(a, b){ return a.convertToWorldSpaceAR(cc.v2(0,0)).y - b.convertToWorldSpaceAR(cc.v2(0,0)).y; };
            }
            collect(tiles, sideHolds, orderFn);
        }
        if(animNodes.length == 0){ return; }
        this._dealAnimNodes = animNodes;
        this._dealAnimating = true; //动画期间屏蔽自己手牌触摸
        this._dealAnimUntil = Date.now() + (maxEnd + 0.3) * 1000; //解锁截止时间(兜底,回调丢失也必解锁)
        this._dealAnimId = (this._dealAnimId || 0) + 1;
        var animId = this._dealAnimId;
        var self = this;
        this.scheduleOnce(function(){
            if(self._dealAnimId == animId){
                self._dealAnimating = false;
                self._dealAnimNodes = null;
            }
        }, maxEnd + 0.05);
    },

    //取消发牌动画并瞬间归位:任何手牌重绘(摸/打/吃碰杠/重连补发)到来时调用,保证后续渲染不受动画影响
    _cancelDealAnim:function(){
        if(!this._dealAnimating){ return; }
        this._dealAnimating = false;
        this._dealAnimId = (this._dealAnimId || 0) + 1;
        var list = this._dealAnimNodes || [];
        for(var i = 0; i < list.length; ++i){
            var it = list[i];
            if(cc.isValid(it.node)){
                it.node.stopAllActions();
                it.node.setPosition(it.x, it.y);
                it.node.opacity = it.op;
            }
        }
        this._dealAnimNodes = null;
    },

    //从点击事件中解析出真正的麻将牌节点（兼容点击到子节点/Label的情况，向上查找挂了 mjId 的节点）
    _findMJNode:function(event){
        var n = (event && (event.node || event.currentTarget || event.target)) || null;
        while(n && n.mjId == null && n.parent){
            n = n.parent;
        }
        return n;
    },

    //从点击事件中解析出按钮节点（点击到 Label 子节点时向上查找）
    _findBtnNode:function(event){
        var n = (event && (event.node || event.currentTarget || event.target)) || null;
        var known = {btnPeng:1,btnGang:1,btnHu:1,btnGuo:1,btnChi:1,btnQiangJin:1,btnYouJin:1,btnYouJinGo:1};
        while(n && !known[n.name] && n.parent){
            n = n.parent;
        }
        return n;
    },

    onMJClicked:function(event){
        //开局发牌动画播放中,屏蔽手牌触摸,防止误点
        if(this._dealAnimating){
            if(Date.now() < (this._dealAnimUntil || 0)){ return; }
            this._dealAnimating = false; //动画解锁回调丢失时按时间戳兜底解锁
        }
        //吃牌选牌模式：从手牌中自选两张（发生在对方回合，必须放在轮次拦截之前）
        if(this._chiSelect){
            var cnode = this._findMJNode(event);
            if(cnode == null || cnode.mjId == null){ return; }
            for(var ci = 0; ci < this._myMJArr.length; ++ci){
                if(cnode == this._myMJArr[ci].node){
                    var tiles = this._chiSelect.tiles;
                    var ti = tiles.indexOf(cnode);
                    if(ti != -1){
                        tiles.splice(ti, 1);
                        cnode.y = 0;
                        return;
                    }
                    if(tiles.length >= 2){ return; }
                    tiles.push(cnode);
                    cnode.y = 15;
                    if(tiles.length == 2){
                        var p0 = tiles[0].mjId;
                        var p1 = tiles[1].mjId;
                        var target = this._chiSelect.pai;
                        tiles[0].y = 0;
                        tiles[1].y = 0;
                        this.cancelChiSelect();
                        this.hideOptions();
                        cc.vv.net.send("chi", [p0, p1, target]);
                    }
                    return;
                }
            }
            return;
        }
        //如果不是自己的轮次，则忽略
        if(cc.vv.gameNetMgr.turn != cc.vv.gameNetMgr.seatIndex){
            console.log("not your turn." + cc.vv.gameNetMgr.turn);
            return;
        }

        //兼容两种回调形态:Button回调传组件(节点取event.node),触摸事件传event(节点取currentTarget/target)
        var node = this._findMJNode(event);
        if(node == null){ return; }
        for(var i = 0; i < this._myMJArr.length; ++i){
            if(node == this._myMJArr[i].node){
                //如果是再次点击，则出牌
                if(node == this._selectedMJ){
                    this.shoot(this._selectedMJ.mjId);
                    this._selectedMJ.y = 0;
                    this._selectedMJ = null;
                    return;
                }
                if(this._selectedMJ != null){
                    this._selectedMJ.y = 0;
                }
                node.y = 15;
                this._selectedMJ = node;
                return;
            }
        }
    },

    //出牌
    shoot:function(mjId){
        if(mjId == null){
            return;
        }
        cc.vv.net.send('chupai',mjId);
    },

    getMJIndex:function(side,index){
        if(side == "right" || side == "up"){
            return 13 - index;
        }
        return index;
    },

    // ===== 出牌倒计时显示(服务端有自动代打兜底,此处仅让玩家看到紧迫感) =====
    _startCountdown:function(){
        this._stopCountdown();
        var timeout = (cc.vv && cc.vv.gameNetMgr) ? (cc.vv.gameNetMgr.chupaiTimeout || 15) : 15;
        if(timeout <= 0){ return; }
        this._countdownSec = timeout;
        if(this._countdownLabel){
            var lab = this._countdownLabel.getComponent(cc.Label);
            if(lab){ lab.string = this._countdownSec + 's'; }
        }
        var self = this;
        this._countdownId = setInterval(function(){
            if(!self.node || !cc.isValid(self.node)){ self._stopCountdown(); return; }
            self._countdownSec--;
            if(self._countdownLabel){
                var l2 = self._countdownLabel.getComponent(cc.Label);
                if(l2){ l2.string = (self._countdownSec > 0 ? self._countdownSec + 's' : ''); }
            }
            if(self._countdownSec <= 0){
                self._stopCountdown();
            }
        }, 1000);
    },
    _stopCountdown:function(){
        if(this._countdownId){
            clearInterval(this._countdownId);
            this._countdownId = null;
        }
        this._countdownSec = 0;
        if(this._countdownLabel){
            var lab = this._countdownLabel.getComponent(cc.Label);
            if(lab){ lab.string = ''; }
        }
    },

    initMopai:function(seatIndex,pai){
        this._cancelDealAnim(); //手牌相关重绘到来即终止发牌动画并归位
        var localIndex = cc.vv.gameNetMgr.getLocalIndex(seatIndex);
        var side = cc.vv.mahjongmgr.getSide(localIndex);
        var pre = cc.vv.mahjongmgr.getFoldPre(localIndex);

        var gameChild = this.node.getChildByName("game");
        var sideChild = gameChild.getChildByName(side);
        var holds = sideChild.getChildByName("holds");

        var lastIndex = this.getMJIndex(side,13);
        var nc = holds.children[lastIndex];
        if(nc == null){ return; }

        nc.scaleX = 1.0;
        nc.scaleY = 1.0;

        if(pai == null){
            nc.active = false;
        }
        else if(pai >= 0){
            nc.active = true;
            if(side == "up"){
                nc.scaleX = 0.73;
                nc.scaleY = 0.73;
            }
            var sprite = nc.getComponent(cc.Sprite);
            sprite.spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID(pre,pai);
        }
        else if(pai != null){
            nc.active = true;
            if(side == "up"){
                nc.scaleX = 1.0;
                nc.scaleY = 1.0;
            }
            var sprite = nc.getComponent(cc.Sprite);
            sprite.spriteFrame = cc.vv.mahjongmgr.getHoldsEmptySpriteFrame(side);
        }
    },

    initEmptySprites:function(seatIndex){
        var localIndex = cc.vv.gameNetMgr.getLocalIndex(seatIndex);
        var side = cc.vv.mahjongmgr.getSide(localIndex);

        var gameChild = this.node.getChildByName("game");
        var sideChild = gameChild.getChildByName(side);
        var holds = sideChild.getChildByName("holds");
        var spriteFrame = cc.vv.mahjongmgr.getEmptySpriteFrame(side);
        for(var i = 0; i < holds.childrenCount; ++i){
            var nc = holds.children[i];
            nc.scaleX = 1.0;
            nc.scaleY = 1.0;

            var sprite = nc.getComponent(cc.Sprite);
            sprite.spriteFrame = spriteFrame;
        }
    },

    initOtherMahjongs:function(seatData){
        this._cancelDealAnim(); //手牌相关重绘到来即终止发牌动画并归位
        if(seatData == null){ return; }
        var localIndex = this.getLocalIndex(seatData.seatindex);
        if(localIndex == 0){
            return;
        }
        var side = cc.vv.mahjongmgr.getSide(localIndex);
        var game = this.node.getChildByName("game");
        var sideRoot = game ? game.getChildByName(side) : null;
        var sideHolds = sideRoot ? sideRoot.getChildByName("holds") : null;
        if(sideHolds == null){ return; }
        var chis = seatData.chis || [];
        var num = (seatData.pengs ? seatData.pengs.length : 0) + (seatData.angangs ? seatData.angangs.length : 0) + (seatData.diangangs ? seatData.diangangs.length : 0) + (seatData.wangangs ? seatData.wangangs.length : 0) + chis.length;
        num *= 3;
        for(var i = 0; i < num; ++i){
            var idx = this.getMJIndex(side,i);
            if(sideHolds.children[idx] == null){ continue; }
            sideHolds.children[idx].active = false;
        }

        var pre = cc.vv.mahjongmgr.getFoldPre(localIndex);
        var holds = this.sortHolds(seatData);
        if(holds == null || typeof(holds) != "object" || holds.length == null || holds.length === 0){
            //对家手牌仅有数量(不下发数组;applyPushHolds把数量归一化到holdCount,holds保持空数组):按数量点亮牌背槽(up/right槽位倒序),多余槽位隐藏
            var n2 = (typeof(seatData.holds) == "number") ? seatData.holds : (seatData.holdCount || 0);
            for(var i = num; i < num + n2; ++i){
                var idx = this.getMJIndex(side,i);
                var slotNode = sideHolds.children[idx];
                if(slotNode == null){ continue; }
                slotNode.active = true; //贴图/缩放完全用场景固化的,JS只切显隐
            }
            this._hideUnusedHolds(side,sideHolds,num + n2);
            return;
        }
        for(var i = 0; i < holds.length; ++i){
            var idx = this.getMJIndex(side,i + num);
            if(sideHolds.children[idx] == null){ continue; }
            var sprite = sideHolds.children[idx].getComponent(cc.Sprite);
            if(sprite == null){ continue; }
            if(side == "up"){
                sprite.node.scaleX = 0.73;
                sprite.node.scaleY = 0.73;
            }
            sprite.node.active = true;
            sprite.spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID(pre,holds[i]);
        }
        //真实手牌之后的固化槽位全部隐藏:场景固化14槽且全部active,不隐藏会残留多余的牌背
        this._hideUnusedHolds(side,sideHolds,num + holds.length);
    },

    //隐藏对家手牌区未使用的固化槽位:已用槽位数=used,其余(active仍为true的场景槽)全部关掉
    _hideUnusedHolds:function(side,sideHolds,used){
        for(var i = used; i < 14; ++i){
            var idx = this.getMJIndex(side,i);
            if(sideHolds.children[idx] == null){ continue; }
            sideHolds.children[idx].active = false;
        }
    },

    sortHolds:function(seatData, allowMopai){
        var holds = seatData.holds;
        if(holds == null || typeof(holds) != "object" || holds.length == null){
            //对手手牌可能仅返回数量，无法排序展示
            return null;
        }
        //在副本上排序,禁止原地修改服务端座位数据,避免重复排序/摸牌弹出互相污染
        holds = holds.slice();
        //只有"自己摸牌"推送时才把最后一张当摸牌单独放到右边;
        //碰/吃/杠后手牌数同样可能是11/8/5,此时没有摸牌,误弹会导致排序错乱、末张高亮像多出一张
        var mopai = null;
        var l = holds.length;
        if(allowMopai && ( l == 2 || l == 5 || l == 8 || l == 11 || l == 14)){
            mopai = holds.pop();
        }

        //金牌单独放到手牌最左边
        var conf = cc.vv.gameNetMgr.conf;
        var cs = conf ? conf.caishen : -1;
        var cs2 = conf ? conf.caishen2 : -1;
        var caishenTiles = [];
        var others = [];
        for(var i = 0; i < holds.length; ++i){
            var p = holds[i];
            if((cs >= 0 && p == cs) || (cs2 != null && cs2 >= 0 && p == cs2)){
                caishenTiles.push(p);
            } else {
                others.push(p);
            }
        }
        cc.vv.mahjongmgr.sortMJ(others);
        holds.length = 0;
        for(var j = 0; j < caishenTiles.length; ++j){ holds.push(caishenTiles[j]); }
        for(var k = 0; k < others.length; ++k){ holds.push(others[k]); }

        //将摸牌添加到最后
        if(mopai != null){
            holds.push(mopai);
        }
        return holds;
    },

    initMahjongs:function(allowMopai, forceSeatData){
        this._cancelDealAnim(); //手牌相关重绘到来即终止发牌动画并归位
        var seatData = forceSeatData || this.getSelfSeatData();
        console.log("[initMahjongs] allowMopai=",allowMopai,"forceSeatData=",!!forceSeatData,"seatData.holds=",seatData ? (typeof seatData.holds === 'object' ? seatData.holds.length + ':' + JSON.stringify(seatData.holds) : seatData.holds) : 'null');
        //需求1:收到吃/碰/杠/出牌/摸牌等notify后,一律以服务端下发的完整 holds 数组整体覆盖重绘,
        //禁止客户端自行增删手牌。服务端对本座位的 holds 为完整数组;若拿到数量(number)则跳过并告警,避免手牌错位。
        if(seatData == null || seatData.holds == null || typeof(seatData.holds) != "object" || seatData.holds.length == null){
            console.warn("[initMahjongs] 自己的holds不是数组,跳过重绘,holds=", seatData ? seatData.holds : seatData);
            return;
        }
        var holds = this.sortHolds(seatData, allowMopai);
        if(holds == null){
            return;
        }
        //整体覆盖重绘后,原选中牌引用已失效,必须清空,否则点新牌会被误判为"再次点击"而出牌
        this._selectedMJ = null;

        //初始化手牌（含吃牌组数量）
        var chis = seatData.chis || [];
        var lackingNum = ((seatData.pengs ? seatData.pengs.length : 0) + (seatData.angangs ? seatData.angangs.length : 0) + (seatData.diangangs ? seatData.diangangs.length : 0) + (seatData.wangangs ? seatData.wangangs.length : 0) + chis.length)*3;
        //手牌连续排布,真实摸到的牌(末张)加摸牌间隙放摸牌位;吃/碰/杠后不挑牌
        var tileW = 0, gapExtra = 0;
        if(this._myMJArr.length >= 2 && this._myMJArr[0] && this._myMJArr[1]){
            tileW = this._myMJArr[1].node.x - this._myMJArr[0].node.x;
            if(tileW < 0){ tileW = 0; }
        }
        //摸牌位固定半张牌宽的位移,不再从场景槽位推算(场景14槽无预留间隙时位移为0,用户看不到摸牌位)
        gapExtra = tileW > 0 ? tileW * 0.5 : 20;
        var hasMopai = !!allowMopai && (holds.length == 2 || holds.length == 5 || holds.length == 8 || holds.length == 11 || holds.length == 14);
        var baseSprite = this._myMJArr[lackingNum];
        var baseX = baseSprite ? baseSprite.node.x : 0;
        console.log("[initMahjongs] _myMJArr.length=",this._myMJArr.length,"lackingNum=",lackingNum,"holds.length=",holds.length,"startSlot=",lackingNum,"endSlot=",lackingNum+holds.length-1);
        //漳浦:金牌高亮染色
        var conf = cc.vv.gameNetMgr.conf;
        var cs = conf ? conf.caishen : -1;
        var cs2 = conf ? conf.caishen2 : -1;
        var renderLog = [];
        for(var i = 0; i < holds.length; ++i){
            var mjid = holds[i];
            var sprite = this._myMJArr[i + lackingNum];
            if(sprite == null || sprite.node == null){ renderLog.push("SLOT_"+(i+lackingNum)+"=NULL"); break; }
            sprite.node.mjId = mjid;
            sprite.node.y = 0;
            var isMo = hasMopai && (i == holds.length - 1);
            if(tileW > 0){
                sprite.node.x = baseX + i * tileW + (isMo ? gapExtra : 0);
            }
            this.setSpriteFrameByMJID("M_",sprite,mjid);
            //金牌位金色标记(漳浦金不代牌,仅醒目提示)
            var isJin = (cs >= 0 && mjid == cs) || (cs2 != null && cs2 >= 0 && mjid == cs2);
            sprite.node.color = isJin ? cc.color(255, 200, 90) : cc.Color.WHITE;
            renderLog.push("SLOT_"+(i+lackingNum)+"="+mjid);
        }
        console.log("[initMahjongs] render:",renderLog.join("|"));
        for(var i = 0; i < lackingNum; ++i){
            var sprite = this._myMJArr[i];
            if(sprite == null || sprite.node == null){ continue; }
            sprite.node.mjId = null;
            sprite.spriteFrame = null;
            sprite.node.active = false;
        }
        for(var i = lackingNum + holds.length; i < this._myMJArr.length; ++i){
            var sprite = this._myMJArr[i];
            if(sprite == null || sprite.node == null){ continue; }
            sprite.node.mjId = null;
            sprite.spriteFrame = null;
            sprite.node.active = false;
        }
    },

    setSpriteFrameByMJID:function(pre,sprite,mjid){
        sprite.spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID(pre,mjid);
        sprite.node.active = true;
    },

    //自己座位数据:优先 seatIndex 命中,异常时用 userId 兜底(2人房/4人房都适用)
    getSelfSeatData:function(){
        var gnm = cc.vv.gameNetMgr;
        var seats = gnm ? gnm.seats : null;
        if(!seats){ return null; }
        var idx = gnm.seatIndex;
        if(idx != null && idx >= 0 && idx < seats.length && seats[idx]){ return seats[idx]; }
        var uid = cc.vv.userMgr ? cc.vv.userMgr.userId : null;
        if(uid != null){
            for(var i = 0; i < seats.length; ++i){
                if(seats[i] && seats[i].userid == uid){ return seats[i]; }
            }
        }
        return null;
    },

    getLocalIndex:function(index){
        var len = cc.vv.gameNetMgr.seats ? cc.vv.gameNetMgr.seats.length : 2;
        var ret = (index - cc.vv.gameNetMgr.seatIndex + len) % len;
        return ret;
    },

    // ===== 吃牌组合选择面板（以麻将牌图案展示，可点选） =====
    showChiPanel:function(chipai){
        this.hideChiPanel();
        //面板挂在game节点下，居中靠下
        var parent = this.node.getChildByName("game");
        if(parent == null){ parent = this.node; }
        //固定尺寸布局：2.4下嵌套Layout有时序问题会导致面板整体不渲染
        var TW = 46, TH = 66, TGAP = 4, CGAP = 30, PADX = 18, PADY = 14, CAPH = 26;
        var perW = TW * 3 + TGAP * 2;
        var w = PADX * 2 + chipai.length * perW + (chipai.length - 1) * CGAP;
        var h = PADY * 2 + TH + CAPH;
        var panel = new cc.Node("chiPanel");
        panel.setContentSize(w, h);
        panel.setPosition(0, -30);
        parent.addChild(panel);
        //底板（独立bg子节点，避免父节点Graphics覆盖内容子节点）
        var bgn = new cc.Node("bg");
        bgn.setContentSize(w, h);
        panel.addChild(bgn);
        var g = bgn.addComponent(cc.Graphics);
        g.fillColor = cc.color(18, 18, 24, 235);
        g.strokeColor = cc.color(255, 200, 90, 255);
        g.lineWidth = 3;
        g.rect(-w / 2, -h / 2, w, h);
        g.fill();
        g.stroke();
        //提示文字
        var cap = new cc.Node("cap");
        cap.setContentSize(w, CAPH);
        cap.setPosition(0, h / 2 - PADY - CAPH / 2 + 4);
        panel.addChild(cap);
        var capLbl = cap.addComponent(cc.Label);
        capLbl.string = "选择吃牌组合";
        capLbl.fontSize = 22;
        capLbl.lineHeight = CAPH;
        capLbl.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
        capLbl.verticalAlign = cc.Label.VerticalAlign.CENTER;
        cap.color = cc.color(255, 225, 150);

        for(var c = 0; c < chipai.length; ++c){
            var pais = chipai[c];
            //每个组合一个可点击节点
            var item = new cc.Node("chiItem" + c);
            item.setContentSize(perW, TH);
            item.setPosition(-w / 2 + PADX + perW / 2 + c * (perW + CGAP), -h / 2 + PADY + TH / 2);
            panel.addChild(item);
            item.addComponent(cc.Button);
            item.paiList = pais;
            cc.vv.utils.addClickEvent(item, this.node, "MJGameZJZX", "onChiItemClicked");
            for(var p = 0; p < pais.length; ++p){
                var pn = new cc.Node("p" + p);
                pn.setContentSize(TW, TH);
                pn.setPosition(-perW / 2 + TW / 2 + p * (TW + TGAP), 0);
                item.addChild(pn);
                var sp = pn.addComponent(cc.Sprite);
                sp.spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID("B_", pais[p]);
                sp.sizeMode = cc.Sprite.SizeMode.CUSTOM;
            }
        }
        this._chiPanel = panel;
    },

    hideChiPanel:function(){
        if(this._chiPanel && cc.isValid(this._chiPanel)){
            this._chiPanel.destroy();
        }
        this._chiPanel = null;
    },

    onChiItemClicked:function(event){
        var pais = event.target.paiList;
        if(pais){
            cc.vv.net.send("chi", pais);
        }
        this.hideChiPanel();
        this.hideOptions();
    },

    //碰杠过胡 点击事件
    onOptionClicked:function(event){
        var btn = this._findBtnNode(event);
        console.log("[ZJZX] onOptionClicked btn=" + (btn ? btn.name : "null"));
        if(btn == null){ return; }
        var name = btn.name;
        if(name == "btnChi"){
            //吃：进入/取消手牌二选模式，不隐藏操作栏，可改选碰/杠/胡/过
            if(this._chiSelect){
                this.cancelChiSelect();
            }
            else{
                this.enterChiSelect(btn.pai);
            }
            return;
        }
        this.cancelChiSelect();
        if(name == "btnPeng"){
            cc.vv.net.send("peng");
        }
        else if(name == "btnGang"){
            cc.vv.net.send("gang", btn.pai);
        }
        else if(name == "btnHu" || name == "btnQiangJin"){
            //自选麻将:点胡后隐藏操作栏,等待服务端推财神方案面板
            this.hideOptions();
            cc.vv.net.send("hu");
        }
        else if(name == "btnYouJin"){
            //漳浦:弹出候选牌选择面板,选一张打出并宣告游金
            var cur = cc.vv.gameNetMgr.curaction;
            var yj = (cur && cur.youjin) ? cur.youjin : (this._lastYoujin || []);
            this._lastYoujin = yj;
            this.showYoujinPanel(yj);
            return; //不隐藏操作栏,等选牌后一并收起
        }
        else if(name == "btnYouJinGo"){
            cc.vv.net.send("youjin_go");
            this.hideOptions();
        }
        else if(name == "btnGuo"){
            cc.vv.net.send("guo");
            //过后立即收起操作栏(连带全屏遮罩),否则操作栏残留会挡住后续手牌点击
            this.hideOptions();
        }
    },

    update: function (dt) {
    },

    // ========== 自选财神面板 ==========
    initCaishenPlanPanel:function(){
        var root = this.node.getChildByName("caishenPlanPanel");
        if(root == null){
            var gameChild = this.node.getChildByName("game");
            if(gameChild){ root = gameChild.getChildByName("caishenPlanPanel"); }
        }
        if(root){
            this._caishenPlanPanel = root;
            root.active = false;
            //按钮走场景内 clickEvents 绑定(btnQihu→onQihuClicked, btnSetCaishen→onSetCaishenClicked),代码不再重复绑定
        }
    },

    _mjIdToName:function(id){
        if(id == null || id < 0){ return "?"; }
        var wan = ["一万","二万","三万","四万","五万","六万","七万","八万","九万"];
        var tong = ["一筒","二筒","三筒","四筒","五筒","六筒","七筒","八筒","九筒"];
        var tiao = ["一条","二条","三条","四条","五条","六条","七条","八条","九条"];
        var feng = ["东","南","西","北"];
        var jian = ["中","发","白"];
        if(id < 9){ return wan[id]; }
        if(id < 18){ return tong[id - 9]; }
        if(id < 27){ return tiao[id - 18]; }
        if(id < 31){ return feng[id - 27]; }
        if(id < 34){ return jian[id - 31]; }
        return "?";
    },

    showCaishenPlanPanel:function(){
        console.log('[ZJZX] showCaishenPlanPanel called! _pendingPlans=', JSON.stringify(this._pendingPlans));
        if(!this._caishenPlanPanel){
            var root = this.node.getChildByName("caishenPlanPanel");
            if(root == null){
                var gameChild = this.node.getChildByName("game");
                if(gameChild){ root = gameChild.getChildByName("caishenPlanPanel"); }
            }
            console.log('[ZJZX] caishenPlanPanel lookup: root=', !!root, 'this.node.name=', this.node.name);
            if(root){ this._caishenPlanPanel = root; }
            else { console.error("[ZJZX] caishenPlanPanel 节点不存在, 全场景搜索...");
                var all = cc.find("Canvas").children;
                for(var i=0;i<all.length;i++){
                    var hit = all[i].getChildByName && all[i].getChildByName("caishenPlanPanel");
                    if(hit){ console.log('[ZJZX] 找到! 在 Canvas/'+all[i].name); this._caishenPlanPanel = hit; break; }
                }
                if(!this._caishenPlanPanel){ console.error("[ZJZX] 全场景也找不到caishenPlanPanel!"); return; }
            }
        }
        var panel = this._caishenPlanPanel;
        console.log('[ZJZX] panel found, active=', panel.active);
        // 只保留弃胡/确定按钮,其他隐藏
        var hideBtns = ["btnWuCai","btnDanCai","btnShuangCai","btnReselect"];
        for(var i = 0; i < hideBtns.length; ++i){
            var hb = panel.getChildByName(hideBtns[i]);
            if(hb) hb.active = false;
        }
        var setBtn = panel.getChildByName("btnSetCaishen");
        if(setBtn) setBtn.active = true;
        panel.active = true;
        var parent = panel.parent;
        if(parent){ panel.setSiblingIndex(parent.childrenCount - 1); }

        // 台数文字/模式文字/财神牌均为场景固化节点(用户在编辑器中调位置),这里只填数据,不创建不摆位
        var plans = this._pendingPlans || [];
        if(plans.length === 0){ return; }
        var best = plans[0];

        var taiLbl = panel.getChildByName("taiLabel");
        if(taiLbl){
            taiLbl.active = true;
            taiLbl.getComponent(cc.Label).string = "胡" + best.tai + "台";
        }
        var modeLbl = panel.getChildByName("modeLabel");
        if(modeLbl){
            modeLbl.active = true;
            modeLbl.getComponent(cc.Label).string = (best.mode === 0) ? "无财" : ((best.mode === 1) ? "独财" : "双财");
        }
        var setCaishenImg = function(name, mjId){
            var nd = panel.getChildByName(name);
            if(!nd){ return; }
            if(mjId == null || mjId < 0){ nd.active = false; return; }
            nd.active = true;
            nd.getComponent(cc.Sprite).spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID("M_", mjId);
        };
        // 无财→两张全隐藏; 独财→csImg1显示; 双财→两张都显示
        if(best.mode === 0){
            setCaishenImg("csImg1", null);
            setCaishenImg("csImg2", null);
        } else if(best.mode === 1){
            setCaishenImg("csImg1", best.c1);
            setCaishenImg("csImg2", null);
        } else {
            setCaishenImg("csImg1", best.c1);
            setCaishenImg("csImg2", best.c2);
        }
    },

    hideCaishenPlanPanel:function(){
        if(this._caishenPlanPanel){
            this._caishenPlanPanel.active = false;
        }
        this._pendingPlans = null;
        // 清所有财神选择相关状态,防止重进房间/弃胡后残留导致手牌/出牌异常
        this._selectedMJ = null;
        this._chiSelect = null;
        if(this._chiHint) this._chiHint.active = false;
    },

    // 确定:按最高台方案定财神并胡牌
    onSetCaishenClicked:function(){
        var plans = this._pendingPlans || [];
        if(plans.length === 0){ return; }
        var chosen = plans[0];
        this.hideCaishenPlanPanel();
        cc.vv.net.send('hu', {c1: chosen.c1, c2: chosen.c2, mode: chosen.mode});
    },

    // 弃胡
    onQihuClicked:function(){
        this.hideCaishenPlanPanel();
        cc.vv.net.send('guo');
    },

    onDestroy:function(){
        console.log("onDestroy");
        if(cc.vv){
            cc.vv.gameNetMgr.clear();
        }
    }
});
