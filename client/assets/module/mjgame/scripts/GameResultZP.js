cc.Class({
    extends: cc.Component,

    properties: {
        _gameresult:null,
    },

    // use this for initialization
    onLoad: function () {
        if(cc.vv == null){
            return;
        }

        this._gameresult = this.node.getChildByName("game_result");
        if(this._gameresult){
            //弹窗左右收窄:结算底图GameEnd7是九宫格(SLICED),直接改宽度不会变形
            var panel = this._gameresult.getChildByName("GameEnd7");
            if(panel){ panel.setContentSize(880, panel.getContentSize().height); }
        }

        var btnClose = cc.find("Canvas/game_result/btnClose");
        var btnShare = cc.find("Canvas/game_result/btnShare");
        if(btnShare){
            //按钮样式/位置/文字已固化在场景文件中(红底+退出房间),JS只绑定点击事件
            cc.vv.utils.addClickEvent(btnShare,this.node,"GameResultZP","onBtnCloseClicked");
        }
        if(btnClose){
            btnClose.active = false;
        }

        //初始化网络事件监听器
        var self = this;
        this.node.on('game_end',function(data){
            var d = data.detail || {};
            self.onGameEnd(d.endinfo, d.roundHistory);
        });
    },

    //数值转带符号文本:正数加"+",0显示"0"
    signedNum:function(v){
        v = v || 0;
        return v > 0 ? ("+" + v) : ("" + v);
    },

    //结算列表渲染:隐藏场景标题(title)与统计卡片(seats),按行列表显示数据
    //整场(roundHistory):自家/对家两行总成绩 + 每局"自家X 对家Y X家胡T台"明细
    //单局(endinfo):行内含自摸/接炮/点炮/暗杠/明杠/查叫统计
    renderList:function(endinfo, roundHistory){
        if(this._gameresult == null){ return; }
        var root = this._gameresult;
        //隐藏场景自带标题与统计卡片(标题重复、卡片内容重叠,统一改为列表)
        var title = root.getChildByName("title");
        if(title){ title.active = false; }
        var seats = root.getChildByName("seats");
        if(seats){ seats.active = false; }
        var old = root.getChildByName("resultList");
        if(old){ old.destroy(); }

        var info = cc.vv.gameNetMgr.seats;
        if(!info){ return; }
        var maxscore = -1;
        for(var i = 0; i < info.length; ++i){
            if(info[i] && typeof info[i].score == 'number' && info[i].score > maxscore){ maxscore = info[i].score; }
        }

        var box = new cc.Node("resultList");
        root.addChild(box);
        var y = 220;
        //自家/对家都显示:按座位顺序列出,标注身份(大赢家判定按全部座位分数)
        var selfIdx = cc.vv.gameNetMgr.seatIndex;
        for(var i = 0; i < info.length; ++i){
            var s = info[i];
            if(!s){ continue; }
            //score兜底:整场结束时seats数据可能缺score字段,undefined会既显示错又撞背景色
            var sc = (typeof s.score == 'number') ? s.score : 0;
            var isBig = sc > 0 && sc == maxscore;
            var sideTag = (i === selfIdx) ? "[自家] " : "[对家] ";
            //玩家主行
            var txt = (isBig ? "【大赢家】" : "") + sideTag + (s.name || "玩家") + "(" + s.userid + ")";
            if(endinfo && endinfo[i] != null){
                var e = endinfo[i];
                txt += "   自摸" + this.signedNum(e.numzimo)
                     + "  接炮" + this.signedNum(e.numjiepao)
                     + "  点炮" + this.signedNum(e.numdianpao)
                     + "  暗杠" + this.signedNum(e.numangang)
                     + "  明杠" + this.signedNum(e.numminggang)
                     + "  查叫" + this.signedNum(e.numchadajiao);
            }
            txt += "   总成绩:" + this.signedNum(sc);
            y -= this.addListRow(box, txt, 28, y, sc > 0 ? cc.color(40,120,40) : (sc < 0 ? cc.color(170,40,40) : cc.color(90,90,90)));
        }
        //整场结算:每局明细行——自家/对家双方分数 + 本局胡牌方与台数(荒庄只显分数)
        if(roundHistory && roundHistory.length > 0){
            var selfUserId = (selfIdx >= 0 && info[selfIdx]) ? info[selfIdx].userid : -1;
            for(var r = 0; r < roundHistory.length; ++r){
                var rh = roundHistory[r];
                var selfSc = 0, oppSc = 0, winSide = "", winTai = 0, winZimo = false;
                for(var k = 0; k < rh.scores.length; ++k){
                    var it = rh.scores[k];
                    if(it.userid == selfUserId){ selfSc = it.score; } else { oppSc = it.score; }
                    if(it.tai != null){
                        winSide = (it.userid == selfUserId) ? "自家" : "对家";
                        winTai = it.tai;
                        winZimo = !!it.zimo;
                    }
                }
                var line = "第" + rh.index + "局   自家" + this.signedNum(selfSc) + "  对家" + this.signedNum(oppSc);
                if(winSide != ""){
                    line += "   " + winSide + "胡" + winTai + "台" + (winZimo ? "(自摸)" : "");
                }
                y -= this.addListRow(box, line, 22, y, selfSc > 0 ? cc.color(34,120,34) : (selfSc < 0 ? cc.color(180,40,40) : cc.color(120,120,120)));
            }
        }
    },

    //列表行工具:创建一行Label(无描边,浅色底图上用深色字保证可读),返回占用的行高
    addListRow:function(parent, text, fontSize, y, color){
        var row = new cc.Node("row");
        var lb = row.addComponent(cc.Label);
        lb.string = text;
        lb.fontSize = fontSize;
        lb.lineHeight = fontSize + 10;
        lb.overflow = cc.Label.Overflow.NONE;
        lb.enableWrapText = false;
        lb.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
        lb.verticalAlign = cc.Label.VerticalAlign.CENTER;
        row.color = color || cc.color(90,90,90);
        row.setPosition(0, y);
        parent.addChild(row);
        return fontSize + 14;
    },

    //整场结束(无endinfo):仅显示昵称+本次累计总分列表
    showTotalScore:function(){
        this.renderList(null, null);
    },

    //game_end入口:整场结束优先展示每局得分明细+总成绩(roundHistory),无明细时降级
    onGameEnd:function(endinfo, roundHistory){
        if(this._gameresult == null){
            this._gameresult = this.node.getChildByName("game_result");
        }
        if(this._gameresult){ this._gameresult.active = true; }
        if(roundHistory && roundHistory.length > 0){
            //需求:结算列表按局列出每局得分明细(正绿负红),最终总成绩保持显示,不展示全局统计数据
            this.renderList(null, roundHistory);
        }
        else if(endinfo){
            this.renderList(endinfo, null);
        }
        else{
            this.showTotalScore();
        }
    },

    onBtnCloseClicked:function(){
        //点击"退出房间"先通知服务端离开房间,再返回大厅
        if(cc.vv && cc.vv.net && cc.vv.net.send){
            cc.vv.net.send("leave_room");
        }
        cc.vv.fromClub = true; //本次进桌来自俱乐部:直接回独立俱乐部场景(club.fire),由clubScene直达玩法详情页
        cc.director.loadScene("club");
    },

    onBtnShareClicked:function(){
        cc.vv.anysdkMgr.shareResult();
    }
});
