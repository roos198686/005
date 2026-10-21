// 把 hall.js 运行时对场景做的静态改动烘焙进 hall.fire / club.fire:
//  1. content/first 设为 inactive(玩法图标区,运行时由 initClub 隐藏)
//  2. content/second 保持 inactive(创建/加入房间页,已弃用)
//  3. backroom(返回游戏)默认 inactive(onLoad 会按 roomId 动态显隐,默认无房)
//  4. 在 content 下固化 clubEntryBtn(cc.Sprite 用 resources/textures/jlb 帧),运行时只挂事件
// 幂等:已存在 clubEntryBtn 则跳过创建。
const fs = require('fs');
const path = require('path');

const JLB_FRAME_UUID = '8c7147cc-e89c-605d-498e-12b62ea636f6'; // resources/textures/jlb.png 的 sprite-frame
const MATERIAL_UUID = 'eca5d2f2-8ef6-41c2-bbe6-f9c79d09c432'; // 场景内 Sprite 通用材质(抄自现有 Sprite)

function rid() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    let s = '';
    for (let i = 0; i < 22; i++) s += chars[Math.floor(Math.random() * 64)];
    return s;
}

function findChild(arr, parentId, name) {
    const p = arr[parentId];
    if (!p || !p._children) return -1;
    for (const c of p._children) {
        const n = arr[c.__id__];
        if (n && n._name === name) return c.__id__;
    }
    return -1;
}

function findNodeByName(arr, name) {
    for (let i = 0; i < arr.length; i++) {
        const o = arr[i];
        if (o && o.__type__ === 'cc.Node' && o._name === name) return i;
    }
    return -1;
}

function patch(file) {
    const arr = JSON.parse(fs.readFileSync(file, 'utf8'));
    const bak = file + '.bak_clubentry';
    if (!fs.existsSync(bak)) fs.writeFileSync(bak, fs.readFileSync(file));

    // 根 Canvas 下的 content(一级),排除 rankitem/HistoryItem 等同名节点
    let contentId = -1;
    for (let i = 0; i < arr.length; i++) {
        const o = arr[i];
        if (o && o.__type__ === 'cc.Node' && o._name === 'content') {
            const first = findChild(arr, i, 'first');
            if (first >= 0) { contentId = i; break; }
        }
    }
    if (contentId < 0) throw new Error('content node not found in ' + file);

    const firstId = findChild(arr, contentId, 'first');
    const secondId = findChild(arr, contentId, 'second');
    if (firstId >= 0) arr[firstId]._active = false;
    if (secondId >= 0) arr[secondId]._active = false;

    const backroomId = findNodeByName(arr, 'backroom');
    if (backroomId >= 0) arr[backroomId]._active = false;

    let entryId = findChild(arr, contentId, 'clubEntryBtn');
    if (entryId < 0) {
        const nodeId = arr.length;
        const spId = arr.length + 1;
        arr.push({
            "__type__": "cc.Node", "_name": "clubEntryBtn", "_objFlags": 0,
            "_parent": { "__id__": contentId }, "_children": [], "_active": true,
            "_components": [{ "__id__": spId }], "_prefab": null,
            "_opacity": 255, "_color": { "__type__": "cc.Color", "r": 255, "g": 255, "b": 255, "a": 255 },
            "_contentSize": { "__type__": "cc.Size", "width": 375, "height": 525 },
            "_anchorPoint": { "__type__": "cc.Vec2", "x": 0.5, "y": 0.5 },
            "_trs": { "__type__": "TypedArray", "ctor": "Float64Array", "array": [0, 20, 0, 0, 0, 0, 1, 1, 1, 0] },
            "_eulerAngles": { "__type__": "cc.Vec3", "x": 0, "y": 0, "z": 0 },
            "_skewX": 0, "_skewY": 0, "_is3DNode": false, "_groupIndex": 0, "groupIndex": 0,
            "_id": rid()
        });
        arr.push({
            "__type__": "cc.Sprite", "_name": "", "_objFlags": 0,
            "node": { "__id__": nodeId }, "_enabled": true,
            "_materials": [{ "__uuid__": MATERIAL_UUID }],
            "_srcBlendFactor": 770, "_dstBlendFactor": 771,
            "_spriteFrame": { "__uuid__": JLB_FRAME_UUID },
            "_type": 0, "_sizeMode": 0, "_fillType": 0,
            "_fillCenter": { "__type__": "cc.Vec2", "x": 0, "y": 0 },
            "_fillStart": 0, "_fillRange": 0, "_isTrimmedMode": true, "_atlas": null,
            "_id": rid()
        });
        arr[contentId]._children.push({ "__id__": nodeId });
        entryId = nodeId;
        console.log(path.basename(file), ': clubEntryBtn added as id', nodeId, 'sprite id', spId);
    } else {
        console.log(path.basename(file), ': clubEntryBtn already exists at id', entryId);
    }

    fs.writeFileSync(file, JSON.stringify(arr, null, 2));
    console.log(path.basename(file), ': first active=', arr[firstId]._active,
        'second active=', secondId >= 0 ? arr[secondId]._active : 'N/A',
        'backroom active=', backroomId >= 0 ? arr[backroomId]._active : 'N/A');
}

patch('d:/babykylin_scmj/client/assets/module/hall/hall.fire');
patch('d:/babykylin_scmj/client/assets/module/hall/club.fire');
