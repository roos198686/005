//强制加载JS版socket.io客户端,兼容两种模块包装:
//1.打包bundle:库无导出,执行时通过副作用把window.io设为v2协议客户端(覆盖jsb引擎预置的0.9老协议客户端)
//2.预览/quick-scripts:库通过module.exports导出,需手动把导出对象赋给window.io
//(jsb引擎预置的0.9老客户端与服务端socket.io 2.x不兼容,握手后无法解析导致原生端进房黑屏)
var __jsbio = require("socket-io");
if( __jsbio != null && __jsbio.connect) { window.io = __jsbio; }
 
var Global = cc.Class({
    extends: cc.Component,
    statics: {
        ip:"",
        sio:null,
        isPinging:false,
        fnDisconnect:null,
        handlers:{},
        addHandler:function(event,fn){
            if(this.handlers[event]){
                console.log("event:" + event + "' handler has been registered.");
                return;
            }

            var handler = function(data){
                //console.log(event + "(" + typeof(data) + "):" + (data? data.toString():"null"));
                if(event != "disconnect" && typeof(data) == "string"){
                    data = JSON.parse(data);
                }
                fn(data);
            };
            
            this.handlers[event] = handler; 
            if(this.sio){
                console.log("register:function " + event);
                this.sio.on(event,handler);
            }
        },
        connect:function(fnConnect,fnError) {
            var self = this;
            
            var opts = {
                'reconnection':false,
                'force new connection': true,
                'transports':['websocket', 'polling']
            }
            //jsb无window.location,无协议头的host:port无法被JS版socket.io解析,必须显式补http://
            var url = this.ip;
            if(url.indexOf('://') < 0){ url = 'http://' + url; }
            this.sio = window.io.connect(url,opts);
            this.sio.on('reconnect',function(){
                console.log('reconnection');
            });
            this.sio.on('connect',function(data){
                self.sio.connected = true;
                fnConnect(data);
            });
            
            this.sio.on('disconnect',function(data){
                console.log("disconnect");
                self.sio.connected = false;
                self.close();
            });
            
            this.sio.on('connect_failed',function (){
                console.log('connect_failed');
                if(fnError){ fnError(); }
            });

            this.sio.on('connect_error',function (){
                console.log('connect_error');
                if(fnError){ fnError(); }
            });
            
            for(var key in this.handlers){
                var value = this.handlers[key];
                if(typeof(value) == "function"){
                    if(key == 'disconnect'){
                        this.fnDisconnect = value;
                    }
                    else{
                        console.log("register:function " + key);
                        this.sio.on(key,value);                        
                    }
                }
            }
            
            this.startHearbeat();
        },
        
        startHearbeat:function(){
            this.sio.on('game_pong',function(){
                console.log('game_pong');
                self.lastRecieveTime = Date.now(); 
            });
            this.lastRecieveTime = Date.now();
            var self = this;
            console.log(1);
            if(!self.isPinging){
                console.log(1);
                self.isPinging = true;
                setInterval(function(){
                    console.log(3);
                    if(self.sio){
                        console.log(4);
                        if(Date.now() - self.lastRecieveTime > 10000){
                            self.close();
                        }
                        else{
                            self.ping();
                        }                        
                    }
                },5000);
            }   
        },
        send:function(event,data){
            if(this.sio.connected){
                if(data != null && (typeof(data) == "object")){
                    data = JSON.stringify(data);
                    //console.log(data);              
                }
                this.sio.emit(event,data);                
            }
        },
        
        ping:function(){
            this.send('game_ping');
        },
        
        close:function(){
            console.log('close');
            if(this.sio && this.sio.connected){
                this.sio.connected = false;
                this.sio.disconnect();
                this.sio = null;
            }
            if(this.fnDisconnect){
                this.fnDisconnect();
                this.fnDisconnect = null;
            }
        },
        
        test:function(fnResult){
            var xhr = null;
            var fn = function(ret){
                fnResult(ret.isonline);
                xhr = null;
            }
            
            var arr = this.ip.split(':');
            var data = {
                account:cc.vv.userMgr.account,
                sign:cc.vv.userMgr.sign,
                ip:arr[0],
                port:arr[1],
            }
            xhr = cc.vv.http.sendRequest("/is_server_online",data,fn);
            setTimeout(function(){
                if(xhr){
                    xhr.abort();
                    fnResult(false);                    
                }
            },1500);
            /*
            var opts = {
                'reconnection':false,
                'force new connection': true,
                'transports':['websocket', 'polling']
            }
            var self = this;
            this.testsio = window.io.connect(this.ip,opts);
            this.testsio.on('connect',function(){
                console.log('connect');
                self.testsio.close();
                self.testsio = null;
                fnResult(true);
            });
            this.testsio.on('connect_error',function(){
                console.log('connect_failed');
                self.testsio = null;
                fnResult(false);
            });
            */
        }
    },
});