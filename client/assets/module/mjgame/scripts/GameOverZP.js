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
        _gameover:null,
        _gameresult:null,
        _seats:[],
        _isGameEnd:false,
        _pingju:null,
        _win:null,
        _lose:null,
    },

    // use this for initialization
    onLoad: function () {
        if(cc.vv == null){
            return;
        }
        if(cc.vv.gameNetMgr.conf == null){
            return;
        }
        if(cc.vv.gameNetMgr.conf.type == "xzdd"){
            this._gameover = this.node.getChildByName("game_over");
        }
        else{
            this._gameover = this.node.getChildByName("game_over_xlch");
        }
        
        this._gameover.active = false;

        this._pingju = this._gameover.getChildByName("pingju");
        this._win = this._gameover.getChildByName("win");
        this._lose = this._gameover.getChildByName("lose");

        //局结算弹窗不要全屏:整体等比缩小居中显示,底板/标题/列表/按钮保持场景原始相对布局
        this._gameover.x = 0;
        this._gameover.setScale(0.85);

        // 子视图(win/lose/pingju)为标题艺术字:保持原始尺寸居中显示,禁止拉满屏(会拉伸变形)
        var titleViews = [this._win, this._lose, this._pingju];
        for(var fv = 0; fv < titleViews.length; ++fv){
            var v = titleViews[fv];
            if(v){
                v.x = 0; //仅水平居中,宽度沿用场景原始配置
            }
        }

        this._gameresult = this.node.getChildByName("game_result");

        //一局结算弹窗(game_result)左右满屏:底板GameEnd7跟随屏幕宽度拉伸(与最终结算弹窗一致),避免宽屏两侧露桌面
        if(this._gameresult){
            this._gameresult.width = cc.winSize.width;
            this._gameresult.x = 0;
            var grMask = this._gameresult.getChildByName("Z_jiesuanditu");
            if(grMask){
                grMask.width = cc.winSize.width;
                grMask.x = 0;
            }
            var grPanel = this._gameresult.getChildByName("GameEnd7");
            if(grPanel){
                grPanel.width = cc.winSize.width;
                grPanel.x = 0;
                var grSp = grPanel.getComponent(cc.Sprite);
                if(grSp && grSp.spriteFrame){
                    grSp.sizeMode = cc.Sprite.SizeMode.CUSTOM;
                    grSp.type = cc.Sprite.Type.SLICED;
                }
            }
        }
        
        var wanfa = this._gameover.getChildByName("wanfa").getComponent(cc.Label);
        wanfa.string = cc.vv.gameNetMgr.getWanfa();
        
        var listRoot = this._gameover.getChildByName("result_list");
        for(var i = 1; i <= 4; ++i){
            var s = "s" + i;
            var sn = listRoot.getChildByName(s);
            var viewdata = {};
            viewdata.username = sn.getChildByName('username').getComponent(cc.Label);
            viewdata.reason = sn.getChildByName('reason').getComponent(cc.Label);
            
            var f = sn.getChildByName('fan');
            if(f != null){
                viewdata.fan = f.getComponent(cc.Label);    
            }
            
            viewdata.score = sn.getChildByName('score').getComponent(cc.Label);
            viewdata.hu = sn.getChildByName('hu');
            viewdata.mahjongs = sn.getChildByName('pai');
            viewdata.zhuang = sn.getChildByName('zhuang');
            viewdata.hupai = sn.getChildByName('hupai');
            viewdata._pengandgang = [];
            this._seats.push(viewdata);
        }
        
        //初始化网络事件监听器
        var self = this;
        this.node.on('game_over',function(data){self.onGameOver(data.detail);});
        
        this.node.on('game_end',function(data){
            self._isGameEnd = true;
            //需求4:牌局全部结束(服务端下发endinfo/最终结算)时直接展示"本次游戏总分数"面板
            if(self._gameresult){ self._gameresult.active = true; }
            if(self._gameover){ self._gameover.active = false; }
        });
    },
    
    onGameOver(data){
        var type = cc.vv.gameNetMgr.conf.type;
        if(type == "zp" || type == "zp4" || type == "wujin" || type == "zj" || type == "zj_bt" || type == "zj4" || type == "zj4_bt"){
            this.onGameOver_ZJ(data);
        }
        else if(type == "xzdd"){
            this.onGameOver_XZDD(data);
        }
        else{
            this.onGameOver_XLCH(data);
        }
    },

    //诸暨三玩法结算（results: [{userid,score,totalscore,holds,pengs,chis,folds,angangs,diangangs,wangangs,huinfo:[{ishupai,pai,action:zimo|hu|fangpao,fan:台数}]}]）
    onGameOver_ZJ:function(data){
        console.log(data);
        if(!data || data.length == 0){
            this._gameresult.active = true;
            return;
        }
        this._gameover.active = true;
        this._pingju.active = false;
        this._win.active = false;
        this._lose.active = false;

        var myIdx = cc.vv.gameNetMgr.seatIndex;
        var myscore = 0;
        for(var i = 0; i < data.length; ++i){
            if(data[i] && data[i].userid == cc.vv.gameNetMgr.seats[myIdx].userid){
                myscore = data[i].score;
                break;
            }
        }
        if(myscore > 0){
            this._win.active = true;
        }
        else if(myscore < 0){
            this._lose.active = true;
        }
        else{
            this._pingju.active = true;
        }

        //显示玩家信息（按实际座位数渲染，隐藏多余座位行）
        for(var i = 0; i < this._seats.length; ++i){
            var seatView = this._seats[i];
            var userData = data[i];
            var rowRoot = seatView.username.node.parent;
            if(!userData){
                rowRoot.active = false;
                continue;
            }
            rowRoot.active = true;

            var hued = false;
            var actionArr = [];
            var hupaiRoot = seatView.hupai;
            for(var j = 0; j < hupaiRoot.children.length; ++j){
                hupaiRoot.children[j].active = false;
            }

            var hi = 0;
            var huinfo = userData.huinfo || [];
            for(var j = 0; j < huinfo.length; ++j){
                var info = huinfo[j];
                hued = hued || info.ishupai;
                if(info.ishupai){
                    if(hi < hupaiRoot.children.length){
                        var hupaiView = hupaiRoot.children[hi];
                        hupaiView.active = true;
                        hupaiView.getComponent(cc.Sprite).spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID("B_",info.pai);
                        hi++;
                    }
                    if(info.action == "zimo"){
                        actionArr.push("自摸");
                    }
                    else if(info.action == "hu"){
                        actionArr.push("接炮胡");
                    }
                    if(info.fan != null){
                        actionArr.push(info.fan + "台");
                        // 台项明细（服务端 taiLog：如 无财+1、对对胡+1）
                        if(info.tailog && info.tailog.length){
                            actionArr.push("\n" + info.tailog.join("\n"));
                        }
                    }
                }
                else if(info.action == "fangpao"){
                    actionArr.push("放炮");
                }
            }

            seatView.hu.active = hued;

            var angangs = userData.angangs || [];
            var diangangs = userData.diangangs || [];
            var wangangs = userData.wangangs || [];
            var pengs = userData.pengs || [];
            var chis = userData.chis || [];
            if(angangs.length){
                actionArr.push("暗杠x" + angangs.length);
            }
            if(diangangs.length){
                actionArr.push("明杠x" + diangangs.length);
            }
            if(wangangs.length){
                actionArr.push("补杠x" + wangangs.length);
            }

            seatView.username.string = cc.vv.gameNetMgr.seats[i] ? cc.vv.gameNetMgr.seats[i].name : "";
            seatView.zhuang.active = cc.vv.gameNetMgr.button == i;
            //老庄:庄家连庄>=1时在庄标正下方显示"老庄X"(与游戏内头像庄标规则一致)
            var lzCnt = (cc.vv.gameNetMgr.button == i) ? (cc.vv.gameNetMgr.laozhuang || 0) : 0;
            this.updateSettleLaoZhuang(seatView, lzCnt);
            seatView.reason.string = actionArr.join("、");

            if(userData.score > 0){
                seatView.score.string = "+" + userData.score;
            }
            else{
                seatView.score.string = "" + userData.score;
            }

            //隐藏所有牌
            for(var k = 0; k < seatView.mahjongs.childrenCount; ++k){
                seatView.mahjongs.children[k].active = false;
            }

            var holds = (userData.holds || []).slice();
            //对手结算手牌可能仅返回数量，无法展示则跳过
            if(typeof(holds) != "object" || holds.length == null){
                holds = [];
            }
            cc.vv.mahjongmgr.sortMJ(holds);

            //碰/杠/吃占用位置
            var numOfGangs = angangs.length + wangangs.length + diangangs.length;
            var lackingNum = (pengs.length + numOfGangs + chis.length)*3;
            //显示手牌
            for(var k = 0; k < holds.length; ++k){
                var pai = holds[k];
                var n = seatView.mahjongs.children[k + lackingNum];
                if(n == null){ break; }
                n.active = true;
                var sprite = n.getComponent(cc.Sprite);
                sprite.spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID("M_",pai);
            }

            for(var k = 0; k < seatView._pengandgang.length; ++k){
                seatView._pengandgang[k].active = false;
            }

            //初始化杠牌
            var index = 0;
            for(var k = 0; k < angangs.length; ++k){
                this.initPengAndGangs(seatView,index,angangs[k],"angang");
                index++;
            }
            for(var k = 0; k < diangangs.length; ++k){
                this.initPengAndGangs(seatView,index,diangangs[k],"diangang");
                index++;
            }
            for(var k = 0; k < wangangs.length; ++k){
                this.initPengAndGangs(seatView,index,wangangs[k],"wangang");
                index++;
            }
            //初始化碰牌
            for(var k = 0; k < pengs.length; ++k){
                //财神碰的组按真实组成渲染(pengTiles与pengs平行)
                var pt = (userData.pengTiles && userData.pengTiles[k]) || null;
                this.initPengAndGangs(seatView,index,pengs[k],"peng",pt);
                index++;
            }
            //初始化吃牌（chis为二维数组，每组3张平铺展示）
            for(var k = 0; k < chis.length; ++k){
                var chiArr = chis[k];
                if(chiArr && chiArr.length > 0){
                    this.initChisGroup(seatView,index,chiArr);
                    index++;
                }
            }
        }
    },

    //结算行老庄标签:挂在庄标节点正下方(庄标56x56,下方空隙不碰右侧牌区),count>=1时显示"老庄X",否则隐藏
    updateSettleLaoZhuang:function(seatView, count){
        var z = seatView.zhuang;
        if(!z){ return; }
        var lz = z.getChildByName("laozhuang_ex");
        if(lz == null){
            lz = new cc.Node("laozhuang_ex");
            lz.setContentSize(60, 22);
            lz.setPosition(0, -34);
            z.addChild(lz);
            var lbl = lz.addComponent(cc.Label);
            lbl.fontSize = 18;
            lbl.lineHeight = 22;
            lbl.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
            lbl.verticalAlign = cc.Label.VerticalAlign.CENTER;
            lbl.overflow = cc.Label.Overflow.NONE;
            lz.color = cc.color(255, 225, 120);
            var ol = lz.addComponent(cc.LabelOutline);
            ol.color = cc.color(60, 30, 0);
            ol.width = 2;
        }
        var show = (count != null && count >= 1);
        lz.active = show;
        if(show){ lz.getComponent(cc.Label).string = "老庄" + count; }
    },

    onGameOver_XZDD(data){
        console.log(data);
        if(data.length == 0){
            this._gameresult.active = true;
            return;
        }
        this._gameover.active = true;
        this._pingju.active = false;
        this._win.active = false;
        this._lose.active = false;

        var myscore = data[cc.vv.gameNetMgr.seatIndex].score;
        if(myscore > 0){
            this._win.active = true;
        }         
        else if(myscore < 0){
            this._lose.active = true;
        }
        else{
            this._pingju.active = true;
        }
        
            
        //显示玩家信息
        for(var i = 0; i < 4; ++i){
            var seatView = this._seats[i];
            var userData = data[i];
            var hued = false;
            //胡牌的玩家才显示 是否清一色 根xn的字样
            var numOfGangs = userData.angangs.length + userData.wangangs.length + userData.diangangs.length;
            var numOfGen = userData.numofgen;
            var actionArr = [];
            var is7pairs = false;
            var ischadajiao = false;
            for(var j = 0; j < userData.actions.length; ++j){
                var ac = userData.actions[j];
                if(ac.type == "zimo" || ac.type == "ganghua" || ac.type == "dianganghua" || ac.type == "hu" || ac.type == "gangpaohu" || ac.type == "qiangganghu" || ac.type == "chadajiao"){
                    if(userData.pattern == "7pairs"){
                        actionArr.push("七对");
                    }
                    else if(userData.pattern == "l7pairs"){
                        actionArr.push("龙七对");
                    }
                    else if(userData.pattern == "j7pairs"){
                        actionArr.push("将七对");
                    }
                    else if(userData.pattern == "duidui"){
                        actionArr.push("碰碰胡");
                    }
                    else if(userData.pattern == "jiangdui"){
                        actionArr.push("将对");
                    }
                    
                    if(ac.type == "zimo"){
                        actionArr.push("自摸");
                    }
                    else if(ac.type == "ganghua"){
                        actionArr.push("杠上花");
                    }
                    else if(ac.type == "dianganghua"){
                        actionArr.push("点杠花");
                    }
                    else if(ac.type == "gangpaohu"){
                        actionArr.push("杠炮胡");
                    }
                    else if(ac.type == "qiangganghu"){
                        actionArr.push("抢杠胡");
                    }
                    else if(ac.type == "chadajiao"){
                        ischadajiao = true;
                    }
                    hued = true;
                }
                else if(ac.type == "fangpao"){
                    actionArr.push("放炮");
                }
                else if(ac.type == "angang"){
                    actionArr.push("暗杠");
                }
                else if(ac.type == "diangang"){
                    actionArr.push("明杠");
                }
                else if(ac.type == "wangang"){
                    actionArr.push("弯杠");
                }
                else if(ac.type == "fanggang"){
                   actionArr.push("放杠");
                }
                else if(ac.type == "zhuanshougang"){
                    actionArr.push("转手杠");
                }
                else if(ac.type == "beiqianggang"){
                    actionArr.push("被抢杠");
                }
                else if(ac.type == "beichadajiao"){
                    actionArr.push("被查叫");
                }
            }
            
            if(hued){
                if(userData.qingyise){
                    actionArr.push("清一色");
                }
                
                if(userData.menqing){
                    actionArr.push("门清");
                }
                
                if(userData.zhongzhang){
                    actionArr.push("中张");
                }
                
                if(userData.jingouhu){
                    actionArr.push("金钩胡");
                }
                                
                if(userData.haidihu){
                    actionArr.push("海底胡");
                }
                
                if(userData.tianhu){
                    actionArr.push("天胡");
                }
                
                if(userData.dihu){
                    actionArr.push("地胡");
                }
            
                if(numOfGen > 0){
                    actionArr.push("根x" + numOfGen); 
                }                
                
                if(ischadajiao){
                    actionArr.push("查大叫");
                }
            }
            
            for(var o = 0; o < 3;++o){
                seatView.hu.children[o].active = false;    
            }
            if(userData.huorder >= 0){
                seatView.hu.children[userData.huorder].active = true;    
            }

            seatView.username.string = cc.vv.gameNetMgr.seats[i].name;
            seatView.zhuang.active = cc.vv.gameNetMgr.button == i;
            seatView.reason.string = actionArr.join("、");
            
            //胡牌的玩家才有番
            var fan = 0;
            if(hued){
                fan = userData.fan;
            }
            seatView.fan.string = fan + "番";
            
            //
            if(userData.score > 0){
                seatView.score.string = "+" + userData.score;    
            }
            else{
                seatView.score.string = userData.score;
            }
           
            
            var hupai = -1;
            if(hued){
                hupai = userData.holds.pop();
            }
            
            cc.vv.mahjongmgr.sortMJ(userData.holds,userData.dingque);
            
            //胡牌不参与排序
            if(hued){
                userData.holds.push(hupai);
            }
            
            //隐藏所有牌
            for(var k = 0; k < seatView.mahjongs.childrenCount; ++k){
                var n = seatView.mahjongs.children[k];
                n.active = false;
            }
           
            var lackingNum = (userData.pengs.length + numOfGangs)*3; 
            //显示相关的牌
            for(var k = 0; k < userData.holds.length; ++k){
                var pai = userData.holds[k];
                var n = seatView.mahjongs.children[k + lackingNum];
                n.active = true;
                var sprite = n.getComponent(cc.Sprite);
                sprite.spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID("M_",pai);
            }
            
            
            for(var k = 0; k < seatView._pengandgang.length; ++k){
                seatView._pengandgang[k].active = false;
            }
            
            //初始化杠牌
            var index = 0;
            var gangs = userData.angangs;
            for(var k = 0; k < gangs.length; ++k){
                var mjid = gangs[k];
                this.initPengAndGangs(seatView,index,mjid,"angang");
                index++;    
            }
            
            var gangs = userData.diangangs;
            for(var k = 0; k < gangs.length; ++k){
                var mjid = gangs[k];
                this.initPengAndGangs(seatView,index,mjid,"diangang");
                index++;    
            }
            
            var gangs = userData.wangangs;
            for(var k = 0; k < gangs.length; ++k){
                var mjid = gangs[k];
                this.initPengAndGangs(seatView,index,mjid,"wangang");
                index++;    
            }
            
            //初始化碰牌
            var pengs = userData.pengs
            if(pengs){
                for(var k = 0; k < pengs.length; ++k){
                    var mjid = pengs[k];
                    this.initPengAndGangs(seatView,index,mjid,"peng");
                    index++;    
                }    
            }
        }
    },
    onGameOver_XLCH:function(data){
        console.log(data);
        if(data.length == 0){
            this._gameresult.active = true;
            return;
        }
        this._gameover.active = true;
        this._pingju.active = false;
        this._win.active = false;
        this._lose.active = false;

        var myscore = data[cc.vv.gameNetMgr.seatIndex].score;
        if(myscore > 0){
            this._win.active = true;
        }         
        else if(myscore < 0){
            this._lose.active = true;
        }
        else{
            this._pingju.active = true;
        }
            
        //显示玩家信息
        for(var i = 0; i < 4; ++i){
            var seatView = this._seats[i];
            var userData = data[i];
            var hued = false;
            var actionArr = [];
            var is7pairs = false;
            var ischadajiao = false;
            var hupaiRoot = seatView.hupai;
            
            for(var j = 0; j < hupaiRoot.children.length; ++j){
                hupaiRoot.children[j].active = false;
            }
            
            var hi = 0;
            for(var j = 0; j < userData.huinfo.length; ++j){
                var info = userData.huinfo[j];
                hued = hued || info.ishupai;
                if(info.ishupai){
                    if(hi < hupaiRoot.children.length){
                        var hupaiView = hupaiRoot.children[hi]; 
                        hupaiView.active = true;
                        hupaiView.getComponent(cc.Sprite).spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID("B_",info.pai);
                        hi++;   
                    }
                }
                
                var str = ""
                var sep = "";
                
                var dataseat = userData;
                if(!info.ishupai){
                    if(info.action == "fangpao"){
                        str = "放炮";
                    }
                    else if(info.action == "gangpao"){
                        str = "杠上炮";
                    }
                    else if(info.action == "beiqianggang"){
                        str = "被抢杠";
                    }
                    else{
                        str = "被查大叫";
                    }
                    
                    dataseat = data[info.target]; 
                    info = dataseat.huinfo[info.index];
                }
                else{
                    if(info.action == "hu"){
                        str = "接炮胡"
                    }
                    else if(info.action == "zimo"){
                        str = "自摸";
                    }
                    else if(info.action == "ganghua"){
                        str = "杠上花";
                    }
                    else if(info.action == "dianganghua"){
                        str = "点杠花";
                    }
                    else if(info.action == "gangpaohu"){
                        str = "杠炮胡";
                    }
                    else if(info.action == "qiangganghu"){
                        str = "抢杠胡";
                    }
                    else if(info.action == "chadajiao"){
                        str = "查大叫";
                    }   
                }
                
                str += "(";
                
                if(info.pattern == "7pairs"){
                    str += "七对";
                    sep = "、"
                }
                else if(info.pattern == "l7pairs"){
                    str += "龙七对";
                    sep = "、"
                }
                else if(info.pattern == "j7pairs"){
                    str += "将七对";
                    sep = "、"
                }
                else if(info.pattern == "duidui"){
                    str += "碰碰胡";
                    sep = "、"
                }
                else if(info.pattern == "jiangdui"){
                    str += "将对";
                    sep = "、"
                }
                    
                if(info.haidihu){
                    str += sep + "海底胡";
                    sep = "、";
                }
                
                if(info.tianhu){
                    str += sep + "天胡";
                    sep = "、";
                }
                
                if(info.dihu){
                    str += sep + "地胡";
                    sep = "、";
                }
                
                if(dataseat.qingyise){
                    str += sep + "清一色";
                    sep = "、";
                }
                
                if(dataseat.menqing){
                    str += sep + "门清";
                    sep = "、";
                }
                
                if(dataseat.jingouhu){
                    str += sep + "金钩胡";
                    sep = "、";
                }
                         
                if(dataseat.zhongzhang){
                    str += sep + "中张";
                    sep = "、";
                }
            
                if(info.numofgen > 0){
                    str += sep + "根x" + info.numofgen;
                    sep = "、"; 
                }
                
                if(sep == ""){
                    str += "平胡";
                }
                
                str += "、" + info.fan + "番";
                
                str += ")";
                actionArr.push(str);
            }
            
            seatView.hu.active = hued;
            
            if(userData.angangs.length){
                actionArr.push("暗杠x" + userData.angangs.length);
            }
            
            if(userData.diangangs.length){
                actionArr.push("明杠x" + userData.diangangs.length);
            }
            
            if(userData.wangangs.length){
                actionArr.push("巴杠x" + userData.wangangs.length);
            }

            seatView.username.string = cc.vv.gameNetMgr.seats[i].name;
            seatView.zhuang.active = cc.vv.gameNetMgr.button == i;
            seatView.reason.string = actionArr.join("、");
            
            //
            if(userData.score > 0){
                seatView.score.string = "+" + userData.score;    
            }
            else{
                seatView.score.string = userData.score;
            }
           
            //隐藏所有牌
            for(var k = 0; k < seatView.mahjongs.childrenCount; ++k){
                var n = seatView.mahjongs.children[k];
                n.active = false;
            }
            
            cc.vv.mahjongmgr.sortMJ(userData.holds,userData.dingque);
            
            var numOfGangs = userData.angangs.length + userData.wangangs.length + userData.diangangs.length;
           
            var lackingNum = (userData.pengs.length + numOfGangs)*3; 
            //显示相关的牌
            for(var k = 0; k < userData.holds.length; ++k){
                var pai = userData.holds[k];
                var n = seatView.mahjongs.children[k + lackingNum];
                n.active = true;
                var sprite = n.getComponent(cc.Sprite);
                sprite.spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID("M_",pai);
            }
            
            
            for(var k = 0; k < seatView._pengandgang.length; ++k){
                seatView._pengandgang[k].active = false;
            }
            
            //初始化杠牌
            var index = 0;
            var gangs = userData.angangs;
            for(var k = 0; k < gangs.length; ++k){
                var mjid = gangs[k];
                this.initPengAndGangs(seatView,index,mjid,"angang");
                index++;    
            }
            
            var gangs = userData.diangangs;
            for(var k = 0; k < gangs.length; ++k){
                var mjid = gangs[k];
                this.initPengAndGangs(seatView,index,mjid,"diangang");
                index++;    
            }
            
            var gangs = userData.wangangs;
            for(var k = 0; k < gangs.length; ++k){
                var mjid = gangs[k];
                this.initPengAndGangs(seatView,index,mjid,"wangang");
                index++;    
            }
            
            //初始化碰牌
            var pengs = userData.pengs
            if(pengs){
                for(var k = 0; k < pengs.length; ++k){
                    var mjid = pengs[k];
                    this.initPengAndGangs(seatView,index,mjid,"peng");
                    index++;    
                }    
            }
        }
    },
    
    initPengAndGangs:function(seatView,index,mjid,flag,tiles){
        var pgroot = null;
        if(seatView._pengandgang.length <= index){
            pgroot = cc.instantiate(cc.vv.mahjongmgr.pengPrefabSelf);
            seatView._pengandgang.push(pgroot);
            seatView.mahjongs.addChild(pgroot);
        }
        else{
            pgroot = seatView._pengandgang[index];
            pgroot.active = true;
        }

        var sprites = pgroot.getComponentsInChildren(cc.Sprite);
        var pi = 0; //碰组真实组成渲染索引(仅peng且有tiles时)
        for(var s = 0; s < sprites.length; ++s){
            var sprite = sprites[s];
            if(sprite.node.name == "gang"){
                var isGang = flag != "peng";
                sprite.node.active = isGang;
                sprite.node.scaleX = 1.0;
                sprite.node.scaleY = 1.0;
                if(flag == "angang"){
                    sprite.spriteFrame = cc.vv.mahjongmgr.getEmptySpriteFrame("myself");
                    sprite.node.scaleX = 1.4;
                    sprite.node.scaleY = 1.4;
                }
                else{
                    sprite.spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID("B_",mjid);
                }
            }
            else{
                var showMj = (flag == "peng" && tiles && pi < tiles.length) ? tiles[pi] : mjid;
                sprite.spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID("B_",showMj);
                pi++;
            }
        }
        pgroot.x = index * 55 * 3 + index * 10;
    },

    //吃牌组：3张不同的牌平铺显示（复用碰预制体，隐藏gang背后逐张赋值）
    initChisGroup:function(seatView,index,chiArr){
        var pgroot = null;
        if(seatView._pengandgang.length <= index){
            pgroot = cc.instantiate(cc.vv.mahjongmgr.pengPrefabSelf);
            seatView._pengandgang.push(pgroot);
            seatView.mahjongs.addChild(pgroot);
        }
        else{
            pgroot = seatView._pengandgang[index];
            pgroot.active = true;
        }
        var sorted = chiArr.slice().sort(function(a,b){return a-b;});
        var sprites = pgroot.getComponentsInChildren(cc.Sprite);
        var pi = 0;
        for(var s = 0; s < sprites.length; ++s){
            var sprite = sprites[s];
            if(sprite.node.name == "gang"){
                sprite.node.active = false; //吃牌无杠背
            }
            else{
                var mj = (pi < sorted.length) ? sorted[pi] : sorted[sorted.length - 1];
                sprite.spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID("B_",mj);
                pi++;
            }
        }
        pgroot.x = index * 55 * 3 + index * 10;
    },
    
    onBtnReadyClicked:function(){
        console.log("onBtnReadyClicked");
        if(this._isGameEnd){
            this._gameresult.active = true;
        }
        else{
            cc.vv.net.send('ready');   
        }
        this._gameover.active = false;
    },
    
    onBtnShareClicked:function(){
        console.log("onBtnShareClicked");
    }

    // called every frame, uncomment this function to activate update callback
    // update: function (dt) {

    // },
});
