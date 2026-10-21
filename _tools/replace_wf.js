// 删除 _wfOpenDetail 中运行时构建 wfPage 的兜底分支(场景已固化)
const fs = require('fs');
const FILE = 'd:/babykylin_scmj/client/assets/module/hall/srcipts/hall.js';
let s = fs.readFileSync(FILE, 'utf8');

const startMark = '        var page = new cc.Node("wfPage");';
const si = s.indexOf(startMark);
if (si < 0) { console.error('start not found'); process.exit(1); }
const k = s.indexOf('独立玩法详情页返回', si);
if (k < 0) { console.error('comment not found'); console.log(JSON.stringify(s.slice(si, si + 300))); process.exit(1); }
// 回退到注释前最近的 "    },"
const before = s.slice(si, k);
const closeIdx = before.lastIndexOf('    },');
if (closeIdx < 0) { console.error('close not found'); process.exit(1); }
const absEnd = si + closeIdx;
s = s.slice(0, si) + s.slice(absEnd);
fs.writeFileSync(FILE, s);
console.log('wf fallback removed, removed chars:', absEnd - si);
