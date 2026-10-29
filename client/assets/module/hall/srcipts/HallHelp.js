//大厅「玩法介绍」弹窗:内容区左侧玩法列表 + 右侧玩法说明
//列表来自服务端 /game_list(后台启用的玩法),点击切换右侧说明
//玩法在弹窗里的显示名(不改后台配置的名称)
var DISPLAY_NAMES = {
    zj_zx: "自选麻将",
    guanpai2: "诸暨关牌"
};
function displayName(g) {
    if (g == null) { return ""; }
    return DISPLAY_NAMES[g.type] || g.name || g.type;
}
var TEXTS = {
    zj: "2人诸暨麻将,开局翻出财神,财神可当任意牌使用。\n" +
        "· 财神可吃、碰、杠(由后台开关控制)。\n" +
        "· 按台数计分,需达到后台设置的起胡台数才能胡,台数越多分越高,超过封顶按封顶台数算。\n" +
        "· 天胡、地胡、漏胡等由后台开关与台数配置决定。\n" +
        "· 杠上开花、抢杠等按后台台数配置计分。",
    zj_bt: "2人玩法,开局先叫包:选择无财/独财/双财并报出包几台,叫台大的一方成为包家,由包家从手牌中定财神。\n" +
           "· 包家胡牌必须达到自己所包的台数,闲家胡牌只需达到后台最低起胡台数。\n" +
           "· 同台数时大小顺序:无财 > 独财 > 双财。\n" +
           "· 结算分两项:胡牌分按台数每台翻倍,包台分按所包台数每台翻倍。\n" +
           "· 老庄时包台分翻倍。\n" +
           "· 包家不包则推给闲家,闲家也不包时由庄家按所包台数硬包。",
    zj_lao: "2人推倒胡玩法,没有台数门槛,胡牌即算。\n" +
            "· 不做台数结算,只有后台开启的翻倍项(财吊、天胡、地胡等)参与计分。\n" +
            "· 吃、碰、杠、点炮等规则与诸暨麻将一致。",
    zj_zx: "2人玩法,开局不发财神。\n" +
           "· 胡牌时自选财神方案:无财、独财或双财(双财为相连的两张)。\n" +
           "· 选定方案后从手牌中选出对应的财神牌,定财神后即满足胡牌条件。\n" +
           "· 仍需达到后台设置的起胡台数才能胡。\n" +
           "· 无财、独财方案计分翻倍(后台配置)。",
    zj4_zx: "4人玩法,规则与2人自选麻将一致,开局不发财神,胡牌时自选财神方案。",
    guanpai2: "2人扑克玩法,先出完手牌的一方获胜。\n" +
              "· 牌型:单张、对子、三张、顺子、炸弹(由后台开关控制)。\n" +
              "· 2 不参与顺子;后台开启后 A 可作最小牌与 2 相连。\n" +
              "· 首局由持有最小黑桃的一方先出,之后由上一局赢家先出。\n" +
              "· 记牌器(历史出牌辅助)由后台开关控制。",
    guanpai3: "3人扑克玩法,先出完手牌的一方获胜,规则与2人关牌一致。"
};

cc.Class({
    extends: cc.Component,

    properties: {
    },

    onLoad: function () {
    },

    //由 hall 在点击帮助按钮时调用
    open: function (helpNode) {
        this.initView(helpNode);
        this.loadList();
    },

    initView: function (helpNode) {
        this._help = helpNode;
        this._games = [];
        this._cur = -1;
        this._items = [];
        var root = this._help;
        if(root == null){ return; }

        this._title = root.getChildByName("xzdd_title");
        this._body = root.getChildByName("xzdd_help");
        //标题/正文的锚点、尺寸、位置和字号全部在场景里设置,这里只取节点引用

        //左侧列表容器:优先用场景里的 helpList 节点(列表项也放场景里,位置由编辑器控制)
        if(!cc.isValid(this._listRoot)){
            this._listRoot = root.getChildByName("helpList");
        }
        if(this._listRoot == null){
            this._listRoot = new cc.Node("helpList");   //场景没有时兜底
            this._listRoot.parent = root;
        }

        //按钮底图:大厅图集里的按钮-button1
        var self = this;
        if(this._atlas == null){
            cc.resources.load("images/atlas/hall_ui", cc.SpriteAtlas, function(err, atlas){
                self._atlas = err ? null : atlas;
                self.refreshItems();
            });
        }
    },

    loadList: function () {
        var self = this;
        cc.vv.http.sendRequest("/game_list", {
            account: cc.vv.userMgr.account,
            sign: cc.vv.userMgr.sign
        }, function (ret) {
            if (ret == null || ret.errcode != 0) {
                if (cc.vv.wc) { cc.vv.wc.showError("玩法列表获取失败"); }
                return;
            }
            self._games = ret.games || [];
            self.renderList();
        });
    },

    renderList: function () {
        if (this._listRoot == null) { return; }
        //只清理由JS创建的兜底项,场景里摆好的列表项必须保留(位置由编辑器控制)
        for (var k = this._listRoot.childrenCount - 1; k >= 0; --k) {
            var ch = this._listRoot.children[k];
            if (ch._helpAutoCreated) { this._listRoot.removeChild(ch, true); }
        }
        //场景里的列表项按编辑器顺序依次对应各个玩法
        var slots = this._listRoot.children.slice();
        this._items = [];
        for (var i = 0; i < this._games.length; ++i) {
            var item = slots[i];
            if (item == null) {
                item = this.makeFallbackItem(i);
                cc.log("[help] 场景缺少列表项节点,已用代码兜底:请在 help/helpList 下添加 item" + i);
            }
            var lbNode = item.getChildByName("Label");
            if (lbNode == null) {
                lbNode = new cc.Node("Label");
                lbNode.parent = item;
                lbNode.addComponent(cc.Label);
            }
            var lb = lbNode.getComponent(cc.Label);
            if (lb == null) { lb = lbNode.addComponent(cc.Label); }
            lb.string = displayName(this._games[i]);
            //场景里的项只填文字,字号/颜色/位置都按编辑器里设置的来
            if (item._helpAutoCreated) {
                lb.fontSize = 22;
                lb.lineHeight = 26;
                lbNode.color = cc.color(255, 255, 255);
            }
            if (item.getComponent(cc.Button) == null) { item.addComponent(cc.Button); }
            item.idx = i;
            if (!item._helpBound) {
                item._helpBound = true;
                var self = this;
                //用立即执行函数锁住当前 item:var 在循环里是同一个变量,
                //直接在闭包里取 item 会永远指到最后一项(点什么都跳关牌)
                item.on(cc.Node.EventType.TOUCH_END, (function (node) {
                    return function () {
                        self.select(node.idx);
                    };
                })(item));
            }
            this._items.push(item);
        }
        this.refreshItems();
        this.select(0);
    },

    //场景里没有对应列表项时的兜底节点(位置仅供预览,正式使用请在编辑器里摆)
    makeFallbackItem: function (i) {
        var item = new cc.Node("item" + i);
        item.parent = this._listRoot;
        item._helpAutoCreated = true;
        item.setContentSize(150, 50);
        item.setPosition(-255, 130 - i * 58);
        var spr = item.addComponent(cc.Sprite);
        spr.sizeMode = cc.Sprite.SizeMode.CUSTOM;
        return item;
    },

    //列表按钮底图(图集异步,加载完成后补上;场景里已有图片的项不覆盖)
    refreshItems: function () {
        if (this._atlas == null || this._items == null) { return; }
        var sf = this._atlas.getSpriteFrame("按钮-button1.png") || this._atlas.getSpriteFrame("按钮-button1");
        if (sf == null) { return; }
        for (var i = 0; i < this._items.length; ++i) {
            var spr = this._items[i].getComponent(cc.Sprite);
            if (spr && spr.spriteFrame == null) { spr.spriteFrame = sf; }
        }
        this.highlight();
    },

    select: function (idx) {
        var g = this._games[idx];
        if (g == null) { return; }
        cc.log("[help] select " + idx + " " + g.type);
        this._cur = idx;
        if (this._title) {
            this._title.getComponent(cc.Label).string = displayName(g);
        }
        if (this._body) {
            this._body.getComponent(cc.Label).string = TEXTS[g.type] || "该玩法暂无说明。";
        }
        this.highlight();
    },

    //当前选中项高亮(未选中置灰)
    highlight: function () {
        for (var i = 0; i < this._items.length; ++i) {
            this._items[i].color = (i == this._cur) ? cc.color(255, 255, 255) : cc.color(165, 165, 165);
        }
    }
});
