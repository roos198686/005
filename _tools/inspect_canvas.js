const fs = require('fs');
function load(file) {
  return { file, d: JSON.parse(fs.readFileSync(file, 'utf8')) };
}
for (const env of [
  load('d:/babykylin_scmj/client/assets/module/hall/hall.fire'),
  load('d:/babykylin_scmj/client/assets/module/hall/club.fire'),
]) {
  const { file, d } = env;
  const short = file.split('/').pop();
  // find Canvas node
  let canvasId = d.findIndex((o) => o && o._name === 'Canvas' && o._children);
  const canvas = d[canvasId];
  console.log('===', short, 'Canvas id=' + canvasId, 'children order:');
  canvas._children.forEach((c, i) => {
    const o = d[c.__id__];
    console.log('  [' + i + '] id=' + c.__id__, o._name, 'active=' + o._active);
  });
  // 反向引用统计:每个对象被谁引用
  const targets = short === 'club.fire'
    ? [836, 955, 1652, 862, 956, 1653, 926, 1623, 1750]
    : [882, 883, 497, 904, 892, 893];
  // 收集子树内全部 id
  const subtree = (rootId) => {
    const set = new Set([rootId]);
    const walk = (id) => {
      const o = d[id];
      if (!o) return;
      (o._children || []).forEach((ch) => { if (!set.has(ch.__id__)) { set.add(ch.__id__); walk(ch.__id__); } });
    };
    walk(rootId);
    return set;
  };
  targets.forEach((t) => {
    const inside = subtree(t);
    const external = [];
    d.forEach((o, i) => {
      if (!o || typeof o !== 'object' || inside.has(i)) return;
      const scan = (v, path) => {
        if (v && typeof v === 'object') {
          if (v.__type__ === '__id__' && inside.has(v.__id__)) external.push({ from: i, name: o._name || o.__type__, to: v.__id__ });
          for (const k in v) {
            if (k === '__id__' || k === '__expectedType__') continue;
            if (v[k] && typeof v[k] === 'object') scan(v[k], path);
          }
        }
      };
      scan(o, '');
    });
    console.log(short, 'node id=' + t, d[t]._name, 'subtreeSize=' + inside.size, 'externalRefs=' + external.length);
    external.slice(0, 8).forEach((e) => console.log('    <- id=' + e.from, e.name, 'to=' + e.to));
  });
}
