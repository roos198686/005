//提取anim文件引用的全部uuid + 从备份图集定位每帧信息
const fs = require('fs');
const ANIM_DIR = 'd:/babykylin_scmj/client/assets/anims';
const BK = 'd:/babykylin_scmj/backup_atlas_pack_1018';

//1. 收集两个anim的全部uuid引用
const need = new Set();
for (const f of ['gang.anim', 'gang_guafeng.anim']) {
    const raw = fs.readFileSync(ANIM_DIR + '/' + f, 'utf8');
    const re = /"__uuid__"\s*:\s*"([0-9a-f-]{36})"/g;
    let m;
    while ((m = re.exec(raw)) !== null) { need.add(m[1]); }
}
console.log('anim引用uuid总数:', need.size);

//2. 备份图集索引: uuid → {plist, 帧名, rect, rotated, 纹理}
const plists = require('d:/babykylin_scmj/tmp_pack/node_modules/plist');
const idx = {};
for (const f of fs.readdirSync(BK)) {
    if (!f.endsWith('.plist')) { continue; }
    const base = f.replace('.plist', '');
    const metaP = BK + '/' + f + '.meta';
    if (!fs.existsSync(metaP)) { continue; }
    const meta = JSON.parse(fs.readFileSync(metaP, 'utf8'));
    let data;
    try { data = plists.parse(fs.readFileSync(BK + '/' + f, 'utf8')); } catch (e) { continue; }
    const texName = data.metadata.realTextureFileName || data.metadata.textureFileName;
    const texP = BK + '/' + texName;
    if (!fs.existsSync(texP)) { console.log('备份纹理缺失:', texName); continue; }
    for (const [name, fr] of Object.entries(data.frames)) {
        if (!fr || typeof fr !== 'object') { continue; }
        const sub = (meta.subMetas || {})[name.replace(/\//g, '-')] || {};
        if (sub.uuid) { idx[sub.uuid] = { plist: f, frame: name, tex: texP }; }
    }
}
console.log('备份帧uuid索引:', Object.keys(idx).length);

//3. 匹配
let hit = 0, miss = [];
for (const u of need) {
    if (idx[u]) { hit++; } else { miss.push(u); }
}
console.log('备份中可恢复:', hit, '无法恢复:', miss.length);
if (miss.length) { console.log('缺失uuid:', miss.join('\n')); }

//4. 检查现项目中还有哪些uuid可解析(可能部分还在用)
for (const u of need) {
    if (idx[u]) { console.log('可恢复:', u.slice(0, 8), idx[u].plist, '→', idx[u].frame); }
}
