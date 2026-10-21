// 重切空白帧:从备份图集按正确算法(旋转帧宽高互换+Rotate270)重新切割
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const BAK = 'd:/babykylin_scmj/backup_ui_split_1018_1225/atlas';
const OUT = 'd:/babykylin_scmj/client/assets/resources/images/ui';

const blanks = [
  ['beimi-1', 'b1.png'],
  ['beimi-6', 'effect_b14.png'], ['beimi-6', 'glass_a2.png'], ['beimi-6', 'glass_b0.png'],
  ['beimi-6', 'glass_b2.png'], ['beimi-6', 'glass_b5.png'], ['beimi-6', 'glass_b6.png'],
  ['beimi-6', 'glass_b7.png'], ['beimi-6', 'glass_c2.png'], ['beimi-6', 'Y2.png'],
  ['beimi-6', 'Z1.png'], ['beimi-6', 'Z3.png'], ['beimi-6', 'Z4.png'],
  ['beimi-image-other', 'account.png'], ['beimi-image-other', 'myself.png'],
  ['beimi-image-other', 'playway_playway_unselected.png'], ['beimi-image-other', 'playway_record_selected.png'],
  ['beimi-image-other', 'roomtip.png'],
  ['PopupScene', 'PopupScene15.png'],
  ['setting', 'setting9.png'],
];

// 解析plist: 输出扁平名 -> {x,y,w,h,rotated}
function parsePlist(plistPath) {
  const t = fs.readFileSync(plistPath, 'utf8');
  const map = {};
  const re = /<key>([^<]+\.png)<\/key>\s*<dict>([\s\S]*?)<\/dict>/g;
  let m;
  while ((m = re.exec(t))) {
    const flat = m[1].replace(/\//g, '_');
    const body = m[2];
    const rect = body.match(/<key>textureRect<\/key>\s*<string>\{\{(-?[\d.]+),(-?[\d.]+)\},\{(-?[\d.]+),(-?[\d.]+)\}\}<\/string>/);
    if (!rect) continue;
    map[flat] = {
      x: +rect[1], y: +rect[2], w: +rect[3], h: +rect[4],
      rotated: /<key>textureRotated<\/key>\s*<true\/>/.test(body),
    };
  }
  return map;
}

const jobs = [];
for (const [atlas, file] of blanks) {
  const plistPath = path.join(BAK, atlas + '.plist');
  if (!fs.existsSync(plistPath)) { console.log('缺plist:', atlas); continue; }
  const frames = parsePlist(plistPath);
  const info = frames[file];
  if (!info) { console.log('plist中未找到帧:', atlas, file); continue; }
  const pngCandidates = [path.join(BAK, atlas + '.png'), path.join(BAK, atlas + '.jpg')];
  const src = pngCandidates.find(p => fs.existsSync(p));
  if (!src) { console.log('缺源图:', atlas); continue; }
  jobs.push({ src, info, out: path.join(OUT, atlas, file) });
}
fs.writeFileSync('d:/babykylin_scmj/tools_ui_split/recut_jobs.json', JSON.stringify(jobs, null, 1));
console.log('待重切:', jobs.length);
