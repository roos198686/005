// _clubRenderDetail: 删除所有"固化节点不存在则运行时新建"的兜底分支
const fs = require('fs');
const FILE = 'd:/babykylin_scmj/client/assets/module/hall/srcipts/hall.js';
let s = fs.readFileSync(FILE, 'utf8');

function splice(startMark, endMark, replacement, name) {
    startMark = startMark.replace(/\n/g, '\r\n');
    replacement = replacement.replace(/\n/g, '\r\n');
    if (endMark) { endMark = endMark.replace(/\n/g, '\r\n'); }
    const i = s.indexOf(startMark);
    if (i < 0) {
        console.error('start not found:', name, JSON.stringify(startMark.slice(0, 80)));
        const short = name === 'fullBgGraphics' ? 'fullBg.getComponent' : startMark.slice(8, 30);
        console.error('probe idx:', s.indexOf(short), JSON.stringify(short));
        const z = s.indexOf('fbg');
        console.error('fbg at:', z, z >= 0 ? JSON.stringify(s.slice(z - 40, z + 120)) : 'NO fbg ANYWHERE');
        process.exit(1);
    }
    let j = -1;
    if (endMark) {
        j = s.indexOf(endMark, i);
        if (j < 0) { console.error('end not found:', name); process.exit(1); }
        j += endMark.length;
    }
    const cutEnd = j >= 0 ? j : i + startMark.length;
    s = s.slice(0, i) + replacement + s.slice(cutEnd);
    console.log('replaced:', name);
}

// A. detailBgImg if/else -> 直接复用
splice(
'        //整页背景图(textures/club_detail_bg):固化场景已有同名节点直接复用,否则按原逻辑新建',
'        }\n        //左侧深黑紫整列',
`        //整页背景图(固化节点 detailBgImg,贴图 club_detail_bg 已直接配置在场景中)
        var existBg = this._clubPanel.getChildByName("detailBgImg");
        this._clubDetailBgNode = existBg;
        existBg.setContentSize(vs.width, vs.height);
        existBg.setPosition(0, 0);
        //左侧深黑紫整列`,
'bgImg');

// B. fullBg 新建兜底
splice(
'        var fullBg = this._clubPanel.getChildByName("detailFullBg");\n        if(!fullBg){\n            fullBg = new cc.Node("detailFullBg");\n            this._clubPanel.addChild(fullBg);\n            fullBg.setSiblingIndex(3);\n        }',
null,
'        var fullBg = this._clubPanel.getChildByName("detailFullBg"); //固化场景节点(Graphics组件已挂)',
'fullBgNode');

splice(
'        var fbg = fullBg.getComponent(cc.Graphics) || fullBg.addComponent(cc.Graphics);',
null,
'        var fbg = fullBg.getComponent(cc.Graphics);',
'fullBgGraphics');

// C. btnBack:删贴图替换与新建兜底
splice(
'        //左上角返回按钮:回到我的俱乐部列表(1:1正方形,整体右移15px);固化场景复用btnBack节点\n        var backBtn = area.getChildByName("btnBack");\n        if(backBtn){\n            backBtn.setPosition(-vs.width/2 + 8 + 22 + 15, vs.height/2 + 2);\n            backBtn._clubW = backBtn.width; backBtn._clubH = backBtn.height;\n            if(!backBtn._clubBound){\n                backBtn._clubBound = true;\n                backBtn.on(cc.Node.EventType.TOUCH_END,function(){ self._wfBack(); }); //独立页返回:回俱乐部页\n            }\n            if(this._clubUserBackFrame){ //自制返回图自带文字,隐藏文字Label\n                var bbsp = backBtn.getComponent(cc.Sprite);\n                if(bbsp){ bbsp.sizeMode = cc.Sprite.SizeMode.CUSTOM; bbsp.spriteFrame = this._clubUserBackFrame; }\n                var bln = backBtn.getChildByName("l"); if(bln){ bln.active = false; }\n            }\n            this._clubBackBtn = backBtn;\n        }\n        else{\n            this._clubBackBtn = this._clubMakeBtn(area,-vs.width/2 + 8 + 22 + 15,vs.height/2 + 2,44,44,"返回","orange",function(){\n                self._wfBack(); //独立页返回:销毁详情页,回到俱乐部页\n            });\n        }',
null,
`        //左上角返回按钮(固化节点 btnBack,贴图 club_btn_back 自带文字已配置,文字Label在场景中隐藏)
        var backBtn = area.getChildByName("btnBack");
        backBtn.setPosition(-vs.width/2 + 8 + 22 + 15, vs.height/2 + 2);
        backBtn._clubW = backBtn.width; backBtn._clubH = backBtn.height;
        if(!backBtn._clubBound){
            backBtn._clubBound = true;
            backBtn.on(cc.Node.EventType.TOUCH_END,function(){ self._wfBack(); }); //独立页返回:回俱乐部页
        }
        this._clubBackBtn = backBtn;`,
'btnBack');

// D. clubName else 新建
splice(
'        else{\n            cnNode = new cc.Node("clubName");\n            cnNode.anchorX = 0;\n            cnNode.setPosition(-vs.width/2 + 8 + 44 + 14 + 15, vs.height/2 + 2);\n            area.addChild(cnNode);\n            var cnLbl = cnNode.addComponent(cc.Label);\n            cnLbl.string = clubName;\n            cnLbl.fontSize = 26;\n            cnLbl.lineHeight = 30;\n            cnLbl.horizontalAlign = cc.Label.HorizontalAlign.LEFT;\n            cnLbl.verticalAlign = cc.Label.VerticalAlign.CENTER;\n            cnLbl.overflow = cc.Label.Overflow.NONE; //动态Label禁用SHRINK,防止不渲染\n            cnNode.color = cc.color(255,235,180);\n        }',
null,
'',
'clubName');

// E. games 新建
splice(
'        var gamesNode = area.getChildByName("games");\n        if(!gamesNode){ gamesNode = new cc.Node("games"); area.addChild(gamesNode); }',
null,
'        var gamesNode = area.getChildByName("games"); //固化容器,玩法行为数据驱动动态创建',
'gamesNode');

// F. tablesView 新建兜底
splice(
`        //固化场景复用tablesView/tables节点(含Mask),否则按原逻辑新建
        var svView = area.getChildByName("tablesView");
        if(!svView){
            svView = new cc.Node("tablesView");
            area.addChild(svView);
            var tmask = svView.addComponent(cc.Mask); //超出视口裁剪
            if(cc.Mask.Type && cc.Mask.Type.RECT != null){ tmask.type = cc.Mask.Type.RECT; }
            var tb = new cc.Node("tables");
            tb.anchorX = 0.5;
            tb.anchorY = 1; //内容锚定顶部,卡片从上往下排
            svView.addChild(tb);
        }`,
null,
`        //固化场景节点 tablesView(Mask)+tables(牌桌卡片为数据驱动动态创建)
        var svView = area.getChildByName("tablesView");`,
'tablesView');

fs.writeFileSync(FILE, s);
console.log('all detail fallbacks removed');
