const fs = require('fs');

console.log('======== 1. 当前真实值 ========');

// prefab 根节点
const pf = JSON.parse(fs.readFileSync('d:/babykylin_scmj/client/assets/resources/prefabs/club_table_card.prefab', 'utf8'));
for (let i = 0; i < pf.length; i++) {
    if (pf[i] && pf[i].__type__ === 'cc.Node' && !pf[i]._parent) {
        console.log('prefab 根节点: 原始尺寸=' + pf[i]._contentSize.width + 'x' + pf[i]._contentSize.height + ' scale=(' + pf[i]._trs.array.slice(7, 10).join(',') + ')');
        break;
    }
}

// 场景 tablesView Widget
const d = JSON.parse(fs.readFileSync('d:/babykylin_scmj/client/assets/module/club/club.fire', 'utf8'));
d.forEach((n, i) => {
    if (n && n._name === 'tablesView') {
        const w = (n._components || []).map(c => d[c.__id__]).find(c => c && c.__type__ === 'cc.Widget');
        console.log('tablesView: 原始尺寸=' + n._contentSize.width + 'x' + n._contentSize.height + ' widget=' + (w ? 'flags' + w._alignFlags + ' L' + w._left + ' R' + w._right + ' T' + w._top + ' B' + w._bottom : 'NONE'));
    }
});

// clubScene.js 列数逻辑
const src = fs.readFileSync('d:/babykylin_scmj/client/assets/module/club/srcipts/clubScene.js', 'utf8');
console.log('\n======== 2. 当前列数计算代码 ========');
const colIdx = src.indexOf('_clubTableCols');
console.log(src.slice(Math.max(0, colIdx - 200), colIdx + 400));

console.log('\n======== 3. 计算: 要排5张需要卡片多宽 ========');
// 运行时 tablesView 宽度 ≈ 场景宽 - 左列宽330 - margin
// 场景设计分辨率 1280, 左列 games 约 330, tablesView 左边距 Widget L=20 R=20
// tablesView 运行时宽 ≈ 1280 - 330 - 20 - 20 = 910
const viewW = 910;
const gap = 12;
const needCardW = (viewW - 10 - 4 * gap) / 5; // 5 card, 4 gap
const origCardW = 260;
const needScale = needCardW / origCardW;
console.log('运行时 view 宽≈' + viewW);
console.log('5张需要有效卡片宽≤' + needCardW.toFixed(1));
console.log('prefab 原始宽 ' + origCardW + ' → 需要 scale ≤ ' + needScale.toFixed(3));
// 再验证
[1280, 1080, 1024, 960, 800].forEach(scrW => {
    const vw = scrW - 330 - 40;
    const effCard = origCardW * needScale + gap;
    const cols = Math.max(1, Math.floor((vw - 10) / effCard));
    console.log('屏宽' + scrW + ' → view≈' + vw + ' → ' + cols + '列');
});
