// 场景 GC:从 cc.SceneAsset/cc.Scene 出发,按真实层级(_children)+节点组件可达性标记活对象,
// 其余历史烘焙残留(孤儿 Canvas/重复子树)置空。先 DRY_RUN 出报告。
const fs = require('fs');
const DRY = true;

function eachRef(obj, cb) {
  if (!obj || typeof obj !== 'object') return;
  // 引用对象自身:{"__id__":N}
  if (!Array.isArray(obj) && Object.keys(obj).length === 1 && typeof obj.__id__ === 'number') { cb(obj.__id__, ''); return; }
  if (Array.isArray(obj)) { obj.forEach((v) => eachRef(v, cb)); return; }
  for (const k in obj) {
    if (k === '__expectedType__' || k === '_parent') continue;
    const v = obj[k];
    if (v && typeof v === 'object') eachRef(v, cb);
  }
}

function process(file) {
  const d = JSON.parse(fs.readFileSync(file, 'utf8'));
  const N = d.length;
  const isNode = (o) => o && o.__type__ === 'cc.Node';

  // 1) 场景根:d[0]=cc.SceneAsset(引擎实际加载入口),其 scene 引用真正的 cc.Scene
  const sceneId = d[0] && d[0].scene ? d[0].scene.__id__ : d.findIndex((o) => o && o.__type__ === 'cc.Scene');
  const live = new Set([0]);
  const parentOf = { 0: null }; // 场景根:找 cc.Scene(通常 d[1])
  const queue = [];
  const markNode = (id, parent) => {
    if (live.has(id)) {
      if (parent != null && parentOf[id] !== parent) {
        console.log('  [shared-child] node', id, d[id]._name, 'parents:', parentOf[id], 'vs', parent);
      }
      return;
    }
    live.add(id);
    parentOf[id] = parent;
    queue.push(id);
  };
  // 场景的 _children 即根节点(Canvas)
  markNode(sceneId, null);
  while (queue.length) {
    const id = queue.shift();
    const o = d[id];
    (o._children || []).forEach((c) => markNode(c.__id__, id));
  }

  // 2) 活节点身上的全部对象:组件/_prefab/事件 等(沿属性扩散,但不沿 _parent)
  const liveClosure = new Set(live);
  const anomalies = [];
  const grow = [];
  live.forEach((id) => grow.push(id));
  while (grow.length) {
    const id = grow.pop();
    if (!liveClosure.has(id)) liveClosure.add(id);
    const o = d[id];
    if (!o || typeof o !== 'object') continue;
    eachRef(o, (ref, key) => {
      if (key === '_parent') return;
      if (ref < 0 || ref >= N) { anomalies.push('dangling ' + id + ' -> ' + ref); return; }
      // 引用到节点:必须是活节点,否则是跨到孤儿区的异常引用
      if (isNode(d[ref]) && !live.has(ref)) {
        anomalies.push('cross-ref from ' + id + ' (' + (o._name || o.__type__) + ")." + key + ' -> orphan node ' + ref + ' ' + d[ref]._name);
        return;
      }
      if (!liveClosure.has(ref)) { liveClosure.add(ref); grow.push(ref); }
    });
  }

  // 3) 统计垃圾
  const garbage = [];
  d.forEach((o, i) => { if (o != null && !liveClosure.has(i)) garbage.push(i); });
  const garbageNames = {};
  garbage.forEach((i) => { const t = d[i].__type__ || '?'; garbageNames[t] = (garbageNames[t] || 0) + 1; });

  // 4) 校验:每个活节点的 _parent 与层级一致性
  const parentMismatch = [];
  live.forEach((id) => {
    if (id === 0 || !isNode(d[id])) return;
    const o = d[id];
    const p = o._parent && o._parent.__id__;
    if (p !== parentOf[id]) parentMismatch.push({ id, name: o._name, serialized: p, canonical: parentOf[id] });
  });

  console.log('===', file.split('/').pop(), DRY ? '[DRY]' : '[APPLY]');
  console.log('  total=' + N, 'liveNodes=' + live.size, 'liveClosure=' + liveClosure.size, 'garbage=' + garbage.length);
  console.log('  garbage types:', JSON.stringify(garbageNames));
  console.log('  parent mismatches:', parentMismatch.length);
  parentMismatch.slice(0, 20).forEach((m) => console.log('    node', m.id, m.name, 'serializedParent=' + m.serialized, 'canonical=' + m.canonical));
  console.log('  anomalies:', anomalies.length);
  anomalies.slice(0, 30).forEach((a) => console.log('    ' + a));

  if (!DRY) {
    garbage.forEach((i) => { d[i] = null; });
    // 规范化活节点 _parent
    parentMismatch.forEach((m) => {
      if (m.canonical == null) delete d[m.id]._parent;
      else d[m.id]._parent = { __id__: m.canonical };
    });
    fs.writeFileSync(file, JSON.stringify(d));
    console.log('  written. non-null now:', d.filter((x) => x != null).length);
  }
}

process('d:/babykylin_scmj/client/assets/module/hall/hall.fire');
process('d:/babykylin_scmj/client/assets/module/hall/club.fire');
