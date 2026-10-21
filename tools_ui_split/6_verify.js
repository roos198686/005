// 校验：assets 内不应再存在任何已拆分图集的旧帧 uuid / 旧主 uuid 引用
const fs = require('fs');
const path = require('path');

const ASSETS = 'd:/babykylin_scmj/client/assets';
const ATLAS_DIR = 'd:/babykylin_scmj/client/assets/resources/images';
const mapping = JSON.parse(fs.readFileSync('d:/babykylin_scmj/tools_ui_split/mapping.json', 'utf8'));
const PLIST_RELS = [
  'atlas/beimi-1.plist','atlas/beimi-6.plist','atlas/beimi-image-other.plist','atlas/beimi-other.plist',
  'atlas/beimi-scene.plist','atlas/chat.plist','atlas/createroom.plist','atlas/lobbyGameIcon.plist',
  'atlas/play_scene.plist','atlas/PopupScene.plist','atlas/public_ui.plist','atlas/setting.plist',
  'chat/emoji_action_texture.plist'
];
const oldUuids = Object.keys(mapping);
for (const rel of PLIST_RELS) {
  oldUuids.push(JSON.parse(fs.readFileSync(path.join(ATLAS_DIR, rel + '.meta'), 'utf8')).uuid);
}

function walk(dir, out) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      // 跳过旧图集目录本身（它们内部含旧uuid属正常，验证后才删）
      if (/[\\/]atlas$/.test(p) || /[\\/]images[\\/]chat$/.test(p)) continue;
      walk(p, out);
    }
    else if (/\.(fire|prefab|anim|js|json)$/i.test(e.name) && !/\.meta$/i.test(e.name)) out.push(p);
  }
  return out;
}

let hits = 0;
for (const file of walk(ASSETS, [])) {
  const txt = fs.readFileSync(file, 'utf8');
  for (const u of oldUuids) {
    if (txt.includes(u)) { console.log('残留:', file, '=>', u); hits++; }
  }
}
console.log(hits === 0 ? '校验通过：无残留旧引用' : ('残留引用 ' + hits + ' 处'));

// 新文件完整性：839张png + 839个meta
const frames = JSON.parse(fs.readFileSync('d:/babykylin_scmj/tools_ui_split/frames.json', 'utf8'));
let missing = 0;
for (const f of frames) {
  const p = path.join(f.outDir, f.outFile);
  if (!fs.existsSync(p)) { console.log('缺png:', p); missing++; }
  if (!fs.existsSync(p + '.meta')) { console.log('缺meta:', p); missing++; }
}
console.log('新图完整性:', missing === 0 ? '839+839 全齐' : ('缺 ' + missing + ' 个'));
