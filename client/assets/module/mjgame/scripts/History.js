//战绩 + 录像回放
//列表:房间 -> 局 两级(场景内 history/viewlist/content 的 HistoryItem 模板)
//回放:独立全屏浮层,上帝视角(四家手牌全明),只保留牌桌与头像,其余按钮全部隐藏
var TYPE_NAMES = {
    "ldh": "赖倒胡",
    "zj_lao": "诸暨赖倒胡",
    "zj_bt": "包麻将",
    "zj_zx": "自选麻将",
    "zj4_zx": "自选麻将(四人)",
    "zj": "翻财神",
    "zp": "翻财神",
    "zp4": "翻财神(四人)",
    "wujin": "五经",
    "guanpai2": "关牌",
    "guanpai3": "关牌"
};

//麻将牌 mjid -> 图集基础帧名
function mjFrameName(mjid){
    if(mjid == null || mjid < 0){ return null; }
    if(mjid < 9){ return "dot_" + (mjid + 1); }
    if(mjid < 18){ return "bamboo_" + (mjid - 8); }
    if(mjid < 27){ return "character_" + (mjid - 17); }
    if(mjid == 27){ return "red"; }
    if(mjid == 28){ return "green"; }
    if(mjid == 29){ return "white"; }
    if(mjid == 30){ return "wind_east"; }
    if(mjid == 31){ return "wind_west"; }
    if(mjid == 32){ return "wind_south"; }
    if(mjid == 33){ return "wind_north"; }
    return null;
}

//牌面文字兜底(图集未加载时使用)
function mjText(mjid){
    var f = mjFrameName(mjid);
    if(f == null){ return "?"; }
    if(f.indexOf("dot_") == 0){ return f.substr(4) + "筒"; }
    if(f.indexOf("bamboo_") == 0){ return f.substr(7) + "条"; }
    if(f.indexOf("character_") == 0){ return f.substr(10) + "万"; }
    var map = {red: "中", green: "发", white: "白", wind_east: "东", wind_west: "西", wind_south: "南", wind_north: "北"};
    return map[f] || "?";
}

//取图集帧:本项目的图集帧名带扩展名,逐个尝试
function getFrame(atlas, name){
    if(atlas == null || name == null){ return null; }
    return atlas.getSpriteFrame(name) || atlas.getSpriteFrame(name + ".png") || atlas.getSpriteFrame(name + ".jpg");
}

cc.Class({
    extends: cc.Component,

    properties: {
    },

    onLoad: function () {
        this.initNodes();
    },

    //节点初始化(幂等):组件可能挂在未激活节点上,onLoad 与首次 open 都可能先到
    initNodes: function () {
        if(this._inited){ return; }
        this._inited = true;
        this._root = this.node.name == "history" ? this.node : this.node.getChildByName("history");
        this._rooms = [];
        this._curRoom = null;
        this._rp = null;
        this._atlas = null;
        this._atlasTried = false;
        this._ready = false;
        if(this._root == null){ return; }

        this._emptyTip = this._root.getChildByName("emptyTip");
        this._viewlist = this._root.getChildByName("viewlist");
        this._content = cc.find("view/content", this._viewlist);
        if(this._content == null || this._content.childrenCount == 0){
            return;   //场景缺少列表模板,不启用
        }
        this._ready = true;
        this._temp = this._content.children[0];   //场景里的 HistoryItem 模板
        this._content.removeChild(this._temp);
        this.clearItemEvents(this._temp);

        var self = this;
        var back = this._root.getChildByName("btn_back");
        if(back){
            back.on(cc.Node.EventType.TOUCH_END, function(){
                if(self._rp){
                    self.closeReplay();
                }
                else if(self._curRoom != null){
                    self._curRoom = null;
                    self.showRooms();
                }
                else{
                    self._root.active = false;
                }
            });
        }
    },

    //==================== 列表 ====================
    open: function(){
        this.initNodes();
        cc.log("[zhanji] open ready=" + this._ready);
        if(!this._ready){ return; }
        this._curRoom = null;
        this.showRooms();
        var self = this;
        cc.log("[zhanji] request list, account=" + cc.vv.userMgr.account);
        cc.vv.http.sendRequest("/get_replay_list", {
            account: cc.vv.userMgr.account,
            sign: cc.vv.userMgr.sign
        }, function(ret){
            cc.log("[zhanji] list ret=" + JSON.stringify(ret && ret.errcode) + " n=" + (ret && ret.list ? ret.list.length : -1));
            if(ret == null || ret.errcode != 0){
                if(cc.vv.wc){ cc.vv.wc.showError("战绩查询失败"); }
                return;
            }
            self._rooms = ret.list || [];
            self.showRooms();
        });
    },

    //模板上的点击事件指向已删除脚本,点击会抛 getComponent: Type must be non-nil
    //并中断同级后续监听,统一清空,改由节点监听处理
    clearItemEvents: function(node){
        var btnOp = node.getChildByName("btnOp");
        var list = [node.getComponent(cc.Button), btnOp ? btnOp.getComponent(cc.Button) : null];
        for(var i = 0; i < list.length; ++i){
            if(list[i]){ list[i].clickEvents = []; }
        }
    },

    dateFormat: function(sec){
        var d = new Date(sec * 1000);
        function pad(n){ return n >= 10 ? n : ("0" + n); }
        return pad(d.getMonth() + 1) + "-" + pad(d.getDate()) + " " + pad(d.getHours()) + ":" + pad(d.getMinutes());
    },

    typeName: function(type){
        return TYPE_NAMES[type] || (type || "对局");
    },

    clearList: function(){
        while(this._content.childrenCount > 0){
            var last = this._content.children[this._content.childrenCount - 1];
            this._content.removeChild(last, true);
        }
    },

    getItem: function(index){
        var node = null;
        if(this._content.childrenCount > index){
            node = this._content.children[index];
        }
        else{
            node = cc.instantiate(this._temp);
            this._content.addChild(node);
        }
        var self = this;
        //整行与右侧按钮都要能点:按钮上的点击会冒泡到行,用时间戳去重避免重复触发
        if(!node._rpBound){
            node._rpBound = true;
            node.on(cc.Node.EventType.TOUCH_END, function(){
                self.onRowClicked(node);
            });
        }
        var btn = node.getChildByName("btnOp");
        if(btn && !btn._rpBound){
            btn._rpBound = true;
            btn.on(cc.Node.EventType.TOUCH_END, function(){
                self.onRowClicked(node);
            });
        }
        return node;
    },

    onRowClicked: function(node){
        var now = Date.now();
        if(node._rpClickTime && now - node._rpClickTime < 200){ return; }
        node._rpClickTime = now;
        cc.log("[zhanji] click row idx=" + node.idx);
        this.onItemClicked(node.idx);
    },

    setItemText: function(node, title, roomNo, time, lines, opText, idx){
        node.idx = idx;
        node.getChildByName("title").getComponent(cc.Label).string = title;
        node.getChildByName("roomNo").getComponent(cc.Label).string = roomNo;
        node.getChildByName("time").getComponent(cc.Label).string = time;
        for(var j = 0; j < 4; ++j){
            var lb = node.getChildByName("info" + j);
            if(lb == null){ continue; }
            lb.getComponent(cc.Label).string = lines[j] || "";
        }
        var btn = node.getChildByName("btnOp");
        btn.idx = idx;
        btn.getChildByName("Label").getComponent(cc.Label).string = opText;
    },

    //第一级:房间
    showRooms: function(){
        this.clearList();
        var data = this._rooms;
        for(var i = 0; i < data.length; ++i){
            var r = data[i];
            var node = this.getItem(i);
            this.setItemText(node, "" + (i + 1), "房间:" + r.roomid, this.dateFormat(r.create_time),
                [this.typeName(r.type), "共" + r.games.length + "局", "", ""], "详情", i);
        }
        this._emptyTip.active = data.length == 0;
        this._curRoom = null;
    },

    //第二级:局
    showGames: function(room){
        this.clearList();
        var games = room.games || [];
        for(var i = 0; i < games.length; ++i){
            var g = games[i];
            var node = this.getItem(i);
            this.setItemText(node, "第" + g.index + "局", "房间:" + room.roomid, this.dateFormat(g.create_time),
                [this.typeName(room.type), "", "", ""], "回放", i);
        }
        this._emptyTip.active = games.length == 0;
        this._curRoom = room;
    },

    onItemClicked: function(idx){
        if(this._curRoom == null){
            var room = this._rooms[idx];
            if(room == null){ return; }
            this.showGames(room);
        }
        else{
            var g = this._curRoom.games[idx];
            if(g == null){ return; }
            this.playReplay(this._curRoom, g.index);
        }
    },

    //==================== 回放 ====================
    playReplay: function(room, index){
        var self = this;
        cc.vv.http.sendRequest("/get_replay", {
            account: cc.vv.userMgr.account,
            sign: cc.vv.userMgr.sign,
            uuid: room.uuid,
            index: index
        }, function(ret){
            if(ret == null || ret.errcode != 0){
                if(cc.vv.wc){ cc.vv.wc.showError("录像不存在或已过期"); }
                return;
            }
            self.buildReplay(ret.replay);
        });
    },

    loadAtlas: function(cb){
        if(this._atlasTried){
            cb(this._atlas);
            return;
        }
        this._atlasTried = true;
        var self = this;
        cc.resources.load("images/MJ/my/Z_my", cc.SpriteAtlas, function(err, atlas){
            self._atlas = err ? null : atlas;
            cb(self._atlas);
        });
    },

    tileFrame: function(mjid){
        if(this._atlas == null){ return null; }
        var base = mjFrameName(mjid);
        if(base == null){ return null; }
        return getFrame(this._atlas, "M_" + base);
    },

    //新建牌面节点:有图集用图,没有就用文字兜底
    makeTile: function(parent, mjid, w, h){
        var node = new cc.Node("tile");
        node.parent = parent;
        node.setContentSize(w, h);
        var spr = node.addComponent(cc.Sprite);
        spr.sizeMode = cc.Sprite.SizeMode.CUSTOM;
        var sf = this.tileFrame(mjid);
        if(sf){
            spr.spriteFrame = sf;
        }
        else{
            node.removeComponent(spr);
            var lb = node.addComponent(cc.Label);
            lb.string = mjText(mjid);
            lb.fontSize = Math.round(h * 0.5);
            lb.lineHeight = h;
            node.color = cc.color(20, 20, 20);
        }
        return node;
    },

    buildReplay: function(data){
        this.closeReplay();
        var canvas = cc.find("Canvas");
        var vs = cc.view.getVisibleSize();

        var root = new cc.Node("replayView");
        root.parent = canvas;
        root.setContentSize(vs.width, vs.height);

        //牌桌底:与游戏内一致的桌面图,四边拉伸铺满
        var bg = new cc.Node("table");
        bg.parent = root;
        bg.setContentSize(vs.width, vs.height);
        var bgSpr = bg.addComponent(cc.Sprite);
        bgSpr.sizeMode = cc.Sprite.SizeMode.CUSTOM;
        this._bgSpr = bgSpr;
        var self = this;
        cc.resources.load("images/atlas/table_bg", cc.SpriteAtlas, function(err, atlas){
            if(!err && atlas){
                bgSpr.spriteFrame = getFrame(atlas, "背景可随意拉伸铺满");
            }
        });

        var rp = {
            root: root,
            data: data,
            players: data.players || [],
            hands: {},
            melds: {},
            folds: {},
            lastDiscard: null,
            hu: null,
            wall: (data.start && data.start.numofmj) || 0,
            idx: 0,
            elapsed: 0,
            playing: true,
            speed: 1,
            winner: -1
        };
        this._rp = rp;

        //上帝视角初始手牌(服务端已合并四家真实手牌)
        for(var i = 0; i < rp.players.length; ++i){
            var p = rp.players[i];
            var h = data.hands && data.hands[p.userid];
            if(!h && data.finalHands){ h = data.finalHands[p.userid]; }
            rp.hands[p.userid] = (h || []).slice();
            rp.melds[p.userid] = [];
            rp.folds[p.userid] = [];
        }

        this.buildSeats(rp, vs);
        this.buildControls(rp, vs);

        //胡牌结果提示(哪家胡、几台)
        var res = new cc.Node("result");
        res.parent = root;
        res.setPosition(0, vs.height / 2 - 34);
        var rl = res.addComponent(cc.Label);
        rl.string = "";
        rl.fontSize = 26;
        rl.lineHeight = 32;
        res.color = cc.color(255, 226, 120);
        rp.resultLabel = rl;

        this.refresh(rp);
        this.loadAtlas(function(){ self.refresh(rp); });
    },

    seatPos: function(rp, i, vs){
        var n = rp.players.length;
        if(n <= 2){
            return i == 0 ? cc.v2(0, -vs.height * 0.30) : cc.v2(0, vs.height * 0.28);
        }
        if(i == 0){ return cc.v2(0, -vs.height * 0.30); }
        if(i == 1){ return cc.v2(vs.width * 0.30, -vs.height * 0.02); }
        if(i == 2){ return cc.v2(0, vs.height * 0.28); }
        return cc.v2(-vs.width * 0.30, -vs.height * 0.02);
    },

    handPos: function(rp, i, vs){
        var n = rp.players.length;
        if(n <= 2){
            return i == 0 ? cc.v2(0, -vs.height * 0.225) : cc.v2(0, vs.height * 0.18);
        }
        if(i == 0){ return cc.v2(0, -vs.height * 0.20); }
        if(i == 1){ return cc.v2(vs.width * 0.16, -vs.height * 0.02); }
        if(i == 2){ return cc.v2(0, vs.height * 0.15); }
        return cc.v2(-vs.width * 0.16, -vs.height * 0.02);
    },

    foldPos: function(rp, i, vs){
        var n = rp.players.length;
        if(n <= 2){
            return i == 0 ? cc.v2(0, -vs.height * 0.05) : cc.v2(0, vs.height * 0.06);
        }
        if(i == 0){ return cc.v2(0, -vs.height * 0.07); }
        if(i == 1){ return cc.v2(vs.width * 0.10, -vs.height * 0.02); }
        if(i == 2){ return cc.v2(0, vs.height * 0.06); }
        return cc.v2(-vs.width * 0.10, -vs.height * 0.02);
    },

    buildSeats: function(rp, vs){
        rp.seatNodes = [];
        rp.handNodes = [];
        rp.foldNodes = [];
        for(var i = 0; i < rp.players.length; ++i){
            var p = rp.players[i];

            var seat = new cc.Node("seat" + i);
            seat.parent = rp.root;
            var sp = this.seatPos(rp, i, vs);
            seat.setPosition(sp.x, sp.y);

            //头像:圆形遮罩 + 真实头像(ImageLoader),缺图时保留圆形底板
            var head = new cc.Node("head");
            head.parent = seat;
            head.setContentSize(60, 60);
            var mask = head.addComponent(cc.Mask);
            mask.type = cc.Mask.Type.ELLIPSE;
            var face = new cc.Node("face");
            face.parent = head;
            face.setContentSize(60, 60);
            var fs = face.addComponent(cc.Sprite);
            fs.sizeMode = cc.Sprite.SizeMode.CUSTOM;
            if(p.userid){
                var il = face.addComponent("ImageLoader");
                if(il){ il.setUserID(p.userid); }
            }

            var nameLb = new cc.Node("name");
            nameLb.parent = seat;
            //上方玩家名字放头像上边,避免压到手牌
            var isTop = (rp.players.length <= 2) ? (i == 1) : (i == 2);
            nameLb.setPosition(0, isTop ? 42 : -46);
            var nl = nameLb.addComponent(cc.Label);
            nl.string = p.name || ("玩家" + (p.userid || ""));
            nl.fontSize = 22;
            nl.lineHeight = 26;
            nameLb.color = cc.color(255, 255, 255);

            var hand = new cc.Node("hand");
            hand.parent = rp.root;
            var hp = this.handPos(rp, i, vs);
            hand.setPosition(hp.x, hp.y);
            rp.handNodes.push(hand);

            var fold = new cc.Node("fold");
            fold.parent = rp.root;
            var fp = this.foldPos(rp, i, vs);
            fold.setPosition(fp.x, fp.y);
            rp.foldNodes.push(fold);

            rp.seatNodes.push(seat);
        }
    },

    buildControls: function(rp, vs){
        var bar = new cc.Node("ctrl");
        bar.parent = rp.root;
        bar.setPosition(0, -vs.height / 2 + 42);
        rp.ctrlBar = bar;

        var self = this;
        var exit = this.makeBtn(bar, "退出", -260, 0, function(){
            self.closeReplay();
        });
        rp.exitBtn = exit;

        rp.playBtn = this.makeBtn(bar, "暂停", -70, 0, function(){
            rp.playing = !rp.playing;
            rp.playBtn.getChildByName("Label").getComponent(cc.Label).string = rp.playing ? "暂停" : "播放";
        });
        rp.speedBtn = this.makeBtn(bar, "1倍速", 60, 0, function(){
            rp.speed = rp.speed == 1 ? 2 : (rp.speed == 2 ? 4 : 1);
            rp.speedBtn.getChildByName("Label").getComponent(cc.Label).string = rp.speed + "倍速";
        });

        var prog = new cc.Node("progress");
        prog.parent = bar;
        prog.setPosition(210, 0);
        var pl = prog.addComponent(cc.Label);
        pl.string = "";
        pl.fontSize = 20;
        pl.lineHeight = 26;
        prog.color = cc.color(255, 255, 255);
        rp.progLabel = pl;

        var wall = new cc.Node("wall");
        wall.parent = bar;
        wall.setPosition(340, 0);
        var wl = wall.addComponent(cc.Label);
        wl.string = "剩余" + rp.wall + "张";
        wl.fontSize = 20;
        wl.lineHeight = 26;
        wall.color = cc.color(255, 255, 255);
        rp.wallLabel = wl;
    },

    makeBtn: function(parent, text, x, y, cb){
        var node = new cc.Node("btn");
        node.parent = parent;
        node.setPosition(x, y);
        node.setContentSize(110, 46);
        var spr = node.addComponent(cc.Sprite);
        spr.sizeMode = cc.Sprite.SizeMode.CUSTOM;
        var self = this;
        cc.resources.load("images/atlas/game_ui", cc.SpriteAtlas, function(err, atlas){
            if(!err && atlas && cc.isValid(node)){
                spr.spriteFrame = getFrame(atlas, "按钮-蓝");
            }
        });
        var lbNode = new cc.Node("Label");
        lbNode.parent = node;
        var lb = lbNode.addComponent(cc.Label);
        lb.string = text;
        lb.fontSize = 20;
        lb.lineHeight = 26;
        lbNode.color = cc.color(255, 255, 255);
        node.on(cc.Node.EventType.TOUCH_END, cb);
        return node;
    },

    closeReplay: function(){
        var rp = this._rp;
        if(rp == null){ return; }
        this._rp = null;
        if(rp.root && cc.isValid(rp.root)){
            rp.root.destroy();
        }
    },

    //==================== 时间轴 ====================
    applyEvent: function(rp, e){
        var d = e.d || {};
        var players = rp.players;
        var bySeat = function(si){
            var p = players[si];
            return p ? p.userid : null;
        };
        var byUser = function(uid){
            for(var i = 0; i < players.length; ++i){
                if(players[i].userid == uid){ return players[i]; }
            }
            return null;
        };

        switch(e.e){
            case "game_mopai_push": {
                var p1 = bySeat(d.si);
                if(p1 != null){
                    //摸牌者的那份带完整手牌,直接同步;其它家那份只有牌墙数量
                    if(d.holds != null && typeof d.holds != "number" && d.holds.slice){
                        rp.hands[p1] = d.holds.slice();
                    }
                    else if(d.pai != null && d.pai >= 0 && rp.hands[p1]){
                        rp.hands[p1].push(d.pai);
                    }
                }
                if(d.numofmj != null){ rp.wall = d.numofmj; }
                break;
            }
            case "game_chupai_push": {
                var p2 = bySeat(d.si);
                if(p2 != null && d.pai != null){
                    if(rp.folds[p2]){ rp.folds[p2].push(d.pai); }
                    var h2 = rp.hands[p2];
                    if(h2){
                        var k = h2.indexOf(d.pai);
                        if(k >= 0){ h2.splice(k, 1); }
                    }
                    rp.lastDiscard = {uid: p2, pai: d.pai};
                }
                break;
            }
            case "game_chupai_notify_push": {
                //通知包里有出牌者的完整手牌,直接同步,避免多吃多碰造成的偏差
                var pu = byUser(d.userId);
                if(pu != null && d.holds != null && d.holds.length != null && typeof d.holds != "number"){
                    rp.hands[pu.userid] = d.holds.slice();
                }
                break;
            }
            //碰/杠/吃:服务端对两家各发一份,只有操作者那份 holds 是数组,
            //用数组那份同步手牌并记录副露,否则手牌数量会越打越多
            case "game_peng_push":
            case "game_gang_push": {
                var pa = bySeat(d.si);
                if(pa != null && d.holds != null && typeof d.holds != "number"){
                    rp.hands[pa] = d.holds.slice();
                    rp.melds[pa].push({t: e.e == "game_peng_push" ? "peng" : "gang", pai: d.pai});
                    this.takeDiscard(rp, d.pai);
                }
                break;
            }
            case "game_chi_push": {
                var pc = bySeat(d.si);
                if(pc != null && d.holds != null && typeof d.holds != "number"){
                    rp.hands[pc] = d.holds.slice();
                    rp.melds[pc].push({t: "chi", pais: d.pais || []});
                    for(var ci = 0; ci < (d.pais || []).length; ++ci){
                        if(this.takeDiscard(rp, d.pais[ci])){ break; }
                    }
                }
                break;
            }
            case "game_hu_push": {
                rp.winner = d.si != null ? d.si : -1;
                rp.hu = {si: rp.winner, tai: d.tai || 0, zimo: !!d.zimo};
                var pw = bySeat(rp.winner);
                if(pw != null && !d.zimo && rp.lastDiscard && rp.lastDiscard.pai == d.pai){
                    this.takeDiscard(rp, d.pai);          //点炮:胡的那张从放炮者弃牌里拿走
                    if(rp.hands[pw]){ rp.hands[pw].push(d.pai); }
                }
                break;
            }
            case "game_over_push":
                //结算包里有各家最终手牌与副露,以它为准纠正整局累计偏差
                this.syncFinal(rp, d.results || []);
                rp.playing = false;
                if(rp.playBtn){
                    rp.playBtn.getChildByName("Label").getComponent(cc.Label).string = "播放";
                }
                break;
        }
    },

    //把某张牌从弃牌区拿走(被碰/吃/杠/胡),返回是否找到
    takeDiscard: function(rp, pai){
        if(rp.lastDiscard == null || rp.lastDiscard.pai != pai){ return false; }
        var folds = rp.folds[rp.lastDiscard.uid];
        if(folds){
            var last = folds.lastIndexOf(pai);
            if(last >= 0){ folds.splice(last, 1); }
        }
        rp.lastDiscard = null;
        return true;
    },

    syncFinal: function(rp, results){
        for(var i = 0; i < results.length; ++i){
            var r = results[i];
            var uid = r.userid;
            if(rp.hands[uid] == null){ continue; }
            if(r.holds){ rp.hands[uid] = r.holds.slice(); }
            if(r.folds){ rp.folds[uid] = r.folds.slice(); }
            var melds = [];
            var chis = r.chis || [];
            for(var c = 0; c < chis.length; ++c){ melds.push({t: "chi", pais: chis[c]}); }
            var pengs = r.pengs || [];
            for(var p = 0; p < pengs.length; ++p){ melds.push({t: "peng", pai: pengs[p]}); }
            var gangs = (r.angangs || []).concat(r.diangangs || []).concat(r.wangangs || []);
            for(var g = 0; g < gangs.length; ++g){ melds.push({t: "gang", pai: gangs[g]}); }
            rp.melds[uid] = melds;
            //兜底取胡牌者与台数
            var hu = r.huinfo && r.huinfo[0];
            if(hu && hu.ishupai && rp.hu == null){
                rp.hu = {si: i, tai: hu.fan || 0, zimo: hu.action == "zimo"};
                rp.winner = i;
            }
        }
    },

    refresh: function(rp){
        if(rp == null || !cc.isValid(rp.root)){ return; }
        //手牌:上帝视角,四家统一正立显示
        for(var i = 0; i < rp.players.length; ++i){
            var uid = rp.players[i].userid;
            var handNode = rp.handNodes[i];
            handNode.removeAllChildren();
            var hand = rp.hands[uid] || [];
            var sorted = hand.slice().sort(function(a, b){ return a - b; });
            var w = 50, h = 68, gap = 52, meldGap = 22;
            //手牌与副露拼成同一行:手牌在前,吃/碰/杠按组接在右侧,中间留缺口区分
            var cells = [];
            for(var j = 0; j < sorted.length; ++j){ cells.push(sorted[j]); }
            var melds = rp.melds[uid] || [];
            for(var mi = 0; mi < melds.length; ++mi){
                var md = melds[mi];
                var tiles = md.t == "chi" ? (md.pais || []) : [md.pai, md.pai, md.pai, md.pai].slice(0, md.t == "peng" ? 3 : 4);
                cells.push(null);          //组间隔
                for(var t = 0; t < tiles.length; ++t){ cells.push(tiles[t]); }
            }
            var width = 0;
            for(var ci2 = 0; ci2 < cells.length; ++ci2){ width += cells[ci2] == null ? meldGap : gap; }
            var x = -width / 2 + w / 2;
            for(var ci3 = 0; ci3 < cells.length; ++ci3){
                if(cells[ci3] == null){ x += meldGap; continue; }
                var tile = this.makeTile(handNode, cells[ci3], w, h);
                tile.setPosition(x, 0);
                x += gap;
            }

            var foldNode = rp.foldNodes[i];
            foldNode.removeAllChildren();
            var folds = rp.folds[uid] || [];
            var fw = 36, fh = 48, fg = 40, perRow = 8;
            for(var k = 0; k < folds.length; ++k){
                var row = Math.floor(k / perRow);
                var col = k % perRow;
                var tile2 = this.makeTile(foldNode, folds[k], fw, fh);
                tile2.setPosition(-(perRow - 1) * fg / 2 + col * fg, -row * 52);
            }
        }
        if(rp.wallLabel){
            rp.wallLabel.string = "剩余" + rp.wall + "张";
        }
        if(rp.progLabel){
            var total = rp.data.events ? rp.data.events.length : 0;
            rp.progLabel.string = (rp.idx > total ? total : rp.idx) + "/" + total;
        }
        //胡牌者标记
        for(var m = 0; m < rp.seatNodes.length; ++m){
            var nameNode = rp.seatNodes[m].getChildByName("name");
            if(nameNode){
                nameNode.color = (m == rp.winner) ? cc.color(255, 210, 0) : cc.color(255, 255, 255);
            }
        }
        //胡牌结果:哪家胡、几台
        if(rp.resultLabel){
            var txt = "";
            if(rp.hu && rp.hu.si >= 0){
                var wp = rp.players[rp.hu.si];
                txt = (wp ? (wp.name || ("玩家" + wp.userid)) : "") + (rp.hu.zimo ? " 自摸" : " 胡牌") + " " + rp.hu.tai + "台";
            }
            rp.resultLabel.string = txt;
        }
    },

    update: function(dt){
        var rp = this._rp;
        if(rp == null || !rp.playing || !cc.isValid(rp.root)){ return; }
        rp.elapsed += dt * 1000 * rp.speed;
        var events = rp.data.events || [];
        var changed = false;
        while(rp.idx < events.length && events[rp.idx].t <= rp.elapsed){
            this.applyEvent(rp, events[rp.idx]);
            rp.idx++;
            changed = true;
        }
        if(changed){ this.refresh(rp); }
        if(rp.idx >= events.length && events.length > 0){
            rp.playing = false;
            if(rp.playBtn){
                rp.playBtn.getChildByName("Label").getComponent(cc.Label).string = "播放";
            }
        }
    }
});
