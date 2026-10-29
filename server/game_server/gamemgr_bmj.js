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
// 判断某牌是否财神（含双财神的第二张）
function isCaishenPai(game, pai){
    return pai >= 0 && (pai == game.caishen || (game.caishen2 != null && game.caishen2 >= 0 && pai == game.caishen2));
}

function shuffle(game) {
    var removeTiao = game.remove_tiao === 1;
    var tmp = [];
    for(var i = 0; i < 9; ++i){
        for(var c = 0; c < 4; ++c){ tmp.push(i); }
    }
    if(!removeTiao){
        for(var i = 9; i < 18; ++i){
            for(var c = 0; c < 4; ++c){ tmp.push(i); }
        }
    }
    for(var i = 18; i < 27; ++i){
        for(var c = 0; c < 4; ++c){ tmp.push(i); }
    }
    for(var i = 27; i < 34; ++i){
        for(var c = 0; c < 4; ++c){ tmp.push(i); }
    }
    game.mahjongs = tmp;

    for(var i = 0; i < game.mahjongs.length; ++i){
        var lastIndex = game.mahjongs.length - 1 - i;
        var idx = Math.floor(Math.random() * lastIndex);
        var t = game.mahjongs[idx];
        game.mahjongs[idx] = game.mahjongs[lastIndex];
        game.mahjongs[lastIndex] = t;
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

    // 包财神：发完牌不自动翻财神，改由庄家(包家)从手牌中自行指定财神
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
function findAllHuSplits(seatData, caishen, caishen2){
    var countMap = {};
    var cs = 0;
    for(var i = 0; i < seatData.holds.length; i++){
        var p = seatData.holds[i];
        if((caishen >= 0 && p == caishen) || (caishen2 != null && caishen2 >= 0 && p == caishen2)) cs++;
        else countMap[p] = (countMap[p] || 0) + 1;
    }
    var results = [];
    // 将牌: 真牌对
    var labels = Object.keys(countMap).map(Number);
    for(var i = 0; i < labels.length; i++){
        var p = labels[i];
        if(countMap[p] >= 2){
            countMap[p] -= 2;
            _splitDfs(countMap, cs, { jiang: p, kes: [], shuns: [] }, results);
            countMap[p] += 2;
        }
    }
    // 将牌: 1真+1财
    if(cs >= 1){
        for(var j = 0; j < labels.length; j++){
            var p2 = labels[j];
            if(countMap[p2] >= 1){
                countMap[p2] -= 1;
                _splitDfs(countMap, cs - 1, { jiang: p2, kes: [], shuns: [] }, results);
                countMap[p2] += 1;
            }
        }
    }
    // 将牌: 2财
    if(cs >= 2){
        _splitDfs(countMap, cs - 2, { jiang: -1, kes: [], shuns: [] }, results);
    }
    return results;
}

function _splitDfs(cm, cs, cur, results){
    // 找最小剩余牌
    var labels = Object.keys(cm).filter(function(k){ return cm[k] > 0; }).map(Number);
    if(labels.length === 0){
        if(cs % 3 === 0){
            // 必须 clone, 否则 push 同一个引用, 后续 push/pop 会把已存的结果也改掉
            results.push({
                jiang: cur.jiang,
                kes: cur.kes.slice(),
                shuns: cur.shuns.map(function(s){ return s.slice(); }),
                csLeft: cs
            });
        }
        return;
    }
    labels.sort(function(a,b){ return a - b; });
    var first = labels[0];
    var c = cm[first];

    // 刻子: first×3
    if(c >= 3){
        cm[first] -= 3; cur.kes.push(first);
        _splitDfs(cm, cs, cur, results);
        cur.kes.pop(); cm[first] += 3;
    }
    // 刻子: first×2 + 1财
    if(c >= 2 && cs >= 1){
        cm[first] -= 2; cur.kes.push(first);
        _splitDfs(cm, cs - 1, cur, results);
        cur.kes.pop(); cm[first] += 2;
    }
    // 刻子: first×1 + 2财
    if(c >= 1 && cs >= 2){
        cm[first] -= 1; cur.kes.push(first);
        _splitDfs(cm, cs - 2, cur, results);
        cur.kes.pop(); cm[first] += 1;
    }
    // 顺子(字牌不能): first, first+1, first+2
    if(!isZi(first)){
        var v = first % 9;
        if(v <= 6){
            var p2 = first + 1, p3 = first + 2;
            var c2 = cm[p2] || 0, c3 = cm[p3] || 0;
            // 真顺 a,b,c
            if(c2 > 0 && c3 > 0){
                cm[first]--; cm[p2]--; cm[p3]--; cur.shuns.push([first,p2,p3]);
                _splitDfs(cm, cs, cur, results);
                cur.shuns.pop(); cm[first]++; cm[p2]++; cm[p3]++;
            }
            // 财神补: a,b,cs
            if(c2 > 0 && cs >= 1){
                cm[first]--; cm[p2]--; cur.shuns.push([first,p2,-1]);
                _splitDfs(cm, cs - 1, cur, results);
                cur.shuns.pop(); cm[first]++; cm[p2]++;
            }
            // 财神补: a,cs,c
            if(c3 > 0 && cs >= 1){
                cm[first]--; cm[p3]--; cur.shuns.push([first,-1,p3]);
                _splitDfs(cm, cs - 1, cur, results);
                cur.shuns.pop(); cm[first]++; cm[p3]++;
            }
            // 财神补: a,cs,cs
            if(cs >= 2){
                cm[first]--; cur.shuns.push([first,-1,-1]);
                _splitDfs(cm, cs - 2, cur, results);
                cur.shuns.pop(); cm[first]++;
            }
        } else if(v == 7){
            // first=8万/8筒/8条: 唯一 8+9+cs(当7)
            var q2 = first + 1;
            if((cm[q2] || 0) > 0 && cs >= 1){
                cm[first]--; cm[q2]--; cur.shuns.push([-1,first,q2]);
                _splitDfs(cm, cs - 1, cur, results);
                cur.shuns.pop(); cm[first]++; cm[q2]++;
            }
        }
    }
    // 3财替代 first 成刻(first 是真牌, 3财当 first 的刻)
    if(cs >= 3){
        cm[first] -= 1; cur.kes.push(first);
        _splitDfs(cm, cs - 3, cur, results);
        cur.kes.pop(); cm[first] += 1;
    }
}

// 对一个完整拆法算台项: 返回 {tai, logs, isPing, isDui, hun, qing}
function calcTaiFromSplit(split, seatData, game){
    var logs = [];
    var tai = 0;
    var kes = split.kes;      // 手牌中拆出来的刻子(含财神补的)
    var shuns = split.shuns;  // 手牌中拆出来的顺子(含财神补的)
    var jiang = split.jiang;
    var csLeft = split.csLeft; // 剩余未分配财神(必是3的倍数)

    // 合并碰/杠刻子
    var allKes = kes.slice();
    if(seatData.pengs){ for(var i = 0; i < seatData.pengs.length; i++) allKes.push(seatData.pengs[i]); }
    if(seatData.gangs){ for(var i = 0; i < seatData.gangs.length; i++) allKes.push(seatData.gangs[i].pai); }

    // 1. 对对胡 = 没有顺子(手牌+副露)
    var hasChi = (seatData.chis && seatData.chis.length > 0);
    var isDui = (shuns.length === 0 && !hasChi);
    if(isDui){ var tn = taiRule(game, 'duidui_hu', 1); tai += tn; logs.push('对对胡+' + tn); }

    // 2. 平胡 = 手牌内无刻子 + 无碰杠副露 + 无纯财神刻
    // 注意: 吃副露不破坏平胡(吃本来就是顺子, 平胡=将+全顺子, 吃算顺子!)
    var hasPengGang = (seatData.pengs && seatData.pengs.length > 0) || (seatData.gangs && seatData.gangs.length > 0);
    var hasPureKe = csLeft >= 3;
    var isPing = (kes.length === 0 && !hasPengGang && csLeft === 0);
    if(isPing){ var tn2 = taiRule(game, 'ping_hu', 1); tai += tn2; logs.push('平胡+' + tn2); }

    // 3. 字刻台数(ziKeDefs 里配置的)
    var ziKeDefs = [
        [30, 'dong_ke', 2, '东风刻'],
        [27, 'zfb_ke', 1, '中刻'],
        [28, 'zfb_ke', 1, '发刻'],
        [29, 'zfb_ke', 1, '白刻']
    ];
    // 统计所有字刻数量
    var ziKeCount = {};
    for(var k = 0; k < allKes.length; k++){
        if(isZi(allKes[k])) ziKeCount[allKes[k]] = (ziKeCount[allKes[k]] || 0) + 1;
    }
    for(var z = 0; z < ziKeDefs.length; z++){
        var zp = ziKeDefs[z][0];
        var zc = ziKeCount[zp] || 0;
        if(zc > 0){
            var zn = taiRule(game, ziKeDefs[z][1], ziKeDefs[z][2]) * zc;
            tai += zn; logs.push(ziKeDefs[z][3] + '+' + zn);
        }
    }
    // 纯财神刻 = 按东风刻计
    if(hasPureKe){
        var pureKeCount = csLeft / 3;
        var dtn = taiRule(game, 'dong_ke', 2) * pureKeCount;
        tai += dtn; logs.push('纯财神刻+' + dtn);
        // 纯财神刻是字牌 → 破坏平胡
        // (这里 isPing 已确保 csLeft===0, 所以不会走到这里)
    }

    // 4. 花色判断(基于完整拆法里的真牌, 财神不算花色)
    var suitSet = {};
    var isCaiTile = function(p){ return (p == game.caishen) || (game.caishen2 != null && game.caishen2 >= 0 && p == game.caishen2); };
    // 刻子里的真牌
    for(var a = 0; a < allKes.length; a++){
        if(!isCaiTile(allKes[a])){
            var t = getMJType(allKes[a]);
            if(t < 3) suitSet[t] = true; else suitSet['zi'] = true;
        }
    }
    // 顺子
    for(var s = 0; s < shuns.length; s++){
        for(var si = 0; si < shuns[s].length; si++){
            var sv = shuns[s][si];
            if(sv >= 0 && !isCaiTile(sv)){
                var st = getMJType(sv);
                if(st < 3) suitSet[st] = true; else suitSet['zi'] = true;
            }
        }
    }
    // 将
    if(jiang >= 0 && !isCaiTile(jiang)){
        var jt = getMJType(jiang);
        if(jt < 3) suitSet[jt] = true; else suitSet['zi'] = true;
    }
    // 副露吃
    if(seatData.chis){
        for(var ci = 0; ci < seatData.chis.length; ci++){
            for(var cj = 0; cj < seatData.chis[ci].length; cj++){
                var cp = seatData.chis[ci][cj];
                if(!isCaiTile(cp)){
                    var ct = getMJType(cp);
                    if(ct < 3) suitSet[ct] = true; else suitSet['zi'] = true;
                }
            }
        }
    }
    // 纯财神刻当作字牌 → 破坏清一色, 变混一色
    if(hasPureKe) suitSet['zi'] = true;

    var suitKeys = Object.keys(suitSet);
    var isQing = (suitKeys.length === 1 && suitKeys[0] !== 'zi');
    var isHun = (suitKeys.length === 2 && suitSet['zi'] === true);
    if(isQing){ var qn = taiRule(game, 'qing_yise', 3); tai += qn; logs.push('清一色+' + qn); }
    else if(isHun){ var hn = taiRule(game, 'hun_yise', 1); tai += hn; logs.push('混一色+' + hn); }

    // 5. 额外台数
    // (额外台数是全局的, 不是拆法相关的, 这里不处理, 由 calculateTai 在外层统一加)

    return { tai: tai, logs: logs, isPing: isPing, isDui: isDui };
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
    // 能否点炮胡由管理后台 dianpao_hu 配置控制: 关闭时所有人(含包家)只能自摸
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
    // 台数门槛：包家必须够自己叫的台数, 闲家至少 min_tai
    // 注意: targetPai 已在上面 push 进手牌, 这里传 null 防止 gate 再 push 一次导致算台数时手牌多一张
    var gate = baoTaiGate(seatData, game, null, false, 0);
    seatData.canHu = checkCanHu(seatData, game.caishen, game.caishen2) && gate.ok;
    seatData.countMap[targetPai]--;
    seatData.holds.pop();
    console.log("[checkCanDianPaoHu v2] targetPai=", targetPai, "holds=", seatData.holds.length, "canHu=", seatData.canHu, "tai=", gate.tai, "need=", gate.need);
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
        if(can){
            // 抢杠胡同样受台数门槛限制
            // 注意: pai 已在上面 push 进手牌, 这里传 null 防止 gate 再 push 一次导致算台数时手牌多一张
            var gGate = baoTaiGate(sd, game, null, false, taiRule(game, 'qiang_gang', 1));
            can = gGate.ok;
        }
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
        // 自摸判胡: 需同时满足 牌型合法 + 台数门槛(包家够包台数/闲家至少min_tai)
    if(checkCanHu(turnSeat, game.caishen, game.caishen2)){
        var mExtra = turnSeat.lastGangHua ? taiRule(game, 'gang_kai', 1) : 0;
        var mGate = baoTaiGate(turnSeat, game, null, true, mExtra);
        if(mGate.ok){
            turnSeat.canHu = true;
        }
    }
    // 财吊:手里有财神 + 已听牌(摸牌前tingMap非空) + 财神空出来没参与其他牌
    // "财神空出来没参与"=假设caishen=-1(财神当普通牌),checkCanHu仍能过
    // 此时财神闲置在手里,摸任何牌都能胡(财吊翻倍)
    if(!turnSeat.canHu && taiRule(game, 'cai_diao', 0) > 0){
        var _csCnt = getCaishenCount(turnSeat, game.caishen, game.caishen2);
        var _tingCount = Object.keys(turnSeat.tingMap || {}).length;
        // 关键:财神没被用来替代牌型,把财神当普通牌也能胡
        var _csFree = false;
        if(_csCnt > 0 && _tingCount > 0){
            // 复制一份,假设没有财神能力(caishen=-1)再判一次
            var _sd = { holds: turnSeat.holds.slice(), pengs: turnSeat.pengs, chis: turnSeat.chis, gangs: turnSeat.gangs };
            rebuildCountMap(_sd);
            _csFree = checkCanHu(_sd, -1, null);
        }
        if(_csFree){
            turnSeat.caiDiao = true;
            turnSeat.canHu = true;
            // 财吊同样受包台数门槛限制
            if(!baoTaiGate(turnSeat, game, null, true, 0).ok){
                turnSeat.caiDiao = false;
                turnSeat.canHu = false;
            }
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
    // 包财神结算明细:先找到胡牌者,赢方正分、赔付方负分,客户端分开显示"胡牌分/包台分"
    var winSeatData = null;
    for(var i = 0; i < 2; ++i){
        if(game.gameSeats[i].hued && game.gameSeats[i].huInfo){ winSeatData = game.gameSeats[i]; break; }
    }
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
                // 包财神结算明细:胡牌分/包台分分开
                huScore: seat.huInfo.huScore != null ? seat.huInfo.huScore : seat.huInfo.score,
                baoScore: seat.huInfo.baoScore || 0,
                baoTai: seat.huInfo.baoTai || 0,
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
            // 包财神结算明细:胡牌分/包台分分开(赢方正、赔付方负)
            huBaseScore: winSeatData ? (seat.hued ? (winSeatData.huInfo.huScore != null ? winSeatData.huInfo.huScore : winSeatData.huInfo.score) : -(winSeatData.huInfo.huScore != null ? winSeatData.huInfo.huScore : winSeatData.huInfo.score)) : 0,
            baoTaiScore: winSeatData ? (seat.hued ? (winSeatData.huInfo.baoScore || 0) : -(winSeatData.huInfo.baoScore || 0)) : 0,
            //结算页展示:谁是本局包家、所包台数、包法(0无财/1独财/2双财)
            isBao: (game.playStyle == 'baocaishen' && game.baoSeatIndex != null && parseInt(game.baoSeatIndex) === i),
            baoTaiOfRound: (game.playStyle == 'baocaishen' && game.baoSeatIndex >= 0) ? (game.baoTai || 0) : 0,
            baoModeOfRound: (game.playStyle == 'baocaishen' && game.baoSeatIndex >= 0) ? (game.baoMode != null ? game.baoMode : 2) : -1,
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
                    //老庄翻倍:连庄中庄家胡牌分数×2,记入明细,结算面板据此显示"(老庄)"解释翻倍原因
                    if(game.laozhuangCount > 0 && i == game.button){
                        scoreItem.laozhuang = true;
                    }
                    break;
                }
            }
        }
        roundItem.scores.push(scoreItem);
    }
    roomInfo.roundHistory.push(roundItem);

    // 客户端 game_over_push 格式：{results:[...], endinfo?}
    var pushData = {results: results};
    // 结算数据携带本局财神:客户端单局结算弹窗用牌图展示(-1表示无,客户端自动隐藏)
    pushData.caishen = (game.caishen != null) ? game.caishen : -1;
    pushData.caishen2 = (game.caishen2 != null) ? game.caishen2 : -1;

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

    // 房卡扣除：第一局结束一次性扣除整局房卡(中途解散不退)，所有在坐玩家均按后台设置的数量扣除
    var cost = roomInfo.conf.cost || 0;
    if(roomInfo.numOfGames === 1 && cost > 0){
        for(var ci = 0; ci < roomInfo.seats.length; ++ci){
            var cuid = roomInfo.seats[ci].userId;
            if(cuid > 0){
                (function(uid){
                    db.cost_gems(uid, cost, function(success){
                        console.log("[房卡扣除] 玩家", uid, "扣除", cost, "房卡, 结果:", success);
                    });
                })(cuid);
            }
        }
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
    if(game.waitBao){ console.log('[chuPai reject] 叫台进行中,禁止出牌 userId=',userId); return; }
    if(game.waitCaishen){ console.log('[chuPai reject] 尚未定财神: userId='+userId); return; }
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

    var count = seatData.countMap[pai] || 0;
    var removeCs = 0;
    if(!isCaishenPai(game, pai)){
        // 用财神替代：需要2张，已有count张，差(2-count)张用财神
        removeCs = Math.max(0, 2 - count);
    }
    // 后台开关:禁止财碰时,凡需要财神补位的碰一律拒绝(动作时再校验一次,不依赖canPeng缓存)
    if(removeCs > 0 && !game.cai_peng) return;

    var discarder = game.gameSeats[discarderIdx];
    if(discarder && discarder.folds){
        var fi = discarder.folds.lastIndexOf(pai);
        if(fi != -1) discarder.folds.splice(fi, 1);
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
    // 碰后判胡: 牌型合法 + 台数门槛
    seatData.canHu = checkCanHu(seatData, game.caishen, game.caishen2) && baoTaiGate(seatData, game, null, true, 0).ok;
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
        var needCs = 3 - count;
        // 后台开关:禁止财杠时,需要财神补位的点杠一律拒绝
        if(needCs > 0 && !game.cai_gang) return;
        var discarderIdx = game.turn;
        var discarder = game.gameSeats[discarderIdx];
        if(discarder && discarder.folds){
            var fi = discarder.folds.lastIndexOf(pai);
            if(fi != -1) discarder.folds.splice(fi, 1);
        }
        removePai(count);
        removeCs(needCs);
        seatData.gangs.push({pai: pai, type: 'ming'});
    } else if(!isCaishenPai(game, pai) && count + csCount >= 4 && count >= 2){
        // 暗杠用财神替代
        var needCs = 4 - count;
        // 后台开关:禁止财杠时,需要财神补位的暗杠一律拒绝
        if(needCs > 0 && !game.cai_gang) return;
        removePai(count);
        removeCs(needCs);
        seatData.gangs.push({pai: pai, type: 'an'});
    } else {
        // 补杠（弯杠）：碰过的牌手中还有一张（真牌或财神）
        var needCs = (count >= 1) ? 0 : 1;
        // 后台开关:禁止财杠时,财神补杠一律拒绝
        if(needCs > 0 && !game.cai_gang) return;

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
    // 摸/杠后判胡: 牌型合法 + 台数门槛
    seatData.canHu = checkCanHu(seatData, game.caishen, game.caishen2) && baoTaiGate(seatData, game, null, true, 0).ok;
    sendOperations(game, seatData, -1);
};

exports.hu = function(userId){
    var game = getGameByUserID(userId);
    if(game == null || game.gameOver) return;
    clearTurnTimeout(game);
    var seatIndex = getSeatIndex(userId);
    var seatData = game.gameSeats[seatIndex];
    if(!seatData.canHu){
        // canHu 状态不一致: 重新下发操作, 避免客户端点胡后无响应卡死
        sendOperations(game, seatData, game.chuPai);
        return;
    }

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

    // 天胡地胡：按最高台数结算（抢杠胡不可能是天/地胡;与翻财神系一致,按封顶台数计）
    // 必须在包台门槛校验之前赋值,否则包家天胡会被包台数门槛误拒
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
        // 天胡/地胡台数从后台配置读取(后台配0则关闭,降级封顶maxTai)
        // 包麻将:天地胡台数用于包台门槛校验(包家tai>=baoTai)与胡牌分计算(基础分按台数算)
        var cfgTai = taiRule(game, isTianHu ? 'tian_hu' : 'di_hu', 0);
        tai = (cfgTai > 0) ? cfgTai : (game.maxTai || 10);
        seatData.taiLog = [(isTianHu ? '天胡' : '地胡') + '=' + (cfgTai > 0 ? cfgTai + '(配置)' : '封顶' + tai)];
        console.log("[天胡地胡]", isTianHu ? "天胡" : "地胡", "cfg=", cfgTai, "final=", tai, "包家=", game.baoSeatIndex == seatIndex, "baoTai=", game.baoTai);
    }

    // 包财神台数门槛终校验：包家必须 >= 自己叫的包台数, 闲家 >= min_tai
    var finalNeed = (seatIndex == game.baoSeatIndex) ? (game.baoTai || 0) : taiRule(game, 'min_tai', 1);
    console.log("[hu终校验] seat=", seatIndex, " tai=", tai, " need=", finalNeed, " isBao=", seatIndex == game.baoSeatIndex, " baoTai=", game.baoTai, " min_tai=", taiRule(game, 'min_tai', 1));
    if(game.baoSeatIndex != null && game.baoSeatIndex >= 0 && tai < finalNeed){
        console.log("[bao门槛] 拒绝胡牌 seat=", seatIndex, " tai=", tai, " need=", finalNeed, " 包家seat=", game.baoSeatIndex);
        // 放回原状态: 撤销刚才为判胡加进手牌的那张
        if(!isZimo){
            var bi = seatData.holds.lastIndexOf(huPai);
            if(bi != -1){ seatData.holds.splice(bi, 1); }
            seatData.countMap[huPai] = (seatData.countMap[huPai] || 1) - 1;
        }
        seatData.hued = false;
        seatData.canHu = false;
        // 台数不够拒绝胡牌: 重新下发操作, 避免客户端点胡后无响应卡死
        sendOperations(game, seatData, game.chuPai);
        return;
    }

    // 财吊判定(以胡牌后的最终手牌为准):手里有财神,且把财神当普通牌(7筒)也能胡
    // => 财神空出来没参与任何牌型,即"财吊"。原实现只在 checkCanHu 不通过时才标记,
    // 导致财神恰好凑成将/顺子时(如两个7筒做将)走正常胡牌分支、漏掉财吊翻倍。
    // 关键:传进 checkCanHu 的副本必须带 countMap,否则 getCaishenCount 返回 0,
    // 永远判不出财吊,结算不翻倍。
    var caiDiaoNow = seatData.caiDiao || false;
    if(taiRule(game, 'cai_diao', 0) > 0 && getCaishenCount(seatData, game.caishen, game.caishen2) > 0){
        var _cd = { holds: seatData.holds.slice(), pengs: seatData.pengs, chis: seatData.chis, gangs: seatData.gangs };
        rebuildCountMap(_cd);
        if(checkCanHu(_cd, -1, null)){ caiDiaoNow = true; }
    }
    if(caiDiaoNow){ seatData.caiDiao = true; }

    // 计分:胡牌分与包台分分开计算, 基础分取"添加牌桌"时选的底分, 以起胡台数为基准每多一台翻一番
    // 胡牌分 = 底分 × 2^(胡牌台数-起胡台数)   例:起胡1台底分2, 胡1台=2, 胡2台=4, 胡3台=8
    // 包台分 = 底分 × 2^(包台数-起胡台数)     例:起胡1台底分2, 包2台=4, 包3台=8
    var baseScore = game.conf.baseScore || 1;
    var minTai = taiRule(game, 'min_tai', 1);
    var huScore = baseScore * Math.pow(2, Math.max(0, (tai || 0) - minTai));

    // 财吊翻倍(后台可配,默认关):手里有财神摸任何牌都能胡,只作用于胡牌分
    if(caiDiaoNow && taiRule(game, 'cai_diao', 0) > 0){
        huScore = huScore * 2;
        if(seatData.taiLog){ seatData.taiLog.push('财吊×2'); }
    }

    // 包财神caiMul: baoMode 0=无财 1=独财 都×2 (2=双财不翻倍)
    var baoMode = game.baoMode;
    var caiMul = (baoMode != null && (baoMode === 0 || baoMode === 1)) ? 2 : 1;
    if(caiMul > 1){
        huScore = huScore * caiMul;
        if(seatData.taiLog){ seatData.taiLog.push('财神模式×'+caiMul); }
    }

    // 老庄翻倍: lzMul 从后台 laozhuang_multiplier 读(默认2), 胡牌分+包台分都乘
    var lzMul = (game.laozhuang_multiplier != null && game.laozhuang_multiplier > 0) ? Number(game.laozhuang_multiplier) : 2;
    if(game.laozhuangCount > 0){
        huScore = huScore * lzMul;
        if(seatData.taiLog){ seatData.taiLog.push('老庄×'+lzMul); }
    }

    // 包财神赔付规则（必须设置了包家才走包台赔付）
    var isBaoPlay = (game.playStyle == 'baocaishen' && game.baoSeatIndex >= 0 && game.baoSeatIndex < 2);
    var baoScore = 0;
    if(isBaoPlay){
        baoScore = baseScore * Math.pow(2, Math.max(0, (game.baoTai || 0) - minTai));
        // 包台分也乘老庄倍数和caiMul
        if(game.laozhuangCount > 0){
            baoScore = baoScore * lzMul;
        }
        if(caiMul > 1){
            baoScore = baoScore * caiMul;
        }
    }
    var score = huScore; // 胡牌分(兼容 game_hu_push 的 score 字段)

    if(isBaoPlay){
        var payScore = huScore + baoScore;
        if(game.baoSeatIndex == seatIndex){
            // 包家胡：闲家付【胡牌分 + 包台分】
            seatData.score += payScore;
            for(var i = 0; i < 2; ++i){
                if(i != seatIndex){
                    game.gameSeats[i].score -= payScore;
                }
            }
        } else {
            // 闲家胡：包家付【胡牌分 + 包台分】
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
        huScore: huScore,
        baoScore: baoScore,
        baoTai: isBaoPlay ? (game.baoTai || 0) : 0,
        seatIndex: seatIndex,
        qianggang: isQiangGang || false
    };
    // 胡牌留痕: 包家/包台数/胡牌台数/是否自摸/明细, 便于排查"包X台却胡了Y台"的反馈
    console.log("[胡牌] seat=" + seatIndex + " 包家seat=" + game.baoSeatIndex + " 包台=" + game.baoTai +
        " 胡台=" + tai + " zimo=" + isZimo + " 杠上开花=" + (extraTai > 0) +
        " 明细=[" + (seatData.taiLog || []).join(',') + "]");
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

// 全拆解(将+面子)搜索:返回两种最优拆解 { withPure, noPure }
// withPure: 允许剩余财神3张成刻(按最高字牌台数=东风刻计)时的最优字刻拆解 {kes, pureKe}
// noPure: 财神全部用于顺/将/补刻(不成纯财刻)时的最优字刻拆解 {kes}, 不存在则为 null
// 台数计算对两种拆法分别评分取最高, 保证字刻/清一色/平胡按同一拆法自洽,
// 避免"财成刻算东风"与"财当筒子算清一色平胡"两种拆法杂交重复计台
function bestZiKeSplit(countMap, caishenCount){
    var bestPure = null;
    var bestPureScore = -1;
    var bestNoPure = null;
    var bestNoPureScore = -1;
    // 字刻权重必须与实际计台规则(ziKeDefs)完全一致: 东风2台, 中/发/白1台, 南西北0台
    // (旧实现南西北也记1台, 会让拆解优先选中"西西+财神"这类0台字刻, 丢掉"发发+财神"的发刻台)
    var ziW = function(p){ return p == 30 ? 2 : ((p == 27 || p == 28 || p == 29) ? 1 : 0); };
    function cloneKes(kes){ var r = {}; for(var k in kes) r[k] = kes[k]; return r; }
    function meldDfs(cm, cs, kes, ziScore){
        var first = smallestTile(cm);
        if(first == -1){
            if(cs % 3 == 0){
                if(cs > 0){
                    // 纯财神3张成刻:按最高字牌台数(东风刻)计,走后台 dong_ke 配置
                    var pureKe = cs / 3;
                    var totalScore = ziScore + pureKe * 2;
                    if(totalScore > bestPureScore){
                        kes[30] = (kes[30] || 0) + pureKe;
                        bestPureScore = totalScore;
                        bestPure = { kes: cloneKes(kes), pureKe: pureKe };
                        kes[30] -= pureKe;
                    }
                } else {
                    if(ziScore > bestPureScore){
                        bestPureScore = ziScore;
                        bestPure = { kes: cloneKes(kes), pureKe: 0 };
                    }
                    if(ziScore > bestNoPureScore){
                        bestNoPureScore = ziScore;
                        bestNoPure = { kes: cloneKes(kes) };
                    }
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
    return { withPure: bestPure, noPure: bestNoPure };
}

// 计算台数
// seatData: 玩家数据
// game: 游戏对象（含 caishen, playStyle, button, maxTai 等）
// isZimo: 是否自摸
// extraTai: 额外台数（杠上开花+1, 抢杠胡+1 等）
function calculateTai(seatData, game, isZimo, extraTai){
    var caishen = game.caishen;
    var caishen2 = game.caishen2;
    extraTai = extraTai || 0;

    var holds = seatData.holds;
    // 基础 countMap + caishenCount (用于全字牌判断/无财判断)
    var countMap = {}, caishenCount = 0;
    for(var i = 0; i < holds.length; i++){
        var p = holds[i];
        if((caishen >= 0 && p == caishen) || (caishen2 != null && caishen2 >= 0 && p == caishen2)) caishenCount++;
        else countMap[p] = (countMap[p] || 0) + 1;
    }
    var isCaiTile = function(p){ return (p == caishen) || (caishen2 != null && caishen2 >= 0 && p == caishen2); };

    // 1. 枚举所有完整拆法, 每种拆法自洽(将+刻+顺+财神分配全部确定)
    var splits = findAllHuSplits(seatData, caishen, caishen2);

    // 2. 全字牌判断(基于真牌 + 副露, 不依赖拆法)
    var isQuanZi = true;
    for(var k in countMap){ if(!isZi(parseInt(k))){ isQuanZi = false; break; } }
    if(isQuanZi && seatData.pengs){ for(var i = 0; i < seatData.pengs.length; i++){ if(isCaiTile(seatData.pengs[i])) continue; if(!isZi(seatData.pengs[i])){ isQuanZi = false; break; } } }
    if(isQuanZi && seatData.gangs){ for(var i = 0; i < seatData.gangs.length; i++){ if(isCaiTile(seatData.gangs[i].pai)) continue; if(!isZi(seatData.gangs[i].pai)){ isQuanZi = false; break; } } }
    if(isQuanZi && seatData.chis){ for(var i = 0; i < seatData.chis.length; i++){ var cg = seatData.chis[i]; for(var j = 0; j < cg.length; j++){ if(isCaiTile(cg[j])) continue; if(!isZi(cg[j])){ isQuanZi = false; break; } } if(!isQuanZi) break; } }

    // 3. 无财判断
    var caishenTotal = caishenCount + (seatData.caishenInMelds || 0);
    if(seatData.pengs){ for(var ci = 0; ci < seatData.pengs.length; ci++){ if(seatData.pengs[ci] == caishen || (caishen2 >= 0 && seatData.pengs[ci] == caishen2)) caishenTotal += 3; } }
    if(seatData.gangs){ for(var ci = 0; ci < seatData.gangs.length; ci++){ var gp = seatData.gangs[ci] && seatData.gangs[ci].pai; if(gp != null && (gp == caishen || (caishen2 >= 0 && gp == caishen2))) caishenTotal += 4; } }
    if(seatData.chis){ for(var ci = 0; ci < seatData.chis.length; ci++){ for(var cj = 0; cj < seatData.chis[ci].length; cj++){ var cp = seatData.chis[ci][cj]; if(cp == caishen || (caishen2 >= 0 && cp == caishen2)) caishenTotal++; } } }

    // 4. 对每种完整拆法算台项, 取最高
    var best = { tai: 0, logs: [] };
    for(var si = 0; si < splits.length; si++){
        var res = calcTaiFromSplit(splits[si], seatData, game);
        if(res.tai > best.tai) best = res;
    }
    var tai = best.tai;
    var taiLog = best.logs.slice();

    // 额外台数(杠开/抢杠)
    tai += extraTai;
    if(extraTai > 0) taiLog.push('额外+' + extraTai);

    // 无财
    if(caishenTotal == 0){
        var wtn = taiRule(game, 'wu_cai', 1);
        tai += wtn; taiLog.push('无财+' + wtn);
    }

    // 封顶
    var maxTai = game.maxTai || 10;
    if(isQuanZi){
        tai = maxTai; taiLog = ['全字牌=封顶' + maxTai];
    } else if(tai > maxTai){
        tai = maxTai; taiLog.push('封顶' + maxTai);
    }
    if(tai < 0) tai = 0;

    seatData.taiLog = taiLog;
    console.log('[calculateTai] splitCount=' + splits.length + ' best=' + JSON.stringify(best.logs) + ' extra=' + extraTai + ' wucai=' + (caishenTotal == 0) + ' quanzi=' + isQuanZi + ' tai=' + tai + ' logs=[' + taiLog.join(',') + ']');

    return tai;
}



// 包财神台数门槛：包家必须胡到 >= 自己叫的包台数, 闲家 >= min_tai(缺省1台)
// 返回 { ok: 是否可达门槛, tai: 按当前手牌(含待胡牌)算出的台数, need: 门槛 }
function baoTaiGate(seatData, game, winPai, isZimo, extraTai){
    var result = { ok: true, tai: 0, need: 0 };
    if(game.baoSeatIndex == null || game.baoSeatIndex < 0){ return result; }
    var added = false;
    if(!isZimo && winPai != null && winPai >= 0){
        seatData.holds.push(winPai);
        seatData.countMap[winPai] = (seatData.countMap[winPai] || 0) + 1;
        added = true;
    }
    var tai = 0;
    try{
        tai = calculateTai(seatData, game, isZimo, extraTai || 0);
    }catch(e){
        tai = 0;
    }
    if(added){
        seatData.countMap[winPai] = (seatData.countMap[winPai] || 1) - 1;
        var li = seatData.holds.lastIndexOf(winPai);
        if(li != -1){ seatData.holds.splice(li, 1); }
    }
    var isBao = (seatData.seatIndex == game.baoSeatIndex);
    var need = isBao ? (game.baoTai || 0) : taiRule(game, 'min_tai', 1);
    result.tai = tai;
    result.need = need;
    result.ok = tai >= need;
    return result;
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

// 平胡专用拆顺: 禁止剩余财神成刻(纯财神3张=有刻子必非平胡)
// 与通用 canFormShun 的终止条件不同: cs===needShun*3 在这里视为失败(成刻=非平胡),
// 必须 cs===0 && needShun===0 才算拆干净
function canFormShunPure(countMap, caishenCount, needShun){
    var first = smallestTile(countMap);
    if(first == -1){
        return caishenCount === 0 && needShun === 0;
    }
    if(needShun <= 0) return false;
    if(isZi(first)) return false;

    var v = first % 9;
    if(v <= 6){
        var p2 = first + 1, p3 = first + 2;
        var c2 = countMap[p2] || 0, c3 = countMap[p3] || 0;
        if(c2 > 0 && c3 > 0){
            countMap[first]--; countMap[p2]--; countMap[p3]--;
            var r = canFormShunPure(countMap, caishenCount, needShun - 1);
            countMap[first]++; countMap[p2]++; countMap[p3]++;
            if(r) return true;
        }
        if(c2 > 0 && caishenCount >= 1){
            countMap[first]--; countMap[p2]--;
            var r2 = canFormShunPure(countMap, caishenCount - 1, needShun - 1);
            countMap[first]++; countMap[p2]++;
            if(r2) return true;
        }
        if(c3 > 0 && caishenCount >= 1){
            countMap[first]--; countMap[p3]--;
            var r3 = canFormShunPure(countMap, caishenCount - 1, needShun - 1);
            countMap[first]++; countMap[p3]++;
            if(r3) return true;
        }
        if(caishenCount >= 2){
            countMap[first]--;
            var r4 = canFormShunPure(countMap, caishenCount - 2, needShun - 1);
            countMap[first]++;
            if(r4) return true;
        }
    }
    if(v >= 1){
        var q2 = first + 1;
        if(v <= 7 && (countMap[q2] || 0) > 0 && caishenCount >= 1){
            countMap[first]--; countMap[q2]--;
            var r5 = canFormShunPure(countMap, caishenCount - 1, needShun - 1);
            countMap[first]++; countMap[q2]++;
            if(r5) return true;
        }
        if(v <= 7 && caishenCount >= 2){
            countMap[first]--;
            var r6 = canFormShunPure(countMap, caishenCount - 2, needShun - 1);
            countMap[first]++;
            if(r6) return true;
        }
        if(v === 8 && caishenCount >= 1){
            countMap[first]--;
            var r7 = canFormShunPure(countMap, caishenCount - 1, needShun - 1);
            countMap[first]++;
            if(r7) return true;
        }
    }
    if(v === 7 && (countMap[first + 1] || 0) > 0 && caishenCount >= 1){
        countMap[first]--; countMap[first + 1]--;
        var r8 = canFormShunPure(countMap, caishenCount - 1, needShun - 1);
        countMap[first]++; countMap[first + 1]++;
        if(r8) return true;
    }
    return false;
}

// 判断是否平胡：全顺子+将，无任何刻子（含真刻/财神补刻/纯财神3成刻都不行）
// 必须所有真牌拆成顺子+将、财神全部用于补顺，不能剩任何刻子(含纯财刻)
function isPingHuCheck(seatData, caishen, caishen2){
    //碰/杠本身就是刻子,有碰杠必不是平胡
    if(seatData.pengs && seatData.pengs.length > 0) return false;
    if(seatData.gangs && seatData.gangs.length > 0) return false;

    var split = splitHolds(seatData, caishen, caishen2);
    var countMap = split.countMap, cs = split.caishenCount;
    var needShun = 4 - (seatData.chis ? seatData.chis.length : 0);
    if(needShun < 0) return false;

    // 选将: 真牌对/真+财/纯财2; 其余牌(含财神)必须全部拆成顺子, 禁止任何刻子(含纯财3刻)
    // 注意: 将牌可以是字牌对(西风西风这类),平胡只禁刻子不禁字对
    var csPairOk = true; // 纯财对也允许做平胡将
    var labels = Object.keys(countMap);
    for(var i = 0; i < labels.length; ++i){
        var p = parseInt(labels[i]);
        // 去掉 isZi(p) continue —— 字牌也可以做平胡将对!
        if(countMap[p] >= 2){
            countMap[p] -= 2;
            var ok = canFormShunPure(countMap, cs, needShun);
            countMap[p] += 2;
            if(ok) return true;
        }
        // 注意:字牌不能补将(字+财神不能算平胡对),因为字牌不是同花色无顺子问题
        // 但筒万条可以: 筒+财 补筒对
        if(!isZi(p) && countMap[p] >= 1 && cs >= 1){
            countMap[p] -= 1;
            var ok2 = canFormShunPure(countMap, cs - 1, needShun);
            countMap[p] += 1;
            if(ok2) return true;
        }
    }
    if(csPairOk && cs >= 2 && canFormShunPure(countMap, cs - 2, needShun)) return true;
    return false;
}

exports.checkCanHu = checkCanHu;
// 翻财神与包财神打法/胡法/算台完全一致，包财神直接复用这里的算法，避免两份实现走偏
exports.__algo = {
    getMJType: getMJType,
    checkCanHu: checkCanHu,
    checkTingPai: checkTingPai,
    rebuildCountMap: rebuildCountMap,
    checkCanPeng: checkCanPeng,
    checkCanGang: checkCanGang,
    checkCanAnGang: checkCanAnGang,
    checkCanWanGang: checkCanWanGang,
    checkCanChi: checkCanChi,
    checkCanDianPaoHu: checkCanDianPaoHu,
    checkCanQiangGang: checkCanQiangGang,
    calculateTai: calculateTai,
    isDuiDuiHuCheck: isDuiDuiHuCheck,
    isPingHuCheck: isPingHuCheck,
    isCaishenPai: isCaishenPai,
    getCaishenCount: getCaishenCount,
    baoTaiGate: baoTaiGate
};
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
        playStyle: 'baocaishen',
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
        baoMode: -1,
        baoTai: roomInfo.conf.baoTai || 2,
        baoTaiFee: roomInfo.conf.baoTaiFee || 0,
        remove_tiao: roomInfo.conf.remove_tiao != null ? roomInfo.conf.remove_tiao : 0
    };

    console.log('[zj_lao][start] roomid=' + roomInfo.id +
        ' cai_chi=' + game.cai_chi + ' cai_peng=' + game.cai_peng + ' cai_gang=' + game.cai_gang +
        ' dianpao_hu=' + game.dianpao_hu + ' cai_diao=' + game.cai_diao + ' tianhu_di=' + game.tianhu_di);

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
        baoMode: game.baoMode != null ? game.baoMode : -1, //-1=未定 0=无财 1=独财 2=双财(客户端据此显示"无财")
        baoSeatIndex: game.baoSeatIndex,
        baoTai: game.baoTai,
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

    // 包财神：先走叫台流程确定包家，再让包家定财神
    console.log("[start] 包财神 playStyle=", game.playStyle, "type=", roomInfo.conf.type, "→ 庄家先叫台");
    // 叫台状态初始化
    game.baoTurnSeat = game.button;   // 当前叫台轮次座位(庄家先)
    game.baoPassed = [false, false];  // 两方是否已放弃叫台
    game.baoCurrentRank = -1;         // 当前最高叫台rank(-1表示无人叫过)
    game.baoCurrentSeat = -1;         // 当前最高叫台者
    game.baoForced = false;           // 双方均不包时庄家硬包(庄家自选双财/独财/无财, 台数固定2台)
    game.waitBao = true;
    game.waitCaishen = false;
    game.baoDecided = false;
    // 庄家开始叫台
    var zhuangSeat = game.gameSeats[game.button];
    userMgr.sendMsg(zhuangSeat.userId, 'bao_select_push', {
        seatIndex: game.button,
        isFirst: true,
        currentRank: -1,
        currentSeat: -1
    });
};

// 双财神第二张：数牌同花色内循环(9万→1万)，字牌按客户端牌面顺序循环
// 牌ID: 27中 28发 29白, 30东 31西 32南 33北
function nextCaishenOf(p){
    if(p < 27){
        return Math.floor(p / 9) * 9 + (p % 9 + 1) % 9;
    }
    // 中发白：中→发→白→中 3循环
    if(p <= 29){
        return 27 + (p - 27 + 1) % 3;
    }
    // 东南西北：东→南→西→北→东 4循环(牌ID顺序 30→32→31→33)
    var windIds = [30, 32, 31, 33];
    for(var i = 0; i < 4; ++i){
        if(windIds[i] === p){ return windIds[(i + 1) % 4]; }
    }
    return p;
}

// 庄家(包家)从手牌中指定财神
exports.caishenSelect = function(userId, pai){
    var roomId = roomMgr.getRoomIdOfUser(userId);
    var game = games[roomId];
    if(game == null || game.gameOver || !game.waitCaishen){ return; }
    var seatIndex = roomMgr.getUserSeat(userId);
    if(seatIndex != game.baoSeatIndex){ return; }
    pai = parseInt(pai);
    var seatData = game.gameSeats[seatIndex];
    if(isNaN(pai) || seatData.holds.indexOf(pai) < 0){ return; }

    game.caishen = pai;
    game.fanPai = pai;
    game.caishen2 = (game.baoMode == 2) ? nextCaishenOf(pai) : -1;
    game.waitCaishen = false;
    game.baoDecided = true;
    console.log("[包财神] 庄家定财神 pai=", pai, "caishen2=", game.caishen2, "mode=", game.baoMode);

    for(var i = 0; i < game.gameSeats.length; ++i){
        rebuildCountMap(game.gameSeats[i]);
        checkTingPai(game.gameSeats[i], game.caishen, game.caishen2);
    }

    // 庄家定完财神后可能天胡:14张牌 + 台数门槛(包家够包台/闲家够min_tai)才给胡按钮
    var zhuangSeat = game.gameSeats[game.button];
    clearAllOptions(game, zhuangSeat);
    var _canHu = checkCanHu(zhuangSeat, game.caishen, game.caishen2);
    console.log("[caishenSelect天胡] seat=", game.button, " checkCanHu=", _canHu, " holds=", zhuangSeat.holds.length);
    if(_canHu){
        var tGate = baoTaiGate(zhuangSeat, game, null, true, 0);
        console.log("[caishenSelect天胡] tai=", tGate.tai, " need=", tGate.need, " ok=", tGate.ok, " baoSeat=", game.baoSeatIndex, " baoTai=", game.baoTai);
        if(tGate.ok){
            zhuangSeat.canHu = true;
        }
    }

    userMgr.brocastInRoom(roomId, 'bao_result_push', {
        isBao: true,
        baoSeatIndex: game.baoSeatIndex,
        baoTai: game.baoTai,
        baoMode: game.baoMode,
        caishen: game.caishen,
        caishen2: game.caishen2,
        fanPai: game.fanPai,
        numofmj: game.mahjongs.length - game.currentIndex
    });

    //庄家开局出牌(与翻财神一致,包家不一定是庄家,不能用手牌方发操作)
    sendOperations(game, zhuangSeat, zhuangSeat.holds[zhuangSeat.holds.length-1]);
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
        baoMode: game.baoMode != null ? game.baoMode : -1,
        baoSeatIndex: game.baoSeatIndex,
        baoTai: game.baoTai,
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
    // 重连时若仍在叫台环节且轮到本人, 补发叫台请求
    if(game.waitBao && seatIndex == game.baoTurnSeat){
        userMgr.sendMsg(userId, 'bao_select_push', {
            seatIndex: seatIndex,
            isFirst: false,
            currentRank: game.baoCurrentRank,
            currentSeat: game.baoCurrentSeat,
            currentTai: game.baoTai,
            currentMode: game.baoMode,
            forced: !!game.baoForced
        });
    }
    // 重连时若仍在定财神环节且本人是包家,补发定财神请求
    if(game.waitCaishen && seatIndex == game.baoSeatIndex){
        userMgr.sendMsg(userId, 'caishen_select_push', {mode: game.baoMode, seatIndex: seatIndex});
    }

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

// 包财神叫台处理：rank = tai*10 + (mode==0无财?2 : mode==1独?1 : mode==2双?0)
// 同台数优先级 无财>独>双财 对应数值 2>1>0 所以mode值越大优先级越高
// 比较rank大小即可, rank大的压过小的
function baoRank(tai, mode){
    return (tai || 0) * 10 + (mode == null ? 1 : (mode == 0 ? 2 : (mode == 1 ? 1 : 0)));
}

// 叫台轮转: 把叫台权发给 nextSeat, 附带当前最高叫台信息让客户端过滤选项
function sendBaoTurn(game, nextSeat){
    var roomId = -1;
    for(var rid in games){ if(games[rid] === game){ roomId = rid; break; } }
    var target = game.gameSeats[nextSeat];
    userMgr.sendMsg(target.userId, 'bao_select_push', {
        seatIndex: nextSeat,
        isFirst: false,
        currentRank: game.baoCurrentRank,
        currentSeat: game.baoCurrentSeat,
        currentTai: game.baoTai,
        currentMode: game.baoMode,
        forced: !!game.baoForced
    });
}

// 确定包家: 设置 baoSeatIndex / baoTai / baoMode, 进入定财神环节(无财直接开打)
function finalizeBao(game){
    game.baoSeatIndex = game.baoCurrentSeat;
    game.baoDecided = true;
    game.waitBao = false;
    console.log("[包财神] 叫台结束 包家seat=", game.baoSeatIndex, "tai=", game.baoTai, "mode=", game.baoMode);
    // 发 bao_result_push 广播叫台结果(财神待定)
    var roomId = -1;
    for(var rid in games){ if(games[rid] === game){ roomId = rid; break; } }

    // 无财: 没有财神, 跳过定财神环节直接开打
    if(game.baoMode == 0){
        game.waitCaishen = false;
        game.caishen = -1;
        game.caishen2 = -1;
        for(var i = 0; i < game.gameSeats.length; ++i){
            rebuildCountMap(game.gameSeats[i]);
            checkTingPai(game.gameSeats[i], game.caishen, game.caishen2);
        }
        // 无财模式庄家也可能天胡
        var zw = game.gameSeats[game.button];
        clearAllOptions(game, zw);
        if(checkCanHu(zw, game.caishen, game.caishen2)){
            var wGate = baoTaiGate(zw, game, null, true, 0);
            if(wGate.ok){
                zw.canHu = true;
            }
        }
        userMgr.brocastInRoom(roomId, 'bao_result_push', {
            isBao: true,
            baoSeatIndex: game.baoSeatIndex,
            baoTai: game.baoTai,
            baoMode: 0,
            caishen: -1,
            caishen2: -1,
            numofmj: game.mahjongs.length - game.currentIndex
        });
        sendOperations(game, zw, zw.holds[zw.holds.length-1]);
        scheduleTurnTimeout(game, game.button, false);
        return;
    }

    game.waitCaishen = true;
    userMgr.brocastInRoom(roomId, 'bao_result_push', {
        isBao: true,
        baoSeatIndex: game.baoSeatIndex,
        baoTai: game.baoTai,
        baoMode: game.baoMode
    });
    // 通知包家定财神
    var baoSeat = game.gameSeats[game.baoSeatIndex];
    userMgr.sendMsg(baoSeat.userId, 'caishen_select_push', {
        mode: game.baoMode,
        seatIndex: game.baoSeatIndex
    });
}

// 包麻将叫台
exports.bao = function(userId, isBao, baoTai, baoTaiFee, caishenMode){
    var roomId = roomMgr.getRoomIdOfUser(userId);
    var game = games[roomId];
    if(game == null || game.gameOver || !game.waitBao){ return; }
    var seatIndex = roomMgr.getUserSeat(userId);
    if(seatIndex != game.baoTurnSeat){ return; }

    if(!isBao){
        // 放弃叫台: 上一个叫台的人成包家; 都没叫过时, 庄家不包先轮闲家, 闲家也不包才强制庄家硬包(双财最低)
        console.log("[bao] seat=", seatIndex, " 不包");
        game.baoPassed[seatIndex] = true;
        if(game.baoCurrentSeat < 0){
            if(seatIndex == game.button){
                // 庄家第一个不包: 还没人叫过, 轮到闲家叫台, 不能直接硬包
                var xian0 = (seatIndex + 1) % 2;
                game.baoTurnSeat = xian0;
                sendBaoTurn(game, xian0);
                return;
            }
            // 闲家也不包: 庄家强制硬包, 但包法(双财/独财/无财)由庄家自选, 台数固定2台
            console.log("[bao] 双方均不包, 庄家硬包: 转庄家选包法(2台)");
            game.baoForced = true;
            game.baoTai = 2;
            game.baoMode = 2;
            game.baoCurrentSeat = game.button;
            game.baoCurrentRank = -1;
            game.baoTurnSeat = game.button;
            sendBaoTurn(game, game.button);
            return;
        }
        // 已有人叫台且对方放弃: 当前叫台者成包家
        finalizeBao(game);
        return;
    }

    // 硬包阶段: 包家已定(庄家), 台数固定2台, 只接受包法选择
    if(game.baoForced){
        if(seatIndex != game.button){ return; }
        game.baoForced = false;
        game.baoTai = 2;
        game.baoMode = (caishenMode == null ? 2 : caishenMode);
        game.baoCurrentSeat = game.button;
        game.baoCurrentRank = baoRank(2, game.baoMode);
        console.log("[bao] 硬包 seat=", seatIndex, " 包法mode=", game.baoMode, " tai=2");
        finalizeBao(game);
        return;
    }

    // 正常叫台: 校验可压过当前最高
    var rank = baoRank(baoTai, caishenMode);
    if(rank <= game.baoCurrentRank){
        console.log("[bao] seat=", seatIndex, " rank=", rank, " <= current=", game.baoCurrentRank, " 拒绝");
        return;
    }
    game.baoTai = baoTai;
    game.baoMode = caishenMode;
    game.baoCurrentRank = rank;
    game.baoCurrentSeat = seatIndex;
    console.log("[bao] seat=", seatIndex, " 叫台 tai=", baoTai, "mode=", caishenMode, " rank=", rank);

    // 轮转: 换另一人叫
    var other = (seatIndex + 1) % 2;
    if(game.baoPassed[other]){
        // 对方已放弃, 当前人直接成包家
        finalizeBao(game);
        return;
    }
    game.baoTurnSeat = other;
    sendBaoTurn(game, other);
};

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
    var onlineCount = 0;
    for(var i = 0; i < roomInfo.seats.length; ++i){
        var rs = roomInfo.seats[i];
        if(rs.userId > 0 && userMgr.isOnline(rs.userId)){
            onlineCount++;
            if(rs.ready){ readyCount++; }
        }
    }

    if(onlineCount >= 2 && readyCount == onlineCount){
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
