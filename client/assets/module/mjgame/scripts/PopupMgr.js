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
        _popuproot:null,
        _settings:null,
        _dissolveNotice:null,
        
        _endTime:-1,
        _extraInfo:null,
        _noticeLabel:null,
    },

    // use this for initialization
    onLoad: function () {
        if(cc.vv == null){
            return;
        }
        
        cc.vv.popupMgr = this;
        
        this._popuproot = cc.find("Canvas/popups");
        this._settings = cc.find("Canvas/popups/settings");
        this._dissolveNotice = cc.find("Canvas/popups/dissolve_notice");
        this._noticeLabel = this._dissolveNotice.getChildByName("info").getComponent(cc.Label);
        
        this.closeAll();
        
        this.addBtnHandler("settings/btn_close");
        this.addBtnHandler("settings/btn_sqjsfj");
        this.addBtnHandler("dissolve_notice/btn_agree");
        this.addBtnHandler("dissolve_notice/btn_reject");
        this.addBtnHandler("dissolve_notice/btn_ok");
        
        var self = this;
        this.node.on("dissolve_notice",function(event){
            var data = event.detail;
            self.showDissolveNotice(data);
        });
        
        this.node.on("dissolve_cancel",function(event){
            self.closeAll();
        });
    },
    
    start:function(){
        if(cc.vv.gameNetMgr.dissoveData){
            this.showDissolveNotice(cc.vv.gameNetMgr.dissoveData);
        }
    },
    
    addBtnHandler:function(btnName){
        var btn = cc.find("Canvas/popups/" + btnName);
        this.addClickEvent(btn,this.node,"PopupMgr","onBtnClicked");
    },
    
    addClickEvent:function(node,target,component,handler){
        var eventHandler = new cc.Component.EventHandler();
        eventHandler.target = target;
        eventHandler.component = component;
        eventHandler.handler = handler;

        var clickEvents = node.getComponent(cc.Button).clickEvents;
        clickEvents.push(eventHandler);
    },
    
    onBtnClicked:function(event){
        this.closeAll();
        var btnName = event.target.name;
        if(btnName == "btn_agree"){
            cc.vv.net.send("dissolve_agree");
        }
        else if(btnName == "btn_reject"){
            cc.vv.net.send("dissolve_reject");
        }
        else if(btnName == "btn_sqjsfj"){
            //"申请解散房间"按钮:未开局时点击即整房解散(服务端踢出所有人+销毁房间+牌桌清零);
            //已开局必须走投票解散(原有功能):发给服务端dissolve_request,对家同意后才解散
            if(cc.vv.gameNetMgr && cc.vv.gameNetMgr.gamestate == "begin"){
                cc.vv.net.send("dissolve_request");
            }
            else{
                cc.vv.net.send("exit_release");
            }
        }
    },
    
    closeAll:function(){
        this._fitPopupRoot(); //宽屏下先拉伸遮罩再显示,避免两侧遮不住
        this._popuproot.active = false;
        this._settings.active = false;
        this._dissolveNotice.active = false;
    },

    //弹窗根节点(遮罩)拉伸到实际可见区,宽屏下也能全屏遮挡
    _fitPopupRoot:function(){
        if(!this._popuproot){ return; }
        var vs = cc.view.getVisibleSize();
        var vo = cc.view.getVisibleOrigin();
        this._popuproot.setContentSize(vs.width, vs.height);
        this._popuproot.setPosition(this._popuproot.parent.convertToNodeSpaceAR(cc.v2(vo.x + vs.width/2, vo.y + vs.height/2)));
    },
    
    showSettings:function(){
        this.closeAll();
        this._popuproot.active = true;
        this._settings.active = true;
    },
    
    showDissolveRequest:function(){
        this.closeAll();
        this._popuproot.active = true;
    },
    
    showDissolveNotice:function(data){
        this._endTime = Date.now()/1000 + data.time;
        this._extraInfo = "";
        for(var i = 0; i < data.states.length; ++i){
            var b = data.states[i];
            var name = cc.vv.gameNetMgr.seats[i].name;
            if(b){
                this._extraInfo += "\n[已同意] "+ name;
            }
            else{
                this._extraInfo += "\n[待确认] "+ name;
            }
        }
        this.closeAll();
        this._popuproot.active = true;
        this._dissolveNotice.active = true;;
    },
    
    // called every frame, uncomment this function to activate update callback
    update: function (dt) {
        if(this._endTime > 0){
            var lastTime = this._endTime - Date.now() / 1000;
            if(lastTime < 0){
                this._endTime = -1;
            }
            
            var m = Math.floor(lastTime / 60);
            var s = Math.ceil(lastTime - m*60);
            
            var str = "";
            if(m > 0){
                str += m + "分"; 
            }
            
            this._noticeLabel.string = str + s + "秒后房间将自动解散" + this._extraInfo;
        }
    },
});
