// 漳浦麻将 规则回归测试
// 覆盖：金牌判定(含白板附带)、面子组合(金补)、胡牌结构(5面子+1将)、七对(7对+1刻)、
//       金不可点炮、2金禁点炮(可自摸)、抢金、游金候选、台数计算
var zp = require('../game_server/gamemgr_zp');
var zp4 = require('../game_server/gamemgr_zp4');
var I = zp.__internals;

var pass = 0, fail = 0;
function eq(name, got, want){
    if(got === want){ pass++; console.log('  ✓ ' + name); }
    else { fail++; console.log('  ✗ ' + name + ' 期望=' + JSON.stringify(want) + ' 实际=' + JSON.stringify(got)); }
}

// 牌值：0-8筒 9-17条 18-26万 27中28发29白30东31南32西33北 34-41花
function game(jinPai, opt){
    opt = opt || {};
    return { jinPai: jinPai == null ? -1 : jinPai, taiRules: opt.taiRules || null, maxTai: opt.maxTai || 10, conf: {baseScore: 1} };
}
function seat(holds, opt){
    opt = opt || {};
    return {
        holds: holds.slice(),
        hua: opt.hua || [],
        pengs: opt.pengs || [],
        gangs: opt.gangs || [],
        chis: opt.chis || [],
        folds: [],
        youJinLevel: opt.youJinLevel || 0
    };
}
function cmOf(arr){
    var cm = {};
    for(var i = 0; i < arr.length; ++i){ cm[arr[i]] = (cm[arr[i]] || 0) + 1; }
    return cm;
}

console.log('==== 金牌(百搭)判定 ====');
eq('金牌本身算金', I.isWild(game(5), 5), true);
eq('金牌是万筒条时白板算金', I.isWild(game(5), 29), true);
eq('金牌是字牌时白板不算金', I.isWild(game(30), 29), false);
eq('非金牌不算金', I.isWild(game(5), 6), false);

console.log('==== 面子组合 canFormMelds ====');
eq('3真刻', I.canFormMelds(cmOf([0,0,0]), 0), true);
eq('2真+1金成刻', I.canFormMelds(cmOf([0,0]), 1), true);
eq('1真+2金成刻', I.canFormMelds(cmOf([0]), 2), true);
eq('纯金3张成刻', I.canFormMelds({}, 3), true);
eq('顺子金补1张', I.canFormMelds(cmOf([0,1]), 1), true);
eq('顺子金补2张', I.canFormMelds(cmOf([0]), 2), true);
eq('顺子不可跨花色(8筒9条10条)', I.canFormMelds(cmOf([8,9,10]), 0), false);
eq('字牌不可成顺', I.canFormMelds(cmOf([27,28]), 1), false);

console.log('==== 胡牌结构 5面子+1将(17张) ====');
eq('5刻+1将', I.checkHuStructure(cmOf([0,0,0,1,1,1,2,2,2,3,3,3,4,4,4,5,5]), 0), true);
eq('4刻+1将+1真2金成刻', I.checkHuStructure(cmOf([0,0,0,1,1,1,2,2,2,3,3,3,5,5,6]), 2), true);
eq('缺将不可胡', I.checkHuStructure(cmOf([0,0,0,1,1,1,2,2,2,3,3,3,4,4,4,7,8]), 0), false);
eq('将=2金', I.checkHuStructure(cmOf([0,0,0,1,1,1,2,2,2,3,3,3,4,4,4]), 2), true);

console.log('==== 七对(7对子+1刻) ====');
eq('7对+1真刻', I.checkQiDui(cmOf([0,0,1,1,2,2,3,3,4,4,5,5,6,6,7,7,7]), 0), true);
eq('7对+1刻(金补)', I.checkQiDui(cmOf([0,0,1,1,2,2,3,3,4,4,5,5,6,6,7,7]), 1), true);
eq('16张不算七对', I.checkQiDui(cmOf([0,0,1,1,2,2,3,3,4,4,5,5,6,6,7,7]), 0), false);

console.log('==== 点炮限制 ====');
// 16张听5：0-3刻 + 4对 + 5对
var ting5 = [0,0,0,1,1,1,2,2,2,3,3,3,4,4,5,5];
eq('普通点炮可胡', I.canDianPao(game(-1), seat(ting5), 5), true);
eq('金不可点炮', I.canDianPao(game(6), seat(ting5), 6), false);
// 16张含2金听5：0-3刻 + 4对 + 6金6金
var ting5j = [0,0,0,1,1,1,2,2,2,3,3,3,4,4,6,6];
eq('手里2金禁止点炮', I.canDianPao(game(6), seat(ting5j), 5), false);
// 同牌自摸(17张 %3==2)可以胡
var zimo5 = ting5j.concat([5]);
eq('手里2金可自摸', (function(){
    var sd = seat(zimo5);
    var g = game(6);
    if(sd.holds.length % 3 != 2) return 'len';
    var sp = I.splitHolds(g, sd);
    return I.checkHuStructure(sp.cm, sp.wilds);
})(), true);

console.log('==== 抢金 ====');
eq('16张+1金成胡可抢金', I.canQiangJin(game(6), seat(ting5)), true);
eq('16张本已成胡也可抢金', I.canQiangJin(game(6), seat([0,0,0,1,1,1,2,2,2,3,3,3,4,4,5,5])), true);
eq('不成胡不可抢金', I.canQiangJin(game(6), seat([0,0,0,1,1,1,2,2,2,3,3,3,4,6,8,27])), false);

console.log('==== 游金候选 ====');
// 17张：5刻 + 1金 + 单7 → 打7即游金
var yj = [0,0,0,1,1,1,2,2,2,3,3,3,4,4,4,6,7];
eq('游金候选=打单张7', JSON.stringify(I.findYouJinDiscards(game(6), seat(yj))), JSON.stringify([7]));
eq('金牌不可作为游金打出候选', (function(){
    var cands = I.findYouJinDiscards(game(6), seat(yj));
    return cands.indexOf(6) == -1;
})(), true);

console.log('==== 台数计算 ====');
// 清一色：全筒 + 金(中27)×2 + 花2朵 + 暗杠1个(筒5)
var sd1 = seat([0,0,0,1,1,1,2,2,2,3,3,3,4,4,27,27,8], { hua: [34,35], gangs: [{type:'an', pai:5}] });
// holds 17张: 4刻+1对+1搭(8待金补)... 直接算分即可
var r1 = zp.__calculateTai(game(27), sd1, {isZimo: true, extra: {}});
// 花2 + 金2 + 暗杠2 + 清一色3 = 9
eq('花2+金2+暗杠2+清一色3=9台', r1.tai, 9);
var r2 = zp.__calculateTai(game(27), sd1, {isZimo: true, extra: {sanJinDao: true}});
eq('三金倒额外+2=11台', r2.tai, 11);
// 封顶
var r3 = zp.__calculateTai(game(27, {maxTai: 5}), sd1, {isZimo: true, extra: {}});
eq('原始台数不受封顶影响(封顶在结算)', r3.tai >= 5, true);

console.log('==== 2人/4人实现一致性 ====');
var I4 = zp4.__internals;
eq('4人:金判定一致', I4.isWild(game(5), 29), I.isWild(game(5), 29));
eq('4人:胡结构一致', I4.checkHuStructure(cmOf([0,0,0,1,1,1,2,2,2,3,3,3,4,4,4,5,5]), 0), true);
eq('4人:2金禁点炮一致', I4.canDianPao(game(6), seat(ting5j), 5), false);
eq('4人:游金候选一致', JSON.stringify(I4.findYouJinDiscards(game(6), seat(yj))), JSON.stringify([7]));

console.log('====');
console.log('通过 ' + pass + ' / ' + (pass + fail));
process.exit(fail > 0 ? 1 : 0);
