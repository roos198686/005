//分析场景中未解析uuid的性质: 是否脚本组件引用(__type__)
const fs = require('fs');
const ROOT = 'd:/babykylin_scmj/client/assets';
const UNRESOLVED = [
    'eca5d2f2-8ef6-41c2-bbe6-f9c79d09c432',
    '8cdb44ac-a3f6-449f-b354-7cd48cf84061',
    '9bbda31e-ad49-43c9-aaf2-f7d9896bac69',
    '5c3bb932-6c3c-468f-88a9-c8c61d458641',
    '5fe5dcaa-b513-4dc5-a166-573627b3a159',
    'e9ec654c-97a2-4787-9325-e6a10375219a',
    '29158224-f8dd-4661-a796-1ffab537140e',
    '7afd064b-113f-480e-b793-8817d19f63c3',
];
const files = ['module/mjgame/mjgame_ldh.fire', 'module/hall/hall.fire'];
for (const sf of files) {
    const raw = fs.readFileSync(ROOT + '/' + sf, 'utf8');
    const data = JSON.parse(raw);
    const arr = Array.isArray(data) ? data : [data];
    console.log('==== ' + sf + ' ====');
    for (const u of UNRESOLVED) {
        //作为__type__出现 = 脚本组件引用
        const asType = arr.filter(o => o && o.__type__ === u);
        //作为__uuid__出现 = 资源引用
        const asUuid = arr.filter(o => JSON.stringify(o).includes(u) && !(o.__type__ === u));
        if (asType.length === 0 && asUuid.length === 0) { continue; }
        if (asType.length > 0) {
            console.log(u.slice(0, 8), '脚本组件引用 x' + asType.length, '节点名:', asType.map(o => { const n = arr.find(x => x && x._components && x._components.some(c => c.__id__ === arr.indexOf(o))); return n ? n._name : '?'; }).join(','));
        } else {
            const sample = asUuid[0];
            console.log(u.slice(0, 8), '资源引用 x' + asUuid.length, '字段:', Object.keys(sample).filter(k => JSON.stringify(sample[k]).includes(u)).join(','));
        }
    }
}
//全项目搜索这些uuid(含js代码)
console.log('==== 项目内文件出现位置 ====');
function walk(d, cb) {
    for (const f of fs.readdirSync(d)) {
        const p = d + '/' + f;
        const st = fs.statSync(p);
        if (st.isDirectory()) { walk(p, cb); continue; }
        cb(p);
    }
}
for (const u of UNRESOLVED) {
    const hits = [];
    walk(ROOT, p => {
        if (!/\.(fire|prefab|anim|js|meta|json)$/.test(p)) { return; }
        let raw;
        try { raw = fs.readFileSync(p, 'utf8'); } catch (e) { return; }
        if (raw.includes(u)) { hits.push(p.replace(ROOT + '/', '')); }
    });
    console.log(u.slice(0, 8), '→', hits.length === 0 ? '项目内无任何文件含此uuid(引擎内置或已删)' : hits.slice(0, 4).join(' , ') + (hits.length > 4 ? ' 等' + hits.length + '处' : ''));
}
