// 服务器地址：
//   Cocos Creator 预览（浏览器） → 本机 localhost
//   Android 模拟器 → 10.0.2.2（模拟器访问电脑的 localhost 别名）
//   Android 真机连同一 WiFi → 电脑局域网 IP
var _host = "47.239.100.68";
var _isAndroid = false;
if(typeof cc !== "undefined"){
    if(cc.sys && cc.sys.platform === cc.sys.ANDROID){
        _host = "10.0.2.2"; // Android 模拟器
        _isAndroid = true;
    }
}
var URL = "http://" + _host + ":9000";

// 全局 helper：把服务器返回的 127.0.0.1 / localhost 在 Android 上重写成 10.0.2.2
// 统一处理账号服 halladdr、游戏服 ip 等地址字段
function rewriteHost(raw){
    if(typeof raw !== "string" || !raw.length) return raw;
    if(_isAndroid){
        return raw.replace(/127\.0\.0\.1/g, "10.0.2.2").replace(/localhost/g, "10.0.2.2");
    }
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