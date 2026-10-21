// 1) 修正 clubPage/btn_close 的 Button._N$target 指向自身(复制源 btn_back 的残留)
// 2) 执行与 gc_fires.js 相同的可达性 GC
const fs = require('fs');

function eachRef(obj, cb) {
  if (!obj || typeof obj !== 'object') return;
  if (!Array.isArray(obj) && Object.keys(obj).length === 1 && typeof obj.__id__ === 'number') { cb(obj.__id__, ''); return; }
  if (Array.isArray(obj)) { obj.forEach((v) => eachRef(v, cb)); return; }
  for (const k in obj) {
    if (k === '__expectedType__' || k === '_parent') continue;
    const v = obj[k];
    if (v && typeof v === 'object') eachRef(v, cb);
  }
}

function run(file) {
  const d = JSON.parse(fs.readFileSync(file, 'utf8'));
  const N = d.length;
  const isNode = (o) => o && o.__type__ === 'cc.Node';

  // --- fix btn_close target ---
  const cp = d[2]._children.map((c) => c.__id__).find((id) => d[id]._name === 'clubPage');
  const bc = d[cp]._children.map((c) => c.__id__).find((id) => d[id]._name === 'btn_close');
  const btnComp = d[bc]._components.map((c) => d[c.__id__]).find((c) => c.__type__ === 'cc.Button');
  const oldT = btnComp._N$target && btnComp._N$target.__id__;
  btnComp._N$target = { __id__: bc };
  console.log(file.split('/').pop(), 'btn_close id=' + bc, 'Button target', oldT, '->', bc);

  // --- live graph ---
  const sceneId = d[0].scene.__id__;
  const live = new Set([0]);
  const parentOf = {};
  const q = [];
  const mark = (id, p) => { if (live.has(id)) return; live.add(id); parentOf[id] = p; q.push(id); };
  mark(sceneId, null);
  while (q.length) {
    const id = q.shift();
    (d[id]._children || []).forEach((c) => mark(c.__id__, id));
  }
  const closure = new Set(live);
  const grow = [...live];
  const anomalies = [];
  while (grow.length) {
    const id = grow.pop();
    const o = d[id];
    if (!o || typeof o !== 'object') continue;
    eachRef(o, (ref) => {
      if (ref < 0 || ref >= N) { anomalies.push('dangling ' + id + '->' + ref); return; }
      if (isNode(d[ref]) && !live.has(ref)) { anomalies.push('cross ' + id + '->' + ref + ' ' + d[ref]._name); return; }
      if (!closure.has(ref)) { closure.add(ref); grow.push(ref); }
    });
  }
  if (anomalies.length) { console.error('ANOMALIES, abort:', anomalies); process.exit(1); }

  const garbage = [];
  d.forEach((o, i) => { if (o != null && !closure.has(i)) garbage.push(i); });

  // 父关系规范化
  let fixedParents = 0;
  live.forEach((id) => {
    if (id === 0 || !isNode(d[id])) return;
    const p = d[id]._parent ? d[id]._parent.__id__ : undefined;
    if (p !== parentOf[id]) {
      if (parentOf[id] == null) delete d[id]._parent;
      else d[id]._parent = { __id__: parentOf[id] };
      fixedParents++;
    }
  });

  garbage.forEach((i) => { d[i] = null; });
  fs.writeFileSync(file, JSON.stringify(d));
  console.log('  GC: liveNodes=' + (live.size - 1), 'closure=' + closure.size, 'removed=' + garbage.length, 'parentsFixed=' + fixedParents,
    'nonNull=' + d.filter((x) => x != null).length);
}

run('d:/babykylin_scmj/client/assets/module/hall/hall.fire');
run('d:/babykylin_scmj/client/assets/module/hall/club.fire');
