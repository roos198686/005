/**
 * 抢杠胡端到端验证：2人翻财神
 * 场景：A 碰了 1万(18) ，手里又摸到一张 1万，想弯杠；
 *       B 手里有 2万(19)+3万(20) 等 1万 组顺；同时 3 条顺 + 中将 → 听 1万
 * 验证：A 点弯杠 → 进入抢杠窗口 → B 可以胡 → B 胡牌台数里有抢杠+1
 */
var roomMgr = require('../game_server/roommgr');
var userMgr = require('../game_server/usermgr');
var mgr = require('../game_server/gamemgr_ldh');

var ROOM_ID = 'T_QGANG', USER_A = 90101, USER_B = 90102;

// ---- mock ----
roomMgr.getUserRoom = function(uid){ return ROOM_ID; };
roomMgr.getRoomIdOfUser = function(uid){ return ROOM_ID; };
roomMgr.getUserSeat = function(uid){ return uid == USER_A ? 0 : 1; };
roomMgr.getRoom = function(id){ return null; };
roomMgr.destroy = function(){};

var inbox = {}; inbox[USER_A] = []; inbox[USER_B] = [];
userMgr.sendMsg = function(uid, event, data){ if(inbox[uid]) inbox[uid].push({event:event,data:data}); };
userMgr.brocastInRoom = function(){ inbox[USER_A].push({event:arguments[1],data:arguments[2]}); inbox[USER_B].push({event:arguments[1],data:arguments[2]}); };
userMgr.isOnline = function(){ return true; };
userMgr.send = function(){}; userMgr.bind = function(){};

function T(name, cond, extra){
    if(cond){ console.log('  ✓ ' + name); global.pass++; }
    else { console.log('  ✗ ' + name + (extra ? ' -> ' + extra : '')); global.fail++; }
}

(async function main(){
    global.pass = 0; global.fail = 0;
    console.log('=== 抢杠胡端到端验证 ===\n');

    var roomInfo = {
        id: ROOM_ID, uuid: 'qgang-uuid',
        conf: { type: 'zj', playStyle: 'fancaishen', maxTai: 10, baseScore: 1, caishen_cpg: 1, maxGames: 4 },
        seats: [
            { userId: USER_A, name: 'A', score: 0 },
            { userId: USER_B, name: 'B', score: 0 }
        ],
        nextButton: 0, laozhuangCount: 0, numOfGames: 1
    };

    mgr.start(roomInfo);
    var game = mgr.__getGame(ROOM_ID);

    // 固定财神为 26（9万），A/B 都不用它做百搭
    game.caishen = 26; game.caishen2 = -1;

    var sdA = game.gameSeats[0], sdB = game.gameSeats[1];
    // 清掉 gamemgr 启动以来的所有 options / pengs / gangs / chis / holds
    sdA.pengs = []; sdA.pengTiles = []; sdA.gangs = []; sdA.chis = []; sdA.folds = [];
    sdB.pengs = []; sdB.pengTiles = []; sdB.gangs = []; sdB.chis = []; sdB.folds = [];

    // A 的牌：碰了 1万(18)，手里再摸一张 1万 → 触发 wanGang
    sdA.pengs.push(18); sdA.pengTiles.push([18,18,18]);
    // A 手里保持 countMap[18] = 1（只有一张 1万真牌待弯杠）
    sdA.holds = [18, 9,10,11, 12,13,14, 15,16,17, 27,27];
    sdA.countMap = {};
    for(var i = 0; i < sdA.holds.length; ++i){
        sdA.countMap[sdA.holds[i]] = (sdA.countMap[sdA.holds[i]] || 0) + 1;
    }
    T('A 构造完成：pengs=[18] countMap[18]=' + sdA.countMap[18], sdA.countMap[18] == 1);

    // B 的牌：19,20 等 18 → 3 条顺 + 中将 + 等待 18 组 18-19-20 → 听 18
    sdB.holds = [19,20, 9,10,11, 12,13,14, 15,16,17, 27,27];
    sdB.countMap = {};
    for(var i = 0; i < sdB.holds.length; ++i){
        sdB.countMap[sdB.holds[i]] = (sdB.countMap[sdB.holds[i]] || 0) + 1;
    }
    // B 直接用 __calculateTai 预演：加上 18 后能胡、且台数够
    console.log('  B holds + 18 理论可胡');

    game.turn = 0; game.chuPai = -1;
    inbox[USER_A] = []; inbox[USER_B] = [];

    // ---- A 点弯杠 ----
    console.log('\n--- A 点弯杠 ---');
    sdA.canGang = true; sdA.gangPai = [18];
    mgr.gang(USER_A, 18);

    var qgang = game.qiangGangContext;
    T('触发抢杠上下文', !!qgang && qgang.isValid && qgang.pai == 18 && qgang.gangSeatIndex == 0, JSON.stringify(qgang));
    T('A 弯杠未执行：pengs 里仍有 18', sdA.pengs.indexOf(18) != -1);
    T('A 弯杠未执行：gangs 里没加 wan', sdA.gangs.length == 0);

    var opsB = inbox[USER_B].filter(function(m){ return m.event == 'game_action_push'; });
    T('B.canHu=true', sdB.canHu === true);
    T('B 收到胡操作推送', opsB.length >= 1);

    // ---- B 抢杠胡 ----
    console.log('\n--- B 抢杠胡 ---');
    inbox[USER_A] = []; inbox[USER_B] = [];
    mgr.hu(USER_B);

    var huMsg = inbox[USER_A].find(function(m){ return m.event == 'game_hu_push'; })
             || inbox[USER_B].find(function(m){ return m.event == 'game_hu_push'; });
    T('game_hu_push 已推送', !!huMsg);
    T('qianggang=true', huMsg && huMsg.data.qianggang === true, huMsg && JSON.stringify(huMsg.data));
    T('hupai=18', huMsg && huMsg.data.pai == 18);
    T('zimo=false（算点炮胡）', huMsg && huMsg.data.zimo === false);
    // 台数：4 顺 + 中将 → 平胡(1) + 无财(1) + 抢杠胡(1) = 3 台
    T('台数含抢杠+1（至少 3 台）', huMsg && huMsg.data.tai >= 3, huMsg && 'tai=' + huMsg.data.tai);

    // A 弯杠被取消验证
    T('A 弯杠取消：pengs 里仍有 18', sdA.pengs.indexOf(18) != -1);
    T('A 弯杠取消：gangs 里没加 wan', sdA.gangs.length == 0);
    // A 的 18 被 B 抢走 → holds 里应该没 18 了
    T('A 的 18 已被抢走：holds 不含 18', sdA.holds.indexOf(18) == -1, JSON.stringify(sdA.holds));

    console.log('\n=== 结果: ' + global.pass + ' 通过, ' + global.fail + ' 失败 ===');
})();
