// 俱乐部大厅页/详情页/创建弹窗/加入弹窗 全部固化进场景
// club.fire 原地增强; hall.fire 从 club.fire 深拷贝整套(脱prefab,引用重映射)
const fs = require('fs');

const DIR = 'd:/babykylin_scmj/client/assets/module/hall/';
const CLUB = DIR + 'club.fire';
const HALL = DIR + 'hall.fire';
const TITLE_UUID = 'd2e8f0a1-6b3c-4d7e-8f2a-9c1b5d3e6f7a'; // club_join_title 482x126

function rid() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    let s = '';
    for (let i = 0; i < 22; i++) s += chars[Math.floor(Math.random() * 64)];
    return s;
}
const isRef = (v) => v && typeof v === 'object' && typeof v.__id__ === 'number';
function walkRefs(o, fn) {
    if (o == null || typeof o !== 'object') return;
    if (Array.isArray(o)) { for (const v of o) walkRefs(v, fn); return; }
    if (isRef(o)) { fn(o.__id__); return; }
    for (const k in o) walkRefs(o[k], fn);
}

// 深拷贝 srcArr 中 rootIds 子树到 dstArr,新父节点 parentId( dstArr 内 id);返回 {map, roots}
function cloneSubtree(srcArr, dstArr, rootIds, parentId) {
    const included = new Set(rootIds);
    const queue = rootIds.slice();
    while (queue.length) {
        const id = queue.shift();
        const o = srcArr[id];
        if (!o) continue;
        walkRefs(o, function (refId) {
            const t = srcArr[refId];
            if (!t || t.__type__ === 'cc.PrefabInfo') return; //脱 prefab:不拷贝 PrefabInfo
            if (!included.has(refId)) { included.add(refId); queue.push(refId); }
        });
    }
    const map = new Map();
    //先建占位
    const ordered = Array.from(included);
    for (const id of ordered) { map.set(id, dstArr.length); dstArr.push(null); }
    for (const id of ordered) {
        let o = JSON.parse(JSON.stringify(srcArr[id]));
        const remap = (v) => {
            if (v == null || typeof v !== 'object') return;
            if (Array.isArray(v)) { v.forEach(remap); return; }
            if (isRef(v)) {
                if (map.has(v.__id__)) v.__id__ = map.get(v.__id__);
                //外部引用保持原样(理论上除根_parent外不存在)
                return;
            }
            for (const k in v) remap(v[k]);
        };
        remap(o);
        if ('_prefab' in o) o._prefab = null; //彻底断开 prefab 关联
        if (typeof o._id === 'string') o._id = rid();
        dstArr[map.get(id)] = o;
    }
    const roots = rootIds.map(id => map.get(id));
    //根节点重新挂父
    for (const ridx of roots) {
        const r = dstArr[ridx];
        r._parent = { __id__: parentId };
    }
    return { map, roots, included };
}

function findNode(arr, name) {
    for (let i = 0; i < arr.length; i++) if (arr[i] && arr[i].__type__ === 'cc.Node' && arr[i]._name === name) return i;
    return -1;
}
function findChild(arr, parentId, name) {
    for (const c of arr[parentId]._children) if (arr[c.__id__]._name === name) return c.__id__;
    return -1;
}
function compOfType(arr, nodeId, type) {
    for (const c of arr[nodeId]._components) if (arr[c.__id__].__type__ === type) return c.__id__;
    return -1;
}

// ============ 1. club.fire 原地增强 ============
let club = JSON.parse(fs.readFileSync(CLUB, 'utf8'));

const pageId = findNode(club, 'clubPage');
const wfId = findNode(club, 'wfPage');
const joinSrc = findNode(club, 'JoinGame');

// 1a. detailFullBg 增加 cc.Graphics(运行时按屏重画,组件固化)
const wfArea = findChild(club, wfId, 'listArea');
const fullBg = findChild(club, wfId, 'detailFullBg');
if (compOfType(club, fullBg, 'cc.Graphics') < 0) {
    const gid = club.length;
    club.push({
        "__type__": "cc.Graphics", "_name": "", "_objFlags": 0, "node": { "__id__": fullBg },
        "_enabled": true, "_materials": [], "_srcBlendFactor": 770, "_dstBlendFactor": 771,
        "_N$lineWidth": 1,
        "_N$strokeColor": { "__type__": "cc.Color", "r": 255, "g": 255, "b": 255, "a": 255 },
        "_N$fillColor": { "__type__": "cc.Color", "r": 255, "g": 255, "b": 255, "a": 255 },
        "_N$miterLimit": 10, "_N$lineJoin": 2, "_N$lineCap": 0, "_id": rid()
    });
    club[fullBg]._components.push({ "__id__": gid });
}
// 1b. btnBack 自制返回图自带文字,隐藏文字 Label
const backBtn = findChild(club, wfArea, 'btnBack');
const backL = findChild(club, backBtn, 'l');
if (backL >= 0) club[backL]._active = false;
// 1c. clubName 左锚点+浅金色(Label 字号/对齐已固化)
const clubName = findChild(club, wfArea, 'clubName');
club[clubName]._anchorPoint.x = 0;
club[clubName]._color = { "__type__": "cc.Color", "r": 255, "g": 235, "b": 180, "a": 255 };

// 1d. 克隆 JoinGame 两次:创建/加入弹窗(脱 prefab)
function bakePopup(name, isCreate) {
    const { roots } = cloneSubtree(club, club, [joinSrc], pageId);
    const rootId = roots[0];
    const root = club[rootId];
    root._name = name;
    root._active = false;
    club[pageId]._children.push({ "__id__": rootId });
    const byName = {};
    (function collect(id) {
        byName[club[id]._name] = byName[club[id]._name] || id;
        for (const c of club[id]._children) collect(c.__id__);
    })(rootId);
    //标题图换俱乐部标题(482x126,CUSTOM)
    const title = byName['PopupScene20'];
    if (title >= 0) {
        club[title]._contentSize = { "__type__": "cc.Size", "width": 482, "height": 126 };
        const sp = compOfType(club, title, 'cc.Sprite');
        if (sp >= 0) {
            club[sp]._spriteFrame = { "__uuid__": TITLE_UUID };
            club[sp]._sizeMode = 0;
            club[sp]._atlas = null;
        }
    }
    if (isCreate) {
        //隐藏数字键盘与6个输入框占位 Label
        if (byName['New Node'] >= 0) club[byName['New Node']]._active = false;
        for (let i = 0; i < club[rootId]._children.length; i++) {
            const ch = club[club[rootId]._children[i].__id__];
            if (ch._name.indexOf('Z_shurukuang') === 0) ch._active = false;
        }
        //正文提示 createMsg(Label + LabelOutline)
        const msgId = club.length, lblId = club.length + 1, outId = club.length + 2;
        club.push({
            "__type__": "cc.Node", "_name": "createMsg", "_objFlags": 0,
            "_parent": { "__id__": rootId }, "_children": [], "_active": true,
            "_components": [{ "__id__": lblId }, { "__id__": outId }], "_prefab": null,
            "_opacity": 255, "_color": { "__type__": "cc.Color", "r": 255, "g": 235, "b": 180, "a": 255 },
            "_contentSize": { "__type__": "cc.Size", "width": 600, "height": 50 },
            "_anchorPoint": { "__type__": "cc.Vec2", "x": 0.5, "y": 0.5 },
            "_trs": { "__type__": "TypedArray", "ctor": "Float64Array", "array": [0, 0, 0, 0, 0, 0, 1, 1, 1, 0] },
            "_eulerAngles": { "__type__": "cc.Vec3", "x": 0, "y": 0, "z": 0 },
            "_skewX": 0, "_skewY": 0, "_is3DNode": false, "_groupIndex": 0, "groupIndex": 0, "_id": rid()
        });
        club.push({
            "__type__": "cc.Label", "_name": "", "_objFlags": 0, "node": { "__id__": msgId },
            "_enabled": true, "_materials": [], "_srcBlendFactor": 770, "_dstBlendFactor": 771,
            "_string": "创建俱乐部请联系管理员开通", "_N$string": "创建俱乐部请联系管理员开通",
            "_N$fontSize": 42, "_N$lineHeight": 50, "_enableWrapText": false, "_N$file": null,
            "_isSystemFontUsed": true, "_spacingX": 0, "_batchAsBitmap": false, "_styleFlags": 0,
            "_underlineHeight": 0, "_N$horizontalAlign": 1, "_N$verticalAlign": 1,
            "_N$fontFamily": "Arial", "_N$overflow": 0, "_N$cacheMode": 0, "_id": rid()
        });
        club.push({
            "__type__": "cc.LabelOutline", "_name": "", "_objFlags": 0, "node": { "__id__": msgId },
            "_enabled": true, "_materials": [], "_srcBlendFactor": 770, "_dstBlendFactor": 771,
            "_N$color": { "__type__": "cc.Color", "r": 60, "g": 30, "b": 0, "a": 255 },
            "_N$width": 3, "_id": rid()
        });
        club[rootId]._children.push({ "__id__": msgId });
    }
    return rootId;
}
const existCreate = findChild(club, pageId, 'clubCreateWin');
const existJoin = findChild(club, pageId, 'clubJoinWin');
if (existCreate < 0) bakePopup('clubCreateWin', true);
if (existJoin < 0) bakePopup('clubJoinWin', false);

fs.writeFileSync(CLUB, JSON.stringify(club, null, 2));
console.log('club.fire done, objects:', club.length);

// ============ 2. hall.fire 拷贝 clubPage + wfPage ============
let hall = JSON.parse(fs.readFileSync(HALL, 'utf8'));
const canvas = findNode(hall, 'Canvas');
if (findChild(hall, canvas, 'clubPage') < 0) {
    // 重新从已保存的 club.fire 读取(含弹窗)
    club = JSON.parse(fs.readFileSync(CLUB, 'utf8'));
    const cPage = findNode(club, 'clubPage');
    const cWf = findNode(club, 'wfPage');
    const { roots } = cloneSubtree(club, hall, [cPage, cWf], canvas);
    //插到 WaitingConnection 之前(与 club.fire 一致),没有则追加
    const idx = hall[canvas]._children.findIndex(c => hall[c.__id__]._name === 'WaitingConnection');
    const refs = roots.map(r => ({ "__id__": r }));
    if (idx >= 0) hall[canvas]._children.splice(idx, 0, ...refs);
    else hall[canvas]._children.push(...refs);
    fs.writeFileSync(HALL, JSON.stringify(hall, null, 2));
    console.log('hall.fire done, objects:', hall.length);
} else {
    console.log('hall.fire already has clubPage, skip');
}
