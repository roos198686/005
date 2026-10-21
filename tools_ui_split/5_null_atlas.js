// 把场景/预制体里 cc.Sprite._atlas 指向已拆分图集的引用置为 null（纯编辑器溯源，运行时用不上）
const fs = require('fs');
const path = require('path');

const ASSETS = 'd:/babykylin_scmj/client/assets';
const ATLAS_DIR = 'd:/babykylin_scmj/client/assets/resources/images';
const PLIST_RELS = [
  'atlas/beimi-1.plist','atlas/beimi-6.plist','atlas/beimi-image-other.plist','atlas/beimi-other.plist',
  'atlas/beimi-scene.plist','atlas/chat.plist','atlas/createroom.plist','atlas/lobbyGameIcon.plist',
  'atlas/play_scene.plist','atlas/PopupScene.plist','atlas/public_ui.plist','atlas/setting.plist',
  'chat/emoji_action_texture.plist'
];
const uuids = PLIST_RELS.map(rel => JSON.parse(fs.readFileSync(path.join(ATLAS_DIR, rel + '.meta'), 'utf8')).uuid);

function walk(dir, out) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (/\.(fire|prefab)$/i.test(e.name)) out.push(p);
  }
  return out;
}

let touched = 0, total = 0;
for (const file of walk(ASSETS, [])) {
  let txt = fs.readFileSync(file, 'utf8');
  let cnt = 0;
  for (const u of uuids) {
    const re = new RegExp('"_atlas":\\s*\\{\\s*"__uuid__":\\s*"' + u + '"\\s*\\}', 'g');
    txt = txt.replace(re, () => { cnt++; return '"_atlas": null'; });
  }
  if (cnt > 0) {
    try { JSON.parse(txt); } catch (e) { console.log('!! JSON损坏:', file, e.message); continue; }
    fs.writeFileSync(file, txt);
    touched++; total += cnt;
  }
}
console.log('改写文件:', touched, '置空_atlas:', total);
