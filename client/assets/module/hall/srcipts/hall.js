var Net = require("Net")  //长连接socket
var Global = require("Global")  //mj所需方法
cc.Class({
    extends: cc.Component,

    properties: {
        // foo: {
        //    default: null,      // The default value will be used only when the component attaching
        //                           to a node for the first time
        //    url: cc.Texture2D,  // optional, default is typeof default
        //    serializable: true, // optional, default is true
        //    visible: true,      // optional, default is true
        //    displayName: 'Foo', // optional
        //    readonly: false,    // optional, default is false
        // },
        // ...
        createRoomWin:cc.Node,//创建房间
        settingsWin:cc.Node, //设置
        helpWin:cc.Node, //帮助
        xiaoxiWin:cc.Node,//消息
        zhanjiWin:cc.Node,//战绩
        btnJoinGame:cc.Node, //加入游戏
        btnReturnGame:cc.Node,//返回游戏
        joinGameWin:cc.Node,//加入房间
        notice:{
            default:null,
            type:cc.Label
        },
        lblName:cc.Label,
        lblMoney:cc.Label,
        lblGems:cc.Label,
      
    },
    //获取该this
    initNetHandlers:function(){
        var self = this;
    },
    
    // use this for initialization
    onLoad: function () {
        //回到大厅即离开俱乐部上下文:清掉来源俱乐部标记,下次从大厅进俱乐部时显示俱乐部主页而非旧详情页
        if(cc.vv){
            cc.vv.fromClub = false;
            cc.vv.fromClubId = null;
        }
        var cvs = this.node.getComponent(cc.Canvas);
        cvs.fitHeight = true;
        cvs.fitWidth = false;
        // 所有平台（浏览器预览 / Android 模拟器 / 真机）都把大厅背景拉伸铺满
        // 旧逻辑只在非原生平台执行(if(!cc.sys.isNative))，导致模拟器里背景位置不对
        var globalNode = this.node.getChildByName("global");
        var mainNode = globalNode ? globalNode.getChildByName("main") : null;
        var hallBg = mainNode ? mainNode.getChildByName("bg") : this.node.getChildByName("bg");
        var userNode = mainNode ? mainNode.getChildByName("user") : null;
        var userBar = userNode ? userNode.getChildByName("用户栏-底") : null; //顶部用户区横条
        //子元素位置以场景为准,按"左缘"定位:首次执行时采集各子元素左缘相对横条左缘的偏移,
        //运行时按左缘平移(宽屏保持固定左边距)。文字标签(昵称/房卡数)变长时只向右伸展,
        //不会被头像/底框盖住,也不再在代码里硬编码任何坐标
        var childOffsets = null;
        if(hallBg){
            var resizeHallBg = function(){
                if(!cc.isValid(hallBg)){ return; }
                //首次执行时按场景原始坐标采集偏移(必须在改动横条/子元素坐标之前,场景里摆什么位置运行时就保持什么相对位置)
                if(childOffsets == null && cc.isValid(userBar) && userNode){
                    var left0 = userBar.x - userBar.width * userBar.anchorX; //场景中横条左缘
                    childOffsets = {};
                    for(var j = 0; j < userNode.children.length; j++){
                        var c0 = userNode.children[j];
                        if(c0 === userBar){ continue; }
                        childOffsets[c0.name] = (c0.x - c0.width * c0.anchorX) - left0; //左缘偏移
                    }
                }
                var w = hallBg.getComponent(cc.Widget);
                if(w){ w.enabled = false; } //关闭残留对齐组件，防止把背景钉在画布边缘
                var vs = cc.view.getVisibleSize(); var vo = cc.view.getVisibleOrigin(); //实际可见区域尺寸(含黑边外区域)
                hallBg.setContentSize(vs.width, vs.height);
                hallBg.setPosition(hallBg.parent.convertToNodeSpaceAR(cc.v2(vo.x + vs.width/2, vo.y + vs.height/2))); //世界中心=可见区中心，父链位置不影响
                if(cc.isValid(userBar)){ //顶部用户区横条:X方向铺满,Y保持贴顶(坐标换算已包含父容器位移)
                    var w2 = userBar.getComponent(cc.Widget);
                    if(w2){ w2.enabled = false; }
                    userBar.setContentSize(vs.width, userBar.height);
                    var lp2 = userBar.parent.convertToNodeSpaceAR(cc.v2(vo.x + vs.width/2, 0));
                    userBar.setPosition(lp2.x, userBar.y);
                    //横条左缘在user容器坐标系中的X,子元素按 左缘偏移 定位:文字变长只向右伸,不会被头像盖住
                    var barLeft = userBar.x - userBar.width * userBar.anchorX;
                    for(var i = 0; i < userNode.children.length; i++){
                        var ch = userNode.children[i];
                        if(ch === userBar){ continue; }
                        var off = childOffsets[ch.name];
                        if(off == null){ continue; }
                        var wg = ch.getComponent(cc.Widget);
                        if(wg){ wg.enabled = false; } //关掉Label上残留的对齐Widget,防止运行时改坐标造成堆叠
                        ch.x = barLeft + off + ch.width * ch.anchorX;
                    }
                }
            };
            resizeHallBg();
            this.scheduleOnce(resizeHallBg, 0); //延迟一帧重算，避免onLoad时父链矩阵未就位导致定位偏移
            cc.view.setResizeCallback(resizeHallBg);
        }
        if(!cc.vv){
            cc.director.loadScene("loading");
            return;
        }
        //加载用户信息
        this.initLabels();
         //判断房间id是否为空 显示创建房间和返回房间
         cc.log("roomid",cc.vv.gameNetMgr.roomId);
        if(cc.vv.gameNetMgr.roomId == null){
            if(this.btnJoinGame) this.btnJoinGame.active = true;
            if(this.btnReturnGame) this.btnReturnGame.active = false;
        }
        else{
            if(this.btnJoinGame) this.btnJoinGame.active = false;
            if(this.btnReturnGame) this.btnReturnGame.active = true;
        }
        
        //var params = cc.vv.args;
        //获取到roomid
        var roomId = cc.vv.userMgr.oldRoomId; 
        cc.log("roomold",roomId);
        if( roomId != null){
            //不为空进入房间
            cc.vv.userMgr.oldRoomId = null;
            cc.vv.userMgr.enterRoom(roomId);
        }

    
        
        cc.vv.audioMgr.playBGM("bgMain.mp3");
        //获取设置 帮助 邮件 按钮
        this.initButtonHandler("Canvas/global/main/menu/btn_setting");
        this.initButtonHandler("Canvas/global/main/menu/btn_help");
        this.initButtonHandler("Canvas/global/main/menu/btn_xiaoxi");
        this.initButtonHandler("Canvas/global/main/menu/btn_zhanji");
        //原商城入口改为加入房间入口:与其他菜单按钮走同一绑定机制
        this.initButtonHandler("Canvas/global/main/menu/菜单-商城");
        //设置按钮返回事件
        this.helpWin.addComponent("OnBack");
        //玩法介绍弹窗整体等比缩小,上下留出外边距(文字不变形)
        this.helpWin.setScale(0.88);
        this.xiaoxiWin.addComponent("OnBack");
        this.zhanjiWin.addComponent("OnBack");

        //notice滚动条获取值
        //初始化notice值
        if(!cc.vv.userMgr.notice){
            cc.vv.userMgr.notice = {
                version:null,
                msg:"数据请求中...",
            }
        }
        
        //赋值
        this.notice.string = cc.vv.userMgr.notice.msg;
        
        this.refreshInfo();//刷新房卡信息
        this.refreshNotice();//刷新滚动条信息
        // this.refreshGemsTip(); //刷新房卡信息

        //俱乐部模式:大厅只留一个俱乐部入口,点击进入独立俱乐部场景(club.fire,页面与控制全在场景内)
        this.initClub();
    },
    //刷新房卡信息
    refreshInfo:function(){
        var self = this;
        var onGet = function(ret){
            if(ret.errcode !== 0){
                console.log(ret.errmsg);
            }
            else{
                if(ret.gems != null){
                    this.lblGems.string = ret.gems;    //房卡刷新
                }
            }
        };
        
        var data = {
            account:cc.vv.userMgr.account,
            sign:cc.vv.userMgr.sign,
        };
        cc.vv.http.sendRequest("/get_user_status",data,onGet.bind(this));
    },

    //刷新滚动条信息
    refreshNotice:function(){
        var self = this;
        var onGet = function(ret){
            if(ret.errcode !== 0){
                console.log(ret.errmsg);
            }
            else{
                cc.vv.userMgr.notice.version = ret.version;
                cc.vv.userMgr.notice.msg = ret.msg;
                this.notice.string = ret.msg;
            }
        };
        
        var data = {
            account:cc.vv.userMgr.account,
            sign:cc.vv.userMgr.sign,
            type:"notice",
            version:cc.vv.userMgr.notice.version
        };
        cc.vv.http.sendRequest("/get_message",data,onGet.bind(this));
    },
   
    //通过路径获取按钮并且添加点击事件
    initButtonHandler:function(btnPath){
        var btn = cc.find(btnPath);
        cc.vv.utils.addClickEvent(btn,this.node,"hall","onBtnClicked");        
    },
   
    //点击事件返回值
    onBtnClicked:function(event){
        if(event.target.name == "btn_setting"){
            this.settingsWin.active = true;
        }   
        else if(event.target.name == "btn_help"){
            this.helpWin.active = true;
        }
        else if(event.target.name == "btn_xiaoxi"){
            this.xiaoxiWin.active = true;
        }
        else if(event.target.name == "btn_zhanji"){
            this.zhanjiWin.active=true;
        }
        else if(event.target.name == "菜单-商城"){
            this.onJoinGameClicked(); //商城入口已改为加入房间:打开输入房号弹窗
        }
        // else if(event.target.name == "head"){
        //     cc.vv.userinfoShow.show(cc.vv.userMgr.userName,cc.vv.userMgr.userId,this.sprHeadImg,cc.vv.userMgr.sex,cc.vv.userMgr.ip);
        // }
    },
    
   //获取用户信息 
    initLabels:function(){
        this.lblName.string = cc.vv.userMgr.userName + " (ID:" + cc.vv.userMgr.userId + ")"; //用户名+用户ID
        this.lblName.node.color = cc.color(0,0,0); //昵称用黑色字体
        this.lblMoney.string = cc.vv.userMgr.coins;//金币
        this.lblGems.string = cc.vv.userMgr.gems;//房卡
    },
    
    //创建房间按钮显示
    onJoinGameClicked:function(){
        this.joinGameWin.active = true;
    },
    
    //返回按钮显示（按当前玩法分流到对应游戏场景）
    onReturnGameClicked:function(){
        cc.director.loadScene(cc.vv.gameNetMgr.getGameScene());
    },
    
    //创建房间按钮点击
    onCreateRoomClicked:function(){
        if(cc.vv.gameNetMgr.roomId != null){
            cc.vv.wc.showError("房间已经创建!\n必须解散当前房间才能创建新的房间");
            return;
        }
        console.log("onCreateRoomClicked");
        this.createRoomWin.active = true;   
    },

    // called every frame, uncomment this function to activate update callback
    update: function (dt) {
        var x = this.notice.node.x;
        x -= dt*120;
        if(x + this.notice.node.width < -360){
            x = 600;
        }
        this.notice.node.x = x;
        if(cc.vv && cc.vv.userMgr.roomData != null){
            cc.vv.userMgr.enterRoom(cc.vv.userMgr.roomData);
            cc.vv.userMgr.roomData = null;
        }
    },

    //==================== 俱乐部功能(大厅唯一入口) ====================
    //入口按钮与显隐状态已全部固化在场景文件中(Canvas/content/clubEntryBtn,贴图 textures/jlb),
    //点击进入独立俱乐部场景(club.fire):clubPage/wfPage两页的骨架与JS控制全部在club场景内完成
    initClub:function(){
        var btn = cc.find("Canvas/content/clubEntryBtn");
        if(btn && !btn._clubBound){
            btn._clubBound = true;
            btn.on(cc.Node.EventType.TOUCH_END,function(){
                cc.director.loadScene("club");
            });
        }
    },

});
