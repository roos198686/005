/**
 * 浙江诸暨麻将 - 翻财神（独立玩法后端，type=zj）
 * 规则特点：
 * 1. 使用136张牌（无花牌）
 * 2. 翻财神：发完牌翻一张定财神，财神可替代任何牌、可吃碰杠
 * 3. 每人13张牌（庄家14张）
 * 4. 可吃、碰、杠
 * 5. 一台起胡：胡牌台数需≥后台配置的 min_tai（缺省1台）
 * 6. 自摸、点炮、杠开、抢杠胡；老庄翻倍；封顶台数走后台配置
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

// 诸暨赖倒胡：无台数门槛，任何合法牌型均可胡（min_tai 强制 0）
function getMinTai(game){
    return 0;
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

    // 赖倒胡：发完牌后翻一张定财神（翻财神模式）
    fanCaishen(game);
}

// 胡牌判定（支持财神替代，caishen2 为双财神第二张）
function checkCanHu(seatData, caishen, caishen2){
    var holds = seatData.holds;
    var numPeng = (seatData.pengs ? seatData.pengs.length : 0);
    var numChi = (seatData.chis ? seatData.chis.length : 0);
    var numGang = (seatData.gangs ? seatData.gangs.length : 0);
    // 胡牌时(手牌+副露)总数 = 14 + 杠数（杠4张当1组面子，多1张是补的）；
    // 手牌期望 = (14+杠数) - 3*碰 - 3*吃 - 4*杠 = 14 - 3*碰 - 3*吃 - 3*杠
    // （杠按4减是错的：1杠后点炮试进为11张，按4算出10会永远判不能胡）
    var expectedLen = 14 - 3 * numPeng - 3 * numChi - 3 * numGang;
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
        else if(v == 7){
            // 最小牌是8(八万/八筒/八条): 唯一合法顺子是"8+9+财神当7"
            var q2 = first + 1;
            if((countMap[q2] || 0) > 0 && caishenCount >= 1){
                countMap[first]--;
                countMap[q2]--;
                if(canFormMelds(countMap, caishenCount - 1)){
                    countMap[first]++;
                    countMap[q2]++;
                    return true;
                }
                countMap[first]++;
                countMap[q2]++;
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

// 从手牌中移除 n 张财神（优先消耗财神，其次第二财神），同步 holds 和 countMap，返回实际移除的牌值数组
function removeCaishenTiles(game, seatData, n){
    var types = [];
    if(game.caishen != null && game.caishen >= 0) types.push(game.caishen);
    if(game.caishen2 != null && game.caishen2 >= 0) types.push(game.caishen2);
    var removedTiles = [];
    for(var i = 0; i < n; ++i){
        var removed = false;
        for(var t = 0; t < types.length && !removed; ++t){
            var idx = seatData.holds.indexOf(types[t]);
            if(idx != -1){
                seatData.holds.splice(idx, 1);
                seatData.countMap[types[t]] = Math.max(0, (seatData.countMap[types[t]] || 0) - 1);
                // 财神被吃/碰/杠用掉后记下来，结算"无财"时不能漏（副露里只记顶替后的牌面值）
                seatData.caishenInMelds = (seatData.caishenInMelds || 0) + 1;
                removedTiles.push(types[t]);
                removed = true;
            }
        }
        if(!removed) break;
    }
    return removedTiles;
}

function checkCanPeng(game, seatData, targetPai){
    if(hasGanged(seatData, targetPai)) return; //已杠过的牌不能再碰（杠组已封存）
    // 财神作为弃牌不可碰：财神打出即废，即使手牌有同面值真牌也不允许碰
    if(isCaishenPai(game, targetPai)) return;
    var count = seatData.countMap[targetPai] || 0;
    var csCount = game.cai_peng ? getCaishenCount(seatData, game.caishen, game.caishen2) : 0;
    if(count + csCount >= 2 && count >= 1) seatData.canPeng = true;
}

// 某张牌是否已被该玩家杠过（真杠/财神杠均算），杠过的牌禁止再杠
function hasGanged(seatData, pai){
    if(!seatData.gangs) return false;
    for(var i = 0; i < seatData.gangs.length; ++i){
        if(seatData.gangs[i] && seatData.gangs[i].pai == pai) return true;
    }
    return false;
}

function checkCanGang(game, seatData, targetPai){
    if(game.mahjongs.length <= game.currentIndex) return;
    if(hasGanged(seatData, targetPai)) return; //已杠过的牌不能再杠
    // 财神作为弃牌不可杠：财神打出即废，即使手牌有同面值真牌也不允许杠
    if(isCaishenPai(game, targetPai)) return;
    var count = seatData.countMap[targetPai] || 0;
    var csCount = game.cai_gang ? getCaishenCount(seatData, game.caishen, game.caishen2) : 0;
    if(count + csCount >= 3 && count >= 1){
        seatData.canGang = true;
        seatData.gangPai.push(targetPai);
    }
}

function checkCanAnGang(game, seatData){
    if(game.mahjongs.length <= game.currentIndex) return;
    var csCount = game.cai_gang ? getCaishenCount(seatData, game.caishen, game.caishen2) : 0;
    for(var key in seatData.countMap){
        var pai = parseInt(key);
        if(hasGanged(seatData, pai)) continue; //已杠过的牌不能再杠
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
    var csCount = game.cai_gang ? getCaishenCount(seatData, game.caishen, game.caishen2) : 0;
    for(var i = 0; i < seatData.pengs.length; ++i){
        var pai = seatData.pengs[i];
        if(hasGanged(seatData, pai)) continue; //已杠过的牌不能再杠
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
    if(isCaishenPai(game, targetPai)) return; //财神不参与吃
    var type = getMJType(targetPai);
    var cm = seatData.countMap;
    var csCount = game.cai_chi ? getCaishenCount(seatData, game.caishen, game.caishen2) : 0;

    // 检查某张牌是否可用（真实存在）
    var hasPai = function(p){
        if(p < type*9 || p >= type*9+9) return false;
        if(p == targetPai) return false; // targetPai 是别人出的
        // 翻财神:财神面值的牌(全部)已被视为财神,不能再按原面值充当真牌
        // 否则同一张牌既算真实牌又算补位财神,双重使用(例:手里仅财神九万,吃八万被误判)
        if(isCaishenPai(game, p)) return false;
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

        // 至少要有一张真实牌 + 财神补位不超过配置数量 + 补位总数不超过实际财神数
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
    // 后台开关：禁止点炮胡时直接返回（只保留抢杠胡作为非自摸胡的入口）
    if(game.dianpao_hu === 0){
        return;
    }
    // 财神不可接炮胡（对家打出财神不能胡）
    if(isCaishenPai(game, targetPai)){
        return;
    }
    // 直接把打出的牌试进手牌判胡，不依赖 tingMap 同步状态，避免漏判
    seatData.holds.push(targetPai);
    seatData.countMap[targetPai] = (seatData.countMap[targetPai] || 0) + 1;
    // 赖倒胡:无台数门槛,checkCanHu 通过即可胡
    seatData.canHu = checkCanHu(seatData, game.caishen, game.caishen2);
    seatData.countMap[targetPai]--;
    seatData.holds.pop();
    console.log("[checkCanDianPaoHu v2] targetPai=", targetPai, "holds=", seatData.holds.length, "canHu=", seatData.canHu);
}

// 弯杠前检查抢杠胡：给除杠者外的所有座位做一次"把 pai 当弃牌"的接炮胡判定
// 返回 true 表示有人可以抢杠（已给对应玩家设置 canHu=true + sendOperations），否则返回 false
function checkCanQiangGang(game, gangSeatIndex, pai){
    var hasActions = false;
    for(var i = 0; i < 2; ++i){
        if(i == gangSeatIndex) continue; // 杠者自己不能抢自己的杠
        var sd = game.gameSeats[i];
        // 财神本身不可接炮胡（但此处 pai 已经保证是真牌）
        // 直接把 pai 试进手牌判胡（完全复用 checkCanDianPaoHu 的内核，独立走一遍不依赖 checkCanHu 缓存）
        sd.holds.push(pai);
        sd.countMap[pai] = (sd.countMap[pai] || 0) + 1;
        // 赖倒胡:无台数门槛,checkCanHu 通过即可抢杠胡
        var can = checkCanHu(sd, game.caishen, game.caishen2);
        sd.countMap[pai]--;
        sd.holds.pop();
        if(can){
            sd.canHu = true;
            hasActions = true;
            sendOperations(game, sd, pai); // 用 pai 作为 target 让客户端知道胡的是哪张
        } else {
            sd.canHu = false;
        }
    }
    return hasActions;
}

// 执行弯杠（补杠）的实际牌力变更：从手牌扣 1 张真牌或财神，pengs 转 gangs
// 注：调用前必须确认 pai 在 seatData.holds 里存在（真牌）或有可用财神
function doWanGang(game, seatData, pai){
    var count = seatData.countMap[pai] || 0;
    if(count >= 1){
        var idx = seatData.holds.indexOf(pai);
        if(idx != -1) seatData.holds.splice(idx, 1);
        seatData.countMap[pai] = count - 1;
    } else {
        // 用财神补杠
        removeCaishenTiles(game, seatData, 1);
    }
    // 弯杠成立后原碰组转为杠组：从 pengs/pengTiles 移除，否则胡牌长度判定(3碰+4杠=7张)错乱
    var pi = seatData.pengs.indexOf(pai);
    if(pi != -1){
        seatData.pengs.splice(pi, 1);
        if(seatData.pengTiles && seatData.pengTiles.length > pi) seatData.pengTiles.splice(pi, 1);
    }
    seatData.gangs.push({pai: pai, type: 'wan'});
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

// 清除 pending 的自动摸牌 timeout，防止上一回合残留的 timeout 干扰当前操作
function clearMoPaiTimeout(game){
    if(game && game.mopaiTimeoutId){
        clearTimeout(game.mopaiTimeoutId);
        game.mopaiTimeoutId = null;
    }
}
// 设置自动摸牌 timeout，500ms 后摸牌；自动清除旧的
function scheduleMoPai(game){
    clearMoPaiTimeout(game);
    game.mopaiTimeoutId = setTimeout(function(){
        game.mopaiTimeoutId = null;
        doUserMoPai(game);
    }, 500);
}

// 出牌/操作倒计时(秒):后台taiRules.chupai_timeout可配,缺省15秒
function getChupaiTimeout(game){
    return taiRule(game, 'chupai_timeout', 15);
}
function clearTurnTimeout(game){
    if(game && game.turnTimeoutId){
        clearTimeout(game.turnTimeoutId);
        game.turnTimeoutId = null;
    }
}
// 倒计时结束系统代打:出牌超时打最后一张手牌(摸到的牌在末尾);操作超时自动过
function scheduleTurnTimeout(game, seatIndex, isAction){
    clearTurnTimeout(game);
    var sec = getChupaiTimeout(game);
    if(sec <= 0) return; //0=关闭托管
    game.turnTimeoutId = setTimeout(function(){
        game.turnTimeoutId = null;
        if(!game || game.gameOver) return;
        var sd = game.gameSeats[seatIndex];
        if(!sd || sd.userId <= 0) return;
        if(isAction){
            if(hasOperations(sd)){
                console.log("[托管] 操作超时自动过 userId=", sd.userId);
                exports.guo(sd.userId);
            }
            return;
        }
        if(seatIndex != game.turn) return;
        var pai = sd.holds[sd.holds.length - 1];
        if(pai != null && pai >= 0){
            console.log("[托管] 出牌超时系统代打 userId=", sd.userId, "pai=", pai);
            exports.chuPai(sd.userId, pai);
        }
    }, sec * 1000);
}

function doUserMoPai(game){
    if(!game || game.gameOver) return; //残留定时器守卫：局已结束不得再摸牌推送
    console.log("[doUserMoPai] stack:", new Error().stack.split('\n').slice(1,4).join(' | '));
    console.log("[doUserMoPai] turn=",game.turn,"caishen=",game.caishen,"caishen2=",game.caishen2);
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
    // 赖倒胡:无台数门槛,checkCanHu 通过即可自摸
    if(checkCanHu(turnSeat, game.caishen, game.caishen2)){
        turnSeat.canHu = true;
    }
    // 财吊:手里有财神 + 摸牌前已听牌 → 摸任何一张牌都算能胡
    // 前提是手牌本身必须是听牌状态(差一张即能组成基础胡法),财神才能"吊"住那张缺的牌
    if(!turnSeat.canHu && game.cai_diao){
        var _csCnt = getCaishenCount(turnSeat, game.caishen, game.caishen2);
        var _tingCount = Object.keys(turnSeat.tingMap || {}).length;
        if(_csCnt > 0 && _tingCount > 0){
            turnSeat.caiDiao = true;
            turnSeat.canHu = true;
        }
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
        data.holds = isTurn ? sd.holds.slice() : game.gameSeats[game.turn].holds.length;
        userMgr.sendMsg(sd.userId, 'game_mopai_push', data);
    }
    //摸牌完成进入出牌倒计时,超时系统代打
    scheduleTurnTimeout(game, game.turn, false);
}

function doGameOver(game){
    game.gameOver = true;
    clearTurnTimeout(game);
    clearMoPaiTimeout(game);
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
                tailog: seat.taiLog || [],
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
            name: seat.name,
            seatindex: i,
            score: seat.score - (seat.startScore || 0),
            totalscore: seat.score,
            holds: seat.holds.slice(),
            pengs: seat.pengs.slice(),
            pengTiles: seat.pengTiles ? JSON.parse(JSON.stringify(seat.pengTiles)) : [],
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

    // 记录每局分数明细（整场结算面板展示每一局得分用）
    if(!roomInfo.roundHistory) roomInfo.roundHistory = [];
    var roundItem = { index: roomInfo.numOfGames, scores: [] };
    for(var i = 0; i < 2; ++i){
        var scoreItem = { userid: results[i].userid, name: results[i].name, score: results[i].score };
        //本局胡牌方记录台数/自摸,结算面板每局显示"X家胡T台";荒庄无人胡则无该字段
        if(results[i].huinfo && results[i].huinfo.length > 0){
            for(var h = 0; h < results[i].huinfo.length; ++h){
                var hi = results[i].huinfo[h];
                if(hi && hi.ishupai){
                    scoreItem.tai = hi.fan || 0;
                    scoreItem.zimo = (hi.action == 'zimo');
                    break;
                }
            }
        }
        roundItem.scores.push(scoreItem);
    }
    roomInfo.roundHistory.push(roundItem);

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
        // 全部局数打完:标记最终结算,客户端据此显示总分并等待玩家点击"退出房间"
        pushData.final = true;
        // 每局分数明细，客户端整场结算面板展示
        pushData.roundHistory = roomInfo.roundHistory || [];
    }

    userMgr.brocastInRoom(roomId, 'game_over_push', pushData);

    // 保存最近一局结算数据:玩家在结算弹窗停留期间断线/重开客户端重进房间时,
    // resendGameState 据此补发 game_over_push,使其回到结算界面(整场未打满时也如此)
    game.lastResult = pushData;

    // 结算后清空准备状态并广播:否则 ready 残留 true,重进房间的客户端因"已准备"不显示开始按钮、
    // 服务端 setReady 又因 ready=true 直接 return,死锁无人能开下一局
    for(var gi = 0; gi < roomInfo.seats.length; ++gi){
        var gs = roomInfo.seats[gi];
        if(gs.ready){
            gs.ready = false;
            userMgr.sendMsg(gs.userId, 'user_state_changed', {userid: gs.userId, ready: false});
        }
    }

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

    // 打完所有局数：不再自动踢人解散；已推送 final:true 的结算,等待客户端点击"退出房间"(leave_room)
    // 房间清理由 roommgr 的空置超时(全员离线满5分钟)或创建超4小时强制解散兜底,不会永久残留
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
    }
}

exports.chuPai = function(userId, pai){
    var game = getGameByUserID(userId);
    if(game == null || game.gameOver){ console.log('[chuPai reject] 无对局或已结束: userId='+userId+' game='+(game!=null)+' gameOver='+(game&&game.gameOver)); return; }
    var seatIndex = getSeatIndex(userId);
    if(seatIndex != game.turn){ console.log('[chuPai reject] 非本人轮次: userId='+userId+' seat='+seatIndex+' turn='+game.turn); return; }
    // 上一次出牌后对家还有未处理的吃/碰/杠/胡选择时禁止再出牌(必须等其过/吃/碰/杠,防止连打顶掉操作弹窗)
    for(var i = 0; i < 2; ++i){
        if(i != seatIndex && hasOperations(game.gameSeats[i])){
            var _ops = game.gameSeats[i];
            console.log('[chuPai reject] 对家操作未决: seat='+i+' gang='+!!_ops.canGang+' peng='+!!_ops.canPeng+' hu='+!!_ops.canHu+' chi='+!!_ops.canChi);
            return;
        }
    }

    var seatData = game.gameSeats[seatIndex];
    seatData.lastGangHua = false; //出牌即放弃杠上开花机会(仅杠后摸牌胡才加台)
    var idx = seatData.holds.indexOf(pai);
    if(idx == -1) return;
    // 上面校验全部通过才算有效出牌,此时才清倒计时
    // (不能在函数开头清:被拒绝的出牌尝试会清掉对家的操作倒计时,对家不响应时永远无法超时托管代过,双方都打不出牌)
    clearTurnTimeout(game); //玩家已动作,清掉出牌/操作倒计时

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
    var opSeat = -1;
    for(var i = 0; i < 2; ++i){
        if(i != seatIndex && hasOperations(game.gameSeats[i])){
            hasOp = true;
            opSeat = i;
            break;
        }
    }
    if(!hasOp){
        moveToNextUser(game);
        scheduleMoPai(game);
    }
    else{
        //对家有吃/碰/杠/胡待选:进入操作倒计时,超时自动过
        scheduleTurnTimeout(game, opSeat, true);
    }
};

exports.peng = function(userId){
    var game = getGameByUserID(userId);
    if(game == null || game.gameOver) return;
    clearTurnTimeout(game);
    clearMoPaiTimeout(game); // 清除上一回合残留的自动摸牌
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
    // 记录碰组真实组成：被碰的牌 + 手中真牌 + 财神，供客户端区分真碰/财神碰显示
    var realCount = Math.min(count, 2);
    // 移除 targetPai
    for(var i = 0; i < realCount; ++i){
        var idx = seatData.holds.indexOf(pai);
        if(idx != -1) seatData.holds.splice(idx, 1);
    }
    seatData.countMap[pai] = Math.max(0, count - 2);
    // 移除财神（含双财神第二张），返回实际移除的财神牌值
    var csTiles = removeCaishenTiles(game, seatData, removeCs);

    var tiles = [pai];
    for(var i = 0; i < realCount; ++i) tiles.push(pai);
    for(var i = 0; i < csTiles.length; ++i) tiles.push(csTiles[i]);
    seatData.pengTiles.push(tiles);

    seatData.pengs.push(pai);
    game.turn = seatIndex;
    game.chuPai = -1; // 弃牌已被碰走，标记当前无待响应弃牌，后续"过"按自己操作后处理（不切轮次）

    console.log("[PENG-ldh] user=",userId,"pai=",pai,"count=",count,"removeCs=",removeCs,"caishen=",game.caishen,"caishen2=",game.caishen2);
    console.log("[PENG-ldh] holds.length=",seatData.holds.length,"holds=",JSON.stringify(seatData.holds));

    // 逐个发送，每人只收到自己的手牌
    var roomId = roomMgr.getRoomIdOfUser(userId);
    for(var i = 0; i < 2; ++i){
        var sd = game.gameSeats[i];
        var data = {si: seatIndex, pai: pai, pengTiles: seatData.pengTiles};
        // 对手必须收到"操作者"的手牌数量，不是自己的
        data.holds = (i === seatIndex) ? sd.holds.slice() : seatData.holds.length;
        console.log("[PENG-ldh] send to seat",i,"userId=",sd.userId,"holds=",typeof data.holds === 'object' ? data.holds.length + ':' + JSON.stringify(data.holds) : data.holds);
        userMgr.sendMsg(sd.userId, 'game_peng_push', data);
    }

    clearAllOptions(game);
    rebuildCountMap(seatData);
    checkTingPai(seatData, game.caishen, game.caishen2);
    // 赖倒胡:无台数门槛,checkCanHu 通过即可胡
    seatData.canHu = checkCanHu(seatData, game.caishen, game.caishen2);
    checkCanAnGang(game, seatData);
    checkCanWanGang(game, seatData);
    sendOperations(game, seatData, -1);
};

exports.gang = function(userId, pai){
    var game = getGameByUserID(userId);
    if(game == null || game.gameOver) return;
    clearTurnTimeout(game);
    clearMoPaiTimeout(game); // 清除上一回合残留
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
        // 补杠（弯杠）：碰过的牌手中还有一张（真牌或财神）
        var needCs = (count >= 1) ? 0 : 1;

        // 抢杠胡窗口期：用真牌弯杠前，先让其他玩家检查能否胡这张要杠的牌
        // 财神补杠暴露的是财神，本身不可接炮胡，checkCanDianPaoHu 自然返回 false，无需额外分支
        if(count >= 1){
            var canQiang = checkCanQiangGang(game, seatIndex, pai);
            if(canQiang){
                // 能抢，记录上下文并暂停杠流程：等其他玩家胡或过
                game.qiangGangContext = {
                    gangSeatIndex: seatIndex,
                    pai: pai,
                    needCs: 0,
                    isValid: true
                };
                // 杠者自己也需要保留杠选项（万一没人抢还可以继续杠）
                sendOperations(game, seatData, -1);
                return;
            }
        }

        // 无人可抢 / 财神补杠：正常执行弯杠
        doWanGang(game, seatData, pai);
    }

    // 标记杠上开花
    seatData.lastGangHua = true;

    game.turn = seatIndex;
    game.chuPai = -1; // 杠后无待响应弃牌（点杠的弃牌已被杠走），后续"过"不切轮次

    // 逐个发送，每人只收到自己的手牌
    var roomId = roomMgr.getRoomIdOfUser(userId);
    for(var i = 0; i < 2; ++i){
        var sd = game.gameSeats[i];
        var data = {si: seatIndex, pai: pai, gangtype: seatData.gangs[seatData.gangs.length-1].type, pengs: seatData.pengs, pengTiles: seatData.pengTiles};
        // 对手必须收到"操作者"的手牌数量，不是自己的；弯杠需同步移除后的碰组
        data.holds = (i === seatIndex) ? sd.holds.slice() : seatData.holds.length;
        userMgr.sendMsg(sd.userId, 'game_gang_push', data);
    }

    clearAllOptions(game);
    scheduleMoPai(game);
};

exports.chi = function(userId, chiPais){
    var game = getGameByUserID(userId);
    if(game == null || game.gameOver) return;
    clearTurnTimeout(game);
    clearMoPaiTimeout(game); // 清除上一回合残留
    var seatIndex = getSeatIndex(userId);
    var seatData = game.gameSeats[seatIndex];
    if(!seatData.canChi) return;

    var pai = game.chuPai;

    //严格校验：3张、包含别人出的pai、另两张是手中真实非财神牌、同花色且连续；非法则不腐蚀手牌
    var valid = false;
    if(chiPais && chiPais.length == 3 && pai >= 0 && chiPais.indexOf(pai) != -1 && !isCaishenPai(game, pai)){
        var mine = [];
        for(var i = 0; i < 3; ++i){
            if(chiPais[i] != pai) mine.push(chiPais[i]);
        }
        if(mine.length == 2){
            var ctype = getMJType(pai);
            var csA = isCaishenPai(game, mine[0]);
            var csB = isCaishenPai(game, mine[1]);
            var csUsed = (csA ? 1 : 0) + (csB ? 1 : 0);
            if(csUsed == 0){
                // 两张都是真实牌：按面值连续校验
                var all = mine.concat([pai]).sort(function(a,b){return a-b;});
                var sequential = (all[0] >= ctype*9) && (all[2] < ctype*9+9) && (all[1] == all[0] + 1) && (all[2] == all[1] + 1);
                valid = sequential
                    && (seatData.countMap[mine[0]] || 0) > 0
                    && (seatData.countMap[mine[1]] || 0) > 0;
            } else if(csUsed == 1){
                // 财吃：1张真实牌 + 1张财神补位成顺（与checkCanChi提示逻辑一致，受cai_chi开关控制）
                var real = csA ? mine[1] : mine[0];
                var csPai = csA ? mine[0] : mine[1];
                var diff = Math.abs(real - pai);
                valid = !!game.cai_chi
                    && getMJType(real) == ctype && diff >= 1 && diff <= 2
                    && (seatData.countMap[csPai] || 0) > 0
                    && (seatData.countMap[real] || 0) > 0;
            }
            // csUsed == 2：两张全用财神补位不合法（与checkCanChi至少要有一张真实牌一致），valid保持false
        }
    }
    if(!valid){
        //非法吃牌：重推操作选项让玩家重选
        sendOperations(game, seatData, pai);
        return;
    }

    var discarderIdx = game.turn;
    var discarder = game.gameSeats[discarderIdx];
    if(discarder && discarder.folds){
        var fi = discarder.folds.lastIndexOf(pai);
        if(fi != -1) discarder.folds.splice(fi, 1);
    }

    // chiPais 是3张牌，其中 pai 是别人出的，另外两张是玩家的（已校验为手中真实非财神牌）
    for(var i = 0; i < chiPais.length; ++i){
        var p = chiPais[i];
        if(p == pai) continue;
        var idx = seatData.holds.indexOf(p);
        if(idx != -1){
            seatData.holds.splice(idx, 1);
            seatData.countMap[p]--;
        }
    }
    seatData.chis.push(chiPais.slice().sort(function(a,b){return a-b;}));
    game.turn = seatIndex;
    game.chuPai = -1; // 弃牌已被吃走，后续"过"不切轮次

    // 逐个发送，每人只收到自己的手牌
    var roomId = roomMgr.getRoomIdOfUser(userId);
    for(var i = 0; i < 2; ++i){
        var sd = game.gameSeats[i];
        var data = {si: seatIndex, pais: chiPais};
        // 对手必须收到"操作者"的手牌数量，不是自己的
        data.holds = (i === seatIndex) ? sd.holds.slice() : seatData.holds.length;
        userMgr.sendMsg(sd.userId, 'game_chi_push', data);
    }

    clearAllOptions(game);
    rebuildCountMap(seatData);
    checkTingPai(seatData, game.caishen, game.caishen2);
    // 赖倒胡:无台数门槛,checkCanHu 通过即可胡
    seatData.canHu = checkCanHu(seatData, game.caishen, game.caishen2);
    sendOperations(game, seatData, -1);
};

exports.hu = function(userId){
    var game = getGameByUserID(userId);
    if(game == null || game.gameOver) return;
    clearTurnTimeout(game);
    var seatIndex = getSeatIndex(userId);
    var seatData = game.gameSeats[seatIndex];
    if(!seatData.canHu) return;

    seatData.hued = true;
    seatData.canHu = false;

    var isQiangGang = (game.qiangGangContext != null && game.qiangGangContext.isValid);
    var isZimo, huPai;

    if(isQiangGang){
        // 抢杠胡：从杠者手里把要弯杠的牌"抢"到胡者手里
        var ctx = game.qiangGangContext;
        var gangSd = game.gameSeats[ctx.gangSeatIndex];
        var pai = ctx.pai;
        // 杠者的这张牌扣掉——弯杠被取消，pai 归胡者
        var gIdx = gangSd.holds.indexOf(pai);
        if(gIdx != -1) gangSd.holds.splice(gIdx, 1);
        gangSd.countMap[pai] = (gangSd.countMap[pai] || 0) - 1;
        // 强制 isZimo=false（算点炮胡，客户端显示"胡"而非"自摸"）
        isZimo = false;
        huPai = pai;
        // 胡者加上这张被抢来的牌
        seatData.holds.push(huPai);
        seatData.countMap[huPai] = (seatData.countMap[huPai] || 0) + 1;
        game.qiangGangContext.isValid = false; // 防止 guo 再进来
    } else {
        isZimo = (game.chuPai == -1);
        huPai = isZimo ? seatData.holds[seatData.holds.length-1] : game.chuPai;
        if(!isZimo){
            seatData.holds.push(huPai);
            seatData.countMap[huPai] = (seatData.countMap[huPai] || 0) + 1;
        }
    }

    // 计算台数（杠上开花 / 抢杠胡）
    var extraTai = 0;
    if(isZimo && seatData.lastGangHua){
        extraTai += taiRule(game, 'gang_kai', 1);
        seatData.lastGangHua = false;
    }
    if(isQiangGang){
        extraTai += taiRule(game, 'qiang_gang', 1);
    }
    var tai = calculateTai(seatData, game, isZimo, extraTai);

    // 天胡地胡：按最高台数结算（抢杠胡不可能是天/地胡）
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
        // 赖倒胡:天胡/地胡不再强制 maxTai,翻倍在 score 里处理
        console.log("[天胡地胡]", isTianHu ? "天胡" : "地胡");
    }

    // 赖倒胡:无台数门槛,checkCanHu 通过即可胡,跳过 minTai 检查

    // 计分:底分直接出(不乘 2^tai),翻倍按开关处理
    var baseScore = game.conf.baseScore || 1;
    var score = baseScore;

    // 天胡/地胡翻倍(后台可配,默认开)
    if((isTianHu || isDiHu) && game.tianhu_di !== 0){
        score = score * 2;
        if(seatData.taiLog){ seatData.taiLog.push(isTianHu?'天胡×2':'地胡×2'); }
    }

    // 财吊翻倍(后台可配,默认开):手里有财神摸任何牌都能胡
    if(seatData.caiDiao && game.cai_diao !== 0){
        score = score * 2;
        if(seatData.taiLog){ seatData.taiLog.push('财吊×2'); }
    }

    // 老庄翻倍：连庄胡牌再×2
    if(game.laozhuangCount > 0 && seatIndex == game.button){
        score = score * 2;
        if(seatData.taiLog){ seatData.taiLog.push('老庄×2'); } //结算说明里展示老庄翻倍
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
        seatIndex: seatIndex,
        qianggang: isQiangGang || false
    };
    // 记录放炮者
    if(isQiangGang){
        var gIdx2 = game.qiangGangContext.gangSeatIndex;
        game.gameSeats[gIdx2].fangpaoInfo = { target: seatIndex, pai: huPai, qianggang: true };
    } else if(!isZimo){
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
        qianggang: isQiangGang || false,
        tai: tai,
        score: score
    });

    setTimeout(function(){ doGameOver(game); }, 1000);
};

exports.guo = function(userId){
    var game = getGameByUserID(userId);
    if(game == null || game.gameOver) return;
    clearTurnTimeout(game);
    var seatIndex = getSeatIndex(userId);
    var seatData = game.gameSeats[seatIndex];

    // 抢杠胡窗口期优先处理
    if(game.qiangGangContext && game.qiangGangContext.isValid){
        var ctx = game.qiangGangContext;
        // 非杠者点"过"：清自己 canHu，检查是否所有人都过了
        if(seatIndex != ctx.gangSeatIndex){
            seatData.canHu = false;
            seatData.canGang = false;
            seatData.gangPai = [];
            // 检查其余非杠座位是否都已过（canHu 均为 false）
            var allOver = true;
            for(var i = 0; i < 2; ++i){
                if(i == ctx.gangSeatIndex) continue;
                if(game.gameSeats[i].canHu) { allOver = false; break; }
            }
            userMgr.sendMsg(seatData.userId, 'game_action_push');
            if(allOver){
                // 抢杠窗口期结束：执行弯杠
                var gangSd = game.gameSeats[ctx.gangSeatIndex];
                game.qiangGangContext = null;
                doWanGang(game, gangSd, ctx.pai);
                gangSd.lastGangHua = true;
                game.turn = ctx.gangSeatIndex;
                game.chuPai = -1;
                // 逐个推送
                var roomIdQG = roomMgr.getRoomIdOfUser(gangSd.userId);
                for(var k = 0; k < 2; ++k){
                    var sdQG = game.gameSeats[k];
                    var dataQG = {si: ctx.gangSeatIndex, pai: ctx.pai, gangtype: 'wan', pengs: gangSd.pengs, pengTiles: gangSd.pengTiles};
                    dataQG.holds = (k === ctx.gangSeatIndex) ? sdQG.holds.slice() : gangSd.holds.length;
                    userMgr.sendMsg(sdQG.userId, 'game_gang_push', dataQG);
                }
                clearAllOptions(game);
                scheduleMoPai(game);
            }
            return;
        }
        // 杠者自己发 guo：放弃弯杠，清除 qiangGangContext，恢复正常出牌流程
        var gangSdQuit = game.gameSeats[ctx.gangSeatIndex];
        game.qiangGangContext = null;
        gangSdQuit.canGang = false;
        gangSdQuit.gangPai = [];
        userMgr.sendMsg(gangSdQuit.userId, 'game_action_push');
        return;
    }

    clearAllOptions(game, seatData);

    // 自己摸牌后的杠/胡选项：选择"过"则清除全部选项，推送空操作让玩家直接出牌
    if(game.chuPai == -1){
        seatData.lastGangHua = false; //摸牌后选择过=放弃杠上开花(仅杠后摸牌胡才加台)
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
        scheduleMoPai(game);
    }
};

// 全拆解(将+面子)搜索:返回字刻加权分最大的拆解 {kes:{pai:组数}} ,无法拆解返回 null
// 纯财神组刻不计字刻(财神无刻台);东风刻权重2,中发白刻权重1
// 用于台数统计:非对对胡牌型中"2张字牌+1财神补刻"也能算字刻台
function bestZiKeSplit(countMap, caishenCount){
    var best = null;
    var bestScore = -1;
    var ziW = function(p){ return p == 30 ? 2 : 1; }; // 东风刻2台,中发白1台
    function cloneKes(kes){ var r = {}; for(var k in kes) r[k] = kes[k]; return r; }
    function meldDfs(cm, cs, kes, ziScore){
        var first = smallestTile(cm);
        if(first == -1){
            if(cs % 3 == 0){
                // 纯财神3张成刻:按最高字牌台数(东风刻)计,走后台 dong_ke 配置
                var pureKe = cs / 3;
                if(pureKe > 0){
                    var totalScore = ziScore + pureKe * 2;
                    if(totalScore > bestScore){
                        kes[30] = (kes[30] || 0) + pureKe;
                        bestScore = totalScore;
                        best = { kes: cloneKes(kes) };
                        kes[30] -= pureKe;
                    }
                } else if(ziScore > bestScore){
                    bestScore = ziScore;
                    best = { kes: cloneKes(kes) };
                }
            }
            return;
        }
        var c = cm[first];
        // 真刻
        if(c >= 3){
            cm[first] -= 3;
            if(isZi(first)){ kes[first] = (kes[first] || 0) + 1; }
            meldDfs(cm, cs, kes, ziScore + (isZi(first) ? ziW(first) : 0));
            if(isZi(first)){ kes[first] -= 1; }
            cm[first] += 3;
        }
        // 财神补刻 2真+1财
        if(c >= 2 && cs >= 1){
            cm[first] -= 2;
            if(isZi(first)){ kes[first] = (kes[first] || 0) + 1; }
            meldDfs(cm, cs - 1, kes, ziScore + (isZi(first) ? ziW(first) : 0));
            if(isZi(first)){ kes[first] -= 1; }
            cm[first] += 2;
        }
        // 财神补刻 1真+2财
        if(c >= 1 && cs >= 2){
            cm[first] -= 1;
            if(isZi(first)){ kes[first] = (kes[first] || 0) + 1; }
            meldDfs(cm, cs - 2, kes, ziScore + (isZi(first) ? ziW(first) : 0));
            if(isZi(first)){ kes[first] -= 1; }
            cm[first] += 1;
        }
        // 顺子(字牌不能)
        if(!isZi(first)){
            var v = first % 9;
            if(v <= 6){
                var p2 = first + 1, p3 = first + 2;
                var c2 = cm[p2] || 0, c3 = cm[p3] || 0;
                if(c2 > 0 && c3 > 0){ cm[first]--; cm[p2]--; cm[p3]--; meldDfs(cm, cs, kes, ziScore); cm[first]++; cm[p2]++; cm[p3]++; }
                if(c2 > 0 && cs >= 1){ cm[first]--; cm[p2]--; meldDfs(cm, cs - 1, kes, ziScore); cm[first]++; cm[p2]++; }
                if(c3 > 0 && cs >= 1){ cm[first]--; cm[p3]--; meldDfs(cm, cs - 1, kes, ziScore); cm[first]++; cm[p3]++; }
                if(cs >= 2){ cm[first]--; meldDfs(cm, cs - 2, kes, ziScore); cm[first]++; }
            }
            else if(v == 7){
                var q2 = first + 1;
                if((cm[q2] || 0) > 0 && cs >= 1){ cm[first]--; cm[q2]--; meldDfs(cm, cs - 1, kes, ziScore); cm[first]++; cm[q2]++; }
            }
        }
        // 3财神替代 first 刻(不计字刻)
        if(cs >= 3){
            cm[first] -= 1;
            meldDfs(cm, cs - 3, kes, ziScore);
            cm[first] += 1;
        }
    }
    function tryAll(){
        var labels = Object.keys(countMap).map(Number).filter(function(p){ return countMap[p] > 0; });
        // 将: 真牌对
        for(var i = 0; i < labels.length; ++i){
            var p = labels[i];
            if(countMap[p] >= 2){
                countMap[p] -= 2;
                meldDfs(countMap, caishenCount, {}, 0);
                countMap[p] += 2;
            }
        }
        // 将: 1真+1财
        if(caishenCount >= 1){
            for(var j = 0; j < labels.length; ++j){
                var p2 = labels[j];
                if(countMap[p2] >= 1){
                    countMap[p2] -= 1;
                    meldDfs(countMap, caishenCount - 1, {}, 0);
                    countMap[p2] += 1;
                }
            }
        }
        // 将: 纯财2
        if(caishenCount >= 2){
            meldDfs(countMap, caishenCount - 2, {}, 0);
        }
    }
    tryAll();
    return best;
}

// 计算台数
// seatData: 玩家数据
// game: 游戏对象（含 caishen, playStyle, button, maxTai 等）
// isZimo: 是否自摸
// extraTai: 额外台数（杠上开花+1, 抢杠胡+1 等）
function calculateTai(seatData, game, isZimo, extraTai){
    var caishen = game.caishen;
    var caishen2 = game.caishen2;
    var tai = 0;
    var taiLog = []; // 临时台数明细日志
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

    // 判断牌型（基于拆解式判定，不按单牌数量判断刻子/顺子）
    var isDuiDuiHu = isDuiDuiHuCheck(seatData, caishen, caishen2);
    var isPingHu = isPingHuCheck(seatData, caishen, caishen2);

    // 花色判断
    var suitSet = {};
    for(var k in countMap){
        var t = getMJType(parseInt(k));
        if(t < 3) suitSet[t] = true;
        else suitSet['zi'] = true;
    }
    // 碰/杠/吃的牌也算花色;财神是百搭不带花色(财神吃/碰/杠不破坏清一色)
    var isCaiTile = function(p){ return (p == caishen) || (caishen2 != null && caishen2 >= 0 && p == caishen2); };
    if(seatData.pengs){
        for(var i = 0; i < seatData.pengs.length; ++i){
            if(isCaiTile(seatData.pengs[i])) continue;
            var t = getMJType(seatData.pengs[i]);
            if(t < 3) suitSet[t] = true; else suitSet['zi'] = true;
        }
    }
    if(seatData.gangs){
        for(var i = 0; i < seatData.gangs.length; ++i){
            if(isCaiTile(seatData.gangs[i].pai)) continue;
            var t = getMJType(seatData.gangs[i].pai);
            if(t < 3) suitSet[t] = true; else suitSet['zi'] = true;
        }
    }
    if(seatData.chis){
        for(var i = 0; i < seatData.chis.length; ++i){
            for(var j = 0; j < seatData.chis[i].length; ++j){
                if(isCaiTile(seatData.chis[i][j])) continue;
                var t = getMJType(seatData.chis[i][j]);
                suitSet[t] = true;
            }
        }
    }
    var suitKeys = Object.keys(suitSet);
    var isQingYiSe = (suitKeys.length == 1 && suitKeys[0] !== 'zi');
    var isHunYiSe = (suitKeys.length == 2 && suitSet['zi'] === true);

    // 财神总数（手牌 + 碰 + 杠 + 吃副露 + 已被副露用掉的财神）
    var caishenTotal = caishenCount + (seatData.caishenInMelds || 0);
    // 副露(碰/杠)中的财神面值牌也算"有财"（如财神=红中时碰出的红中刻是3张财神牌）
    var ci;
    if(seatData.pengs){
        for(ci = 0; ci < seatData.pengs.length; ++ci){
            if(seatData.pengs[ci] == caishen || (caishen2 >= 0 && seatData.pengs[ci] == caishen2)){ caishenTotal += 3; }
        }
    }
    if(seatData.gangs){
        for(ci = 0; ci < seatData.gangs.length; ++ci){
            var gp = seatData.gangs[ci] && seatData.gangs[ci].pai;
            if(gp != null && (gp == caishen || (caishen2 >= 0 && gp == caishen2))){ caishenTotal += 4; }
        }
    }
    if(seatData.chis){
        for(ci = 0; ci < seatData.chis.length; ++ci){
            for(var cj = 0; cj < seatData.chis[ci].length; ++cj){
                var cp = seatData.chis[ci][cj];
                if(cp == caishen || (caishen2 >= 0 && cp == caishen2)){ caishenTotal++; }
            }
        }
    }

    // 全字牌：手牌与副露全部为字牌（财神百搭不参与判定）
    var isQuanZi = (Object.keys(countMap).length > 0);
    for(var k in countMap){ if(!isZi(parseInt(k))){ isQuanZi = false; break; } }
    if(isQuanZi && seatData.pengs){ for(var i = 0; i < seatData.pengs.length; ++i){ if(isCaiTile(seatData.pengs[i])) continue; if(!isZi(seatData.pengs[i])){ isQuanZi = false; break; } } }
    if(isQuanZi && seatData.gangs){ for(var i = 0; i < seatData.gangs.length; ++i){ if(isCaiTile(seatData.gangs[i].pai)) continue; if(!isZi(seatData.gangs[i].pai)){ isQuanZi = false; break; } } }

    // ---- 台项（逐项叠加，后台可调）----
    // 1. 东风刻 / 中发白刻：基于完整拆解取最优解,真刻与财神补刻都算台
    //    (旧逻辑非对对胡只认真刻,漏算"中中+财神"这类补刻,导致台数不足不弹胡)
    var ziKeDefs = [
        [30, 'dong_ke', 2, '东风刻'],
        [27, 'zfb_ke', 1, '中刻'],
        [28, 'zfb_ke', 1, '发刻'],
        [29, 'zfb_ke', 1, '白刻']
    ];
    var handSplit = bestZiKeSplit(countMap, caishenCount);
    var handKes = handSplit ? handSplit.kes : {};
    // 碰/杠中的字刻单独计数
    var pengGangKes = {};
    if(seatData.pengs){
        for(var pg = 0; pg < seatData.pengs.length; ++pg){
            pengGangKes[seatData.pengs[pg]] = (pengGangKes[seatData.pengs[pg]] || 0) + 1;
        }
    }
    if(seatData.gangs){
        for(var gg = 0; gg < seatData.gangs.length; ++gg){
            var gp0 = seatData.gangs[gg].pai;
            pengGangKes[gp0] = (pengGangKes[gp0] || 0) + 1;
        }
    }
    for(var i = 0; i < ziKeDefs.length; ++i){
        var zp = ziKeDefs[i][0];
        var keTotal = (handKes[zp] || 0) + (pengGangKes[zp] || 0);
        if(keTotal > 0){
            var tn = taiRule(game, ziKeDefs[i][1], ziKeDefs[i][2]) * keTotal;
            tai += tn; taiLog.push(ziKeDefs[i][3] + '+' + tn);
        }
    }

    // 3. 平胡（没刻子）：+1台
    if(isPingHu){
        var tn = taiRule(game, 'ping_hu', 1);
        tai += tn; taiLog.push('平胡+'+tn);
    }

    // 4. 对对胡：+1台
    if(isDuiDuiHu){
        var tn = taiRule(game, 'duidui_hu', 1);
        tai += tn; taiLog.push('对对胡+'+tn);
    }

    // 5. 混一色：+1台
    if(isHunYiSe){
        var tn = taiRule(game, 'hun_yise', 1);
        tai += tn; taiLog.push('混一色+'+tn);
    }

    // 6. 清一色：+3台
    if(isQingYiSe){
        var tn = taiRule(game, 'qing_yise', 3);
        tai += tn; taiLog.push('清一色+'+tn);
    }

    // 7. 额外台数（杠上开花 / 抢杠胡）
    tai += extraTai;
    if(extraTai > 0) taiLog.push('额外+'+extraTai);

    // 8. 无财：手牌与副露中都没有财神 +1台
    if(caishenTotal == 0){
        var tn = taiRule(game, 'wu_cai', 1);
        tai += tn; taiLog.push('无财+'+tn);
    }

    // ---- 封顶：全字牌 / 手牌抓三个及以上财神 直接按封顶台数计 ----
    // 注意：封顶只看手牌财神(caishenCount)，碰/杠出来的财神面值刻不算"多财神"
    var maxTai = game.maxTai || 10;
    if(isQuanZi){
        tai = maxTai; taiLog.push('全字牌=封顶'+maxTai);
    } else if(caishenCount >= 3 && taiRule(game, 'san_caishen_fengding', 1) > 0){
        tai = maxTai; taiLog.push('多财神=封顶'+maxTai);
    } else if(tai > maxTai){
        tai = maxTai; taiLog.push('封顶'+maxTai);
    }
    if(tai < 0) tai = 0;

    seatData.taiLog = taiLog; // 台项明细，随结算推送显示到客户端
    console.log('[calculateTai] holds=' + JSON.stringify(holds) + ' caishen=' + caishen + ' caishen2=' + caishen2 + ' ping=' + isPingHu + ' dui=' + isDuiDuiHu + ' hun=' + isHunYiSe + ' qing=' + isQingYiSe + ' quanzi=' + isQuanZi + ' tai=' + tai + ' logs=[' + taiLog.join(',') + ']');

    return tai;
}

// 从手牌分离出 countMap(非财神牌) 与财神张数
function splitHolds(seatData, caishen, caishen2){
    var countMap = {};
    var caishenCount = 0;
    for(var i = 0; i < seatData.holds.length; ++i){
        var p = seatData.holds[i];
        if((caishen >= 0 && p == caishen) || (caishen2 != null && caishen2 >= 0 && p == caishen2)){
            caishenCount++;
        } else {
            countMap[p] = (countMap[p] || 0) + 1;
        }
    }
    return { countMap: countMap, caishenCount: caishenCount };
}

// 取牌面中最小牌值（无牌返回 -1）
function smallestTile(countMap){
    var first = -1;
    for(var k in countMap){
        if(countMap[k] > 0){
            var pk = parseInt(k);
            if(first == -1 || pk < first) first = pk;
        }
    }
    return first;
}

// 剩余手牌能否全部组成 needKe 组刻子（财神可替代）
function canFormKe(countMap, caishenCount, needKe){
    var first = smallestTile(countMap);
    if(first == -1){
        return caishenCount === needKe * 3;
    }
    if(needKe <= 0) return false;
    var c = countMap[first];
    if(c >= 3){
        countMap[first] -= 3;
        var r = canFormKe(countMap, caishenCount, needKe - 1);
        countMap[first] += 3;
        if(r) return true;
    }
    if(c >= 2 && caishenCount >= 1){
        countMap[first] -= 2;
        var r2 = canFormKe(countMap, caishenCount - 1, needKe - 1);
        countMap[first] += 2;
        if(r2) return true;
    }
    if(c >= 1 && caishenCount >= 2){
        countMap[first] -= 1;
        var r3 = canFormKe(countMap, caishenCount - 2, needKe - 1);
        countMap[first] += 1;
        if(r3) return true;
    }
    return false;
}

// canFormKe 的记录版：成功时把每刻组成写入 res（{pai: 刻组数}，含财神补刻）
function canFormKeEx(countMap, caishenCount, needKe, res){
    var first = smallestTile(countMap);
    if(first == -1){
        return caishenCount === needKe * 3;
    }
    if(needKe <= 0) return false;
    var c = countMap[first];
    if(c >= 3){
        countMap[first] -= 3;
        var r = canFormKeEx(countMap, caishenCount, needKe - 1, res);
        countMap[first] += 3;
        if(r){ res[first] = (res[first] || 0) + 1; return true; }
    }
    if(c >= 2 && caishenCount >= 1){
        countMap[first] -= 2;
        var r2 = canFormKeEx(countMap, caishenCount - 1, needKe - 1, res);
        countMap[first] += 2;
        if(r2){ res[first] = (res[first] || 0) + 1; return true; }
    }
    if(c >= 1 && caishenCount >= 2){
        countMap[first] -= 1;
        var r3 = canFormKeEx(countMap, caishenCount - 2, needKe - 1, res);
        countMap[first] += 1;
        if(r3){ res[first] = (res[first] || 0) + 1; return true; }
    }
    return false;
}

// 对对胡完整拆解：枚举三种选将方式（真对/真1+财1/纯财2），返回首个成功解的刻子构成
// 返回 {kes:{pai:组数}} 或 null
function buildKeSplit(countMap, caishenCount, needKe){
    if(needKe < 0) return null;
    var labels = Object.keys(countMap).map(Number);
    // 将方式1: 真牌对
    for(var i = 0; i < labels.length; ++i){
        var p = labels[i];
        if(countMap[p] >= 2){
            countMap[p] -= 2;
            var res = {};
            var ok = canFormKeEx(countMap, caishenCount, needKe, res);
            countMap[p] += 2;
            if(ok) return { kes: res };
        }
    }
    // 将方式2: 真1 + 财1
    if(caishenCount >= 1){
        for(var j = 0; j < labels.length; ++j){
            var p2 = labels[j];
            if(countMap[p2] >= 1){
                countMap[p2] -= 1;
                var res2 = {};
                var ok2 = canFormKeEx(countMap, caishenCount - 1, needKe, res2);
                countMap[p2] += 1;
                if(ok2) return { kes: res2 };
            }
        }
    }
    // 将方式3: 纯财2
    if(caishenCount >= 2){
        var res3 = {};
        if(canFormKeEx(countMap, caishenCount - 2, needKe, res3)) return { kes: res3 };
    }
    return null;
}

// 剩余手牌能否全部组成 needShun 组顺子（财神可替代）；字牌不能组顺子
function canFormShun(countMap, caishenCount, needShun){
    var first = smallestTile(countMap);
    if(first == -1){
        return caishenCount === needShun * 3;
    }
    if(needShun <= 0) return false;
    if(isZi(first)) return false; // 字牌只能做刻子/将，不能组顺子

    var v = first % 9;

    // first 作为最低：first, first+1, first+2（真真真/真真财/真财真/真财财）
    if(v <= 6){
        var p2 = first + 1, p3 = first + 2;
        var c2 = countMap[p2] || 0, c3 = countMap[p3] || 0;
        if(c2 > 0 && c3 > 0){
            countMap[first]--; countMap[p2]--; countMap[p3]--;
            var r = canFormShun(countMap, caishenCount, needShun - 1);
            countMap[first]++; countMap[p2]++; countMap[p3]++;
            if(r) return true;
        }
        if(c2 > 0 && caishenCount >= 1){
            countMap[first]--; countMap[p2]--;
            var r2 = canFormShun(countMap, caishenCount - 1, needShun - 1);
            countMap[first]++; countMap[p2]++;
            if(r2) return true;
        }
        if(c3 > 0 && caishenCount >= 1){
            countMap[first]--; countMap[p3]--;
            var r3 = canFormShun(countMap, caishenCount - 1, needShun - 1);
            countMap[first]++; countMap[p3]++;
            if(r3) return true;
        }
        if(caishenCount >= 2){
            countMap[first]--;
            var r4 = canFormShun(countMap, caishenCount - 2, needShun - 1);
            countMap[first]++;
            if(r4) return true;
        }
    }

    // first 作为中间：(财, first, first+1) 或 (财, first, 财)
    if(v >= 1){
        var q2 = first + 1;
        if(v <= 7 && (countMap[q2] || 0) > 0 && caishenCount >= 1){
            countMap[first]--; countMap[q2]--;
            var m1 = canFormShun(countMap, caishenCount - 1, needShun - 1);
            countMap[first]++; countMap[q2]++;
            if(m1) return true;
        }
        if(caishenCount >= 2){
            countMap[first]--;
            var m2 = canFormShun(countMap, caishenCount - 2, needShun - 1);
            countMap[first]++;
            if(m2) return true;
        }
    }

    // first 作为最高：(财, 财, first)
    if(v >= 2 && caishenCount >= 2){
        countMap[first]--;
        var h1 = canFormShun(countMap, caishenCount - 2, needShun - 1);
        countMap[first]++;
        if(h1) return true;
    }

    return false;
}

// 判断是否对对胡（全是刻子，没有顺子）
function isDuiDuiHuCheck(seatData, caishen, caishen2){
    // 如果有吃牌，肯定不是对对胡
    if(seatData.chis && seatData.chis.length > 0) return false;

    var split = splitHolds(seatData, caishen, caishen2);
    var countMap = split.countMap, cs = split.caishenCount;
    var numMelds = (seatData.pengs ? seatData.pengs.length : 0) + (seatData.gangs ? seatData.gangs.length : 0);
    var needKe = 4 - numMelds;
    if(needKe < 0) return false;

    // 选将：真牌对 / 真牌+财神 / 两张财神
    var labels = Object.keys(countMap);
    for(var i = 0; i < labels.length; ++i){
        var p = parseInt(labels[i]);
        if(countMap[p] >= 2){
            countMap[p] -= 2;
            var ok = canFormKe(countMap, cs, needKe);
            countMap[p] += 2;
            if(ok) return true;
        }
        if(countMap[p] >= 1 && cs >= 1){
            countMap[p] -= 1;
            var ok2 = canFormKe(countMap, cs - 1, needKe);
            countMap[p] += 1;
            if(ok2) return true;
        }
    }
    if(cs >= 2 && canFormKe(countMap, cs - 2, needKe)) return true;
    return false;
}

// 判断是否平胡：全顺子+将，无任何刻子（与zj4/bmj/zj4_bt严格版对齐）
// 有碰/杠副露、或手牌中存在真刻/财神补刻的牌型一律不算平胡（顺刻混合无台型，不够起胡门槛则不弹胡）
function isPingHuCheck(seatData, caishen, caishen2){
    //碰/杠本身就是刻子,有碰杠必不是平胡
    if(seatData.pengs && seatData.pengs.length > 0) return false;
    if(seatData.gangs && seatData.gangs.length > 0) return false;

    var split = splitHolds(seatData, caishen, caishen2);
    var countMap = split.countMap, cs = split.caishenCount;
    var needShun = 4 - (seatData.chis ? seatData.chis.length : 0);
    if(needShun < 0) return false;

    // 选将：真牌对 / 真牌+财神 / 两张财神；其余牌必须全部能拆成顺子(财神可补顺)
    // 手牌中的刻子(如1万x3)或财神补刻(2万2万+财神)无法拆成纯顺子,自然判为非平胡
    var labels = Object.keys(countMap);
    for(var i = 0; i < labels.length; ++i){
        var p = parseInt(labels[i]);
        if(countMap[p] >= 2){
            countMap[p] -= 2;
            var ok = canFormShun(countMap, cs, needShun);
            countMap[p] += 2;
            if(ok) return true;
        }
        if(countMap[p] >= 1 && cs >= 1){
            countMap[p] -= 1;
            var ok2 = canFormShun(countMap, cs - 1, needShun);
            countMap[p] += 1;
            if(ok2) return true;
        }
    }
    if(cs >= 2 && canFormShun(countMap, cs - 2, needShun)) return true;
    return false;
}

exports.checkCanHu = checkCanHu;
// 测试钩子：暴露台数计算，供回归测试验证台数规则
exports.__calculateTai = calculateTai;

exports.start = function(roomInfo){
    // 若同房间有残留旧局，先清掉其定时器避免污染
    if(games[roomInfo.id]) clearMoPaiTimeout(games[roomInfo.id]);
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
        playStyle: 'fancaishen',
        maxTai: roomInfo.conf.maxTai || 10,
        taiRules: roomInfo.conf.taiRules || null,
        caishen_cpg: roomInfo.conf.caishen_cpg != null ? roomInfo.conf.caishen_cpg : 1,
        cai_chi: roomInfo.conf.cai_chi != null ? roomInfo.conf.cai_chi : (roomInfo.conf.caishen_cpg != null ? roomInfo.conf.caishen_cpg : 1),
        cai_peng: roomInfo.conf.cai_peng != null ? roomInfo.conf.cai_peng : (roomInfo.conf.caishen_cpg != null ? roomInfo.conf.caishen_cpg : 1),
        cai_gang: roomInfo.conf.cai_gang != null ? roomInfo.conf.cai_gang : (roomInfo.conf.caishen_cpg != null ? roomInfo.conf.caishen_cpg : 1),
        dianpao_hu: roomInfo.conf.dianpao_hu != null ? roomInfo.conf.dianpao_hu : 1,
        tianhu_di: roomInfo.conf.tianhu_di != null ? roomInfo.conf.tianhu_di : 1,
        cai_diao: roomInfo.conf.cai_diao != null ? roomInfo.conf.cai_diao : 1,
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
            pengTiles: [], //每个碰组的真实组成牌(含财神),与pengs平行
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

    // 赖倒胡：财神开局已确定，直接算听牌
    for(var i = 0; i < 2; ++i){
        checkTingPai(game.gameSeats[i], game.caishen, game.caishen2);
    }

    games[roomInfo.id] = game;

    var data = {
        button: game.button,
        laozhuang: roomInfo.laozhuangCount || 0, //连庄次数,客户端庄标下方显示"老庄X"
        turn: game.turn, //带当前轮次(重连补发必须,否则客户端按button判定出牌权,非庄家重进后打不出去牌)
        caishen: game.caishen,
        caishen2: game.caishen2,
        fanPai: game.fanPai,
        playStyle: game.playStyle,
        chupaiTimeout: getChupaiTimeout(game), //出牌倒计时(秒),后台可配,客户端同步显示
        numofmj: game.mahjongs.length - game.currentIndex,
        seats: []
    };
    for(var i = 0; i < 2; ++i){
        var sd = game.gameSeats[i];
        data.seats.push({
            userid: sd.userId,
            name: sd.name,
            score: sd.score,
            holds: (i === game.button) ? sd.holds : sd.holds.length,
            folds: sd.folds || [],
            pengs: sd.pengs || [],
            pengTiles: sd.pengTiles || [],
            chis: sd.chis || [],
            angangs: sd.angangs || [],
            diangangs: sd.diangangs || [],
            wangangs: sd.wangangs || []
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

    // 赖倒胡：无包流程，庄家直接开始出牌
    console.log("[start] 赖倒胡 playStyle=", game.playStyle, "type=", roomInfo.conf.type);
    game.baoDecided = true;
    var zhuangSeat = game.gameSeats[game.button];
    sendOperations(game, zhuangSeat, zhuangSeat.holds[zhuangSeat.holds.length-1]);
    //庄家开局直接出牌:进入出牌倒计时,超时系统代打
    scheduleTurnTimeout(game, game.button, false);
};

exports.hasOperations = hasOperations;

// 测试钩子：暴露房间对局对象，供端到端仿真测试驱动/断言
exports.__getGame = function(roomId){ return games[roomId]; };

// 断线重连/中途进房:向指定玩家补发当前对局状态,使其能立即看到自己的手牌
exports.resendGameState = function(roomId, userId){
    var game = games[roomId];
    console.log('[resendGameState] room=' + roomId + ' userId=' + userId + ' gameExists=' + (game != null) + (game ? ' gameOver=' + game.gameOver + ' numofGames=' + game.numOfGames : ''));
    if(game == null) return;
    if(game.gameOver){
        //一局已结算(整场未必打满):补发最近一局结算数据,重连客户端直接回到结算弹窗,
        //而不是落在无按钮的空准备界面;结算数据缺失(服务端重启)时才回落到准备界面
        var roomInfo0 = roomMgr.getRoom(roomId);
        if(game.lastResult){
            if(roomInfo0 != null){
                userMgr.sendMsg(userId, 'game_num_push', roomInfo0.numOfGames);
            }
            userMgr.sendMsg(userId, 'game_over_push', game.lastResult);
        }
        return;
    }
    var roomInfo = roomMgr.getRoom(roomId); //必须在构造data前获取,否则下方引用roomInfo时为undefined导致补发中断(重进房间无牌的根因)
    var seatIndex = roomMgr.getUserSeat(userId);
    console.log('[resendGameState] seatIndex=' + seatIndex + ' holdsLen=' + (game.gameSeats[seatIndex] ? game.gameSeats[seatIndex].holds.length : 'noSeat'));
    if(seatIndex == null || game.gameSeats[seatIndex] == null) return;

    var data = {
        button: game.button,
        laozhuang: roomInfo.laozhuangCount || 0, //连庄次数,客户端庄标下方显示"老庄X"
        turn: game.turn, //带当前轮次(重连补发必须,否则客户端按button判定出牌权,非庄家重进后打不出去牌)
        caishen: game.caishen,
        caishen2: game.caishen2,
        fanPai: game.fanPai,
        playStyle: game.playStyle,
        chupaiTimeout: getChupaiTimeout(game), //出牌倒计时(秒),后台可配,客户端同步显示
        numofmj: game.mahjongs.length - game.currentIndex,
        seats: []
    };
    for(var i = 0; i < 2; ++i){
        var s = game.gameSeats[i];
        data.seats.push({
            userid: s.userId,
            name: s.name,
            score: s.score,
            holds: (i === seatIndex) ? s.holds : s.holds.length,
            folds: s.folds || [],
            pengs: s.pengs || [],
            pengTiles: s.pengTiles || [],
            chis: s.chis || [],
            angangs: s.angangs || [],
            diangangs: s.diangangs || [],
            wangangs: s.wangangs || []
        });
    }
    if(roomInfo != null){
        userMgr.sendMsg(userId, 'game_num_push', roomInfo.numOfGames);
    }
    userMgr.sendMsg(userId, 'game_start_push', data);

    // 重连补发未决操作:game_start_push 会清空客户端选项,断线期间错过的吃/碰/杠/胡弹窗必须重发,
    // 否则对家操作永久未决(服务端禁止出牌),双方都打不出牌。必须在 game_start_push 之后发。
    var mySeatData = game.gameSeats[seatIndex];
    if(mySeatData != null && hasOperations(mySeatData)){
        sendOperations(game, mySeatData, game.chuPai);
        // 对家出牌触发的待选(非本人轮次)重新起算操作倒计时,超时自动过
        if(seatIndex != game.turn){
            scheduleTurnTimeout(game, seatIndex, true);
        }
    }
};

// 赖倒胡无包流程：保留空实现，防止 socket_service 直接调用崩溃
exports.bao = function(userId, isBao, baoTai, baoTaiFee, caishenMode){ return; };

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

// 玩家准备；仅当所有在线座位都已准备后才开局（离线/空座位不计入)
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

    // 所有局数已打完:不再开新对局
    if(roomInfo.numOfGames >= roomInfo.conf.maxGames) return;

    // 对局进行中(断线重连场景):仅标记准备,不再触发新开局
    if(games[roomId] != null && games[roomId].gameOver != true) return;

    // 只有被"在线玩家"占据且已准备的座位才计数;离线/空座位不计入,避免误开局
    var readyCount = 0;
    for(var i = 0; i < roomInfo.seats.length; ++i){
        var rs = roomInfo.seats[i];
        if(rs.userId > 0 && userMgr.isOnline(rs.userId) && rs.ready){
            readyCount++;
        }
    }

    if(readyCount == roomInfo.seats.length){
        // 所有在线座位都准备好了，延时1秒开局
        setTimeout(function(){
            // 延时期间若已开局(如断线重连)或局数已打满,不再开局
            if(roomInfo.numOfGames >= roomInfo.conf.maxGames) return;
            if(games[roomId] != null && games[roomId].gameOver != true){ return; }
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
    //开局即写库当前局数:服务重启后从DB重建房间时局数能保持实际值,客户端重进显示不再从头开始
    db.update_num_of_turns(roomInfo.id, roomInfo.numOfGames);
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
    roomInfo.dr = null;
    // 向房间内所有玩家广播解散,随后踢出全部连接并销毁房间
    userMgr.brocastInRoom(roomId, 'dispress_push', {});
    userMgr.kickAllInRoom(roomId);
    // 解散时向俱乐部广播牌桌清空:必须传"座位已清空"的快照(count=0),
    // 若直接传原房间快照count仍为解散前人数,客户端把卡片刷成满员,看起来就是"解散后列表没刷新"
    try{
        var socketService = require('./socket_service');
        if(socketService && socketService.broadcastClubUpdatePublic){
            var snap = JSON.parse(JSON.stringify(roomInfo));
            snap.seats = [];
            socketService.broadcastClubUpdatePublic(roomId, snap);
        }
    }catch(e){
        console.log('[doDissolve] club broadcast error: ' + (e && e.message));
    }
    roomMgr.destroy(roomId);
};

// 换三张 / 定缺：诸暨玩法不使用，提供空实现防止调用崩溃
exports.huanSanZhang = function(userId, p1, p2, p3){};
exports.dingQue = function(userId, que){};
