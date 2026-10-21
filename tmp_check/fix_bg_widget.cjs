//直接改场景: Z_backgroud 的 Sprite 改 CUSTOM + 添加全屏拉伸 Widget
const fs = require('fs');
const D = 'd:/babykylin_scmj/client/assets/module/mjgame/';
const scenes = ['mjgame_ldh.fire', 'mjgame_bmj.fire', 'mjgame_zp.fire', 'mjgame_zp4.fire'];
let rand = () => Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 12);

for (const f of scenes) {
    const p = D + f;
    if (!fs.existsSync(p)) { console.log('跳过(不存在):', f); continue; }
    const data = JSON.parse(fs.readFileSync(p, 'utf8'));
    const arr = Array.isArray(data) ? data : null;
    if (!arr) { console.log('格式异常:', f); continue; }
    //找 Z_backgroud 节点
    const ni = arr.findIndex(o => o && o.__type__ === 'cc.Node' && o._name === 'Z_backgroud');
    if (ni < 0) { console.log('无Z_backgroud:', f); continue; }
    const node = arr[ni];
    let changed = [];
    //1. Sprite sizeMode → CUSTOM(0)
    for (const cid of node._components) {
        const c = arr[cid.__id__];
        if (c && c.__type__ === 'cc.Sprite' && c._sizeMode !== 0) { c._sizeMode = 0; changed.push('sizeMode→CUSTOM'); }
    }
    //2. 无Widget则补全屏拉伸Widget
    const hasWidget = node._components.some(cid => arr[cid.__id__] && arr[cid.__id__].__type__ === 'cc.Widget');
    if (!hasWidget) {
        const w = {
            __type__: 'cc.Widget', _name: '', _objFlags: 0,
            node: { __id__: ni }, _enabled: true,
            alignMode: 2, _target: null, _alignFlags: 45,
            _left: 0, _right: 0, _top: 0, _bottom: 0,
            _verticalCenter: 0, _horizontalCenter: 0,
            _isAbsLeft: true, _isAbsRight: true, _isAbsTop: true, _isAbsBottom: true,
            _isAbsHorizontalCenter: true, _isAbsVerticalCenter: true,
            _originalWidth: 0, _originalHeight: 0,
            _id: rand(),
        };
        arr.push(w);
        node._components.push({ __id__: arr.length - 1 });
        changed.push('添加全屏Widget');
    }
    fs.writeFileSync(p, JSON.stringify(arr, null, 2));
    console.log(f, '→', changed.length ? changed.join(', ') : '已是目标状态');
}
console.log('完成');
