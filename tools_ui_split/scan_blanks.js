// 扫描所有拆分图,找出纯透明/纯白的空白图(切割bug受害者)
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 用PowerShell逐批检测太慢,改为Node内嵌调用一次PS脚本输出结果
const roots = [
  'd:/babykylin_scmj/client/assets/resources/images/ui',
  'd:/babykylin_scmj/client/assets/resources/images/png',
  'd:/babykylin_scmj/client/assets/resources/images/other',
  'd:/babykylin_scmj/client/assets/resources/images/setting',
  'd:/babykylin_scmj/client/assets/resources/images/GameEnd'
];
const files = [];
for (const r of roots) {
  if (!fs.existsSync(r)) continue;
  (function walk(d) {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) walk(p);
      else if (/\.png$/i.test(e.name)) files.push(p);
    }
  })(r);
}
fs.writeFileSync('d:/babykylin_scmj/tools_ui_split/scan_list.txt', files.join('\n'));
console.log('待扫描:', files.length);
