// 解析13个UI图集 plist+meta → frames.json(切图清单) + mapping.json(旧uuid→新uuid/路径)
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ATLAS_DIR = 'd:/babykylin_scmj/client/assets/resources/images';
const OUT_BASE = 'd:/babykylin_scmj/client/assets/resources/images/ui';
const TOOLS = 'd:/babykylin_scmj/tools_ui_split';

// [plist绝对路径, 源图文件名, 输出子目录名]
const PLISTS = [
  ['atlas/beimi-1.plist', 'beimi-1.png', 'beimi-1'],
  ['atlas/beimi-6.plist', 'beimi-6.png', 'beimi-6'],
  ['atlas/beimi-image-other.plist', 'beimi-image-other.png', 'beimi-image-other'],
  ['atlas/beimi-other.plist', 'beimi-other.png', 'beimi-other'],
  ['atlas/beimi-scene.plist', 'beimi-scene.jpg', 'beimi-scene'],
  ['atlas/chat.plist', 'chat.png', 'chat'],
  ['atlas/createroom.plist', 'createroom.png', 'createroom'],
  ['atlas/lobbyGameIcon.plist', 'lobbyGameIcon.png', 'lobbyGameIcon'],
  ['atlas/play_scene.plist', 'play_scene.png', 'play_scene'],
  ['atlas/PopupScene.plist', 'PopupScene.png', 'PopupScene'],
  ['atlas/public_ui.plist', 'public_ui.png', 'public_ui'],
  ['atlas/setting.plist', 'setting.png', 'setting'],
  ['chat/emoji_action_texture.plist', 'emoji_action_texture.png', 'emoji'],
];

function parseRect(s) {
  const m = s.match(/\{\{\s*(-?[\d.]+)\s*,\s*(-?[\d.]+)\s*\}\s*,\s*\{\s*(-?[\d.]+)\s*,\s*(-?[\d.]+)\s*\}\}/);
  return m ? { x: +m[1], y: +m[2], w: +m[3], h: +m[4] } : null;
}
function parsePoint(s) {
  const m = s.match(/\{\s*(-?[\d.]+)\s*,\s*(-?[\d.]+)\s*\}/);
  return m ? { x: +m[1], y: +m[2] } : { x: 0, y: 0 };
}

const allFrames = [];
const mapping = {};
let trimmedCount = 0, rotatedCount = 0, noColorRect = 0;

for (const [rel, srcImg, outDir] of PLISTS) {
  const plistPath = path.join(ATLAS_DIR, rel);
  const xml = fs.readFileSync(plistPath, 'utf8');
  const meta = JSON.parse(fs.readFileSync(plistPath + '.meta', 'utf8'));
  const sub = meta.subMetas || {};

  // 匹配 <key>name.png</key><dict>...</dict>（帧定义无嵌套dict）
  const re = /<key>([^<]+\.(?:png|jpg))<\/key>\s*<dict>([\s\S]*?)<\/dict>/g;
  let m;
  while ((m = re.exec(xml)) !== null) {
    const name = m[1];
    const body = m[2];
    const get = (keys, isBool) => {
      for (const k of keys) {
        const r = new RegExp('<key>' + k + '<\\/key>\\s*(?:<string>([^<]*)<\\/string>|<(true|false)\\s*\\/>)');
        const mm = body.match(r);
        if (mm) return isBool ? mm[2] === 'true' : mm[1];
      }
      return isBool ? false : null;
    };
    const rect = parseRect(get(['frame', 'textureRect']) || '');
    const srcSize = parsePoint(get(['sourceSize', 'spriteSourceSize']) || '{0,0}');
    const colorRect = parseRect(get(['sourceColorRect', 'spriteColorRect']) || '');
    const offset = parsePoint(get(['offset', 'spriteOffset']) || '{0,0}');
    // plist.xml 帧名用 '/' 分隔子目录，plist.meta 里用 '-' 分隔
    const metaKey = name.replace(/\//g, '-');
    const sm = sub[metaKey];
    if (!sm) { console.log('!! meta缺帧:', rel, name); continue; }
    const rotated = sm.rotated === true;
    if (rotated) rotatedCount++;
    const finalW = rotated ? rect.h : rect.w;
    const finalH = rotated ? rect.w : rect.h;
    let pasteX, pasteY;
    if (colorRect) { pasteX = colorRect.x; pasteY = colorRect.y; }
    else {
      // 缺 colorRect 时用中心偏移公式换算（cocos offset 为 Y 向上）
      pasteX = Math.round((srcSize.x - finalW) / 2 + offset.x);
      pasteY = Math.round((srcSize.y - finalH) / 2 - offset.y);
      if (srcSize.x !== finalW || srcSize.y !== finalH) noColorRect++;
    }
    if (srcSize.x !== finalW || srcSize.y !== finalH) trimmedCount++;

    const newTexUuid = crypto.randomUUID();
    const newSfUuid = crypto.randomUUID();
    // 文件名安全化：'/'和'#'转'_'，保留中文
    const safeName = name.replace(/\.(png|jpg)$/i, '').replace(/[\/#\\]/g, '_');
    const outFile = safeName + '.png';
    mapping[sm.uuid] = { newUuid: newSfUuid, rel: 'images/ui/' + outDir + '/' + outFile };

    allFrames.push({
      plist: rel,
      srcImg: path.join(ATLAS_DIR, path.dirname(rel), srcImg),
      outDir: path.join(OUT_BASE, outDir),
      outFile,
      baseName: safeName,
      rect, rotated,
      rawW: srcSize.x, rawH: srcSize.y,
      pasteX, pasteY,
      borders: { t: sm.borderTop || 0, b: sm.borderBottom || 0, l: sm.borderLeft || 0, r: sm.borderRight || 0 },
      oldUuid: sm.uuid, newTexUuid, newSfUuid,
    });
  }
}

// 输出重名检测（同目录下同名文件会互相覆盖）
const seen = {};
for (const f of allFrames) {
  const k = f.outDir + '/' + f.outFile;
  if (seen[k]) console.log('!! 输出重名:', k, '(', seen[k].plist, '/', f.plist, ')');
  seen[k] = f;
}

fs.mkdirSync(TOOLS, { recursive: true });
fs.writeFileSync(path.join(TOOLS, 'frames.json'), JSON.stringify(allFrames, null, 1));
fs.writeFileSync(path.join(TOOLS, 'mapping.json'), JSON.stringify(mapping, null, 1));
console.log('总帧数:', allFrames.length, '旋转:', rotatedCount, '裁剪:', trimmedCount, '缺colorRect的裁剪帧:', noColorRect);
