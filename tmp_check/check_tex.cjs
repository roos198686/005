//检查4张图集纹理完整性和尺寸一致性
const fs = require('fs');
const A = 'd:/babykylin_scmj/client/assets/resources/images/atlas';

function pngSize(p) {
    const b = fs.readFileSync(p);
    if (!(b[0] === 0x89 && b[1] === 0x50)) { return null; }
    return { w: b.readUInt32BE(16), h: b.readUInt32BE(20), kb: Math.round(b.length / 1024) };
}
function jpgSize(p) {
    const b = fs.readFileSync(p);
    if (!(b[0] === 0xFF && b[1] === 0xD8)) { return null; }
    let i = 2;
    while (i < b.length - 9) {
        if (b[i] !== 0xFF) { i++; continue; }
        const mk = b[i + 1];
        if (mk >= 0xC0 && mk <= 0xCF && mk !== 0xC4 && mk !== 0xC8 && mk !== 0xCC) {
            return { w: b.readUInt16BE(i + 7), h: b.readUInt16BE(i + 5), kb: Math.round(b.length / 1024) };
        }
        i += 2 + b.readUInt16BE(i + 2);
    }
    return null;
}

for (const [f, isJpg, metaSize] of [
    ['hall_ui.png', false, null], ['game_ui.png', false, null],
    ['club_ui.png', false, { w: 1856, h: 1846 }], ['table_bg.jpg', true, { w: 963, h: 1280 }],
]) {
    const p = A + '/' + f;
    const info = isJpg ? jpgSize(p) : pngSize(p);
    if (!info) { console.log(f, '损坏或无法解析!!'); continue; }
    const m = JSON.parse(fs.readFileSync(p + '.meta', 'utf8'));
    const mw = m.width, mh = m.height;
    const dimOk = mw === info.w && mh === info.h;
    const expectOk = !metaSize || (info.w === metaSize.w && info.h === metaSize.h);
    console.log(f, info.w + 'x' + info.h, info.kb + 'KB', 'meta:' + mw + 'x' + mh, (dimOk ? 'meta一致' : 'meta不一致!!'), (expectOk ? '' : '尺寸偏离预期!!'));
}
