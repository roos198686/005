const fs = require('fs');
for (const f of ['d:/babykylin_scmj/client/assets/module/hall/hall.fire', 'd:/babykylin_scmj/client/assets/module/hall/club.fire']) {
  const data = JSON.parse(fs.readFileSync(f, 'utf8'));
  const counts = {};
  data.forEach((o) => { if (o && o._name) counts[o._name] = (counts[o._name] || 0) + 1; });
  const keys = ['clubPage', 'wfPage', 'clubCreateWin', 'clubJoinWin', 'JoinGame', 'createMsg', 'detailBgImg', 'detailFullBg'];
  const out = {};
  keys.forEach((k) => out[k] = counts[k] || 0);
  console.log(f.split('/').pop(), JSON.stringify(out));
}
