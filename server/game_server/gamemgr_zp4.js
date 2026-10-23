/**
 * 福建漳浦麻将 - 游戏管理器（4人）
 * 规则：
 * 1. 144张牌：万筒条108 + 东南西北中发白28 + 花牌8(梅兰竹菊春夏秋冬)
 * 2. 庄家17张、闲家16张；摸到花牌亮出并从牌墙尾部补牌
 * 3. 开金：补花完成后从牌尾翻牌(花牌重翻)，翻开的牌即金牌(百搭)；金牌是万筒条时白板也能当金牌用
 * 4. 打出的金牌任何人不可吃/碰/杠/胡；吃碰杠仅限真实牌(金不代牌)
 * 5. 胡牌：5组面子+1对将(17张)，金可代；七对=7对子+1刻
 * 6. 特色：三金倒(手牌>=3金直接胡,按自摸付)、抢金(开金后无人吃碰前听牌可拿金牌胡)、
 *    游金(成型后将=金+普通牌,打出普通牌后每摸必胡,逐级翻倍,期间他人只能自摸)
 * 7. 手里>=2张金牌时禁止点炮胡(只能自摸/游金)
 * 8. 台数结算：底分×2^台(封顶可配)，游金每级再乘倍数；花/金/明杠/暗杠/特殊牌型加台
 * 9. 流局荒庄庄家连庄；庄胡连庄；分饼为可选开关(仅4人版生效)
 */
var roomMgr = require("./roommgr");
var userMgr = require("./usermgr");
var db = require("../utils/db");

var games = {};
var SEAT_COUNT = 4;

// 牌值编码：0-8筒 9-17条 18-26万 27中28发29白30东31南32西33北 34-41花(梅兰竹菊春夏秋冬)
var FLOWER_START = 34;
var BAIBAN = 29;
var HUA_NAMES = ["梅","兰","竹","菊","春","夏","秋","冬"];

function getMJType(id){
    if(id >= 0 && id < 9) return 0;       // 筒
    if(id >= 9 && id < 18) return 1;      // 条
    if(id >= 18 && id < 27) return 2;     // 万
    if(id >= 27 && id < 34) return 3;     // 字
    return 4;                              // 花
}
function isFlower(pai){ return pai >= FLOWER_START; }
function isZi(pai){ return pai >= 27 && pai < 34; }

// ===== 金牌（百搭）判定 =====
function isWild(game, pai){
    if(game.jinPai < 0) return false;
    if(pai == game.jinPai) return true;
    // 白板附带：金牌是万筒条时，白板也能当金牌用
    if(game.jinPai < 27 && pai == BAIBAN) return true;
    return false;
}
function countWildsInHolds(game, seatData){
    var n = 0;
    for(var i = 0; i < seatData.holds.length; ++i){
        if(isWild(game, seatData.holds[i])) n++;
    }
    return n;
}

// ===== 台数规则：优先读后台配置(game.taiRules)，缺省用默认值 =====
function taiRule(game, key, def){
    var r = game.taiRules;
    if(r && r[key] != null && !isNaN(parseFloat(r[key]))) return parseFloat(r[key]);
    return def;
}
function getChupaiTimeout(game){
    return taiRule(game, 'chupai_timeout', 15);
}

// ===== 洗牌：144张 =====
function shuffle(game){
    var mahjongs = game.mahjongs;
    var index = 0;
    for(var i = 0; i < 34; ++i){          // 筒条万字各4张
        for(var c = 0; c < 4; ++c){ mahjongs[index++] = i; }
    }
    for(var i = 34; i < 42; ++i){         // 花各1张
        mahjongs[index++] = i;
    }
    for(var i = 0; i < mahjongs.length; ++i){
        var lastIndex = mahjongs.length - 1 - i;
        var idx = Math.floor(Math.random() * (lastIndex + 1));
        var t = mahjongs[idx];
        mahjongs[idx] = mahjongs[lastIndex];
        mahjongs[lastIndex] = t;
    }
}

// ===== 牌墙：头摸(currentIndex)/尾补(tailIndex) =====
function numOfMJ(game){
    return game.tailIndex - game.currentIndex + 1;
}
function drawHead(game){
    if(game.currentIndex > game.tailIndex) return -1;
    return game.mahjongs[game.currentIndex++];
}
function drawTail(game){
    if(game.tailIndex < game.currentIndex) return -1;
    return game.mahjongs[game.tailIndex--];
}

// 摸牌（自动补花，花从牌墙尾部补）；fromTail=true 时整次摸牌取自尾部(杠补)
function mopai(game, seatIndex, fromTail){
    var data = game.gameSeats[seatIndex];
    var pai = fromTail ? drawTail(game) : drawHead(game);
    if(pai == -1) return -1;
    if(isFlower(pai)){
        data.hua.push(pai);
        // 记录本回合补出的花，推送由调用方统一发
        game.pendingHua.push({si:seatIndex, pai:pai});
        return mopai(game, seatIndex, fromTail);
    }
    data.holds.push(pai);
    return pai;
}

// 发牌：闲16庄17；翻金在开金函数
function deal(game){
    game.currentIndex = 0;
    game.tailIndex = game.mahjongs.length - 1;
    var si = game.button;
    for(var r = 0; r < 16; ++r){
        for(var k = 0; k < SEAT_COUNT; ++k){
            mopai(game, (si + k) % SEAT_COUNT, false);
        }
    }
    mopai(game, game.button, false); // 庄家第17张
    game.turn = game.button;
}

// 开金：从牌尾翻，花牌继续向内重翻直至非花；翻开的牌移出牌墙
function kaiJin(game){
    while(true){
        var p = drawTail(game);
        if(p == -1){ game.fanPai = -1; game.jinPai = -1; return; }
        if(isFlower(p)){
            game.kaiJinFlowers.push(p); // 翻出的花牌仅移出牌墙，不计分
            continue;
        }
        game.fanPai = p;
        game.jinPai = p;
        return;
    }
}

// ===== 计数表 =====
function rebuildCountMap(seatData){
    var cm = {};
    for(var i = 0; i < seatData.holds.length; ++i){
        var p = seatData.holds[i];
        cm[p] = (cm[p] || 0) + 1;
    }
    seatData.countMap = cm;
}

// 拆分手牌：真实牌计数表 + 金牌数（花牌永不入手牌）
function splitHolds(game, seatData){
    var cm = {};
    var wilds = 0;
    for(var i = 0; i < seatData.holds.length; ++i){
        var p = seatData.holds[i];
        if(isWild(game, p)){ wilds++; continue; }
        cm[p] = (cm[p] || 0) + 1;
    }
    return {cm:cm, wilds:wilds};
}

// ===== 面子组合：cm 中全部真实牌 + wilds 张金牌，必须恰好全部组成面子(顺/刻) =====
function canFormMelds(cm, wilds){
    var keys = [];
    for(var k in cm){ if(cm[k] > 0) keys.push(parseInt(k)); }
    if(keys.length == 0){
        return wilds % 3 == 0; // 纯金刻(3金=1刻)合法
    }
    keys.sort(function(a,b){ return a-b; });
    var t = keys[0];
    var c = cm[t];

    // 刻子：3真
    if(c >= 3){
        cm[t] -= 3;
        if(canFormMelds(cm, wilds)){ cm[t] += 3; return true; }
        cm[t] += 3;
    }
    // 刻子：2真+1金
    if(c >= 2 && wilds >= 1){
        cm[t] -= 2;
        if(canFormMelds(cm, wilds - 1)){ cm[t] += 2; return true; }
        cm[t] += 2;
    }
    // 刻子：1真+2金
    if(wilds >= 2){
        cm[t] -= 1;
        if(canFormMelds(cm, wilds - 2)){ cm[t] += 1; return true; }
        cm[t] += 1;
    }
    // 顺子（仅万筒条，t+1/t+2 缺几张用金补；v<=7 保证 t+2 不跨花色）
    if(!isZi(t)){
        var v = t % 9;
        if(v <= 7){
            var c2 = cm[t+1] || 0;
            var c3 = cm[t+2] || 0;
            var need = (c2 > 0 ? 0 : 1) + (c3 > 0 ? 0 : 1);
            if(need <= wilds){
                cm[t] -= 1;
                if(c2 > 0) cm[t+1] -= 1;
                if(c3 > 0) cm[t+2] -= 1;
                if(canFormMelds(cm, wilds - need)){
                    cm[t] += 1;
                    if(c2 > 0) cm[t+1] += 1;
                    if(c3 > 0) cm[t+2] += 1;
                    return true;
                }
                cm[t] += 1;
                if(c2 > 0) cm[t+1] += 1;
                if(c3 > 0) cm[t+2] += 1;
            }
        }
    }
    return false;
}

// 5组面子+1将（17张结构判定，金牌可代）
function checkHuStructure(cm, wilds){
    // 将：2真
    for(var k in cm){
        k = parseInt(k);
        if(cm[k] >= 2){
            cm[k] -= 2;
            if(canFormMelds(cm, wilds)){ cm[k] += 2; return true; }
            cm[k] += 2;
        }
    }
    // 将：1真+1金
    if(wilds >= 1){
        for(var k2 in cm){
            k2 = parseInt(k2);
            if(cm[k2] >= 1){
                cm[k2] -= 1;
                if(canFormMelds(cm, wilds - 1)){ cm[k2] += 1; return true; }
                cm[k2] += 1;
            }
        }
    }
    // 将：2金
    if(wilds >= 2){
        if(canFormMelds(cm, wilds - 2)) return true;
    }
    return false;
}

// 七对（16张玩法的17张结构：7对子+1刻，金牌可补）
function checkQiDui(cm, wilds){
    var total = wilds;
    for(var k in cm){ total += cm[k]; }
    if(total != 17) return false;

    function restAllPairs(cm2, w){
        var singles = 0;
        for(var k in cm2){
            if(cm2[k] % 2 == 1) singles++;
        }
        // 每个单牌配1金成对，剩余金两两成对
        return singles <= w && ((w - singles) % 2 == 0);
    }

    // 刻子候选：t 的 3-k 真 + k 金
    for(var k in cm){
        k = parseInt(k);
        for(var useWild = 0; useWild <= 2; ++useWild){
            if(cm[k] >= 3 - useWild && wilds >= useWild){
                cm[k] -= (3 - useWild);
                if(restAllPairs(cm, wilds - useWild)){ cm[k] += (3 - useWild); return true; }
                cm[k] += (3 - useWild);
            }
        }
    }
    // 刻子=3金
    if(wilds >= 3 && restAllPairs(cm, wilds - 3)) return true;
    return false;
}

// 自摸胡判定（自己回合，手牌 %3==2）
function canHuNow(game, seatData){
    if(seatData.holds.length % 3 != 2) return false;
    var sp = splitHolds(game, seatData);
    if(checkHuStructure(sp.cm, sp.wilds)) return true;
    if(checkQiDui(sp.cm, sp.wilds)) return true;
    return false;
}

// 点炮胡判定（他人打出 pai，手牌 %3==1）
function canDianPao(game, seatData, pai){
    if(isWild(game, pai)) return false;              // 金不可点炮
    if(countWildsInHolds(game, seatData) >= 2) return false; // 手里>=2金禁止点炮
    if(seatData.holds.length % 3 != 1) return false;
    var sp = splitHolds(game, seatData);
    sp.cm[pai] = (sp.cm[pai] || 0) + 1;
    if(checkHuStructure(sp.cm, sp.wilds)) return true;
    if(checkQiDui(sp.cm, sp.wilds)) return true;
    return false;
}

// 抢金判定：16张手牌 + 1张金牌(百搭) 成胡
function canQiangJin(game, seatData){
    if(seatData.holds.length % 3 != 1) return false;
    var sp = splitHolds(game, seatData);
    if(checkHuStructure(sp.cm, sp.wilds + 1)) return true;
    if(checkQiDui(sp.cm, sp.wilds + 1)) return true;
    return false;
}

// 游金候选：打出非金牌 X 后，手牌=5面子+1金（之后每摸一张即可胡）
function findYouJinDiscards(game, seatData){
    var res = [];
    if(seatData.holds.length % 3 != 2) return res;
    var seen = {};
    for(var i = 0; i < seatData.holds.length; ++i){
        var x = seatData.holds[i];
        if(isWild(game, x) || seen[x]) continue;
        seen[x] = true;
        // 移除 X 后拆分
        var cm = {};
        var wilds = 0;
        for(var j = 0; j < seatData.holds.length; ++j){
            var p = seatData.holds[j];
            if(j === i) continue;
            if(isWild(game, p)){ wilds++; continue; }
            cm[p] = (cm[p] || 0) + 1;
        }
        if(wilds < 1) continue;
        if(canFormMelds(cm, wilds - 1)) res.push(x);
    }
    return res;
}

// ===== 座位/房间工具 =====
function getSeatIndex(userId){
    return roomMgr.getUserSeat(userId);
}
function getGameByUserID(userId){
    var roomId = roomMgr.getUserRoom(userId);
    if(roomId == null) return null;
    return games[roomId];
}
function hasOperations(seatData){
    return seatData.canGang || seatData.canPeng || seatData.canHu || seatData.canChi || seatData.canQiangJin;
}

function clearAllOptions(game, seatData){
    var fnClear = function(sd){
        sd.canPeng = false;
        sd.canGang = false;
        sd.canChi = false;
        sd.canHu = false;
        sd.canQiangJin = false;
        sd.canYouJin = false;
        sd.canYouJinGo = false;
        sd.gangPai = [];
        sd.chiPai = null;
        sd.youJinPai = null;
    };
    if(seatData){ fnClear(seatData); }
    else{
        for(var i = 0; i < game.gameSeats.length; ++i){ fnClear(game.gameSeats[i]); }
    }
}

function sendOperations(game, seatData, pai){
    if(hasOperations(seatData) || seatData.canYouJin || seatData.canYouJinGo){
        if(pai == -1 || pai == null){
            pai = seatData.holds[seatData.holds.length - 1];
        }
        var data = {
            pai: pai,
            hu: seatData.canHu,
            peng: seatData.canPeng,
            gang: seatData.canGang,
            chi: seatData.canChi,
            gangpai: seatData.gangPai,
            chipai: seatData.chiPai,
            qiangjin: seatData.canQiangJin,
            youjin: seatData.youJinPai,      // 可宣告游金的打出候选数组(null=无)
            youjingo: seatData.canYouJinGo   // 游金继续(下一级)
        };
        console.log("[zp] ops to", seatData.userId, "pai=", pai, "hu=", data.hu, "peng=", data.peng, "gang=", data.gang, "chi=", data.chi, "qiangjin=", data.qiangjin, "youjin=", JSON.stringify(data.youjin), "youjingo=", data.youjingo);
        userMgr.sendMsg(seatData.userId, 'game_action_push', data);
    } else {
        userMgr.sendMsg(seatData.userId, 'game_action_push');
    }
}

// 个性化推送：actionSeat 收到完整 holds，其他人只收到数量
function sendOpToAll(game, event, build){
    for(var i = 0; i < SEAT_COUNT; ++i){
        var sd = game.gameSeats[i];
        var data = build(i, sd);
        userMgr.sendMsg(sd.userId, event, data);
    }
}

// ===== 操作检测（全部基于真实牌，金不代牌）=====
function checkCanPeng(game, seatData, targetPai){
    if(isWild(game, targetPai) || isFlower(targetPai)) return;
    if((seatData.countMap[targetPai] || 0) >= 2){
        seatData.canPeng = true;
    }
}
function checkCanGangDian(game, seatData, targetPai){
    if(numOfMJ(game) <= 0) return;
    if(isWild(game, targetPai) || isFlower(targetPai)) return;
    if((seatData.countMap[targetPai] || 0) >= 3){
        seatData.canGang = true;
        seatData.gangPai.push(targetPai);
    }
}
function checkCanAnGang(game, seatData){
    if(numOfMJ(game) <= 0) return;
    var sp = splitHolds(game, seatData); // 只用真实牌计数
    for(var k in sp.cm){
        if(sp.cm[k] == 4){
            seatData.canGang = true;
            seatData.gangPai.push(parseInt(k));
        }
    }
}
function checkCanWanGang(game, seatData){
    if(numOfMJ(game) <= 0) return;
    for(var i = 0; i < seatData.pengs.length; ++i){
        var pai = seatData.pengs[i];
        // 必须手里有真实的第4张
        if((seatData.countMap[pai] || 0) >= 1 && !isWild(game, pai)){
            seatData.canGang = true;
            seatData.gangPai.push(pai);
        }
    }
}
// 吃：仅上家打出的牌；组合的两张手牌必须为真实非金牌
function checkCanChi(game, seatData, targetPai, discarderSeat){
    if(isWild(game, targetPai) || isFlower(targetPai) || isZi(targetPai)) return;
    if((discarderSeat + 1) % SEAT_COUNT != seatData.seatIndex) return; // 只能吃上家
    var type = getMJType(targetPai);
    var cm = seatData.countMap;
    var combos = [
        [targetPai - 2, targetPai - 1],
        [targetPai - 1, targetPai + 1],
        [targetPai + 1, targetPai + 2]
    ];
    for(var i = 0; i < combos.length; ++i){
        var p1 = combos[i][0], p2 = combos[i][1];
        if(p1 >= type*9 && p1 < type*9+9 && p2 >= type*9 && p2 < type*9+9){
            if((cm[p1] || 0) > 0 && !isWild(game, p1) && (cm[p2] || 0) > 0 && !isWild(game, p2)){
                seatData.canChi = true;
                if(!seatData.chiPai) seatData.chiPai = [];
                seatData.chiPai.push([p1, p2, targetPai]);
            }
        }
    }
}

// ===== 计时器 =====
function clearMoPaiTimeout(game){
    if(game && game.mopaiTimeoutId){ clearTimeout(game.mopaiTimeoutId); game.mopaiTimeoutId = null; }
}
function scheduleMoPai(game){
    clearMoPaiTimeout(game);
    game.mopaiTimeoutId = setTimeout(function(){
        game.mopaiTimeoutId = null;
        doUserMoPai(game);
    }, 500);
}
function clearTurnTimeout(game){
    if(game && game.turnTimeoutId){ clearTimeout(game.turnTimeoutId); game.turnTimeoutId = null; }
}
// isAction=true: 操作超时自动过（含出牌轮次挂起的所有pending操作）
function scheduleTurnTimeout(game, seatIndex, isAction){
    clearTurnTimeout(game);
    var sec = getChupaiTimeout(game);
    if(sec <= 0) return;
    game.turnTimeoutId = setTimeout(function(){
        game.turnTimeoutId = null;
        if(!game || game.gameOver) return;
        if(isAction){
            console.log("[zp托管] 操作超时自动过");
            // 游金决策超时自动胡
            var ts = game.gameSeats[seatIndex];
            if(ts && ts.canYouJinGo && ts.canHu){ exports.hu(ts.userId); return; }
            autoGuoAll(game);
            return;
        }
        var sd = game.gameSeats[seatIndex];
        if(!sd || sd.userId <= 0) return;
        if(seatIndex != game.turn) return;
        var pai = sd.holds[sd.holds.length - 1];
        if(pai != null && pai >= 0){
            console.log("[zp托管] 出牌超时系统代打 userId=", sd.userId, "pai=", pai);
            exports.chuPai(sd.userId, pai);
        }
    }, sec * 1000);
}
function autoGuoAll(game){
    var acted = false;
    for(var i = 0; i < SEAT_COUNT; ++i){
        var sd = game.gameSeats[i];
        if(hasOperations(sd)){
            clearAllOptions(game, sd);
            userMgr.sendMsg(sd.userId, 'game_action_push');
            acted = true;
        }
    }
    if(acted){
        game.pendingOps = null;
        moveToNextUser(game);
        scheduleMoPai(game);
    }
}

function moveToNextUser(game){
    game.turn = (game.turn + 1) % SEAT_COUNT;
}

// ===== 摸牌主流程 =====
function doUserMoPai(game){
    if(!game || game.gameOver) return;
    game.chuPai = -1;
    var turnSeat = game.gameSeats[game.turn];
    game.pendingHua = [];
    var pai = mopai(game, game.turn, game.gangBuPai === true);
    game.gangBuPai = false;

    // 先推送本回合所有补花
    if(game.pendingHua.length > 0){
        var roomId0 = roomMgr.getRoomIdOfUser(turnSeat.userId);
        for(var h = 0; h < game.pendingHua.length; ++h){
            var hu = game.pendingHua[h];
            userMgr.brocastInRoom(roomId0, 'game_hua_push', {
                si: hu.si, pai: hu.pai,
                hua: game.gameSeats[hu.si].hua.slice(),
                numofmj: numOfMJ(game)
            });
        }
        game.pendingHua = [];
    }

    if(pai == -1){
        doGameOver(game); // 流局
        return;
    }

    turnSeat.lastMoPai = pai;
    rebuildCountMap(turnSeat);
    clearAllOptions(game, turnSeat);

    if(turnSeat.youJinLevel > 0){
        // 游金中：每摸一张即可胡
        turnSeat.canHu = true;
        if(turnSeat.youJinLevel < taiRule(game, 'you_jin_max', 3)){
            turnSeat.canYouJinGo = true;
        }
    } else {
        checkCanAnGang(game, turnSeat);
        checkCanWanGang(game, turnSeat);
        if(canHuNow(game, turnSeat)){
            turnSeat.canHu = true;
        }
        // 三金倒
        if(countWildsInHolds(game, turnSeat) >= 3){
            turnSeat.canHu = true;
        }
        // 游金候选
        var yj = findYouJinDiscards(game, turnSeat);
        if(yj.length > 0){
            turnSeat.canYouJin = true;
            turnSeat.youJinPai = yj;
        }
    }

    sendOperations(game, turnSeat, pai);

    // 个性化摸牌推送
    sendOpToAll(game, 'game_mopai_push', function(i, sd){
        var isTurn = (i == game.turn);
        return {
            si: game.turn,
            pai: isTurn ? pai : -1,
            numofmj: numOfMJ(game),
            holds: isTurn ? turnSeat.holds.slice() : turnSeat.holds.length,
            hua: sd.hua.slice(),
            youjin: game.gameSeats[i].youJinLevel || 0
        };
    });

    scheduleTurnTimeout(game, game.turn, false);
}

// ===== 结算 =====
// 牌型台：清一色/混一色/七对（基于真实牌判定）
function patternTai(game, seatData, sp){
    var tai = 0;
    var logs = [];
    // 七对
    if(checkQiDui(sp.cm, sp.wilds)){
        var t0 = taiRule(game, 'qi_dui', 3);
        if(t0 > 0){ tai += t0; logs.push("七对+" + t0); }
        return {tai:tai, logs:logs}; // 七对不再算一色
    }
    // 一色判定（真实牌）
    var suitSet = {};
    for(var k in sp.cm){
        var t = getMJType(parseInt(k));
        if(t < 3) suitSet[t] = true;
        else if(t == 3) suitSet['zi'] = true;
    }
    // 副露也算入一色判定
    var meldTiles = [];
    for(var i = 0; i < seatData.pengs.length; ++i) meldTiles.push(seatData.pengs[i]);
    for(var i = 0; i < seatData.gangs.length; ++i) meldTiles.push(seatData.gangs[i].pai);
    for(var i = 0; i < seatData.chis.length; ++i){
        for(var j = 0; j < seatData.chis[i].length; ++j) meldTiles.push(seatData.chis[i][j]);
    }
    for(var i = 0; i < meldTiles.length; ++i){
        var mt = getMJType(meldTiles[i]);
        if(mt < 3) suitSet[mt] = true;
        else if(mt == 3) suitSet['zi'] = true;
    }
    var suitCount = Object.keys(suitSet).length;
    if(suitCount == 1 && !suitSet['zi']){
        var t1 = taiRule(game, 'qing_yise', 3);
        if(t1 > 0){ tai += t1; logs.push("清一色+" + t1); }
    } else if(suitCount == 2 && suitSet['zi']){
        var t2 = taiRule(game, 'hun_yise', 1);
        if(t2 > 0){ tai += t2; logs.push("混一色+" + t2); }
    }
    return {tai:tai, logs:logs};
}

// 台数计算：返回 {tai, tailog}
function calculateTai(game, seatData, opts){
    // opts: {isZimo, extra:{gangKai,qiangGang,sanJinDao,qiangJin}}
    var tailog = [];
    var tai = 0;
    var sp = splitHolds(game, seatData);

    // 花牌
    if(seatData.hua.length > 0){
        var th = taiRule(game, 'hua_tai', 1) * seatData.hua.length;
        tai += th; tailog.push("花牌" + seatData.hua.length + "朵+" + th);
    }
    // 金牌
    if(sp.wilds > 0){
        var tj = taiRule(game, 'jin_tai', 1) * sp.wilds;
        tai += tj; tailog.push("金牌" + sp.wilds + "张+" + tj);
    }
    // 杠
    var ming = 0, an = 0;
    for(var g = 0; g < seatData.gangs.length; ++g){
        if(seatData.gangs[g].type == 'an') an++; else ming++;
    }
    if(ming > 0){ var tm = taiRule(game, 'ming_gang', 1) * ming; tai += tm; tailog.push("明杠" + ming + "个+" + tm); }
    if(an > 0){ var ta = taiRule(game, 'an_gang', 2) * an; tai += ta; tailog.push("暗杠" + an + "个+" + ta); }

    // 特殊
    if(opts.extra){
        if(opts.extra.sanJinDao){ var t3 = taiRule(game, 'san_jin_dao', 2); tai += t3; tailog.push("三金倒+" + t3); }
        if(opts.extra.qiangJin){ var t4 = taiRule(game, 'qiang_jin', 2); tai += t4; tailog.push("抢金+" + t4); }
        if(opts.extra.gangKai){ var t5 = taiRule(game, 'gang_kai', 1); tai += t5; tailog.push("杠上开花+" + t5); }
        if(opts.extra.qiangGang){ var t6 = taiRule(game, 'qiang_gang', 1); tai += t6; tailog.push("抢杠胡+" + t6); }
    }

    // 牌型（七对/清一色/混一色）
    var pt = patternTai(game, seatData, sp);
    tai += pt.tai; tailog = tailog.concat(pt.logs);

    // 平胡（无加台牌型时的基础台，可配默认0）
    var tph = taiRule(game, 'ping_hu', 0);
    if(tph > 0 && pt.tai == 0){ tai += tph; tailog.push("平胡+" + tph); }

    return {tai:tai, tailog:tailog};
}

// 胡牌结算：huType: zimo/dianpao/sanjindao/qiangjin/qianggang/gangkai；payFrom: 点炮/抢杠赔付座位(-1=各家)
function doHuSettle(game, seatIndex, huPai, huType, payFrom){
    var seatData = game.gameSeats[seatIndex];
    var isZimoPay = (payFrom == -1);
    var extra = {
        sanJinDao: huType == 'sanjindao',
        qiangJin: huType == 'qiangjin',
        qiangGang: huType == 'qianggang',
        gangKai: huType == 'gangkai' || (huType == 'zimo' && seatData.lastGangHua)
    };
    var r = calculateTai(game, seatData, {isZimo: isZimoPay, extra: extra});
    var tai = r.tai;
    var maxTai = game.maxTai || 10;
    var capped = false;
    if(tai > maxTai){ tai = maxTai; capped = true; }
    var baseScore = game.conf.baseScore || 1;
    var score = baseScore * Math.pow(2, tai);
    // 游金翻倍
    if(seatData.youJinLevel > 0){
        var multi = taiRule(game, 'you_jin_multi', 2);
        score = score * Math.pow(multi, seatData.youJinLevel);
        r.tailog.push("游金" + seatData.youJinLevel + "游×" + Math.pow(multi, seatData.youJinLevel));
    }
    score = Math.floor(score);
    if(capped) r.tailog.push("封顶" + maxTai + "台");

    // 赔付
    var roomId = roomMgr.getRoomIdOfUser(seatData.userId);
    var roomInfo = roomMgr.getRoom(roomId);
    if(isZimoPay){
        for(var i = 0; i < SEAT_COUNT; ++i){
            if(i != seatIndex){
                game.gameSeats[i].score -= score;
                seatData.score += score;
            }
        }
    } else {
        game.gameSeats[payFrom].score -= score;
        seatData.score += score;
        game.gameSeats[payFrom].fangpaoInfo = {pai: huPai, target: seatData.userId};
    }

    // 统计
    if(roomInfo){
        var rs = roomInfo.seats[seatIndex];
        if(isZimoPay) rs.numZiMo = (rs.numZiMo || 0) + 1; else rs.numJiePao = (rs.numJiePao || 0) + 1;
        if(!isZimoPay) roomInfo.seats[payFrom].numDianPao = (roomInfo.seats[payFrom].numDianPao || 0) + 1;
    }

    seatData.hued = true;
    seatData.huInfo = {hupai: huPai, zimo: isZimoPay, tai: tai, huType: huType};
    seatData.taiLog = r.tailog;

    console.log("[zp胡牌] user=", seatData.userId, "type=", huType, "huPai=", huPai, "jin=", game.jinPai, "tai=", tai, "score=", score, "holds=", JSON.stringify(seatData.holds), "hua=", JSON.stringify(seatData.hua), "tailog=", JSON.stringify(r.tailog));

    userMgr.brocastInRoom(roomId, 'game_hu_push', {
        si: seatIndex,
        pai: huPai,
        zimo: isZimoPay,
        tai: tai,
        tailog: r.tailog,
        score: score,
        hutype: huType
    });

    clearTurnTimeout(game);
    setTimeout(function(){ doGameOver(game); }, 1500);
}

// ===== 流局/一局结束 =====
function doGameOver(game){
    game.gameOver = true;
    clearTurnTimeout(game);
    clearMoPaiTimeout(game);
    var roomId = roomMgr.getRoomIdOfUser(game.gameSeats[0].userId);
    var roomInfo = roomMgr.getRoom(roomId);
    if(roomInfo == null) return;

    var results = [];
    for(var i = 0; i < SEAT_COUNT; ++i){
        var seat = game.gameSeats[i];
        var angangs = [], diangangs = [], wangangs = [];
        for(var g = 0; g < seat.gangs.length; ++g){
            var gang = seat.gangs[g];
            if(gang.type == 'an') angangs.push(gang.pai);
            else if(gang.type == 'ming') diangangs.push(gang.pai);
            else if(gang.type == 'wan') wangangs.push(gang.pai);
        }
        var huinfo = [];
        if(seat.hued && seat.huInfo){
            huinfo.push({
                ishupai: true,
                pai: seat.huInfo.hupai,
                action: seat.huInfo.zimo ? 'zimo' : 'hu',
                pattern: seat.huInfo.huType || '',
                haidihu: false, tianhu: false, dihu: false,
                fan: seat.huInfo.tai,
                tailog: seat.taiLog || [],
                numofgen: 0
            });
        }
        if(seat.fangpaoInfo){
            huinfo.push({
                ishupai: false,
                pai: seat.fangpaoInfo.pai,
                action: 'fangpao',
                pattern: '', haidihu: false, tianhu: false, dihu: false,
                fan: 0, numofgen: 0,
                target: seat.fangpaoInfo.target, index: 0
            });
        }
        results.push({
            userid: seat.userId,
            name: seat.name,
            seatindex: i,
            score: seat.score - (seat.startScore || 0),
            totalscore: seat.score,
            holds: seat.holds.slice(),
            pengs: seat.pengs.slice(),
            chis: seat.chis.slice(),
            folds: seat.folds ? seat.folds.slice() : [],
            hua: seat.hua.slice(),
            angangs: angangs,
            diangangs: diangangs,
            wangangs: wangangs,
            huinfo: huinfo,
            dingque: -1,
            qingyise: false, menqing: false, jingouhu: false, zhongzhang: false
        });
        roomInfo.seats[i].score = seat.score;
    }

    // 连庄：庄胡 或 流局(无人胡) 都连庄
    roomInfo.lastHuIsBanker = false;
    var anyHu = false;
    for(var i = 0; i < SEAT_COUNT; ++i){
        if(game.gameSeats[i].hued){
            anyHu = true;
            if(i == game.button) roomInfo.lastHuIsBanker = true;
        }
    }
    if(!anyHu) roomInfo.lastHuIsBanker = true; // 流局荒庄连庄

    if(!roomInfo.roundHistory) roomInfo.roundHistory = [];
    var roundItem = {index: roomInfo.numOfGames, scores: []};
    for(var i = 0; i < SEAT_COUNT; ++i){
        var scoreItem = {userid: results[i].userid, name: results[i].name, score: results[i].score};
        if(results[i].huinfo && results[i].huinfo.length > 0){
            for(var h = 0; h < results[i].huinfo.length; ++h){
                var hi = results[i].huinfo[h];
                if(hi && hi.ishupai){ scoreItem.tai = hi.fan || 0; scoreItem.zimo = (hi.action == 'zimo'); break; }
            }
        }
        roundItem.scores.push(scoreItem);
    }
    roomInfo.roundHistory.push(roundItem);

    var pushData = {results: results};
    if(roomInfo.numOfGames >= roomInfo.conf.maxGames){
        var endinfo = [];
        for(var i = 0; i < SEAT_COUNT; ++i){
            var rs = roomInfo.seats[i];
            endinfo.push({
                numzimo: rs.numZiMo || 0,
                numjiepao: rs.numJiePao || 0,
                numdianpao: rs.numDianPao || 0,
                numangang: rs.numAnGang || 0,
                numminggang: rs.numMingGang || 0,
                numchadajiao: rs.numChaJiao || 0
            });
        }
        pushData.endinfo = endinfo;
        pushData.final = true;
        pushData.roundHistory = roomInfo.roundHistory || [];
    }

    userMgr.brocastInRoom(roomId, 'game_over_push', pushData);
    // 缓存最近一局结算:结算停留期断线/重进时由 resendGameState 补发
    game.lastResult = pushData;

    // 房卡扣除：第一局结束一次性扣除整局房卡(中途解散不退)
    var cost = roomInfo.conf.cost || 0;
    var creator = roomInfo.conf.creator;
    if(creator && roomInfo.numOfGames === 1 && cost > 0){
        db.cost_gems(creator, cost, function(success){
            console.log("[zp房卡扣除] 房主", creator, "扣除", cost, "结果:", success);
        });
    }

    var index = roomInfo.numOfGames;
    var baseInfo = JSON.stringify({button: game.button, jinPai: game.jinPai, fanPai: game.fanPai});
    var dbResults = [];
    for(var i = 0; i < SEAT_COUNT; ++i){
        dbResults.push({userid: results[i].userid, totalscore: results[i].totalscore});
    }
    db.create_game(roomInfo.uuid, index, baseInfo, function(){
        db.update_game_result(roomInfo.uuid, index, JSON.stringify(dbResults), function(){});
    });

    if(roomInfo.numOfGames >= roomInfo.conf.maxGames){
        var historyItem = {
            id: roomInfo.id, uuid: roomInfo.uuid,
            time: Math.ceil(Date.now()/1000), seats: []
        };
        for(var i = 0; i < SEAT_COUNT; ++i){
            historyItem.seats.push({name: roomInfo.seats[i].name, score: roomInfo.seats[i].score});
        }
        for(var i = 0; i < SEAT_COUNT; ++i){
            (function(seatIdx){
                var uid = roomInfo.seats[seatIdx].userId;
                db.get_user_history(uid, function(oldHistory){
                    var history = oldHistory || [];
                    history.unshift(historyItem);
                    if(history.length > 20) history = history.slice(0, 20);
                    db.update_user_history(uid, history, function(){});
                });
            })(i);
        }
    }
}

// ===== 操作优先级：胡3 > 碰/杠2 > 吃1 =====
function opPriority(sd){
    if(sd.canHu) return 3;
    if(sd.canGang || sd.canPeng) return 2;
    if(sd.canChi) return 1;
    return 0;
}
// 是否有其他座位持有更高优先级的未决操作
function hasHigherPending(game, seatIndex, pri){
    if(!game.pendingOps) return false;
    for(var si in game.pendingOps){
        si = parseInt(si);
        if(si == seatIndex) continue;
        var p = game.pendingOps[si];
        if(!p.resolved && opPriority(game.gameSeats[si]) > pri) return true;
    }
    return false;
}
function allPendingResolved(game){
    if(!game.pendingOps) return true;
    for(var si in game.pendingOps){
        if(!game.pendingOps[si].resolved) return false;
    }
    return true;
}
function clearPendingOps(game){
    game.pendingOps = null;
}

// ===== 出牌 =====
exports.chuPai = function(userId, pai){
    var game = getGameByUserID(userId);
    if(game == null || game.gameOver) return;
    var seatIndex = getSeatIndex(userId);
    if(seatIndex == null || seatIndex != game.turn) return;
    // 上一次出牌后对家还有未处理的吃/碰/杠/胡选择时禁止再出牌(必须等其过/吃/碰/杠,防止连打顶掉操作弹窗)
    for(var i = 0; i < SEAT_COUNT; ++i){
        if(i != seatIndex && hasOperations(game.gameSeats[i])) return;
    }
    var seatData = game.gameSeats[seatIndex];
    var idx = seatData.holds.indexOf(pai);
    if(idx == -1) return;
    // 上面校验全部通过才算有效出牌,此时才清倒计时
    // (不能在函数开头清:被拒绝的出牌尝试会清掉对家的操作倒计时,对家不响应时永远无法超时托管代过,双方都打不出牌)
    clearTurnTimeout(game);

    // 出牌即清掉自己摸牌后的操作选项
    clearAllOptions(game, seatData);
    userMgr.sendMsg(userId, 'game_action_push');

    seatData.holds.splice(idx, 1);
    rebuildCountMap(seatData);
    if(seatData.folds == null) seatData.folds = [];
    seatData.folds.push(pai);
    game.chuPai = pai;
    seatData.lastGangHua = false;

    var roomId = roomMgr.getRoomIdOfUser(userId);
    userMgr.brocastInRoom(roomId, 'game_chupai_push', {si: seatIndex, pai: pai});
    sendOpToAll(game, 'game_chupai_notify_push', function(i, sd){
        return {
            userId: seatData.userId,
            pai: pai,
            holds: (i == seatIndex) ? seatData.holds.slice() : seatData.holds.length
        };
    });

    // 分饼（4人版且后台开启）：各家首张出牌均与庄家首张相同 → 庄家赔各家底分
    if(SEAT_COUNT == 4 && taiRule(game, 'fenbing', 0) == 1 && !game.fenbingDone){
        if(game.firstDiscards == null) game.firstDiscards = {};
        if(game.firstDiscards[seatIndex] == null){
            game.firstDiscards[seatIndex] = pai;
            var btn = game.button;
            if(seatIndex != btn && game.firstDiscards[btn] != null){
                var allSame = true;
                for(var i = 0; i < SEAT_COUNT; ++i){
                    if(i == btn) continue;
                    if(game.firstDiscards[i] == null || game.firstDiscards[i] != game.firstDiscards[btn]){ allSame = false; break; }
                }
                if(allSame){
                    game.fenbingDone = true;
                    var bs = game.conf.baseScore || 1;
                    for(var i = 0; i < SEAT_COUNT; ++i){
                        if(i == btn) continue;
                        game.gameSeats[btn].score -= bs;
                        game.gameSeats[i].score += bs;
                    }
                    userMgr.brocastInRoom(roomId, 'game_fenbing_push', {si: btn, score: bs});
                    console.log("[zp分饼] 庄家", game.gameSeats[btn].userId, "赔各家", bs);
                }
            }
        }
    }

    // 金牌打出：任何人不可吃碰杠胡
    if(isWild(game, pai)){
        moveToNextUser(game);
        scheduleMoPai(game);
        return;
    }
    // 游金期间：其他人只能自摸，不可吃碰杠胡
    var youjinActive = false;
    for(var i = 0; i < SEAT_COUNT; ++i){
        if(game.gameSeats[i].youJinLevel > 0){ youjinActive = true; break; }
    }
    if(youjinActive){
        moveToNextUser(game);
        scheduleMoPai(game);
        return;
    }

    // 检测其他玩家操作
    clearPendingOps(game);
    var pending = {};
    for(var i = 0; i < SEAT_COUNT; ++i){
        if(i == seatIndex) continue;
        var sd = game.gameSeats[i];
        clearAllOptions(game, sd);
        rebuildCountMap(sd);
        checkCanPeng(game, sd, pai);
        checkCanGangDian(game, sd, pai);
        checkCanChi(game, sd, pai, seatIndex);
        if(canDianPao(game, sd, pai)) sd.canHu = true;
        if(hasOperations(sd)){
            pending[i] = {resolved: false};
            sendOperations(game, sd, pai);
        } else {
            userMgr.sendMsg(sd.userId, 'game_action_push');
        }
    }
    if(Object.keys(pending).length == 0){
        moveToNextUser(game);
        scheduleMoPai(game);
        return;
    }
    game.pendingOps = pending;
    scheduleTurnTimeout(game, seatIndex, true);
};

// ===== 碰 =====
exports.peng = function(userId){
    var game = getGameByUserID(userId);
    if(game == null || game.gameOver) return;
    clearTurnTimeout(game);
    var seatIndex = getSeatIndex(userId);
    var seatData = game.gameSeats[seatIndex];
    if(!seatData.canPeng) return;
    if(hasHigherPending(game, seatIndex, 2)){
        sendOperations(game, seatData, game.chuPai); // 有更高优先级未决，重发选项
        return;
    }

    var pai = game.chuPai;
    for(var i = 0; i < 2; ++i){
        var idx = seatData.holds.indexOf(pai);
        if(idx != -1) seatData.holds.splice(idx, 1);
    }
    seatData.pengs.push(pai);
    seatData.pengTiles.push([pai, pai, pai]);
    rebuildCountMap(seatData);
    // 从出牌者弃牌堆移除
    var discarder = game.gameSeats[game.turn];
    if(discarder && discarder.folds){
        var fi = discarder.folds.lastIndexOf(pai);
        if(fi != -1) discarder.folds.splice(fi, 1);
    }
    game.turn = seatIndex;
    game.chuPai = -1;
    game.qiangJinOpen = false; // 有人吃碰，抢金窗口关闭
    for(var i = 0; i < SEAT_COUNT; ++i){ game.gameSeats[i].canQiangJin = false; }
    clearPendingOps(game);
    clearAllOptions(game);

    var roomId = roomMgr.getRoomIdOfUser(userId);
    sendOpToAll(game, 'game_peng_push', function(i, sd){
        return {
            si: seatIndex, pai: pai,
            holds: (i == seatIndex) ? seatData.holds.slice() : seatData.holds.length,
            pengTiles: JSON.parse(JSON.stringify(seatData.pengTiles))
        };
    });
    scheduleTurnTimeout(game, seatIndex, false);
};

// ===== 吃 =====
exports.chi = function(userId, chiPais){
    var game = getGameByUserID(userId);
    if(game == null || game.gameOver) return;
    clearTurnTimeout(game);
    var seatIndex = getSeatIndex(userId);
    var seatData = game.gameSeats[seatIndex];
    if(!seatData.canChi || !chiPais || chiPais.length != 3) return;
    if(hasHigherPending(game, seatIndex, 1)){
        sendOperations(game, seatData, game.chuPai);
        return;
    }

    var pai = game.chuPai;
    var p1 = chiPais[0], p2 = chiPais[1];
    // 校验：目标牌为当前弃牌，另两张为手中真实非金牌，且能组成顺子
    if(chiPais[2] != pai && chiPais[0] != pai && chiPais[1] != pai){
        // chiPais 约定为 [p1,p2,target]
    }
    var target = pai;
    var others = [];
    for(var i = 0; i < 3; ++i){ if(chiPais[i] != target) others.push(chiPais[i]); }
    if(others.length != 2) return;
    p1 = others[0]; p2 = others[1];
    if(isWild(game, p1) || isWild(game, p2) || isWild(game, target)) return;
    var i1 = seatData.holds.indexOf(p1);
    var i2 = i1 == -1 ? -1 : seatData.holds.indexOf(p2, i1 + 1);
    if(p1 == p2){ i2 = seatData.holds.indexOf(p2, i1 + 1); }
    if(i1 == -1 || i2 == -1) return;
    // 顺子校验
    var arr = [p1, p2, target].sort(function(a,b){ return a-b; });
    if(getMJType(arr[0]) != getMJType(arr[2])) return;
    if(arr[1] != arr[0] + 1 || arr[2] != arr[0] + 2) return;

    seatData.holds.splice(i2, 1);
    seatData.holds.splice(i1, 1);
    seatData.chis.push(arr);
    rebuildCountMap(seatData);
    var discarder = game.gameSeats[game.turn];
    if(discarder && discarder.folds){
        var fi = discarder.folds.lastIndexOf(target);
        if(fi != -1) discarder.folds.splice(fi, 1);
    }
    game.turn = seatIndex;
    game.chuPai = -1;
    game.qiangJinOpen = false;
    for(var i = 0; i < SEAT_COUNT; ++i){ game.gameSeats[i].canQiangJin = false; }
    clearPendingOps(game);
    clearAllOptions(game);

    sendOpToAll(game, 'game_chi_push', function(i, sd){
        return {
            si: seatIndex, pais: arr,
            holds: (i == seatIndex) ? seatData.holds.slice() : seatData.holds.length
        };
    });
    scheduleTurnTimeout(game, seatIndex, false);
};

// ===== 杠 =====
exports.gang = function(userId, pai){
    var game = getGameByUserID(userId);
    if(game == null || game.gameOver) return;
    clearTurnTimeout(game);
    var seatIndex = getSeatIndex(userId);
    var seatData = game.gameSeats[seatIndex];
    if(!seatData.canGang || seatData.gangPai.indexOf(pai) == -1) return;

    var sp = splitHolds(game, seatData);
    var isAnGang = (sp.cm[pai] == 4);
    var isWanGang = !isAnGang && seatData.pengs.indexOf(pai) != -1 && (sp.cm[pai] || 0) >= 1;
    var isDianGang = !isAnGang && !isWanGang && game.chuPai == pai && (sp.cm[pai] || 0) >= 3;

    if(isDianGang && hasHigherPending(game, seatIndex, 2)){
        sendOperations(game, seatData, game.chuPai);
        return;
    }

    if(isWanGang){
        // 弯杠（真牌）：先检查抢杠胡
        game.qiangGangState = {si: seatIndex, pai: pai};
        var anyQG = false;
        for(var i = 0; i < SEAT_COUNT; ++i){
            if(i == seatIndex) continue;
            var sd = game.gameSeats[i];
            clearAllOptions(game, sd);
            rebuildCountMap(sd);
            if(canDianPao(game, sd, pai)){
                sd.canHu = true;
                sendOperations(game, sd, pai);
                anyQG = true;
            }
        }
        if(anyQG){
            // 暂停弯杠，等待抢杠胡/过；杠者保留杠选项
            var pend = {};
            for(var i = 0; i < SEAT_COUNT; ++i){
                if(i != seatIndex && game.gameSeats[i].canHu) pend[i] = {resolved:false};
            }
            game.pendingOps = pend;
            scheduleTurnTimeout(game, seatIndex, true);
            return;
        }
        game.qiangGangState = null;
        doGang(game, seatIndex, pai, 'wan');
        return;
    }

    if(isAnGang){ doGang(game, seatIndex, pai, 'an'); return; }
    if(isDianGang){ doGang(game, seatIndex, pai, 'ming'); return; }
};

function doGang(game, seatIndex, pai, gangtype){
    var seatData = game.gameSeats[seatIndex];
    var removeCount = (gangtype == 'an') ? 4 : (gangtype == 'ming' ? 3 : 1);
    for(var i = 0; i < removeCount; ++i){
        var idx = seatData.holds.indexOf(pai);
        if(idx != -1) seatData.holds.splice(idx, 1);
    }
    if(gangtype == 'wan'){
        var pi = seatData.pengs.indexOf(pai);
        if(pi != -1) seatData.pengs.splice(pi, 1);
        if(seatData.pengTiles){
            for(var t = 0; t < seatData.pengTiles.length; ++t){
                if(seatData.pengTiles[t] && seatData.pengTiles[t][0] == pai){
                    seatData.pengTiles.splice(t, 1);
                    break;
                }
            }
        }
    }
    if(gangtype == 'ming'){
        var discarder = game.gameSeats[game.turn];
        if(discarder && discarder.folds){
            var fi = discarder.folds.lastIndexOf(pai);
            if(fi != -1) discarder.folds.splice(fi, 1);
        }
    }
    seatData.gangs.push({pai: pai, type: gangtype});
    rebuildCountMap(seatData);

    var roomId = roomMgr.getRoomIdOfUser(seatData.userId);
    if(roomId){
        var roomInfo = roomMgr.getRoom(roomId);
        if(roomInfo){
            if(gangtype == 'an') roomInfo.seats[seatIndex].numAnGang = (roomInfo.seats[seatIndex].numAnGang || 0) + 1;
            else roomInfo.seats[seatIndex].numMingGang = (roomInfo.seats[seatIndex].numMingGang || 0) + 1;
        }
    }

    game.turn = seatIndex;
    game.chuPai = -1;
    game.qiangJinOpen = false;
    for(var i = 0; i < SEAT_COUNT; ++i){ game.gameSeats[i].canQiangJin = false; }
    clearPendingOps(game);
    clearAllOptions(game);
    seatData.lastGangHua = true; // 杠后补牌胡=杠上开花
    game.gangBuPai = true;       // 杠补取自牌墙尾部

    sendOpToAll(game, 'game_gang_push', function(i, sd){
        return {
            si: seatIndex, pai: pai, gangtype: gangtype,
            holds: (i == seatIndex) ? seatData.holds.slice() : seatData.holds.length,
            pengs: seatData.pengs.slice(),
            pengTiles: JSON.parse(JSON.stringify(seatData.pengTiles))
        };
    });

    scheduleMoPai(game);
}

// ===== 胡 =====
exports.hu = function(userId){
    var game = getGameByUserID(userId);
    if(game == null || game.gameOver) return;
    clearTurnTimeout(game);
    clearMoPaiTimeout(game);
    var seatIndex = getSeatIndex(userId);
    var seatData = game.gameSeats[seatIndex];

    // 1) 抢杠胡
    if(seatData.canHu && game.qiangGangState && game.qiangGangState.si != seatIndex){
        var pai = game.qiangGangState.pai;
        var gangSeat = game.qiangGangState.si;
        seatData.holds.push(pai);
        rebuildCountMap(seatData);
        game.qiangGangState = null;
        clearPendingOps(game);
        clearAllOptions(game);
        doHuSettle(game, seatIndex, pai, 'qianggang', gangSeat);
        return;
    }

    // 2) 点炮胡（他人出牌）
    if(seatData.canHu && game.chuPai != -1 && game.turn != seatIndex){
        var pai = game.chuPai;
        var fromSeat = game.turn;
        seatData.holds.push(pai);
        rebuildCountMap(seatData);
        var discarder = game.gameSeats[fromSeat];
        if(discarder && discarder.folds){
            var fi = discarder.folds.lastIndexOf(pai);
            if(fi != -1) discarder.folds.splice(fi, 1);
        }
        game.chuPai = -1;
        clearPendingOps(game);
        clearAllOptions(game);
        doHuSettle(game, seatIndex, pai, 'dianpao', fromSeat);
        return;
    }

    // 3) 自摸/三金倒/天胡（自己回合，刚摸过牌）
    if(seatData.canHu && game.turn == seatIndex){
        var huPai = seatData.lastMoPai != null ? seatData.lastMoPai : seatData.holds[seatData.holds.length - 1];
        var huType = 'zimo';
        if(countWildsInHolds(game, seatData) >= 3) huType = 'sanjindao';
        else if(seatData.lastGangHua) huType = 'gangkai';
        clearAllOptions(game);
        doHuSettle(game, seatIndex, huPai, huType, -1);
        return;
    }

    // 4) 抢金（开金后无人吃碰前）
    if(seatData.canQiangJin && game.qiangJinOpen){
        clearAllOptions(game);
        // 抢金：拿翻开的金牌胡，手牌加1金
        seatData.holds.push(game.jinPai);
        rebuildCountMap(seatData);
        doHuSettle(game, seatIndex, game.jinPai, 'qiangjin', -1);
        return;
    }
};

// ===== 游金宣告：打出候选牌 X，进入游金 =====
exports.youjin = function(userId, pai){
    var game = getGameByUserID(userId);
    if(game == null || game.gameOver) return;
    clearTurnTimeout(game);
    var seatIndex = getSeatIndex(userId);
    if(seatIndex == null || seatIndex != game.turn) return;
    var seatData = game.gameSeats[seatIndex];
    if(!seatData.canYouJin || !seatData.youJinPai || seatData.youJinPai.indexOf(pai) == -1) return;
    var idx = seatData.holds.indexOf(pai);
    if(idx == -1) return;

    seatData.holds.splice(idx, 1);
    rebuildCountMap(seatData);
    if(seatData.folds == null) seatData.folds = [];
    seatData.folds.push(pai);
    seatData.youJinLevel = 1;
    clearAllOptions(game);
    userMgr.sendMsg(userId, 'game_action_push');

    var roomId = roomMgr.getRoomIdOfUser(userId);
    userMgr.brocastInRoom(roomId, 'game_chupai_push', {si: seatIndex, pai: pai});
    sendOpToAll(game, 'game_chupai_notify_push', function(i, sd){
        return {
            userId: seatData.userId,
            pai: pai,
            holds: (i == seatIndex) ? seatData.holds.slice() : seatData.holds.length
        };
    });
    userMgr.brocastInRoom(roomId, 'game_youjin_push', {si: seatIndex, level: 1});
    console.log("[zp游金] user=", userId, "宣告游金,打出", pai);

    // 游金期间他人不可操作弃牌，直接下家摸牌
    moveToNextUser(game);
    scheduleMoPai(game);
};

// ===== 游金继续：不胡，代打摸到的牌，等级+1 =====
exports.youjinContinue = function(userId){
    var game = getGameByUserID(userId);
    if(game == null || game.gameOver) return;
    clearTurnTimeout(game);
    var seatIndex = getSeatIndex(userId);
    if(seatIndex == null || seatIndex != game.turn) return;
    var seatData = game.gameSeats[seatIndex];
    if(!seatData.canYouJinGo || seatData.youJinLevel <= 0) return;
    var pai = seatData.lastMoPai;
    var idx = seatData.holds.indexOf(pai);
    if(idx == -1) return;

    seatData.holds.splice(idx, 1);
    rebuildCountMap(seatData);
    if(seatData.folds == null) seatData.folds = [];
    seatData.folds.push(pai);
    seatData.youJinLevel++;
    clearAllOptions(game);
    userMgr.sendMsg(userId, 'game_action_push');

    var roomId = roomMgr.getRoomIdOfUser(userId);
    userMgr.brocastInRoom(roomId, 'game_chupai_push', {si: seatIndex, pai: pai});
    sendOpToAll(game, 'game_chupai_notify_push', function(i, sd){
        return {
            userId: seatData.userId,
            pai: pai,
            holds: (i == seatIndex) ? seatData.holds.slice() : seatData.holds.length
        };
    });
    userMgr.brocastInRoom(roomId, 'game_youjin_push', {si: seatIndex, level: seatData.youJinLevel});
    console.log("[zp游金] user=", userId, "继续游,等级", seatData.youJinLevel);

    moveToNextUser(game);
    scheduleMoPai(game);
};

// ===== 过 =====
exports.guo = function(userId){
    var game = getGameByUserID(userId);
    if(game == null || game.gameOver) return;
    clearTurnTimeout(game);
    var seatIndex = getSeatIndex(userId);
    var seatData = game.gameSeats[seatIndex];

    // 抢杠胡暂停中的过：恢复弯杠
    if(game.qiangGangState && seatData.canHu){
        clearAllOptions(game, seatData);
        userMgr.sendMsg(userId, 'game_action_push');
        if(game.pendingOps && game.pendingOps[seatIndex]) game.pendingOps[seatIndex].resolved = true;
        if(allPendingResolved(game)){
            var qg = game.qiangGangState;
            game.qiangGangState = null;
            clearPendingOps(game);
            doGang(game, qg.si, qg.pai, 'wan');
        }
        return;
    }

    var isMyTurnAction = (game.turn == seatIndex && game.chuPai == -1);
    if(game.pendingOps && game.pendingOps[seatIndex]){
        game.pendingOps[seatIndex].resolved = true;
    }
    clearAllOptions(game, seatData);
    userMgr.sendMsg(userId, 'game_action_push');

    if(isMyTurnAction){
        // 自己摸牌后选择过：保留出牌权，仅清选项
        scheduleTurnTimeout(game, seatIndex, false);
        return;
    }

    if(allPendingResolved(game)){
        clearPendingOps(game);
        moveToNextUser(game);
        scheduleMoPai(game);
    } else {
        scheduleTurnTimeout(game, seatIndex, true);
    }
};

// ===== 开局 =====
exports.start = function(roomInfo){
    if(games[roomInfo.id]){ clearMoPaiTimeout(games[roomInfo.id]); clearTurnTimeout(games[roomInfo.id]); }
    var game = {
        mahjongs: new Array(144),
        currentIndex: 0,
        tailIndex: 143,
        button: roomInfo.nextButton,
        turn: 0,
        chuPai: -1,
        jinPai: -1,
        fanPai: -1,
        kaiJinFlowers: [],
        pendingHua: [],
        gangBuPai: false,
        qiangJinOpen: false,
        qiangGangState: null,
        pendingOps: null,
        firstDiscards: null,
        fenbingDone: false,
        gameSeats: [],
        gameOver: false,
        conf: roomInfo.conf,
        maxTai: roomInfo.conf.maxTai || 10,
        taiRules: roomInfo.conf.taiRules || null,
        laozhuangCount: roomInfo.laozhuangCount || 0
    };

    for(var i = 0; i < SEAT_COUNT; ++i){
        var s = roomInfo.seats[i];
        game.gameSeats.push({
            userId: s.userId,
            name: s.name,
            seatIndex: i,
            holds: [],
            hua: [],
            countMap: {},
            pengs: [],
            pengTiles: [],
            gangs: [],
            chis: [],
            folds: [],
            canPeng: false, canGang: false, canChi: false, canHu: false,
            canQiangJin: false, canYouJin: false, canYouJinGo: false,
            gangPai: [], chiPai: null, youJinPai: null,
            youJinLevel: 0,
            hued: false,
            score: s.score || 0,
            startScore: s.score || 0,
            lastGangHua: false,
            lastMoPai: null
        });
    }

    shuffle(game);
    deal(game);   // 发牌(自动补花)
    kaiJin(game); // 开金
    for(var i = 0; i < SEAT_COUNT; ++i){ rebuildCountMap(game.gameSeats[i]); }

    games[roomInfo.id] = game;

    // 抢金窗口开启
    game.qiangJinOpen = true;
    var zhuangSeat = game.gameSeats[game.button];
    // 庄家天胡检测
    if(canHuNow(game, zhuangSeat) || countWildsInHolds(game, zhuangSeat) >= 3){
        zhuangSeat.canHu = true;
    }
    // 闲家抢金检测
    for(var i = 0; i < SEAT_COUNT; ++i){
        if(i == game.button) continue;
        var sd = game.gameSeats[i];
        if(canQiangJin(game, sd)){
            sd.canQiangJin = true;
        }
    }

    // 推送开局（补花数据随 seats 下发）
    var baseData = {
        button: game.button,
        laozhuang: roomInfo.laozhuangCount || 0,
        turn: game.turn,
        caishen: game.jinPai,   // 金牌沿用财神字段展示
        fanPai: game.fanPai,
        playStyle: 'zhangpu',
        chupaiTimeout: getChupaiTimeout(game),
        numofmj: numOfMJ(game),
        seats: []
    };
    for(var i = 0; i < SEAT_COUNT; ++i){
        var sd = game.gameSeats[i];
        baseData.seats.push({
            userid: sd.userId, name: sd.name, score: sd.score,
            holds: 0, folds: [], pengs: [], pengTiles: [], chis: [],
            angangs: [], diangangs: [], wangangs: [],
            hua: sd.hua.slice(), youjin: 0
        });
    }
    for(var i = 0; i < SEAT_COUNT; ++i){
        var sd = game.gameSeats[i];
        var seatData = JSON.parse(JSON.stringify(baseData));
        for(var j = 0; j < SEAT_COUNT; ++j){
            seatData.seats[j].holds = (j == i) ? game.gameSeats[j].holds.slice() : game.gameSeats[j].holds.length;
        }
        userMgr.sendMsg(sd.userId, 'game_start_push', seatData);
    }

    console.log("[zp开局] room=", roomInfo.id, "button=", game.button, "jin=", game.jinPai, "fanPai=", game.fanPai, "numofmj=", numOfMJ(game));
    for(var i = 0; i < SEAT_COUNT; ++i){
        console.log("[zp开局] seat", i, "holds=", JSON.stringify(game.gameSeats[i].holds), "hua=", JSON.stringify(game.gameSeats[i].hua), "canHu=", game.gameSeats[i].canHu, "canQiangJin=", game.gameSeats[i].canQiangJin);
    }

    // 操作选项推送
    if(zhuangSeat.canHu){
        sendOperations(game, zhuangSeat, zhuangSeat.holds[zhuangSeat.holds.length - 1]);
    }
    for(var i = 0; i < SEAT_COUNT; ++i){
        if(game.gameSeats[i].canQiangJin){
            sendOperations(game, game.gameSeats[i], game.jinPai);
        }
    }
    // 庄家出牌倒计时
    scheduleTurnTimeout(game, game.button, false);
};

exports.hasOperations = hasOperations;
exports.__getGame = function(roomId){ return games[roomId]; };
exports.__calculateTai = calculateTai;
exports.__internals = {
    canFormMelds: canFormMelds,
    checkHuStructure: checkHuStructure,
    checkQiDui: checkQiDui,
    canDianPao: canDianPao,
    canQiangJin: canQiangJin,
    findYouJinDiscards: findYouJinDiscards,
    isWild: isWild,
    splitHolds: splitHolds
};

// 断线重连/中途进房补发
exports.resendGameState = function(roomId, userId){
    var game = games[roomId];
    if(game == null) return;
    var roomInfo = roomMgr.getRoom(roomId);
    if(game.gameOver){
        //结算停留期:补发最近一局结算,重连客户端直接回到结算弹窗
        if(game.lastResult){
            if(roomInfo != null){
                userMgr.sendMsg(userId, 'game_num_push', roomInfo.numOfGames);
            }
            userMgr.sendMsg(userId, 'game_over_push', game.lastResult);
        }
        return;
    }
    var seatIndex = roomMgr.getUserSeat(userId);
    if(seatIndex == null || game.gameSeats[seatIndex] == null) return;

    var data = {
        button: game.button,
        laozhuang: roomInfo ? (roomInfo.laozhuangCount || 0) : 0,
        turn: game.turn,
        caishen: game.jinPai,
        fanPai: game.fanPai,
        playStyle: 'zhangpu',
        chupaiTimeout: getChupaiTimeout(game),
        numofmj: numOfMJ(game),
        seats: []
    };
    for(var i = 0; i < SEAT_COUNT; ++i){
        var s = game.gameSeats[i];
        var angangs = [], diangangs = [], wangangs = [];
        for(var g = 0; g < s.gangs.length; ++g){
            if(s.gangs[g].type == 'an') angangs.push(s.gangs[g].pai);
            else if(s.gangs[g].type == 'ming') diangangs.push(s.gangs[g].pai);
            else if(s.gangs[g].type == 'wan') wangangs.push(s.gangs[g].pai);
        }
        data.seats.push({
            userid: s.userId, name: s.name, score: s.score,
            holds: (i == seatIndex) ? s.holds.slice() : s.holds.length,
            folds: s.folds || [], pengs: s.pengs || [], pengTiles: s.pengTiles || [],
            chis: s.chis || [], angangs: angangs, diangangs: diangangs, wangangs: wangangs,
            hua: s.hua.slice(), youjin: s.youJinLevel || 0
        });
    }
    if(roomInfo != null){
        userMgr.sendMsg(userId, 'game_num_push', roomInfo.numOfGames);
    }
    userMgr.sendMsg(userId, 'game_start_push', data);

    // 补发当前挂起操作
    var sd = game.gameSeats[seatIndex];
    if(hasOperations(sd) || sd.canYouJin || sd.canYouJinGo){
        sendOperations(game, sd, game.chuPai != -1 ? game.chuPai : -1);
    }
};

// 包财神流程不存在：空实现防崩
exports.bao = function(userId, isBao, baoTai, baoTaiFee, caishenMode){ return; };
exports.huanSanZhang = function(userId, p1, p2, p3){};
exports.dingQue = function(userId, que){};

exports.isPlaying = function(roomId){ return games[roomId] != null; };
exports.hasBegan = function(roomId){ var game = games[roomId]; return game != null && game.gameOver != true; }; //结算停留期(gameOver=true)不算对局中

// 玩家准备；所有在线座位准备后开局
exports.setReady = function(userId){
    var roomId = roomMgr.getUserRoom(userId);
    if(roomId == null) return;
    var roomInfo = roomMgr.getRoom(roomId);
    if(roomInfo == null) return;
    var seatIndex = roomMgr.getUserSeat(userId);
    if(seatIndex == null) return;
    var s = roomInfo.seats[seatIndex];
    if(s.ready) return;
    s.ready = true;

    if(roomInfo.numOfGames >= roomInfo.conf.maxGames) return;
    if(games[roomId] != null && games[roomId].gameOver != true) return;

    var readyCount = 0;
    for(var i = 0; i < roomInfo.seats.length; ++i){
        var rs = roomInfo.seats[i];
        if(rs.userId > 0 && userMgr.isOnline(rs.userId) && rs.ready) readyCount++;
    }
    if(readyCount == roomInfo.seats.length){
        setTimeout(function(){
            if(roomInfo.numOfGames >= roomInfo.conf.maxGames) return;
            if(games[roomId] != null && games[roomId].gameOver != true) return;
            var room = roomMgr.getRoom(roomId);
            if(room != null) exports.begin(room);
        }, 1000);
    }
};

// 开一局：连庄(庄胡/流局)否则轮庄
exports.begin = function(roomInfo){
    if(roomInfo.numOfGames > 0){
        if(roomInfo.lastHuIsBanker){
            roomInfo.laozhuangCount = (roomInfo.laozhuangCount || 0) + 1;
        } else {
            roomInfo.nextButton = (roomInfo.nextButton + 1) % SEAT_COUNT;
            roomInfo.laozhuangCount = 0;
        }
    } else {
        roomInfo.laozhuangCount = 0;
    }
    roomInfo.numOfGames++;
    db.update_num_of_turns(roomInfo.id, roomInfo.numOfGames);
    for(var i = 0; i < roomInfo.seats.length; ++i){
        roomInfo.seats[i].ready = false;
    }
    var anyUserId = roomInfo.seats[0].userId;
    userMgr.broacastInRoom('game_num_push', roomInfo.numOfGames, anyUserId, true);
    userMgr.broacastInRoom('game_begin_push', roomInfo.nextButton, anyUserId, true);
    exports.start(roomInfo);
};

// ===== 解散房间 =====
exports.dissolveRequest = function(roomId, userId){
    var roomInfo = roomMgr.getRoom(roomId);
    if(roomInfo == null) return null;
    if(roomInfo.dr != null) return {dr: roomInfo.dr};
    var states = [];
    for(var i = 0; i < roomInfo.seats.length; ++i){
        states.push(roomInfo.seats[i].userId == userId);
    }
    roomInfo.dr = {endTime: Date.now() + 300000, states: states};
    return {dr: roomInfo.dr};
};

exports.dissolveAgree = function(roomId, userId, agree){
    var roomInfo = roomMgr.getRoom(roomId);
    if(roomInfo == null || roomInfo.dr == null) return null;
    var seatIndex = roomMgr.getUserSeat(userId);
    if(seatIndex == null) return null;
    roomInfo.dr.states[seatIndex] = agree;
    return {dr: roomInfo.dr};
};

exports.doDissolve = function(roomId){
    var roomInfo = roomMgr.getRoom(roomId);
    if(roomInfo == null) return;
    var game = games[roomId];
    if(game){ clearMoPaiTimeout(game); clearTurnTimeout(game); }
    for(var i = 0; i < roomInfo.seats.length; ++i){
        var userId = roomInfo.seats[i].userId;
        if(userId > 0) userMgr.sendMsg(userId, 'dispress_push', {});
    }
    roomInfo.dr = null;
    roomMgr.destroy(roomId);
};
