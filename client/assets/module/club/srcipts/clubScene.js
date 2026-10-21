//独立俱乐部场景(club.fire)控制脚本:挂在场景wfPage节点上
//页面骨架固化在场景文件中(clubPage=俱乐部列表页,wfPage=玩法大厅+牌桌列表页),这里只做JS控制
cc.Class({
    extends: cc.Component,

    properties: {},

    onLoad: function () {
        console.log("[club] onLoad fired, cc.vv=", !!cc.vv);
        if(!cc.vv){
            cc.director.loadScene("loading");
            return;
        }
        var self = this;
        var canvas = cc.find("Canvas");
        var clubPage = canvas.getChildByName("clubPage");
        var wfPage = canvas.getChildByName("wfPage");
        if(clubPage){ clubPage.active = true; } //进入场景默认显示俱乐部页
        if(wfPage){ wfPage.active = false; } //玩法详情页初始隐藏
        //顶部三按钮(我的俱乐部/创建/加入)贴图已固化在场景文件中(俱乐部-我的/创建/加入),JS不再动态加载或替换
        this.openClubPanel(); //打开俱乐部页(列表默认收起)
        //从牌桌退出/结算回俱乐部场景:直达该俱乐部的独立玩法详情页
        //注意:fromClubId在这里只读不清——解散/断线可能触发多次club场景加载(dispress_push与disconnect兜底),
        //若第一次加载就清掉,第二次加载会落到俱乐部列表页;清除只发生在用户主动返回列表(_wfBack)或回大厅(hall.onLoad)
        if(cc.vv.fromClubId){
            var backClubId = cc.vv.fromClubId;
            this.scheduleOnce(function(){
                self._clubBackToDetail(backClubId); //直达独立玩法详情页
            },0);
        }
    },

    //画矩形背景(通用,只使用Cocos 2.4存在的Graphics.rect API)
    _clubPaintRect:function(g,w,h,fill,line,lineWidth){
        g.fillColor = fill;
        g.rect(-w/2,-h/2,w,h);
        g.fill();
        g.strokeColor = line;
        g.lineWidth = lineWidth;
        g.rect(-w/2,-h/2,w,h);
        g.stroke();
    },

    //打开俱乐部页面;默认收起列表,需点击"我的俱乐部"才展开
    openClubPanel:function(){
        if(this._clubPanel == null){
            this._clubBuildPanel();
        }
        this._clubPanel.active = true;
        this._clubLayoutPage(); //按当前窗口尺寸重新铺满
        this._clubState = null; //空态:进入页面不渲染列表
        if(this._clubListArea){ this._clubListArea.active = false; }
        this._clubClearList();
        this._clubRefreshList(); //仅预取数据,不渲染;点击"我的俱乐部"时即可立即显示
    },

    //构建俱乐部全屏页面(页面骨架已固化在 club.fire 的 clubPage 节点下,这里只绑定事件)
    _clubBuildPanel:function(){
        var self = this;
        var canvas = cc.find("Canvas");
        if(canvas == null){ return; }
        var baked = canvas.getChildByName("clubPage");
        if(!baked){ return; }
        this._clubBaked = true;
        this._clubPanel = baked;
        this._clubPageBg = baked.getChildByName("clubBg");
        if(this._clubPageBg){
            //兜底:clubBg上误挂了Canvas组件(把节点尺寸锁死为设计分辨率,宽屏下左右无法拉满),运行时强制移除;并强制贴图跟随节点尺寸
            var strayCanvas = this._clubPageBg.getComponent(cc.Canvas);
            if(strayCanvas){ strayCanvas.destroy(); }
            var bgSp = this._clubPageBg.getComponent(cc.Sprite);
            if(bgSp){ bgSp.sizeMode = cc.Sprite.SizeMode.CUSTOM; }
        }
        this._clubMask = baked.getChildByName("mask");
        this._clubCloseBtn = baked.getChildByName("btn_close");
        this._clubBtnMine = baked.getChildByName("btnMine");
        this._clubBtnCreate = baked.getChildByName("btnCreate");
        this._clubBtnJoin = baked.getChildByName("btnJoin");
        this._clubListArea = baked.getChildByName("listArea");
        var tabs = [this._clubBtnMine,this._clubBtnCreate,this._clubBtnJoin];
        for(var ti = 0; ti < tabs.length; ++ti){ if(tabs[ti]){ tabs[ti]._clubW = tabs[ti].width; tabs[ti]._clubH = tabs[ti].height; } }
        if(!baked._clubBound){
            baked._clubBound = true;
            if(this._clubMask){ this._clubMask.on(cc.Node.EventType.TOUCH_START,function(){}); } //吞触摸防穿透
            if(this._clubCloseBtn){
                var bb = this._clubCloseBtn.getComponent(cc.Button);
                if(bb){ bb.clickEvents = []; }
                this._clubCloseBtn.on(cc.Node.EventType.TOUCH_END,function(){ self._clubClosePanel(); }); //独立场景:关闭俱乐部页=回大厅
            }
            if(this._clubBtnMine){ this._clubBtnMine.on(cc.Node.EventType.TOUCH_END,function(){ self._clubShowMine(); self._clubRefreshList(); }); }
            if(this._clubBtnCreate){ this._clubBtnCreate.on(cc.Node.EventType.TOUCH_END,function(){ self._clubShowCreate(); }); }
            if(this._clubBtnJoin){ this._clubBtnJoin.on(cc.Node.EventType.TOUCH_END,function(){ self._clubShowJoin(); }); }
            this._clubBindBakedPopups(baked); //创建/加入弹窗(场景固化,只绑事件)
        }
        this._clubLayoutPage(); //按当前窗口尺寸重新铺满
    },

    //绑定场景固化的创建/加入弹窗(关闭回我的俱乐部、6位ID输入回调;遮罩宽屏拉伸在打开时做)
    _clubBindBakedPopups:function(panel){
        var self = this;
        var bindOne = function(win,isJoin){
            if(!win || win._clubBound){ return; }
            win._clubBound = true;
            var closeBtn = win.getChildByName("close");
            if(closeBtn){ closeBtn.on(cc.Node.EventType.TOUCH_END,function(){ self._clubShowMine(); }); }
            if(isJoin){
                //标题贴图已在场景中换成俱乐部标题图,但提示文字仍为原生"请输入房间号",这里改掉
                var titleNode = win.getChildByName("PopupScene20");
                var tipLab = titleNode ? titleNode.getChildByName("New Label") : null;
                if(tipLab){
                    var tip = tipLab.getComponent(cc.Label);
                    if(tip){ tip.string = "请输入俱乐部ID"; }
                }
                var comp = win.getComponent("JoinGameInput");
                if(comp){
                    self._clubJoinComp = comp;
                    comp.onInputFinished = function(clubId){ self._clubDoJoin(clubId); };
                }
            }
        };
        bindOne(panel.getChildByName("clubCreateWin"),false);
        bindOne(panel.getChildByName("clubJoinWin"),true);
    },

    //宽屏下把弹窗暗色遮罩拉伸到实际可见区(原生遮罩只有1280x720)
    _clubStretchPopupDim:function(win){
        if(!win){ return; }
        var dim = win.getChildByName("New Layout");
        if(dim){
            var vs = cc.view.getVisibleSize();
            dim.setContentSize(vs.width, vs.height);
            dim.setPosition(0, 0);
        }
    },

    //按当前可见区布局俱乐部页面(构建与打开时调用,适配窗口尺寸)
    _clubLayoutPage:function(){
        var page = this._clubPanel;
        if(!page){ return; }
        var vs = cc.view.getVisibleSize();
        var vo = cc.view.getVisibleOrigin();
        page.setContentSize(vs.width, vs.height);
        page.setPosition(page.parent.convertToNodeSpaceAR(cc.v2(vo.x + vs.width/2, vo.y + vs.height/2)));
        if(this._clubPageBg){
            this._clubPageBg.setContentSize(vs.width, vs.height);
            this._clubPageBg.setPosition(0,0);
        }
        if(this._clubMask){ this._clubMask.setContentSize(vs.width, vs.height); }
        //按钮位置已在场景编辑器中排好,代码不再强制重排,仅保留背景/遮罩的全屏拉伸
        //listArea列表区同样使用场景里排好的节点与尺寸,代码不再强制调整
    },

    //顶部三按钮贴图已固化在场景文件中,JS不再切换贴图(保留空函数避免调用处报错)
    _clubPaintBtn:function(node,frameKey){
    },

    //顶部三按钮贴图已固化在场景文件中,JS不再刷新(保留空函数避免调用处报错)
    _clubRefreshBtnFrames:function(){
    },

    //递归查找子节点(场景内节点可能被编辑器分组包了一层New Node,getChildByName只查直接子节点会找不到)
    _clubFind:function(node,name){
        if(!node){ return null; }
        if(node.name === name){ return node; }
        var cs = node.children;
        for(var i = 0; i < cs.length; i++){
            var r = this._clubFind(cs[i],name);
            if(r){ return r; }
        }
        return null;
    },

    //重画列表行底色(选中高亮);玩法图片按钮行切换默认/点击态整张按钮图
    _clubPaintRow:function(row,selected){
        row._selected = selected;
        var sp = row._iconSp;
        var f = sp ? ((selected && row._iconSel) ? row._iconSel : row._iconNormal) : null;
        if(sp && f){
            sp.spriteFrame = f;
            sp.node.setContentSize(row.width, row.height); //赋图后强制恢复行尺寸
            return; //有按钮图时不重画兜底色块
        }
        var bgN = row.getChildByName("bg");
        if(!bgN){ return; }
        var g = bgN.getComponent(cc.Graphics);
        if(!g){ return; }
        g.clear();
        this._clubPaintRect(g,row.width,row.height,
            selected?cc.color(96,78,150):cc.color(52,42,84),
            selected?cc.color(255,200,90):cc.color(120,100,170),2); //深色底,选中高亮
    },

    //图集帧加载(textures散图已全部并入图集): 带atlas缓存,帧不存在回null由调用方兜底
    _loadAtlasFrame:function(atlasPath, frameName, cb){
        var cache = this._atlasCache = this._atlasCache || {};
        var apply = function(atlas){
            cb((atlas && atlas.getSpriteFrame(frameName)) || null);
        };
        if(cache[atlasPath]){ apply(cache[atlasPath]); return; }
        cc.resources.load(atlasPath, cc.SpriteAtlas, function(err, atlas){
            if(!err && atlas){ cache[atlasPath] = atlas; }
            apply(cache[atlasPath]);
        });
    },

    //创建列表行(背景+左文字+右附加文字),返回行节点;iconType传玩法game_type时左侧加载自制图标
    //四种玩法共用 hall_ui图集帧club_game.png,选中(点击)态切换 club_game_on.png(缺失则用默认图)
    _clubAddRow:function(parent,idx,text,sub,cb,w,iconType){
        var self = this;
        w = w || 760;
        var ROW_H = 68; //行高(上下加高,白底条更醒目)
        var ROW_GAP = 73; //行间距=行高68+5px间隙
        var row = new cc.Node("row" + idx);
        row.setContentSize(w,ROW_H);
        //首行从父容器顶部向下排,兼容不同高度的列表区
        var topY = parent.height ? parent.height/2 - ROW_H/2 : 110; //顶部不留边距
        row.setPosition(0,topY - idx * ROW_GAP);
        parent.addChild(row);
        //列表行不再画兜底色块,由场景底图直接衬托,文字改黑色加粗
        //玩法行整行就是一张按钮图(四种玩法共用club_game.png,选中态club_game_on.png),文字放按钮里面
        var textX = -w/2 + 20, textSize = 26, textAnchor = 0, textAlign = cc.Label.HorizontalAlign.LEFT;
        if(iconType){
            textX = 0; textSize = 24; textAnchor = 0.5; textAlign = cc.Label.HorizontalAlign.CENTER;
            var bgimg = new cc.Node("bgimg");
            bgimg.setContentSize(w,ROW_H);
            row.addChild(bgimg);
            var rsp = bgimg.addComponent(cc.Sprite);
            rsp.sizeMode = cc.Sprite.SizeMode.CUSTOM; //先CUSTOM再赋图,防止节点被图片原始尺寸撑大
            rsp.type = cc.Sprite.Type.SIMPLE;
            row._iconSp = rsp;
            self._loadAtlasFrame("images/atlas/hall_ui", "club_game.png", function(sf){
                if(!sf || !cc.isValid(bgimg)){ return; }
                row._iconNormal = sf;
                if(!row._selected || !row._iconSel){ rsp.spriteFrame = sf; bgimg.setContentSize(w,ROW_H); }
            });
            self._loadAtlasFrame("images/atlas/hall_ui", "club_game_on.png", function(sf){
                if(!sf || !cc.isValid(bgimg)){ return; }
                row._iconSel = sf;
                if(row._selected){ rsp.spriteFrame = sf; bgimg.setContentSize(w,ROW_H); }
            });
        }
        //左文字(玩法行:文字整行居中放按钮图内)
        var ln = new cc.Node("l");
        ln.anchorX = textAnchor;
        ln.setContentSize(textAnchor === 0.5 ? w : (w - (textX + w/2) - 70),ROW_H);
        ln.setPosition(textX,0);
        row.addChild(ln);
        var lbl = ln.addComponent(cc.Label);
        lbl.string = text;
        lbl.fontSize = textSize;
        lbl.lineHeight = ROW_H;
        lbl.horizontalAlign = textAlign;
        lbl.verticalAlign = cc.Label.VerticalAlign.CENTER;
        lbl.overflow = cc.Label.Overflow.NONE; //动态Label用SHRINK/CLAMP会不渲染,必须用NONE
        ln.color = cc.color(0,0,0); //黑色文字
        //右附加文字
        if(sub != null && sub != ""){
            var sn = new cc.Node("s");
            sn.anchorX = 1;
            sn.setContentSize(100,ROW_H);
            sn.setPosition(w/2 - 20,0);
            row.addChild(sn);
            var slbl = sn.addComponent(cc.Label);
            slbl.string = sub;
            slbl.fontSize = 24;
            slbl.lineHeight = ROW_H;
            slbl.horizontalAlign = cc.Label.HorizontalAlign.RIGHT;
            slbl.verticalAlign = cc.Label.VerticalAlign.CENTER;
            sn.color = cc.color(0,0,0); //黑色附加文字
        }
        if(cb){
            row.on(cc.Node.EventType.TOUCH_END,function(){
                if(self._clubScrollMoved){ self._clubScrollMoved = false; return; } //拖动滚动时不触发点击
                cb(row);
            });
        }
        return row;
    },

    //创建 bg4 圆角框 + 可上下拖动的列表内容区,返回内容节点
    //contentHeight:所有行叠起来所需高度,超过框内视口高度时可拖动滚动
    _clubMakeScrollBox:function(parent,w,h,contentHeight){
        var self = this;
        //固化场景:复用listArea下已建好的box/bg/view/content,几何完全由场景编辑器控制,JS不写任何尺寸位置贴图
        var bakedBox = this._clubFind(parent,"box");
        if(bakedBox){
            var bView = this._clubFind(bakedBox,"view");
            var bContent = bView ? this._clubFind(bView,"content") : null;
            var bvw = bView ? bView.width : 0, bvh = bView ? bView.height : 0; //视口尺寸读场景节点
            if(bContent){
                //保留rowTpl模板节点,只清动态克隆的行
                var tpl = bContent.getChildByName("rowTpl");
                bContent.removeAllChildren();
                if(tpl){ bContent.addChild(tpl); }
            }
            this._clubScroll = {view:bView,content:bContent,vw:bvw,vh:bvh};
            if(bView && !bakedBox._clubScrollBound){
                bakedBox._clubScrollBound = true;
                var bStartY = 0, bBaseY = 0;
                bView.on(cc.Node.EventType.TOUCH_START,function(e){
                    bStartY = e.getLocation().y;
                    bBaseY = self._clubScroll && self._clubScroll.content ? self._clubScroll.content.y : 0;
                    self._clubScrollMoved = false;
                });
                bView.on(cc.Node.EventType.TOUCH_MOVE,function(e){
                    var sc = self._clubScroll;
                    if(!sc || !sc.content){ return; }
                    if(sc.content.height <= sc.vh){ return; } //内容不超出,不滚动
                    var dy = e.getLocation().y - bStartY;
                    if(Math.abs(dy) > 6){ self._clubScrollMoved = true; }
                    var minY = (sc.vh - sc.content.height)/2, maxY = (sc.content.height - sc.vh)/2;
                    sc.content.y = Math.max(minY,Math.min(maxY,bBaseY + dy));
                });
                bView.on(cc.Node.EventType.TOUCH_CANCEL,function(){ self._clubScrollMoved = false; });
            }
            return bContent;
        }
        var box = new cc.Node("box");
        box.setContentSize(w,h);
        parent.addChild(box);
        //bg4 深色圆角底板(9宫格拉伸,保留圆角)
        var bg = new cc.Node("bg");
        bg.setContentSize(w,h);
        box.addChild(bg);
        var sp = bg.addComponent(cc.Sprite);
        sp.sizeMode = cc.Sprite.SizeMode.CUSTOM;
        this._clubLoadBg4(function(frame){
            if(!frame){ return; }
            sp.spriteFrame = frame;
            sp.type = cc.Sprite.Type.SLICED;
        });
        //框内裁剪视口
        var pad = 22;
        var vw = w - pad*2, vh = h - pad*2;
        var view = new cc.Node("view");
        view.setContentSize(vw,vh);
        box.addChild(view);
        var mask = view.addComponent(cc.Mask);
        if(cc.Mask.Type && cc.Mask.Type.RECT != null){ mask.type = cc.Mask.Type.RECT; }
        var content = new cc.Node("content");
        content.setContentSize(vw,Math.max(vh,contentHeight));
        content.setPosition(0,(vh - content.height)/2); //默认从顶部开始显示
        view.addChild(content);
        this._clubScroll = {view:view,content:content,vw:vw,vh:vh};
        //拖动滚动
        var startY = 0, baseY = 0;
        view.on(cc.Node.EventType.TOUCH_START,function(e){
            startY = e.getLocation().y;
            baseY = content.y;
            self._clubScrollMoved = false;
        });
        view.on(cc.Node.EventType.TOUCH_MOVE,function(e){
            if(content.height <= vh){ return; } //内容不超出,不滚动
            var dy = e.getLocation().y - startY;
            if(Math.abs(dy) > 6){ self._clubScrollMoved = true; }
            var minY = (vh - content.height)/2, maxY = (content.height - vh)/2;
            content.y = Math.max(minY,Math.min(maxY,baseY + dy));
        });
        view.on(cc.Node.EventType.TOUCH_CANCEL,function(){ self._clubScrollMoved = false; });
        return content;
    },

    //载入 bg4 深色圆角底板(loadRes主路径,与入口jlb同一条稳定路径)
    _clubLoadBg4:function(cb){
        if(this._clubBg4Frame){ cb(this._clubBg4Frame); return; }
        var self = this;
        var apply = function(frame){
            if(!frame){ cb(null); return; }
            frame.insetLeft = 26; frame.insetRight = 26; frame.insetTop = 26; frame.insetBottom = 26;
            self._clubBg4Frame = frame;
            cb(frame);
        };
        cc.resources.load("images/other/bg4", cc.SpriteFrame, function(err, frame){
            //统一走loadRes,去掉native下不存在的 assets/others/native 直载兜底
            if(!err && frame){ apply(frame); }
            else{ cb(null); }
        });
    },

    //清空列表区
    _clubClearList:function(){
        this._clubScroll = null;
        if(this._clubBaked){
            //固化场景:静态骨架保留,仅清动态内容与Graphics
            if(this._clubDetailFullBg && cc.isValid(this._clubDetailFullBg)){
                var fg = this._clubDetailFullBg.getComponent(cc.Graphics);
                if(fg){ fg.clear(); }
            }
            if(this._clubListArea){
                var games = this._clubFind(this._clubListArea,"games");
                if(games){
                    //保留gameRowTpl模板、emptyTip提示、samptext标题图(场景固化,按钮上方的"玩法列表"标签),只清动态克隆的行
                    var grt = games.getChildByName("gameRowTpl");
                    var get = games.getChildByName("emptyTip");
                    var gst = games.getChildByName("samptext");
                    games.removeAllChildren();
                    if(gst){ games.addChild(gst); }
                    if(grt){ games.addChild(grt); }
                    if(get){ games.addChild(get); get.active = false; }
                }
                var tv = this._clubFind(this._clubListArea,"tablesView");
                var tables = tv ? tv.getChildByName("tables") : null;
                if(tables){ tables.removeAllChildren(); }
                var bx = this._clubFind(this._clubListArea,"box");
                var bvw = bx ? bx.getChildByName("view") : null;
                var bct = bvw ? bvw.getChildByName("content") : null;
                if(bct){
                    //保留rowTpl模板与emptyTip提示,只清动态克隆的行
                    var tpl = bct.getChildByName("rowTpl");
                    var cet = bct.getChildByName("emptyTip");
                    bct.removeAllChildren();
                    if(tpl){ bct.addChild(tpl); }
                    if(cet){ bct.addChild(cet); cet.active = false; }
                }
            }
            return;
        }
        //详情页背景/紫栏挂在页面层,离开详情或重渲染时一并销毁
        if(this._clubDetailBgNode && cc.isValid(this._clubDetailBgNode)){ this._clubDetailBgNode.destroy(); }
        this._clubDetailBgNode = null;
        if(this._clubDetailFullBg && cc.isValid(this._clubDetailFullBg)){ this._clubDetailFullBg.destroy(); }
        this._clubDetailFullBg = null;
        if(this._clubListArea){
            this._clubListArea.removeAllChildren();
        }
    },

    //请求我的俱乐部列表
    _clubRefreshList:function(){
        var self = this;
        cc.vv.http.sendRequest("/club_list",{
            account:cc.vv.userMgr.account,
            sign:cc.vv.userMgr.sign
        },function(ret){
            if(ret.errcode !== 0){
                cc.vv.wc.showError(ret.errmsg || "获取俱乐部失败");
                return;
            }
            self._myClubs = ret.clubs || [];
            //仅当用户已点开"我的俱乐部"时才高亮选中态并渲染列表,进入页面默认收起时不渲染
            if(self._clubState === "mine"){
                self._clubSetTop();
                self._clubRenderMine();
            }
        });
    },

    //顶部三按钮:我的俱乐部为选中态,创建/加入为未选中态
    _clubSetTop:function(){
        //顶部三按钮贴图已固化在场景文件中,JS不再切换选中态贴图
    },

    //主页:我的俱乐部(点击顶部"我的俱乐部"才展开列表)
    _clubShowMine:function(){
        this._clubCloseJoinWin(); //互斥:回到我的俱乐部时关闭加入弹窗
        this._clubCloseCreateWin(); //互斥:回到我的俱乐部时关闭创建弹窗
        if(this._clubCloseBtn){ this._clubCloseBtn.active = true; } //离开详情页恢复右上角退出按钮
        this._clubState = "mine";
        if(this._clubListArea){ this._clubListArea.active = true; } //展开列表区
        this._clubSetTop();
        this._clubRenderMine();
    },

    //我的俱乐部:已加入俱乐部列表,行结构(rowTpl含name/sub两个Label)固化在场景content下,JS只克隆填文字
    _clubRenderMine:function(){
        var self = this;
        this._clubClearList();
        var area = this._clubListArea;
        if(!area){ return; }
        var clubs = this._myClubs || [];
        var boxW = Math.min(area.width || 880,920);
        var boxH = (area.height || 460) - 10;
        var count = clubs.length > 0 ? clubs.length : 1;
        this._clubMakeScrollBox(area,boxW,boxH,count * 80 + 20);
        var content = this._clubScroll ? this._clubScroll.content : area;
        if(!content){ return; }
        var rowTpl = content.getChildByName("rowTpl");
        if(rowTpl){ rowTpl.active = false; } //模板隐藏,只作克隆源
        //暂无俱乐部提示:固化在场景content下的emptyTip节点(文案/样式在编辑器调),JS只控制显隐
        var et = content.getChildByName("emptyTip");
        if(et){ et.active = (clubs.length == 0); }
        if(clubs.length == 0){ return; }
        var ROW_H = rowTpl ? rowTpl.height : 68;
        var ROW_GAP = ROW_H + 5;
        var topY = content.height/2 - ROW_H/2;
        clubs.forEach(function(c,i){
            var row = rowTpl ? cc.instantiate(rowTpl) : new cc.Node("row"+i);
            row.active = true;
            row.setPosition(0, topY - i * ROW_GAP);
            content.addChild(row);
            var nameLbl = row.getChildByName("name");
            if(nameLbl){ var nl = nameLbl.getComponent(cc.Label); if(nl){ nl.string = c.name || ""; } }
            var subLbl = row.getChildByName("sub");
            if(subLbl){ var sl = subLbl.getComponent(cc.Label); if(sl){ sl.string = (c.member_count || 0) + "人"; } }
            row.on(cc.Node.EventType.TOUCH_END,function(){
                if(self._clubScrollMoved){ self._clubScrollMoved = false; return; }
                self._wfOpenDetail(c);
            });
        });
    },

    //创建俱乐部:显示场景固化的 clubCreateWin(标题图/隐藏键盘/提示文字均已固化在场景中)
    _clubShowCreate:function(){
        this._clubClearList(); //互斥:点击创建时关闭当前列表
        this._clubCloseJoinWin();
        var win = this._clubPanel ? this._clubPanel.getChildByName("clubCreateWin") : null;
        if(!win){ return; }
        this._clubCreateWin = win;
        this._clubStretchPopupDim(win); //宽屏下遮罩铺满
        win.active = true;
    },

    //加入俱乐部:显示场景固化的 clubJoinWin(数字键盘输入6位俱乐部ID,回调已在构建时绑定)
    _clubShowJoin:function(){
        this._clubClearList(); //互斥:点击加入时关闭当前列表
        this._clubCloseCreateWin();
        var win = this._clubPanel ? this._clubPanel.getChildByName("clubJoinWin") : null;
        if(!win){ return; }
        this._clubJoinWin = win;
        this._clubStretchPopupDim(win); //宽屏下遮罩铺满
        win.active = true;
    },

    //输入满6位后提交加入俱乐部
    _clubDoJoin:function(idStr){
        var self = this;
        var id = parseInt(idStr);
        if(!(id > 0)){ cc.vv.wc.showError("请输入正确的俱乐部ID"); return; }
        cc.vv.http.sendRequest("/club_join",{
            account:cc.vv.userMgr.account,
            sign:cc.vv.userMgr.sign,
            clubid:id
        },function(ret){
            if(ret.errcode !== 0){
                cc.vv.wc.showError(ret.errmsg || "加入失败");
                if(self._clubJoinComp && self._clubJoinComp.onResetClicked){ self._clubJoinComp.onResetClicked(); } //失败清空重输
                return;
            }
            if(self._clubJoinWin){ self._clubJoinWin.active = false; }
            cc.vv.wc.showError("已加入俱乐部「" + ret.name + "」");
            self._clubShowMine();
            self._clubRefreshList();
        });
    },

    //关闭加入弹窗
    _clubCloseJoinWin:function(){
        if(this._clubJoinWin){ this._clubJoinWin.active = false; }
    },

    //关闭创建俱乐部弹窗
    _clubCloseCreateWin:function(){
        if(this._clubCreateWin){ this._clubCreateWin.active = false; }
    },

    //从牌桌返回俱乐部场景时调用:直接打开指定俱乐部的独立玩法详情页(不经过俱乐部弹窗)
    _clubBackToDetail:function(clubid){
        var self = this;
        cc.vv.http.sendRequest("/club_list",{
            account:cc.vv.userMgr.account,
            sign:cc.vv.userMgr.sign
        },function(ret){
            if(ret.errcode !== 0){ self.openClubPanel(); return; } //失败兜底:回俱乐部页
            self._myClubs = ret.clubs || [];
            var club = null;
            for(var i = 0; i < self._myClubs.length; i++){
                if(self._myClubs[i].id == clubid){ club = self._myClubs[i]; break; } //id可能number/string混用,宽松比较防止===类型不一致匹配失败回落列表页
            }
            if(club){ self._wfOpenDetail(club); } //直达独立玩法详情页
            else{ self.openClubPanel(); } //俱乐部不存在了,兜底回俱乐部页
        });
    },

    //打开独立玩法详情页:整页独立节点(点俱乐部/牌桌返回都走这里)
    _wfOpenDetail:function(club){
        if(this._wfPanel){ this._wfClose(); } //已打开则先关掉旧页
        var canvas = cc.find("Canvas");
        if(!canvas){ return; }
        var vs = cc.view.getVisibleSize();
        var vo = cc.view.getVisibleOrigin();
        //固化场景(club.fire):复用场景内wfPage骨架,只显示/布局,不重建
        var bakedPage = canvas.getChildByName("wfPage");
        if(bakedPage){
            bakedPage.active = true; //尺寸/位置由场景Widget控制,JS不写几何
            var maskB = bakedPage.getChildByName("mask");
            if(maskB){
                if(!bakedPage._clubBound){ maskB.on(cc.Node.EventType.TOUCH_START,function(){}); } //吞触摸,防穿透
            }
            bakedPage._clubBound = true;
            var areaB = bakedPage.getChildByName("listArea"); //listArea几何同样由场景Widget控制
            this._wfPanel = bakedPage;
            this._wfBaked = true;
            this._wfSaved = { panel:this._clubPanel, area:this._clubListArea, closeBtn:this._clubCloseBtn, baked:this._clubBaked };
            this._clubBaked = true; //详情页骨架同为固化节点,_clubClearList据此保留静态背景(否则会被当运行时节点销毁,背景丢失)
            this._clubPanel = bakedPage;
            this._clubListArea = areaB;
            this._clubCloseBtn = null; //独立页无右上角X
            if(this._wfSaved.panel){ this._wfSaved.panel.active = false; } //俱乐部页若开着则隐藏
            //静态背景节点引用,尺寸由场景Widget控制
            this._clubDetailBgNode = bakedPage.getChildByName("detailBgImg");
            this._clubDetailFullBg = bakedPage.getChildByName("detailFullBg");
            this._clubOpenDetail(club); //复用原详情渲染(左玩法右牌桌),全部画到独立页上
            return;
        }
    },

    //独立玩法详情页返回:关闭独立页,恢复并打开俱乐部页(列表保持展开)
    _wfBack:function(){
        cc.vv.fromClubId = null; //用户主动返回俱乐部列表:清掉来源俱乐部标记,避免下次进club场景又跳回详情页
        cc.vv.fromClub = false;
        this._wfClose();
        this.openClubPanel();
        this._clubShowMine(); //从详情页返回属于列表内操作,恢复到"我的俱乐部"列表
    },

    //仅关闭独立玩法详情页并恢复俱乐部页引用(不打开俱乐部页)
    _wfClose:function(){
        this._clubStopTableWatch();
        var saved = this._wfSaved;
        if(this._wfPanel && cc.isValid(this._wfPanel)){
            if(this._wfBaked){ this._wfPanel.active = false; } //固化场景节点只隐藏不销毁
            else{ this._wfPanel.destroy(); }
        }
        this._wfBaked = false;
        this._wfPanel = null;
        this._clubDetailBgNode = null;
        this._clubDetailFullBg = null;
        this._clubBackBtn = null;
        this._clubTablesNode = null;
        this._clubGameRows = null;
        if(saved){
            this._clubPanel = saved.panel;
            this._clubListArea = saved.area;
            this._clubCloseBtn = saved.closeBtn;
            this._clubBaked = saved.baked; //恢复俱乐部页自身的固化标记
            this._wfSaved = null;
        }
        this._clubState = null;
    },

    //俱乐部详情:左侧玩法列表+右侧桌面列表
    _clubOpenDetail:function(club){
        var self = this;
        this._clubCur = club;
        this._clubCurGame = null;
        this._clubState = "detail";
        this._clubSetTop(true,club.name);
        cc.vv.http.sendRequest("/club_games",{
            account:cc.vv.userMgr.account,
            sign:cc.vv.userMgr.sign,
            clubid:club.id
        },function(ret){
            if(ret.errcode !== 0){
                cc.vv.wc.showError(ret.errmsg || "获取玩法失败");
                return;
            }
            self._clubGames = ret.games || [];
            self._clubRenderDetail();
        });
    },

    _clubRenderDetail:function(){
        var self = this;
        this._clubClearList();
        var area = this._clubListArea;
        var ah = area.height || 460;
        var vs = cc.view.getVisibleSize();
        //整页背景图(固化节点 detailBgImg,贴图 club_detail_bg 已直接配置在场景中),尺寸由场景Widget控制
        var existBg = this._clubPanel.getChildByName("detailBgImg");
        this._clubDetailBgNode = existBg;
        //左侧底色/顶部通栏不再由JS绘制:全部背景交给场景节点(编辑器里控制),JS只清掉残留
        var fullBg = this._clubPanel.getChildByName("detailFullBg"); //固化场景节点(Graphics组件已挂)
        this._clubDetailFullBg = fullBg;
        var fbg = fullBg.getComponent(cc.Graphics);
        fbg.clear();
        //详情页右上角退出按钮禁用,离开详情用左上角返回按钮
        if(this._clubCloseBtn){ this._clubCloseBtn.active = false; }
        //左上角返回按钮(固化节点 btnBack,贴图 club_btn_back 自带文字已配置,文字Label在场景中隐藏)
        var backBtn = this._clubFind(area,"btnBack");
        if(backBtn){
        //位置由场景控制(编辑器里调整),JS只绑定点击
        backBtn._clubW = backBtn.width; backBtn._clubH = backBtn.height;
        if(!backBtn._clubBound){
            backBtn._clubBound = true;
            backBtn.on(cc.Node.EventType.TOUCH_END,function(){ self._wfBack(); }); //独立页返回:回俱乐部页
        }
        this._clubBackBtn = backBtn;
        }
        //返回按钮右边显示俱乐部名称(顶部通栏内,白底通栏用黑字),与返回按钮间距固定30px
        var cnNode = this._clubFind(area,"clubName");
        if(cnNode){
            var cl = cnNode.getComponent(cc.Label);
            var cobj = this._clubCur || {};
            //俱乐部名字段兼容:服务器可能返回 name / club_name / clubName
            var cname = cobj.name || cobj.club_name || cobj.clubName || "";
            if(cl && cname){ cl.string = cname; } //取不到名字时保留场景里的默认文字,不置空
            cnNode.active = true;
            //俱乐部名称:黑色字体
            cnNode.color = new cc.Color(0,0,0,255);
            //与返回按钮右侧边缘保持30px间距(两节点可能不同父节点,用世界坐标换算避免偏差)
            if(backBtn && cnNode.parent){
                var backRightWorld = backBtn.convertToWorldSpaceAR(cc.v2((1 - backBtn.anchorX) * backBtn.width, 0));
                var backRightLocal = cnNode.parent.convertToNodeSpaceAR(backRightWorld);
                cnNode.x = backRightLocal.x + 30 + cnNode.anchorX * cnNode.width;
            }
        }

        //左侧玩法列表:行结构(gameRowTpl含bgimg背景图+l名称Label)固化在场景games下,JS只克隆填文字+赋图
        var gamesNode = this._clubFind(area,"games");
        if(!gamesNode){ return; }
        //保留gameRowTpl模板、emptyTip提示、samptext标题图(场景固化,按钮上方的"玩法列表"标签),只清动态克隆的行
        var grTpl = gamesNode.getChildByName("gameRowTpl");
        var etNode = gamesNode.getChildByName("emptyTip");
        var tiNode = gamesNode.getChildByName("samptext");
        gamesNode.removeAllChildren();
        if(tiNode){ gamesNode.addChild(tiNode); }
        if(grTpl){ gamesNode.addChild(grTpl); grTpl.active = false; }
        if(etNode){ gamesNode.addChild(etNode); }
        this._clubGameRows = [];
        var games = this._clubGames || [];
        var ROW_H = grTpl ? grTpl.height : 68;
        var ROW_GAP = ROW_H + 5;
        //行组在games容器内从顶部往下排列(容器尺寸/位置由场景Widget控制,JS不碰)
        var topY = gamesNode.height / 2 - ROW_H / 2 - 130; //按钮自身再下移130,容器保持原位
        //暂无玩法提示:固化在场景games下的emptyTip节点(文案/样式在编辑器调),JS只控制显隐
        var et = gamesNode.getChildByName("emptyTip");
        if(et){ et.active = (games.length == 0); }
        games.forEach(function(gm,i){
            var row = grTpl ? cc.instantiate(grTpl) : new cc.Node("row"+i);
            row.active = true;
            row.setPosition(0, topY - i * ROW_GAP);
            gamesNode.addChild(row);
            var lNode = row.getChildByName("l");
            if(lNode){
                //文字布局运行时强制:占满整行+居中+白字+自动缩放
                //(场景文件会被编辑器保存冲掉,关键排版以JS为准,编辑器里仍可改颜色/字号)
                lNode.setContentSize(row.width, row.height);
                lNode.setPosition(0, 0);
                var ll = lNode.getComponent(cc.Label);
                if(ll){
                    ll.string = gm.name || "";
                    ll.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
                    ll.verticalAlign = cc.Label.VerticalAlign.CENTER;
                    ll.overflow = cc.Label.Overflow.SHRINK;
                }
            }
            var bgimg = row.getChildByName("bgimg");
            if(bgimg){
                //按钮底图:默认态=game_btn_normal.png(场景gameRowTpl>bgimg已固化),点击态=game_btn_pressed.png
                var bsp = bgimg.getComponent(cc.Sprite);
                row._iconSp = bsp;
                row._iconNormal = bsp ? bsp.spriteFrame : null;
                row._iconSel = null;
                cc.resources.load("images/club/game_btn_normal", cc.SpriteFrame, function(err,sf){
                    if(err || !sf || !cc.isValid(bgimg)){ return; }
                    row._iconNormal = sf;
                    if(!row._selected){ bsp.spriteFrame = sf; } //默认态显示按钮图
                });
                cc.resources.load("images/club/game_btn_pressed", cc.SpriteFrame, function(err,sf){
                    if(err || !sf || !cc.isValid(bgimg)){ return; }
                    row._iconSel = sf;
                    if(row._selected){ bsp.spriteFrame = sf; } //点击态换图
                });
            }
            row.on(cc.Node.EventType.TOUCH_END,function(){
                if(self._clubScrollMoved){ self._clubScrollMoved = false; return; }
                self._clubSelectGame(gm,row);
            });
            self._clubGameRows.push(row);
        });
        //右侧桌片区:可上下滚动的牌桌卡片列表
        //固化场景节点 tablesView(Mask)+tables,几何(尺寸/位置/锚点)完全由场景编辑器控制,JS不写
        var svView = this._clubFind(area,"tablesView");
        if(!svView){ return; }
        var tWidth = svView.width; //卡片列数按场景tablesView宽度算
        this._clubTablesNode = svView.getChildByName("tables");
        this._clubTablesNode.removeAllChildren();
        //拖动滚动(与俱乐部列表同一手感,拖动时不触发进桌点击),固化场景只绑一次
        if(!svView._clubBound){
            svView._clubBound = true;
            var svStartY = 0, svBaseY = 0;
            svView.on(cc.Node.EventType.TOUCH_START,function(e){
                svStartY = e.getLocation().y;
                svBaseY = self._clubTablesNode ? self._clubTablesNode.y : 0;
                self._clubTablesScrollMoved = false;
            });
            svView.on(cc.Node.EventType.TOUCH_MOVE,function(e){
                if(!self._clubTablesNode){ return; }
                var vh = svView.height;
                var cH = self._clubTablesNode.height;
                if(cH <= vh){ return; } //内容不超出,不滚动
                var dy = e.getLocation().y - svStartY;
                if(Math.abs(dy) > 6){ self._clubTablesScrollMoved = true; }
                var minY = vh/2, maxY = cH - vh/2;
                self._clubTablesNode.y = Math.max(minY,Math.min(maxY,svBaseY + dy));
            });
            svView.on(cc.Node.EventType.TOUCH_CANCEL,function(){ self._clubTablesScrollMoved = false; });
        }
        //一排固定4张牌桌(与原布局一致);容器放不下4张时按可用宽度等比缩小卡片,放得下则用编辑器里的原始大小
        var GAP = 8, PAD = 10;
        var pf2 = this._clubTableCardPrefab;
        var baseW = 260, baseS = 1;
        if(pf2 && pf2.data){
            baseW = pf2.data.width || 260;
            baseS = (pf2.data.scaleX != null) ? pf2.data.scaleX : 1;
        }
        var COLS = 4;
        var availW = tWidth - PAD * 2;
        var fitS = (availW - (COLS - 1) * GAP) / (COLS * baseW);
        if(fitS > 1){ fitS = 1; } //不放大,只有超出宽度时才缩小
        this._clubTableCols = COLS;
        this._clubTableScale = baseS * fitS;
        //默认选中第一个玩法
        if(!this._clubCurGame && games.length > 0){
            this._clubCurGame = games[0];
        }
        for(var k = 0; k < this._clubGameRows.length; ++k){
            this._clubPaintRow(this._clubGameRows[k],games[k] === this._clubCurGame);
        }
        if(this._clubCurGame){
            this._clubLoadTables();
        }
        else{
            this._clubAddRow(this._clubTablesNode,0,"← 请先选择左侧玩法","",null,520);
        }
    },

    //选中玩法:高亮行并刷新右侧牌桌
    _clubSelectGame:function(gm,row){
        this._clubCurGame = gm;
        for(var k = 0; k < this._clubGameRows.length; ++k){
            this._clubPaintRow(this._clubGameRows[k],this._clubGameRows[k] === row);
        }
        this._clubLoadTables();
    },

    //当前玩法的实际人数:4人玩法game_type以zj4开头,其余为2人玩法(牌桌数据带max_players时以它为准)
    _clubMaxPlayers:function(t){
        if(t){
            var mp = t.max_players || t.maxPlayers;
            if(mp) { return parseInt(mp); }
        }
        var gt = (this._clubCurGame && this._clubCurGame.game_type) ? this._clubCurGame.game_type : "";
        return (gt.indexOf("zj4") === 0 || gt.indexOf("zp4") === 0 || gt == "wujin") ? 4 : 2;
    },

    //创建牌桌卡片(绿色桌面+按玩法人数画座位+名称+人数),返回卡片节点
    _clubAddTableCard:function(parent,idx,t){
        var self = this;
        var PAD = 10, GAP = 8; //页边距/卡片间距(网格常量)
        var cols = this._clubTableCols || 3;
        var col = idx % cols, rowI = Math.floor(idx / cols);
        var pf = this._clubTableCardPrefab;
        if(!pf){
            //prefab未加载:先加载,完成后整表重建(节点布局可在CC编辑器双击 prefab 直接拖改)
            cc.resources.load("prefabs/club_table_card", cc.Prefab, function(err, p){
                if(err || !p){ console.log("[俱乐部]牌桌prefab加载失败", err); return; }
                self._clubTableCardPrefab = p;
                if(self._clubTablesNode && cc.isValid(self._clubTablesNode)){ self._clubLoadTables(); }
            });
            return;
        }
        //卡片有效尺寸=prefab根节点尺寸 x 一排4张的等比缩放值(实际缩放同步赋给卡片节点,保证不超出容器右侧)
        var sc = this._clubTableScale || 1;
        var CW = ((pf.data && pf.data.width) || 260) * sc;
        var CH = ((pf.data && pf.data.height) || 210) * sc;
        //整排卡片水平居中,两侧边距对称
        var gridW = cols * CW + (cols - 1) * GAP;
        var startX = -gridW / 2 + CW / 2;
        var startY = -PAD - CH/2; //内容节点锚点(0.5,1),原点在上边中点,向下为负
        var card = cc.instantiate(pf);
        card.setScale(sc, sc);
        card.setPosition(startX + col * (CW + GAP),startY - rowI * (CH + GAP));
        parent.addChild(card);
        //座位:0=左 1=右 2=上 3=下;2人桌隐藏上/下座位;空位只显空椅,有人落坐按性别显示人物(性别不明默认男性)
        var sides = ["L","R","T","B"];
        var maxP = this._clubMaxPlayers(t);
        var uids = [t.user_id0 || 0,t.user_id1 || 0,t.user_id2 || 0,t.user_id3 || 0];
        var slotList = [];
        for(var i = 0; i < 4; i++){
            var st = card.getChildByName("seat" + i);
            if(!st){ continue; }
            if(i >= maxP){ st.active = false; continue; }
            st._side = sides[i];
            var chara = st.getChildByName("chara");
            if(chara){ chara.active = false; } //prefab里的人物图仅编辑器占位参考,运行时按落座情况显隐
            slotList.push(st);
            this._clubSetSeat(st,uids[i] || 0);
        }
        if(!this._clubTableCardMap){ this._clubTableCardMap = {}; }
        var ent = {card:card,slots:slotList,uids:uids};
        this._clubTableCardMap[t.id] = ent; //供长连接推送增量刷新落座人物
        if(t.roomid){ this._clubTableCardMap["r_" + t.roomid] = ent; } //推送按roomid定位卡片,避免走DB全表刷新(异步写库有时序差)
        //桌面名称:牌桌号后面加"号桌"二字
        var nn = card.getChildByName("n");
        if(nn){
            var nl = nn.getComponent(cc.Label);
            if(nl){ nl.string = (t.name || "") + "号桌"; }
        }
        //底分/局数(取桌conf的选择索引,换算玩法配置的选项值)
        var confObj = {};
        try{ confObj = JSON.parse(t.conf) || {}; }catch(e){}
        var cgame = this._clubCurGame || {};
        var difens = cgame.difen_options || [];
        var jushus = cgame.jushu_options || [];
        var df = (typeof confObj.difen === 'number' && difens[confObj.difen] != null) ? difens[confObj.difen] : confObj.difen;
        var js = (typeof confObj.jushuxuanze === 'number' && jushus[confObj.jushuxuanze] != null) ? jushus[confObj.jushuxuanze] : confObj.jushuxuanze;
        var cn = card.getChildByName("c");
        if(cn){
            var cl = cn.getComponent(cc.Label);
            if(cl){ cl.string = "底分" + (df != null ? df : "-") + "  局数" + (js != null ? js : "-"); }
        }
        //清空按钮(仅俱乐部创建者可见,服务端club_tables下发can_clear标记):解散牌桌绑定房间并踢出所有玩家
        var btnClear = card.getChildByName("btnClear");
        if(btnClear){
            btnClear.active = !!t.can_clear;
            if(t.can_clear){
                btnClear.off(cc.Node.EventType.TOUCH_END);
                btnClear.on(cc.Node.EventType.TOUCH_END,function(ev){
                    ev.stopPropagation(); //阻止冒泡触发卡片进桌点击
                    if(self._clubTablesScrollMoved){ self._clubTablesScrollMoved = false; return; }
                    self._clubClearTable(t);
                });
            }
        }
        //点击进桌(拖动滚动时不触发)
        card.on(cc.Node.EventType.TOUCH_END,function(){
            if(self._clubTablesScrollMoved){ self._clubTablesScrollMoved = false; return; }
            self._clubEnterTable(t);
        });
        return card;
    },

    //确认弹窗(复用场景内已有alert节点:标题/内容/确定/取消,不动态创建节点不写场景文件)
    _clubShowConfirm:function(title,content,onok){
        var alertNode = cc.find("Canvas/alert");
        if(!alertNode){
            if(onok){ onok(); }
            return;
        }
        var self = this;
        if(!this._clubAlertBound){
            this._clubAlertBound = true;
            var okBtn = alertNode.getChildByName("btn_ok");
            var cancelBtn = alertNode.getChildByName("btn_cancel");
            if(okBtn){
                okBtn.on(cc.Node.EventType.TOUCH_END,function(){
                    alertNode.active = false;
                    var f = self._clubAlertOk; self._clubAlertOk = null;
                    if(f){ f(); }
                });
            }
            if(cancelBtn){
                cancelBtn.on(cc.Node.EventType.TOUCH_END,function(){
                    alertNode.active = false;
                    self._clubAlertOk = null;
                });
            }
        }
        var tLb = cc.find("Canvas/alert/title");
        var cLb = cc.find("Canvas/alert/content");
        if(tLb){ tLb = tLb.getComponent(cc.Label); if(tLb){ tLb.string = title; } }
        if(cLb){ cLb = cLb.getComponent(cc.Label); if(cLb){ cLb.string = content; } }
        this._clubAlertOk = onok;
        alertNode.active = true;
    },

    //清空牌桌(仅俱乐部创建者):解散牌桌绑定的房间、踢出所有玩家并彻底释放房间占用,
    //清空后被释放的玩家可自由进入其它房间
    _clubClearTable:function(t){
        var self = this;
        this._clubShowConfirm("清空牌桌","确定清空「" + (t.name || "") + "号桌」?将解散房间并踢出所有玩家",function(){
            cc.vv.wc.show("正在清空牌桌");
            cc.vv.http.sendRequest("/club_clear_table",{
                account:cc.vv.userMgr.account,
                sign:cc.vv.userMgr.sign,
                tableid:t.id
            },function(ret){
                cc.vv.wc.hide();
                if(ret.errcode !== 0){
                    cc.vv.wc.showError(ret.errmsg || "清空失败");
                    return;
                }
                self._clubTablesSig = null; //强制重建列表
                self._clubLoadTables();
            });
        });
    },

    //给节点赋图集帧(原textures散图已并入: male/椅子/牌桌在club_ui, female在hall_ui):CUSTOM模式防止节点被图片原始尺寸撑大,加载完成后恢复目标尺寸
    _clubApplyFrame:function(node,texKey){
        if(!node || !cc.isValid(node)){ return; }
        var w = node.width, h = node.height;
        var sp = node.getComponent(cc.Sprite);
        if(!sp){ sp = node.addComponent(cc.Sprite); }
        sp.sizeMode = cc.Sprite.SizeMode.CUSTOM;
        //女性人物图不在任何图集里(hall_ui/club_ui均无club_female帧,原路径为死代码),
        //以散图放在resources/images/club/下直接按SpriteFrame加载
        if(texKey.indexOf("club_female") === 0){
            cc.resources.load("images/club/" + texKey, cc.SpriteFrame, function(err, f){
                if(err || !f || !cc.isValid(node)){ return; }
                var sp2 = node.getComponent(cc.Sprite);
                if(sp2){
                    sp2.sizeMode = cc.Sprite.SizeMode.CUSTOM;
                    sp2.spriteFrame = f;
                    node.setContentSize(w, h);
                }
            });
            return;
        }
        this._loadAtlasFrame("images/atlas/club_ui", texKey + ".png", function(f){
            if(!f || !cc.isValid(node)){ return; }
            var sp2 = node.getComponent(cc.Sprite);
            if(sp2){
                sp2.sizeMode = cc.Sprite.SizeMode.CUSTOM;
                sp2.spriteFrame = f;
                node.setContentSize(w, h);
            }
        });
    },

    //设置牌桌座位人物:uid>0按性别显示落座人物(sex=2为女性,无法区分默认男性),0=恢复空位
    _clubSetSeat:function(slotNode,uid){
        if(!slotNode || !cc.isValid(slotNode)){ return; }
        uid = uid || 0;
        if(slotNode._uid === uid){ return; } //同一玩家不重复加载
        slotNode._uid = uid;
        var chara = slotNode.getChildByName("chara");
        if(!chara){ return; }
        if(uid <= 0){
            chara.active = false; //空位:只显示空椅子
            var nick0 = slotNode.getChildByName("nick");
            if(nick0){ nick0.active = false; }
            return;
        }
        var self = this;
        var apply = function(info){
            if(!cc.isValid(chara)){ return; }
            var female = info && Number(info.sex) === 2; //性别不明默认男性
            var side = slotNode._side || "L";
            //左侧座位人物面朝右(用_l图),右侧座位面朝左(用_r图);上/下无对应椅子,分别复用左/右人物
            var key;
            if(side === "R" || side === "B"){
                key = female ? "club_female_r" : "club_male_r";
            }
            else{
                key = female ? "club_female_l" : "club_male_l";
            }
            self._clubApplyFrame(chara, key);
            chara.active = true;
            //人物上方显示玩家昵称:宽=卡片一半(130),超出裁剪
            var nick = slotNode.getChildByName("nick");
            if(!nick){
                nick = new cc.Node("nick");
                var nlb = nick.addComponent(cc.Label);
                nlb.fontSize = 13;
                nlb.lineHeight = 16;
                nlb.overflow = cc.Label.Overflow.CLAMP;
                nick.setContentSize(130,16);
                nick.color = cc.Color.WHITE;
                slotNode.addChild(nick);
            }
            nick.getComponent(cc.Label).string = (info && info.name) || "";
            nick.setPosition(0, chara.y + chara.height/2 + 10);
            nick.active = true;
        };
        if(cc.vv.baseInfoMap && cc.vv.baseInfoMap[uid] != null && cc.vv.baseInfoMap[uid].sex != null){
            apply(cc.vv.baseInfoMap[uid]);
            return;
        }
        //性别走账号服/base_info(含sex),结果进baseInfoMap缓存
        cc.vv.http.sendRequest("/base_info",{userid:uid},function(ret){
            var info = {name:(ret && ret.name) || "",sex:(ret ? ret.sex : null),url:(ret && ret.headimgurl) ? ret.headimgurl + ".jpg" : null};
            if(cc.vv.baseInfoMap == null){ cc.vv.baseInfoMap = {}; }
            cc.vv.baseInfoMap[uid] = info;
            apply(info);
        },cc.vv.http.master_url);
    },

    //牌桌列表改为「打开时拉一次 + 游戏服长连接推送」,取消3秒轮询
    //说明:俱乐部场景下 cc.vv.net 并未建立连接,故这里单独向游戏服建立一条轻量订阅连接(句柄独立于 cc.vv.net)
    _clubStartTableWatch:function(){
        if(!this._clubCur || !this._clubCur.id){ return; }
        this._clubSubConnect(this._clubCur.id);
    },

    _clubStopTableWatch:function(){
        this._clubSubStop();
    },

    //建立/复用俱乐部订阅连接:同俱乐部只刷新玩法参数,切换俱乐部先断开旧连接
    _clubSubConnect:function(clubId){
        var self = this;
        if(!(clubId > 0)){ return; }
        if(this._clubSubSio && this._clubSubClubId === clubId){
            this._clubSubEmit();
            return;
        }
        this._clubSubStop();
        this._clubSubClubId = clubId;
        //向大厅服询问游戏服socket地址(地址来自服务端配置,客户端不硬编码)
        cc.vv.http.sendRequest("/club_subscribe_info",{
            account:cc.vv.userMgr.account,
            sign:cc.vv.userMgr.sign,
            clubid:clubId
        },function(ret){
            if(ret == null || ret.errcode !== 0 || !ret.ip || !ret.port){
                console.log("[俱乐部订阅]获取游戏服地址失败,静默降级为HTTP拉取");
                return;
            }
            if(self._clubSubClubId !== clubId){ return; } //期间已切换/离开
            self._clubSubOpen(ret.ip + ":" + ret.port);
        });
    },

    //实际建立订阅连接(独立于 cc.vv.net 的局部句柄,连接失败不打断用户,静默降级)
    _clubSubOpen:function(addr){
        var self = this;
        if(typeof window === "undefined" || window.io == null){ return; }
        var opts = {
            'reconnection':true,
            'reconnectionDelay':3000,
            'force new connection': true,
            'transports':['websocket', 'polling']
        };
        var sio = null;
        try{
            sio = window.io.connect(addr,opts);
        }catch(e){
            console.log("[俱乐部订阅]连接异常:" + (e && e.message));
            return;
        }
        this._clubSubSio = sio;
        sio.on('connect',function(){ self._clubSubEmit(); });   //(重)连接成功后重新订阅
        sio.on('connect_error',function(){ /*静默降级*/ });
        sio.on('club_update',function(data){ self._clubSubOnUpdate(data); });
    },

    //发送订阅请求(携带当前俱乐部与玩法)
    _clubSubEmit:function(){
        var sio = this._clubSubSio;
        if(!sio || !this._clubSubClubId){ return; }
        var gameType = (this._clubCurGame && this._clubCurGame.game_type) ? this._clubCurGame.game_type : null;
        sio.emit('club_subscribe',{clubid:this._clubSubClubId,game_type:gameType});
    },

    //收到服务端推送:仅当俱乐部详情页可见时刷新桌面列表
    //推送处理:优先按payload增量刷新对应牌桌的头像(避免整表重建抖动),无法增量时回退整表刷新
    _clubSubOnUpdate:function(data){
        if(!this._clubPanel || !this._clubPanel.active){ return; }
        if(this._clubState !== "detail" || !this._clubCurGame){ return; }
        //房间已空(玩家全部退出/房间解散):直接用推送数据清空该桌座位,不依赖DB回查——
        //服务端推送早于异步写库完成,此时拉 /club_tables 会读回旧数据(还是退出前的占位),列表表现为"退出后不更新"
        if(data && (data.player_count === 0 || (data.seats && data.seats.length === 0))){
            var ent0 = (data.roomid && this._clubTableCardMap) ? this._clubTableCardMap["r_" + data.roomid] : null;
            if(ent0){
                for(var k0 = 0; k0 < ent0.slots.length; ++k0){
                    this._clubSetSeat(ent0.slots[k0],0);
                }
                if(ent0.uids){
                    for(var u0 = 0; u0 < ent0.uids.length; ++u0){ ent0.uids[u0] = 0; }
                }
                delete this._clubTableCardMap["r_" + data.roomid];
            }
            //签名置空:后续任何拉取都强制按DB最终态重建一次,保证与本地清空后的显示对齐
            this._clubTablesSig = null;
            this._clubLoadTables();
            return;
        }
        if(data && data.roomid && this._clubTableCardMap && this._clubTableCardMap["r_" + data.roomid]){
            var ent = this._clubTableCardMap["r_" + data.roomid];
            var seats = data.seats || [];
            var uids = [];
            for(var i = 0; i < ent.slots.length; ++i){ uids.push(0); }
            for(var j = 0; j < seats.length; ++j){
                var si = seats[j].seatindex;
                if(si >= 0 && si < uids.length){ uids[si] = seats[j].userid || 0; }
            }
            for(var k = 0; k < ent.slots.length; ++k){
                this._clubSetSeat(ent.slots[k],uids[k]);
            }
            return;
        }
        this._clubLoadTables();
    },

    //断开订阅连接并移除监听,避免句柄泄漏
    _clubSubStop:function(){
        var sio = this._clubSubSio;
        if(sio){
            try{
                if(sio.off){ sio.off('club_update'); }
                sio.disconnect();
            }catch(e){}
        }
        this._clubSubSio = null;
        this._clubSubClubId = null;
    },

    //加载当前玩法下的桌面列表(数据无变化时不重建节点,避免抖动)
    _clubLoadTables:function(){
        this._clubStartTableWatch();
        var self = this;
        cc.vv.http.sendRequest("/club_tables",{
            account:cc.vv.userMgr.account,
            sign:cc.vv.userMgr.sign,
            clubid:this._clubCur.id,
            game_type:this._clubCurGame.game_type
        },function(ret){
            if(ret.errcode !== 0){
                cc.vv.wc.showError(ret.errmsg || "获取桌面失败");
                return;
            }
            var tables = ret.tables || [];
            //签名比对:桌面数据未变化则跳过重建,消除刷新造成的列表抖动(玩家ID也纳入,头像变化触发重建)
            var sig = "";
            for(var i = 0; i < tables.length; ++i){
                sig += (tables[i].id || "") + ":" + (tables[i].player_count || 0) + ":"
                    + (tables[i].user_id0 || 0) + "," + (tables[i].user_id1 || 0) + ","
                    + (tables[i].user_id2 || 0) + "," + (tables[i].user_id3 || 0) + ",";
            }
            if(sig === self._clubTablesSig && self._clubTablesNode && self._clubTablesNode.childrenCount > 0){
                return;
            }
            self._clubTablesSig = sig;
            self._clubTableCardMap = {}; //整表重建前清空卡片映射
            self._clubTablesNode.removeAllChildren();
            self._clubTablesNode.y = self._clubTablesNode.parent.height/2; //重建后回到顶部
            //内容高度随桌数增长,超出视口后可拖动滚动(卡片有效高=prefab根高x根缩放x一排4张的等比缩放)
            var cardH = 210;
            if(self._clubTableCardPrefab && self._clubTableCardPrefab.data){
                cardH = ((self._clubTableCardPrefab.data.height) || 210) * ((self._clubTableCardPrefab.data.scaleX) || 1);
            }
            cardH *= (self._clubTableScale || 1);
            var colsN = self._clubTableCols || 1;
            var rowsN = Math.ceil(tables.length / colsN);
            var cH = Math.max(self._clubTablesNode.parent.height, 10 + rowsN * cardH + Math.max(0,rowsN - 1) * 12 + 10);
            self._clubTablesNode.setContentSize(self._clubTablesNode.width,cH);
            if(tables.length == 0){
                self._clubAddRow(self._clubTablesNode,0,"暂无桌面(管理员后台添加)","",null,520);
                return;
            }
            tables.forEach(function(t,i){
                self._clubAddTableCard(self._clubTablesNode,i,t);
            });
        });
    },

    //点击桌面进入游戏(服务端复用未满房间或自动建房)
    _clubEnterTable:function(t){
        var self = this;
        var wc = cc.vv.wc;
        //前置校验:没房卡不能进房间(查账号服真实余额,5秒缓存防连点重复请求)
        var now = Date.now();
        var cached = this._gemsCache;
        var checkAndEnter = function(gems){
            self._gemsCache = {gems:gems,at:Date.now()};
            if(!(gems > 0)){
                wc.showError("房卡不足，无法进入桌面");
                return;
            }
            self._doEnterTable(t);
        };
        if(cached && now - cached.at < 5000){
            checkAndEnter(cached.gems);
            return;
        }
        wc.show("正在进入「" + t.name + "」");
        //get_user_status走账号服(hall_url),返回{gems:真实余额}
        cc.vv.http.sendRequest("/get_user_status",{account:cc.vv.userMgr.account,sign:cc.vv.userMgr.sign},function(ret){
            var gems = (ret && ret.gems != null) ? Number(ret.gems) : 0;
            checkAndEnter(gems);
        });
    },

    _doEnterTable:function(t){
        var self = this;
        var wc = cc.vv.wc;
        wc.show("正在进入「" + t.name + "」");
        console.log("[进入房间]请求桌面 tableid=" + t.id + " name=" + t.name);
        //看门狗:12秒内若仍未进入游戏场景,则隐藏遮罩并给出可见原因,避免永久卡住
        var guard = setTimeout(function(){
            if(cc.vv.wc !== wc){ return; }
            wc.showError("进入房间失败,请重试(服务未响应)");
        },12000);
        cc.vv.http.sendRequest("/club_enter_table",{
            account:cc.vv.userMgr.account,
            sign:cc.vv.userMgr.sign,
            tableid:t.id
        },function(ret){
            try{
                if(ret == null || ret.errcode !== 0){
                    console.log("[进入房间]失败:" + (ret ? ret.errcode + " " + ret.errmsg : "无响应"));
                    clearTimeout(guard);
                    wc.showError((ret && ret.errmsg) ? ret.errmsg : "进入桌面失败");
                    return;
                }
                console.log("[进入房间]成功 roomid=" + ret.roomid + " ip=" + ret.ip + ":" + ret.port);
                clearTimeout(guard);
                if(self._clubPanel){ self._clubPanel.active = false; }
                self._clubStopTableWatch(); //离开俱乐部页进入牌桌:断开订阅连接,避免句柄泄漏
                cc.vv.fromClub = true; //标记本次进桌来自俱乐部,游戏结束回俱乐部场景后直达详情页
                cc.vv.fromClubId = self._clubCur ? self._clubCur.id : null; //记住来源俱乐部,回俱乐部场景直达它的玩法详情页
                cc.vv.gameNetMgr.connectGameServer(ret);
            }catch(e){
                console.log("[进入房间]异常:" + (e && e.message));
                clearTimeout(guard);
                wc.showError("进入房间异常:" + (e && e.message));
            }
        });
    },

    //关闭俱乐部页:独立场景下即返回大厅场景
    _clubClosePanel:function(){
        this._clubStopTableWatch();
        cc.director.loadScene("hall");
    },

    onDestroy:function(){
        this._clubStopTableWatch();
    },

});
