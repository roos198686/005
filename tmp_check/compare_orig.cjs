//对比原版(d:\majiang)与当前gang动画的帧uuid引用
const fs = require('fs');
const re = /"__uuid__"\s*:\s*"([0-9a-f-]{36})"/g;
function ids(s) { const set = new Set(); let m; while ((m = re.exec(s)) !== null) { set.add(m[1]); } return set; }

for (const name of ['gang.anim', 'gang_guafeng.anim']) {
    const orig = fs.readFileSync('d:/majiang/assets/anims/' + name, 'utf8');
    const ours = fs.readFileSync('d:/babykylin_scmj/client/assets/anims/' + name, 'utf8');
    const a = ids(orig), b = ids(ours);
    let same = 0; const diff = [];
    for (const u of b) { if (a.has(u)) { same++; } else { diff.push(u); } }
    console.log('====', name, '原版:', a.size, '帧 | 我们的:', b.size, '帧 | uuid相同:', same, '不同:', diff.length);
}

//原版的帧在d:\majiang里对应的文件
const raw = fs.readFileSync('d:/majiang/assets/anims/gang.anim', 'utf8');
const uuids = [...ids(raw)];
function walk(d, cb) {
    for (const f of fs.readdirSync(d)) {
        const p = d + '/' + f;
        const st = fs.statSync(p);
        if (st.isDirectory()) { walk(p, cb); continue; }
        cb(p);
    }
}
console.log('==== 在 d:/majiang 中定位原版帧文件 ====');
const uuidSet = new Set(uuids);
const found = [];
walk('d:/majiang/assets', p => {
    if (!p.endsWith('.meta')) { return; }
    let m;
    try { m = JSON.parse(fs.readFileSync(p, 'utf8')); } catch (e) { return; }
    if (m.uuid && uuidSet.has(m.uuid)) { found.push(p); }
    for (const s of Object.values(m.subMetas || {})) { if (s && s.uuid && uuidSet.has(s.uuid)) { found.push(p + ' → 子资源'); } }
});
console.log('找到文件数:', found.length);
for (const f of found.slice(0, 30)) { console.log(f.replace('d:/majiang/assets/', '')); }
