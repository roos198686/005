/**
 * 浙江诸暨麻将 - 游戏管理器
 * 规则特点：
 * 1. 使用136张牌（无花牌）
 * 2. 财神：翻牌确定下一张为财神，可替代任何牌
 * 3. 每人13张牌（庄家14张）
 * 4. 可吃、碰、杠（财神不能补杠）
 * 5. 3台起胡，上不封顶
 * 6. 番型（台数）：平胡1台、混一色1台、清一色3台、全字牌7台、碰碰胡1台、七对3台
 * 7. 自摸、点炮、抢杠胡
 * 8. 打法：赖倒胡（无台数要求）、包财神、翻财神、自选麻将
 */
var roomMgr = require("./roommgr");
var userMgr = require("./usermgr");
var db = require("../utils/db");
var crypto = require("../utils/crypto");

var games = {};

// 台数规则：优先读后台配置(game.taiRules)，缺省用默认值
function taiRule(game, key, def){
    var r = game.taiRules;
    var v = (r && r[key] != null) ? Number(r[key]) : NaN;
    return isNaN(v) ? def : v;
}

// 牌型定义
// 0-8: 筒, 9-17: 条, 18-26: 万, 27-33: 字牌(中发白东南西北)
function getMJType(id){
    if(id >= 0 && id < 9) return 0;
    else if(id >= 9 && id < 18) return 1;
    else if(id >= 18 && id < 27) return 2;
    else return 3; // 字
}

function isZi(pai){
    return pai >= 27 && pai < 34;
}

// 双财神：财神后一张连续的牌
// 数牌：同花色1-9循环；字牌：中→发→白→中（3循环），东→南→西→北→东（4循环）
function nextCaishenOf(pai){
    if(isZi(pai)){
        if(pai >= 27 && pai <= 29){
            // 中发白组：3循环
            return 27 + ((pai - 27 + 1) % 3);
        } else {
            // 东南西北组：4循环
            return 30 + ((pai - 30 + 1) % 4);
        }
    }
    var t = getMJType(pai);
    return t * 9 + ((pai % 9) + 1) % 9;
}

// 判断某牌是否财神（含双财神的第二张）
function isCaishenPai(game, pai){
    return pai >= 0 && (pai == game.caishen || (game.caishen2 != null && game.caishen2 >= 0 && pai == game.caishen2));
}

function shuffle(game) {
    var mahjongs = game.mahjongs;
    var index = 0;
    for(var i = 0; i < 9; ++i){
        for(var c = 0; c < 4; ++c){ mahjongs[index++] = i; }
    }
    for(var i = 9; i < 18; ++i){
        for(var c = 0; c < 4; ++c){ mahjongs[index++] = i; }
    }
    for(var i = 18; i < 27; ++i){
        for(var c = 0; c < 4; ++c){ mahjongs[index++] = i; }
    }
    for(var i = 27; i < 34; ++i){
        for(var c = 0; c < 4; ++c){ mahjongs[index++] = i; }
    }

    for(var i = 0; i < mahjongs.length; ++i){
        var lastIndex = mahjongs.length - 1 - i;
        var idx = Math.floor(Math.random() * lastIndex);
        var t = mahjongs[idx];
        mahjongs[idx] = mahjongs[lastIndex];
        mahjongs[lastIndex] = t;
    }
}

// 翻财神
function fanCaishen(game){
    if(game.currentIndex >= game.mahjongs.length){
        game.caishen = -1;
        return;
    }
    var fanPai = game.mahjongs[game.currentIndex];
    game.currentIndex++;
    game.fanPai = fanPai;

    if(isZi(fanPai)){
        // 字牌的财神就是它自己
        game.caishen = fanPai;
    } else {
        var type = getMJType(fanPai);
        var value = fanPai % 9;
        var nextValue = (value + 1) % 9;
        game.caishen = type * 9 + nextValue;
    }
    game.mahjongs.push(fanPai);
}

function mopai(game, seatIndex) {
    if(game.currentIndex >= game.mahjongs.length) return -1;
    var data = game.gameSeats[seatIndex];
    var pai = game.mahjongs[game.currentIndex];
    game.currentIndex++;
    data.holds.push(pai);
    data.countMap[pai] = (data.countMap[pai] || 0) + 1;
    return pai;
}

function deal(game){
    game.currentIndex = 0;
    game.caishen = -1;
    game.caishen2 = -1;
    game.fanPai = -1;

    var seatIndex = game.button;
    for(var i = 0; i < 26; ++i){ // 13*2=26，2人玩法每人13张
        mopai(game, seatIndex);
        seatIndex = (seatIndex + 1) % 2;
    }
    mopai(game, game.button); // 庄家多一张
    game.turn = game.button;

    // 翻财神：发完牌后翻一张定财神
    // 包财神：先不翻，等庄家选完包台（单/双财神）后再翻，避免提前泄露财神
    if(game.playStyle == 'fancaishen'){
        fanCaishen(game);
    }
}

// 胡牌判定（支持财神替代，caishen2 为双财神第二张）
function checkCanHu(seatData, caishen, caishen2){
    var holds = seatData.holds;
    var numMelds = (seatData.pengs ? seatData.pengs.length : 0)
                 + (seatData.chis ? seatData.chis.length : 0)
                 + (seatData.gangs ? seatData.gangs.length : 0);
    var expectedLen = 14 - 3 * numMelds;
    if(holds.length !== expectedLen) return false;

    var countMap = {};
    var caishenCount = 0;
    for(var i = 0; i < holds.length; ++i){
        var p = holds[i];
        if((caishen >= 0 && p == caishen) || (caishen2 != null && caishen2 >= 0 && p == caishen2)){
            caishenCount++;
        } else {
            countMap[p] = (countMap[p] || 0) + 1;
        }
    }

    // 尝试每种将牌
    for(var pai in countMap){
        pai = parseInt(pai);
        // 真牌对子做将
        if(countMap[pai] >= 2){
            countMap[pai] -= 2;
            if(canFormMelds(countMap, caishenCount)){
                countMap[pai] += 2;
                return true;
            }
            countMap[pai] += 2;
        }
        // 1张真牌+1财神做将（原来漏判这种情况，导致带单张+财神的胡牌判不出来）
        if(countMap[pai] >= 1 && caishenCount >= 1){
            countMap[pai] -= 1;
            if(canFormMelds(countMap, caishenCount - 1)){
                countMap[pai] += 1;
                return true;
            }
            countMap[pai] += 1;
        }
    }
    // 纯财神做将
    if(caishenCount >= 2){
        if(canFormMelds(countMap, caishenCount - 2)){
            return true;
        }
    }

    // 七对
    if(holds.length === 14){
        var pairs = 0;
        var cs = caishenCount;
        for(var k in countMap){
            pairs += Math.floor(countMap[k] / 2);
            if(countMap[k] % 2 == 1 && cs > 0){
                pairs++;
                cs--;
            }
        }
        pairs += Math.floor(cs / 2);
        if(pairs >= 7) return true;
    }

    // 只有财神
    if(Object.keys(countMap).length === 0 && caishenCount > 0){
        if(caishenCount >= 2 && canFormMelds({}, caishenCount - 2)) return true;
    }

    return false;
}

// 分组：刻子 + 顺子（字牌只能刻子），支持财神替代
function canFormMelds(countMap, caishenCount){
    var labels = Object.keys(countMap).filter(function(k){ return countMap[k] > 0; });
    if(labels.length === 0){
        return caishenCount % 3 === 0;
    }

    labels.sort(function(a, b){ return parseInt(a) - parseInt(b); });
    var first = parseInt(labels[0]);

    // 刻子
    if(countMap[first] >= 3){
        countMap[first] -= 3;
        if(canFormMelds(countMap, caishenCount)){
            countMap[first] += 3;
            return true;
        }
        countMap[first] += 3;
    }
    // 用财神补刻子
    if(countMap[first] == 2 && caishenCount >= 1){
        countMap[first] -= 2;
        if(canFormMelds(countMap, caishenCount - 1)){
            countMap[first] += 2;
            return true;
        }
        countMap[first] += 2;
    }
    if(countMap[first] == 1 && caishenCount >= 2){
        countMap[first] -= 1;
        if(canFormMelds(countMap, caishenCount - 2)){
            countMap[first] += 1;
            return true;
        }
        countMap[first] += 1;
    }

    // 顺子（字牌不能）
    if(!isZi(first)){
        var v = first % 9;
        if(v <= 6){
            var p2 = first + 1;
            var p3 = first + 2;
            var c2 = countMap[p2] || 0;
            var c3 = countMap[p3] || 0;
            // 普通顺子
            if(c2 > 0 && c3 > 0){
                countMap[first]--; countMap[p2]--; countMap[p3]--;
                if(canFormMelds(countMap, caishenCount)){
                    countMap[first]++; countMap[p2]++; countMap[p3]++;
                    return true;
                }
                countMap[first]++; countMap[p2]++; countMap[p3]++;
            }
            // 用财神补顺子（first, p2, cs）
            if(c2 > 0 && caishenCount >= 1){
                countMap[first]--; countMap[p2]--;
                if(canFormMelds(countMap, caishenCount - 1)){
                    countMap[first]++; countMap[p2]++;
                    return true;
                }
                countMap[first]++; countMap[p2]++;
            }
            // 用财神补顺子（first, cs, p3）
            if(c3 > 0 && caishenCount >= 1){
                countMap[first]--; countMap[p3]--;
                if(canFormMelds(countMap, caishenCount - 1)){
                    countMap[first]++; countMap[p3]++;
                    return true;
                }
                countMap[first]++; countMap[p3]++;
            }
            // 用两个财神补顺子（first, cs, cs）
            if(caishenCount >= 2){
                countMap[first]--;
                if(canFormMelds(countMap, caishenCount - 2)){
                    countMap[first]++;
                    return true;
                }
                countMap[first]++;
            }
        }
    }

    // 全用财神替代 first
    if(caishenCount >= 3){
        countMap[first] -= 1;
        if(canFormMelds(countMap, caishenCount - 3)){
            countMap[first] += 1;
            return true;
        }
        countMap[first] += 1;
    }

    return false;
}

function checkTingPai(seatData, caishen, caishen2){
    seatData.tingMap = {};
    for(var i = 0; i < 34; ++i){
        seatData.holds.push(i);
        var old = seatData.countMap[i];
        seatData.countMap[i] = (old || 0) + 1;

        if(checkCanHu(seatData, caishen, caishen2)){
            seatData.tingMap[i] = { pattern: "normal", tai: 1 };
        }

        seatData.countMap[i] = old || 0;
        seatData.holds.pop();
    }
}

function getSeatIndex(userId){
    var seatIndex = roomMgr.getUserSeat(userId);
    if(seatIndex == null) return null;
    return seatIndex;
}

function getGameByUserID(userId){
    var roomId = roomMgr.getUserRoom(userId);
    if(roomId == null) return null;
    return games[roomId];
}

function hasOperations(seatData){
    return seatData.canGang || seatData.canPeng || seatData.canHu || seatData.canChi;
}

function sendOperations(game, seatData, pai){
    if(hasOperations(seatData)){
        if(pai == -1) pai = seatData.holds[seatData.holds.length - 1];
        var data = {
            pai: pai,
            hu: seatData.canHu,
            peng: seatData.canPeng,
            gang: seatData.canGang,
            chi: seatData.canChi,
            gangpai: seatData.gangPai,
            chipai: seatData.chiPai
        };
        console.log("sendOperations to", seatData.userId, "pai=", pai, "peng=", seatData.canPeng, "gang=", seatData.canGang, "chi=", seatData.canChi, "hu=", seatData.canHu);
        userMgr.sendMsg(seatData.userId, 'game_action_push', data);
    } else {
        console.log("sendOperations to", seatData.userId, "no operations");
        userMgr.sendMsg(seatData.userId, 'game_action_push');
    }
}

// 从 holds 重建 countMap，防止与实际手牌不同步导致误判吃碰杠
function rebuildCountMap(seatData){
    seatData.countMap = {};
    for(var i = 0; i < seatData.holds.length; ++i){
        var p = seatData.holds[i];
        seatData.countMap[p] = (seatData.countMap[p] || 0) + 1;
    }
}

function getCaishenCount(seatData, caishen, caishen2){
    var c = 0;
    if(caishen != null && caishen >= 0) c += seatData.countMap[caishen] || 0;
    if(caishen2 != null && caishen2 >= 0) c += seatData.countMap[caishen2] || 0;
    return c;
}

// 从手牌中移除 n 张财神（优先消耗财神，其次第二财神），同步 holds 和 countMap
function removeCaishenTiles(game, seatData, n){
    var types = [];
    if(game.caishen != null && game.caishen >= 0) types.push(game.caishen);
    if(game.caishen2 != null && game.caishen2 >= 0) types.push(game.caishen2);
    for(var i = 0; i < n; ++i){
        var removed = false;
        for(var t = 0; t < types.length && !removed; ++t){
            var idx = seatData.holds.indexOf(types[t]);
            if(idx != -1){
                seatData.holds.splice(idx, 1);
                seatData.countMap[types[t]] = Math.max(0, (seatData.countMap[types[t]] || 0) - 1);
                removed = true;
            }
        }
        if(!removed) break;
    }
}

function checkCanPeng(game, seatData, targetPai){
    // 财神作为弃牌不可碰：财神打出即废，即使手牌有同面值真牌也不允许碰
    if(isCaishenPai(game, targetPai)) return;
    var count = seatData.countMap[targetPai] || 0;
    var csCount = game.caishen_cpg ? getCaishenCount(seatData, game.caishen, game.caishen2) : 0;
    if(count + csCount >= 2 && count >= 1) seatData.canPeng = true;
}

function checkCanGang(game, seatData, targetPai){
    if(game.mahjongs.length <= game.currentIndex) return;
    // 财神作为弃牌不可杠：财神打出即废，即使手牌有同面值真牌也不允许杠
    if(isCaishenPai(game, targetPai)) return;
    var count = seatData.countMap[targetPai] || 0;
    var csCount = game.caishen_cpg ? getCaishenCount(seatData, game.caishen, game.caishen2) : 0;
    if(count + csCount >= 3 && count >= 1){
        seatData.canGang = true;
        seatData.gangPai.push(targetPai);
    }
}

function checkCanAnGang(game, seatData){
    if(game.mahjongs.length <= game.currentIndex) return;
    var csCount = game.caishen_cpg ? getCaishenCount(seatData, game.caishen, game.caishen2) : 0;
    for(var key in seatData.countMap){
        var pai = parseInt(key);
        var count = seatData.countMap[key];
        if(isCaishenPai(game, pai)){
            if(count >= 4){
                seatData.canGang = true;
                seatData.gangPai.push(pai);
            }
        } else {
            if(count + csCount >= 4 && count >= 2){
                seatData.canGang = true;
                seatData.gangPai.push(pai);
            }
        }
    }
}

function checkCanWanGang(game, seatData){
    // 补杠：碰过的牌，手中还有一张（可以是财神替代）
    var csCount = game.caishen_cpg ? getCaishenCount(seatData, game.caishen, game.caishen2) : 0;
    for(var i = 0; i < seatData.pengs.length; ++i){
        var pai = seatData.pengs[i];
        var count = seatData.countMap[pai] || 0;
        if(isCaishenPai(game, pai)){
            if(count >= 1){
                seatData.canGang = true;
                seatData.gangPai.push(pai);
            }
        } else {
            if(count + csCount >= 1){
                seatData.canGang = true;
                seatData.gangPai.push(pai);
            }
        }
    }
}

function checkCanChi(game, seatData, targetPai){
    if(isZi(targetPai)) return;
    var type = getMJType(targetPai);
    var v = targetPai % 9;
    var cm = seatData.countMap;
    var csCount = game.caishen_cpg ? getCaishenCount(seatData, game.caishen, game.caishen2) : 0;

    // 检查某张牌是否可用（真实存在或用财神替代）
    var hasPai = function(p){
        if(p < type*9 || p >= type*9+9) return false;
        if(p == targetPai) return false; // targetPai 是别人出的
        return (cm[p] || 0) > 0;
    };

    var combos = [
        [targetPai - 2, targetPai - 1],
        [targetPai - 1, targetPai + 1],
        [targetPai + 1, targetPai + 2]
    ];

    for(var i = 0; i < combos.length; ++i){
        var p1 = combos[i][0];
        var p2 = combos[i][1];
        if(p1 < type*9 || p1 >= type*9+9 || p2 < type*9 || p2 >= type*9+9) continue;

        var h1 = hasPai(p1);
        var h2 = hasPai(p2);
        var needCs = 0;
        if(!h1) needCs++;
        if(!h2) needCs++;

        if(needCs <= csCount && (h1 || h2)){
            seatData.canChi = true;
            if(!seatData.chiPai) seatData.chiPai = [];
            seatData.chiPai.push([p1, p2, targetPai]);
        }
    }
}

function checkCanDianPaoHu(game, seatData, targetPai){
    game.lastHuPaiSeat = -1;
    seatData.canHu = false;
    var tingKeys = Object.keys(seatData.tingMap || {});
    console.log("[checkCanDianPaoHu] targetPai=", targetPai, "tingMap keys=", tingKeys.join(","), "holds=", seatData.holds.length);
    for(var k in seatData.tingMap){
        if(targetPai == k) seatData.canHu = true;
    }
    console.log("[checkCanDianPaoHu] canHu=", seatData.canHu);
}

function clearAllOptions(game, seatData){
    var fnClear = function(sd){
        sd.canPeng = false;
        sd.canGang = false;
        sd.canChi = false;
        sd.gangPai = [];
        sd.chiPai = null;
        sd.canHu = false;
    };
    if(seatData) fnClear(seatData);
    else {
        for(var i = 0; i < game.gameSeats.length; ++i){
            fnClear(game.gameSeats[i]);
        }
    }
}

function moveToNextUser(game){
    game.turn = (game.turn + 1) % 2;
}

function doUserMoPai(game){
    game.chuPai = -1;
    var turnSeat = game.gameSeats[game.turn];
    // 摸牌前先计算听牌表（此时 holds=13），摸牌后直接 checkCanHu 判断自摸
    rebuildCountMap(turnSeat);
    checkTingPai(turnSeat, game.caishen, game.caishen2);
    var pai = mopai(game, game.turn);
    if(pai == -1){
        doGameOver(game);
        return;
    }

    rebuildCountMap(turnSeat);
    clearAllOptions(game, turnSeat);
    checkCanAnGang(game, turnSeat);
    checkCanWanGang(game, turnSeat);
    if(checkCanHu(turnSeat, game.caishen, game.caishen2)){
        turnSeat.canHu = true;
    }

    sendOperations(game, turnSeat, pai);

    // 逐个发送，摸牌者收到真实手牌和牌，其他人只收到数量
    var roomId = roomMgr.getRoomIdOfUser(turnSeat.userId);
    var numofmj = game.mahjongs.length - game.currentIndex;
    for(var i = 0; i < 2; ++i){
        var sd = game.gameSeats[i];
        var isTurn = (i === game.turn);
        var data = {
            si: game.turn,
            pai: isTurn ? pai : -1,
            numofmj: numofmj
        };
        data.holds = isTurn ? sd.holds.slice() : sd.holds.length;
        userMgr.sendMsg(sd.userId, 'game_mopai_push', data);
    }
}

function doGameOver(game){
    game.gameOver = true;
    var roomId = roomMgr.getRoomIdOfUser(game.gameSeats[0].userId);
    var roomInfo = roomMgr.getRoom(roomId);
    if(roomInfo == null){
        return;
    }

    var results = [];
    for(var i = 0; i < 2; ++i){
        var seat = game.gameSeats[i];
        // 拆分 gangs 为暗杠/明杠
        var angangs = [];
        var diangangs = [];
        var wangangs = [];
        for(var g = 0; g < seat.gangs.length; ++g){
            var gang = seat.gangs[g];
            if(gang.type == 'an'){
                angangs.push(gang.pai);
            } else if(gang.type == 'ming'){
                diangangs.push(gang.pai);
            } else if(gang.type == 'wan'){
                wangangs.push(gang.pai);
            }
        }

        // 构造 huinfo
        var huinfo = [];
        if(seat.hued && seat.huInfo){
            huinfo.push({
                ishupai: true,
                pai: seat.huInfo.hupai,
                action: seat.huInfo.zimo ? 'zimo' : 'hu',
                pattern: '',
                haidihu: false,
                tianhu: false,
                dihu: false,
                fan: seat.huInfo.tai,
                numofgen: 0
            });
        }
        if(seat.fangpaoInfo){
            // 放炮者：指向胡牌者的 huinfo
            huinfo.push({
                ishupai: false,
                pai: seat.fangpaoInfo.pai,
                action: 'fangpao',
                pattern: '',
                haidihu: false,
                tianhu: false,
                dihu: false,
                fan: 0,
                numofgen: 0,
                target: seat.fangpaoInfo.target,
                index: 0
            });
        }

        results.push({
            userid: seat.userId,
            score: seat.score - (seat.startScore || 0),
            totalscore: seat.score,
            holds: seat.holds.slice(),
            pengs: seat.pengs.slice(),
            chis: seat.chis.slice(),
            folds: seat.folds ? seat.folds.slice() : [],
            angangs: angangs,
            diangangs: diangangs,
            wangangs: wangangs,
            huinfo: huinfo,
            dingque: -1,
            qingyise: false,
            menqing: false,
            jingouhu: false,
            zhongzhang: false
        });
        console.log("[doGameOver] seat", i, "holds=", seat.holds.length, "pengs=", seat.pengs, "chis=", JSON.stringify(seat.chis), "gangs=", JSON.stringify(seat.gangs), "folds=", seat.folds ? seat.folds.length : 0);
        // 同步累计分到房间座位
        roomInfo.seats[i].score = seat.score;
    }

    // 设置老庄标志：胡牌者是否是庄家
    roomInfo.lastHuIsBanker = false;
    for(var i = 0; i < 2; ++i){
        if(game.gameSeats[i].hued && i == game.button){
            roomInfo.lastHuIsBanker = true;
            break;
        }
    }

    // 客户端 game_over_push 格式：{results:[...], endinfo?}
    var pushData = {results: results};

    // 打完指定局数，发最终结算数据
    if(roomInfo.numOfGames >= roomInfo.conf.maxGames){
        var endinfo = [];
        for(var i = 0; i < 2; ++i){
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
    }

    userMgr.brocastInRoom(roomId, 'game_over_push', pushData);

    // 房卡扣除：第一局结束一次性扣除整局房卡(中途解散不退)
    var cost = roomInfo.conf.cost || 0;
    var creator = roomInfo.conf.creator;
    if(creator && roomInfo.numOfGames === 1 && cost > 0){
        db.cost_gems(creator, cost, function(success){
            console.log("[房卡扣除] 房主", creator, "扣除", cost, "房卡, 结果:", success);
        });
    }

    var index = roomInfo.numOfGames;
    var baseInfo = JSON.stringify({button: game.button, caishen: game.caishen, caishen2: game.caishen2});
    // 数据库只存分数，完整结算数据仅发给客户端展示
    var dbResults = [];
    for(var i = 0; i < 2; ++i){
        dbResults.push({
            userid: results[i].userid,
            totalscore: results[i].totalscore
        });
    }
    db.create_game(roomInfo.uuid, index, baseInfo, function(){
        db.update_game_result(roomInfo.uuid, index, JSON.stringify(dbResults), function(){});
    });

    // 打完所有局数，自动解散房间并清理用户位置，否则用户无法创建/加入新房
    if(roomInfo.numOfGames >= roomInfo.conf.maxGames){
        // 更新用户战绩
        var historyItem = {
            id: roomInfo.id,
            uuid: roomInfo.uuid,
            time: Math.ceil(Date.now()/1000),
            seats: []
        };
        for(var i = 0; i < 2; ++i){
            historyItem.seats.push({
                name: roomInfo.seats[i].name,
                score: roomInfo.seats[i].score
            });
        }
        for(var i = 0; i < 2; ++i){
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

        setTimeout(function(){
            userMgr.brocastInRoom(roomId, 'dispress_push', {});
            setTimeout(function(){
                userMgr.kickAllInRoom(roomId);
                roomMgr.destroy(roomId);
            }, 500);
        }, 3000);
    }
}

exports.chupai = function(userId, pai){
    var game = getGameByUserID(userId);
    if(game == null || game.gameOver) return;
    var seatIndex = getSeatIndex(userId);
    if(seatIndex != game.turn) return;

    var seatData = game.gameSeats[seatIndex];
    var idx = seatData.holds.indexOf(pai);
    if(idx == -1) return;

    seatData.holds.splice(idx, 1);
    seatData.countMap[pai]--;
    seatData.folds.push(pai);
    game.chuPai = pai;

    userMgr.brocastInRoom(roomMgr.getRoomIdOfUser(userId), 'game_chupai_push', {
        si: seatIndex, pai: pai
    });
    // 逐个发送：userId 必须是出牌者的，客户端用它定位座位
    // 出牌者收到自己的完整手牌，其他人只收到数量
    var roomId = roomMgr.getRoomIdOfUser(userId);
    for(var i = 0; i < 2; ++i){
        var sd = game.gameSeats[i];
        var data = {userId: seatData.userId, pai: pai};
        data.holds = (i === seatIndex) ? seatData.holds.slice() : seatData.holds.length;
        userMgr.sendMsg(sd.userId, 'game_chupai_notify_push', data);
    }

    clearAllOptions(game);
    for(var i = 0; i < 2; ++i){
        if(i == seatIndex) continue;
        var sd = game.gameSeats[i];
        rebuildCountMap(sd);
        console.log("chupai check: player", sd.userId, "discarded pai=", pai, "count=", sd.countMap[pai] || 0, "holds=", sd.holds.length);
        checkCanPeng(game, sd, pai);
        checkCanGang(game, sd, pai);
        checkCanChi(game, sd, pai);
        checkTingPai(sd, game.caishen, game.caishen2);
        checkCanDianPaoHu(game, sd, pai);
        if(hasOperations(sd)) sendOperations(game, sd, pai);
    }

    var hasOp = false;
    for(var i = 0; i < 2; ++i){
        if(i != seatIndex && hasOperations(game.gameSeats[i])){
            hasOp = true;
            break;
        }
    }
    if(!hasOp){
        moveToNextUser(game);
        setTimeout(function(){ doUserMoPai(game); }, 500);
    }
};

exports.peng = function(userId){
    var game = getGameByUserID(userId);
    if(game == null || game.gameOver) return;
    var seatIndex = getSeatIndex(userId);
    var seatData = game.gameSeats[seatIndex];
    if(!seatData.canPeng) return;

    var pai = game.chuPai;
    var discarderIdx = game.turn;
    var discarder = game.gameSeats[discarderIdx];
    if(discarder && discarder.folds){
        var fi = discarder.folds.lastIndexOf(pai);
        if(fi != -1) discarder.folds.splice(fi, 1);
    }

    var count = seatData.countMap[pai] || 0;
    var removeCs = 0;
    if(!isCaishenPai(game, pai)){
        // 用财神替代：需要2张，已有count张，差(2-count)张用财神
        removeCs = Math.max(0, 2 - count);
    }
    // 移除 targetPai
    for(var i = 0; i < Math.min(count, 2); ++i){
        var idx = seatData.holds.indexOf(pai);
        if(idx != -1) seatData.holds.splice(idx, 1);
    }
    seatData.countMap[pai] = Math.max(0, count - 2);
    // 移除财神（含双财神第二张）
    removeCaishenTiles(game, seatData, removeCs);

    seatData.pengs.push(pai);
    game.turn = seatIndex;

    console.log("[PENG] user=",userId,"pai=",pai,"holds.length=",seatData.holds.length,"holds=",JSON.stringify(seatData.holds));

    // 逐个发送，每人只收到自己的手牌
    var roomId = roomMgr.getRoomIdOfUser(userId);
    for(var i = 0; i < 2; ++i){
        var sd = game.gameSeats[i];
        var data = {si: seatIndex, pai: pai};
        data.holds = (i === seatIndex) ? sd.holds.slice() : sd.holds.length;
        console.log("[PENG] send to seat",i,"holds=",typeof data.holds === 'object' ? data.holds.length : data.holds);
        userMgr.sendMsg(sd.userId, 'game_peng_push', data);
    }

    clearAllOptions(game);
    rebuildCountMap(seatData);
    checkTingPai(seatData, game.caishen, game.caishen2);
    seatData.canHu = checkCanHu(seatData, game.caishen, game.caishen2);
    checkCanAnGang(game, seatData);
    checkCanWanGang(game, seatData);
    sendOperations(game, seatData, -1);
};

exports.gang = function(userId, pai){
    var game = getGameByUserID(userId);
    if(game == null || game.gameOver) return;
    var seatIndex = getSeatIndex(userId);
    var seatData = game.gameSeats[seatIndex];
    if(!seatData.canGang) return;

    var caishen = game.caishen;
    var count = seatData.countMap[pai] || 0;
    var csCount = getCaishenCount(seatData, caishen, game.caishen2);

    // 辅助：从手牌移除 n 张 pai 和 m 张财神
    var removePai = function(n){
        for(var i = 0; i < n; ++i){
            var idx = seatData.holds.indexOf(pai);
            if(idx != -1) seatData.holds.splice(idx, 1);
        }
        seatData.countMap[pai] = Math.max(0, (seatData.countMap[pai]||0) - n);
    };
    var removeCs = function(m){
        removeCaishenTiles(game, seatData, m);
    };

    if(count >= 4){
        // 暗杠：4张真实牌
        removePai(4);
        seatData.gangs.push({pai: pai, type: 'an'});
    } else if(game.chuPai == pai && count >= 1 && count + csCount >= 3){
        // 点杠（明杠）：别人打出，需要3张
        var discarderIdx = game.turn;
        var discarder = game.gameSeats[discarderIdx];
        if(discarder && discarder.folds){
            var fi = discarder.folds.lastIndexOf(pai);
            if(fi != -1) discarder.folds.splice(fi, 1);
        }
        var needCs = 3 - count;
        removePai(count);
        removeCs(needCs);
        seatData.gangs.push({pai: pai, type: 'ming'});
    } else if(!isCaishenPai(game, pai) && count + csCount >= 4 && count >= 2){
        // 暗杠用财神替代
        var needCs = 4 - count;
        removePai(count);
        removeCs(needCs);
        seatData.gangs.push({pai: pai, type: 'an'});
    } else {
        // 补杠（弯杠）：碰过的牌手中还有一张（可以是财神）
        var needCs = (count >= 1) ? 0 : 1;
        if(count >= 1){
            removePai(1);
        } else {
            removeCs(1);
        }
        seatData.gangs.push({pai: pai, type: 'wan'});
    }

    // 标记杠上开花
    seatData.lastGangHua = true;

    game.turn = seatIndex;

    // 逐个发送，每人只收到自己的手牌
    var roomId = roomMgr.getRoomIdOfUser(userId);
    for(var i = 0; i < 2; ++i){
        var sd = game.gameSeats[i];
        var data = {si: seatIndex, pai: pai};
        data.holds = (i === seatIndex) ? sd.holds.slice() : sd.holds.length;
        userMgr.sendMsg(sd.userId, 'game_gang_push', data);
    }

    clearAllOptions(game);
    setTimeout(function(){ doUserMoPai(game); }, 500);
};

exports.chi = function(userId, chiPais){
    var game = getGameByUserID(userId);
    if(game == null || game.gameOver) return;
    var seatIndex = getSeatIndex(userId);
    var seatData = game.gameSeats[seatIndex];
    if(!seatData.canChi) return;

    var pai = game.chuPai;
    var discarderIdx = game.turn;
    var discarder = game.gameSeats[discarderIdx];
    if(discarder && discarder.folds){
        var fi = discarder.folds.lastIndexOf(pai);
        if(fi != -1) discarder.folds.splice(fi, 1);
    }

    // chiPais 是3张牌，其中 pai 是别人出的，另外两张是玩家的
    // 如果某张牌不在手牌中，用财神替代（含双财神第二张）
    for(var i = 0; i < chiPais.length; ++i){
        var p = chiPais[i];
        if(p == pai) continue;
        if((seatData.countMap[p] || 0) > 0){
            var idx = seatData.holds.indexOf(p);
            if(idx != -1){
                seatData.holds.splice(idx, 1);
                seatData.countMap[p]--;
            }
        } else {
            // 用财神替代
            removeCaishenTiles(game, seatData, 1);
        }
    }
    seatData.chis.push(chiPais.slice().sort(function(a,b){return a-b;}));
    game.turn = seatIndex;

    // 逐个发送，每人只收到自己的手牌
    var roomId = roomMgr.getRoomIdOfUser(userId);
    for(var i = 0; i < 2; ++i){
        var sd = game.gameSeats[i];
        var data = {si: seatIndex, pais: chiPais};
        data.holds = (i === seatIndex) ? sd.holds.slice() : sd.holds.length;
        userMgr.sendMsg(sd.userId, 'game_chi_push', data);
    }

    clearAllOptions(game);
    rebuildCountMap(seatData);
    checkTingPai(seatData, game.caishen, game.caishen2);
    seatData.canHu = checkCanHu(seatData, game.caishen, game.caishen2);
    sendOperations(game, seatData, -1);
};

exports.hu = function(userId){
    var game = getGameByUserID(userId);
    if(game == null || game.gameOver) return;
    var seatIndex = getSeatIndex(userId);
    var seatData = game.gameSeats[seatIndex];
    if(!seatData.canHu) return;

    seatData.hued = true;
    seatData.canHu = false;

    var isZimo = (game.chuPai == -1);
    var huPai = isZimo ? seatData.holds[seatData.holds.length-1] : game.chuPai;

    if(!isZimo){
        seatData.holds.push(huPai);
        seatData.countMap[huPai] = (seatData.countMap[huPai] || 0) + 1;
    }

    // 计算台数（杠上开花+1台）
    var extraTai = 0;
    if(isZimo && seatData.lastGangHua){
        extraTai = taiRule(game, 'gang_kai', 1);
        seatData.lastGangHua = false;
    }
    var tai = calculateTai(seatData, game, isZimo, extraTai);

    // 天胡地胡：按最高台数结算
    // 天胡：庄家起手自摸，还没人出过牌
    // 地胡：闲家第一轮摸牌自摸，庄家只出过1张牌
    var isTianHu = false;
    var isDiHu = false;
    if(isZimo){
        var totalChuPai = 0;
        for(var i = 0; i < 2; ++i){
            if(game.gameSeats[i].folds) totalChuPai += game.gameSeats[i].folds.length;
        }
        if(seatIndex == game.button && totalChuPai == 0){
            isTianHu = true;
        } else if(seatIndex != game.button && totalChuPai == 1){
            isDiHu = true;
        }
    }
    if(isTianHu || isDiHu){
        tai = game.maxTai || 10;
        console.log("[天胡地胡]", isTianHu ? "天胡" : "地胡", "台数=", tai);
    }

    // 胡牌门槛
    var minTai = 1; // 翻财神/包财神：≥1台可胡
    if(game.playStyle == 'laidaohu'){
        minTai = 0; // 赖倒胡：0台可胡（但台数计算至少1台因为平胡）
    }
    if(game.playStyle == 'baocaishen'){
        // 包财神：包家必须达到自己喊的台数，闲家≥1台
        if(game.baoSeatIndex >= 0 && game.baoSeatIndex < 2 && game.baoSeatIndex == seatIndex){
            minTai = game.baoTai || 2; // 包家：自己喊的台数，二台起包
        } else {
            minTai = 1; // 闲家：≥1台
        }
    }
    if(tai < minTai){
        // 台数不够，不能胡
        seatData.hued = false;
        if(!isZimo){
            seatData.holds.pop();
            seatData.countMap[huPai]--;
        }
        return;
    }

    // 计分：底 × 2^台
    var baseScore = game.conf.baseScore || 1;
    var score = baseScore * Math.pow(2, tai);

    // 无财/独财×2: caishenMode 0=无财 1=独财 2=双财, 0和1都×2
    var caiMul = (game.caishenMode != null && (game.caishenMode === 0 || game.caishenMode === 1)) ? 2 : 1;
    if(caiMul > 1){
        score = score * caiMul;
        if(seatData.taiLog){ seatData.taiLog.push('财神模式×'+caiMul); }
    }

    // 老庄翻倍: lzMul 从后台配置读取(默认2), 老庄时胡牌分×lzMul
    var lzMul = (game.laozhuang_multiplier != null && game.laozhuang_multiplier > 0) ? Number(game.laozhuang_multiplier) : 2;
    if(game.laozhuangCount > 0){
        score = score * lzMul;
        if(seatData.taiLog){ seatData.taiLog.push('老庄×'+lzMul); }
    }

    // 包财神赔付规则（必须设置了包家才走包台赔付）
    if(game.playStyle == 'baocaishen' && game.baoSeatIndex >= 0 && game.baoSeatIndex < 2){
        var baoTaiFee = game.baoTaiFee || 0;
        if(game.baoSeatIndex == seatIndex){
            // 包家胡：对手付【牌面分 + 包台费】
            var payScore = score + baoTaiFee;
            seatData.score += payScore;
            for(var i = 0; i < 2; ++i){
                if(i != seatIndex){
                    game.gameSeats[i].score -= payScore;
                }
            }
        } else {
            // 闲家胡：包家付【牌面分 + 包台费】
            var payScore = score + baoTaiFee;
            seatData.score += payScore;
            game.gameSeats[game.baoSeatIndex].score -= payScore;
        }
    } else {
        // 普通计分
        seatData.score += score;
        for(var i = 0; i < 2; ++i){
            if(i != seatIndex){
                game.gameSeats[i].score -= score;
            }
        }
    }

    // 保存胡牌信息供结算使用
    seatData.huInfo = {
        hupai: huPai,
        zimo: isZimo,
        tai: tai,
        score: score,
        seatIndex: seatIndex
    };
    // 记录放炮者
    if(!isZimo){
        var discarderIndex = -1;
        for(var i = 0; i < 2; ++i){
            if(i != seatIndex){
                discarderIndex = i;
                break;
            }
        }
        if(discarderIndex >= 0){
            game.gameSeats[discarderIndex].fangpaoInfo = { target: seatIndex, pai: huPai };
        }
    }

    userMgr.brocastInRoom(roomMgr.getRoomIdOfUser(userId), 'game_hu_push', {
        si: seatIndex,
        pai: huPai,
        zimo: isZimo,
        tai: tai,
        score: score
    });

    setTimeout(function(){ doGameOver(game); }, 1000);
};

exports.guo = function(userId){
    var game = getGameByUserID(userId);
    if(game == null || game.gameOver) return;
    var seatIndex = getSeatIndex(userId);
    var seatData = game.gameSeats[seatIndex];
    clearAllOptions(game, seatData);

    // 自己摸牌后的杠/胡选项：选择"过"则清除全部选项，推送空操作让玩家直接出牌
    if(game.chuPai == -1){
        seatData.canHu = false;
        seatData.canGang = false;
        seatData.gangPai = [];
        userMgr.sendMsg(seatData.userId, 'game_action_push');
        return;
    }

    // 别人出牌后的碰/杠/吃选项：选择"过"后检查其他玩家
    var hasOp = false;
    for(var i = 0; i < 2; ++i){
        if(i != game.turn && hasOperations(game.gameSeats[i])){
            hasOp = true;
            break;
        }
    }
    if(!hasOp){
        moveToNextUser(game);
        setTimeout(function(){ doUserMoPai(game); }, 500);
    }
};

// 计算台数
// seatData: 玩家数据
// game: 游戏对象（含 caishen, playStyle, button, maxTai 等）
// isZimo: 是否自摸
// extraTai: 额外台数（杠上开花+1, 抢杠胡+1 等）
function calculateTai(seatData, game, isZimo, extraTai){
    var caishen = game.caishen;
    var caishen2 = game.caishen2;
    var playStyle = game.playStyle;
    var isBanker = (seatData.seatIndex == game.button);
    var tai = 0;
    extraTai = extraTai || 0;

    var holds = seatData.holds;
    var countMap = {};
    var caishenCount = 0;
    for(var i = 0; i < holds.length; ++i){
        var p = holds[i];
        if((caishen >= 0 && p == caishen) || (caishen2 != null && caishen2 >= 0 && p == caishen2)){
            caishenCount++;
        } else {
            countMap[p] = (countMap[p] || 0) + 1;
        }
    }

    // 收集所有刻子（手牌中的刻子 + 碰 + 杠）
    var keSet = {}; // {pai: count} 手牌中的刻子数量
    for(var k in countMap){
        if(countMap[k] >= 3){
            keSet[parseInt(k)] = Math.floor(countMap[k] / 3);
        }
    }
    // 碰牌也算刻子
    if(seatData.pengs){
        for(var i = 0; i < seatData.pengs.length; ++i){
            var pp = seatData.pengs[i];
            keSet[pp] = (keSet[pp] || 0) + 1;
        }
    }
    // 杠牌也算刻子
    if(seatData.gangs){
        for(var i = 0; i < seatData.gangs.length; ++i){
            var gp = seatData.gangs[i].pai;
            keSet[gp] = (keSet[gp] || 0) + 1;
        }
    }

    // 判断牌型
    var isDuiDuiHu = isDuiDuiHuCheck(seatData, caishen, caishen2);
    // 平胡：没有刻子（手牌无刻子、无碰、无杠），全是顺子+1对将
    var hasKe = false;
    for(var k in keSet){
        if(keSet[k] > 0){ hasKe = true; break; }
    }
    var isPingHu = !hasKe && !isDuiDuiHu;

    // 花色判断
    var suitSet = {};
    for(var k in countMap){
        var t = getMJType(parseInt(k));
        if(t < 3) suitSet[t] = true;
        else suitSet['zi'] = true;
    }
    // 碰/杠的牌也算花色
    if(seatData.pengs){
        for(var i = 0; i < seatData.pengs.length; ++i){
            var t = getMJType(seatData.pengs[i]);
            if(t < 3) suitSet[t] = true; else suitSet['zi'] = true;
        }
    }
    if(seatData.gangs){
        for(var i = 0; i < seatData.gangs.length; ++i){
            var t = getMJType(seatData.gangs[i].pai);
            if(t < 3) suitSet[t] = true; else suitSet['zi'] = true;
        }
    }
    if(seatData.chis){
        for(var i = 0; i < seatData.chis.length; ++i){
            for(var j = 0; j < seatData.chis[i].length; ++j){
                var t = getMJType(seatData.chis[i][j]);
                suitSet[t] = true;
            }
        }
    }
    var suitKeys = Object.keys(suitSet);
    var isQingYiSe = (suitKeys.length == 1 && suitKeys[0] !== 'zi');
    var isHunYiSe = (suitKeys.length == 2 && suitSet['zi']);

    // 1. 东风刻：庄家2台，闲家1台
    var dongPai = 30; // 东
    if(keSet[dongPai]){
        tai += isBanker ? taiRule(game, 'dong_ke_banker', 2) : taiRule(game, 'dong_ke_player', 1);
    }

    // 2. 中发白刻子：各1台
    var ziPais = [27, 28, 29]; // 中发白
    for(var i = 0; i < ziPais.length; ++i){
        if(keSet[ziPais[i]]){
            tai += taiRule(game, 'zfb_ke', 1);
        }
    }

    // 3. 平胡：1台（清一色时不单独加，统一在清一色里算）
    if(isPingHu && !isQingYiSe){
        tai += taiRule(game, 'ping_hu', 1);
    }

    // 4. 对对胡：1台（清一色时不单独加，统一在清一色里算）
    if(isDuiDuiHu && !isQingYiSe){
        tai += taiRule(game, 'duidui_hu', 1);
    }

    // 5. 混一色：1台；混一色对对胡再加1台
    if(isHunYiSe){
        tai += taiRule(game, 'hun_yise', 1);
        if(isDuiDuiHu){
            tai += taiRule(game, 'hun_duidui_extra', 1);
        }
    }

    // 6. 清一色：3台；清一色平胡或对对胡共4台（不叠加平胡/对对胡）
    if(isQingYiSe){
        tai += taiRule(game, 'qing_yise', 3);
        if(isPingHu || isDuiDuiHu){
            tai += taiRule(game, 'qing_extra', 1); // 清一色平胡/对对胡追加
        }
    }

    // 额外台数（杠上开花、抢杠胡）
    tai += extraTai;

    // 无财+1台：手牌与碰/杠/吃副露中都没有财神才算（不限玩法，有财神即生效）
    var caishenTotal = caishenCount;
    if(seatData.pengs){ for(var pi = 0; pi < seatData.pengs.length; ++pi){ var _pp = seatData.pengs[pi]; if(_pp == caishen || (caishen2 != null && caishen2 >= 0 && _pp == caishen2)){ caishenTotal++; } } }
    if(seatData.gangs){ for(var gi = 0; gi < seatData.gangs.length; ++gi){ var _gp = seatData.gangs[gi].pai; if(_gp == caishen || (caishen2 != null && caishen2 >= 0 && _gp == caishen2)){ caishenTotal++; } } }
    if(seatData.chis){ for(var ci = 0; ci < seatData.chis.length; ++ci){ for(var cj = 0; cj < seatData.chis[ci].length; ++cj){ var _cp = seatData.chis[ci][cj]; if(_cp == caishen || (caishen2 != null && caishen2 >= 0 && _cp == caishen2)){ caishenTotal++; } } } }
    if(caishenTotal == 0){
        tai += taiRule(game, 'wu_cai', 1);
    }

    // 封顶
    var maxTai = game.maxTai || 10;
    if(tai > maxTai) tai = maxTai;

    return tai;
}

// 判断是否对对胡（全是刻子，没有顺子）
function isDuiDuiHuCheck(seatData, caishen, caishen2){
    // 如果有吃牌，肯定不是对对胡
    if(seatData.chis && seatData.chis.length > 0) return false;

    var holds = seatData.holds;
    var countMap = {};
    var caishenCount = 0;
    for(var i = 0; i < holds.length; ++i){
        var p = holds[i];
        if((caishen >= 0 && p == caishen) || (caishen2 != null && caishen2 >= 0 && p == caishen2)){
            caishenCount++;
        } else {
            countMap[p] = (countMap[p] || 0) + 1;
        }
    }

    // 统计非刻子数量
    var nonKeCount = 0;
    for(var k in countMap){
        var c = countMap[k];
        var ke = Math.floor(c / 3);
        var rem = c % 3;
        nonKeCount += rem;
    }

    // 用财神补足非刻子的数量（每3个财神补一个刻子，或2个财神+1张单牌补刻子）
    // 简化：如果剩余单牌数 + 财神数 能组成刻子，则是对对胡
    // 对对胡：将牌(1对) + 4组刻子
    // 有碰/杠时：将牌(1对) + (4 - numMelds)组刻子
    var numMelds = (seatData.pengs ? seatData.pengs.length : 0) + (seatData.gangs ? seatData.gangs.length : 0);
    var needKe = 4 - numMelds; // 还需要几个刻子
    var needPai = needKe * 3 + 2; // 还需要的牌数（刻子*3 + 将牌*2）

    // 手牌中的实际非财神牌数
    var realCount = holds.length - caishenCount;
    // 财神可以替代，只要 realCount + caishenCount >= needPai 且 能组成
    // 简化判断：如果没有顺子（chis为空），且单牌数量能被财神补齐为刻子+一对
    if(nonKeCount === 0){
        // 所有牌都是刻子的倍数，有1对将牌
        return true;
    }
    // 有单牌，用财神补
    // 对对胡结构：将牌(2) + 刻子(3*n)
    // 非刻子牌数 = nonKeCount，需要用财神补到 2 + 3*k
    var canForm = false;
    for(var k = 0; k <= needKe; ++k){
        var target = 2 + k * 3; // 将牌 + k个刻子
        if(nonKeCount <= target && (target - nonKeCount) <= caishenCount){
            canForm = true;
            break;
        }
    }
    return canForm;
}

exports.checkCanHu = checkCanHu;

exports.start = function(roomInfo){
    var game = {
        mahjongs: new Array(136),
        currentIndex: 0,
        button: roomInfo.nextButton,
        turn: 0,
        chuPai: -1,
        caishen: -1,
        caishen2: -1,
        fanPai: -1,
        gameSeats: [],
        gameOver: false,
        conf: roomInfo.conf,
        playStyle: roomInfo.conf.playStyle || 'laidaohu',
        maxTai: roomInfo.conf.maxTai || 10,
        taiRules: roomInfo.conf.taiRules || null,
        caishen_cpg: roomInfo.conf.caishen_cpg != null ? roomInfo.conf.caishen_cpg : 1,
        laozhuangCount: roomInfo.laozhuangCount || 0,
        baoSeatIndex: roomInfo.conf.baoSeatIndex != null ? roomInfo.conf.baoSeatIndex : -1,
        baoTai: roomInfo.conf.baoTai || 2,
        baoTaiFee: roomInfo.conf.baoTaiFee || 0
    };

    for(var i = 0; i < 2; ++i){
        var s = roomInfo.seats[i];
        game.gameSeats.push({
            userId: s.userId,
            name: s.name,
            seatIndex: i,
            holds: [],
            countMap: {},
            pengs: [],
            gangs: [],
            chis: [],
            folds: [],
            tingMap: {},
            canPeng: false,
            canGang: false,
            canChi: false,
            canHu: false,
            gangPai: [],
            chiPai: null,
            hued: false,
            score: s.score || 0,
            startScore: s.score || 0,
            lastGangHua: false
        });
    }

    shuffle(game);
    deal(game);

    // 包财神：财神在庄家选完包台后才翻，开局先不算听牌
    if(game.playStyle != 'baocaishen'){
        for(var i = 0; i < 2; ++i){
            checkTingPai(game.gameSeats[i], game.caishen, game.caishen2);
        }
    }

    games[roomInfo.id] = game;

    var data = {
        button: game.button,
        caishen: game.caishen,
        caishen2: game.caishen2,
        fanPai: game.fanPai,
        playStyle: game.playStyle,
        numofmj: game.mahjongs.length - game.currentIndex,
        seats: []
    };
    for(var i = 0; i < 2; ++i){
        var sd = game.gameSeats[i];
        data.seats.push({
            userid: sd.userId,
            name: sd.name,
            score: sd.score,
            holds: (i === game.button) ? sd.holds : sd.holds.length
        });
    }

    var roomId = roomInfo.id;
    for(var i = 0; i < 2; ++i){
        var sd = game.gameSeats[i];
        var seatData = JSON.parse(JSON.stringify(data));
        // 每人只发自己的真实手牌，其余座位只发牌数
        for(var j = 0; j < 2; ++j){
            seatData.seats[j].holds = (j === i) ? game.gameSeats[j].holds : game.gameSeats[j].holds.length;
        }
        userMgr.sendMsg(sd.userId, 'game_start_push', seatData);
    }

    // 包财神玩法：庄家选择是否包，选择后才开始出牌
    console.log("[start] playStyle=", game.playStyle, "type=", roomInfo.conf.type);
    if(game.playStyle == 'baocaishen'){
        game.baoDecided = false;
        game.baoTurn = 0; // 0=庄家选, 1=闲家选, 2=庄家强制硬包
        var zhuangSeat = game.gameSeats[game.button];
        userMgr.sendMsg(zhuangSeat.userId, 'bao_select_push', { turn: 0, forced: false });
        console.log("[包财神] 等待庄家", zhuangSeat.userId, "选择是否包");
    } else {
        game.baoDecided = true;
        var zhuangSeat = game.gameSeats[game.button];
        sendOperations(game, zhuangSeat, zhuangSeat.holds[zhuangSeat.holds.length-1]);
    }
};

exports.hasOperations = hasOperations;

// 包财神：状态机 baoTurn=0(庄家选) → 1(闲家选) → 2(庄家强制硬包)
exports.bao = function(userId, isBao, baoTai, baoTaiFee, caishenMode){
    var roomId = roomMgr.getUserRoom(userId);
    if(roomId == null) return;
    var roomInfo = roomMgr.getRoom(roomId);
    if(roomInfo == null) return;
    var game = games[roomId];
    if(game == null || game.gameOver) return;
    if(game.playStyle != 'baocaishen') return;
    if(game.baoDecided) return;

    // 计算当前 baoTurn 对应的真实 seatIndex
    var expectedSeat;
    if(game.baoTurn == 0 || game.baoTurn == 2){
        expectedSeat = game.button;  // 庄家
    } else if(game.baoTurn == 1){
        expectedSeat = 1 - game.button;  // 闲家（2人麻将）
    } else {
        return;
    }

    var seatIndex = roomMgr.getUserSeat(userId);
    if(seatIndex != expectedSeat){
        console.log("[包财神] 非当前决策人不能选择，baoTurn=", game.baoTurn, "expectedSeat=", expectedSeat, "actual=", seatIndex);
        return;
    }

    // --- 分支：根据 baoTurn 和 isBao 决定下一步 ---

    // 庄家选包 / 闲家选包 → 直接锁定，翻财神，开始出牌
    if(isBao){
        game.baoSeatIndex = seatIndex;
        game.baoTai = Math.max(2, parseInt(baoTai) || 2); // 二台起包
        game.baoTaiFee = Math.max(0, parseInt(baoTaiFee) || 0);
        game.baoMode = (parseInt(caishenMode) == 2) ? 2 : 1;
        console.log("[包财神] seat=", seatIndex, "选择包", game.baoTai, "台，包台费", game.baoTaiFee, "mode=", game.baoMode == 2 ? "双财神" : "单财神");
        game.baoDecided = true;
        finishBaoProcess(game, roomId);
        return;
    }

    // 选不包
    if(game.baoTurn == 0){
        // 庄家选不包 → 传给闲家
        game.baoTurn = 1;
        game.baoSeatIndex = -1;
        console.log("[包财神] 庄家选不包，等待闲家选择");
        var xianSeat = game.gameSeats[1 - game.button];
        userMgr.sendMsg(xianSeat.userId, 'bao_select_push', { turn: 1, forced: false });
        // 通知所有人轮到闲家
        userMgr.brocastInRoom(roomId, 'bao_turn_push', { turn: 1, seatIndex: 1 - game.button });
        return;
    }

    if(game.baoTurn == 1){
        // 闲家选不包 → 回到庄家，强制2台硬包
        game.baoTurn = 2;
        game.baoSeatIndex = game.button;
        game.baoTai = 2;           // 起包台数
        game.baoTaiFee = 0;
        game.baoMode = 1;          // 硬包单财神
        game.baoDecided = true;
        console.log("[包财神] 闲家也不包，庄家强制硬包", game.baoTai, "台");
        finishBaoProcess(game, roomId);
        return;
    }
};

// 包财神决策完成后的通用流程：翻财神 → 重算听牌 → 广播 → 开始出牌
function finishBaoProcess(game, roomId){
    // 翻财神（单财神：1张；包且选双财神：连续2张）
    fanCaishen(game);
    if(game.baoSeatIndex >= 0 && game.baoMode == 2 && game.caishen >= 0){
        game.caishen2 = nextCaishenOf(game.caishen);
    } else {
        game.caishen2 = -1;
    }

    // 财神确定后重算所有人听牌
    for(var i = 0; i < 2; ++i){
        rebuildCountMap(game.gameSeats[i]);
        checkTingPai(game.gameSeats[i], game.caishen, game.caishen2);
    }

    // 广播包台结果（携带财神信息，客户端此时才显示财神）
    userMgr.brocastInRoom(roomId, 'bao_result_push', {
        isBao: game.baoSeatIndex >= 0,
        baoSeatIndex: game.baoSeatIndex,
        baoTai: game.baoTai || 0,
        baoTaiFee: game.baoTaiFee || 0,
        baoMode: game.baoMode || 1,
        caishen: game.caishen,
        caishen2: game.caishen2,
        fanPai: game.fanPai,
        numofmj: game.mahjongs.length - game.currentIndex
    });

    // 庄家开始出牌
    var zhuangSeat = game.gameSeats[game.button];
    sendOperations(game, zhuangSeat, zhuangSeat.holds[zhuangSeat.holds.length-1]);
}

// 该房间是否有对局进行中（用于断线重连判断）
exports.isPlaying = function(roomId){
    return games[roomId] != null;
};

// 房间是否已开局（socket_service 退出房间时调用）
exports.hasBegan = function(roomId){
    //结算停留期(game对象保留且gameOver=true)不算对局中:否则结算期间退出/解散被误拒
    var game = games[roomId];
    return game != null && game.gameOver != true;
};

// 玩家准备；全员准备后开局
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

    var count = 0;
    for(var i = 0; i < roomInfo.seats.length; ++i){
        if(roomInfo.seats[i].ready){
            count++;
        }
    }

    if(count == roomInfo.seats.length){
        // 人齐了，延时1秒开局
        setTimeout(function(){
            var room = roomMgr.getRoom(roomId);
            if(room != null){
                exports.begin(room);
            }
        }, 1000);
    }
};

// 开一局：轮庄、清准备状态、通知局数与庄家、发牌
exports.begin = function(roomInfo){
    // 老庄逻辑：庄家胡牌则连庄，laozhuangCount++；否则轮庄，重置
    if(roomInfo.numOfGames > 0){
        if(roomInfo.lastHuIsBanker){
            // 庄家胡牌，连庄
            roomInfo.laozhuangCount = (roomInfo.laozhuangCount || 0) + 1;
        } else {
            // 闲家胡牌或流局，轮庄
            roomInfo.nextButton = (roomInfo.nextButton + 1) % 2;
            roomInfo.laozhuangCount = 0;
        }
    } else {
        roomInfo.laozhuangCount = 0;
    }
    roomInfo.numOfGames++;
    for(var i = 0; i < roomInfo.seats.length; ++i){
        roomInfo.seats[i].ready = false;
    }

    var anyUserId = roomInfo.seats[0].userId;
    userMgr.broacastInRoom('game_num_push', roomInfo.numOfGames, anyUserId, true);
    userMgr.broacastInRoom('game_begin_push', roomInfo.nextButton, anyUserId, true);

    exports.start(roomInfo);
};

// ========== 解散房间（2人重构时丢失，补回） ==========
exports.dissolveRequest = function(roomId, userId){
    var roomInfo = roomMgr.getRoom(roomId);
    if(roomInfo == null){
        return null;
    }
    if(roomInfo.dr != null){
        return {dr: roomInfo.dr};
    }
    var states = [];
    for(var i = 0; i < roomInfo.seats.length; ++i){
        states.push(roomInfo.seats[i].userId == userId);
    }
    roomInfo.dr = {
        endTime: Date.now() + 300000,
        states: states
    };
    return {dr: roomInfo.dr};
};

exports.dissolveAgree = function(roomId, userId, agree){
    var roomInfo = roomMgr.getRoom(roomId);
    if(roomInfo == null || roomInfo.dr == null){
        return null;
    }
    var seatIndex = roomMgr.getUserSeat(userId);
    if(seatIndex == null){
        return null;
    }
    roomInfo.dr.states[seatIndex] = agree;
    return {dr: roomInfo.dr};
};

exports.doDissolve = function(roomId){
    var roomInfo = roomMgr.getRoom(roomId);
    if(roomInfo == null){
        return;
    }
    for(var i = 0; i < roomInfo.seats.length; ++i){
        var userId = roomInfo.seats[i].userId;
        if(userId > 0){
            userMgr.sendMsg(userId, 'dispress_push', {});
        }
    }
    roomInfo.dr = null;
    roomMgr.destroy(roomId);
};

// 换三张 / 定缺：诸暨玩法不使用，提供空实现防止调用崩溃
exports.huanSanZhang = function(userId, p1, p2, p3){};
exports.dingQue = function(userId, que){};
