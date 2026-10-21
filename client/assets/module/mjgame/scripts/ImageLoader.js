function loadImage(url,code,callback){
    cc.assetManager.loadRemote(url,function (err,tex) {
        var spriteFrame = new cc.SpriteFrame(tex, cc.Rect(0, 0, tex.width, tex.height));
        callback(code,spriteFrame);
    });
};

function getBaseInfo(userid,callback){
    if(cc.vv.baseInfoMap == null){
        cc.vv.baseInfoMap = {};
    }

    if(cc.vv.baseInfoMap[userid] != null){
        callback(userid,cc.vv.baseInfoMap[userid]);
    }
    else{
        cc.vv.http.sendRequest('/base_info',{userid:userid},function(ret){
            var url = null;
            if(ret.headimgurl){
               url = ret.headimgurl + ".jpg";
            }
            var info = {
                name:ret.name,
                sex:ret.sex,
                url:url,
            }
            cc.vv.baseInfoMap[userid] = info;
            callback(userid,info);

        },cc.vv.http.master_url);
    }
};

cc.Class({
    extends: cc.Component,

    properties: {
    },

    //onLoad 不做任何布局操作:头像直接设到本节点场景里已有的 Sprite 上
    onLoad: function () {
        this.setupSpriteFrame();
    },

    setUserID:function(userid){
        //Web/Native 都加载真实头像(之前isNative判断导致浏览器里一直显示场景默认占位图)
        if(!userid){
            return;
        }
        if(cc.vv.images == null){
            cc.vv.images = {};
        }

        var self = this;
        getBaseInfo(userid,function(code,info){
           if(info && info.url){
                loadImage(info.url,userid,function (err,spriteFrame) {
                    self._spriteFrame = spriteFrame;
                    self.setupSpriteFrame();
                });
            }
        });
    },

    //只把头像帧设到本节点的 Sprite 上:不新建节点、不改尺寸/位置/锚点/遮罩/圆角
    setupSpriteFrame:function(){
        if(this._spriteFrame){
            var spr = this.node.getComponent(cc.Sprite);
            if(spr){
                spr.spriteFrame = this._spriteFrame;
            }
        }
    },
});
