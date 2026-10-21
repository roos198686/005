const fs = require('fs');
for (const file of ['d:/babykylin_scmj/client/assets/module/hall/hall.fire', 'd:/babykylin_scmj/client/assets/module/hall/club.fire']) {
  const d = JSON.parse(fs.readFileSync(file, 'utf8'));
  const short = file.split('/').pop();
  const cp = d[2]._children.map((c) => c.__id__).find((id) => d[id]._name === 'clubPage');
  const subtree = (root) => { const s = new Set([root]); const w = [root]; while (w.length) { const id = w.pop(); (d[id]._children || []).forEach((c) => { if (!s.has(c.__id__)) { s.add(c.__id__); w.push(c.__id__); } }); } return s; };
  const cpSub = subtree(cp);
  d[cp]._children.forEach((c) => {
    const win = d[c.__id__];
    if (!/Win/.test(win._name)) return;
    const comp = win._components.map((x) => d[x.__id__]).filter((x) => x).find((x) => x.__type__ === 'aebb2CDLFlBaLyTjW6mPofN');
    console.log(short, win._name, 'comp node=' + (comp.node && comp.node.__id__), 'nums type:', Array.isArray(comp.nums) ? 'array' : typeof comp.nums, 'len=' + (comp.nums && comp.nums.length));
    (comp.nums || []).forEach((r, k) => {
      const t = r && r.__id__ != null ? d[r.__id__] : null;
      console.log('   num[' + k + ']', JSON.stringify(r), t ? '-> ' + t._name + ' inClubPage=' + cpSub.has(r.__id__) : '-> NULL/MISSING');
    });
    // onInputFinished / onResetClicked 回调
    console.log('   callbacks:', JSON.stringify(comp.onInputFinished || null), JSON.stringify(comp.onResetClicked || null));
  });
  // 原生 JoinGame 对照
  const jg = d[2]._children.map((c) => c.__id__).find((id) => d[id]._name === 'JoinGame');
  const jcomp = d[jg]._components.map((x) => d[x.__id__]).filter((x) => x).find((x) => x.__type__ === 'aebb2CDLFlBaLyTjW6mPofN');
  console.log(short, 'native JoinGame nums:', JSON.stringify((jcomp.nums || []).map((r) => r.__id__)));
}
