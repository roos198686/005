/**
 * 浙江诸暨麻将 - 自选财神 4人版（独立玩法后端，type=zj4_zx，与2人版完全独立）
 * 规则特点：
 * 1. 使用136张牌（无花牌）
 * 2. 自选财神：发牌不定财神；玩家可胡牌时弹窗自选 无财/单财/双财，财神只能用于胡牌，不能吃碰杠
 * 3. 每人13张牌（庄家14张）
 * 4. 可吃、碰、杠；吃碰后不能立刻杠（直到下次摸牌）
 * 5. 三台起胡：胡牌台数需≥后台配置的 min_tai（缺省3台）；能否点炮胡由后台 dianpao_hu 设置
 * 6. 庄家：开局自动选庄，第二局起谁胡谁庄；庄家连续2次胡牌或流局后为老庄，老庄结算×后台 laozhuang_multiplier
 * 7. 漏胡：可点炮胡而未胡→本轮不能再点炮胡；自己可胡而未胡→本轮不能胡，下次自己摸牌解除
 * 8. 可抢杠胡；台数与翻财神一致（杠开1台/抢杠1台），全字牌按后台最高台数封顶
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

// 三台起胡门槛：后台可配，缺省 3 台
function getMinTai(game){
    return taiRule(game, 'min_tai', 3);
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
        // 牌ID以客户端牌面为准: 27中 28发 29白, 30东 31西 32南 33北
        // 中发白：中→发→白→中 3循环
        if(pai >= 27 && pai <= 29){ return 27 + ((pai - 27 + 1) % 3); }
        // 东南西北：东→南→西→北→东 4循环(牌ID顺序 30→32→31→33)
        var windIds = [30, 32, 31, 33];
        for(var i = 0; i < 4; ++i){
            if(windIds[i] === pai){ return windIds[(i + 1) % 4]; }
        }
        return pai;
    }
    var t = getMJType(pai);
    return t * 9 + ((pai % 9) + 1) % 9;
}

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
    game.caishenMode = -1; //重置自选财神模式
    game.fanPai = -1;

    var seatIndex = game.button;
    for(var i = 0; i < 26; ++i){ // 13*2=26，2人玩法每人13张
        mopai(game, seatIndex);
        seatIndex = (seatIndex + 1) % 2;
    }
    mopai(game, game.button); // 庄家多一张
    game.turn = game.button;

    // 自选财神：发牌后不定财神，caishen/caishen2 保持 -1，玩家可胡牌时自行选择
}

// 胡牌判定（支持财神替代，caishen2 为双财神第二张）
function checkCanHu(seatData, caishen, caishen2){
    var numPeng = (seatData.pengs ? seatData.pengs.length : 0);
    var numChi = (seatData.chis ? seatData.chis.length : 0);
    var numGang = (seatData.gangs ? seatData.gangs.length : 0);
    var expectedLen = 14 - 3 * numPeng - 3 * numChi - 3 * numGang;
    if(seatData.holds.length !== expectedLen) return false;
    // 直接复用完整 DFS（findAllHuSplits）判断能否胡，和 calculateTai 用同一套算法
    return findAllHuSplits(seatData, caishen, caishen2).length > 0;
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
                // 财神被吃/碰/杠用掉后记下来，结算"无财"时不能漏（副露里只记顶替后的牌面值）
                seatData.caishenInMelds = (seatData.caishenInMelds || 0) + 1;
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
    var csCount = game.cai_peng ? getCaishenCount(seatData, game.caishen, game.caishen2) : 0;
    if(count + csCount >= 2 && count >= 1) seatData.canPeng = true;
}

function checkCanGang(game, seatData, targetPai){
    if(game.mahjongs.length <= game.currentIndex) return;
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
    if(seatData.noGangUntilMopai) return; // 自选财神:吃碰后不能立刻杠,直到下次摸牌
    if(game.mahjongs.length <= game.currentIndex) return;
    var csCount = game.cai_gang ? getCaishenCount(seatData, game.caishen, game.caishen2) : 0;
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
    if(seatData.noGangUntilMopai) return; // 自选财神:吃碰后不能立刻杠,直到下次摸牌
    // 补杠：碰过的牌，手中还有一张（可以是财神替代）
    var csCount = game.cai_gang ? getCaishenCount(seatData, game.caishen, game.caishen2) : 0;
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

        if(needCs <= csCount && (h1 || h2)){
            seatData.canChi = true;
            if(!seatData.chiPai) seatData.chiPai = [];
            seatData.chiPai.push([p1, p2, targetPai]);
        }
    }
}

// 自选财神：临时把 game.caishen/caishen2 换成候选值算台数，算完恢复（不改 calculateTai 签名）
function calcTaiWithCaishen(seatData, game, c1, c2, isZimo, extraTai){
    var oldC1 = game.caishen, oldC2 = game.caishen2;
    game.caishen = c1; game.caishen2 = c2;
    var t = calculateTai(seatData, game, isZimo, extraTai);
    game.caishen = oldC1; game.caishen2 = oldC2;
    return t;
}

// 自选财神：枚举所有可胡的财神方案（无财/单财/双财），按台数降序返回
// 返回 [{mode:0无财|1单财|2双财, c1, c2, tai}]，空数组表示不可胡
// forbidPai: 禁止当选财神的牌(点炮/抢杠场景为别人的牌,不能拿来当自己的财神);自摸传-1
function collectHuPlans(seatData, game, isZimo, extraTai, forbidPai){
    if(forbidPai == null){ forbidPai = -1; }
    var plans = [];
    var minTai = getMinTai(game);
    // 无财
    if(checkCanHu(seatData, -1, -1)){
        var t0 = calcTaiWithCaishen(seatData, game, -1, -1, isZimo, extraTai);
        if(t0 >= minTai) plans.push({mode:0, c1:-1, c2:-1, tai:t0});
    }
    // 手牌去重面值(只有手上有的牌才能选作财神)
    // forbidPai(点炮/抢杠对家打进来的牌)的面值永远不得当选财神,即使手上本来就有同点数的牌
    var seen = {};
    var vals = [];
    for(var i = 0; i < seatData.holds.length; ++i){
        var v = seatData.holds[i];
        if(v === forbidPai){ continue; }
        if(!seen[v]){ seen[v] = true; vals.push(v); }
    }
    // 单财
    for(var a = 0; a < vals.length; ++a){
        var v1 = vals[a];
        if(checkCanHu(seatData, v1, -1)){
            var t1 = calcTaiWithCaishen(seatData, game, v1, -1, isZimo, extraTai);
            if(t1 >= minTai) plans.push({mode:1, c1:v1, c2:-1, tai:t1});
        }
    }
    // 双财：与其他玩法一致,第二财神不是任意单牌,而是所选财神的连续下一张
    // (数牌同花色1-9循环;字牌中→发→白、东→南→西→北各自循环,见 nextCaishenOf)
    for(var a2 = 0; a2 < vals.length; ++a2){
        var v2 = vals[a2];
        var v3 = nextCaishenOf(v2);
        if(v3 == v2) continue;
        //派生的第二财若正好等于对家打进来的牌,等于把别人的牌当财神用,不允许
        if(v3 === forbidPai){ continue; }
        if(checkCanHu(seatData, v2, v3)){
            var t2 = calcTaiWithCaishen(seatData, game, v2, v3, isZimo, extraTai);
            if(t2 >= minTai) plans.push({mode:2, c1:v2, c2:v3, tai:t2});
        }
    }
    plans.sort(function(x, y){ return y.tai - x.tai; });
    return plans;
}

function checkCanDianPaoHu(game, seatData, targetPai){
    game.lastHuPaiSeat = -1;
    seatData.canHu = false;
    // 后台开关：禁止点炮胡时直接返回（只保留抢杠胡作为非自摸胡的入口）
    if(game.dianpao_hu === 0){
        return;
    }
    // 漏胡：可点炮胡未胡→本轮不能再点炮胡；自摸未胡→本轮不能胡任何牌
    if(seatData.louhuDianpao || seatData.louhuZimo){
        return;
    }
    // 直接把打出的牌试进手牌判胡，不依赖 tingMap 同步状态，避免漏判
    seatData.holds.push(targetPai);
    seatData.countMap[targetPai] = (seatData.countMap[targetPai] || 0) + 1;
    // 自选财神：枚举所有财神方案，存在任一方案即可胡（具体选哪个由玩家胡牌时决定）
    // 点炮牌是别人打出的牌,不得当选财神(含双财第二财)
    var plans = collectHuPlans(seatData, game, false, 0, targetPai);
    seatData.canHu = plans.length > 0;
    if(seatData.canHu){
        seatData.huPlans = plans; // 缓存方案，exports.hu 时直接推送供玩家选择
    }
    seatData.countMap[targetPai]--;
    seatData.holds.pop();
    console.log("[checkCanDianPaoHu zjzx4] targetPai=", targetPai, "holds=", seatData.holds.length, "canHu=", seatData.canHu, "plans=", plans.length);
}

// 弯杠前检查抢杠胡：给除杠者外的所有座位做一次"把 pai 当弃牌"的接炮胡判定
// 返回 true 表示有人可以抢杠（已给对应玩家设置 canHu=true + sendOperations），否则返回 false
function checkCanQiangGang(game, gangSeatIndex, pai){
    var hasActions = false;
    var seatCount = game.gameSeats.length;
    for(var i = 0; i < seatCount; ++i){
        if(i == gangSeatIndex) continue; // 杠者自己不能抢自己的杠
        var sd = game.gameSeats[i];
        // 漏胡：可点炮胡未胡→本轮不能再点炮/抢杠胡；自摸未胡→本轮不能胡任何牌
        if(sd.louhuDianpao || sd.louhuZimo){
            sd.canHu = false;
            continue;
        }
        // 直接把 pai 试进手牌判胡（枚举所有自选财神方案）
        sd.holds.push(pai);
        sd.countMap[pai] = (sd.countMap[pai] || 0) + 1;
        // 抢杠胡额外加抢杠台(后台 qiang_gang 配置,缺省1台);被抢的牌是杠者的牌,不得当选财神
        var plans = collectHuPlans(sd, game, false, taiRule(game, 'qiang_gang', 1), pai);
        var can = plans.length > 0;
        sd.countMap[pai]--;
        sd.holds.pop();
        if(can){
            sd.canHu = true;
            sd.huPlans = plans; // 缓存方案，exports.hu 时推送供玩家选择
            hasActions = true;
            sendOperations(game, sd, pai); // 用 pai 作为 target 让客户端知道胡的是哪张
        } else {
            sd.canHu = false;
        }
    }
    return hasActions;
}

// 执行弯杠（补杠）的实际牌力变更：从手牌扣 1 张真牌或财神，pengs 转 gangs
function doWanGang(game, seatData, pai){
    var count = seatData.countMap[pai] || 0;
    if(count >= 1){
        var idx = seatData.holds.indexOf(pai);
        if(idx != -1) seatData.holds.splice(idx, 1);
        seatData.countMap[pai] = count - 1;
    } else {
        removeCaishenTiles(game, seatData, 1);
    }
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
        sd.huPlans = null; // 操作窗口结束,缓存的可胡财神方案一并失效
        sd.selectingCaishen = false; // 操作落定(碰/吃/杠/摸牌等),财神选择窗口同步关闭,防止残留状态导致重进房间重推过期方案
        sd.pendingPlans = null;
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
    // 自选财神：摸牌成功即进入新轮次，清除该座漏胡标记与"吃碰后禁杠"限制
    turnSeat.louhuDianpao = false;
    turnSeat.louhuZimo = false;
    turnSeat.noGangUntilMopai = false;
    checkCanAnGang(game, turnSeat);
    checkCanWanGang(game, turnSeat);
    // 自选财神：枚举所有财神方案判自摸（杠上开花额外加台）；摸牌已解除漏胡，本次自摸可正常判
    var _extraTai = turnSeat.lastGangHua ? taiRule(game, 'gang_kai', 1) : 0;
    var _plans = collectHuPlans(turnSeat, game, true, _extraTai);
    if(_plans.length > 0){
        turnSeat.canHu = true;
        turnSeat.huPlans = _plans; // 缓存方案，exports.hu 时推送供玩家选择
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
    // 有胡牌方案(需选财神):起操作倒计时(超时自动过)；否则起出牌倒计时
    // guo 在自己摸牌后(chuPai==-1)会自动补起出牌倒计时,形成"操作窗口→出牌窗口"的正确时序
    if(_plans.length > 0){
        scheduleTurnTimeout(game, game.turn, true);
    } else {
        scheduleTurnTimeout(game, game.turn, false);
    }
}

function doGameOver(game){
    game.gameOver = true;
    clearTurnTimeout(game);
    var roomId = roomMgr.getRoomIdOfUser(game.gameSeats[0].userId);
    var roomInfo = roomMgr.getRoom(roomId);
    if(roomInfo == null){
        return;
    }

    // 荒庄（流局）惩罚：包麻将有包家时，包家扣分，其余三家平分
    var anyHued = false;
    for(var i = 0; i < 2; ++i){
        if(game.gameSeats[i].hued){ anyHued = true; break; }
    }
    if(!anyHued && game.playStyle == 'baocaishen' && game.baoSeatIndex >= 0){
        var unit = (game.conf.baseScore || 1) * Math.pow(2, Math.min(game.baoTai || 2, game.maxTai || 10));
        var share = Math.floor(unit / 3);
        if(share > 0){
            game.gameSeats[game.baoSeatIndex].score -= share * 3;
            for(var i = 0; i < 2; ++i){
                if(i != game.baoSeatIndex){ game.gameSeats[i].score += share; }
            }
        }
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
                // 自选财神:结算弹窗显示胡家本局所定财神(无财为-1/-1)
                caishen: game.caishen,
                caishen2: game.caishen2,
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
    // 自选财神：记录本局胡牌者座位与是否流局，begin() 据此轮换庄家/累计老庄
    roomInfo.lastHuSeat = -1;
    roomInfo.lastGameLiuju = true;
    for(var i = 0; i < 2; ++i){
        if(game.gameSeats[i].hued){
            roomInfo.lastHuSeat = i;
            roomInfo.lastGameLiuju = false;
            if(i == game.button){
                roomInfo.lastHuIsBanker = true;
            }
            break;
        }
    }

    // 记录每局分数明细（整场结算面板展示每一局得分+胡牌台数）
    if(!roomInfo.roundHistory) roomInfo.roundHistory = [];
    var roundItem = { index: roomInfo.numOfGames, scores: [] };
    for(var i = 0; i < 2; ++i){
        var scoreItem = { userid: results[i].userid, name: results[i].name, score: results[i].score };
        if(results[i].huinfo && results[i].huinfo.length > 0){
            for(var h = 0; h < results[i].huinfo.length; ++h){
                var hi = results[i].huinfo[h];
                if(hi && hi.ishupai){
                    scoreItem.tai = hi.fan || 0;
                    scoreItem.zimo = (hi.action == 'zimo');
                    scoreItem.tailog = hi.tailog || [];
                    scoreItem.caishenMode = (results[i].huinfo[0] && results[i].huinfo[0].caishen != null) ?
                        ((results[i].huinfo[0].caishen == -1 && results[i].huinfo[0].caishen2 == -1) ? 0 :
                         (results[i].huinfo[0].caishen2 == -1 ? 1 : 2)) : -1;
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
    // 缓存最近一局结算:结算停留期断线/重进时由 resendGameState 补发
    game.lastResult = pushData;

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
        pushData.roundHistory = roomInfo.roundHistory || [];
    }

    userMgr.brocastInRoom(roomId, 'game_over_push', pushData);

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
    var baseInfo = JSON.stringify({type: roomInfo.conf.type, button: game.button, caishen: game.caishen, caishen2: game.caishen2});
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
    if(game == null || game.gameOver) return;
    var seatIndex = getSeatIndex(userId);
    if(seatIndex != game.turn) return;
    // 上一次出牌后其他玩家还有未处理的吃/碰/杠/胡选择时禁止再出牌(必须等其过/吃/碰/杠,防止连打顶掉操作弹窗)
    for(var i = 0; i < game.gameSeats.length; ++i){
        if(i != seatIndex && hasOperations(game.gameSeats[i])) return;
    }

    var seatData = game.gameSeats[seatIndex];
    seatData.lastGangHua = false; //出牌即放弃杠上开花机会(仅杠后摸牌胡才加台)
    var idx = seatData.holds.indexOf(pai);
    if(idx == -1) return;
    // 上面校验全部通过才算有效出牌,此时才清倒计时
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
        setTimeout(function(){ doUserMoPai(game); }, 500);
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

    // 逐个发送，每人只收到自己的手牌
    var roomId = roomMgr.getRoomIdOfUser(userId);
    for(var i = 0; i < 2; ++i){
        var sd = game.gameSeats[i];
        var data = {si: seatIndex, pai: pai};
        data.holds = (i === seatIndex) ? sd.holds.slice() : sd.holds.length;
        userMgr.sendMsg(sd.userId, 'game_peng_push', data);
    }

    clearAllOptions(game);
    rebuildCountMap(seatData);
    checkTingPai(seatData, game.caishen, game.caishen2);
    seatData.noGangUntilMopai = true; // 自选财神:碰后不能立刻杠,直到下次摸牌
    // 自选财神：枚举所有财神方案判胡
    var _pengPlans = collectHuPlans(seatData, game, false, 0);
    seatData.canHu = _pengPlans.length > 0;
    if(seatData.canHu){ seatData.huPlans = _pengPlans; }
    checkCanAnGang(game, seatData);
    checkCanWanGang(game, seatData);
    sendOperations(game, seatData, -1);
};

exports.gang = function(userId, pai){
    var game = getGameByUserID(userId);
    if(game == null || game.gameOver) return;
    clearTurnTimeout(game);
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
                game.qiangGangContext = {
                    gangSeatIndex: seatIndex,
                    pai: pai,
                    needCs: 0,
                    isValid: true
                };
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

    // 逐个发送，每人只收到自己的手牌
    var roomId = roomMgr.getRoomIdOfUser(userId);
    for(var i = 0; i < 2; ++i){
        var sd = game.gameSeats[i];
        var data = {si: seatIndex, pai: pai, gangtype: seatData.gangs[seatData.gangs.length-1].type};
        data.holds = (i === seatIndex) ? sd.holds.slice() : sd.holds.length;
        userMgr.sendMsg(sd.userId, 'game_gang_push', data);
    }

    clearAllOptions(game);
    setTimeout(function(){ doUserMoPai(game); }, 500);
};

exports.chi = function(userId, chiPais){
    var game = getGameByUserID(userId);
    if(game == null || game.gameOver) return;
    clearTurnTimeout(game);
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
    seatData.noGangUntilMopai = true; // 自选财神:吃后不能立刻杠,直到下次摸牌
    // 自选财神：枚举所有财神方案判胡
    var _chiPlans = collectHuPlans(seatData, game, false, 0);
    seatData.canHu = _chiPlans.length > 0;
    if(seatData.canHu){ seatData.huPlans = _chiPlans; }
    sendOperations(game, seatData, -1);
};

exports.hu = function(userId, data){
    var game = getGameByUserID(userId);
    if(game == null || game.gameOver) return;
    clearTurnTimeout(game);
    var seatIndex = getSeatIndex(userId);
    var seatData = game.gameSeats[seatIndex];
    if(!seatData.canHu) return;

    // ========== 第一段：未带财神选择 → 推送可胡财神方案，等客户端弹窗选择 ==========
    if(data == null || data.mode == null){
        var plans0 = seatData.huPlans;
        if(!plans0 || plans0.length == 0){
            // 缓存兜底重算（正常不会发生：canHu=true 时必然已缓存 plans）
            var isQG0 = (game.qiangGangContext != null && game.qiangGangContext.isValid);
            var isZimo0 = !isQG0 && (game.chuPai == -1);
            var extra0 = 0;
            if(isZimo0 && seatData.lastGangHua) extra0 += taiRule(game, 'gang_kai', 1);
            if(isQG0) extra0 += taiRule(game, 'qiang_gang', 1);
            if(isQG0 || !isZimo0){
                var hp0 = isQG0 ? game.qiangGangContext.pai : game.chuPai;
                seatData.holds.push(hp0);
                seatData.countMap[hp0] = (seatData.countMap[hp0] || 0) + 1;
                plans0 = collectHuPlans(seatData, game, isZimo0, extra0, hp0); //别人的牌不得当选财神
                seatData.countMap[hp0]--;
                seatData.holds.pop();
            } else {
                plans0 = collectHuPlans(seatData, game, true, extra0);
            }
        }
        if(!plans0 || plans0.length == 0) return;
        seatData.selectingCaishen = true;
        seatData.pendingPlans = plans0;
        // canHu 保持 true：弹窗期间操作天然阻塞,玩家选择后再发 hu 带 data,或发 guo 弃胡(记漏胡)
        userMgr.sendMsg(userId, 'game_caishen_plans_push', {plans: plans0});
        // 财神选择弹窗期间也起操作倒计时,超时自动弃胡(记漏胡),过掉后 guo 会补起出牌倒计时
        scheduleTurnTimeout(game, seatIndex, true);
        return;
    }

    // ========== 第二段：客户端已选财神 → 校验所选方案合法性(防作弊)后按所选财神结算 ==========
    var plans = seatData.pendingPlans || seatData.huPlans || [];
    var wantC1 = (data.c1 != null) ? data.c1 : -1;
    var wantC2 = (data.c2 != null) ? data.c2 : -1;
    // 双财:客户端只传所选财神c1,第二财为规则内连续下一张,由服务端统一补齐(防两端规则不一致)
    if(data.mode == 2 && wantC1 >= 0){ wantC2 = nextCaishenOf(wantC1); }
    var chosen = null;
    for(var pi = 0; pi < plans.length; ++pi){
        var pl = plans[pi];
        if(pl.mode == data.mode && pl.c1 == wantC1 && pl.c2 == wantC2){
            chosen = pl;
            break;
        }
    }
    if(!chosen){
        // 非法选择：重推方案让玩家重选
        userMgr.sendMsg(userId, 'game_caishen_plans_push', {plans: plans});
        return;
    }
    seatData.selectingCaishen = false;
    seatData.pendingPlans = null;
    // 应用玩家自选的财神（仅用于本次胡牌结算，下一局 deal 重置为 -1）
    game.caishen = chosen.c1;
    game.caishen2 = chosen.c2;
    game.caishenMode = chosen.mode; //0无财 1独财 2双财,用于计分翻倍判断

    seatData.hued = true;
    seatData.canHu = false;

    var isQiangGang = (game.qiangGangContext != null && game.qiangGangContext.isValid);
    var isZimo, huPai;

    if(isQiangGang){
        var ctx = game.qiangGangContext;
        var gangSd = game.gameSeats[ctx.gangSeatIndex];
        var pai = ctx.pai;
        var gIdx = gangSd.holds.indexOf(pai);
        if(gIdx != -1) gangSd.holds.splice(gIdx, 1);
        gangSd.countMap[pai] = (gangSd.countMap[pai] || 0) - 1;
        isZimo = false;
        huPai = pai;
        seatData.holds.push(huPai);
        seatData.countMap[huPai] = (seatData.countMap[huPai] || 0) + 1;
        game.qiangGangContext.isValid = false;
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

    // 天胡地胡：按最高台数结算
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
        var cfgTai = taiRule(game, isTianHu ? 'tian_hu' : 'di_hu', 0);
        tai = (cfgTai > 0) ? cfgTai : (game.maxTai || 10);
        seatData.taiLog = [(isTianHu ? '天胡' : '地胡') + '=' + (cfgTai > 0 ? cfgTai + '(配置)' : '封顶' + tai)];
        console.log("[天胡地胡]", isTianHu ? "天胡" : "地胡", "cfg=", cfgTai, "final=", tai);
    }

    // 一台起胡：台数不满门槛不能胡（门槛后台可配，缺省1台）
    var minTai = getMinTai(game);
    if(tai < minTai){
        seatData.hued = false;
        seatData.canHu = true;
        if(isQiangGang){
            seatData.holds.pop();
            seatData.countMap[huPai]--;
            if(game.qiangGangContext){
                var gsIdx = game.qiangGangContext.gangSeatIndex;
                var gs = game.gameSeats[gsIdx];
                gs.holds.push(huPai);
                gs.countMap[huPai] = (gs.countMap[huPai] || 0) + 1;
                game.qiangGangContext.isValid = true;
            }
        } else if(!isZimo){
            seatData.holds.pop();
            seatData.countMap[huPai]--;
        }
        return;
    }

    // 计分：底 × 2^(台数-起胡台数), 即刚好起胡台数=底分, 每多一台翻一番
    var baseScore = game.conf.baseScore || 1;
    var score = baseScore * Math.pow(2, Math.max(0, tai - minTai));

    // 老庄翻倍：连庄期间任何人胡牌都按后台 laozhuang_multiplier 倍数结算(默认×2)
    if(game.laozhuangCount > 0){
        var lzMul = game.laozhuangMultiplier || 2;
        score = score * lzMul;
        if(seatData.taiLog){ seatData.taiLog.push('老庄×' + lzMul); } //结算说明里展示老庄翻倍
    }

    // 自选财神:定为无财(0)或独财(1)时积分翻倍
    if(game.caishenMode === 0 || game.caishenMode === 1){
        score = score * 2;
        if(seatData.taiLog){ seatData.taiLog.push((game.caishenMode === 0 ? '无财' : '独财') + '×2'); }
    }

    // 普通结算（自选财神无包家）：点炮放炮者出钱，自摸对手出钱
    if(isZimo){
        seatData.score += score;
        for(var i = 0; i < 2; ++i){
            if(i != seatIndex){ game.gameSeats[i].score -= score; }
        }
    } else {
        seatData.score += score;
        game.gameSeats[game.turn].score -= score;
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
    // 记录放炮者（4人版：放炮者即当前出牌者；抢杠胡则是杠者）
    if(isQiangGang){
        var gIdx4 = ctx.gangSeatIndex;
        game.gameSeats[gIdx4].fangpaoInfo = { target: seatIndex, pai: huPai, qianggang: true };
    } else if(!isZimo){
        var discarderIndex = game.turn;
        if(discarderIndex >= 0 && discarderIndex != seatIndex){
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

    // 自选财神：弃胡前记录本窗口是否可胡(clearAllOptions会清canHu)，用于漏胡标记
    var wasCanHu = !!seatData.canHu;
    // 财神选择弹窗中点"弃胡"：清选择状态,按正常"过"处理(记漏胡)
    if(seatData.selectingCaishen){
        seatData.selectingCaishen = false;
        seatData.pendingPlans = null;
    }

    // 抢杠胡窗口期优先处理
    if(game.qiangGangContext && game.qiangGangContext.isValid){
        var ctxQG = game.qiangGangContext;
        var seatCount = game.gameSeats.length;
        if(seatIndex != ctxQG.gangSeatIndex){
            // 漏胡：抢杠窗口可胡而弃胡,记点炮类漏胡(本轮不能再点炮/抢杠胡)
            if(wasCanHu){ seatData.louhuDianpao = true; }
            seatData.canHu = false;
            seatData.huPlans = null;
            seatData.canGang = false;
            seatData.gangPai = [];
            var allOver = true;
            for(var i = 0; i < seatCount; ++i){
                if(i == ctxQG.gangSeatIndex) continue;
                if(game.gameSeats[i].canHu) { allOver = false; break; }
            }
            userMgr.sendMsg(seatData.userId, 'game_action_push');
            if(allOver){
                var gangSd = game.gameSeats[ctxQG.gangSeatIndex];
                game.qiangGangContext = null;
                doWanGang(game, gangSd, ctxQG.pai);
                gangSd.lastGangHua = true;
                game.turn = ctxQG.gangSeatIndex;
                // 逐个推送
                var roomIdQG = roomMgr.getRoomIdOfUser(gangSd.userId);
                for(var k = 0; k < seatCount; ++k){
                    var sdQG = game.gameSeats[k];
                    var dataQG = {si: ctxQG.gangSeatIndex, pai: ctxQG.pai, gangtype: 'wan', pengs: gangSd.pengs, pengTiles: gangSd.pengTiles};
                    dataQG.holds = (k === ctxQG.gangSeatIndex) ? sdQG.holds.slice() : sdQG.holds.length;
                    userMgr.sendMsg(sdQG.userId, 'game_gang_push', dataQG);
                }
                clearAllOptions(game);
                setTimeout(function(){ doUserMoPai(game); }, 500);
            }
            return;
        }
        // 杠者自己发 guo：放弃弯杠
        var gangSdQuit = game.gameSeats[ctxQG.gangSeatIndex];
        game.qiangGangContext = null;
        gangSdQuit.canGang = false;
        gangSdQuit.gangPai = [];
        userMgr.sendMsg(gangSdQuit.userId, 'game_action_push');
        return;
    }

    clearAllOptions(game, seatData);

    // 自己摸牌后的杠/胡选项：选择"过"则清除全部选项，推送空操作让玩家直接出牌
    if(game.chuPai == -1){
        // 漏胡：自摸可胡而未胡→本轮不能胡任何牌,直到下次自己摸牌解除
        if(wasCanHu){ seatData.louhuZimo = true; }
        seatData.lastGangHua = false; //摸牌后选择过=放弃杠上开花(仅杠后摸牌胡才加台)
        seatData.canHu = false;
        seatData.canGang = false;
        seatData.gangPai = [];
        userMgr.sendMsg(seatData.userId, 'game_action_push');
        // 操作窗口关闭后,立即起出牌倒计时(超时自动代打最后一张手牌)
        scheduleTurnTimeout(game, seatIndex, false);
        return;
    }

    // 别人出牌后的碰/杠/吃/胡选项：选择"过"后检查其他玩家
    // 漏胡：可点炮胡而未胡→本轮不能再点炮胡(直到下次自己摸牌解除)
    if(wasCanHu){ seatData.louhuDianpao = true; }
    // 给自己发 game_action_push(空操作)：让前端关闭财神选择弹窗,停止等待玩家选财神
    userMgr.sendMsg(seatData.userId, 'game_action_push');
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

// 全拆解(将+面子)搜索:返回字刻加权分最大的拆解 {kes:{pai:组数}} ,无法拆解返回 null
// 纯财神组刻不计字刻(财神无刻台);东风刻权重2,中发白刻权重1
// 用于台数统计:非对对胡牌型中"2张字牌+1财神补刻"也能算字刻台
function bestZiKeSplit(countMap, caishenCount){
    var bestPure = null;
    var bestPureScore = -1;
    var bestNoPure = null;
    var bestNoPureScore = -1;
    // 字刻权重必须与实际计台规则(ziKeDefs)一致: 东风2台,中发白1台,南西北0台
    // 旧实现南西北也记1台,拆解会优先选"北北+财神"这类0台刻,丢掉"白白+财神"的白刻台
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

// 剩余手牌能否全部组成 needShun 组顺子（财神可替代）；字牌不能组顺子
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
    // 注意:将牌可以是字牌对(西风西风这类),平胡只禁刻子不禁字对
    var csPairOk = true;
    var labels = Object.keys(countMap);
    for(var i = 0; i < labels.length; ++i){
        var p = parseInt(labels[i]);
        if(countMap[p] >= 2){
            countMap[p] -= 2;
            var ok = canFormShunPure(countMap, cs, needShun);
            countMap[p] += 2;
            if(ok) return true;
        }
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
// 测试钩子：暴露台数计算，供回归测试验证台数规则
exports.__calculateTai = calculateTai;
// 测试钩子：暴露局对象，供仿真脚本构造牌局场景
exports.__getGame = function(roomId){ return games[roomId]; };

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
        playStyle: 'zixuancaishen',
        maxTai: roomInfo.conf.maxTai || 10,
        taiRules: roomInfo.conf.taiRules || null,
        // 自选财神：财神只能用于胡牌，强制禁止财吃/财碰/财杠/7财
        caishen_cpg: 0,
        cai_chi: 0,
        cai_peng: 0,
        cai_gang: 0,
        cai7: 0,
        dianpao_hu: roomInfo.conf.dianpao_hu != null ? roomInfo.conf.dianpao_hu : 1,
        laozhuangCount: roomInfo.laozhuangCount || 0,
        laozhuangMultiplier: roomInfo.conf.laozhuang_multiplier || 2, // 老庄结算倍数(后台可配,默认2)
        baoSeatIndex: -1,
        baoTai: 2,
        baoTaiFee: 0,
        remove_tiao: roomInfo.conf.remove_tiao != null ? roomInfo.conf.remove_tiao : 0
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
            lastGangHua: false,
            huPlans: null,          // 当前操作窗口可胡的财神方案缓存
            selectingCaishen: false, // 正在财神选择弹窗中(等待客户端选择或弃胡)
            pendingPlans: null,     // 已推送给客户端待选择的方案
            louhuDianpao: false,    // 漏胡:可点炮胡未胡→本轮不能再点炮胡(下次自己摸牌解除)
            louhuZimo: false,       // 漏胡:自摸可胡未胡→本轮不能胡任何牌(下次自己摸牌解除)
            noGangUntilMopai: false // 吃/碰后不能立刻杠,直到下次摸牌
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
    //自选:庄家起手14张枚举财神方案判天胡(方案已含后台起胡台数门槛),有方案则给胡按钮
    rebuildCountMap(zhuangSeat);
    var _plans0 = collectHuPlans(zhuangSeat, game, true, 0);
    if(_plans0.length > 0){
        zhuangSeat.canHu = true;
        zhuangSeat.huPlans = _plans0; //缓存方案,exports.hu 时推送供玩家选择
        // 有胡牌方案(需选财神):只起操作倒计时,超时自动过(过掉后 guo 里会补起出牌倒计时)
        sendOperations(game, zhuangSeat, zhuangSeat.holds[zhuangSeat.holds.length-1]);
        scheduleTurnTimeout(game, game.button, true);
    } else {
        // 无胡牌方案:直接起出牌倒计时
        sendOperations(game, zhuangSeat, zhuangSeat.holds[zhuangSeat.holds.length-1]);
        scheduleTurnTimeout(game, game.button, false);
    }
};

// 断线重连/中途进房:向指定玩家补发当前对局状态(4人版)
exports.resendGameState = function(roomId, userId){
    var game = games[roomId];
    if(game == null) return;
    var roomInfo = roomMgr.getRoom(roomId);
    var seatIndex = roomMgr.getUserSeat(userId);
    if(seatIndex == null || game.gameSeats[seatIndex] == null) return;

    if(game.gameOver){
        //一局已结算:补发最近一局结算,重连客户端直接回到结算弹窗
        if(game.lastResult){
            if(roomInfo != null){
                userMgr.sendMsg(userId, 'game_num_push', roomInfo.numOfGames);
            }
            userMgr.sendMsg(userId, 'game_over_push', game.lastResult);
        }
        return;
    }

    var mySeatData = game.gameSeats[seatIndex];
    var data = {
        button: game.button,
        turn: game.turn,
        selectingCaishen: !!(mySeatData && mySeatData.selectingCaishen),
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
            chis: s.chis || [],
            angangs: s.angangs || [],
            diangangs: s.diangangs || [],
            wangangs: s.wangangs || []
        });
    }
    console.log('[resendGameState] userId=',userId,'seatIndex=',seatIndex,'turn=',game.turn,'holds_self=',JSON.stringify(data.seats[seatIndex] && data.seats[seatIndex].holds));
    // 自选财神: 选财神状态时直接把plans塞进game_start_push, 避免game_caishen_plans_push时序问题
    var mySeatData = game.gameSeats[seatIndex];
    data.selectingCaishen = !!(mySeatData && mySeatData.selectingCaishen);
    if(data.selectingCaishen && mySeatData.pendingPlans){
        data.plans = mySeatData.pendingPlans;
    }
    if(roomInfo != null){
        userMgr.sendMsg(userId, 'game_num_push', roomInfo.numOfGames);
    }
    userMgr.sendMsg(userId, 'game_start_push', data);

    // 补发未决操作:否则断线期间错过的吃/碰/杠/胡弹窗会让对家操作永久挂起
    if(mySeatData != null && hasOperations(mySeatData)){
        sendOperations(game, mySeatData, game.chuPai);
        if(seatIndex != game.turn){
            // 对家出牌触发的待选(非本人轮次)重新起算操作倒计时,超时自动过
            scheduleTurnTimeout(game, seatIndex, true);
        } else if(game.chuPai == -1){
            // 本人轮次且自己摸牌后有胡牌方案(开局庄家/自摸):起操作倒计时,超时自动过(guo会补起出牌倒计时)
            scheduleTurnTimeout(game, seatIndex, true);
        } else {
            // 本人轮次,别人出牌但自己是庄家被跳过:起操作倒计时
            scheduleTurnTimeout(game, seatIndex, true);
        }
    } else if(seatIndex == game.turn){
        // 本人轮次且无操作选项:直接起出牌倒计时
        scheduleTurnTimeout(game, seatIndex, false);
    }
};

exports.hasOperations = hasOperations;

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
    var onlineCount = 0;
    for(var i = 0; i < roomInfo.seats.length; ++i){
        var rs = roomInfo.seats[i];
        if(rs.userId > 0 && userMgr.isOnline(rs.userId)){
            onlineCount++;
            if(rs.ready){ readyCount++; }
        }
    }
    console.log("[setReady] room=", roomId, " readyCount=", readyCount, " onlineCount=", onlineCount, " seatsLen=", roomInfo.seats.length);

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

// 开一局：自选财神庄家规则：开局自动选庄，之后谁胡谁庄；庄家连续2次胡牌或流局后为老庄(老庄结算×倍数)
exports.begin = function(roomInfo){
    if(roomInfo.numOfGames > 0){
        if(roomInfo.lastGameLiuju){
            // 流局：庄家留任并升为老庄
            roomInfo.laozhuangCount = Math.max(1, (roomInfo.laozhuangCount || 0) + 1);
        } else if(roomInfo.lastHuSeat == roomInfo.nextButton){
            // 庄家自己胡牌：连庄；连续2次胡牌后升为老庄
            roomInfo.bankerWinStreak = (roomInfo.bankerWinStreak || 0) + 1;
            if(roomInfo.bankerWinStreak >= 2){
                roomInfo.laozhuangCount = Math.max(1, (roomInfo.laozhuangCount || 0) + 1);
            }
        } else if(roomInfo.lastHuSeat >= 0){
            // 闲家胡牌：谁胡谁庄
            roomInfo.nextButton = roomInfo.lastHuSeat;
            roomInfo.bankerWinStreak = 0;
            roomInfo.laozhuangCount = 0;
        } else {
            roomInfo.bankerWinStreak = 0;
            roomInfo.laozhuangCount = 0;
        }
    } else {
        roomInfo.bankerWinStreak = 0;
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
    roomMgr.destroy(roomId);
};

// 换三张 / 定缺：诸暨玩法不使用，提供空实现防止调用崩溃
exports.huanSanZhang = function(userId, p1, p2, p3){};
exports.dingQue = function(userId, que){};
