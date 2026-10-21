// 校验 hall.fire / club.fire: JSON 可解析、无悬空 __id__、关键节点/弹窗齐全
const fs = require('fs');
const files = [
  'd:/babykylin_scmj/client/assets/module/hall/hall.fire',
  'd:/babykylin_scmj/client/assets/module/hall/club.fire',
];
for (const f of files) {
  const data = JSON.parse(fs.readFileSync(f, 'utf8'));
  const n = data.length;
  let dangling = 0;
  const check = (v) => {
    if (v && typeof v === 'object') {
      if (v.__type__ === '__id__' && (typeof v.__id__ !== 'number' || v.__id__ < 0 || v.__id__ >= n)) dangling++;
      for (const k in v) {
        if (k === '__id__' || k === '__expectedType__') continue;
        if (v[k] && typeof v[k] === 'object') check(v[k]);
      }
    }
  };
  check(data);
  const named = {};
  data.forEach((o) => { if (o && o._name) named[o._name] = (named[o._name] || 0) + 1; });
  const must = ['clubPage', 'clubBg', 'btnMine', 'btnCreate', 'btnJoin', 'clubCreateWin', 'clubJoinWin',
    'wfPage', 'detailBgImg', 'detailFullBg', 'btnBack', 'clubName', 'games', 'tablesView', 'tables'];
  const missing = must.filter((m) => !named[m]);
  console.log(f.split('/').pop(), 'objects=' + n, 'dangling=' + dangling,
    'createMsg=' + (named['createMsg'] || 0), 'missing=[' + missing.join(',') + ']');
}
