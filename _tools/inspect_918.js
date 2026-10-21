const fs = require('fs');
const d = JSON.parse(fs.readFileSync('d:/babykylin_scmj/client/assets/module/hall/hall.fire', 'utf8'));

function chain(idx) {
  const parts = [];
  let cur = idx, g = 0;
  while (cur != null && d[cur] && g++ < 15) {
    parts.push(d[cur]._name || d[cur].__type__);
    cur = d[cur]._parent ? d[cur]._parent.__id__ : null;
  }
  return parts.reverse().join('/');
}
// 谁挂着组件 918
d.forEach((o, i) => {
  if (o && o._components && o._components.some((c) => c.__id__ === 918)) {
    console.log('host node of comp918: id=' + i, o._name, 'path=' + chain(i));
  }
});
console.log('comp 918:', JSON.stringify(d[918], null, 1));
console.log('node 1027:', d[1027]._name, 'path=' + chain(1027), 'parent=' + (d[1027]._parent && d[1027]._parent.__id__));
// wfPage 里的活 btnBack
const wf = d[2]._children.map((c) => c.__id__).find((id) => d[id]._name === 'wfPage');
const la = d[wf]._children.map((c) => c.__id__).find((id) => d[id]._name === 'listArea');
d[la]._children.forEach((c) => { if (d[c.__id__]._name === 'btnBack') console.log('live btnBack id=' + c.__id__, 'path=' + chain(c.__id__)); });
