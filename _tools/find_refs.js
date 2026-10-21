const fs = require('fs');
for (const file of ['d:/babykylin_scmj/client/assets/module/hall/hall.fire', 'd:/babykylin_scmj/client/assets/module/hall/club.fire']) {
  const d = JSON.parse(fs.readFileSync(file, 'utf8'));
  const short = file.split('/').pop();
  const TARGETS = short === 'club.fire' ? [497, 836, 862, 955, 956, 1652, 1653, 1750, 926, 1623] : [497, 904, 882, 883];
  const findRefs = (target) => {
    const hits = [];
    d.forEach((o, i) => {
      if (!o || typeof o !== 'object' || i === target) return;
      const scan = (v, keyPath) => {
        if (Array.isArray(v)) { v.forEach((x, k2) => scan(x, keyPath + '[' + k2 + ']')); return; }
        if (v && typeof v === 'object') {
          if (Object.keys(v).length === 1 && typeof v.__id__ === 'number' && v.__id__ === target) hits.push({ from: i, path: keyPath, type: o.__type__, name: o._name || '' });
          for (const k in v) {
            if (k === '__expectedType__') continue;
            if (v[k] && typeof v[k] === 'object') scan(v[k], keyPath + '.' + k);
          }
        }
      };
      scan(o, '');
    });
    return hits;
  };
  TARGETS.forEach((t) => {
    const subtree = new Set([t]);
    const walk = (id) => { (d[id]._children || []).forEach((c) => { if (!subtree.has(c.__id__)) { subtree.add(c.__id__); walk(c.__id__); } }); };
    if (d[t] && d[t]._children) walk(t);
    const hits = findRefs(t).filter((h) => !subtree.has(h.from));
    console.log(short, 'target id=' + t, (d[t] && d[t]._name) || (d[t] && d[t].__type__), 'externalRefs=' + hits.length);
    hits.forEach((h) => console.log('   <- id=' + h.from, h.type, h.name, h.path));
  });
}
