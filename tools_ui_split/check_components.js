// 检查场景/预制体中 ClickEvent 的 component 字段是否都有对应脚本类
const fs = require('fs');
const path = require('path');
const A = 'd:/babykylin_scmj/client/assets';

const classes = new Set();
(function walk(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) walk(p);
    else if (/\.js$/i.test(e.name)) classes.add(e.name.replace(/\.js$/i, ''));
  }
})(A);

const bad = {};
(function walk(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) walk(p);
    else if (/\.(fire|prefab)$/i.test(e.name)) {
      const t = fs.readFileSync(p, 'utf8');
      const re = /"component":\s*"([^"]+)"/g;
      let m;
      while ((m = re.exec(t))) {
        if (!classes.has(m[1])) {
          if (!bad[m[1]]) bad[m[1]] = new Set();
          bad[m[1]].add(path.basename(p));
        }
      }
    }
  }
})(A);

const keys = Object.keys(bad);
if (!keys.length) console.log('全部 ClickEvent component 均有对应脚本类');
else for (const c of keys) console.log('缺失类:', c, ' 出现于:', [...bad[c]].join(', '));
