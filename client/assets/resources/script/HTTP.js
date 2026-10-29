// 服务器地址：本地开发走127.0.0.1
var _host = "127.0.0.1";
var _isAndroid = false;
if(typeof cc !== "undefined"){
    if(cc.sys && cc.sys.platform === cc.sys.ANDROID){
        _isAndroid = true; // 仅记录平台，不再改写服务器地址（10.0.2.2 仅模拟器可用，真机会连不上）
    }
}
var URL = "http://" + _host + ":9000";

// 全局 helper：原先把 127.0.0.1 改写成 10.0.2.2，真机无法访问，现统一原样返回
function rewriteHost(raw){
    return raw;
}
if(typeof window !== "undefined"){ window.__rewriteHost = rewriteHost; }


cc.VERSION = 20180108; //版本号
var HTTP = cc.Class({
    extends: cc.Component,
    //静态块基本信息
    statics:{
        sessionId : 0,
        userId : 0,
        master_url:URL,
        url:URL,
        //发送请求  路径 ，数据,handler,额外url
        sendRequest : function(path,data,handler,extraUrl){
            var xhr = cc.loader.getXMLHttpRequest();
            xhr.timeout = 5000;
            var str = "?";
            for(var k in data){
                if(str != "?"){
                    str += "&";
                }
                str += k + "=" + data[k];
            }
            if(extraUrl == null){
                extraUrl = HTTP.url;
            }
            var requestURL = extraUrl + path + encodeURI(str);
            console.log("RequestURL:" + requestURL);
            xhr.open("GET",requestURL, true);
            if (cc.sys.isNative){
                xhr.setRequestHeader("Accept-Encoding","gzip,deflate","text/html;charset=UTF-8");
            }
            
            xhr.onreadystatechange = function() {
                if(xhr.readyState === 4 && (xhr.status >= 200 && xhr.status < 300)){
                    console.log("http res("+ xhr.responseText.length + "):" + xhr.responseText);
                    try {
                        var ret = JSON.parse(xhr.responseText);
                        if(handler !== null){
                            handler(ret);
                        }                        /* code */
                    } catch (e) {
                        console.log("err:" + e);
                        //handler(null);
                    }
                    finally{
                        if(cc.vv && cc.vv.wc){
                        //       cc.vv.wc.hide();
                        }
                    }
                }
                else if(xhr.readyState === 4){
                    //请求失败(超时/服务未启动/接口不存在):cc.vv.alert恒为undefined,改用等待遮罩显示原因
                    console.log("http failed status:" + xhr.status);
                    if(cc.vv && cc.vv.wc && cc.vv.wc.showError){ cc.vv.wc.showError("网络请求失败(" + xhr.status + "),请确认服务已启动"); }
                }
            };

            xhr.onerror = function(){
                console.log("http onerror");
                if(cc.vv && cc.vv.wc && cc.vv.wc.showError){ cc.vv.wc.showError("无法连接服务器,请确认服务已启动"); }
            };

            xhr.ontimeout = function(){
                console.log("http ontimeout");
                if(cc.vv && cc.vv.wc && cc.vv.wc.showError){ cc.vv.wc.showError("请求超时,请重试"); }
            };

            
            if(cc.vv && cc.vv.wc){
                //cc.vv.wc.show();
            }
            xhr.send();
            return xhr;
        },
    },
});