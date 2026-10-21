// 替换 hall.js 中创建/加入弹窗的运行时构建代码为固化节点版本
const fs = require('fs');
const FILE = 'd:/babykylin_scmj/client/assets/module/hall/srcipts/hall.js';
let s = fs.readFileSync(FILE, 'utf8');

const startMark = '    //创建俱乐部:复用原生';
const endMark = '    //输入满6位后提交加入俱乐部';
const si = s.indexOf(startMark);
const ei = s.indexOf(endMark);
if (si < 0 || ei < 0 || ei < si) { console.error('marks not found', si, ei); process.exit(1); }

const replacement = `    //创建俱乐部:显示场景固化的 clubCreateWin(标题图/隐藏键盘/提示文字均已固化在场景中)
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

`;

s = s.slice(0, si) + replacement + s.slice(ei);
fs.writeFileSync(FILE, s);
console.log('popup code replaced');
