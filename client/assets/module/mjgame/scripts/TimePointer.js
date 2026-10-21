// 桌中央方位指示+出牌倒计时
// 场景结构: game/arrow(居中) -> pointer 的4个子节点按位置固定: children[0]=下(自家) 1=右 2=上 3=左
// 倒计时秒数由服务端 game_start_push 下发(后台taiRules.chupai_timeout可配,缺省15),超时服务端系统代打
cc.Class({
    extends: cc.Component,

    properties: {
        _arrow:null,
        _pointer:null,
        _timeLabel:null,
        _time:-1,
        _alertTime:-1,
    },

    onLoad: function () {
        var gameChild = this.node.getChildByName("game");
        this._arrow = gameChild.getChildByName("arrow");
        this._pointer = this._arrow.getChildByName("pointer");
        this._timeLabel = this._arrow.getChildByName("lblTime").getComponent(cc.Label);
        this._timeLabel.string = "00";
        this.initPointer();

        var self = this;
        this.node.on('game_begin',function(data){
            self.startTurn();
        });
        this.node.on('game_start',function(data){
            self.startTurn();
        });
        //出牌后轮次推进由摸牌事件确定(turn=摸牌的人),出牌事件也刷新(轮到下家前的过渡)
        this.node.on('game_chupai',function(data){
            self.startTurn();
        });
        this.node.on('game_mopai',function(data){
            self.startTurn();
        });
    },

    //当前轮次开始:指针对准该出牌的方位,倒计时重置
    startTurn:function(){
        this.initPointer();
        if(!this._arrow.active){ return; }
        var sec = cc.vv.gameNetMgr.chupaiTimeout;
        if(sec == null || sec <= 0){ sec = 15; }
        this._time = sec;
        this._alertTime = 3;
    },

    initPointer:function(){
        if(cc.vv == null){
            return;
        }
        //本项目gamestate开局后为"begin"(见GameNetMgr),原为"playing"判断导致方位指示永远不显示
        var turn = cc.vv.gameNetMgr.turn;
        this._arrow.active = cc.vv.gameNetMgr.gamestate == "begin" && turn >= 0;
        if(!this._arrow.active){
            return;
        }
        var localIndex = cc.vv.gameNetMgr.getLocalIndex(turn);
        //pointer子节点位置固定:0=下(自家) 1=右 2=上(对家) 3=左;按方位映射,2人房对家在上
        var side = cc.vv.mahjongmgr.getSide(localIndex);
        var childIdx = 0;
        if(side == "right"){ childIdx = 1; }
        else if(side == "up"){ childIdx = 2; }
        else if(side == "left"){ childIdx = 3; }
        for(var i = 0; i < this._pointer.children.length; ++i){
            this._pointer.children[i].active = i == childIdx;
        }
    },

    update: function (dt) {
        if(this._time > 0){
            this._time -= dt;
            if(this._alertTime > 0 && this._time < this._alertTime){
                cc.vv.audioMgr.playSFX("timeup_alarm.mp3");
                this._alertTime = -1;
            }
            var pre = "";
            if(this._time < 0){
                this._time = 0;
            }

            var t = Math.ceil(this._time);
            if(t < 10){
                pre = "0";
            }
            this._timeLabel.string = pre + t;
        }
    },
});
