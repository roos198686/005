// 批量改写 assets 下所有 .fire/.prefab/.anim 中的图集帧 uuid → 新单图 uuid
// 同时检测报告仍引用图集主 uuid（cc.SpriteAtlas 属性绑定）的位置
const fs = require('fs');
const path = require('path');

const ASSETS = 'd:/babykylin_scmj/client/assets';
const mapping = JSON.parse(fs.readFileSync('d:/babykylin_scmj/tools_ui_split/mapping.json', 'utf8'));

// 13个图集主 uuid（检测 SpriteAtlas 属性绑定用）
const ATLAS_DIR = 'd:/babykylin_scmj/client/assets/resources/images';
const PLIST_RELS = [
  'atlas/beimi-1.plist','atlas/beimi-6.plist','atlas/beimi-image-other.plist','atlas/beimi-other.plist',
  'atlas/beimi-scene.plist','atlas/chat.plist','atlas/createroom.plist','atlas/lobbyGameIcon.plist',
  'atlas/play_scene.plist','atlas/PopupScene.plist','atlas/public_ui.plist','atlas/setting.plist',
  'chat/emoji_action_texture.plist'
];
const atlasMainUuid = {};
for (const rel of PLIST_RELS) {
  const m = JSON.parse(fs.readFileSync(path.join(ATLAS_DIR, rel + '.meta'), 'utf8'));
  atlasMainUuid[m.uuid] = rel;
}

function walk(dir, out) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (/\.(fire|prefab|anim)$/i.test(e.name)) out.push(p);
  }
  return out;
}

const files = walk(ASSETS, []);
let touched = 0, totalRepl = 0;
const atlasBindHits = [];

for (const file of files) {
  let txt = fs.readFileSync(file, 'utf8');
  let cnt = 0;
  for (const oldUuid in mapping) {
    if (txt.includes(oldUuid)) {
      const parts = txt.split(oldUuid);
      cnt += parts.length - 1;
      txt = parts.join(mapping[oldUuid].newUuid);
    }
  }
  for (const au in atlasMainUuid) {
    if (txt.includes(au)) atlasBindHits.push(file + ' <= ' + atlasMainUuid[au]);
  }
  if (cnt > 0) {
    fs.writeFileSync(file, txt);
    touched++; totalRepl += cnt;
    // JSON 校验
    try { JSON.parse(txt); } catch (e) { console.log('!! JSON损坏:', file, e.message); }
  }
}
console.log('扫描文件:', files.length, '改写文件:', touched, '替换引用:', totalRepl);
console.log('--- 仍引用图集主uuid的位置（SpriteAtlas绑定，需人工处理）---');
atlasBindHits.forEach(h => console.log(h));
