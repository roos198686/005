// Compatible with v1.5.0+: loadResAll 指向 cc.resources.loadDir,避免 cc.loader 弃用警告
// 注意:构建worker环境中 cc.loader/cc.resources 可能不存在,必须判空,否则模块加载失败导致场景里的组件被剔除
if (cc.loader && !cc.loader.loadResAll && cc.resources) {
    cc.loader.loadResAll = cc.resources.loadDir.bind(cc.resources);
}


cc.Class({
    extends: cc.Component,

    properties: {
        // foo: {
        //    default: null,      // The default value will be used only when the component attaching
        //                           to a node for the first time
        //    url: cc.Texture2D,  // optional, default is typeof default
        //    serializable: true, // optional, default is true
        //    visible: true,      // optional, default is true
        //    displayName: 'Foo', // optional
        //    readonly: false,    // optional, default is false
        // },
        _splash:null,    //启动页引导图
        tipLabel:cc.Label,  //加载标签
        _stateStr:'',        //标签文字
        _progress:0.0,      //进度条(显示值,单调递增)
        _targetProgress:0.0,//进度条(真实目标值)
        _isLoading:false,    //是否加载中

    },

    // use this for initialization
    onLoad: function () {
        console.log("[Lodinglogin] onLoad enter");
        //判断是否原生，是否为手机
        if(!cc.sys.isNative ){   //&& cc.sys.isMobile
            //获取canvas节点
            var cvs = this.node.getComponent(cc.Canvas);
            //填充宽高度
            cvs.fitHeight = true;
            cvs.fitWidth = false;
            //宽屏下把加载背景拉伸铺满，去除两侧黑边
            var loadBg = this.node.getChildByName("bg");
            if(loadBg){
                var resizeLoadBg = function(){
                    if(!cc.isValid(loadBg)){ return; }
                    var w = loadBg.getComponent(cc.Widget);
                    if(w){ w.enabled = false; } //关闭残留对齐组件，防止把背景钉在画布边缘
                    var vs = cc.view.getVisibleSize(); var vo = cc.view.getVisibleOrigin(); //实际可见区域尺寸(含黑边外区域)
                    loadBg.setContentSize(vs.width, vs.height);
                    loadBg.setPosition(loadBg.parent.convertToNodeSpaceAR(cc.v2(vo.x + vs.width/2, vo.y + vs.height/2))); //居中到可见区中心
                };
                resizeLoadBg();
                this.scheduleOnce(resizeLoadBg, 0); //延迟一帧重算，避免onLoad时父链矩阵未就位导致定位偏移
                cc.view.setResizeCallback(resizeLoadBg);
            }
        }
        this.initMgr();//初始化各组件脚本
        //标签内容赋值
        this.tipLabel.string = this._stateStr;  
        this._splash = cc.find("Canvas/splash"); //获取引导图
        this._splash.active = false; //去掉白底引导图

    },
    //引导图显示加载
    start:function(){
        console.log("[Lodinglogin] start enter");
        //去掉白底引导图，直接检查版本更新
        this.checkVersion();
    },
    //初始化组件方法
    initMgr:function(){
        cc.vv = {};
        var UserMgr = require("UserMgr");
        cc.vv.userMgr = new UserMgr();   //用户信息
        
        var ReplayMgr = require("ReplayMgr");
        cc.vv.replayMgr = new ReplayMgr();  //重播
        //网络接口
        cc.vv.http = require("HTTP");
        cc.vv.global = require("Global");
        cc.vv.net = require("Net");
        
        var GameNetMgr = require("GameNetMgr");
        cc.vv.gameNetMgr = new GameNetMgr();
        cc.vv.gameNetMgr.initHandlers();
        //anysdk
        var AnysdkMgr = require("AnysdkMgr");
        cc.vv.anysdkMgr = new AnysdkMgr();
        cc.vv.anysdkMgr.init();
        //声音音频控制
        var VoiceMgr = require("VoiceMgr");
        cc.vv.voiceMgr = new VoiceMgr();
        cc.vv.voiceMgr.init();
        
        var AudioMgr = require("AudioMgr");
        cc.vv.audioMgr = new AudioMgr();
        cc.vv.audioMgr.init();
        //工具类
        var Utils = require("Utils");
        cc.vv.utils = new Utils();
        
        cc.args = this.urlParse();
    },
    
    //获取url及url参数
    urlParse:function(){
        var params = {};
        if(window.location == null){
            return params;
        }
        var name,value; 
        var str=window.location.href; //取得整个地址栏
        var num=str.indexOf("?") 
        str=str.substr(num+1); //取得所有参数   stringvar.substr(start [, length ]
        
        var arr=str.split("&"); //各个参数放到数组里
        for(var i=0;i < arr.length;i++){ 
            num=arr[i].indexOf("="); 
            if(num>0){ 
                name=arr[i].substring(0,num);
                value=arr[i].substr(num+1);
                params[name]=value;
            } 
        }
        return params;
    },
    //检查版本更新
    checkVersion:function(){
        var self=this;
        //获得版本
      var onGetVersion=function(ret){
          //如果版本号为空
         if(ret.version==null){
            console.log("error.");
         }
         else{
            cc.vv.SI = ret; //定义si接受ret
            //是否和线上版本一致
            if(ret.version!=cc.VERSION){
               
            }else
            {
                self.startPreloading();
            }
         }
      };
      
      var xhr = null;
      var complete = false;  //请求是否完成
      //定义request回调方法
      var fnRequest = function(){
        self._stateStr = "正在连接服务器";
        xhr = cc.vv.http.sendRequest("/get_serverinfo",null,function(ret){
            xhr = null;
            complete = true;  
            onGetVersion(ret);   //成功取到对象调用方法
        });
        setTimeout(fn,5000);            
    }
    
    //连接失败重新请求
    var fn = function(){
        if(!complete){
            if(xhr){
                xhr.abort();
                self._stateStr = "连接失败，即将重试";
                setTimeout(function(){
                    fnRequest();
                },5000);
            }
            else{
                fnRequest();
            }
        }
    };
    fn();
    },
     
    //版本一致结束加载
    startPreloading:function(){
        this._stateStr = "正在加载资源，请稍候";
        this._isLoading = true;
        var self = this;
        
        cc.loader.onProgress = function ( completedCount, totalCount,  item ){
            //console.log("completedCount:" + completedCount + ",totalCount:" + totalCount );
            if(self._isLoading){
                //totalCount会随依赖发现中途变大导致比值回落,这里只增不减,避免进度回滚
                var p = completedCount/totalCount;
                if(p > self._targetProgress){
                    self._targetProgress = p;
                }
            }
        };
        
        cc.loader.loadResAll("textures", function (err, assets) {
            self.onLoadComplete();
        });      
    },
    //加载完成
    onLoadComplete:function(){
        this._isLoading = false;
        this._progress = 1;
        this._stateStr = "准备登陆";
        cc.director.loadScene("login");
        cc.loader.onComplete = null;
    },

    // called every frame, uncomment this function to activate update callback
    update: function (dt) {
        if(this._stateStr.length == 0){
            return;
        }
        this.tipLabel.string = this._stateStr + ' ';
        if(this._isLoading){
            //显示值向目标值平滑追赶且只增不减,加载到99%后等待真实完成再补满
            if(this._progress < this._targetProgress){
                this._progress = Math.min(this._targetProgress, this._progress + dt * 0.5);
            }
            this.tipLabel.string += Math.floor(this._progress * 100) + "%";   
        }
        else{
            var t = Math.floor(Date.now() / 1000) % 4;
            for(var i = 0; i < t; ++ i){
                this.tipLabel.string += '.';
            }            
        }
    }
    
});
