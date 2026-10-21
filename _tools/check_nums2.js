const fs = require('fs');
for (const file of ['d:/babykylin_scmj/client/assets/module/hall/hall.fire', 'd:/babykylin_scmj/client/assets/module/hall/club.fire']) {
  const d = JSON.parse(fs.readFileSync(file, 'utf8'));
  const short = file.split('/').pop();
  const cp = d[2]._children.map((c) => c.__id__).find((id) => d[id]._name === 'clubPage');
  const nodeSub = new Set();
  const w0 = [cp];
  while (w0.length) { const id = w0.pop(); nodeSub.add(id); (d[id]._children || []).forEach((c) => w0.push(c.__id__)); }
  d[cp]._children.forEach((c) => {
    const win = d[c.__id__];
    if (!/Win/.test(win._name)) return;
    const comp = win._components.map((x) => d[x.__id__]).filter((x) => x).find((x) => x.__type__ === 'aebb2CDLFlBaLyTjW6mPofN');
    const rows = (comp.nums || []).map((r) => {
      const lbl = d[r.__id__];
      if (!lbl) return r.__id__ + ':NULL';
      const nodeId = lbl.node && lbl.node.__id__;
      const node = d[nodeId];
      return lbl.__type__ + ' on node ' + nodeId + '(' + (node && node._name) + ',inSub=' + nodeSub.has(nodeId) + ')';
    });
    console.log(short, win._name);
    rows.forEach((r) => console.log('   ', r));
  });
}
