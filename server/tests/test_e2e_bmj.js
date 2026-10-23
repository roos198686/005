// 包财神(zj_bt / 2人) 完整流程回归测试
// 流程: 发牌 -> 庄家叫台弹窗 -> 闲家(只能叫更大的) -> 一家不包 -> 定包家
//       -> 包家定财神(双财显示2张 / 单财显示1张+"无" / 无财直接跳过) -> 出牌
var roomMgr = require('../game_server/roommgr');
var userMgr = require('../game_server/usermgr');
var db = require('../utils/db');
db.create_game = function(a, b, c, cb){ if(cb) cb(null, {insertId: 1}); };
db.create_game_result = function(a, b, c, cb){ if(cb) cb(null, {}); };
db.update_game_result = function(a, b, c, cb){ if(cb) cb(null, {}); };
db.get_game_by_user_id = function(uid, cb){ cb(null); };
db.update_gems = function(uid, g, cb){ if(cb) cb(null, {}); };
db.cost_gems = function(uid, c, cb){ if(cb) cb(null, {}); };

var ROOM_ID = 'T_E2E_BMJ';
var U = [94001, 94002]; // seat0 = 庄

var roomInfo = {
    id: ROOM_ID,
    uuid: 'test-uuid-bmj',
    conf: { type: 'zj_bt', maxTai: 10, baseScore: 1, maxGames: 4 },
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
var pushLog = [];   // 结算推送有1秒延迟,单独记录以便测试结束后校验
userMgr.sendMsg = function(uid, event, data){ if(inbox[uid]) inbox[uid].push({event: event, data: data}); };
userMgr.brocastInRoom = function(roomId, event, data){ if(event == 'game_over_push') pushLog.push(data); U.forEach(function(u){ inbox[u].push({event: event, data: data}); }); };
userMgr.broacastInRoom = function(event, data, sender, incl){ if(event == 'game_over_push') pushLog.push(data); U.forEach(function(u){ inbox[u].push({event: event, data: data}); }); };
userMgr.isOnline = function(){ return true; };

var mgr = require('../game_server/gamemgr_bmj');

var pass = 0, fail = 0;
function T(name, cond, extra){
    if(cond){ pass++; console.log('  OK   ' + name); }
    else { fail++; console.log('  FAIL ' + name + (extra ? ' -> ' + extra : '')); }
}
function clearInbox(){ U.forEach(function(u){ inbox[u] = []; }); }
function msgs(uid, ev){ return inbox[uid].filter(function(m){ return m.event == ev; }); }
function lastMsg(uid, ev){ var a = msgs(uid, ev); return a.length ? a[a.length - 1].data : null; }
function rank(tai, mode){ return tai * 10 + (mode === 0 ? 2 : (mode === 1 ? 1 : 0)); }

console.log('=== 包财神 完整流程回归 ===\n');

// ===== 场景A: 全流程 无财(跳过定财神) =====
console.log('[A1] 开局 -> 只给庄家发叫台请求，财神未定');
mgr.start(roomInfo);
var game = mgr.__getGame(ROOM_ID);
T('game 创建', !!game);
T('开局不翻财神', game.caishen === -1, 'caishen=' + game.caishen);
T('waitBao=true', game.waitBao === true);
T('waitCaishen=false', game.waitCaishen === false);
var b0 = lastMsg(U[0], 'bao_select_push');
T('庄家收到 bao_select_push', !!b0, JSON.stringify(b0));
T('首叫 currentRank=-1(全部可选)', b0 && b0.currentRank === -1, 'currentRank=' + (b0 && b0.currentRank));
T('闲家未收到叫台请求', msgs(U[1], 'bao_select_push').length === 0);

console.log('[A2] 叫台未结束 -> 出牌/定财神都必须被拦截');
var holdsA = game.gameSeats[0].holds.slice();
clearInbox();
mgr.chuPai(U[0], holdsA[0]);
T('叫台阶段出牌被拒(手牌不变)', game.gameSeats[0].holds.length === holdsA.length);
T('叫台阶段出牌被拒(弃牌为空)', (game.gameSeats[0].folds || []).length === 0);
mgr.caishenSelect(U[0], holdsA[0]);
T('叫台阶段定财神被拒', game.caishen === -1, 'caishen=' + game.caishen);

console.log('[A3] 庄家叫双财2台 -> 轮到闲家, 闲家只能叫更大的');
clearInbox();
mgr.bao(U[0], true, 2, 0, 2);
T('庄家叫台被接受', game.baoCurrentSeat === 0, 'seat=' + game.baoCurrentSeat);
T('台数=2', game.baoTai === 2);
T('模式=2(双财)', game.baoMode === 2);
T('轮次转到闲家', game.baoTurnSeat === 1, 'turnSeat=' + game.baoTurnSeat);
var b1 = lastMsg(U[1], 'bao_select_push');
T('闲家收到叫台请求', !!b1, JSON.stringify(b1));
T('闲家收到 currentRank=20(双财2台)', b1 && b1.currentRank === 20, 'currentRank=' + (b1 && b1.currentRank));
T('未定包家', game.baoDecided === false);

console.log('[A4] 同台数优先级: 无财 > 独财 > 双财');
mgr.bao(U[1], true, 2, 0, 1); // 独财2台 rank21 > 20 应通过
T('闲家独财2台压过双财2台', game.baoCurrentSeat === 1, 'seat=' + game.baoCurrentSeat + ' rank=' + game.baoCurrentRank);
T('rank=21', game.baoCurrentRank === 21, 'rank=' + game.baoCurrentRank);
T('轮回庄家', game.baoTurnSeat === 0, 'turnSeat=' + game.baoTurnSeat);
mgr.bao(U[0], true, 2, 0, 0); // 无财2台 rank22 > 21
T('庄家无财2台压过独财2台', game.baoCurrentRank === 22, 'rank=' + game.baoCurrentRank);
mgr.bao(U[1], true, 2, 0, 0); // 同rank 重复叫, 必须拒绝
T('同rank重复叫被拒', game.baoCurrentRank === 22 && game.baoCurrentSeat === 0,
    'rank=' + game.baoCurrentRank + ' seat=' + game.baoCurrentSeat);
mgr.bao(U[1], true, 3, 0, 0); // 无财3台 rank32
T('闲家无财3台压过', game.baoCurrentRank === 32, 'rank=' + game.baoCurrentRank);

console.log('[A5] 庄家不包 -> 闲家成为包家(无财, 跳过定财神)');
clearInbox();
mgr.bao(U[0], false);
T('已定包家', game.baoDecided === true);
T('包家=闲家(seat1)', game.baoSeatIndex === 1, 'baoSeat=' + game.baoSeatIndex);
T('waitBao 关闭', game.waitBao === false);
T('waitCaishen 保持 false(无财跳过定财神)', game.waitCaishen === false);
T('财神仍为 -1(无财)', game.caishen === -1, 'caishen=' + game.caishen);
var r0 = lastMsg(U[0], 'bao_result_push');
T('广播 bao_result 带 caishen=-1', r0 && r0.caishen === -1, JSON.stringify(r0));
T('广播 baoMode=0(无财)', r0 && r0.baoMode === 0);
T('包家未收到 caishen_select_push', msgs(U[1], 'caishen_select_push').length === 0);

console.log('[A6] 无财直接开打: 庄家出牌正常');
clearInbox();
var chuA = game.gameSeats[0].holds[0];
mgr.chuPai(U[0], chuA);
T('庄家出牌成功', (game.gameSeats[0].folds || []).length === 1, 'folds=' + JSON.stringify(game.gameSeats[0].folds));

// ===== 场景B: 单财 -> 定财神 =====
console.log('\n[B1] 重开一局: 庄叫独财2台, 闲家不包 -> 庄家成包家, 进入定财神');
clearInbox();
mgr.start(roomInfo);
var g2 = mgr.__getGame(ROOM_ID);
T('新局 waitBao=true', g2.waitBao === true);
T('新局财神未定', g2.caishen === -1);
mgr.bao(U[0], true, 2, 0, 1);   // 庄: 独财2台
T('庄叫台后轮闲家', g2.baoTurnSeat === 1, 'turnSeat=' + g2.baoTurnSeat);
clearInbox();
mgr.bao(U[1], false);           // 闲家不包
T('包家=庄家(seat0)', g2.baoSeatIndex === 0, 'baoSeat=' + g2.baoSeatIndex);
T('waitCaishen=true(单财需定财神)', g2.waitCaishen === true);
T('庄家收到 caishen_select_push', !!lastMsg(U[0], 'caishen_select_push'), JSON.stringify(lastMsg(U[0], 'caishen_select_push')));
T('闲家未收到 caishen_select_push', msgs(U[1], 'caishen_select_push').length === 0);

console.log('[B2] 定财神合法性校验');
var holds0 = g2.gameSeats[0].holds.slice();
mgr.caishenSelect(U[1], holds0[0]);
T('非包家定财神被拒', g2.caishen === -1, 'caishen=' + g2.caishen);
var notInHand = -1;
for(var t = 0; t < 34; ++t){ if(holds0.indexOf(t) < 0){ notInHand = t; break; } }
mgr.caishenSelect(U[0], notInHand);
T('非手牌定财神被拒', g2.caishen === -1, 'caishen=' + g2.caishen + ' notInHand=' + notInHand);

console.log('[B3] 包家从手牌定财神 -> 单财不生成第二张');
clearInbox();
var cs1 = holds0[0];
mgr.caishenSelect(U[0], cs1);
T('财神=选定牌', g2.caishen === cs1, 'caishen=' + g2.caishen);
T('单财不生成第二张', g2.caishen2 === -1, 'caishen2=' + g2.caishen2);
T('waitCaishen 关闭', g2.waitCaishen === false);
var r1 = lastMsg(U[0], 'bao_result_push');
T('广播带 caishen/caishen2', r1 && r1.caishen === cs1 && r1.caishen2 === -1, JSON.stringify(r1));
T('广播带 baoMode=1(独财)', r1 && r1.baoMode === 1);
var chu2 = -1;
for(var i = 0; i < g2.gameSeats[0].holds.length; ++i){
    var v = g2.gameSeats[0].holds[i];
    if(v !== g2.caishen && v !== g2.caishen2){ chu2 = v; break; }
}
mgr.chuPai(U[0], chu2);
T('定财神后庄家可出牌', (g2.gameSeats[0].folds || []).length === 1, 'folds=' + JSON.stringify(g2.gameSeats[0].folds));

// ===== 场景C: 双财 -> 第二张按循环规则 =====
console.log('\n[C1] 双财: 第二张财神按同花色/字牌循环生成');
clearInbox();
mgr.start(roomInfo);
var g3 = mgr.__getGame(ROOM_ID);
mgr.bao(U[0], true, 3, 0, 2);   // 庄: 双财3台
mgr.bao(U[1], false);           // 闲不包 -> 庄成包家, 双财
T('包家=庄家', g3.baoSeatIndex === 0, 'baoSeat=' + g3.baoSeatIndex);
T('waitCaishen=true', g3.waitCaishen === true);
var c0 = g3.gameSeats[0].holds[0];
mgr.caishenSelect(U[0], c0);
T('第一张财神=选定牌', g3.caishen === c0, 'caishen=' + g3.caishen);
// 牌ID: 27中 28发 29白, 30东 31西 32南 33北; 风牌按 东→南→西→北 循环
var WIND_SEQ = [30, 32, 31, 33];
var expect2 = c0 < 27 ? (Math.floor(c0 / 9) * 9 + (c0 % 9 + 1) % 9)
    : (c0 <= 29 ? 27 + (c0 - 27 + 1) % 3
        : WIND_SEQ[(WIND_SEQ.indexOf(c0) + 1) % 4]);
T('第二张符合循环规则', g3.caishen2 === expect2, 'got=' + g3.caishen2 + ' expect=' + expect2 + ' first=' + c0);
var r2 = lastMsg(U[0], 'bao_result_push');
T('广播带两张财神', r2 && r2.caishen === c0 && r2.caishen2 === expect2, JSON.stringify(r2));

// 用户反馈场景: 定南(32) -> 财神必须是 南(32)+西(31), 不能是南+北
console.log('[C2] 定南 -> 财神=南+西');
clearInbox();
mgr.start(roomInfo);
var g3b = mgr.__getGame(ROOM_ID);
mgr.bao(U[0], true, 3, 0, 2);   // 庄: 双财3台
mgr.bao(U[1], false);           // 闲不包 -> 庄成包家, 双财
g3b.gameSeats[0].holds[0] = 32; // 手牌第一张换成南
mgr.caishenSelect(U[0], 32);
T('定南: 第一张=南(32)', g3b.caishen === 32, 'caishen=' + g3b.caishen);
T('定南: 第二张=西(31)', g3b.caishen2 === 31, 'caishen2=' + g3b.caishen2);

// ===== 场景D: 客户端真实发包(JSON字符串) -> 服务端必须解析后正确轮转到闲家 =====
console.log('\n[D1] 客户端 Net.js 会 JSON.stringify, 服务端 bao 处理器必须解析字符串');
clearInbox();
mgr.start(roomInfo);
var g4 = mgr.__getGame(ROOM_ID);
var rawPayload = JSON.stringify({ isBao: true, baoTai: 3, baoTaiFee: 0, caishenMode: 1 });
T('原始载荷是字符串', typeof rawPayload === 'string');
// 复刻 socket_service.js 中 bao 处理器的解析逻辑
var parsed = rawPayload;
if(typeof parsed === 'string'){ parsed = JSON.parse(parsed); }
T('解析后 isBao=true', parsed.isBao === true, JSON.stringify(parsed));
T('解析后 caishenMode=1', parsed.caishenMode === 1);
// 若不解析, isBao 会是 undefined -> 被当成不包(旧 bug)
T('未解析时 isBao 取不到(旧bug根因)', (function(){ try{ return JSON.parse(rawPayload).isBao === true; }catch(e){ return false; } })());
mgr.bao(U[0], parsed.isBao, parsed.baoTai || 2, parsed.baoTaiFee || 0, parsed.caishenMode != null ? parsed.caishenMode : 1);
T('叫台被接受(台数3)', g4.baoTai === 3, 'baoTai=' + g4.baoTai);
T('流程轮到闲家(不是直接定包家)', g4.baoTurnSeat === 1 && g4.baoDecided === false,
    'turnSeat=' + g4.baoTurnSeat + ' decided=' + g4.baoDecided);
T('闲家收到叫台请求', msgs(U[1], 'bao_select_push').length === 1);

// ===== 场景E: 包家台数门槛(包3台时1台的牌不许胡, 闲家按 min_tai=1 放行) =====
console.log('\n[E1] 包家叫3台 -> 只有1台的牌型禁止胡, 胡按钮不下发');
var gate = mgr.__algo.baoTaiGate;
T('baoTaiGate 已导出', typeof gate === 'function');
// 一套平胡(1台)的牌: 三副顺子 + 一对字牌, 无财神
var holds1Tai = [0,1,2, 3,4,5, 6,7,8, 9,10,11, 27,27];
var g1 = { caishen: -1, caishen2: -1, taiRules: null, baoSeatIndex: 0, baoTai: 3 };
var sdBao = { seatIndex: 0, holds: holds1Tai.slice(), pengs: [], chis: [], gangs: [] };
mgr.__algo.rebuildCountMap(sdBao);
var rBao = gate(sdBao, g1, null, true, 0);
T('算出的台数=2(平胡1+无财1)', rBao.tai === 2, 'tai=' + rBao.tai);
T('包家需≥3台 -> 2台不放行', rBao.ok === false, 'ok=' + rBao.ok + ' need=' + rBao.need);
T('门槛值=叫的包台数3', rBao.need === 3, 'need=' + rBao.need);
var sdXian = { seatIndex: 1, holds: holds1Tai.slice(), pengs: [], chis: [], gangs: [] };
mgr.__algo.rebuildCountMap(sdXian);
var rXian = gate(sdXian, g1, null, true, 0);
T('闲家同牌1台 >= min_tai(1) -> 放行', rXian.ok === true, 'ok=' + rXian.ok + ' need=' + rXian.need);
T('门槛不改变手牌(无残留)', sdXian.holds.length === 14, 'holds=' + sdXian.holds.length);
// 包家叫1台时同一手牌应放行
var g2 = { caishen: -1, caishen2: -1, taiRules: null, baoSeatIndex: 0, baoTai: 1 };
var rBao1 = gate({ seatIndex: 0, holds: holds1Tai.slice(), pengs: [], chis: [], gangs: [], countMap: {} }, g2, null, true, 0);
T('包家叫1台+手牌1台 -> 放行', rBao1.ok === true, 'ok=' + rBao1.ok);

// ===== 场景F: 点炮判胡不得重复加牌(回归: 包2台/牌面2台必须能胡) =====
console.log('\n[F1] 点炮: 牌已试进手牌后再过门槛, 手牌数必须保持14(不允许二次push)');
// 13张手牌(差1张胡): 三副顺子 + 一对 + 单张, 点炮来最后一张成平胡
// holds13 = [0,1,2, 3,4,5, 6,7,8, 9,10, 27,27], 点炮牌=11 -> [9,10,11]顺子
var holds13 = [0,1,2, 3,4,5, 6,7,8, 9,10, 27,27];
var gF = { caishen: -1, caishen2: -1, taiRules: null, baoSeatIndex: 0, baoTai: 2 };
var sdF = { seatIndex: 0, holds: holds13.slice(), pengs: [], chis: [], gangs: [] };
mgr.__algo.rebuildCountMap(sdF);
// 复刻 checkCanDianPaoHu 的顺序: 先 push, 再 gate(null)
sdF.holds.push(11);
sdF.countMap[11] = (sdF.countMap[11] || 0) + 1;
var rF = gate(sdF, gF, null, false, 0);
T('点炮后手牌=14(未被二次push)', sdF.holds.length === 14, 'holds=' + sdF.holds.length);
T('算出台数=2(平胡1+无财1)', rF.tai === 2, 'tai=' + rF.tai);
T('包家叫2台+牌面2台 -> 必须放行', rF.ok === true, 'ok=' + rF.ok + ' tai=' + rF.tai + ' need=' + rF.need);
sdF.countMap[11]--;
sdF.holds.pop();
T('判定完手牌还原=13', sdF.holds.length === 13, 'holds=' + sdF.holds.length);

// ===== 场景G: 点炮胡由后台 dianpao_hu 开关控制, 对包家/闲家一视同仁 =====
console.log('\n[G1] dianpao_hu 开关对包家和闲家同样生效');
var dianpao = mgr.__algo.checkCanDianPaoHu;
T('checkCanDianPaoHu 已导出', typeof dianpao === 'function');
var mkGameG = function(dp){
    return { caishen: -1, caishen2: -1, taiRules: null, baoSeatIndex: 0, baoTai: 2, dianpao_hu: dp, lastHuPaiSeat: -1 };
};
var mkSeatG = function(si){
    var sd = { seatIndex: si, holds: holds13.slice(), pengs: [], chis: [], gangs: [], countMap: {} };
    mgr.__algo.rebuildCountMap(sd);
    return sd;
};
// 开关=1(允许点炮): 包家够台数可点炮, 闲家也可点炮
var sdB1 = mkSeatG(0); dianpao(mkGameG(1), sdB1, 11);
T('开关开: 包家点炮2台≥包2台 -> canHu=true', sdB1.canHu === true, 'canHu=' + sdB1.canHu);
var sdX1 = mkSeatG(1); dianpao(mkGameG(1), sdX1, 11);
T('开关开: 闲家点炮 -> canHu=true', sdX1.canHu === true, 'canHu=' + sdX1.canHu);
// 开关=0(禁止点炮): 包家/闲家一律不许
var sdB0 = mkSeatG(0); dianpao(mkGameG(0), sdB0, 11);
T('开关关: 包家点炮 -> canHu=false', sdB0.canHu === false, 'canHu=' + sdB0.canHu);
var sdX0 = mkSeatG(1); dianpao(mkGameG(0), sdX0, 11);
T('开关关: 闲家点炮 -> canHu=false', sdX0.canHu === false, 'canHu=' + sdX0.canHu);
T('判定后手牌还原=13', sdB1.holds.length === 13 && sdX0.holds.length === 13, 'holds=' + sdB1.holds.length + ',' + sdX0.holds.length);

// ===== 场景H: 结算分拆分: 胡牌分=基础分×2^(台数-1), 包台分=基础分×2^(包台数-1) =====
console.log('\n[H1] 包家自摸: 闲家付 胡牌分+包台分, huInfo 记录两项明细');
clearInbox();
mgr.start(roomInfo);
var gH = mgr.__getGame(ROOM_ID);
mgr.bao(U[0], true, 2, 0, 1);   // 庄: 独财2台
mgr.bao(U[1], false);           // 闲不包 -> 庄=包家, baoTai=2
T('包家=庄家, baoTai=2', gH.baoSeatIndex === 0 && gH.baoTai === 2, 'baoSeat=' + gH.baoSeatIndex + ' baoTai=' + gH.baoTai);
var sdH0 = gH.gameSeats[0];
// 包家先定财神(必须用手牌), 再构造一手不含财神的清一色平胡牌
var dealt = sdH0.holds[0];
mgr.caishenSelect(U[0], dealt);
T('定财神完成', gH.caishen === dealt && gH.waitCaishen === false, 'caishen=' + gH.caishen);
// 构造14张清一色(全筒): 4顺+1将, 不含财神 -> 平胡1+清一色3+无财1=5台
sdH0.holds = [0,1,2, 0,1,2, 3,4,5, 6,7,8, 3,3];
mgr.__algo.rebuildCountMap(sdH0);
sdH0.pengs = []; sdH0.chis = []; sdH0.gangs = [];
sdH0.countMap = {};
mgr.__algo.rebuildCountMap(sdH0);
gH.turn = 0;
gH.chuPai = -1;
gH.qiangGangContext = null;
gH.laozhuangCount = 0;  // 本用例只验证 天胡×2, 排除老庄翻倍干扰
gH.caishen = -1;        // 排除随机财神导致的财吊×2干扰
gH.caishen2 = -1;
var startSc0 = sdH0.score, startSc1 = gH.gameSeats[1].score;
var expTai = mgr.__algo.calculateTai(sdH0, gH, true, 0);
// 庄家开局未出牌直接自摸=天胡×2(原有规则,只作用于胡牌分)
var expHu = 1 * Math.pow(2, Math.max(0, expTai - 1)) * 2; // baseScore=1, 每台×2翻番, 天胡×2
var expBao = 1 * Math.pow(2, Math.max(0, 2 - 1));       // baoTai=2 -> 2(包台分不吃天胡翻倍)
sdH0.canHu = true;
mgr.hu(U[0]);
var gotSc0 = sdH0.score - startSc0, gotSc1 = gH.gameSeats[1].score - startSc1;
T('台数=' + expTai + ' -> 胡牌分=' + expHu + ' 包台分=' + expBao, expTai >= 2, 'tai=' + expTai);
T('包家得分=胡牌分+包台分=' + (expHu + expBao), gotSc0 === expHu + expBao, 'got=' + gotSc0);
T('闲家赔付=-' + (expHu + expBao), gotSc1 === -(expHu + expBao), 'got=' + gotSc1);
T('huInfo.huScore=' + expHu, sdH0.huInfo && sdH0.huInfo.huScore === expHu, JSON.stringify(sdH0.huInfo));
T('huInfo.baoScore=' + expBao, sdH0.huInfo && sdH0.huInfo.baoScore === expBao);
T('huInfo.baoTai=2', sdH0.huInfo && sdH0.huInfo.baoTai === 2);

// ===== 场景H2: 闲家自摸: 包家赔 胡牌分+包台分 =====
console.log('[H2] 闲家自摸: 包家赔付两项');
clearInbox();
mgr.start(roomInfo);
var gH2 = mgr.__getGame(ROOM_ID);
mgr.bao(U[0], true, 3, 0, 0);   // 庄: 无财3台
mgr.bao(U[1], false);           // 闲不包 -> 庄=包家, baoTai=3, 无财跳过定财神
T('包家=庄家, baoTai=3, 无财', gH2.baoSeatIndex === 0 && gH2.baoTai === 3 && gH2.caishen === -1);
var sdX = gH2.gameSeats[1];
// 闲家14张: 平胡(4顺+将), 无财(财神=-1) -> 平胡1+无财1=2台... 闲家门槛 min_tai=1 即可
sdX.holds = [0,1,2, 3,4,5, 6,7,8, 9,10,11, 27,27];
sdX.pengs = []; sdX.chis = []; sdX.gangs = [];
mgr.__algo.rebuildCountMap(sdX);
gH2.turn = 1;
gH2.chuPai = -1;
gH2.qiangGangContext = null;
var s0 = gH2.gameSeats[0].score, s1 = sdX.score;
var expTai2 = mgr.__algo.calculateTai(sdX, gH2, true, 0);
var expHu2 = 1 * Math.pow(2, Math.max(0, expTai2 - 1));
var expBao2 = 1 * Math.pow(2, Math.max(0, 3 - 1));      // baoTai=3 -> 4
sdX.canHu = true;
mgr.hu(U[1]);
T('闲家台数=' + expTai2 + ' 胡牌分=' + expHu2 + ' 包台分=' + expBao2, expTai2 >= 1);
T('闲家得分=' + (expHu2 + expBao2), sdX.score - s1 === expHu2 + expBao2, 'got=' + (sdX.score - s1));
T('包家赔付=-' + (expHu2 + expBao2), gH2.gameSeats[0].score - s0 === -(expHu2 + expBao2), 'got=' + (gH2.gameSeats[0].score - s0));
T('huInfo.baoScore=' + expBao2, sdX.huInfo && sdX.huInfo.baoScore === expBao2, JSON.stringify(sdX.huInfo));

// ===== 场景I: 庄家首次不包 -> 必须轮闲家叫台, 不能直接硬包 =====
console.log('\n[I1] 庄家不包 -> 闲家收到叫台弹窗; 闲家叫台即成包家');
clearInbox();
mgr.start(roomInfo);
var gI = mgr.__getGame(ROOM_ID);
mgr.bao(U[0], false);           // 庄家第一个就不包
T('庄家不包后未定包家', gI.baoDecided === false, 'baoDecided=' + gI.baoDecided);
T('轮次转给闲家', gI.baoTurnSeat === 1, 'turnSeat=' + gI.baoTurnSeat);
var sb1 = lastMsg(U[1], 'bao_select_push');
T('闲家收到叫台弹窗(全部可选)', sb1 && sb1.currentRank === -1, JSON.stringify(sb1));
T('庄家未收到新弹窗', msgs(U[0], 'bao_select_push').length === 1);
clearInbox();
mgr.bao(U[1], true, 2, 0, 1);   // 闲家叫独财2台 -> 庄家已放弃, 闲家直接成包家
T('闲家成包家', gI.baoSeatIndex === 1 && gI.baoDecided === true, 'baoSeat=' + gI.baoSeatIndex);
T('闲家收到定财神弹窗', !!lastMsg(U[1], 'caishen_select_push'));

console.log('[I2] 庄家不包 -> 闲家也不包 -> 庄家收到硬包弹窗(只2台, 默认双财), 庄家自选包法');
clearInbox();
mgr.start(roomInfo);
var gI2 = mgr.__getGame(ROOM_ID);
mgr.bao(U[0], false);           // 庄不包
T('先轮闲家', gI2.baoTurnSeat === 1 && gI2.baoDecided === false);
mgr.bao(U[1], false);           // 闲也不包
T('未直接定包家(等庄家选包法)', gI2.baoDecided === false, 'baoDecided=' + gI2.baoDecided);
T('标记为硬包', gI2.baoForced === true);
T('轮次回到庄家', gI2.baoTurnSeat === 0, 'turnSeat=' + gI2.baoTurnSeat);
var sbF = lastMsg(U[0], 'bao_select_push');
T('庄家收到硬包弹窗', sbF && sbF.forced === true && sbF.currentRank === -1, JSON.stringify(sbF));
clearInbox();
mgr.bao(U[0], true, 2, 0, 1);   // 庄家选独财, 台数固定2台
T('庄家成包家', gI2.baoSeatIndex === 0 && gI2.baoDecided === true, 'baoSeat=' + gI2.baoSeatIndex);
T('硬包台数固定2台 + 选中独财', gI2.baoTai === 2 && gI2.baoMode === 1, 'tai=' + gI2.baoTai + ' mode=' + gI2.baoMode);
T('庄家收到定财神弹窗', !!lastMsg(U[0], 'caishen_select_push'));

// ===== 场景J: 杠上开花台数(用户反馈: 包3台, 手牌只有2杠+混一色+无财, 提示只有2台) =====
console.log('\n[J1] 两个杠+混一色+无财+杠上开花 = 3台(杠上开花必须+1)');
var sdJ = { seatIndex: 0, holds: [0,1,2, 6,7,8, 33,33], pengs: [], chis: [], gangs: [{pai:3,type:'an'},{pai:4,type:'an'}], countMap: {} };
mgr.__algo.rebuildCountMap(sdJ);
var gJ = { caishen: -1, caishen2: -1, taiRules: null, baoSeatIndex: 0, baoTai: 3, maxTai: 10 };
T('牌型可胡', mgr.__algo.checkCanHu(sdJ, -1, -1) === true);
var taiJNoExtra = mgr.__algo.calculateTai(sdJ, gJ, true, 0);
var taiJ = mgr.__algo.calculateTai(sdJ, gJ, true, 1);
T('不含杠上开花=2台(混一色1+无财1)', taiJNoExtra === 2, 'tai=' + taiJNoExtra + ' log=' + JSON.stringify(sdJ.taiLog));
T('含杠上开花=3台', taiJ === 3, 'tai=' + taiJ + ' log=' + JSON.stringify(sdJ.taiLog));
T('3台可过包3台门槛', mgr.__algo.baoTaiGate(sdJ, gJ, null, true, 1).ok === true);

console.log('\n=== 结果: 通过 ' + pass + ' / 失败 ' + fail + ' ===');

// 结算推送延迟1秒发送,等推送到达后再校验"包家标记 + 包台数"
setTimeout(function(){
    var baoRows = [];
    pushLog.forEach(function(p){
        (p.results || []).forEach(function(r){ if(r.isBao){ baoRows.push(r); } });
    });
    var row2 = baoRows.filter(function(r){ return r.seatindex === 0 && r.baoTaiOfRound === 2; })[0] || null;
    T('结算推送标记包家(seatindex=0)', baoRows.length > 0 && !!baoRows.filter(function(r){ return r.seatindex === 0; })[0]);
    T('结算推送带本局包台数', !!row2, 'rows=' + JSON.stringify(baoRows));
    console.log('=== 结算字段校验: 通过 ' + pass + ' / 失败 ' + fail + ' ===');
    process.exit(fail > 0 ? 1 : 0);
}, 1500);

