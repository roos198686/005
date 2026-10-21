cc.Class({
    extends: cc.Component,

    properties: {
        inputName:cc.EditBox,
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
    
    //随机名字点击按钮方法
    onRandomBtnClicked:function(){
        //名字
        var names = [
            "上官",
            "欧阳",
            "东方",
            "端木",
            "独孤",
            "司马",
            "南宫",
            "夏侯",
            "诸葛",
            "皇甫",
            "长孙",
            "宇文",
            "轩辕",
            "东郭",
            "子车",
            "东阳",
            "子言",
            "雀圣",
            "赌侠",
            "赌圣",
            "稳赢",
            "不输",
            "好运",
            "自摸",
            "有钱",
            "土豪",
        ];
     
        var idx = Math.floor(Math.random() * (names.length - 1));
        this.inputName.string = "YB"+names[idx]; // 名字拼接
    },

    // 初始化
    onLoad: function () {
        if(!cc.sys.isNative){
            var cvs = this.node.getComponent(cc.Canvas);
            cvs.fitHeight = true;
            cvs.fitWidth = false;
            //宽屏下把创角背景拉伸铺满，去除两侧黑边
            var roleBg = this.node.getChildByName("bg");
            if(roleBg){
                var resizeRoleBg = function(){
                    if(!cc.isValid(roleBg)){ return; }
                    var w = roleBg.getComponent(cc.Widget);
                    if(w){ w.enabled = false; } //关闭残留对齐组件，防止把背景钉在画布边缘
                    var vs = cc.view.getVisibleSize(); var vo = cc.view.getVisibleOrigin(); //实际可见区域尺寸(含黑边外区域)
                    roleBg.setContentSize(vs.width, vs.height);
                    roleBg.setPosition(roleBg.parent.convertToNodeSpaceAR(cc.v2(vo.x + vs.width/2, vo.y + vs.height/2))); //居中到可见区中心
                };
                resizeRoleBg();
                this.scheduleOnce(resizeRoleBg, 0); //延迟一帧重算，避免onLoad时父链矩阵未就位导致定位偏移
                cc.view.setResizeCallback(resizeRoleBg);
            }
        }
        this.onRandomBtnClicked();  //点击一次随机名字
    },
    
    //确定按钮
    onBtnConfirmClicked:function(){
        var name = this.inputName.string; //获取名字
        //名字不为空
        if(name == ""){
            console.log("invalid name.");
            return;
        }
        console.log(name);
        //创建用户接口
        cc.vv.userMgr.create(name);
    }
    // called every frame, uncomment this function to activate update callback
    // update: function (dt) {

    // },
});

