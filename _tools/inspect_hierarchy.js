const fs = require('fs');
function inspect(file) {
  const d = JSON.parse(fs.readFileSync(file, 'utf8'));
  const nameOf = (idx) => (d[idx] && d[idx]._name) ? d[idx]._name : '#' + idx;
  const chain = (idx) => {
    const parts = [];
    let cur = idx, guard = 0;
    while (cur != null && d[cur] && guard++ < 20) {
      parts.push(d[cur]._name || ('<' + (d[cur].__type__ || '?') + '>'));
      cur = (d[cur]._parent && d[cur]._parent.__id__ != null) ? d[cur]._parent.__id__ : null;
    }
    return parts.reverse().join('/');
  };
  ['clubPage', 'wfPage', 'clubCreateWin', 'clubJoinWin', 'JoinGame'].forEach((nm) => {
    d.forEach((o, i) => {
      if (o && o._name === nm) {
        const active = o._active;
        const kids = (o._children || []).map((c) => nameOf(c.__id__)).join(',');
        console.log(file.split('/').pop(), nm, 'id=' + i, 'active=' + active, 'path=' + chain(i), ' kids=[' + kids + ']');
      }
    });
  });
}
inspect('d:/babykylin_scmj/client/assets/module/hall/hall.fire');
inspect('d:/babykylin_scmj/client/assets/module/hall/club.fire');
