const fs = require('fs');
for (const f of ['hall', 'club']) {
  const d = JSON.parse(fs.readFileSync('d:/babykylin_scmj/client/assets/module/hall/' + f + '.fire', 'utf8'));
  console.log(f, 'nonNull', d.filter((x) => x != null).length, '/', d.length);
}
