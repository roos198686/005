// 为切出的单图生成 .png.meta（texture+sprite-frame 双子资产结构，保留九宫格边框）
const fs = require('fs');
const path = require('path');

const frames = JSON.parse(fs.readFileSync('d:/babykylin_scmj/tools_ui_split/frames.json', 'utf8'));
let n = 0;

for (const f of frames) {
  const pngPath = path.join(f.outDir, f.outFile);
  if (!fs.existsSync(pngPath)) { console.log('缺文件:', pngPath); continue; }
  const meta = {
    ver: '2.3.7',
    uuid: f.newTexUuid,
    importer: 'texture',
    type: 'sprite',
    wrapMode: 'clamp',
    filterMode: 'bilinear',
    premultiplyAlpha: false,
    genMipmaps: false,
    packable: false,
    width: f.rawW,
    height: f.rawH,
    platformSettings: {},
    subMetas: {}
  };
  meta.subMetas[f.baseName] = {
    ver: '1.0.6',
    uuid: f.newSfUuid,
    importer: 'sprite-frame',
    rawTextureUuid: f.newTexUuid,
    trimType: 'none',
    trimThreshold: 1,
    rotated: false,
    offsetX: 0,
    offsetY: 0,
    trimX: 0,
    trimY: 0,
    width: f.rawW,
    height: f.rawH,
    rawWidth: f.rawW,
    rawHeight: f.rawH,
    borderTop: f.borders.t,
    borderBottom: f.borders.b,
    borderLeft: f.borders.l,
    borderRight: f.borders.r,
    subMetas: {}
  };
  fs.writeFileSync(pngPath + '.meta', JSON.stringify(meta, null, 2));
  n++;
}
console.log('meta生成:', n);
