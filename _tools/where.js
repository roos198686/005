const fs = require('fs');
for (const f of ['hall', 'club']) {
  const p = 'd:/babykylin_scmj/client/assets/module/hall/' + f + '.fire';
  const d = JSON.parse(fs.readFileSync(p, 'utf8'));
  const scene = d[d[0].scene.__id__];
  const canvas = d[scene._children[0].__id__];
  const kids = canvas._children.map((c) => d[c.__id__]._name + (d[c.__id__]._active ? '' : '(off)'));
  console.log(f + '.fire  Canvas children:', kids.join(', '));
}
