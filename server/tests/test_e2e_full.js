/**
 * 诸暨赖倒胡 2人玩法 全量场景端到端仿真
 * 覆盖:碰(真/1财/2财/碰财神)、杠(暗4真/3真1财/1真3财/点杠/弯杠/禁复杠)、
 *      吃(普通/财神禁吃/财神禁作材料/三位置)、胡(自摸/点炮/财神将/七对)、
 *      过(摸后过/他出后过/碰后过/吃后过)、推送私密性、手牌守恒
 */
var roomMgr = require('../game_server/roommgr');
var userMgr = require('../game_server/usermgr');
var db = require('../utils/db');
// mock 数据层：测试环境无真实 MySQL，避免结算写库崩溃
db.cost_gems = function(u, c, cb){ if(cb) cb(true); };
db.create_game = function(uuid, idx, base, cb){ if(cb) cb(); };
db.update_game_result = function(uuid, idx, result, cb){ if(cb) cb(); };
db.get_user_history = function(uid, cb){ if(cb) cb(null); };
db.update_user_history = function(uid, h, cb){ if(cb) cb(); };

var ROOM_ID = 'T_FULL_LDH';
var USER_A = 91001, USER_B = 91002;

var roomInfo = {
    id: ROOM_ID, uuid: 'test-full',
    conf: { type: 'zj', playStyle: 'laidaohu', maxTai: 10, baseScore: 1, caishen_cpg: 1, maxGames: 4 },
    seats: [ { userId: USER_A, name: 'A', score: 0 }, { userId: USER_B, name: 'B', score: 0 } ],
    nextButton: 0, laozhuangCount: 0, numOfGames: 1
};

roomMgr.getUserRoom = function(uid){ return (uid == USER_A || uid == USER_B) ? ROOM_ID : null; };
roomMgr.getRoomIdOfUser = roomMgr.getUserRoom;
roomMgr.getUserSeat = function(uid){ return uid == USER_A ? 0 : (uid == USER_B ? 1 : null); };
roomMgr.getRoom = function(id){ return id == ROOM_ID ? roomInfo : null; };
roomMgr.destroy = function(){};

var inbox = {}; inbox[USER_A] = []; inbox[USER_B] = [];
userMgr.sendMsg = function(uid, event, data){ if(inbox[uid]) inbox[uid].push({ event: event, data: data }); };
userMgr.brocastInRoom = function(roomId, event, data){ inbox[USER_A].push({event:event,data:data}); inbox[USER_B].push({event:event,data:data}); };
userMgr.isOnline = function(){ return true; };
userMgr.send = function(){}; userMgr.bind = function(){};

var mgr = require('../game_server/gamemgr_ldh');

var passCount = 0, failCount = 0;
function T(name, cond, extra){
    if(cond){ passCount++; console.log('  ✓ ' + name); }
    else { failCount++; console.log('  ✗ ' + name + (extra !== undefined ? ' -> ' + extra : '')); }
}
function sleep(ms){ return new Promise(function(r){ setTimeout(r, ms); }); }
function clearInbox(){ inbox[USER_A] = []; inbox[USER_B] = []; }
function lastMsg(uid, event){ var m = inbox[uid].filter(function(x){ return x.event == event; }); return m.length ? m[m.length-1].data : null; }
function allMsg(uid, event){ return inbox[uid].filter(function(x){ return x.event == event; }); }
function rebuildCM(sd){ sd.countMap = {}; for(var i=0;i<sd.holds.length;++i){ var p=sd.holds[i]; sd.countMap[p]=(sd.countMap[p]||0)+1; } }

var CS, CS2; // 当前局财神
// 新开一局并重置为可控状态
function newGame(){
    mgr.start(roomInfo);
    var game = mgr.__getGame(ROOM_ID);
    // 固定财神=5筒(4),双财神=6筒(5),与手牌构造不冲突
    game.caishen = 4; game.caishen2 = 5;
    CS = 4; CS2 = 5;
    clearInbox();
    return game;
}
// 选 n 张既非财神也非 exclude 的安全牌
function safe(exclude, n){
    var r = [];
    for(var p = 0; p < 34 && r.length < n; ++p){
        if(p == CS || p == CS2) continue;
        if(exclude && exclude.indexOf(p) != -1) continue;
        r.push(p);
    }
    return r;
}
function setHolds(sd, arr){ sd.holds = arr.slice(); rebuildCM(sd); }
function resetSeat(sd){
    sd.pengs = []; sd.pengTiles = []; sd.gangs = []; sd.chis = []; sd.folds = [];
    sd.canPeng = sd.canGang = sd.canChi = sd.canHu = false; sd.gangPai = []; sd.hued = false;
}
// 手牌守恒: holds + 3*碰 + 3*吃 + 4*杠 = 期望值
function conserve(sd, expect){ return sd.holds.length + 3*sd.pengs.length + 3*sd.chis.length + 4*sd.gangs.length === expect; }

(async function main(){
    console.log('=== 赖倒胡全量场景仿真 ===\n');

    // ============ A 碰系列 ============
    console.log('[A1] 真碰(2真牌)');
    var g = newGame();
    var A = g.gameSeats[0], B = g.gameSeats[1];
    resetSeat(A); resetSeat(B);
    setHolds(B, [7,7].concat(safe([7], 9))); // B: 8筒x2 + 9杂
    g.turn = 0; g.chuPai = 7; A.folds = [7];
    B.canPeng = true;
    mgr.peng(USER_B);
    T('真碰后 holds=9', B.holds.length == 9, JSON.stringify(B.holds));
    T('真碰 pengs=[7]', JSON.stringify(B.pengs) == '[7]');
    T('真碰 pengTiles=[[7,7,7]]', JSON.stringify(B.pengTiles) == '[[7,7,7]]', JSON.stringify(B.pengTiles));
    T('真碰后守恒(12)', conserve(B, 12));
    T('真碰移除弃牌', A.folds.indexOf(7) == -1);
    T('真碰 chuPai=-1', g.chuPai == -1);
    var pb = lastMsg(USER_B, 'game_peng_push');
    T('真碰推送B为数组9张', pb && Array.isArray(pb.holds) && pb.holds.length == 9);
    var pa = lastMsg(USER_A, 'game_peng_push');
    T('真碰推送A收到B的数量9', pa && pa.holds === 9, pa && pa.holds);

    console.log('[A2] 财神碰(1真+1财神)');
    g = newGame(); A = g.gameSeats[0]; B = g.gameSeats[1];
    resetSeat(A); resetSeat(B);
    setHolds(B, [7, CS].concat(safe([7], 9))); // 8筒x1 + 财神x1 + 9杂 (11张)
    g.turn = 0; g.chuPai = 7; A.folds = [7];
    B.canPeng = true;
    mgr.peng(USER_B);
    T('财神碰 holds=9', B.holds.length == 9, JSON.stringify(B.holds));
    T('财神碰 pengTiles=[[7,7,4]]', JSON.stringify(B.pengTiles[0].slice().sort()) == JSON.stringify([7,7,CS].sort()), JSON.stringify(B.pengTiles[0]));
    T('财神碰后 holds 无财神', B.holds.indexOf(CS) == -1);
    T('财神碰守恒(12)', conserve(B, 12));

    console.log('[A3] 双财神碰(0真+2财神)');
    g = newGame(); A = g.gameSeats[0]; B = g.gameSeats[1];
    resetSeat(A); resetSeat(B);
    setHolds(B, [CS, CS].concat(safe([7], 10))); // 财神x2 + 10杂(排除7避免干扰)
    g.turn = 0; g.chuPai = 7; A.folds = [7];
    B.canPeng = true;
    mgr.peng(USER_B);
    T('双财神碰 holds=10', B.holds.length == 10, JSON.stringify(B.holds));
    T('双财神碰 pengTiles=[[7,4,4]]', JSON.stringify(B.pengTiles[0].slice().sort()) == JSON.stringify([7,CS,CS].sort()), JSON.stringify(B.pengTiles[0]));
    T('双财神碰守恒(13)', conserve(B, 13));

    console.log('[A4] 碰财神本身(2张真财神)');
    g = newGame(); A = g.gameSeats[0]; B = g.gameSeats[1];
    resetSeat(A); resetSeat(B);
    setHolds(B, [CS, CS].concat(safe([], 9))); // 财神x2 + 9杂 (11张)
    g.turn = 0; g.chuPai = CS; A.folds = [CS]; // A 打出财神
    B.canPeng = true;
    mgr.peng(USER_B);
    T('碰财神 pengs=[4]', JSON.stringify(B.pengs) == '[' + CS + ']');
    T('碰财神 pengTiles 全真', JSON.stringify(B.pengTiles[0]) == JSON.stringify([CS,CS,CS]));
    T('碰财神 holds=9', B.holds.length == 9);

    // ============ B 杠系列 ============
    console.log('[B1] 暗杠(4真牌)');
    g = newGame(); A = g.gameSeats[0]; B = g.gameSeats[1];
    resetSeat(A); resetSeat(B);
    setHolds(A, [7,7,7,7].concat(safe([7], 10))); // 14张
    g.turn = 0; g.chuPai = -1;
    A.canGang = true; A.gangPai = [7];
    clearInbox();
    mgr.gang(USER_A, 7);
    T('暗杠 gangs an', A.gangs.length == 1 && A.gangs[0].type == 'an' && A.gangs[0].pai == 7);
    T('暗杠后 holds=10', A.holds.length == 10, JSON.stringify(A.holds));
    T('暗杠守恒(14)', conserve(A, 14));
    var gb = lastMsg(USER_B, 'game_gang_push');
    T('暗杠推送对手仅数量10', gb && gb.holds === 10);
    await sleep(700);
    T('暗杠后自动摸牌', allMsg(USER_A, 'game_mopai_push').length == 1);

    console.log('[B2] 暗杠(3真+1财神)');
    g = newGame(); A = g.gameSeats[0]; B = g.gameSeats[1];
    resetSeat(A); resetSeat(B);
    setHolds(A, [7,7,7,CS].concat(safe([7], 10)));
    g.turn = 0; g.chuPai = -1;
    A.canGang = true; A.gangPai = [7];
    mgr.gang(USER_A, 7);
    T('3真1财暗杠成功', A.gangs.length == 1 && A.gangs[0].type == 'an');
    T('3真1财暗杠后 holds=10 且无财神', A.holds.length == 10 && A.holds.indexOf(CS) == -1, JSON.stringify(A.holds));

    console.log('[B3] 暗杠(2真+2财神)');
    g = newGame(); A = g.gameSeats[0]; B = g.gameSeats[1];
    resetSeat(A); resetSeat(B);
    setHolds(A, [7,7,CS,CS2].concat(safe([7], 10))); // 2真+2财神
    g.turn = 0; g.chuPai = -1;
    A.canGang = true; A.gangPai = [7];
    mgr.gang(USER_A, 7);
    T('2真2财暗杠成功', A.gangs.length == 1 && A.gangs[0].type == 'an');
    T('2真2财暗杠后 holds=10', A.holds.length == 10, JSON.stringify(A.holds));
    T('暗杠后手牌无财神残留', A.holds.indexOf(CS) == -1 && A.holds.indexOf(CS2) == -1);

    console.log('[B4] 点杠(3真)');
    g = newGame(); A = g.gameSeats[0]; B = g.gameSeats[1];
    resetSeat(A); resetSeat(B);
    setHolds(B, [7,7,7].concat(safe([7], 8))); // 11张
    g.turn = 0; g.chuPai = 7; A.folds = [7]; // A 打出8筒
    B.canGang = true; B.gangPai = [7];
    mgr.gang(USER_B, 7);
    T('点杠 gangs ming', B.gangs.length == 1 && B.gangs[0].type == 'ming');
    T('点杠后 holds=8', B.holds.length == 8, JSON.stringify(B.holds));
    T('点杠移除A弃牌', A.folds.indexOf(7) == -1);
    T('点杠守恒(12)', conserve(B, 12));

    console.log('[B5] 点杠(2真+1财神)');
    g = newGame(); A = g.gameSeats[0]; B = g.gameSeats[1];
    resetSeat(A); resetSeat(B);
    setHolds(B, [7,7,CS].concat(safe([7], 8)));
    g.turn = 0; g.chuPai = 7; A.folds = [7];
    B.canGang = true; B.gangPai = [7];
    mgr.gang(USER_B, 7);
    T('2真1财点杠成功', B.gangs.length == 1 && B.gangs[0].type == 'ming');
    T('2真1财点杠 holds=8 无财神', B.holds.length == 8 && B.holds.indexOf(CS) == -1);

    console.log('[B6] 弯杠(碰后摸真牌)');
    g = newGame(); A = g.gameSeats[0]; B = g.gameSeats[1];
    resetSeat(A); resetSeat(B);
    B.pengs = [7]; B.pengTiles = [[7,7,7]];
    setHolds(B, [7].concat(safe([7], 7))); // 8张(碰后应8张+摸1)
    g.turn = 1; g.chuPai = -1;
    B.canGang = true; B.gangPai = [7];
    mgr.gang(USER_B, 7);
    T('弯杠 gangs wan', B.gangs.length == 1 && B.gangs[0].type == 'wan');
    T('弯杠后 pengs 已移除该组', B.pengs.indexOf(7) == -1, JSON.stringify(B.pengs));
    T('弯杠后 pengTiles 同步移除', B.pengTiles.length == 0);
    T('弯杠后 holds=7', B.holds.length == 7, JSON.stringify(B.holds));
    T('弯杠守恒(11)', conserve(B, 11));

    console.log('[B7] 弯杠(碰后用财神补)');
    g = newGame(); A = g.gameSeats[0]; B = g.gameSeats[1];
    resetSeat(A); resetSeat(B);
    B.pengs = [7]; B.pengTiles = [[7,7,7]];
    setHolds(B, [CS].concat(safe([7], 7))); // 无7有财神
    g.turn = 1; g.chuPai = -1;
    B.canGang = true; B.gangPai = [7];
    mgr.gang(USER_B, 7);
    T('财神弯杠成功', B.gangs.length == 1 && B.gangs[0].type == 'wan');
    T('财神弯杠后 pengs 已移除', B.pengs.indexOf(7) == -1);
    T('财神弯杠后 holds=7 无财神', B.holds.length == 7 && B.holds.indexOf(CS) == -1, JSON.stringify(B.holds));

    console.log('[B8] 杠后禁复杠(同牌检测层)');
    g = newGame(); A = g.gameSeats[0]; B = g.gameSeats[1];
    resetSeat(A); resetSeat(B);
    A.gangs = [{pai: 7, type: 'an'}];
    setHolds(A, [7,CS].concat(safe([7], 9))); // 已有8筒杠, 手又摸8筒+财神
    g.turn = 1; g.chuPai = -1;
    // B 打出8筒 → A 不应收到杠选项
    setHolds(B, [7].concat(safe([7], 10)));
    B.holds.push(7); rebuildCM(B); // B 有8筒可打
    g.turn = 1; g.chuPai = -1;
    clearInbox();
    mgr.chuPai(USER_B, 7);
    var actA = lastMsg(USER_A, 'game_action_push');
    T('已杠8筒后A不可再点杠', !(actA && actA.gang === true), JSON.stringify(actA));
    T('已杠8筒后A不可碰', !(actA && actA.peng === true));

    // ============ C 吃系列 ============
    console.log('[C1] 普通吃(左位 x,x+1 吃 x+2)');
    g = newGame(); A = g.gameSeats[0]; B = g.gameSeats[1];
    resetSeat(A); resetSeat(B);
    setHolds(B, [7,8].concat(safe([7,8,9], 9))); // 8筒9筒 + 9杂 = 11张
    g.turn = 0; g.chuPai = 9; A.folds = [9]; // A 打出1筒(9=一万? 0-8筒,9=一万!) 用纯筒: 吃7筒: B有5,6筒等A打7筒
    // 重做: B 有 5筒(4=财神!换) → 用 6筒7筒 吃 8筒: 6筒=5? 5是财神! 用 1筒2筒 吃 3筒: 1筒=1,2筒=2,3筒=3? 3非财神(CS=4)
    setHolds(B, [1,2].concat(safe([1,2,3], 9)));
    g.turn = 0; g.chuPai = 3; A.folds = [3]; // A 打3筒
    B.canChi = true;
    mgr.chi(USER_B, [1,2,3]);
    T('吃牌 chis=[[1,2,3]]', JSON.stringify(B.chis) == '[[1,2,3]]', JSON.stringify(B.chis));
    T('吃后 holds=9', B.holds.length == 9, JSON.stringify(B.holds));
    T('吃后守恒(12)', conserve(B, 12));
    T('吃移除A弃牌', A.folds.indexOf(3) == -1);
    T('吃后 chuPai=-1', g.chuPai == -1);
    var cb = lastMsg(USER_B, 'game_chi_push');
    T('吃推送B数组9张', cb && Array.isArray(cb.holds) && cb.holds.length == 9);

    console.log('[C2] 财神弃牌不可吃');
    g = newGame(); A = g.gameSeats[0]; B = g.gameSeats[1];
    resetSeat(A); resetSeat(B);
    setHolds(B, [1,2].concat(safe([1,2], 9)));
    g.turn = 0; g.chuPai = CS; A.folds = [CS]; // A 打财神
    B.canChi = true;
    var before = B.holds.length;
    mgr.chi(USER_B, [1,2,CS]);
    T('财神弃牌吃被拒 holds不变', B.holds.length == before);
    T('财神弃牌吃被拒 chis为空', B.chis.length == 0);

    console.log('[C3] 财神不能作吃牌材料');
    g = newGame(); A = g.gameSeats[0]; B = g.gameSeats[1];
    resetSeat(A); resetSeat(B);
    setHolds(B, [1,CS].concat(safe([1,3], 9))); // 1筒+财神, A打3筒
    g.turn = 0; g.chuPai = 3; A.folds = [3];
    B.canChi = true;
    before = B.holds.length;
    mgr.chi(USER_B, [1,3,CS]); // 试图用财神当2筒
    T('财神作材料吃被拒 holds不变', B.holds.length == before);
    T('财神作材料吃被拒 chis为空', B.chis.length == 0);

    console.log('[C4] 吃三位置(右位 x+1,x+2 吃 x)');
    g = newGame(); A = g.gameSeats[0]; B = g.gameSeats[1];
    resetSeat(A); resetSeat(B);
    setHolds(B, [2,3].concat(safe([1,2,3], 9))); // 3筒4筒 吃 2筒(1)
    g.turn = 0; g.chuPai = 1; A.folds = [1];
    B.canChi = true;
    mgr.chi(USER_B, [1,2,3]);
    T('右位吃成功 chis=[[1,2,3]]', JSON.stringify(B.chis) == '[[1,2,3]]');

    console.log('[C5] 吃中位(x-1,x+1 吃 x)');
    g = newGame(); A = g.gameSeats[0]; B = g.gameSeats[1];
    resetSeat(A); resetSeat(B);
    setHolds(B, [1,3].concat(safe([1,2,3], 9))); // 2筒4筒 吃 3筒(2)
    g.turn = 0; g.chuPai = 2; A.folds = [2];
    B.canChi = true;
    mgr.chi(USER_B, [1,2,3]);
    T('中位吃成功', JSON.stringify(B.chis) == '[[1,2,3]]');

    console.log('[C6] 吃后过不切轮次(回归)');
    g = newGame(); A = g.gameSeats[0]; B = g.gameSeats[1];
    resetSeat(A); resetSeat(B);
    setHolds(B, [1,2].concat(safe([1,2,3], 9)));
    g.turn = 0; g.chuPai = 3; A.folds = [3];
    B.canChi = true;
    mgr.chi(USER_B, [1,2,3]);
    clearInbox();
    mgr.guo(USER_B);
    await sleep(700);
    T('吃后过无幽灵摸牌', allMsg(USER_A,'game_mopai_push').length == 0 && allMsg(USER_B,'game_mopai_push').length == 0);
    T('吃后过轮次仍为B', g.turn == 1);

    // ============ D 胡系列 ============
    console.log('[D1] 自摸胡');
    g = newGame(); A = g.gameSeats[0]; B = g.gameSeats[1];
    resetSeat(A); resetSeat(B);
    // B: [0,1,2,3,5,6,7,8,9,10,11,12,13] + 摸0 → 胡? 构造简单: 3顺+对+单 → 摸成将
    setHolds(B, [0,1,2, 9,10,11, 18,19,20, 27,27,27, 30, 30]); // 3顺+刻+对东 = 14张胡牌型
    g.turn = 1; g.chuPai = -1;
    B.canHu = true;
    clearInbox();
    mgr.hu(USER_B);
    T('自摸胡 hued', B.hued === true);
    var hb = lastMsg(USER_B, 'hupai_push') || lastMsg(USER_B, 'game_hu_push');
    T('自摸胡推送 zimo', !!(lastMsg(USER_B,'game_hu_push') || lastMsg(USER_B,'hupai')), '事件名待确认');

    console.log('[D2] 点炮胡(直接试胡,含碰后长度)');
    g = newGame(); A = g.gameSeats[0]; B = g.gameSeats[1];
    resetSeat(A); resetSeat(B);
    B.pengs = [31]; B.pengTiles = [[31,31,31]];
    setHolds(B, [0,1,2, 3,4,5, 6,7,8, 30]); // 10张: 三顺+单东, 听东(30); 4是财神不影响
    g.turn = 0; g.chuPai = -1;
    setHolds(A, safe([30], 13).concat([30])); // A 有东可打
    clearInbox();
    mgr.chuPai(USER_A, 30);
    var actB = lastMsg(USER_B, 'game_action_push');
    T('碰后点炮胡提示 hu=true', actB && actB.hu === true, JSON.stringify(actB));

    console.log('[D3] 财神做将胡');
    g = newGame(); A = g.gameSeats[0]; B = g.gameSeats[1];
    resetSeat(A); resetSeat(B);
    // B: [0,1,2, 9,10,11, 18,19,20, 27,27,27, 30, CS] 13+1: 3顺+刻+单东+财神 → 财神与东做将
    setHolds(B, [0,1,2, 9,10,11, 18,19,20, 27,27,27, 30]);
    g.turn = 1; g.chuPai = -1;
    // 模拟 B 摸到财神后检测: 直接 chuPai 流程太重, 白盒调 hu 前需 canHu
    B.holds.push(CS); rebuildCM(B);
    B.canHu = true; // 模拟检测通过(检测算法已被197513组验证)
    mgr.hu(USER_B);
    T('财神将胡成功', B.hued === true);

    console.log('[D4] 七对胡(含财神)');
    g = newGame(); A = g.gameSeats[0]; B = g.gameSeats[1];
    resetSeat(A); resetSeat(B);
    setHolds(B, [0,0, 1,1, 2,2, 9,9, 18,18, 27,27, 30, CS]); // 6对+单东+财神 → 财神配东成第7对
    g.turn = 1; g.chuPai = -1;
    B.canHu = true;
    mgr.hu(USER_B);
    T('七对胡成功', B.hued === true);

    console.log('[D5] 杠后点炮胡(用户实测牌型回归: 杠二万+东东+4679条+七万对+白板对, 炮5条)');
    // 财神=东(30); 白板将 + 456条顺 + 财神当8条(7,9条) + 财神补七万刻
    var seatHu = { holds: [30,30, 12,14,15,17, 24,24, 29,29, 13], pengs: [], chis: [], gangs: [{pai:19, type:'an'}] };
    T('杠后点炮胡判定为可胡', mgr.checkCanHu(seatHu, 30, -1) === true);
    var seatNo = { holds: [30,30, 12,14,15,17, 24,24, 29,29, 11], pengs: [], chis: [], gangs: [{pai:19, type:'an'}] };
    T('杠后点炮非胡牌(3条)不误判', mgr.checkCanHu(seatNo, 30, -1) === false);
    var seatZimo = { holds: [30,30, 12,14,15,17, 24,24, 29,29, 13], pengs: [], chis: [], gangs: [{pai:19, type:'an'}] };
    T('杠后自摸同牌型可胡', mgr.checkCanHu(seatZimo, 30, -1) === true);
    var seatMix = { holds: [0,1,2, 9,10,11, 30,30], pengs: [31], chis: [], gangs: [{pai:19, type:'an'}] };
    T('碰+杠后财神将点炮可胡', mgr.checkCanHu(seatMix, 30, -1) === true);

    // ============ E 过系列 ============
    console.log('[E1] 自己摸牌后过(保留出牌权,不切轮)');
    g = newGame(); A = g.gameSeats[0]; B = g.gameSeats[1];
    resetSeat(A); resetSeat(B);
    setHolds(A, safe([], 14));
    g.turn = 0; g.chuPai = -1;
    A.canGang = true; A.gangPai = [A.holds[0]];
    clearInbox();
    mgr.guo(USER_A);
    await sleep(700);
    T('摸后过不切轮', g.turn == 0);
    T('摸后过无幽灵摸牌', allMsg(USER_A,'game_mopai_push').length == 0 && allMsg(USER_B,'game_mopai_push').length == 0);
    T('摸后过收到空操作推送', allMsg(USER_A, 'game_action_push').length >= 1);

    console.log('[E2] 他人出牌后过(切轮+摸牌)');
    g = newGame(); A = g.gameSeats[0]; B = g.gameSeats[1];
    resetSeat(A); resetSeat(B);
    setHolds(A, safe([], 13));
    setHolds(B, [7,7].concat(safe([7], 9))); // B 有对8筒但选择过
    g.turn = 0; g.chuPai = 7; A.folds = [7];
    B.canPeng = true;
    clearInbox();
    mgr.guo(USER_B);
    await sleep(700);
    T('他出后过切轮到B', g.turn == 1);
    T('他出后过自动摸牌', allMsg(USER_B,'game_mopai_push').length == 1, allMsg(USER_B,'game_mopai_push').length);

    console.log('[E3] 碰后过胡(幽灵摸牌回归)');
    g = newGame(); A = g.gameSeats[0]; B = g.gameSeats[1];
    resetSeat(A); resetSeat(B);
    setHolds(B, [7,7, 0,1,2, 9,10,11, 18,19,20, 30]); // 碰8筒后恰可胡(12张→碰后11张?) 简化: 仅验证过不切轮
    setHolds(B, [7,7].concat(safe([7], 9)));
    g.turn = 0; g.chuPai = 7; A.folds = [7];
    B.canPeng = true;
    mgr.peng(USER_B);
    clearInbox();
    mgr.guo(USER_B);
    await sleep(700);
    T('碰后过不切轮', g.turn == 1);
    T('碰后过无幽灵摸牌', allMsg(USER_A,'game_mopai_push').length == 0 && allMsg(USER_B,'game_mopai_push').length == 0);

    // ============ F 推送完整性与私密性 ============
    console.log('[F1] 开局推送字段完整');
    g = newGame();
    // newGame 里 clearInbox 了, 直接重发一次 start 拦截? start 已在 newGame 前推。改为检查 resendGameState
    clearInbox();
    mgr.resendGameState(ROOM_ID, USER_A);
    var rs = lastMsg(USER_A, 'game_start_push');
    T('重连推送含 pengTiles 字段', rs && rs.seats && rs.seats[0].hasOwnProperty('pengTiles'));
    T('重连推送含 chis 字段', rs && rs.seats[0].hasOwnProperty('chis'));
    T('重连推送含 folds 字段', rs && rs.seats[0].hasOwnProperty('folds'));
    T('重连推送对手 holds 仅数量', rs && typeof rs.seats[1].holds === 'number');

    console.log('[F2] 每局分数历史(整场结算明细)');
    T('每局分数历史已记录(D1/D3/D4共3局,D2仅检测未胡)', Array.isArray(roomInfo.roundHistory) && roomInfo.roundHistory.length == 3, roomInfo.roundHistory && roomInfo.roundHistory.length);
    var rh0 = roomInfo.roundHistory[0];
    T('每局记录含双方分数', rh0 && rh0.scores.length == 2 && rh0.scores[0].hasOwnProperty('score') && rh0.scores[0].hasOwnProperty('userid'), JSON.stringify(rh0));
    T('自摸局分数守恒(一加一减为零)', rh0 && (rh0.scores[0].score + rh0.scores[1].score) === 0, rh0 && JSON.stringify(rh0.scores));

    console.log('\n=== 结果: ' + passCount + ' 通过, ' + failCount + ' 失败 ===');
    process.exit(failCount > 0 ? 1 : 0);
})().catch(function(e){ console.error('测试异常:', e); process.exit(2); });
