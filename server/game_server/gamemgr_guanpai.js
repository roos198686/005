// 关牌(扑克)游戏管理器
// 规则：48张牌(去大小王、红桃2/梅花2/方块2、黑桃A)，每人16张，剩余闲置
// 牌型：单/对/三/三带二/顺子(≥5)/连对(≥2组)/三顺(≥2组)/四带二/四带三/炸弹(4同点+1、AAA+1)
// 后台开关：四带二、四带三、脱手三带一、脱手四带二带三、炸弹 五项独立
var roomMgr = require("./roommgr");
var userMgr = require("./usermgr");
var db = require("../utils/db");

var games = {};

// ============ 牌组 ============
// 牌 id 编码: id = (rank - 3) * 4 + suit, rank 3..14(A)..15(2), suit 0黑桃 1红桃 2梅花 3方块
// 48张 = rank3-13各4张(44) + rank14去掉黑桃(3) + rank15只留黑桃(1)
function buildDeck(){
    var deck = [];
    for(var rank = 3; rank <= 13; ++rank){
        for(var s = 0; s < 4; ++s){ deck.push((rank - 3) * 4 + s); }
    }
    // A(rank14): 去黑桃(0), 留红桃/梅花/方块
    deck.push((14 - 3) * 4 + 1);
    deck.push((14 - 3) * 4 + 2);
    deck.push((14 - 3) * 4 + 3);
    // 2(rank15): 只留黑桃(0)
    deck.push((15 - 3) * 4 + 0);
    return deck;
}

function rankOf(id){ return Math.floor(id / 4) + 3; }
function suitOf(id){ return id % 4; }

function shuffle(arr){
    for(var i = arr.length - 1; i > 0; --i){
        var j = Math.floor(Math.random() * (i + 1));
        var t = arr[i]; arr[i] = arr[j]; arr[j] = t;
    }
}

// ============ 牌型识别（与客户端 GPGame._identifyCards 保持一致）============
function identifyCards(pais, isLastHand, conf){
    if(!pais || pais.length == 0) return null;
    var n = pais.length;
    var ranks = pais.map(function(c){ return rankOf(c); }).sort(function(a,b){ return a - b; });
    var cnt = {};
    for(var i = 0; i < ranks.length; ++i){ cnt[ranks[i]] = (cnt[ranks[i]] || 0) + 1; }
    var keys = Object.keys(cnt).map(Number).sort(function(a,b){ return a - b; });
    var maxCount = 0, maxCountKey = -1, count4Key = -1;
    for(var k = 0; k < keys.length; ++k){
        var c = cnt[keys[k]];
        if(c > maxCount){ maxCount = c; maxCountKey = keys[k]; }
        if(c == 4) count4Key = keys[k];
    }
    conf = conf || {};
    var bombOn = conf.gp_bomb != null ? !!conf.gp_bomb : true;
    var bombFourOn = conf.gp_bomb_four != null ? !!conf.gp_bomb_four : true;
    var allowA2 = conf.gp_straight_a2 != null ? !!conf.gp_straight_a2 : true;

    // 炸弹
    if(bombOn){
        if(n == 4 && cnt[14] >= 3) return { type:'bomb', key:14, len:4, bombLevel:2 };
        if(n == 4 && count4Key > 0 && bombFourOn) return { type:'bomb', key:count4Key, len:4, bombLevel:1 };
        if(n == 5 && count4Key > 0) return { type:'bomb', key:count4Key, len:5, bombLevel:0 };
    }
    if(n == 1) return { type:'single', key:ranks[0], len:1 };
    if(n == 2 && keys.length == 1) return { type:'pair', key:keys[0], len:2 };
    if(n == 3 && keys.length == 1) return { type:'triple', key:keys[0], len:3 };
    // 三带一
    if(n == 4 && maxCount == 3){
        var ok31 = (conf.gp_three_one != null ? !!conf.gp_three_one : true)
                || (isLastHand && (conf.gp_last_three_one != null ? !!conf.gp_last_three_one : false));
        if(ok31) return { type:'triple_one', key:maxCountKey, len:4 };
        return null;
    }
    // 三带二
    if(n == 5 && maxCount == 3 && keys.length == 2 && cnt[maxCountKey] == 3){
        return { type:'triple_pair', key:maxCountKey, len:5 };
    }
    // 四带二
    if(n == 6 && count4Key > 0){
        var ok42 = (conf.gp_four_two != null && conf.gp_four_two) || (isLastHand && conf.gp_last_four_two_three);
        if(ok42) return { type:'four_two', key:count4Key, len:6 };
        return null;
    }
    // 四带三
    if(n == 7 && count4Key > 0){
        var ok43 = (conf.gp_four_three != null && conf.gp_four_three) || (isLastHand && conf.gp_last_four_two_three);
        if(ok43) return { type:'four_three', key:count4Key, len:7 };
        return null;
    }
    // 顺子
    if(n >= 5 && keys.length == n){
        var allOne = true;
        for(var kk in cnt){ if(cnt[kk] != 1){ allOne = false; break; } }
        if(allOne){
            var allowA2 = conf.gp_straight_a2 != null ? !!conf.gp_straight_a2 : true;
            var sk = straightKey(keys, allowA2);
            if(sk > 0) return { type:'straight', key:sk, len:n };
            return null;
        }
    }
    // 连对
    if(n >= 4 && n % 2 == 0 && keys.length * 2 == n){
        var allTwo = true;
        for(var kk2 in cnt){ if(cnt[kk2] != 2){ allTwo = false; break; } }
        if(allTwo){
            var pk = pairStraightKey(keys, allowA2);
            if(pk > 0) return { type:'pair_straight', key:pk, len:n };
            return null;
        }
    }
    // 三顺
    if(n >= 6 && n % 3 == 0 && keys.length * 3 == n){
        var allThree = true;
        for(var kk3 in cnt){ if(cnt[kk3] != 3){ allThree = false; break; } }
        if(allThree){
            var tk = pairStraightKey(keys, allowA2);
            if(tk > 0) return { type:'triple_straight', key:tk, len:n };
            return null;
        }
    }
    return null;
}

function straightKey(keys, allowA2){
    if(keys.length < 5) return -1;
    // 1) 自然连续: 3~A 永远允许(不关开关); 2(15)不参与顺子
    var last = keys[keys.length - 1];
    if(last != 15){
        var seq = true;
        for(var j = 1; j < keys.length; ++j){ if(keys[j] != keys[j-1] + 1){ seq = false; break; } }
        if(seq) return last;
    }
    // 2) 环状(allowA2=true): A(14)→最低位1, 2(15)→2, 虚拟映射后只要从 vkeys[0] 开始连续,
    //    且原始 keys 里至少含 14(A) 或 15(2) 之一(避免纯自然连续 3~K 误进)
    if(allowA2 && (keys.indexOf(14) >= 0 || keys.indexOf(15) >= 0)){
        var vkeys = keys.map(virtRank).sort(function(a,b){return a-b;});
        var vseq = true;
        for(var j = 1; j < vkeys.length; ++j){ if(vkeys[j] != vkeys[j-1] + 1){ vseq = false; break; } }
        if(vseq) return vkeys[vkeys.length - 1];
    }
    return -1;
}

// 连对 / 三顺 key: 基本连续允许 3~A；allowA2 时也支持环状 (AA,22,33... 当虚拟低位)
function pairStraightKey(keys, allowA2){
    if(keys.length < 2) return -1;
    var last = keys[keys.length - 1];
    if(last != 15){
        var seq = true;
        for(var i = 1; i < keys.length; ++i){ if(keys[i] != keys[i-1] + 1){ seq = false; break; } }
        if(seq) return last;
    }
    if(allowA2 && (keys.indexOf(14) >= 0 || keys.indexOf(15) >= 0)){
        var vkeys = keys.map(virtRank).sort(function(a,b){return a-b;});
        var vseq = true;
        for(var i = 1; i < vkeys.length; ++i){ if(vkeys[i] != vkeys[i-1] + 1){ vseq = false; break; } }
        if(vseq) return vkeys[vkeys.length - 1];
    }
    return -1;
}

// 虚拟 rank: A(14)→1, 2(15)→2, 其他原样。供环状顺子/连对/三顺使用
function virtRank(r){ return r == 14 ? 1 : (r == 15 ? 2 : r); }

function canBeat(next, prev){
    if(!next || !prev) return false;
    var nb = next.type == 'bomb', pb = prev.type == 'bomb';
    if(nb && !pb) return true;
    if(!nb && pb) return false;
    if(nb && pb){
        if(next.bombLevel != prev.bombLevel) return next.bombLevel > prev.bombLevel;
        return next.key > prev.key;
    }
    if(next.type != prev.type || next.len != prev.len) return false;
    return next.key > prev.key;
}

// ============ 游戏辅助 ============
function getGameByUserID(userId){
    var roomId = roomMgr.getUserRoom(userId);
    if(roomId == null) return null;
    return games[roomId];
}

function collectSeats(roomInfo){
    var arr = [];
    for(var i = 0; i < roomInfo.seats.length; ++i){
        var rs = roomInfo.seats[i];
        if(rs.userId > 0){
            arr.push({roomSeatIndex:i, userId:rs.userId, name:rs.name, score:rs.score || 0});
        }
    }
    return arr;
}

function rankText(pai){
    var r = Math.floor(pai / 4) + 3;
    var names = {11:'J', 12:'Q', 13:'K', 14:'A', 15:'2'};
    return names[r] || ('' + r);
}

function nextSeat(game, from){
    var n = game.gameSeats.length;
    for(var k = 1; k <= n; ++k){
        var i = (from + k) % n;
        if(!game.gameSeats[i].finished) return i;
    }
    return -1;
}

function getSeatsInfo(game){
    var info = [];
    for(var i = 0; i < game.gameSeats.length; ++i){
        var s = game.gameSeats[i];
        info.push({
            userid: s.userId,
            name: s.name,
            seatindex: i,
            roomSeatIndex: s.roomSeatIndex,
            count: s.holds.length,
            finished: !!s.finished
        });
    }
    return info;
}

function sendStart(game){
    var seatsInfo = getSeatsInfo(game);
    for(var i = 0; i < game.gameSeats.length; ++i){
        var s = game.gameSeats[i];
        var myCards = s.holds.slice().sort(function(a,b){ return a - b; });
        console.log("[关牌] sendStart user=" + s.userId + " seat=" + i + " holds=" + s.holds.length + " cards=" + JSON.stringify(myCards));
        userMgr.sendMsg(s.userId, 'gp_start_push', {
            maxPlayers: game.gameSeats.length,
            seats: seatsInfo,
            mySeat: i,
            myCards: myCards,
            startSeat: game.turn,
            freePlay: game.freePlay,
            lastPlay: null,
            turnDeadline: game.turnDeadline,
            conf: game.conf
        });
    }
}

function notifyTurn(game){
    if(game.gameOver) return;
    var deadline = Date.now() + (game.conf.chupaiTimeout || 30) * 1000;
    game.turnDeadline = deadline;
    userMgr.brocastInRoom(game.roomId, 'gp_turn_push', {
        turn: game.turn,
        freePlay: game.freePlay,
        lastPlay: game.lastPlay,
        seats: getSeatsInfo(game),
        turnDeadline: deadline
    });
    scheduleAutoPlay(game);
}

// 出牌倒计时:到期自动出牌(压不过则自动过)
function scheduleAutoPlay(game){
    if(game.turnTimer){ clearTimeout(game.turnTimer); game.turnTimer = null; }
    var seq = ++game.turnSeq;
    var ms = ((game.conf.chupaiTimeout || 30) + 1) * 1000;
    game.turnTimer = setTimeout(function(){ autoAction(game, seq); }, ms);
}

function autoAction(game, seq){
    if(game.gameOver || seq != game.turnSeq) return;
    var seat = game.gameSeats[game.turn];
    if(seat == null || seat.finished) return;
    var pais = findAutoPlay(game, seat);
    if(pais == null){
        exports.guo(seat.userId);
    } else {
        exports.chuPai(seat.userId, pais);
    }
}

function findAutoPlay(game, seat){
    var holds = seat.holds.slice().sort(function(a,b){ return a - b; });
    if(holds.length == 0) return null;
    if(game.freePlay || game.lastPlay == null){
        // 自由出牌:出最小的单张
        return [holds[0]];
    }
    return findBeat(game.conf, holds, game.lastPlay);
}

// 从手牌中找最小能压过 lastPlay 的组合,找不到返回 null
function findBeat(conf, holds, lp){
    var sorted = holds.slice().sort(function(a,b){ return a - b; });
    var byRank = {};
    for(var i = 0; i < sorted.length; ++i){
        var r = Math.floor(sorted[i] / 4) + 3;
        (byRank[r] = byRank[r] || []).push(sorted[i]);
    }
    var ranks = Object.keys(byRank).map(Number).sort(function(a,b){ return a - b; });

    function tryCand(cand){
        var isLastHand = cand.length == holds.length;
        var ti = identifyCards(cand, isLastHand, conf);
        if(ti && canBeat(ti, lp)) return cand;
        return null;
    }
    // 带牌用最小散牌(排除主牌rank)
    function sideCards(exceptRank, n){
        var out = [];
        for(var i = 0; i < ranks.length && out.length < n; ++i){
            var r = ranks[i];
            if(r == exceptRank) continue;
            for(var j = 0; j < byRank[r].length && out.length < n; ++j) out.push(byRank[r][j]);
        }
        return out.length >= n ? out : null;
    }
    var cands = [];
    if(lp.type == 'single'){
        for(var i = 0; i < ranks.length; ++i) cands.push([byRank[ranks[i]][0]]);
    } else if(lp.type == 'pair'){
        for(var i = 0; i < ranks.length; ++i){ if(byRank[ranks[i]].length >= 2) cands.push(byRank[ranks[i]].slice(0, 2)); }
    } else if(lp.type == 'triple'){
        for(var i = 0; i < ranks.length; ++i){ if(byRank[ranks[i]].length >= 3) cands.push(byRank[ranks[i]].slice(0, 3)); }
    } else if(lp.type == 'triple_one' || lp.type == 'triple_pair'){
        var side = lp.type == 'triple_one' ? 1 : 2;
        for(var i = 0; i < ranks.length; ++i){
            var r = ranks[i];
            if(byRank[r].length < 3) continue;
            var s2 = sideCards(r, side);
            if(s2) cands.push(byRank[r].slice(0, 3).concat(s2));
        }
    } else if(lp.type == 'four_two' || lp.type == 'four_three'){
        var side2 = lp.type == 'four_two' ? 2 : 3;
        for(var i = 0; i < ranks.length; ++i){
            var r = ranks[i];
            if(byRank[r].length < 4) continue;
            var s3 = sideCards(r, side2);
            if(s3) cands.push(byRank[r].slice(0, 4).concat(s3));
        }
    } else if(lp.type == 'straight'){
        var n = lp.len;
        for(var a = 0; a + n <= ranks.length; ++a){
            cands.push(ranks.slice(a, a + n).map(function(r){ return byRank[r][0]; }));
        }
        // 环状候选: allowA2=true 且手牌含 A(14), 虚拟排序后切窗口, 把虚拟 rank 映射回真实 rank
        if(conf.gp_straight_a2 && ranks.indexOf(14) >= 0){
            var vranks = ranks.map(virtRank).sort(function(a,b){return a-b;});
            for(var a2 = 0; a2 + n <= vranks.length; ++a2){
                var seg = vranks.slice(a2, a2 + n);
                if(seg[0] != 1) continue; // 必须从 A 虚拟位开始
                // 虚拟 rank → 真实 rank
                var realSeg = seg.map(function(v){ return v <= 2 ? v + 13 : v; });
                // 检查真实 rank 都在 byRank 里存在（虚拟 A=1→14, 虚拟 2=2→15）
                var okR = true;
                for(var kk = 0; kk < realSeg.length; ++kk){ if(!byRank[realSeg[kk]] || byRank[realSeg[kk]].length == 0){ okR = false; break; } }
                if(okR) cands.push(realSeg.map(function(r){ return byRank[r][0]; }));
            }
        }
    } else if(lp.type == 'pair_straight'){
        var pr = ranks.filter(function(r){ return byRank[r].length >= 2; });
        var m = lp.len / 2;
        for(var a = 0; a + m <= pr.length; ++a){
            var rr = pr.slice(a, a + m);
            var c2 = [];
            rr.forEach(function(r){ c2 = c2.concat(byRank[r].slice(0, 2)); });
            cands.push(c2);
        }
        if(conf.gp_straight_a2 && pr.indexOf(14) >= 0){
            var vpr = pr.map(virtRank).sort(function(a,b){return a-b;});
            for(var a2 = 0; a2 + m <= vpr.length; ++a2){
                var seg = vpr.slice(a2, a2 + m);
                if(seg[0] != 1) continue;
                var realSeg = seg.map(function(v){ return v <= 2 ? v + 13 : v; });
                var okR = true;
                for(var kk = 0; kk < realSeg.length; ++kk){ if(!byRank[realSeg[kk]] || byRank[realSeg[kk]].length < 2){ okR = false; break; } }
                if(okR){
                    var c2b = [];
                    realSeg.forEach(function(r){ c2b = c2b.concat(byRank[r].slice(0, 2)); });
                    cands.push(c2b);
                }
            }
        }
    } else if(lp.type == 'triple_straight'){
        var tr = ranks.filter(function(r){ return byRank[r].length >= 3; });
        var m2 = lp.len / 3;
        for(var a = 0; a + m2 <= tr.length; ++a){
            var rr2 = tr.slice(a, a + m2);
            var c3 = [];
            rr2.forEach(function(r){ c3 = c3.concat(byRank[r].slice(0, 3)); });
            cands.push(c3);
        }
        if(conf.gp_straight_a2 && tr.indexOf(14) >= 0){
            var vtr = tr.map(virtRank).sort(function(a,b){return a-b;});
            for(var a2 = 0; a2 + m2 <= vtr.length; ++a2){
                var seg = vtr.slice(a2, a2 + m2);
                if(seg[0] != 1) continue;
                var realSeg = seg.map(function(v){ return v <= 2 ? v + 13 : v; });
                var okR = true;
                for(var kk = 0; kk < realSeg.length; ++kk){ if(!byRank[realSeg[kk]] || byRank[realSeg[kk]].length < 3){ okR = false; break; } }
                if(okR){
                    var c3b = [];
                    realSeg.forEach(function(r){ c3b = c3b.concat(byRank[r].slice(0, 3)); });
                    cands.push(c3b);
                }
            }
        }
    }
    // 炸弹候选(炸弹可压任意非炸弹)
    for(var i = 0; i < ranks.length; ++i){
        var r = ranks[i];
        if(byRank[r].length >= 3) cands.push(byRank[r].slice(0, 3));
        if(byRank[r].length >= 4) cands.push(byRank[r].slice(0, 4));
    }
    for(var k = 0; k < cands.length; ++k){
        var ok = tryCand(cands[k]);
        if(ok) return ok;
    }
    return null;
}

function sendChupai(game, seatIndex, pais, typeInfo){
    var s = game.gameSeats[seatIndex];
    // 从手牌移除
    for(var i = 0; i < pais.length; ++i){
        var idx = s.holds.indexOf(pais[i]);
        if(idx >= 0) s.holds.splice(idx, 1);
    }
    game.lastPlay = {
        seatIndex: seatIndex,
        type: typeInfo.type,
        key: typeInfo.key,
        len: typeInfo.len,
        bombLevel: typeInfo.bombLevel || 0,
        pais: pais.slice()
    };
    game.lastPlayer = seatIndex;
    game.passCount = 0;
    game.freePlay = false;
    s.playedAny = true;

    userMgr.brocastInRoom(game.roomId, 'gp_chupai_push', {
        seatIndex: seatIndex,
        type: typeInfo.type,
        key: typeInfo.key,
        len: typeInfo.len,
        bombLevel: typeInfo.bombLevel || 0,
        pais: pais.slice(),
        seats: getSeatsInfo(game)
    });

    // 出完牌 → 胜利
    if(s.holds.length == 0){
        s.finished = true;
        s.finishOrder = game.finishOrder++;
        // 检查是否只剩一人未出完
        var remain = [];
        for(var j = 0; j < game.gameSeats.length; ++j){
            if(!game.gameSeats[j].finished) remain.push(j);
        }
        if(remain.length <= 1){
            // 最后一人自动标记完成
            if(remain.length == 1){
                game.gameSeats[remain[0]].finished = true;
                game.gameSeats[remain[0]].finishOrder = game.finishOrder++;
            }
            setTimeout(function(){ doGameOver(game); }, 800);
            return;
        }
    }

    // 下一个玩家
    game.turn = nextSeat(game, seatIndex);
    if(game.turn == -1){
        setTimeout(function(){ doGameOver(game); }, 800);
        return;
    }
    setTimeout(function(){ notifyTurn(game); }, 600);
}

function doGameOver(game){
    if(game.gameOver) return;
    game.gameOver = true;
    if(game.turnTimer){ clearTimeout(game.turnTimer); game.turnTimer = null; }

    // 计算分数：基础分 = 剩余牌数，炸弹翻倍
    var baseScore = game.conf.baseScore || 1;
    var results = [];
    var winnerIdx = -1;
    for(var i = 0; i < game.gameSeats.length; ++i){
        if(game.gameSeats[i].finishOrder == 0){ winnerIdx = i; break; }
    }
    var bombMultiplier = 1;
    if(game.bombCount > 0) bombMultiplier = Math.pow(2, game.bombCount);

    // 先算各输家失分(全关翻倍),赢家得分=所有输家失分之和,保证零和
    var deltas = [];
    var winnerGain = 0;
    for(var i = 0; i < game.gameSeats.length; ++i){
        var s = game.gameSeats[i];
        if(i == winnerIdx){ deltas.push(0); continue; }
        var allClosed = !s.playedAny; // 一张未出=全关,失分翻倍
        var d = s.holds.length * baseScore * bombMultiplier * (allClosed ? 2 : 1);
        deltas.push(-d);
        winnerGain += d;
    }
    if(winnerIdx >= 0) deltas[winnerIdx] = winnerGain;

    for(var i = 0; i < game.gameSeats.length; ++i){
        var s = game.gameSeats[i];
        var score = deltas[i];
        s.score += score;
        results.push({
            userid: s.userId,
            name: s.name,
            seatindex: s.roomSeatIndex,
            isWinner: (i == winnerIdx),
            remain: s.holds.length,
            allClosed: (i != winnerIdx && !s.playedAny),
            delta: score,
            score: score,
            totalscore: s.score,
            holds: s.holds.slice().sort(function(a,b){ return a - b; }),
            finishOrder: s.finishOrder,
            remainCount: s.holds.length
        });
    }

    // 同步到房间座位,记录本局赢家供下一局先手
    var roomInfo = roomMgr.getRoom(game.roomId);
    if(roomInfo){
        if(winnerIdx >= 0){ roomInfo.gpLastWinner = game.gameSeats[winnerIdx].userId; }
        for(var i = 0; i < game.gameSeats.length; ++i){
            roomInfo.seats[game.gameSeats[i].roomSeatIndex].score = game.gameSeats[i].score;
        }
    }

    userMgr.brocastInRoom(game.roomId, 'game_over_push', {
        results: results,
        winner: winnerIdx,
        bombCount: game.bombCount || 0
    });

    // 房卡扣除：第一局结束一次性扣除整局房卡(中途解散不退)，所有在坐玩家均按后台设置的数量扣除
    if(roomInfo){
        var cost = roomInfo.conf.cost || 0;
        if(roomInfo.numOfGames === 1 && cost > 0){
            for(var ci = 0; ci < roomInfo.seats.length; ++ci){
                var cuid = roomInfo.seats[ci].userId;
                if(cuid > 0){
                    (function(uid){
                        db.cost_gems(uid, cost, function(success){
                            console.log("[关牌][房卡扣除] 玩家", uid, "扣除", cost, "结果:", success);
                        });
                    })(cuid);
                }
            }
        }
    }

    // 下一局或解散
    if(roomInfo && roomInfo.numOfGames >= roomInfo.conf.maxGames){
        // 整场结束
        var endinfo = [];
        for(var i = 0; i < roomInfo.seats.length; ++i){
            var rs = roomInfo.seats[i];
            if(rs.userId > 0){
                endinfo.push({userid: rs.userId, name: rs.name, score: rs.score});
            }
        }
        userMgr.brocastInRoom(game.roomId, 'game_end_push', {endinfo: endinfo});

        setTimeout(function(){
            userMgr.brocastInRoom(game.roomId, 'dispress_push', {});
            setTimeout(function(){
                userMgr.kickAllInRoom(game.roomId);
                roomMgr.destroy(game.roomId);
                delete games[game.roomId];
            }, 500);
        }, 5000);
    } else {
        // 下一局：清理 game 对象，等待准备
        delete games[game.roomId];
    }
}

// ============ 对外接口 ============

exports.start = function(roomInfo){
    var seatedPlayers = collectSeats(roomInfo);
    var minPlayers = (roomInfo.conf.type == "guanpai2") ? 2 : 3;
    if(seatedPlayers.length < minPlayers){
        console.log("[关牌] 人数不足，无法开局");
        return;
    }

    var game = {
        roomId: roomInfo.id,
        deck: buildDeck(),
        gameSeats: [],
        turn: 0,
        lastPlay: null,
        lastPlayer: -1,
        passCount: 0,
        freePlay: true,
        gameOver: false,
        finishOrder: 0,
        bombCount: 0,
        turnDeadline: 0,
        turnSeq: 0,
        turnTimer: null,
        conf: roomInfo.conf
    };

    shuffle(game.deck);

    for(var i = 0; i < seatedPlayers.length; ++i){
        var sp = seatedPlayers[i];
        game.gameSeats.push({
            userId: sp.userId,
            name: sp.name,
            seatIndex: i,
            roomSeatIndex: sp.roomSeatIndex,
            holds: [],
            finished: false,
            finishOrder: -1,
            playedAny: false,
            score: sp.score
        });
    }

    // 发牌：每人16张
    for(var r = 0; r < 16; ++r){
        for(var i = 0; i < game.gameSeats.length; ++i){
            game.gameSeats[i].holds.push(game.deck.pop());
        }
    }

    // 先手规则:
    // 第一局:持有最小黑桃者先出(黑3→黑4→...依次找),仅决定谁先出,首出可出任意牌
    // 第二局起:上一局赢家先出
    if(roomInfo.numOfGames <= 1){
        for(var r = 3; r <= 15; ++r){
            var sp = (r - 3) * 4 + 0;
            var holder = -1;
            for(var i = 0; i < game.gameSeats.length; ++i){
                if(game.gameSeats[i].holds.indexOf(sp) >= 0){ holder = i; break; }
            }
            if(holder >= 0){
                game.turn = holder;
                break;
            }
        }
    } else if(roomInfo.gpLastWinner != null){
        for(var i = 0; i < game.gameSeats.length; ++i){
            if(game.gameSeats[i].userId == roomInfo.gpLastWinner){ game.turn = i; break; }
        }
    }
    game.freePlay = true;

    games[roomInfo.id] = game;

    sendStart(game);
    setTimeout(function(){ notifyTurn(game); }, 600);
};

exports.chuPai = function(userId, pais){
    var game = getGameByUserID(userId);
    if(game == null || game.gameOver){ console.log("[关牌] chuPai拒绝: game=", game==null?"null":"gameOver", "userId=", userId, "roomId=", roomMgr.getUserRoom(userId)); return; }
    if(!pais || !(pais instanceof Array) || pais.length == 0){ console.log("[关牌] chuPai拒绝: pais非法", pais); return; }

    var seatIndex = -1;
    for(var i = 0; i < game.gameSeats.length; ++i){
        if(game.gameSeats[i].userId == userId){ seatIndex = i; break; }
    }
    if(seatIndex == -1 || seatIndex != game.turn){ console.log("[关牌] chuPai拒绝: seatIndex=", seatIndex, "turn=", game.turn, "userId=", userId); return; }
    if(game.gameSeats[seatIndex].finished){ console.log("[关牌] chuPai拒绝: 已完成 seatIndex=", seatIndex); return; }

    // 验证牌都在手牌里
    var s = game.gameSeats[seatIndex];
    var handCopy = s.holds.slice();
    for(var i = 0; i < pais.length; ++i){
        var idx = handCopy.indexOf(pais[i]);
        if(idx < 0){
            userMgr.sendMsg(userId, 'gp_error_push', {msg:"牌不在手中"});
            return;
        }
        handCopy.splice(idx, 1);
    }

    var isLastHand = (pais.length == s.holds.length);
    var typeInfo = identifyCards(pais, isLastHand, game.conf);
    if(typeInfo == null){
        userMgr.sendMsg(userId, 'gp_error_push', {msg:"非法牌型"});
        return;
    }

    // 非自由出牌：必须压过上家
    if(!game.freePlay && game.lastPlay != null){
        if(!canBeat(typeInfo, game.lastPlay)){
            userMgr.sendMsg(userId, 'gp_error_push', {msg:"压不过上家"});
            return;
        }
    }

    // 统计炸弹
    if(typeInfo.type == 'bomb'){
        game.bombCount = (game.bombCount || 0) + 1;
    }

    sendChupai(game, seatIndex, pais, typeInfo);
};

exports.guo = function(userId){
    var game = getGameByUserID(userId);
    if(game == null || game.gameOver) return;

    var seatIndex = -1;
    for(var i = 0; i < game.gameSeats.length; ++i){
        if(game.gameSeats[i].userId == userId){ seatIndex = i; break; }
    }
    if(seatIndex == -1 || seatIndex != game.turn) return;
    if(game.freePlay) return; // 自由出牌不能过

    game.passCount++;
    userMgr.brocastInRoom(game.roomId, 'gp_pass_push', {seatIndex: seatIndex});

    var remain = 0;
    for(var i = 0; i < game.gameSeats.length; ++i){
        if(!game.gameSeats[i].finished) remain++;
    }

    // 所有人都过了 → 最后出牌者自由出牌
    if(game.passCount >= remain - 1 || game.lastPlayer == nextSeat(game, seatIndex)){
        game.freePlay = true;
        game.lastPlay = null;
        game.turn = game.lastPlayer;
        if(game.turn == -1){
            setTimeout(function(){ doGameOver(game); }, 800);
            return;
        }
        var deadline = Date.now() + (game.conf.chupaiTimeout || 30) * 1000;
        game.turnDeadline = deadline;
        userMgr.brocastInRoom(game.roomId, 'gp_newround_push', {
            turn: game.turn,
            turnDeadline: deadline
        });
        scheduleAutoPlay(game);
    } else {
        game.turn = nextSeat(game, seatIndex);
        if(game.turn == -1){
            setTimeout(function(){ doGameOver(game); }, 800);
            return;
        }
        setTimeout(function(){ notifyTurn(game); }, 300);
    }
};

exports.setReady = function(userId){
    var roomId = roomMgr.getUserRoom(userId);
    if(roomId == null) return;
    var roomInfo = roomMgr.getRoom(roomId);
    if(roomInfo == null) return;
    var seatIndex = roomMgr.getUserSeat(userId);
    if(seatIndex == null) return;
    var s = roomInfo.seats[seatIndex];

    var game = games[roomId];
    if(game != null && !game.gameOver){
        // 对局中重连
        exports.resendGameState(roomId, userId);
        return;
    }

    if(s.ready) return;
    s.ready = true;

    var count = 0;
    var total = 0;
    for(var i = 0; i < roomInfo.seats.length; ++i){
        if(roomInfo.seats[i].userId > 0) total++;
        if(roomInfo.seats[i].ready) count++;
    }

    var minPlayers = (roomInfo.conf.type == "guanpai2") ? 2 : 3;
    if(count >= minPlayers && count >= total){
        setTimeout(function(){
            var room = roomMgr.getRoom(roomId);
            if(room != null){
                exports.begin(room);
            }
        }, 1000);
    }
};

exports.begin = function(roomInfo){
    roomInfo.numOfGames++;
    for(var i = 0; i < roomInfo.seats.length; ++i){
        roomInfo.seats[i].ready = false;
    }
    db.update_num_of_turns(roomInfo.id, roomInfo.numOfGames);

    var anySeat = null;
    for(var i = 0; i < roomInfo.seats.length; ++i){
        if(roomInfo.seats[i].userId > 0){ anySeat = roomInfo.seats[i]; break; }
    }
    if(anySeat == null) return;
    userMgr.broacastInRoom('game_num_push', roomInfo.numOfGames, anySeat.userId, true);
    userMgr.broacastInRoom('game_begin_push', roomInfo.nextButton, anySeat.userId, true);

    exports.start(roomInfo);
};

exports.isPlaying = function(roomId){
    return games[roomId] != null;
};

exports.hasBegan = function(roomId){
    var game = games[roomId];
    return game != null && game.gameOver != true;
};

exports.resendGameState = function(roomId, userId){
    var game = games[roomId];
    if(game == null || game.gameOver) return;
    for(var i = 0; i < game.gameSeats.length; ++i){
        if(game.gameSeats[i].userId == userId){
            var s = game.gameSeats[i];
            userMgr.sendMsg(userId, 'gp_resend_push', {
                maxPlayers: game.gameSeats.length,
                seats: getSeatsInfo(game),
                mySeat: i,
                myCards: s.holds.slice().sort(function(a,b){ return a - b; }),
                turn: game.turn,
                freePlay: game.freePlay,
                lastPlay: game.lastPlay,
                turnDeadline: game.turnDeadline,
                conf: game.conf
            });
            return;
        }
    }
};

// ============ 解散房间 ============
exports.dissolveRequest = function(roomId, userId){
    var roomInfo = roomMgr.getRoom(roomId);
    if(roomInfo == null) return null;
    if(roomInfo.dr != null) return {dr: roomInfo.dr};
    var states = [];
    for(var i = 0; i < roomInfo.seats.length; ++i){
        states.push(roomInfo.seats[i].userId == userId);
    }
    roomInfo.dr = { endTime: Date.now() + 300000, states: states };
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
    for(var i = 0; i < roomInfo.seats.length; ++i){
        var userId = roomInfo.seats[i].userId;
        if(userId > 0){
            userMgr.sendMsg(userId, 'dispress_push', {});
        }
    }
    roomInfo.dr = null;
    delete games[roomId];
    roomMgr.destroy(roomId);
};

// 麻将操作空实现
exports.chupai = function(){};
exports.peng = function(){};
exports.gang = function(){};
exports.hu = function(){};
exports.chi = function(){};
exports.bao = function(){};
exports.huanSanZhang = function(){};
exports.dingQue = function(){};
