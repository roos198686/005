// GC 后全面校验:悬空引用、Canvas 子节点、clubPage/wfPage/弹窗结构、关键贴图 uuid
const fs = require('fs');
const UUIDS = {
  club_bg: '96b79a45-f8f9-4e76-a1e9-ceca875c56fa',
  club_detail_bg: 'e35fbbbb-544a-492c-b7c0-958b5f1b0dfa',
  club_btn_back: 'a5df8f32-ea69-4552-8d8b-636b2d41f583',
  club_btn_on: '2be4b823-4f1f-4bc8-bf21-81fbcca91f4b',
  club_btn_off: 'bed71d08-f268-430f-88f5-1713633773dd',
  club_join_title: 'd2e8f0a1-6b3c-4d7e-8f2a-9c1b5d3e6f7a',
};
function eachRef(obj, cb) {
  if (!obj || typeof obj !== 'object') return;
  if (Array.isArray(obj)) { obj.forEach((v) => eachRef(v, cb)); return; }
  for (const k in obj) {
    if (k === '__expectedType__') continue;
    const v = obj[k];
    if (v && typeof v === 'object') {
      if (Object.keys(v).length === 1 && typeof v.__id__ === 'number') cb(v.__id__, k);
      else eachRef(v, cb);
    }
  }
}
for (const file of ['d:/babykylin_scmj/client/assets/module/hall/hall.fire', 'd:/babykylin_scmj/client/assets/module/hall/club.fire']) {
  const d = JSON.parse(fs.readFileSync(file, 'utf8'));
  const short = file.split('/').pop();
  console.log('===', short, 'slots=' + d.length, 'nonNull=' + d.filter((x) => x != null).length);

  // 悬空引用(引用方必须非 null 且目标 slot 非 null)
  let dangling = 0;
  d.forEach((o, i) => {
    if (!o) return;
    eachRef(o, (ref) => { if (ref < 0 || ref >= d.length || d[ref] == null) { dangling++; console.log('  DANGLING from', i, '->', ref); } });
  });
  console.log('  dangling refs:', dangling);

  // Canvas 子节点
  const canvas = d[2];
  console.log('  Canvas children:', canvas._children.map((c) => d[c.__id__]._name).join(','));

  const clubPage = canvas._children.map((c) => c.__id__).find((id) => d[id]._name === 'clubPage');
  const wfPage = canvas._children.map((c) => c.__id__).find((id) => d[id]._name === 'wfPage');
  console.log('  clubPage kids:', d[clubPage]._children.map((c) => d[c.__id__]._name).join(','));
  console.log('  wfPage kids:', d[wfPage]._children.map((c) => d[c.__id__]._name).join(','));

  const subtree = (root) => { const set = new Set([root]); const w = [root]; while (w.length) { const id = w.pop(); (d[id]._children || []).forEach((c) => { if (!set.has(c.__id__)) { set.add(c.__id__); w.push(c.__id__); } }); } return set; };
  const cpSub = subtree(clubPage), wfSub = subtree(wfPage);

  // 弹窗检查
  const popups = {};
  d[clubPage]._children.forEach((c) => { const n = d[c.__id__]; if (/Win/.test(n._name)) popups[n._name] = c.__id__; });
  for (const [nm, id] of Object.entries(popups)) {
    const win = d[id];
    const kids = win._children.map((c) => d[c.__id__]);
    const keypad = kids.find((k) => k._name === 'New Node');
    const shurus = kids.filter((k) => k._name.indexOf('Z_shurukuang') === 0);
    const createMsg = kids.find((k) => k._name === 'createMsg');
    const title = kids.find((k) => k._name === 'PopupScene20');
    const comps = (win._components || []).filter((c) => d[c.__id__]).map((c) => d[c.__id__].__type__);
    const inputComp = (win._components || []).map((c) => d[c.__id__]).filter((c) => c).find((c) => c.__type__ === 'aebb2CDLFlBaLyTjW6mPofN');
    const numsOk = inputComp && Array.isArray(inputComp.nums) && inputComp.nums.length === 6 && inputComp.nums.every((r) => r && d[r.__id__] && cpSub.has(r.__id__));
    console.log('  popup', nm, 'id=' + id, 'active=' + win._active, 'keypadActive=' + (keypad ? keypad._active : 'NA'),
      'shuruHidden=' + shurus.every((s) => !s._active) + '(' + shurus.length + ')',
      'createMsg=' + !!createMsg, 'titleSprite=' + !!(title && title._components), 'inputComp=' + !!inputComp, 'nums6=' + numsOk, 'comps=' + comps.join('|'));
  }

  // wfPage 关键节点
  const wfKids = d[wfPage]._children.map((c) => d[c.__id__]);
  const listArea = wfKids.find((k) => k._name === 'listArea');
  const areaKids = listArea._children.map((c) => d[c.__id__]._name);
  const detailFullBg = wfKids.find((k) => k._name === 'detailFullBg');
  const hasGfx = (detailFullBg._components || []).some((c) => d[c.__id__].__type__ === 'cc.Graphics');
  const btnBack = listArea._children.map((c) => d[c.__id__]).find((n) => n._name === 'btnBack');
  const backLabel = btnBack._children.map((c) => d[c.__id__]).find((n) => n._name === 'l');
  console.log('  wf listArea kids:', areaKids.join(','), '| detailFullBg.Graphics=' + hasGfx, '| btnBack.l.active=' + (backLabel ? backLabel._active : 'NA'));

  // 关键 uuid 出现次数
  const raw = JSON.stringify(d);
  Object.entries(UUIDS).forEach(([k, u]) => {
    const count = raw.split(u).length - 1;
    if (count) console.log('  uuid', k, 'x' + count);
  });

  // JoinGameInput 组件总数(应为2:原生497+clubJoinWin)
  const inputCount = d.filter((o) => o && o.__type__ === 'aebb2CDLFlBaLyTjW6mPofN').length;
  console.log('  JoinGameInput comps:', inputCount, '(expect 3: native+joinWin' + (short === 'club.fire' ? ', plus club scene native same' : '') + ')');
  // cc.Scene/Canvas 数量
  console.log('  cc.Scene:', d.filter((o) => o && o.__type__ === 'cc.Scene').length, 'cc.Canvas:', d.filter((o) => o && o.__type__ === 'cc.Canvas').length, 'cc.SceneAsset:', d.filter((o) => o && o.__type__ === 'cc.SceneAsset').length);
}
