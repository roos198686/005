// 诸暨翻财神 台数规则回归测试
// 覆盖：中发白刻、东风刻、平胡(共享牌)、对对胡、混一色、清一色、无财、杠上开花、
//       封顶(全字牌/多财神/超台)、一台起胡门槛、2人/4人两套实现一致性
var ldh = require('../game_server/gamemgr_ldh');
var zj4 = require('../game_server/gamemgr_zj4');

var pass = 0, fail = 0;
function eq(name, got, want){
    if(got === want){ pass++; console.log('  \u2713 ' + name + ' (' + got + ')'); }
    else { fail++; console.log('  \u2717 ' + name + ' 期望=' + want + ' 实际=' + got); }
}

// 牌名：0-8筒 9-17条 18-26万 27中28发29白30东31南32西33北
var ZJ = { z:27, f:28, b:29, d:30, n:31 };

function seat(holds, opt){
    opt = opt || {};
    var sd = {
        holds: holds.slice(),
        countMap: {},
        pengs: opt.pengs || [],
        gangs: opt.gangs || [],
        chis: opt.chis || [],
        folds: [],
        score: 0
    };
    for(var i = 0; i < sd.holds.length; ++i){
        sd.countMap[sd.holds[i]] = (sd.countMap[sd.holds[i]] || 0) + 1;
    }
    return sd;
}
function game(caishen, opt){
    opt = opt || {};
    return {
        caishen: caishen == null ? -1 : caishen,
        caishen2: opt.caishen2 == null ? -1 : opt.caishen2,
        taiRules: opt.taiRules || null,
        maxTai: opt.maxTai || 10
    };
}
// 与 gamemgr 内 getMinTai 等价
function minTai(g){
    var r = g.taiRules;
    var v = (r && r.min_tai != null) ? Number(r.min_tai) : NaN;
    return isNaN(v) ? 1 : v;
}

function runBoth(title, holds, caishen, expectTai, expectHu, opt){
    var g1 = game(caishen, opt), g2 = game(caishen, opt);
    var s1 = seat(holds, opt), s2 = seat(holds, opt);
    eq('[2人] ' + title + ' 台数', ldh.__calculateTai(s1, g1, false, (opt && opt.extraTai) || 0), expectTai);
    eq('[4人] ' + title + ' 台数', zj4.__calculateTai(s2, g2, false, (opt && opt.extraTai) || 0), expectTai);
    if(expectHu != null){
        eq('[2人] ' + title + ' 可胡', ldh.checkCanHu(seat(holds, opt), caishen, (opt && opt.caishen2) || -1), expectHu);
        eq('[4人] ' + title + ' 可胡', zj4.checkCanHu(seat(holds, opt), caishen, (opt && opt.caishen2) || -1), expectHu);
    }
}

console.log('==== 台项逐项验证 ====');

// 1. 中发白各刻 + 无财 = 4台（用户反馈回归：此前算3台）
//    手牌：中中中 发发发 白白白 + 1,2,3筒 + 1条1条；财神=1万(18) 不在手上 -> 无财+1
runBoth('中发白各刻+无财', [27,27,27, 28,28,28, 29,29,29, 0,1,2, 9,9], 18, 4, true);
// 同样手牌 无财神玩法(caishen=-1) -> 现在统一触发无财+1，共4台（中发白3 + 无财1）
runBoth('中发白各刻(无财神局)', [27,27,27, 28,28,28, 29,29,29, 0,1,2, 9,9], -1, 4, true);
// 同样手牌 财神在手上(1筒当财神) -> 不计无财；结构由财神替代仍可胡
runBoth('中发白各刻+手上有财', [27,27,27, 28,28,28, 29,29,29, 0,1,2, 9,9], 0, 3, true);

// 2. 平胡（共享牌 456+456+678 中"6"出现3次，旧逻辑按count>=3误判为有刻子）
runBoth('平胡-共享牌456456678', [4,5,6, 4,5,6, 6,7,8, 9,10,11, 18,18], 18, 1, true);

// 3. 平胡 + 无财 = 2台（财神=中，手上没有中）
runBoth('平胡+无财', [4,5,6, 4,5,6, 6,7,8, 9,10,11, 18,18], 27, 2, true);

// 4. 对对胡 = 1台（碰1筒(财神) + 三个2筒、三个3筒、三个4筒 + 18万对当将；财神在碰中caishenTotal=1不触发无财）
runBoth('对对胡', [2,2,2, 3,3,3, 4,4,4, 18,18], 0, 1, true, {pengs:[0]});
// 4b. 对对胡 + 杠上开花(额外+1) = 2台
runBoth('对对胡+杠开', [2,2,2, 3,3,3, 4,4,4, 18,18], 0, 2, true, {pengs:[0], extraTai:1});

// 5. 清一色 + 平胡 = 4台（财神用1筒，在手上）
runBoth('清一色+平胡', [0,1,2, 1,2,3, 3,4,5, 6,7,8, 4,4], 0, 4, true);

// 6. 东风刻 = 2台（财神用1筒，在手上）
runBoth('东风刻', [30,30,30, 0,1,2, 3,4,5, 12,13,14, 15,15], 0, 2, true);

// 7. 混一色 = 1台（一色数牌 + 字牌；财神用1筒，在手上）
runBoth('混一色', [0,1,2, 3,4,5, 6,7,8, 31,31,31, 29,29], 0, 1, true);

// 8. 无财 = 1台（南南南刻无台项 + 筒条万混色，仅剩无财）
runBoth('无财单台', [31,31,31, 0,1,2, 12,13,14, 21,22,23, 15,15], 27, 1, true);

console.log('==== 封顶 ====');

// 9. 全字牌 = 封顶
runBoth('全字牌=封顶', [27,27,27, 28,28,28, 29,29,29, 30,30,30, 31,31], -1, 10, true);
// 10. 三个及以上财神 = 封顶
runBoth('多财神=封顶', [0,0,0, 27,27,27, 28,28,28, 29,29,29, 31,31], 0, 10, true);
// 11. 常规台数超过封顶 -> 取封顶(封顶配1，清一色平胡4台；财神用1筒，在手上)
runBoth('超台取封顶', [0,1,2, 1,2,3, 3,4,5, 6,7,8, 4,4], 0, 1, true, {maxTai:1});

console.log('==== 杠牌 ====');

// 12. 带1个杠：手牌11张(14-3)，胡牌判定不得因杠而漏判；杠0当财神，不计无财
runBoth('带杠可胡', [1,2,3, 4,5,6, 9,10,11, 15,15], 0, 0, true, {gangs:[{pai:0}]});
eq('[2人] 带杠手牌可胡', ldh.checkCanHu(seat([1,2,3, 4,5,6, 9,10,11, 15,15], {gangs:[{pai:0}]}), 0, -1), true);
eq('[4人] 带杠手牌可胡', zj4.checkCanHu(seat([1,2,3, 4,5,6, 9,10,11, 15,15], {gangs:[{pai:0}]}), 0, -1), true);

console.log('==== 一台起胡门槛 ====');

// 13. 0台牌型(南南南刻无台项 + 筒条混色) -> 结构可胡但台数不足门槛；财神用1筒，在手上
var zeroHolds = [31,31,31, 0,1,2, 3,4,5, 12,13,14, 15,15];
eq('[2人] 0台牌型台数', ldh.__calculateTai(seat(zeroHolds.slice()), game(0), false, 0), 0);
eq('[2人] 0台牌型结构可胡', ldh.checkCanHu(seat(zeroHolds.slice()), 0, -1), true);
eq('[4人] 0台牌型台数', zj4.__calculateTai(seat(zeroHolds.slice()), game(0), false, 0), 0);
eq('[4人] 0台牌型结构可胡', zj4.checkCanHu(seat(zeroHolds.slice()), 0, -1), true);
// 门槛判定：默认 min_tai=1 -> 0台不能胡；显式配 0 -> 可以胡
var g0 = game(0), g0r = game(0, {taiRules:{min_tai:0}});
var tai0 = ldh.__calculateTai(seat(zeroHolds.slice()), g0, false, 0);
eq('默认门槛 min_tai=1', minTai(g0), 1);
eq('0台 < 门槛1 不可胡', (tai0 >= minTai(g0)), false);
eq('配 min_tai=0 后 0台可胡', (tai0 >= minTai(g0r)), true);

// 14. 后台 taiRules 缺省回退
eq('taiRules=null 时门槛回退1', minTai(game(0)), 1);
eq('taiRules 缺 min_tai 时回退1', minTai(game(0, {taiRules:{wu_cai:1}})), 1);

console.log('');
console.log('=== 结果: ' + pass + ' 通过, ' + fail + ' 失败 ===');
process.exit(fail > 0 ? 1 : 0);
