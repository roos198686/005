// 校验压缩后的 .fire:悬空引用、层级、弹窗事件、nums、父子关系一致性
const fs = require('fs');

function eachRef(obj, cb) {
  if (!obj || typeof obj !== 'object') return;
  if (!Array.isArray(obj) && Object.keys(obj).length === 1 && typeof obj.__id__ === 'number') { cb(obj.__id__); return; }
  if (Array.isArray(obj)) { obj.forEach((v) => eachRef(v, cb)); return; }
  for (const k in obj) {
    if (k === '__expectedType__') continue;
    const v = obj[k];
    if (v && typeof v === 'object') eachRef(v, cb);
  }
}

let fail = 0;
for (const file of ['d:/babykylin_scmj/client/assets/module/hall/hall.fire', 'd:/babykylin_scmj/client/assets/module/hall/club.fire']) {
  const d = JSON.parse(fs.readFileSync(file, 'utf8'));
  const short = file.split('/').pop();
  const errs = [];

  // 1) 无 null 槽位、无悬空引用
  if (d.some((o) => o == null)) errs.push('has null slots');
  d.forEach((o, i) => { if (o) eachRef(o, (r) => { if (r < 0 || r >= d.length || d[r] == null) errs.push('dangling ' + i + '->' + r); }); });

  // 2) 根链:d[0] SceneAsset -> cc.Scene -> Canvas
  const scene = d[d[0].scene.__id__];
  const canvas = d[scene._children[0].__id__];
  if (canvas._name !== 'Canvas') errs.push('root chain broken');

  // 3) 父子一致性(抽查全部活节点)
  const childSet = new Set();
  const walk = (id) => { (d[id]._children || []).forEach((c) => { if (childSet.has(c.__id__)) errs.push('shared child ' + c.__id__); childSet.add(c.__id__); if (d[c.__id__]._parent.__id__ !== id) errs.push('parent mismatch ' + c.__id__); walk(c.__id__); }); };
  walk(scene._children[0].__id__);

  // 4) clubPage / wfPage 结构
  const kids = canvas._children.map((c) => d[c.__id__]._name);
  const cpId = canvas._children.map((c) => c.__id__).find((id) => d[id]._name === 'clubPage');
  const wfId = canvas._children.map((c) => c.__id__).find((id) => d[id]._name === 'wfPage');
  if (!cpId || !wfId) errs.push('missing clubPage/wfPage');
  const cpKids = d[cpId]._children.map((c) => d[c.__id__]._name).join(',');
  const wfKids = d[wfId]._children.map((c) => d[c.__id__]._name).join(',');
  if (cpKids !== 'clubBg,mask,btn_close,btnMine,btnCreate,btnJoin,listArea,clubCreateWin,clubJoinWin') errs.push('clubPage kids: ' + cpKids);
  if (wfKids !== 'phBg,mask,detailBgImg,detailFullBg,listArea') errs.push('wfPage kids: ' + wfKids);

  // 5) 弹窗:nums 6 个内部 Label、13 个 ClickEvent 全内部、创建窗键盘隐藏、加入窗键盘显示
  const sub = (root) => { const s = new Set([root]); const w = [root]; while (w.length) { const id = w.pop(); (d[id]._children || []).forEach((c) => { if (!s.has(c.__id__)) { s.add(c.__id__); w.push(c.__id__); } }); } return s; };
  d[cpId]._children.forEach((c) => {
    const win = d[c.__id__];
    if (!/Win/.test(win._name)) return;
    const s = sub(c.__id__);
    const comp = win._components.map((x) => d[x.__id__]).find((x) => x.__type__ === 'aebb2CDLFlBaLyTjW6mPofN');
    if (!comp) { errs.push(win._name + ' no JoinGameInput'); return; }
    comp.nums.forEach((r, k) => { const lbl = d[r.__id__]; const host = lbl && lbl.node && lbl.node.__id__; if (!lbl || lbl.__type__ !== 'cc.Label' || !s.has(host)) errs.push(win._name + ' nums[' + k + '] bad'); });
    const keypad = win._children.map((x) => d[x.__id__]).find((n) => n._name === 'New Node');
    const expectKeypad = win._name === 'clubJoinWin';
    if (keypad._active !== expectKeypad) errs.push(win._name + ' keypad active=' + keypad._active);
    let ev = 0, ext = 0;
    [...s].forEach((id) => { (d[id]._components || []).forEach((cr) => { (d[cr.__id__].clickEvents || []).forEach((er) => { ev++; const t = d[er.__id__].target.__id__; if (!s.has(t)) ext++; }); }); });
    if (ev !== 13 || ext !== 0) errs.push(win._name + ' events=' + ev + ' ext=' + ext);
  });

  // 6) hall 组件 joinGameWin 指向原生 JoinGame
  const hallComp = canvas._components.map((c) => d[c.__id__]).find((c) => c.__type__ === 'a63d9t3AuBKVLfInT9JAVaH');
  if (!hallComp || d[hallComp.joinGameWin.__id__]._name !== 'JoinGame') errs.push('hall joinGameWin broken');

  // 7) 场景唯一性
  const scenes = d.filter((o) => o.__type__ === 'cc.Scene').length;
  const canvases = d.filter((o) => o.__type__ === 'cc.Canvas').length;
  if (scenes !== 1 || canvases !== 1) errs.push('scenes=' + scenes + ' canvases=' + canvases);

  console.log(short, 'objs=' + d.length, 'canvasKids=' + kids.length, errs.length ? 'FAIL: ' + errs.join(' | ') : 'ALL_OK');
  if (errs.length) fail = 1;
}
process.exit(fail);
