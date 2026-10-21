//替换牌桌背景: 用户新PNG → table_bg.png, 保uuid链, 更新plist
const fs = require('fs');
const { PNG } = require('d:/babykylin_scmj/tmp_pack/node_modules/pngjs');
const A = 'd:/babykylin_scmj/client/assets/resources/images/atlas';
const SRC = 'c:/Users/xsc/Downloads/table_bg.png';

//1. 读新图尺寸
const png = PNG.sync.read(fs.readFileSync(SRC));
const W = png.width, H = png.height;
console.log('新图尺寸:', W + 'x' + H);

//2. 拷入项目
fs.copyFileSync(SRC, A + '/table_bg.png');

//3. png.meta: 继承原jpg.meta的uuid(a5e2f592), 更新宽高
const oldMeta = JSON.parse(fs.readFileSync(A + '/table_bg.jpg.meta', 'utf8'));
const pngMeta = JSON.parse(JSON.stringify(oldMeta));
pngMeta.width = W; pngMeta.height = H;
const sfKey = Object.keys(pngMeta.subMetas)[0];
pngMeta.subMetas[sfKey].width = W; pngMeta.subMetas[sfKey].height = H;
pngMeta.subMetas[sfKey].rawWidth = W; pngMeta.subMetas[sfKey].rawHeight = H;
pngMeta.subMetas[sfKey].offsetX = 0; pngMeta.subMetas[sfKey].offsetY = 0;
fs.writeFileSync(A + '/table_bg.png.meta', JSON.stringify(pngMeta, null, 2));
console.log('png.meta 已写, uuid:', pngMeta.uuid.slice(0, 8), 'spriteFrame:', pngMeta.subMetas[sfKey].uuid.slice(0, 8), 'key:', sfKey);

//4. 重写plist: 整图单帧不旋转
const frameName = Object.keys(JSON.parse(fs.readFileSync(A + '/table_bg.plist.meta', 'utf8')).subMetas)[0] || '背景可随意拉伸铺满.jpg';
const plistXml = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
  <dict>
    <key>frames</key>
    <dict>
      <key>${frameName}</key>
      <dict>
        <key>aliases</key>
        <array/>
        <key>spriteOffset</key>
        <string>{0,0}</string>
        <key>spriteSize</key>
        <string>{${W},${H}}</string>
        <key>spriteSourceSize</key>
        <string>{${W},${H}}</string>
        <key>textureRect</key>
        <string>{{0,0},${W},${H}}</string>
        <key>textureRotated</key>
        <false/>
      </dict>
    </dict>
    <key>metadata</key>
    <dict>
      <key>format</key>
      <integer>3</integer>
      <key>pixelFormat</key>
      <string>RGBA8888</string>
      <key>premultiplyAlpha</key>
      <false/>
      <key>realTextureFileName</key>
      <string>table_bg.png</string>
      <key>size</key>
      <string>{${W},${H}}</string>
      <key>textureFileName</key>
      <string>table_bg.png</string>
    </dict>
  </dict>
</plist>
`;
//注意: format3的textureRect应为{{x,y},{w,h}}形式
const fixedXml = plistXml.replace(`<string>{{0,0},${W},${H}}</string>`, `<string>{{0,0},{${W},${H}}}</string>`);
fs.writeFileSync(A + '/table_bg.plist', fixedXml);
console.log('plist 已重写, 帧名:', frameName);

//5. 删除旧jpg和jpg.meta
fs.unlinkSync(A + '/table_bg.jpg');
fs.unlinkSync(A + '/table_bg.jpg.meta');
console.log('旧 table_bg.jpg / .jpg.meta 已删除');

//6. 校验uuid链
const pm = JSON.parse(fs.readFileSync(A + '/table_bg.plist.meta', 'utf8'));
const tm = JSON.parse(fs.readFileSync(A + '/table_bg.png.meta', 'utf8'));
const okChain = pm.rawTextureUuid === tm.uuid && Object.values(pm.subMetas).every(s => s.rawTextureUuid === tm.uuid);
console.log('uuid链:', okChain ? 'OK' : '断!!');
