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
        // ...
        _reconnect:null,
        _lblTip:null,
        _lastPing:0,
    },

    // use this for initialization
    onLoad: function () {
        this._reconnect = cc.find("Canvas/reconnect");
        this._lblTip = cc.find("Canvas/reconnect/tip").getComponent(cc.Label);
        var self = this;

        //重连失败(房间已销毁/服务重启):清残留并回到来源页(俱乐部进桌回俱乐部,大厅进桌回大厅)
        var goBack = function(){
            console.log("[reconnect] 无法回到原牌局,返回来源页");
            if(cc.vv.gameNetMgr){ cc.vv.gameNetMgr.clearRoomState(); }
            cc.vv.userMgr.oldRoomId = null;
            if(cc.vv.wc && cc.vv.wc.hide){ cc.vv.wc.hide(); }
            cc.director.loadScene(cc.vv.fromClubId ? "club" : "hall");
        };

        //断线恢复:直接重新进入原房间(服务端保留座位),登录成功后由login_finished加载对应玩法场景
        //并补发当前牌局状态,玩家回到断线前的牌面,而不是被丢回俱乐部/大厅列表
        var tryReconnect = function(){
            var roomId = cc.vv.userMgr.oldRoomId;
            if(roomId == null){ goBack(); return; }
            cc.vv.userMgr.enterRoom(roomId, function(ret){
                if(ret == null || ret.errcode !== 0){
                    goBack();
                }
            });
        };

        var fnTestServerOn = function(){
            cc.vv.net.test(function(ret){
               if(ret){
                    tryReconnect();
               }
               else{
                   setTimeout(fnTestServerOn,3000);
               }
            });
        }

        var fn = function(data){
            self.node.off('disconnect',fn);
            self._reconnect.active = true;
            fnTestServerOn();
        };
        this.node.on('disconnect',fn);
    },
    // called every frame, uncomment this function to activate update callback
    update: function (dt) {
        if(this._reconnect.active){
            var t = Math.floor(Date.now() / 1000) % 4;
            this._lblTip.string = "与服务器断开连接，正在尝试重连";
            for(var i = 0; i < t; ++ i){
                this._lblTip.string += '.';
            }
        }
    },
});
