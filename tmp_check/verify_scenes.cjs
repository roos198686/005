//校验4个游戏场景JSON完整性和uuid引用
const fs = require('fs');
const ROOT = 'd:/babykylin_scmj/client/assets';
const uuids = new Set();
function scan(d) {
    for (const f of fs.readdirSync(d)) {
        const p = d + '/' + f;
        const st = fs.statSync(p);
        if (st.isDirectory()) { scan(p); continue; }
        if (!f.endsWith('.meta')) { continue; }
        try {
            const m = JSON.parse(fs.readFileSync(p, 'utf8'));
            if (m.uuid) { uuids.add(m.uuid); }
            for (const s of Object.values(m.subMetas || {})) { if (s && s.uuid) { uuids.add(s.uuid); } }
        } catch (e) { console.log('meta损坏:', p); }
    }
}
scan(ROOT);
console.log('meta uuid总数:', uuids.size);
const RE = /"__uuid__"\s*:\s*"([0-9a-f-]{36})"/g;
for (const sf of ['mjgame_ldh.fire', 'mjgame_bmj.fire', 'mjgame_zp.fire', 'mjgame_zp4.fire']) {
    const p = ROOT + '/module/mjgame/' + sf;
    let raw;
    try { raw = fs.readFileSync(p, 'utf8'); } catch (e) { console.log(sf, '读取失败', e.message); continue; }
    try { JSON.parse(raw); } catch (e) { console.log(sf, 'JSON损坏!!', e.message); continue; }
    const missing = new Set();
    let m;
    while ((m = RE.exec(raw)) !== null) { if (!uuids.has(m[1])) { missing.add(m[1]); } }
    console.log(sf, '未解析引用:' + missing.size, [...missing].slice(0, 5).join(','));
}
//顺带校验club和hall场景
for (const sf of ['module/hall/hall.fire', 'module/hall/club.fire']) {
    const p = ROOT + '/' + sf;
    if (!fs.existsSync(p)) { console.log(sf, '不存在!'); continue; }
    const raw = fs.readFileSync(p, 'utf8');
    try { JSON.parse(raw); } catch (e) { console.log(sf, 'JSON损坏!!', e.message); continue; }
    const missing = new Set();
    let m;
    RE.lastIndex = 0;
    while ((m = RE.exec(raw)) !== null) { if (!uuids.has(m[1])) { missing.add(m[1]); } }
    console.log(sf, '未解析引用:' + missing.size, [...missing].slice(0, 5).join(','));
}
