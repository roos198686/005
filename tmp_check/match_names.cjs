//对比原版beimi-6帧名与当前game_ui帧名, 重建anim引用
const fs = require('fs');
const plists = require('d:/babykylin_scmj/tmp_pack/node_modules/plist');
const re = /"__uuid__"\s*:\s*"([0-9a-f-]{36})"/g;

//原版 beimi-6: uuid→帧名
const origMetaPath = fs.existsSync('d:/majiang/assets/resources/images/atlas/beimi-6.plist.meta') ? 'd:/majiang/assets/resources/images/atlas/beimi-6.plist.meta' : 'd:/majiang/assets/images/atlas/beimi-6.plist.meta';
if (!fs.existsSync(origMetaPath)) { console.log('原版beimi-6 meta不存在, 查找路径:'); }
const om = JSON.parse(fs.readFileSync(origMetaPath, 'utf8'));
const origUuid2name = {};
for (const [k, v] of Object.entries(om.subMetas || {})) { if (v.uuid) { origUuid2name[v.uuid] = k; } }

//当前 game_ui / hall_ui / club_ui / table_bg: uuid→帧名
const A = 'd:/babykylin_scmj/client/assets/resources/images/atlas';
const curUuid2name = {};
for (const f of ['game_ui.plist.meta', 'hall_ui.plist.meta', 'club_ui.plist.meta', 'table_bg.plist.meta']) {
    const m = JSON.parse(fs.readFileSync(A + '/' + f, 'utf8'));
    for (const [k, v] of Object.entries(m.subMetas || {})) { if (v.uuid) { curUuid2name[v.uuid] = k; } }
}

//我们的anim引用的uuid → 查当前归属
for (const name of ['gang.anim', 'gang_guafeng.anim']) {
    const raw = fs.readFileSync('d:/babykylin_scmj/client/assets/anims/' + name, 'utf8');
    const uuids = [...new Set([...raw.matchAll(re)].map(m => m[1]))];
    console.log('====', name, '====');
    for (const u of uuids) {
        console.log(u.slice(0, 8), '当前归属:', curUuid2name[u] || '无!!');
    }
}
console.log('==== 原版gang.anim的帧名(顺序) ====');
const origRaw = fs.readFileSync('d:/majiang/assets/anims/gang.anim', 'utf8');
for (const u of [...new Set([...origRaw.matchAll(re)].map(m => m[1]))]) {
    console.log(u.slice(0, 8), '→', origUuid2name[u] || '无');
}
console.log('==== 原版gang_guafeng.anim的帧名(顺序) ====');
const origRaw2 = fs.readFileSync('d:/majiang/assets/anims/gang_guafeng.anim', 'utf8');
for (const u of [...new Set([...origRaw2.matchAll(re)].map(m => m[1]))]) {
    console.log(u.slice(0, 8), '→', origUuid2name[u] || '无');
}
