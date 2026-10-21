const fs = require('fs');
for (const file of ['d:/babykylin_scmj/client/assets/module/hall/hall.fire', 'd:/babykylin_scmj/client/assets/module/hall/club.fire']) {
  const d = JSON.parse(fs.readFileSync(file, 'utf8'));
  const short = file.split('/').pop();
  const reachable = new Set();
  const q = [1];
  while (q.length) { const id = q.pop(); if (reachable.has(id)) continue; reachable.add(id); (d[id]._children || []).forEach((c) => q.push(c.__id__)); }
  // clubPage/btn_close
  const cp = d[2]._children.map((c) => c.__id__).find((id) => d[id]._name === 'clubPage');
  const bc = d[cp]._children.map((c) => c.__id__).find((id) => d[id]._name === 'btn_close');
  const btnComp = d[bc]._components.map((c) => d[c.__id__]).find((c) => c.__type__ === 'cc.Button');
  const tgt = btnComp._N$target && btnComp._N$target.__id__;
  console.log(short, 'btn_close id=' + bc, 'Button target=' + tgt, d[tgt] && d[tgt]._name, 'targetReachable=' + reachable.has(tgt), 'clickEvents=' + btnComp.clickEvents.length);
  if (short === 'hall.fire') {
    console.log('  1027 reachable via _children:', reachable.has(1027));
    // 找 live help 下的 btn_back
    const help = d[2]._children.map((c) => c.__id__).find((id) => d[id]._name === 'help');
    const walk = (root) => { let found = null; const st = [root]; while (st.length) { const id = st.pop(); if (d[id]._name === 'btn_back') return id; (d[id]._children || []).forEach((c) => st.push(c.__id__)); } return null; };
    console.log('  live help id=' + help, 'its btn_back id=' + walk(help));
  }
}
