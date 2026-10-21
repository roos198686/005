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
    },

    // use this for initialization
    onLoad: function () {
        if(!cc.vv){
            return;
        }
        
        var gameChild = this.node.getChildByName("game");
        if(gameChild == null){ return; }
        var myself = gameChild.getChildByName("myself");
        if(myself == null){ return; }
        var pengangroot = myself.getChildByName("penggangs");
        if(pengangroot == null){ return; }
        var realwidth = cc.view.getVisibleSize().width; //实际可见宽度(2.4无cc.director.getVisibleSize,必须用cc.view)
        var scale = realwidth / 1280;
        if(scale < 1){ //仅窄屏时缩放,宽屏保持原始布局防止超出屏幕
            pengangroot.scaleX *= scale;
            pengangroot.scaleY *= scale;
        }
        
        var self = this;
        this.node.on('peng_notify',function(data){
            //刷新所有的牌
            //console.log(data.detail);
            var data = data.detail;
            self.onPengGangChanged(data);
        });
        
        this.node.on('gang_notify',function(data){
            //刷新所有的牌
            //console.log(data.detail);
            var data = data.detail;
            self.onPengGangChanged(data.seatData);
        });

        //吃牌通知（诸暨玩法）
        this.node.on('chi_notify',function(data){
            var data = data.detail;
            self.onPengGangChanged(data);
        });

        this.node.on('game_start',function(data){
            self.onGameBein();
            //开局/重连事件后按座位数据重绘副露(吃/碰/杠)。
            //必须延到下一帧执行:若在本事件回调内同步重绘,onPengGangChanged 抛错会中断 emit 事件链,
            //使同节点其他 game_start 监听(MJGameLDH 手牌渲染)被跳过,出现"重进房间全部牌都看不到"。
            self.scheduleOnce(function(){
                if(!cc.isValid(self.node)){ return; }
                try{
                    var seats = cc.vv.gameNetMgr.seats;
                    for(var i in seats){
                        self.onPengGangChanged(seats[i]);
                    }
                }catch(e){
                    cc.warn('[PengGangs] 重连副露重绘失败: ' + (e && e.message ? e.message : e));
                }
            }, 0);
        });
        
        var seats = cc.vv.gameNetMgr.seats;
        for(var i in seats){
            this.onPengGangChanged(seats[i]);
        }
    },
    
    onGameBein:function(){
        this.hideSide("myself");
        this.hideSide("right");
        this.hideSide("up");
        this.hideSide("left");
    },
    
    hideSide:function(side){
        var gameChild = this.node.getChildByName("game");
        if(gameChild == null){ return; }
        var myself = gameChild.getChildByName(side);
        if(myself == null){ return; }
        var pengangroot = myself.getChildByName("penggangs");
        if(pengangroot){
            for(var i = 0; i < pengangroot.childrenCount; ++i){
                pengangroot.children[i].active = false;
            }            
        }
    },
    
    onPengGangChanged:function(seatData){
        if(seatData == null){ return; }
        if(seatData.angangs == null && seatData.diangangs == null && seatData.wangangs == null && seatData.pengs == null && seatData.chis == null){
            return;
        }
        //座位对象可能被动态替换导致seatindex丢失,用userId兜底定位
        var si = seatData.seatindex;
        if(si == null && seatData.userid != null){
            var seats = cc.vv.gameNetMgr.seats || [];
            for(var k = 0; k < seats.length; ++k){
                if(seats[k] && seats[k].userid == seatData.userid){ si = k; break; }
            }
        }
        if(si == null){ return; }
        var localIndex = cc.vv.gameNetMgr.getLocalIndex(si);
        var side = cc.vv.mahjongmgr.getSide(localIndex);
        var pre = cc.vv.mahjongmgr.getFoldPre(localIndex);

        console.log("onPengGangChanged" + localIndex);

        var gameChild = this.node.getChildByName("game");
        if(gameChild == null){ return; }
        var myself = gameChild.getChildByName(side);
        if(myself == null){ return; }
        var pengangroot = myself.getChildByName("penggangs");
        if(pengangroot == null){ return; }

        for(var i = 0; i < pengangroot.childrenCount; ++i){
            pengangroot.children[i].active = false;
        }
        //初始化杠牌
        var index = 0;

        var gangs = seatData.angangs || [];
        for(var i = 0; i < gangs.length; ++i){
            var mjid = gangs[i];
            this.initPengAndGangs(pengangroot,side,pre,index,mjid,"angang");
            index++;
        }
        var gangs = seatData.diangangs || [];
        for(var i = 0; i < gangs.length; ++i){
            var mjid = gangs[i];
            this.initPengAndGangs(pengangroot,side,pre,index,mjid,"diangang");
            index++;
        }

        var gangs = seatData.wangangs || [];
        for(var i = 0; i < gangs.length; ++i){
            var mjid = gangs[i];
            this.initPengAndGangs(pengangroot,side,pre,index,mjid,"wangang");
            index++;
        }

        //初始化碰牌
        var pengs = seatData.pengs || [];
        for(var i = 0; i < pengs.length; ++i){
            var mjid = pengs[i];
            //碰组真实组成牌(含财神),有则按真实组成渲染,区分真碰/财神碰
            var tiles = (seatData.pengTiles && seatData.pengTiles[i]) || null;
            this.initPengAndGangs(pengangroot,side,pre,index,mjid,"peng",tiles);
            index++;
        }

        //初始化吃牌（诸暨玩法，chis为二维数组）
        var chis = seatData.chis || [];
        for(var i = 0; i < chis.length; ++i){
            this.initChis(pengangroot,side,pre,index,chis[i]);
            index++;
        }
    },

    //吃牌组渲染：3张牌平铺（复用碰预制体，三张都亮牌，无杠背）
    initChis:function(pengangroot,side,pre,index,pais){
        var pgroot = null;
        if(pengangroot.childrenCount <= index){
            if(side == "left" || side == "right"){
                pgroot = cc.instantiate(cc.vv.mahjongmgr.pengPrefabLeft);
            }
            else{
                pgroot = cc.instantiate(cc.vv.mahjongmgr.pengPrefabSelf);
            }

            pengangroot.addChild(pgroot);
        }
        else{
            pgroot = pengangroot.children[index];
            pgroot.active = true;
        }

        if(side == "left"){
            pgroot.y = -(index * 25 * 3);
        }
        else if(side == "right"){
            pgroot.y = (index * 25 * 3);
            pgroot.zIndex = -index;
        }
        else if(side == "myself"){
            pgroot.x = index * 55 * 3 + index * 10;
        }
        else{
            pgroot.x = -(index * 55*3);
        }

        var sprites = pgroot.getComponentsInChildren(cc.Sprite);
        var pi = 0;
        for(var s = 0; s < sprites.length; ++s){
            var sprite = sprites[s];
            if(sprite.node.name == "gang"){
                sprite.node.active = false; //吃牌无杠背
            }
            else{
                var mj = (pi < pais.length) ? pais[pi] : pais[pais.length - 1];
                sprite.spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID(pre,mj);
                pi++;
            }
        }
    },
    
    initPengAndGangs:function(pengangroot,side,pre,index,mjid,flag,tiles){
        var pgroot = null;
        if(pengangroot.childrenCount <= index){
            if(side == "left" || side == "right"){
                pgroot = cc.instantiate(cc.vv.mahjongmgr.pengPrefabLeft);
            }
            else{
                pgroot = cc.instantiate(cc.vv.mahjongmgr.pengPrefabSelf);
            }
            
            pengangroot.addChild(pgroot);    
        }
        else{
            pgroot = pengangroot.children[index];
            pgroot.active = true;
        }
        
        if(side == "left"){
            pgroot.y = -(index * 25 * 3);                    
        }
        else if(side == "right"){
            pgroot.y = (index * 25 * 3);
            pgroot.zIndex = -index;
        }
        else if(side == "myself"){
            pgroot.x = index * 55 * 3 + index * 10;                    
        }
        else{
            pgroot.x = -(index * 55*3);
        }

        var sprites = pgroot.getComponentsInChildren(cc.Sprite);
        var pi = 0; //碰组真实组成的渲染索引(仅peng且有tiles时使用)
        for(var s = 0; s < sprites.length; ++s){
            var sprite = sprites[s];
            if(sprite.node.name == "gang"){
                var isGang = flag != "peng";
                sprite.node.active = isGang;
                sprite.node.scaleX = 1.0;
                sprite.node.scaleY = 1.0;
                if(flag == "angang"){
                    sprite.spriteFrame = cc.vv.mahjongmgr.getEmptySpriteFrame(side);
                    if(side == "myself" || side == "up"){
                        sprite.node.scaleX = 1.4;
                        sprite.node.scaleY = 1.4;
                    }
                }
                else{
                    sprite.spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID(pre,mjid);
                }
            }
            else{
                //碰组有真实组成数据时按实际牌渲染(财神碰会显示出财神),否则三张同牌
                var showMj = (flag == "peng" && tiles && pi < tiles.length) ? tiles[pi] : mjid;
                sprite.spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID(pre,showMj);
                pi++;
            }
        }
    },

    // called every frame, uncomment this function to activate update callback
    // update: function (dt) {

    // },
});
