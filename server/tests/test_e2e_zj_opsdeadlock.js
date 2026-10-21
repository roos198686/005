// 诸暨翻财神(2人) 操作未决定时器/重连补发 回归测试
// 复现并锁定“进入房间打不出牌”的两处根因：
//   1) exports.chuPai 被拒绝时不得清掉对家的操作倒计时(否则双方永久卡死)
//   2) resendGameState 必须在 game_start_push 之后补发未决操作弹窗
// 做法：mock 网络层，驱动真实 gamemgr_ldh
var roomMgr = require('../game_server/roommgr');
var userMgr = require('../game_server/usermgr');
var db = require('../utils/db');
db.create_game = function(room_uuid, index, base_info, callback){ if(callback) callback(null, {insertId: 1}); };
db.create_game_result = function(game_id, index, result, callback){ if(callback) callback(null, {}); };
db.update_game_result = function(game_id, index, result, callback){ if(callback) callback(null, {}); };
db.get_game_by_user_id = function(uid, callback){ callback(null); };
db.update_gems = function(uid, gems, callback){ if(callback) callback(null, {}); };
db.cost_gems = function(uid, cost, callback){ if(callback) callback(null, {}); };

var ROOM_ID = 'T_E2E_ZJ_OPS';
var U = [93001, 93002]; // seat0=庄

var roomInfo = {
    id: ROOM_ID,
    uuid: 'test-uuid-zj-ops',
    conf: { type: 'zj', maxTai: 10, baseScore: 1, maxGames: 4, taiRules: { chupai_timeout: 1 } },
    seats: [
        { userId: U[0], name: 'A', score: 0 },
        { userId: U[1], name: 'B', score: 0 }
    ],
    nextButton: 0,
    laozhuangCount: 0,
    numOfGames: 1
};

roomMgr.getUserRoom = function(uid){ return U.indexOf(uid) >= 0 ? ROOM_ID : null; };
roomMgr.getRoomIdOfUser = roomMgr.getUserRoom;
roomMgr.getUserSeat = function(uid){ var i = U.indexOf(uid); return i >= 0 ? i : null; };
roomMgr.getRoom = function(id){ return id == ROOM_ID ? roomInfo : null; };
roomMgr.destroy = function(){};

var inbox = {}; U.forEach(function(u){ inbox[u] = []; });
userMgr.sendMsg = function(uid, event, data){ if(inbox[uid]) inbox[uid].push({event: event, data: data}); };
userMgr.brocastInRoom = function(roomId, event, data){ U.forEach(function(u){ inbox[u].push({event: event, data: data}); }); };
userMgr.broacastInRoom = function(event, data, sender, incl){ U.forEach(function(u){ inbox[u].push({event: event, data: data}); }); };
userMgr.isOnline = function(){ return true; };
userMgr.send = function(){};
userMgr.bind = function(){};

var mgr = require('../game_server/gamemgr_ldh');

var passCount = 0, failCount = 0;
function T(name, cond, extra){
    if(cond){ passCount++; console.log('  OK  ' + name); }
    else { failCount++; console.log('  FAIL ' + name + (extra ? ' -> ' + extra : '')); }
}
function sleep(ms){ return new Promise(function(r){ setTimeout(r, ms); }); }
function clearInbox(){ U.forEach(function(u){ inbox[u] = []; }); }
function msgs(uid, event){ return inbox[uid].filter(function(m){ return m.event == event; }); }
function lastMsg(uid, event){ var m = msgs(uid, event); return m.length ? m[m.length-1].data : null; }

(async function main(){
    console.log('=== 诸暨翻财神(2人) 操作未决/重连补发 回归 ===\n');

    mgr.start(roomInfo);
    var game = mgr.__getGame(ROOM_ID);
    T('game 对象创建', !!game);
    T('2人座位', game && game.gameSeats.length == 2);

    // 选一张非财神牌做弃牌（财神打出不可碰）
    var p = -1;
    for(var i = 0; i < game.gameSeats[0].holds.length; ++i){
        var t = game.gameSeats[0].holds[i];
        if(t != game.caishen && t != game.caishen2){ p = t; break; }
    }
    T('找到可出牌(非财神)', p >= 0, 'caishen=' + game.caishen + ' caishen2=' + game.caishen2);

    // 让对家B手上恰好两张同牌 -> 出该牌必可碰
    var sdB = game.gameSeats[1];
    sdB.holds = [p, p].concat(sdB.holds.filter(function(x){ return x !== p; })).slice(0, 13);
    game.turn = 0;

    // ===== S1: 出牌触发对家操作未决 =====
    console.log('[S1] A打出B可碰的牌 -> B进入操作待选');
    clearInbox();
    mgr.chuPai(U[0], p);
    var opsB = lastMsg(U[1], 'game_action_push');
    T('B收到可碰操作 game_action_push', opsB && opsB.peng === true, JSON.stringify(opsB));
    T('B操作未决 hasOperations(seat1)=true', mgr.hasOperations(game.gameSeats[1]) === true);
    T('未决时已启动操作倒计时', !!game.turnTimeoutId);

    // ===== S2: 核心修复 —— 被拒绝的出牌不得清掉倒计时 =====
    console.log('[S2] A在B未决时再次出牌 -> 必须被拒且不得清掉倒计时');
    var timerBefore = game.turnTimeoutId;
    var holdsBefore = game.gameSeats[0].holds.slice();
    var p2 = -1;
    for(var i = 0; i < game.gameSeats[0].holds.length; ++i){
        if(game.gameSeats[0].holds[i] !== p){ p2 = game.gameSeats[0].holds[i]; break; }
    }
    clearInbox();
    mgr.chuPai(U[0], p2);
    T('出牌被拒绝:手牌张数不变', game.gameSeats[0].holds.length === holdsBefore.length,
        'before=' + holdsBefore.length + ' after=' + game.gameSeats[0].holds.length);
    T('出牌被拒绝:该牌仍在手牌中', game.gameSeats[0].holds.indexOf(p2) >= 0);
    T('被拒绝的出牌未清掉操作倒计时(核心)', !!game.turnTimeoutId && game.turnTimeoutId === timerBefore,
        'before=' + !!timerBefore + ' after=' + !!game.turnTimeoutId);

    // ===== S3: 超时自动过 -> 双方都能继续 =====
    console.log('[S3] 操作超时(chupai_timeout=1s)自动过');
    await sleep(1600);
    T('超时后B操作自动清空', mgr.hasOperations(game.gameSeats[1]) === false);
    T('超时后轮次推进到B', game.turn === 1, 'turn=' + game.turn);
    // 操作倒计时触发后会被清掉,随后摸牌/出牌链路会重新调度新的倒计时;
    // 断言旧的 timer 一定不再存活(未被残留挂在 game.turnTimeoutId 上)
    T('旧操作倒计时未残留', !game.turnTimeoutId || game.turnTimeoutId !== timerBefore,
        'timerBeforeAlive=' + (game.turnTimeoutId === timerBefore));

    var bHoldsNow = game.gameSeats[1].holds;
    var bChu = -1;
    for(var i = 0; i < bHoldsNow.length; ++i){
        if(bHoldsNow[i] != game.caishen && bHoldsNow[i] != game.caishen2){ bChu = bHoldsNow[i]; break; }
    }
    clearInbox();
    mgr.chuPai(U[1], bChu);
    T('B 超时托管后可正常出牌', game.gameSeats[1].folds.length >= 1,
        'folds=' + JSON.stringify(game.gameSeats[1].folds));

    // ===== S4: 重连补发未决操作 =====
    console.log('[S4] 重连 resendGameState: game_start_push 之后必须补发未决操作');
    var sdB2 = game.gameSeats[1];
    sdB2.canPeng = true;
    sdB2.canChi = false;
    sdB2.canGang = false;
    sdB2.canHu = false;
    game.turn = 0;
    clearInbox();
    mgr.resendGameState(ROOM_ID, U[1]);
    var seq = inbox[U[1]];
    var iStart = -1, iAction = -1;
    for(var i = 0; i < seq.length; ++i){
        if(seq[i].event == 'game_start_push' && iStart < 0) iStart = i;
        if(seq[i].event == 'game_action_push' && iAction < 0) iAction = i;
    }
    T('重连补发了 game_start_push', iStart >= 0);
    T('重连补发了 game_action_push(未决操作)', iAction >= 0);
    T('补发顺序正确: game_start_push 在 game_action_push 之前', iStart >= 0 && iAction > iStart,
        'start=' + iStart + ' action=' + iAction);
    T('重连后重新起算操作倒计时', !!game.turnTimeoutId);

    console.log('\n=== 结果: 通过 ' + passCount + ' / 失败 ' + failCount + ' ===');
    process.exit(failCount > 0 ? 1 : 0);
})();
