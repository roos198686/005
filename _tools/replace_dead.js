// 删除已无调用者的 _clubAddSolidBg / _clubMakeBtn
const fs = require('fs');
const FILE = 'd:/babykylin_scmj/client/assets/module/hall/srcipts/hall.js';
let s = fs.readFileSync(FILE, 'utf8');
const NL = s.includes('\r\n') ? '\r\n' : '\n';

const startMark = '    //给节点加纯色底色块(独立bg子节点sibling 0,避免父节点Graphics遮挡子节点)';
const endMark = '    //切换按钮贴图(优先用户自制图:red=选中club_btn_on,orange=未选中club_btn_off,缺失用原生贴图)';
const i = s.indexOf(startMark);
const j = s.indexOf(endMark, i);
if (i < 0 || j < 0) { console.error('marks not found', i, j); process.exit(1); }
s = s.slice(0, i) + s.slice(j);
fs.writeFileSync(FILE, s);
console.log('dead functions removed, chars:', j - i);
