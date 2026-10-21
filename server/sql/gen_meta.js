// 生成 DZPKGame.js 的 .meta（含UUID），并输出场景引用的压缩UUID
var crypto = require('crypto');
var fs = require('fs');
var path = require('path');

function genUuid() {
    var b = crypto.randomBytes(16);
    b[6] = (b[6] & 0x0f) | 0x40;
    b[8] = (b[8] & 0x3f) | 0x80;
    var h = b.toString('hex');
    return h.slice(0, 8) + '-' + h.slice(8, 12) + '-' + h.slice(12, 16) + '-' + h.slice(16, 20) + '-' + h.slice(20);
}

const BASE64_KEYS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
function compressUuid(uuid) {
    var hex = uuid.replace(/-/g, '');
    var result = hex.slice(0, 5);
    for (var i = 5; i + 3 <= hex.length; i += 3) {
        var v = parseInt(hex.slice(i, i + 3), 16);
        result += BASE64_KEYS[v >> 6] + BASE64_KEYS[v & 63];
    }
    return result;
}

// 验证算法：LoadingLogic.js uuid 350d3472-f5a5-48a8-9476-edf3f61ffcf5 应压缩为 350d3Ry9aVIqJR27fP2H/z1
var check = compressUuid('350d3472-f5a5-48a8-9476-edf3f61ffcf5');
console.log('算法验证:', check, check === '350d3Ry9aVIqJR27fP2H/z1' ? 'OK' : 'FAIL');
if (check !== '350d3Ry9aVIqJR27fP2H/z1') { process.exit(1); }

var target = process.argv[2];
var uuid = genUuid();
var meta = {
    ver: "1.1.0",
    uuid: uuid,
    importer: "javascript",
    isPlugin: false,
    loadPluginInWeb: true,
    loadPluginInNative: true,
    loadPluginInEditor: false,
    subMetas: {}
};
fs.writeFileSync(target + '.meta', JSON.stringify(meta, null, 2));
console.log('META_WRITTEN', target + '.meta');
console.log('UUID', uuid);
console.log('COMPRESSED', compressUuid(uuid));
