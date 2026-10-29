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
        _folds:null,
    },

    // use this for initialization
    onLoad: function () {
        if(cc.vv == null){
            return;
        }
        
        this.initView();
        this.initEventHandler();
        
        this.initAllFolds();
    },
    
    initView:function(){
        this._folds = {};
        var game = this.node.getChildByName("game");
        var sides = ["myself","right","up","left"];
        for(var i = 0; i < sides.length; ++i){
            var sideName = sides[i];
            var sideRoot = game.getChildByName(sideName);
            if(sideRoot == null){ continue; } //2人场景已删除right/left子树,跳过不存在的方位
            var folds = [];
            var foldRoot = sideRoot.getChildByName("folds");
            for(var j = 0; j < foldRoot.children.length; ++j){
                var n = foldRoot.children[j];
                n.active = false;
                var sprite = n.getComponent(cc.Sprite); 
                sprite.spriteFrame = null;
                folds.push(sprite);            
            }
            this._folds[sideName] = folds; 
        }
        
        this.hideAllFolds();
    },
    
    hideAllFolds:function(){
        for(var k in this._folds){
            var f = this._folds[k];
            for(var i in f){
                f[i].node.active = false;
            }
        }
    },
    
    initEventHandler:function(){
        var self = this;
        this.node.on('game_begin',function(data){
            self.initAllFolds();
        });  
        
        //断线重连补发的事件名是 game_start 而不是 game_begin, 必须监听
        this.node.on('game_start',function(data){
            self.initAllFolds();
        });
        
        this.node.on('game_sync',function(data){
            self.initAllFolds();
        });
        
        //出牌推送的 payload 是 {seatData,pai}，之前直接当成座位数据传入，
        //导致 initFolds 读不到 folds 字段直接 return，弃牌堆永远不刷新
        this.node.on('game_chupai_notify',function(data){
            self.initAllFolds();
        });

        //吃/碰/杠会把被用的牌从出牌方的弃牌堆移除，需要整体重绘
        this.node.on('peng_notify',function(data){
            self.initAllFolds();
        });

        this.node.on('gang_notify',function(data){
            self.initAllFolds();
        });

        this.node.on('chi_notify',function(data){
            self.initAllFolds();
        });

        this.node.on('guo_notify',function(data){
            var d = data.detail;
            if(d && d.seatData){ self.initFolds(d.seatData); }
        });
    },
    
    initAllFolds:function(){
        var seats = cc.vv.gameNetMgr.seats;
        for(var i in seats){
            this.initFolds(seats[i]);
        }
    },
    
    initFolds:function(seatData){
        if(!seatData){ return; } //座位数据为空时直接返回,避免崩溃
        var folds = seatData.folds;
        if(folds == null){
            return;
        }
        var localIndex = cc.vv.gameNetMgr.getLocalIndex(seatData.seatindex);
        var pre = cc.vv.mahjongmgr.getFoldPre(localIndex);
        var side = cc.vv.mahjongmgr.getSide(localIndex);

        var foldsSprites = this._folds[side];
        if(foldsSprites.length == 0){ return; }
        var foldRoot = foldsSprites[0].node.parent;

        //每排槽位数与行高
        var y0 = foldsSprites[0].node.y;
        var perRow = 0;
        for(var t = 0; t < foldsSprites.length; ++t){
            if(Math.abs(foldsSprites[t].node.y - y0) < 1) perRow++;
        }
        if(perRow <= 0){ perRow = foldsSprites.length; }
        var rowH = 0;
        if(perRow < foldsSprites.length){ rowH = foldsSprites[perRow].node.y - y0; }
        if(rowH == 0){ rowH = -40; } //场景只有一排时兜底行高

        //最多3排，超出后从第一排开始叠放，不再无限加排盖住手牌
        var maxSlots = perRow * 3;
        if(maxSlots > foldsSprites.length){
            for(var m = foldsSprites.length; m < maxSlots; ++m){
                var col = m % perRow;
                var row = Math.floor(m / perRow);
                var nn = cc.instantiate(foldsSprites[col].node);
                nn.y = y0 + rowH * row;
                nn.active = false;
                foldRoot.addChild(nn);
                foldsSprites.push(nn.getComponent(cc.Sprite));
            }
        } else {
            maxSlots = foldsSprites.length; //场景自带槽位比3排多，沿用场景槽位
        }

        //清理上一帧的叠放层节点
        if(!this._foldStacks){ this._foldStacks = {}; }
        var oldStacks = this._foldStacks[side] || [];
        for(var s = 0; s < oldStacks.length; ++s){
            if(cc.isValid(oldStacks[s])) oldStacks[s].destroy();
        }
        var stacks = [];
        this._foldStacks[side] = stacks;

        var usedSlots = Math.min(folds.length, maxSlots);
        for(var i = 0; i < folds.length; ++i){
            var slotIdx = i % maxSlots;      //超过3排后回到第一排叠放
            var layer = Math.floor(i / maxSlots); //叠放层数
            var index = slotIdx;
            if(side == "right" || side == "up"){
                index = foldsSprites.length - slotIdx - 1;
            }
            var sprite = foldsSprites[index];
            if(layer == 0){
                sprite.node.active = true;
                this.setSpriteFrameByMJID(pre,sprite,folds[i]);
            } else {
                //叠放层：克隆槽位节点，轻微偏移露出下层边缘，压在上面
                var base = sprite.node;
                var sn = cc.instantiate(base);
                sn.x = base.x;
                sn.y = base.y + layer * 8;
                sn.zIndex = base.zIndex + layer;
                foldRoot.addChild(sn);
                sn.active = true;
                this.setSpriteFrameByMJID(pre, sn.getComponent(cc.Sprite), folds[i]);
                stacks.push(sn);
            }
        }
        for(var i = usedSlots; i < foldsSprites.length; ++i){
            var index = i;
            if(side == "right" || side == "up"){
                index = foldsSprites.length - i - 1;
            }
            var sprite = foldsSprites[index];

            sprite.spriteFrame = null;
            sprite.node.active = false;
        }
    },
    
    setSpriteFrameByMJID:function(pre,sprite,mjid){
        sprite.spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID(pre,mjid);
        sprite.node.active = true;
    },

    // called every frame, uncomment this function to activate update callback
    // update: function (dt) {

    // },
});

