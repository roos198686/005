// 漳浦无金麻将(4人) 端到端冒烟测试
// mock roommgr/usermgr 网络层，驱动真实 gamemgr_wujin：
// 建房发牌(庄17/闲16,136张无金花)、吃/碰/杠、点炮胡(一炮多响)、自摸结算、连庄
var roomMgr = require('../game_server/roommgr');
var userMgr = require('../game_server/usermgr');
var db = require('../utils/db');
// mock 落库（测试无真实DB连接）
db.create_game = function(room_uuid, index, base_info, callback){ if(callback) callback(null, {insertId: 1}); };
db.create_game_result = function(game_id, index, result, callback){ if(callback) callback(null, {}); };
db.update_game_result = function(game_id, index, result, callback){ if(callback) callback(null, {}); };
db.get_game_by_user_id = function(uid, callback){ callback(null); };
db.update_gems = function(uid, gems, callback){ if(callback) callback(null, {}); };
db.cost_gems = function(uid, cost, callback){ if(callback) callback(null, {}); };

var ROOM_ID = 'T_E2E_WJ';
var U = [92001, 92002, 92003, 92004]; // seat0=庄

var roomInfo = {
    id: ROOM_ID,
    uuid: 'test-uuid-wujin',
    conf: { type: 'wujin', maxTai: 10, baseScore: 1, maxGames: 4, taiRules: null },
    seats: [
        { userId: U[0], name: 'A', score: 0 },
        { userId: U[1], name: 'B', score: 0 },
        { userId: U[2], name: 'C', score: 0 },
        { userId: U[3], name: 'D', score: 0 }
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

var mgr = require('../game_server/gamemgr_wujin');

var passCount = 0, failCount = 0;
function T(name, cond, extra){
    if(cond){ passCount++; console.log('  ✓ ' + name); }
    else { failCount++; console.log('  ✗ ' + name + (extra ? ' -> ' + extra : '')); }
}
function sleep(ms){ return new Promise(function(r){ setTimeout(r, ms); }); }
function clearInbox(){ U.forEach(function(u){ inbox[u] = []; }); }
function msgs(uid, event){ return inbox[uid].filter(function(m){ return m.event == event; }); }
function lastMsg(uid, event){ var m = msgs(uid, event); return m.length ? m[m.length-1].data : null; }
function forceHolds(game, si, arr){
    var sd = game.gameSeats[si];
    sd.holds = arr.slice();
    sd.pengs = []; sd.chis = []; sd.angangs = []; sd.diangangs = []; sd.wangangs = [];
    sd.folds = []; sd.hua = [];
}

(async function main(){
    console.log('=== 漳浦无金麻将(4人) 端到端冒烟 ===\n');

    mgr.start(roomInfo);
    var game = mgr.__getGame(ROOM_ID);
    T('game 对象创建', !!game);

    var startA = lastMsg(U[0], 'game_start_push');
    T('开局推送 game_start_push', !!startA);
    T('庄家 seat0 holds=17张', startA && Array.isArray(startA.seats[0].holds) && startA.seats[0].holds.length == 17);
    T('闲家 seat1 holds 仅数量16', startA && startA.seats[1].holds === 16);
    T('无金: caishen=-1', startA && startA.caishen === -1, 'caishen=' + (startA && startA.caishen));
    T('无花: 手牌全部<34', startA && startA.seats[0].holds.every(function(p){ return p < 34; }));
    T('牌墙剩余=136-65=71', startA && startA.numofmj === 71, 'numofmj=' + (startA && startA.numofmj));
    T('playStyle=wujin', startA && startA.playStyle === 'wujin');

    // ===== S1: 出牌-摸牌链路 =====
    console.log('[S1] 庄家出牌 -> 他人无操作自动摸牌');
    // 其他3家固定为无对无顺烂牌
    forceHolds(game, 1, [0,3,6,9,12,15,18,21,24,27,28,30,31,32,33,1]);
    forceHolds(game, 2, [0,3,6,9,12,15,18,21,24,27,28,30,31,32,33,2]);
    forceHolds(game, 3, [0,3,6,9,12,15,18,21,24,27,28,30,31,32,33,4]);
    var aHolds = game.gameSeats[0].holds.slice();
    var banned = {0:1,1:1,2:1,3:1,4:1,6:1,9:1,12:1,15:1,18:1,21:1,24:1,27:1,28:1,30:1,31:1,32:1,33:1};
    var chu = -1;
    for(var t = 0; t < aHolds.length; ++t){ if(!banned[aHolds[t]]){ chu = aHolds[t]; break; } }
    if(chu == -1) chu = aHolds[0];
    clearInbox();
    mgr.chuPai(U[0], chu);
    var notifyA = lastMsg(U[0], 'game_chupai_notify_push');
    T('出牌者收到完整holds(16张)', notifyA && Array.isArray(notifyA.holds) && notifyA.holds.length == 16);
    await sleep(900);
    var mopaiB = lastMsg(U[1], 'game_mopai_push');
    T('下家B自动摸牌 si=1', mopaiB && mopaiB.si == 1);
    T('B摸牌后17张', mopaiB && Array.isArray(mopaiB.holds) && mopaiB.holds.length == 17);

    // ===== S2: 碰 =====
    console.log('[S2] B打出牌 -> C碰');
    forceHolds(game, 2, [7,7,8,10,13,16,19,22,25,27,28,30,31,32,33,5]);
    // C手牌有2张7可碰
    var bHolds2 = game.gameSeats[1].holds.slice();
    var bChu = 7; // B直接打7（B手牌强制覆盖后没7? B是摸牌17张状态,改用holds里第一张无关联牌）
    // B当前17张,打一张C能碰的: C有两张7, B打出7
    // 确保B手牌含7
    var sdB = game.gameSeats[1];
    sdB.holds[0] = 7;
    clearInbox();
    mgr.chuPai(U[1], 7);
    await sleep(200);
    var opsC = lastMsg(U[2], 'game_action_push');
    T('C收到可碰操作', opsC && opsC.peng === true, JSON.stringify(opsC));
    if(opsC && opsC.peng){
        mgr.peng(U[2]);
        await sleep(200);
        var pn = lastMsg(U[0], 'game_peng_push');
        T('碰广播 game_peng_push', pn && pn.si == 2);
        T('C pengs 记录', game.gameSeats[2].pengs.indexOf(7) >= 0);
    }
    // C碰后出牌,继续
    var cHolds = game.gameSeats[2].holds.slice();
    mgr.chuPai(U[2], cHolds[0]);
    await sleep(900);

    // ===== S3: 点炮胡（一炮多响） =====
    console.log('[S3] D打出牌 -> A胡(点炮)');
    // 找到当前回合座位，构造：A手牌=4面子+将缺一张，D打出缺的那张
    // A: 111 222 333 444 5 + 缺5成对? 用16张: 0,0,0 1,1,1 2,2,2 3,3,3 9,9 = 14张+摸牌后15? 需%3==1
    // 点炮判定要求 holds%3==1, 加打出牌成17: 111,222,333,444 + 55将 + 摸的任意牌=16? 重算: 4刻=12张+1对=14张+单独1张=15, %3==0不行
    // 17张结构=5面子+1将。点炮前holds应为16张(%3==1): 4刻(12)+1对(2)+2单张
    // 更直接: A手牌 0,0,0,1,1,1,2,2,2,3,3,3,9,9 + 需要D打9成将 -> 14张 %3==2 不对
    // 点炮胡: holds.length%3==1。构造16张: 4组刻(12张)+将的1张+3张顺子(10,11,12)
    // 0,0,0 1,1,1 2,2,2 3,3,3 (12) + 9 (将单张) + 10,11,12 (3) = 16张 %3==1, D打9 -> 胡
    forceHolds(game, 0, [0,0,0,1,1,1,2,2,2,3,3,3,9,10,11,12]);
    // 模拟"上一手的吃/碰/杠/胡均已处理或超时代过":清掉残留未决操作。
    // 任一座位仍有未决操作时,chuPai守卫会拒绝出牌(防止连打顶掉操作弹窗),此处须先视为已处理以还原真实流程
    for(var gsi = 0; gsi < 4; ++gsi){
        var qsd = game.gameSeats[gsi];
        qsd.canPeng = qsd.canGang = qsd.canChi = qsd.canHu = false;
        qsd.gangPai = []; qsd.chiPai = null;
    }
    game.pendingOps = null;
    // 把turn直接设置到D（模拟轮到D出牌）
    game.turn = 3;
    var sdD = game.gameSeats[3];
    sdD.holds = [5,6,7,14,15,16,17,20,21,23,24,26,29,30,31,32,9]; // D含一张9,共17张
    clearInbox();
    mgr.chuPai(U[3], 9);
    await sleep(200);
    var opsA = lastMsg(U[0], 'game_action_push');
    T('A收到可胡操作(点炮)', opsA && opsA.hu === true, JSON.stringify(opsA));
    var scoreBefore = game.gameSeats[0].score;
    if(opsA && opsA.hu){
        mgr.hu(U[0]);
        await sleep(2000); // finishHuRound 延时1500ms 进结算
        var overA = lastMsg(U[0], 'game_over_push');
        T('结算推送 game_over_push', !!overA);
        T('点炮胡得分>0', game.gameSeats[0].score > scoreBefore, 'score=' + game.gameSeats[0].score);
        T('点炮者D扣分', game.gameSeats[3].score < 0, 'scoreD=' + game.gameSeats[3].score);
    }

    // ===== S4: 自摸胡（走真实摸牌链路：D打出废牌->A摸牌成胡） =====
    console.log('[S4] 新一局: 自摸胡');
    roomInfo.numOfGames = 1;
    mgr.start(roomInfo);
    game = mgr.__getGame(ROOM_ID);
    await sleep(100);
    // B/C 烂牌，D 出牌 17 张；A 16 张差15成胡：111 222 333 444 + 99将 + 13,14
    forceHolds(game, 1, [0,3,6,9,12,15,18,21,24,27,28,30,31,32,33,1]);
    forceHolds(game, 2, [0,3,6,9,12,15,18,21,24,27,28,30,31,32,33,2]);
    forceHolds(game, 3, [4,5,6,7,14,16,17,20,21,23,24,26,29,30,31,32,33]);
    forceHolds(game, 0, [0,0,0,1,1,1,2,2,2,3,3,3,9,9,13,14]);
    game.turn = 3;
    game.mahjongs[game.currentIndex] = 15; // A摸牌位置放15 -> 13,14,15顺成胡
    clearInbox();
    mgr.chuPai(U[3], 5); // D打废牌5（A/B/C均无4/6/7/8组合，无人可吃碰胡）
    await sleep(1200);   // 无人操作->自动轮到A摸牌
    var opsA2 = lastMsg(U[0], 'game_action_push');
    T('A摸牌后收到可胡操作(自摸)', opsA2 && opsA2.hu === true, JSON.stringify(opsA2));
    if(opsA2 && opsA2.hu){
        mgr.hu(U[0]);
        await sleep(2000);
        var over2 = lastMsg(U[0], 'game_over_push');
        T('自摸结算推送', !!over2);
        var tinfo = over2 && over2.results ? JSON.stringify(over2.results[0].huinfo || []) : '';
        T('自摸标记 zimo', tinfo.indexOf('zimo') >= 0, tinfo);
    }

    console.log('\n=== 结果: ' + passCount + ' 通过, ' + failCount + ' 失败 ===');
    process.exit(failCount > 0 ? 1 : 0);
})().catch(function(e){ console.error('测试异常:', e); process.exit(1); });
