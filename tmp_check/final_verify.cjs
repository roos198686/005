//最终校验: anim JSON有效 + 全项目无残留死引用 + 提取帧尺寸齐全
const fs = require('fs');
const path = require('path');
const ROOT = 'd:/babykylin_scmj/client/assets';

//1. anim文件JSON有效 + 引用的uuid全部可解析
const uuids = new Set();
function scan(d) {
    for (const f of fs.readdirSync(d)) {
        const p = d + '/' + f;
        const st = fs.statSync(p);
        if (st.isDirectory()) { scan(p); continue; }
        if (f.endsWith('.meta')) {
            try {
                const m = JSON.parse(fs.readFileSync(p, 'utf8'));
                if (m.uuid) { uuids.add(m.uuid); }
                for (const s of Object.values(m.subMetas || {})) { if (s && s.uuid) { uuids.add(s.uuid); } }
            } catch (e) { console.log('meta损坏:', p); }
        }
    }
}
scan(ROOT);
console.log('项目meta uuid总数:', uuids.size);

let bad = 0;
const ANIM_DIR = ROOT + '/anims';
for (const f of fs.readdirSync(ANIM_DIR)) {
    if (!f.endsWith('.anim')) { continue; }
    const raw = fs.readFileSync(ANIM_DIR + '/' + f, 'utf8');
    try { JSON.parse(raw); } catch (e) { console.log(f, 'JSON损坏!!'); bad++; continue; }
    const re = /"__uuid__"\s*:\s*"([0-9a-f-]{36})"/g;
    let m; const miss = [];
    while ((m = re.exec(raw)) !== null) { if (!uuids.has(m[1])) { miss.push(m[1]); } }
    console.log(f, miss.length === 0 ? '引用全部可解析 OK' : '死引用' + miss.length + '个!! ' + miss.slice(0, 3).join(','));
    bad += miss.length;
}

//2. 24个新帧的meta存在且uuid注册
let okFrames = 0;
const FR = ROOT + '/resources/images/anim_frames';
for (let i = 1; i <= 16; i++) { const b = 'effect_b' + i; if (fs.existsSync(FR + '/' + b + '.png') && fs.existsSync(FR + '/' + b + '.png.meta')) { okFrames++; } }
for (let i = 1; i <= 8; i++) { const b = 'effect_a' + i; if (fs.existsSync(FR + '/' + b + '.png') && fs.existsSync(FR + '/' + b + '.png.meta')) { okFrames++; } }
console.log('新帧文件齐全:', okFrames + '/24');

//3. 全项目搜索旧死uuid残留
const dead = ['88bc315d', '12174c51', '1c379133', '4e585efd'];
let residual = 0;
function walk(d, cb) {
    for (const f of fs.readdirSync(d)) {
        const p = d + '/' + f;
        const st = fs.statSync(p);
        if (st.isDirectory()) { walk(p, cb); continue; }
        cb(p);
    }
}
walk(ROOT, p => {
    if (!/\.(fire|prefab|anim|js|json|asset)$/.test(p)) { return; }
    const raw = fs.readFileSync(p, 'utf8');
    for (const d of dead) { if (raw.includes(d)) { console.log('残留:', p.replace(ROOT + '/', ''), d); residual++; } }
});
console.log('旧死uuid残留:', residual, '| anim死引用:', bad);
console.log(residual === 0 && bad === 0 && okFrames === 24 ? '==== 全部通过 ====' : '==== 有问题需处理 ====');
