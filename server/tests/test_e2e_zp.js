// 漳浦麻将(2人) 端到端冒烟测试
// mock roommgr/usermgr 网络层，驱动真实 gamemgr_zp：
// 开局发牌(庄17/闲16)、开金非花、补花推送、出牌-摸牌链路、游金宣告、断线补发
var roomMgr = require('../game_server/roommgr');
var userMgr = require('../game_server/usermgr');

var ROOM_ID = 'T_E2E_ZP';
var USER_A = 91001, USER_B = 91002; // A=seat0(庄) B=seat1

var roomInfo = {
    id: ROOM_ID,
    uuid: 'test-uuid-zp',
    conf: { type: 'zp', maxTai: 10, baseScore: 1, maxGames: 4, taiRules: null },
    seats: [
        { userId: USER_A, name: 'A', score: 0 },
        { userId: USER_B, name: 'B', score: 0 }
    ],
    nextButton: 0,
    laozhuangCount: 0,
    numOfGames: 1
};

roomMgr.getUserRoom = function(uid){ return (uid == USER_A || uid == USER_B) ? ROOM_ID : null; };
roomMgr.getRoomIdOfUser = roomMgr.getUserRoom;
roomMgr.getUserSeat = function(uid){ return uid == USER_A ? 0 : (uid == USER_B ? 1 : null); };
roomMgr.getRoom = function(id){ return id == ROOM_ID ? roomInfo : null; };
roomMgr.destroy = function(){};

var inbox = {}; inbox[USER_A] = []; inbox[USER_B] = [];
userMgr.sendMsg = function(uid, event, data){ if(inbox[uid]) inbox[uid].push({event: event, data: data}); };
userMgr.brocastInRoom = function(roomId, event, data){ inbox[USER_A].push({event: event, data: data}); inbox[USER_B].push({event: event, data: data}); };
userMgr.broacastInRoom = function(event, data, sender, incl){ inbox[USER_A].push({event: event, data: data}); inbox[USER_B].push({event: event, data: data}); };
userMgr.isOnline = function(){ return true; };
userMgr.send = function(){};
userMgr.bind = function(){};

var mgr = require('../game_server/gamemgr_zp');

var passCount = 0, failCount = 0;
function T(name, cond, extra){
    if(cond){ passCount++; console.log('  ✓ ' + name); }
    else { failCount++; console.log('  ✗ ' + name + (extra ? ' -> ' + extra : '')); }
}
function sleep(ms){ return new Promise(function(r){ setTimeout(r, ms); }); }
function clearInbox(){ inbox[USER_A] = []; inbox[USER_B] = []; }
function msgs(uid, event){ return inbox[uid].filter(function(m){ return m.event == event; }); }
function lastMsg(uid, event){ var m = msgs(uid, event); return m.length ? m[m.length-1].data : null; }

(async function main(){
    console.log('=== 漳浦麻将(2人) 端到端冒烟 ===\n');

    mgr.start(roomInfo);
    var game = mgr.__getGame(ROOM_ID);
    T('game 对象创建', !!game);

    var startA = lastMsg(USER_A, 'game_start_push');
    T('开局推送 game_start_push', !!startA);
    T('庄家 seat0 holds=17张', startA && Array.isArray(startA.seats[0].holds) && startA.seats[0].holds.length == 17, JSON.stringify(startA && startA.seats[0].holds && startA.seats[0].holds.length));
    T('闲家 seat1 holds 仅数量16', startA && startA.seats[1].holds === 16, JSON.stringify(startA && startA.seats[1].holds));
    T('座位带 hua 花牌数组', startA && Array.isArray(startA.seats[0].hua));
    var jin = startA ? startA.caishen : -1;
    T('开金 caishen 有效且非花牌', jin >= 0 && jin < 34, 'caishen=' + jin);
    T('fanPai 已推送', startA && startA.fanPai != null && startA.fanPai >= 0);
    T('牌墙剩余=144-33-开金消耗', startA && startA.numofmj >= 100 && startA.numofmj <= 110, 'numofmj=' + (startA && startA.numofmj));
    T('手牌无花牌', startA && startA.seats[0].holds.every(function(p){ return p < 34; }));

    // ===== S1: 庄家出牌 -> 对手无操作自动摸牌 =====
    console.log('[S1] 出牌-摸牌链路');
    var sdB = game.gameSeats[1];
    // B 固定为无对无顺烂牌(且非金)，保证无操作走自动摸牌
    sdB.holds = [0,3,6,9,12,15,18,21,24,27,28,30,31,32,33,1].filter(function(p){ return p != jin && !(jin < 27 && p == 29); });
    while(sdB.holds.length < 16){ sdB.holds.push(32); }
    sdB.holds = sdB.holds.slice(0, 16);
    var aHolds = game.gameSeats[0].holds.slice();
    var bCM = {}; sdB.holds.forEach(function(p){ bCM[p]=(bCM[p]||0)+1; });
    var chu = -1;
    for(var t = 0; t < aHolds.length; ++t){
        var cand = aHolds[t];
        if(cand == jin) continue; // 不打金牌(会触发特殊规则)
        if((bCM[cand] || 0) > 0) continue;
        chu = cand; break;
    }
    if(chu == -1) chu = aHolds[0];
    clearInbox();
    mgr.chuPai(USER_A, chu);
    var notifyA = lastMsg(USER_A, 'game_chupai_notify_push');
    T('出牌者收到完整holds(16张)', notifyA && Array.isArray(notifyA.holds) && notifyA.holds.length == 16, JSON.stringify(notifyA && notifyA.holds && notifyA.holds.length));
    var notifyB = lastMsg(USER_B, 'game_chupai_notify_push');
    T('对手收到出牌者holds数量(16)', notifyB && notifyB.holds === 16);

    await sleep(800); // 等自动摸牌
    var mopaiB = lastMsg(USER_B, 'game_mopai_push');
    T('B 自动摸牌推送 si=1', mopaiB && mopaiB.si == 1);
    T('B 收到真实holds(17张)', mopaiB && Array.isArray(mopaiB.holds) && mopaiB.holds.length == 17, JSON.stringify(mopaiB && mopaiB.holds && mopaiB.holds.length));
    var mopaiToA = lastMsg(USER_A, 'game_mopai_push');
    T('A 收到 B 摸牌仅数量', mopaiToA && typeof mopaiToA.holds === 'number');

    // ===== S2: 游金宣告 =====
    console.log('[S2] 游金宣告');
    var sdA = game.gameSeats[0];
    // 构造 A：5刻 + 1金 + 单8 → 打8游金；金牌=jin(若jin在手牌构造内换构造牌)
    var jinCard = (jin >= 0 && jin != 7 && jin != 8) ? jin : 30; // 用30(东)兜底当金牌不便,直接改 game.jinPai 做确定性
    game.jinPai = 6; game.fanPai = 6;
    sdA.holds = [0,0,0, 1,1,1, 2,2,2, 3,3,3, 4,4,4, 6, 8];
    sdA.hua = [];
    sdA.pengs = []; sdA.gangs = []; sdA.chis = [];
    sdA.canYouJin = true; sdA.youJinPai = [8];
    game.turn = 0; game.chuPai = -1;
    clearInbox();
    mgr.youjin(USER_A, 8);
    T('游金后 youJinLevel=1', sdA.youJinLevel == 1);
    var yjPush = lastMsg(USER_A, 'game_youjin_push');
    T('游金推送 game_youjin_push level=1', yjPush && yjPush.si == 0 && yjPush.level == 1, JSON.stringify(yjPush));
    T('游金打出牌后 holds=16张且无8', sdA.holds.length == 16 && sdA.holds.indexOf(8) == -1);

    // ===== S3: 断线补发 =====
    console.log('[S3] 断线重连补发');
    clearInbox();
    mgr.resendGameState(ROOM_ID, USER_A);
    var resend = msgs(USER_A, 'game_start_push');
    var resendData = resend.length ? resend[resend.length-1].data : null;
    T('补发消息含金牌 caishen', resendData && resendData.caishen == 6, JSON.stringify(resendData && resendData.caishen));
    T('补发座位带 hua/youjin', resendData && resendData.seats && Array.isArray(resendData.seats[0].hua) && resendData.seats[0].youjin != null);
    T('补发自己 holds 为数组', resendData && Array.isArray(resendData.seats[0].holds));

    console.log('\n=== 结果: ' + passCount + ' 通过, ' + failCount + ' 失败 ===');
    process.exit(failCount > 0 ? 1 : 0);
})().catch(function(e){ console.error('测试异常:', e); process.exit(2); });
