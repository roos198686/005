//字符串拼接
String.prototype.format = function(args) { 
    //调用的实际参数的个数>0
    if (arguments.length>0) { 
        var result = this; 
        if (arguments.length == 1 && typeof (args) == "object") { 
            for (var key in args) { 
                var reg=new RegExp ("({"+key+"})","g"); 
                result = result.replace(reg, args[key]); 
            } 
        } 
        else { 
            for (var i = 0; i < arguments.length; i++) { 
                if(arguments[i]==undefined) { 
                    return ""; 
                } 
                else { 
                    var reg=new RegExp ("({["+i+"]})","g"); 
                    result = result.replace(reg, arguments[i]); 
                } 
            } 
        } 
        return result; 
    } 
    else { 
        return this; 
    } 
};
 
cc.Class({
    extends: cc.Component,

    properties: {
        // foo: {
        //    default: null,
        //    url: cc.Texture2D,  // optional, default is typeof default
        //    serializable: true, // optional, default is true
        //    visible: true,      // optional, default is true
        //    displayName: 'Foo', // optional
        //    readonly: false,    // optional, default is false
        // },
        // ...
        _mima:null,
        _mimaIndex:0,
    },

    // 初始化
    onLoad: function () {
        if(!cc.sys.isNative){
            var cvs = this.node.getComponent(cc.Canvas); //获取当前节点Canvas
            //填充宽高度
            cvs.fitHeight = true; 
            cvs.fitWidth = false;
            //宽屏下把登录背景拉伸铺满，去除两侧黑边(真实路径 Canvas/global/image/bg)
            var loginBg = this.node.getChildByName("bg");
            if(!loginBg){
                var g = this.node.getChildByName("global");
                var img = g ? g.getChildByName("image") : null;
                loginBg = img ? img.getChildByName("bg") : null;
            }
            if(loginBg){
                var resizeLoginBg = function(){
                    if(!cc.isValid(loginBg)){ return; }
                    var w = loginBg.getComponent(cc.Widget);
                    if(w){ w.enabled = false; } //关闭残留对齐组件，防止把背景钉在画布边缘
                    var vs = cc.view.getVisibleSize(); var vo = cc.view.getVisibleOrigin(); //实际可见区域尺寸(含黑边外区域)
                    loginBg.setContentSize(vs.width, vs.height);
                    loginBg.setPosition(loginBg.parent.convertToNodeSpaceAR(cc.v2(vo.x + vs.width/2, vo.y + vs.height/2))); //居中到可见区中心
                };
                resizeLoginBg();
                this.scheduleOnce(resizeLoginBg, 0); //延迟一帧重算，避免onLoad时父链矩阵未就位导致定位偏移
                cc.view.setResizeCallback(resizeLoginBg);
            }
        }
        //检查cc.vv是否初始化成功 
        if(!cc.vv){
            cc.director.loadScene("loading");
            return;
        }
        //登录前先加载全部游戏资源:进度条展示,加载完才显示登录按钮
        this._initPreloadUI();
        //url 赋值master_url
        cc.vv.http.url = cc.vv.http.master_url;
        //sockect连接模块  参数 事件 方法
        cc.vv.net.addHandler('push_need_create_role',function(){
            console.log("onLoad:push_need_create_role");
            cc.director.loadScene("createrole");   //加载创建用户名场景
        });
        
        cc.vv.audioMgr.playBGM("bgMain.mp3");
        
        this._mima = ["A","A","B","B","A","B","A","B","A","A","A","B","B","B"];
        
        //判断是否原生 是否是windows
        if(!cc.sys.isNative || cc.sys.os == cc.sys.OS_WINDOWS){
            cc.find("Canvas/global/button/btn_yk").active = true;//显示游客登入按钮
        }
    },
    
    start:function(){
      
    },

    //登录前资源预载:进度条加载全部游戏资源,完成后显示登录按钮
    _initPreloadUI:function(){
        var self = this;
        //隐藏登录按钮区,加载完再显示
        var btnRoot = cc.find("Canvas/global/button");
        if(btnRoot){ btnRoot.active = false; this._loginBtnRoot = btnRoot; }
        //进度条UI:优先复用场景里固化的 preloadUI(login.fire),没有才运行时创建
        var root = this.node.getChildByName("preloadUI");
        this._preloadBaked = !!root;
        if(root == null){
            root = new cc.Node("preloadUI");
            this.node.addChild(root);
            root.setPosition(0,-140);
            var tipN = new cc.Node("tip");
            tipN.setPosition(0,34);
            root.addChild(tipN);
            var tip = tipN.addComponent(cc.Label);
            tip.string = "资源加载中...";
            tip.fontSize = 24;
            tip.lineHeight = 30;
            var bgN = new cc.Node("barBg");
            bgN.setContentSize(520,24);
            root.addChild(bgN);
            var fillN0 = new cc.Node("barFill");
            fillN0.setPosition(-250,0);
            root.addChild(fillN0);
            var pctN = new cc.Node("pct");
            pctN.setPosition(0,-34);
            root.addChild(pctN);
            var pct0 = pctN.addComponent(cc.Label);
            pct0.string = "0%";
            pct0.fontSize = 22;
            pct0.lineHeight = 26;
        }
        root.active = true;
        root.setPosition(0,-140); //统一在协议行上方,防旧场景残留重叠
        //条底:场景已挂Sprite(bg4圆角底)则直接用;没有才用Graphics画深色圆角+金边
        var barBg = root.getChildByName("barBg");
        barBg.setContentSize(520,30); //用户手绘绿底圆角条458x30
        if(barBg.getComponent(cc.Sprite) == null){
            var g = barBg.getComponent(cc.Graphics) || barBg.addComponent(cc.Graphics);
            g.clear();
            g.fillColor = cc.color(0,0,0,160);
            g.roundRect(-260,-12,520,24,12);
            g.fill();
            g.strokeColor = cc.color(255,215,120);
            g.lineWidth = 2;
            g.roundRect(-260,-12,520,24,12);
            g.stroke();
        }
        //填充条(左对齐,随进度增长):有Sprite则改宽度,否则Graphics绘制
        var fillN = root.getChildByName("barFill");
        this._loadFillNode = fillN;
        this._loadFillSprite = fillN.getComponent(cc.Sprite);
        this._loadFill = this._loadFillSprite ? null : (fillN.getComponent(cc.Graphics) || fillN.addComponent(cc.Graphics));
        if(this._loadFillSprite == null){ fillN.setPosition(-250,0); }
        this._loadFillW = 520; //填充条满宽=条底宽(白条完全覆盖绿底即100%)
        //百分比文字
        this._loadPct = root.getChildByName("pct").getComponent(cc.Label);
        this._drawLoadProgress(0);
        //预载所有资源目录(script已在包内,无需加载)
        var dirs = ["images","textures","sounds","prefabs"];
        var stat = {};
        var done = 0;
        dirs.forEach(function(d){
            stat[d] = {c:0,t:0};
            cc.resources.loadDir(d, function(c,t){
                stat[d].c = c; stat[d].t = t;
                var ac = 0, at = 0;
                for(var k in stat){ ac += stat[k].c; at += stat[k].t; }
                self._drawLoadProgress(at > 0 ? ac / at : 0);
            }, function(err){
                if(err){ console.log("[预载]目录加载失败:" + d, err); }
                done++;
                if(done >= dirs.length){ self._onAllResLoaded(); }
            });
        });
    },

    _drawLoadProgress:function(p){
        //4个目录并行加载,各自total随依赖发现中途变大,合并比值会回落;进度只增不减
        this._loadMaxP = Math.max(this._loadMaxP || 0, p);
        p = this._loadMaxP;
        if(this._loadFillSprite){
            //Sprite版:左锚点改宽度(编辑器里可见)
            this._loadFillNode.width = Math.max(0.01, this._loadFillW * p);
        }
        else if(this._loadFill){
            var g = this._loadFill;
            g.clear();
            var w = Math.max(0.01, this._loadFillW * p);
            g.fillColor = cc.color(220,60,60);
            g.roundRect(0,-8,w,16,8);
            g.fill();
        }
        if(this._loadPct){ this._loadPct.string = Math.floor(p * 100) + "%"; }
    },

    _onAllResLoaded:function(){
        this._drawLoadProgress(1);
        var ui = this.node.getChildByName("preloadUI");
        if(ui){
            //场景固化的只隐藏(重进场景自动恢复),运行时建的才销毁
            if(this._preloadBaked){ ui.active = false; }
            else{ ui.destroy(); }
        }
        if(this._loginBtnRoot){ this._loginBtnRoot.active = true; } //加载完才显示登录按钮
    },
    
    //游客登录按钮点击方法
    onBtnQuickStartClicked:function(){
        cc.vv.userMgr.guestAuth();  //调用游客登入
        cc.vv.audioMgr.playSFX("button.mp3");
    },
    

    //按钮密码点击方法
    onBtnMIMAClicked:function(event){
        if(this._mima[this._mimaIndex] == event.target.name){
            this._mimaIndex++;
            if(this._mimaIndex == this._mima.length){
                cc.find("Canvas/global/button/btn_yk").active = true;
            }
        }
        else{
            console.log("oh ho~~~");
            this._mimaIndex = 0;
        }
    }

    // called every frame, uncomment this function to activate update callback
    // update: function (dt) {

    // },
});