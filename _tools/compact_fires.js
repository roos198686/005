// 压缩 .fire:移除 null 槽位,重映射全部 __id__ 引用,生成引擎可解析的稠密数组
const fs = require('fs');

function remap(obj, map) {
  if (!obj || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map((v) => remap(v, map));
  const keys = Object.keys(obj);
  if (keys.length === 1 && typeof obj.__id__ === 'number') {
    if (!(obj.__id__ in map)) throw new Error('dangling ref to removed slot ' + obj.__id__);
    return { __id__: map[obj.__id__] };
  }
  const out = {};
  for (const k of keys) {
    if (k === '__id__') continue;
    out[k] = remap(obj[k], map);
  }
  return out;
}

function compact(file) {
  const d = JSON.parse(fs.readFileSync(file, 'utf8'));
  const map = {};
  let next = 0;
  d.forEach((o, i) => { if (o != null) map[i] = next++; });
  const dense = [];
  d.forEach((o, i) => { if (o != null) dense.push(remap(o, map)); });
  fs.writeFileSync(file, JSON.stringify(dense));
  console.log(file.split('/').pop(), d.length, '->', dense.length);
}

compact('d:/babykylin_scmj/client/assets/module/hall/hall.fire');
compact('d:/babykylin_scmj/client/assets/module/hall/club.fire');
