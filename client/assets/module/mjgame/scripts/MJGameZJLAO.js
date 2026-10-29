// 诸暨赖倒胡（翻财神，无台数门槛，推倒胡）游戏主脚本
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
        _dealAnimating:false, //开局发牌动画播放中(期间屏蔽自己手牌触摸)
        _dealAnimNodes:null,  //发牌动画节点最终状态备份(取消时瞬间归位用)
        _dealAnimId:0,        //发牌动画令牌(防止过期的结束回调误清状态)
    },

    onLoad: function () {
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
        //加载以下脚本（诸暨玩法无定缺/换三张）;组件已固化到场景,存在则跳过避免重复挂载
        var deps = ["NoticeTip","GameOver","PengGangs","MJRoom","TimePointer","GameResult","Chat","Folds","ReplayCtrl","PopupMgr","ReConnect","Voice","UserInfoShow"];
        for(var di = 0; di < deps.length; ++di){
            if(this.getComponent(deps[di]) == null){
                this.addComponent(deps[di]);
            }
        }
        //初始化
        this.initView();
        this.initEventHandlers();

        this.gameRoot.active = false;
        this.prepareRoot.active = true;
        this.initWanfaLabel();
        this.onGameBeign();
        this.initCaishenTip(); //场景加载时若已开局(错过game_start事件)也补绘财神
        cc.vv.audioMgr.playBGM("bgFight.mp3");
    },

    //初始化
    initView:function(){
        //game节点
        var gameChild = this.node.getChildByName("game");
        //mj剩余数和剩余局数
        this._mjcount = gameChild.getChildByName('mjcount').getComponent(cc.Label);
        this._mjcount.string = "剩余" + cc.vv.gameNetMgr.numOfMJ + "张";
        this._gamecount = gameChild.getChildByName('gamecount').getComponent(cc.Label);
        this._gamecount.string = "" + cc.vv.gameNetMgr.numOfGames + "/" + cc.vv.gameNetMgr.maxNumOfGames + "局";
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
        //场景复制自ldh,其中12张手牌Button的点击事件组件名仍指向MJGameLDH(本场景Canvas挂的是MJGameZJLAO),
        //运行时找不到组件导致点击无效;统一重绑到本脚本(仅修事件引用,不动场景结构)
        for(var i = 0; i < this._myMJArr.length; ++i){
            var tileNode = this._myMJArr[i].node;
            var tileBtn = tileNode.getComponent(cc.Button);
            if(tileBtn == null){ continue; }
            var eh = new cc.Component.EventHandler();
            eh.target = this.node;
            eh.component = "MJGameZJLAO";
            eh.handler = "onMJClicked";
            eh.customEventData = "";
            tileBtn.clickEvents = [eh];
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
                this.scheduleOnce(function(){
                    if(!cc.isValid(evtNode)){ return; }
                    evtNode.emit('game_num',{detail:nm.numOfGames});
                    evtNode.emit('mj_count',{detail:null});
                    evtNode.emit('game_start',{detail:null});
                    //兜底:开局操作(如天胡)事件若在监听器绑定前到达被丢弃,此处补发确保胡/碰/杠按钮一定显示
                    if(nm.curaction){
                        var action = nm.curaction;
                        nm.curaction = null;
                        evtNode.emit('game_action',{detail:action});
                    }
                },0);
            }
        }

        var self = this;
        //开始（zj协议开局完整座位数据）
        this.node.on('game_start',function(data){
            //onGameBeign任何异常都不能影响财神区刷新,否则财神永远不显示
            try{ self.onGameBeign(true, data && data.detail); }catch(e){ console.error('[ZJLAO] onGameBeign error:', e); }
            self.initCaishenTip();
        });

        this.node.on('game_begin',function(data){
            self.onGameBeign();
        });

        //出牌轮次切换
        this.node.on('game_chupai',function(data){
            data = data.detail;
            if(!data){ return; }
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
                //自己摸牌：手牌已由服务端holds覆盖，直接重排(末张为摸到的牌)
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
        if(btn){
            //场景固化的btnChi首用时补挂点击事件,防重复绑定
            if(!btn._chiBound){
                btn._chiBound = true;
                cc.vv.utils.addClickEvent(btn, this.node, "MJGameZJLAO", "onOptionClicked");
            }
            return btn;
        }
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
        cc.resources.load("images/other/btn_red3", cc.SpriteFrame, function(err, frame){
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
        cc.vv.utils.addClickEvent(btn, this.node, "MJGameZJLAO", "onOptionClicked");
        btn.active = false;
        return btn;
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
            }
        }
        this.hideChiPanel();
        this.cancelChiSelect();
    },
    //显示动作
    showAction:function(data){
        if(this._options.active){
            this.hideOptions();
        }

        if(data && (data.hu || data.gang || data.peng || data.chi)){
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
            //"过"按钮常驻，便于跳过任意可选操作
            var btnGuo = this._options.getChildByName("btnGuo");
            if(btnGuo){ btnGuo.active = true; }
        }
    },
    //加载玩法
    initWanfaLabel:function(){
        var wanfaNode = cc.find("Canvas/infobar/wanfa") || cc.find("Canvas/infobar/New Sprite/wanfa");
        if(!wanfaNode){ return; }
        var wanfa = wanfaNode.getComponent(cc.Label);
        if(wanfa){ wanfa.string = cc.vv.gameNetMgr.getWanfa(); }
    },

    //财神提示（翻财神模式：开局即显示财神）
    //节点结构在场景文件中(caishenTip下title/cs1/cs2),位置缩放在编辑器里手动调,代码只设牌面与显隐
    initCaishenTip:function(){
        var gameChild = this.node.getChildByName("game");
        if(gameChild == null){ return; }
        var tipNode = gameChild.getChildByName("caishenTip");
        if(tipNode == null){ return; }

        var conf = cc.vv.gameNetMgr.conf;
        var has = conf != null && conf.caishen != null && conf.caishen >= 0;
        tipNode.active = has;
        if(!has){ return; }
        //提到最上层,防止被牌墙/桌面等后加全屏节点盖住导致财神不显示
        tipNode.setSiblingIndex(tipNode.parent.childrenCount - 1);

        var setIcon = function(node, pai){
            var sp = node.getComponent(cc.Sprite);
            //场景里cs1的Sprite组件被禁用(_enabled:false),运行时强制启用,否则财神牌永远不渲染
            if(sp){ sp.enabled = true; sp.spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID("M_", pai); }
        };
        var cs1 = tipNode.getChildByName("cs1");
        if(cs1){ cs1.active = true; setIcon(cs1, conf.caishen); }
        var cs2 = tipNode.getChildByName("cs2");
        if(cs2){
            var has2 = conf.caishen2 != null && conf.caishen2 >= 0;
            cs2.active = has2;
            if(has2){ setIcon(cs2, conf.caishen2); }
        }
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
        //诸暨玩法没有换三张:隐藏左上角换三张占位牌(hp1/hp2/hp3),该位置改用于显示财神
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
            //场景固化14个手牌槽,这里一律先全暗;点亮由 onGameStart/initOtherMahjongs 按真实手牌数负责,
            //否则无对局数据(重进房间/结算后)时会残留显示满手的牌背,看起来像两人各有13张牌
            for(var j = 0; j < holds.childrenCount; ++j){
                holds.children[j].active = false; //只切显隐,贴图/缩放完全由场景控制
            }
        }

        if(cc.vv.gameNetMgr.gamestate == "" && cc.vv.replayMgr.isReplay() == false){
            return;
        }

        this.gameRoot.active = true;
        this.prepareRoot.active = false;
        //开局庄家14张牌时末张(多发的一张)要放摸牌位;非庄家13张不弹,sortHolds内部按张数判断
        this.initMahjongs(true);
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
        this.showChupai();
        if(cc.vv.gameNetMgr.curaction != null){
            this.showAction(cc.vv.gameNetMgr.curaction);
            cc.vv.gameNetMgr.curaction = null;
        }
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
        var known = {btnPeng:1,btnGang:1,btnHu:1,btnGuo:1,btnChi:1};
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

        //财神单独放到手牌最左边
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
            cc.vv.utils.addClickEvent(item, this.node, "MJGameZJLAO", "onChiItemClicked");
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
        else if(name == "btnHu"){
            cc.vv.net.send("hu");
        }
        else if(name == "btnGuo"){
            cc.vv.net.send("guo");
            //过后立即收起操作栏(连带全屏遮罩),否则操作栏残留会挡住后续手牌点击
            this.hideOptions();
        }
    },

    update: function (dt) {
    },

    onDestroy:function(){
        console.log("onDestroy");
        if(cc.vv){
            cc.vv.gameNetMgr.clear();
        }
    }
});
