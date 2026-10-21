//恢复gang动画的24帧: 从备份图集提取像素, 以原uuid建独立图片
const fs = require('fs');
const { PNG } = require('d:/babykylin_scmj/tmp_pack/node_modules/pngjs');
const plists = require('d:/babykylin_scmj/tmp_pack/node_modules/plist');

const ANIM_DIR = 'd:/babykylin_scmj/client/assets/anims';
const BK_ROOT = 'd:/babykylin_scmj/backup_atlas_pack_1018';
const OUT_DIR = 'd:/babykylin_scmj/client/assets/resources/images/anim_frames';

//1. anim引用的全部uuid
const need = new Set();
for (const f of ['gang.anim', 'gang_guafeng.anim']) {
    const raw = fs.readFileSync(ANIM_DIR + '/' + f, 'utf8');
    const re = /"__uuid__"\s*:\s*"([0-9a-f-]{36})"/g;
    let m;
    while ((m = re.exec(raw)) !== null) { need.add(m[1]); }
}

//2. 备份图集索引 (根目录 + atlas子目录)
function listBackups(d, acc) {
    if (!fs.existsSync(d)) { return acc; }
    for (const f of fs.readdirSync(d)) {
        const p = d + '/' + f;
        if (fs.statSync(p).isDirectory()) { listBackups(p, acc); }
        else if (f.endsWith('.plist') && fs.existsSync(p + '.meta')) { acc.push(p); }
    }
    return acc;
}
const idx = {};
for (const plistP of listBackups(BK_ROOT, [])) {
    const meta = JSON.parse(fs.readFileSync(plistP + '.meta', 'utf8'));
    let data;
    try { data = plists.parse(fs.readFileSync(plistP, 'utf8')); } catch (e) { console.log('解析失败', plistP); continue; }
    const texName = data.metadata.realTextureFileName || data.metadata.textureFileName;
    const texP = plistP.replace(/[^/\\]+$/, '') + texName;
    for (const [name, fr] of Object.entries(data.frames || {})) {
        if (!fr || typeof fr !== 'object') { continue; }
        const dash = name.replace(/\//g, '-');
        const sub = (meta.subMetas || {})[dash] || (meta.subMetas || {})[name] || {};
        if (sub.uuid) { idx[sub.uuid] = { plist: plistP, frame: name, frameData: fr, texP, texName }; }
    }
}
console.log('备份帧uuid索引:', Object.keys(idx).length);

//3. 匹配需要恢复的帧
const jobs = [];
const miss = [];
for (const u of need) {
    if (idx[u]) { jobs.push(Object.assign({ uuid: u }, idx[u])); } else { miss.push(u); }
}
console.log('可恢复:', jobs.length, '无法恢复:', miss.length);
if (miss.length) { console.log('无法恢复uuid:\n' + miss.join('\n')); }

if (jobs.length === 0) { process.exit(0); }

//4. 逐图集提取像素
const texCache = {};
function getTex(p) {
    if (!texCache[p]) {
        const buf = fs.readFileSync(p);
        texCache[p] = PNG.sync.read(buf);
    }
    return texCache[p];
}
fs.mkdirSync(OUT_DIR, { recursive: true });
let done = 0;
const byAtlas = {};
for (const j of jobs) { (byAtlas[j.plist] = byAtlas[j.plist] || []).push(j); }
for (const [plistP, list] of Object.entries(byAtlas)) {
    const tex = getTex(list[0].texP);
    for (const j of list) {
        const fr = j.frameData;
        //解析rect: format3 {{x,y},{w,h}}+rotated 或 format2 frame/rotated
        let x, y, w, h, rotated;
        if (fr.textureRect !== undefined) {
            const m = /\{\{(-?\d+),(-?\d+)\},\{(\d+),(\d+)\}\}/.exec(fr.textureRect);
            x = +m[1]; y = +m[2]; w = +m[3]; h = +m[4];
            rotated = !!fr.textureRotated;
        } else {
            const m = /\{\{(-?\d+),(-?\d+)\},\{(\d+),(\d+)\}\}/.exec(fr.frame);
            x = +m[1]; y = +m[2]; w = +m[3]; h = +m[4];
            rotated = !!fr.rotated;
        }
        //rotated=true: w/h是未旋转尺寸, 纹理中实际块为{h,w}
        const sw = rotated ? h : w, sh = rotated ? w : h;
        const out = new PNG({ width: sw, height: sh });
        PNG.bitblt(tex, out, x, y, sw, sh, 0, 0);
        if (rotated) {
            //逆旋转90°: 存储块→原方向 (顺时针存, 逆时针转回)
            const rot = new PNG({ width: w, height: h });
            for (let yy = 0; yy < sh; yy++) {
                for (let xx = 0; xx < sw; xx++) {
                    const si = (yy * sw + xx) << 2;
                    const di = (xx * w + (sh - 1 - yy)) << 2;
                    for (let k = 0; k < 4; k++) { rot.data[di + k] = out.data[si + k]; }
                }
            }
            var finalPng = rot;
        } else { var finalPng = out; }
        //文件名: 帧名中的路径字符换掉
        const safe = j.frame.replace(/[\/\\]/g, '_').replace(/\.png$/i, '');
        const outPng = OUT_DIR + '/' + safe + '.png';
        fs.writeFileSync(outPng, PNG.sync.write(finalPng));
        //meta: spriteFrame子资源uuid = 原帧uuid
        const texUuid = 'a' + j.uuid.slice(1); //纹理子uuid用同uuid变体(保证合法且唯一)
        const meta = {
            ver: '2.3.7', importer: 'texture', type: 'sprite', wrapMode: 'clamp', filterMode: 'bilinear',
            premultiplyAlpha: false, genMipmaps: false, packable: true,
            width: finalPng.width, height: finalPng.height, platformSettings: {},
            subMetas: {
                [safe]: {
                    ver: '1.0.6', uuid: j.uuid, importer: 'sprite-frame',
                    rawTextureUuid: texUuid, trimType: 'auto', trimThreshold: 1, rotated: false,
                    offsetX: 0, offsetY: 0, trimX: 0, trimY: 0,
                    width: finalPng.width, height: finalPng.height,
                    rawWidth: finalPng.width, rawHeight: finalPng.height,
                    borderTop: 0, borderBottom: 0, borderLeft: 0, borderRight: 0, subMetas: {},
                },
            },
        };
        //再补uuid字段: texture meta自身uuid = texUuid
        meta.uuid = texUuid;
        fs.writeFileSync(outPng + '.meta', JSON.stringify(meta, null, 2));
        done++;
        console.log('恢复:', safe + '.png', finalPng.width + 'x' + finalPng.height, 'uuid:', j.uuid.slice(0, 8), '<-', j.frame);
    }
}
console.log('完成: ' + done + '帧 → ' + OUT_DIR);
