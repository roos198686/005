const fs = require('fs');
const path = require('path');
const p = 'd:/babykylin_scmj/client/assets/module/club/club.fire';
const d = JSON.parse(fs.readFileSync(p, 'utf8'));
let del = 0;
// 先列出所有 sampleCard/sampleRow/emptyTip 节点
console.log('=== 场景里运行时会被清/会被JS控制的节点 ===');
d.forEach((n, i) => {
    if (n && n.__type__ === 'cc.Node' && /^sampleCard|^sampleRow|sample/.test(n._name)) {
        console.log('[' + i + '] ' + n._name + ' active=' + n._active);
    }
});

// 全删 sampleCard / sampleRow 节点
const toDel = new Set();
d.forEach((n, i) => {
    if (n && n.__type__ === 'cc.Node' && /^sampleCard|^sampleRow/.test(n._name)) {
        toDel.add(i);
        // 子节点也要收集
        const walk = function(idx){
            if(!d[idx] || !d[idx]._children) return;
            d[idx]._children.forEach(c => { toDel.add(c.__id__); walk(c.__id__); });
        };
        walk(i);
    }
});

if (toDel.size === 0) {
    console.log('\n场景里已经没有示例节点了(上次可能编辑器已清)');
} else {
    // 删除前先修正所有节点 _children / _parent 的引用
    const keepIdx = [];
    for (let i = 0; i < d.length; i++) {
        if (!toDel.has(i)) { keepIdx.push(i); }
    }
    // 重映射索引
    const remap = {};
    for (let newI = 0; newI < keepIdx.length; newI++) {
        remap[keepIdx[newI]] = newI;
    }
    const nd = [];
    for (let i = 0; i < d.length; i++) {
        if (toDel.has(i)) continue;
        const node = JSON.parse(JSON.stringify(d[i]));
        if (node._parent && node._parent.__id__ != null && remap[node._parent.__id__] == null) {
            // 父节点被删了, 找上层未被删的父
            console.log('WARNING: 父节点也被删, 跳过 ' + node._name);
            continue;
        }
        if (node._parent && node._parent.__id__ != null) {
            node._parent.__id__ = remap[node._parent.__id__];
        }
        if (node._children) {
            node._children = node._children
                .filter(c => remap[c.__id__] != null)
                .map(c => ({ __id__: remap[c.__id__] }));
        }
        if (node.node && node.node.__id__ != null && remap[node.node.__id__] != null) {
            node.node.__id__ = remap[node.node.__id__];
        }
        nd.push(node);
    }
    fs.writeFileSync(p, JSON.stringify(nd, null, 2));
    console.log('\n删除了 ' + toDel.size + ' 个节点, 文件从 ' + d.length + ' → ' + nd.length + ' 个条目');
}
