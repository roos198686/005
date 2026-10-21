//定位404的uuid属于哪些图集帧 + 检查library导入状态
const fs = require('fs');
const A = 'd:/babykylin_scmj/client/assets/resources/images/atlas';
const LIB = 'd:/babykylin_scmj/client/library';

const UUIDS = ['88bc315d-2bfa-4f1a-9fa2-0aefb20f8b80','1c379133-a131-4496-a463-332b06b238ed','2a4709b9-b70d-41c6-a25f-a5c34412e53f','c358728f-2e2f-4577-8aae-63db56b55741','a5f07f17-7c7a-4dbe-aa33-7ed09bc6f9dd','a2bc647f-a7f2-4fd1-b9ce-58df912d25b6','aaa5deb6-cee1-4629-b199-5ec7aa9d7062','6300e5b2-3b20-4492-b0a4-f4c277c65657','7a22467a-30f2-4fc6-81e0-853b18cde3f1','b18931c1-a9fd-4e81-9ba9-a74dc93bc881','108811e9-dd0a-4a23-8bd7-cc04a4a00de0','ee831478-ded0-4d92-80e2-88d2fbeac966','2c34a446-50c1-48b6-adeb-8e432d1f5d50','010704df-a81f-4d6f-9682-0339d081cb01','57d8f7b7-f248-4ea1-80d9-fd8629a27ff6','1ad49164-16c9-4d36-80d3-111232d7ce51','3a45a28a-7c66-4c0d-815b-31d6512a9b00','2bd11480-bbfa-4f34-93e0-4553ce8ecf67','0c209978-defa-4157-a293-bf66494152f0','9b33b6ec-ced7-4f2d-877b-385b45821275','6314a7d6-cedd-4dae-94a2-81fece794ea5','2304fd27-500b-4594-bd0e-aeac622b8b9f','4e585efd-c87c-4b1d-80e2-9d59df49a85e','12174c51-b0be-4890-8d95-a93c18b89679'];

//建uuid→帧名索引
const idx = {};
for (const f of ['hall_ui.plist.meta', 'game_ui.plist.meta', 'club_ui.plist.meta', 'table_bg.plist.meta']) {
    try {
        const m = JSON.parse(fs.readFileSync(A + '/' + f, 'utf8'));
        if (m.uuid) { idx[m.uuid] = f + ' (图集本体)'; }
        for (const [k, v] of Object.entries(m.subMetas || {})) { if (v && v.uuid) { idx[v.uuid] = f + ' → ' + k; } }
    } catch (e) { console.log('读取失败', f, e.message); }
}
//其他目录的meta也扫一遍(限定prefab/anim/script)
function walk(d, cb) {
    for (const f of fs.readdirSync(d)) {
        const p = d + '/' + f;
        const st = fs.statSync(p);
        if (st.isDirectory()) { walk(p, cb); continue; }
        cb(p);
    }
}
let scanned = 0;
walk('d:/babykylin_scmj/client/assets', p => {
    if (!p.endsWith('.meta') || p.startsWith(A)) { return; }
    scanned++;
    let m;
    try { m = JSON.parse(fs.readFileSync(p, 'utf8')); } catch (e) { return; }
    if (m.uuid) { idx[m.uuid] = idx[m.uuid] || p.replace('d:/babykylin_scmj/client/assets/', ''); }
    for (const [k, v] of Object.entries(m.subMetas || {})) { if (v && v.uuid && !idx[v.uuid]) { idx[v.uuid] = p.replace('d:/babykylin_scmj/client/assets/', '') + ' → ' + k; } }
});

console.log('==== 404 uuid 归属 ====');
let atlasCnt = 0, otherCnt = 0, unknownCnt = 0, libMissing = 0;
for (const u of UUIDS) {
    const owner = idx[u];
    const libP1 = LIB + '/imported/' + u.slice(0, 2) + '/' + u + '.json';
    const libP2 = LIB + '/imported/' + u.slice(0, 2) + '/' + u + '.json.meta';
    const inLib = fs.existsSync(libP1);
    if (!inLib) { libMissing++; }
    if (!owner) { unknownCnt++; console.log(u.slice(0, 8), '→ 未找到归属!!', 'library:', inLib ? '有' : '缺!!'); }
    else if (owner.includes('.plist.meta')) { atlasCnt++; console.log(u.slice(0, 8), '→', owner, 'library:', inLib ? '有' : '缺!!'); }
    else { otherCnt++; console.log(u.slice(0, 8), '→', owner, 'library:', inLib ? '有' : '缺!!'); }
}
console.log('统计: 图集帧=' + atlasCnt, '其他=' + otherCnt, '未知=' + unknownCnt, 'library缺失=' + libMissing + '/' + UUIDS.length);
