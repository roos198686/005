cc.Class({
    extends: cc.Component,

    properties: {
        _sprIcon:null,  
        _zhuang:null,
        _ready:null,
        _offline:null,
        _lblName:null,
        _lblScore:null,
        _scoreBg:null,
        _nddayingjia:null,
        _voicemsg:null,
        
        _chatBubble:null,
        _emoji:null,
        _lastChatTime:-1,
        
        _userName:"",
        _score:0,
        _dayingjia:false,
        _isOffline:false,
        _isReady:false,
        _isZhuang:false,
        _userId:null,
    },

    // use this for initialization
    onLoad: function () {
        if(cc.vv == null){
            return;
        }
        
        this._sprIcon = this.node.getChildByName("icon").getComponent("ImageLoader");
        //头像尺寸/位置/层级以场景内icon节点的设计值为准(80x80、玻璃底层之上),此处不再覆盖
        //获取名字(宽度对齐头像框,字号缩小,不换行,超出部分裁剪隐藏)
        this._lblName = this.node.getChildByName("name").getComponent(cc.Label);
        var iconNode = this.node.getChildByName("icon");
        if(iconNode && this._lblName){
            this._lblName.node.width = iconNode.width + 16;
        }
        if(this._lblName){
            this._lblName.fontSize = Math.min(this._lblName.fontSize, 18);
            this._lblName.lineHeight = this._lblName.fontSize + 2;
            this._lblName.enableWrapText = false;
            this._lblName.overflow = cc.Label.Overflow.CLAMP;
        }
        //获取分数
        this._lblScore = this.node.getChildByName("score").getComponent(cc.Label);
        //获取语音
        this._voicemsg = this.node.getChildByName("voicemsg");
        //获取选派
        this._xuanpai = this.node.getChildByName("xuanpai");
        this.refreshXuanPaiState();
        
        //判断语音出了你是否有其他人在说话
        if(this._voicemsg){
            this._voicemsg.active = false;
        }
        
        if(this._sprIcon && this._sprIcon.getComponent(cc.Button)){
            cc.vv.utils.addClickEvent(this._sprIcon,this.node,"Seat","onIconClicked");    
        }
        
        
        this._offline = this.node.getChildByName("offline");
        
        this._ready = this.node.getChildByName("ready");
        
        //庄标用场景自带zhuang节点;场景里默认active=true,先隐藏,等setZhuang按真实庄家显示
        this._zhuang = this.node.getChildByName("zhuang");
        if(this._zhuang){ this._zhuang.active = false; }
        
        this._scoreBg = this.node.getChildByName("Z_money_frame");
        this._nddayingjia = this.node.getChildByName("dayingjia");
        
        this._chatBubble = this.node.getChildByName("ChatBubble");
        if(this._chatBubble != null){
            this._chatBubble.active = false;            
        }
        
        this._emoji = this.node.getChildByName("emoji");
        if(this._emoji != null){
            this._emoji.active = false;
        }
        
        this.refresh();
        
        if(this._sprIcon && this._userId){
            this._sprIcon.setUserID(this._userId);
        }
    },
    
    onIconClicked:function(){
        var iconSprite = this._sprIcon.node.getComponent(cc.Sprite);
        if(this._userId != null && this._userId > 0){
           var seat = cc.vv.gameNetMgr.getSeatByID(this._userId);
            var sex = 0;
            if(cc.vv.baseInfoMap){
                var info = cc.vv.baseInfoMap[this._userId];
                if(info){
                    sex = info.sex;
                }                
            }
            cc.vv.userinfoShow.show(seat.name,seat.userid,iconSprite,sex,seat.ip);         
        }
    },
    
    refresh:function(){
        if(this._lblName != null){
            this._lblName.string = this._userName;    
        }
        
        if(this._lblScore != null){
            this._lblScore.string = this._score;            
        }        
        
        if(this._nddayingjia != null){
            this._nddayingjia.active = this._dayingjia == true;
        }
        
        if(this._offline){
            this._offline.active = this._isOffline && this._userName != "";
        }
        
        if(this._ready){
            this._ready.active = this._isReady; //首局未开(numOfGames==0)也要显示准备状态,后进入的玩家才能看到前人已准备
        }
        
        if(this._zhuang){
            this._zhuang.active = this._isZhuang;    
        }
        
        this.node.active = this._userName != null && this._userName != ""; 
    },
    
    setInfo(name,score,dayingjia){
        this._userName = name;
        this._score = score;
        if(this._score == null){
            this._score = 0;
        }
        this._dayingjia = dayingjia;
        
        if(this._scoreBg != null){
            this._scoreBg.active = this._score != null;            
        }

        if(this._lblScore != null){
            this._lblScore.node.active = this._score != null;            
        }

        this.refresh();    
    },
    
    setZhuang:function(value){
        this._isZhuang = value;
        if(this._zhuang == null){ this._zhuang = this.node.getChildByName("zhuang"); }
        if(this._zhuang){ this._zhuang.active = value; }
    },

    //老庄(连庄)标识:连庄次数>=1时在庄标下方显示"老庄X"
    setLaoZhuang:function(count){
        var lz = this.node.getChildByName("laozhuang");
        if(lz == null){
            var icon = this.node.getChildByName("icon");
            var bx = icon ? icon.x + 28 : 34;
            var by = icon ? icon.y + 28 : 34;
            lz = new cc.Node("laozhuang");
            lz.setContentSize(90,22);
            lz.setPosition(bx,by - 24);
            this.node.addChild(lz);
            var lbl = lz.addComponent(cc.Label);
            lbl.fontSize = 18;
            lbl.lineHeight = 22;
            lbl.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
            lbl.verticalAlign = cc.Label.VerticalAlign.CENTER;
            lbl.overflow = cc.Label.Overflow.NONE;
            lz.color = cc.color(255,225,120);
            var ol = lz.addComponent(cc.LabelOutline);
            ol.color = cc.color(60,30,0);
            ol.width = 2;
        }
        var show = (count != null && count >= 1);
        lz.active = show;
        if(show){
            var l = lz.getComponent(cc.Label);
            if(l){ l.string = "老庄" + count; }
        }
    },

    setReady:function(isReady){
        this._isReady = isReady;
        if(this._ready){
            this._ready.active = this._isReady; //首局未开(numOfGames==0)也要显示准备状态,后进入的玩家才能看到前人已准备
        }
    },
    
    setID:function(id){
        var idNode = this.node.getChildByName("id");
        if(idNode){
            var lbl = idNode.getComponent(cc.Label);
            lbl.string = "ID:" + id;            
        }
        
        this._userId = id;
        if(this._sprIcon){
            this._sprIcon.setUserID(id); 
        }
    },
    
    setOffline:function(isOffline){
        this._isOffline = isOffline;
        if(this._offline){
            this._offline.active = this._isOffline && this._userName != "";
        }
    },
    
    chat:function(content){
        if(this._chatBubble == null || this._emoji == null){
            return;
        }
        this._emoji.active = false;
        this._chatBubble.active = true;
        this._chatBubble.getComponent(cc.Label).string = content;
        this._chatBubble.getChildByName("New Label").getComponent(cc.Label).string = content;
        this._lastChatTime = 3;
    },
    
    emoji:function(emoji){
        //emoji = JSON.parse(emoji);
        if(this._emoji == null || this._emoji == null){
            return;
        }
        console.log(emoji);
        this._chatBubble.active = false;
        this._emoji.active = true;
        this._emoji.getComponent(cc.Animation).play(emoji);
        this._lastChatTime = 3;
    },
    
    voiceMsg:function(show){
        if(this._voicemsg){
            this._voicemsg.active = show;
        }
    },
    
    refreshXuanPaiState:function(){
        if(this._xuanpai == null){
            return;
        }
        
        this._xuanpai.active = cc.vv.gameNetMgr.isHuanSanZhang;
        if(cc.vv.gameNetMgr.isHuanSanZhang == false){ 
            return;
        }
       
        this._xuanpai.getChildByName("xz").active = false;
        this._xuanpai.getChildByName("xd").active = false;
        
        var seat = cc.vv.gameNetMgr.getSeatByID(this._userId);
        if(seat){
            if(seat.huanpais == null){
                this._xuanpai.getChildByName("xz").active = true;
            }
            else{
                this._xuanpai.getChildByName("xd").active = true;
            }
        }
    },
   
    // called every frame, uncomment this function to activate update callback
    update: function (dt) {
        if(this._lastChatTime > 0){
            this._lastChatTime -= dt;
            if(this._lastChatTime < 0){
                this._chatBubble.active = false;
                this._emoji.active = false;
                this._emoji.getComponent(cc.Animation).stop();
            }
        }
    },
});
