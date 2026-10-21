//从原版项目(d:\majiang)的beimi-6图集提取effect_a/b共24帧,
//以新uuid建独立图片, 并把两个anim的uuid按顺序重新挂接
const fs = require('fs');
const { PNG } = require('d:/babykylin_scmj/tmp_pack/node_modules/pngjs');
const plists = require('d:/babykylin_scmj/tmp_pack/node_modules/plist');

const ORIG = 'd:/majiang/assets/resources/images/atlas';
const OUT = 'd:/babykylin_scmj/client/assets/resources/images/anim_frames';
const ANIM_DIR = 'd:/babykylin_scmj/client/assets/anims';

//1. 解析原版beimi-6
const plistData = plists.parse(fs.readFileSync(ORIG + '/beimi-6.plist', 'utf8'));
const tex = PNG.sync.read(fs.readFileSync(ORIG + '/beimi-6.png'));
console.log('原版beimi-6纹理:', tex.width + 'x' + tex.height, '帧数:', Object.keys(plistData.frames).length);

//2. 提取指定帧
function extract(frameName) {
    const fr = plistData.frames[frameName];
    if (!fr) { throw new Error('原版图集中无帧: ' + frameName); }
    let x, y, w, h, rotated;
    if (fr.textureRect !== undefined) {
        const m = /\{\{(-?\d+),(-?\d+)\},\{(\d+),(\d+)\}\}/.exec(fr.textureRect);
        x = +m[1]; y = +m[2]; w = +m[3]; h = +m[4]; rotated = !!fr.textureRotated;
    } else {
        const m = /\{\{(-?\d+),(-?\d+)\},\{(\d+),(\d+)\}\}/.exec(fr.frame);
        x = +m[1]; y = +m[2]; w = +m[3]; h = +m[4]; rotated = !!fr.rotated;
    }
    const sw = rotated ? h : w, sh = rotated ? w : h;
    const blk = new PNG({ width: sw, height: sh });
    PNG.bitblt(tex, blk, x, y, sw, sh, 0, 0);
    if (!rotated) { return blk; }
    const rot = new PNG({ width: w, height: h });
    for (let yy = 0; yy < sh; yy++) {
        for (let xx = 0; xx < sw; xx++) {
            const si = (yy * sw + xx) << 2;
            const di = (xx * w + (sh - 1 - yy)) << 2;
            for (let k = 0; k < 4; k++) { rot.data[di + k] = blk.data[si + k]; }
        }
    }
    return rot;
}

function randUuid() {
    const h = '0123456789abcdef';
    let s = '';
    for (let i = 0; i < 32; i++) { s += h[Math.floor(Math.random() * 16)]; }
    return s.slice(0, 8) + '-' + s.slice(8, 12) + '-4' + s.slice(13, 16) + '-8' + s.slice(17, 20) + '-' + s.slice(20, 32);
}

fs.mkdirSync(OUT, { recursive: true });
const newName2uuid = {};
const names = [];
for (let i = 1; i <= 16; i++) { names.push('effect_b' + i + '.png'); }
for (let i = 1; i <= 8; i++) { names.push('effect_a' + i + '.png'); }
for (const name of names) {
    const base = name.replace('.png', '');
    const png = extract(name);
    const pngPath = OUT + '/' + name;
    fs.writeFileSync(pngPath, PNG.sync.write(png));
    const texUuid = randUuid(), sfUuid = randUuid();
    const meta = {
        ver: '2.3.7', uuid: texUuid, importer: 'texture', type: 'sprite',
        wrapMode: 'clamp', filterMode: 'bilinear', premultiplyAlpha: false, genMipmaps: false, packable: true,
        width: png.width, height: png.height, platformSettings: {},
        subMetas: {
            [base]: {
                ver: '1.0.6', uuid: sfUuid, importer: 'sprite-frame', rawTextureUuid: texUuid,
                trimType: 'auto', trimThreshold: 1, rotated: false, offsetX: 0, offsetY: 0, trimX: 0, trimY: 0,
                width: png.width, height: png.height, rawWidth: png.width, rawHeight: png.height,
                borderTop: 0, borderBottom: 0, borderLeft: 0, borderRight: 0, subMetas: {},
            },
        },
    };
    fs.writeFileSync(pngPath + '.meta', JSON.stringify(meta, null, 2));
    newName2uuid[name] = sfUuid;
    console.log('提取:', name, png.width + 'x' + png.height, 'spriteFrame uuid:', sfUuid.slice(0, 8));
}

//3. 重写anim: 旧uuid按keyframe出现顺序 → 新uuid
function rewriteAnim(animName, prefix, count) {
    const p = ANIM_DIR + '/' + animName;
    let raw = fs.readFileSync(p, 'utf8');
    const re = /"__uuid__"\s*:\s*"([0-9a-f-]{36})"/g;
    //按出现顺序收集去重
    const order = [];
    let m;
    while ((m = re.exec(raw)) !== null) { if (!order.includes(m[1])) { order.push(m[1]); } }
    if (order.length !== count) { console.log('警告: ' + animName + ' 引用数 ' + order.length + ' != ' + count); }
    //校验keyframe时间序列与原版一致
    for (let i = 0; i < order.length; i++) {
        const newName = prefix + (i + 1) + '.png';
        const nu = newName2uuid[newName];
        if (!nu) { throw new Error('缺新帧: ' + newName); }
        raw = raw.split(order[i]).join(nu);
        console.log(animName, 'key#' + (i + 1), '→', newName);
    }
    fs.writeFileSync(p, raw);
    console.log(animName, '已重写');
}
rewriteAnim('gang.anim', 'effect_b', 16);
rewriteAnim('gang_guafeng.anim', 'effect_a', 8);
console.log('全部完成');
