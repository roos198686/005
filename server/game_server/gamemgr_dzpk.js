/**
 * 德州扑克 - 游戏管理器
 * 规则：
 * 1. 52张牌（0-51），id = suit*13 + rank，suit 0黑桃 1红桃 2梅花 3方块，rank 0=2 ... 12=A
 * 2. 2-9人同桌，每人2张底牌，5张公共牌
 * 3. 小盲/大盲，4轮下注：翻牌前/翻牌(3张)/转牌(1张)/河牌(1张)
 * 4. 操作：弃牌/过牌/跟注/加注/全下
 * 5. 底池分配支持边池（allin），平局平分
 * 6. 配置项（小盲、起始筹码、局数、人数、房卡）全部从 t_game_config 读取
 */
var roomMgr = require("./roommgr");
var userMgr = require("./usermgr");
var db = require("../utils/db");

var games = {};

var HAND_NAMES = ['高牌','一对','两对','三条','顺子','同花','葫芦','四条','同花顺'];

// ============ 牌力评估 ============
// 评估5张牌，返回 [类别, 比较值1..5]，数组逐位比较，大者胜
function evaluate5(cards){
    var ranks = [];
    var suits = [];
    for(var i = 0; i < 5; ++i){
        ranks.push(cards[i] % 13);
        suits.push(Math.floor(cards[i] / 13));
    }
    ranks.sort(function(a,b){ return b - a; });

    var flush = true;
    for(var i = 1; i < 5; ++i){
        if(suits[i] != suits[0]){ flush = false; break; }
    }

    // 顺子判断（含A-5轮子）
    var straightHigh = -1;
    var uniq = [];
    for(var i = 0; i < ranks.length; ++i){
        if(uniq.indexOf(ranks[i]) == -1) uniq.push(ranks[i]);
    }
    if(uniq.length == 5){
        if(uniq[0] - uniq[4] == 4){
            straightHigh = uniq[0];
        } else if(uniq[0] == 12 && uniq[1] == 3 && uniq[4] == 0){
            straightHigh = 3; // A,2,3,4,5 -> 以5为高牌
        }
    }

    // 同点数统计
    var cnt = {};
    for(var i = 0; i < 5; ++i){
        cnt[ranks[i]] = (cnt[ranks[i]] || 0) + 1;
    }
    var groups = []; // [点数, 数量]
    for(var r in cnt){
        groups.push([parseInt(r), cnt[r]]);
    }
    groups.sort(function(a,b){
        if(b[1] != a[1]) return b[1] - a[1];
        return b[0] - a[0];
    });

    if(straightHigh >= 0 && flush){
        return [8, straightHigh];
    }
    if(groups[0][1] == 4){
        return [7, groups[0][0], groups[1][0]];
    }
    if(groups[0][1] == 3 && groups[1][1] == 2){
        return [6, groups[0][0], groups[1][0]];
    }
    if(flush){
        return [5].concat(ranks);
    }
    if(straightHigh >= 0){
        return [4, straightHigh];
    }
    if(groups[0][1] == 3){
        var kickers = groups.slice(1).map(function(g){ return g[0]; }).sort(function(a,b){return b-a;});
        return [3, groups[0][0]].concat(kickers);
    }
    if(groups[0][1] == 2 && groups[1][1] == 2){
        var hp = Math.max(groups[0][0], groups[1][0]);
        var lp = Math.min(groups[0][0], groups[1][0]);
        return [2, hp, lp, groups[2][0]];
    }
    if(groups[0][1] == 2){
        var kickers2 = groups.slice(1).map(function(g){ return g[0]; }).sort(function(a,b){return b-a;});
        return [1, groups[0][0]].concat(kickers2);
    }
    return [0].concat(ranks);
}

// 7选5最优
function bestOf7(cards){
    var best = null;
    for(var a = 0; a < 3; ++a)
    for(var b = a+1; b < 4; ++b)
    for(var c = b+1; c < 5; ++c)
    for(var d = c+1; d < 6; ++d)
    for(var e = d+1; e < 7; ++e){
        var s = evaluate5([cards[a],cards[b],cards[c],cards[d],cards[e]]);
        if(best == null || compareScore(s, best) > 0){
            best = s;
        }
    }
    return best;
}

function compareScore(a, b){
    for(var i = 0; i < Math.max(a.length, b.length); ++i){
        var x = a[i] || 0, y = b[i] || 0;
        if(x != y) return x - y;
    }
    return 0;
}

// ============ 游戏辅助 ============
function shuffle(game){
    game.deck = [];
    for(var i = 0; i < 52; ++i) game.deck.push(i);
    for(var i = 0; i < 52; ++i){
        var idx = Math.floor(Math.random() * 52);
        var t = game.deck[i];
        game.deck[i] = game.deck[idx];
        game.deck[idx] = t;
    }
    game.deckIndex = 0;
}

function drawCard(game){
    return game.deck[game.deckIndex++];
}

function getGameByUserID(userId){
    var roomId = roomMgr.getUserRoom(userId);
    if(roomId == null) return null;
    return games[roomId];
}

function canAct(s){
    return !s.folded && !s.allin;
}

// 下一个可行动座位（不含from本身）
function nextToAct(game, from){
    var n = game.gameSeats.length;
    for(var k = 1; k <= n; ++k){
        var i = (from + k) % n;
        if(canAct(game.gameSeats[i])) return i;
    }
    return -1;
}

function totalPot(game){
    var sum = 0;
    for(var i = 0; i < game.gameSeats.length; ++i){
        sum += game.gameSeats[i].totalBet;
    }
    return sum;
}

// 本轮下注是否结束
function isRoundComplete(game){
    var remain = 0;
    for(var i = 0; i < game.gameSeats.length; ++i){
        var s = game.gameSeats[i];
        if(!s.folded) remain++;
        if(canAct(s)){
            if(!s.acted) return false;
            if(s.bet != game.currentBet) return false;
        }
    }
    if(remain <= 1) return true;
    return true;
}

// 从房间真实座位取游戏座位（userId>0）
function collectSeats(roomInfo){
    var arr = [];
    for(var i = 0; i < roomInfo.seats.length; ++i){
        var rs = roomInfo.seats[i];
        if(rs.userId > 0){
            arr.push({roomSeatIndex: i, userId: rs.userId, name: rs.name, score: rs.score || 0});
        }
    }
    return arr;
}

function notifyTurn(game){
    var s = game.gameSeats[game.turn];
    if(!s) return;
    var callAmount = Math.min(game.currentBet - s.bet, s.chips);
    var data = {
        si: s.seatIndex,
        callAmount: callAmount,
        currentBet: game.currentBet,
        minRaise: game.currentBet + game.minRaise,
        pot: totalPot(game),
        chips: s.chips,
        state: game.state
    };
    userMgr.brocastInRoom(game.roomId, 'dzpk_turn_push', data);
}

// 进入下一街
function advanceStreet(game){
    if(game.gameOver) return;

    // 未弃牌玩家只剩1人 → 直接胜利
    var remain = game.gameSeats.filter(function(s){ return !s.folded; });
    if(remain.length <= 1){
        doShowdown(game, true);
        return;
    }

    // 重置本轮下注
    for(var i = 0; i < game.gameSeats.length; ++i){
        var s = game.gameSeats[i];
        s.bet = 0;
        s.acted = false;
    }
    game.currentBet = 0;
    game.minRaise = game.bigBlind;

    if(game.state == 'preflop'){
        game.state = 'flop';
        game.community.push(drawCard(game), drawCard(game), drawCard(game));
    } else if(game.state == 'flop'){
        game.state = 'turn';
        game.community.push(drawCard(game));
    } else if(game.state == 'turn'){
        game.state = 'river';
        game.community.push(drawCard(game));
    } else {
        doShowdown(game, false);
        return;
    }

    userMgr.brocastInRoom(game.roomId, 'dzpk_street_push', {
        state: game.state,
        community: game.community.slice(),
        pot: totalPot(game)
    });

    // 可行动玩家不足2人（其余全allin）→ 自动推进
    var actors = game.gameSeats.filter(function(s){ return canAct(s); });
    if(actors.length == 0){
        setTimeout(function(){ advanceStreet(game); }, 1200);
        return;
    }

    game.turn = nextToAct(game, game.button);
    if(game.turn == -1){
        setTimeout(function(){ advanceStreet(game); }, 1200);
        return;
    }
    setTimeout(function(){ notifyTurn(game); }, 600);
}

// 摊牌结算（winByFold=true 表示其他人全弃牌，不亮牌）
function doShowdown(game, winByFold){
    if(game.gameOver) return;
    game.gameOver = true;
    game.state = 'over';

    var active = game.gameSeats.filter(function(s){ return !s.folded; });
    var results = [];

    if(winByFold && active.length == 1){
        var winner = active[0];
        var pot = totalPot(game);
        winner.chips += pot;
        for(var i = 0; i < game.gameSeats.length; ++i){
            var s = game.gameSeats[i];
            results.push({
                si: s.seatIndex,
                userid: s.userId,
                holds: (s == winner) ? s.holds.slice() : [],
                folded: s.folded,
                win: (s == winner) ? pot : 0,
                handName: '',
                chips: s.chips
            });
        }
    } else {
        // 评估每个未弃牌玩家
        var evalMap = {};
        for(var i = 0; i < active.length; ++i){
            var s = active[i];
            var cards7 = s.holds.concat(game.community);
            evalMap[s.seatIndex] = bestOf7(cards7);
        }

        // 边池计算
        var contribs = game.gameSeats.map(function(s){
            return {si: s.seatIndex, amount: s.totalBet, folded: s.folded};
        });
        var pots = [];
        while(true){
            var contributors = contribs.filter(function(c){ return c.amount > 0; });
            if(contributors.length == 0) break;
            var min = contributors[0].amount;
            for(var i = 0; i < contributors.length; ++i){
                if(contributors[i].amount < min) min = contributors[i].amount;
            }
            var potAmount = min * contributors.length;
            var eligible = contributors.filter(function(c){ return !c.folded; }).map(function(c){ return c.si; });
            for(var i = 0; i < contributors.length; ++i){
                contributors[i].amount -= min;
            }
            // 与上一个池的优胜者集合相同则合并
            if(pots.length > 0){
                var last = pots[pots.length - 1];
                var sameSet = last.eligible.length == eligible.length && last.eligible.every(function(e){ return eligible.indexOf(e) != -1; });
                if(sameSet){
                    last.amount += potAmount;
                    continue;
                }
            }
            pots.push({amount: potAmount, eligible: eligible});
        }

        // 每个池分给最优者（平分）
        var winMap = {};
        for(var p = 0; p < pots.length; ++p){
            var pot = pots[p];
            var bestSi = [];
            var bestScore = null;
            for(var i = 0; i < pot.eligible.length; ++i){
                var si = pot.eligible[i];
                var sc = evalMap[si];
                if(sc == null) continue;
                if(bestScore == null || compareScore(sc, bestScore) > 0){
                    bestScore = sc;
                    bestSi = [si];
                } else if(compareScore(sc, bestScore) == 0){
                    bestSi.push(si);
                }
            }
            if(bestSi.length > 0){
                var share = Math.floor(pot.amount / bestSi.length);
                var remainder = pot.amount - share * bestSi.length;
                for(var i = 0; i < bestSi.length; ++i){
                    winMap[bestSi[i]] = (winMap[bestSi[i]] || 0) + share + (i == 0 ? remainder : 0);
                }
            }
        }

        for(var i = 0; i < game.gameSeats.length; ++i){
            var s = game.gameSeats[i];
            var win = winMap[s.seatIndex] || 0;
            s.chips += win;
            var sc = evalMap[s.seatIndex];
            results.push({
                si: s.seatIndex,
                userid: s.userId,
                holds: s.folded ? [] : s.holds.slice(),
                folded: s.folded,
                win: win,
                handName: sc ? HAND_NAMES[sc[0]] : '',
                chips: s.chips
            });
        }
    }

    // 累计分数 = 本手筹码变化
    for(var i = 0; i < game.gameSeats.length; ++i){
        var s = game.gameSeats[i];
        s.score += (s.chips - game.startChips);
    }

    userMgr.brocastInRoom(game.roomId, 'dzpk_over_push', {
        results: results,
        community: game.community.slice(),
        winByFold: winByFold == true
    });

    setTimeout(function(){ doGameOver(game); }, 1500);
}

// 房间级结算：同步分数、扣房卡、写战绩、判断是否解散
function doGameOver(game){
    var roomId = game.roomId;
    var roomInfo = roomMgr.getRoom(roomId);
    if(roomInfo == null) return;

    // 同步累计分到房间座位
    for(var i = 0; i < game.gameSeats.length; ++i){
        var gs = game.gameSeats[i];
        roomInfo.seats[gs.roomSeatIndex].score = gs.score;
    }

    // 房卡扣除：第一局结束一次性扣除整局房卡(中途解散不退)，所有在坐玩家均按后台设置的数量扣除
    var cost = roomInfo.conf.cost || 0;
    if(roomInfo.numOfGames === 1 && cost > 0){
        for(var ci = 0; ci < roomInfo.seats.length; ++ci){
            var cuid = roomInfo.seats[ci].userId;
            if(cuid > 0){
                (function(uid){
                    db.cost_gems(uid, cost, function(success){
                        console.log("[德州][房卡扣除] 玩家", uid, "扣除", cost, "结果:", success);
                    });
                })(cuid);
            }
        }
    }

    // 战绩入库
    var index = roomInfo.numOfGames;
    var baseInfo = JSON.stringify({button: game.button});
    var dbResults = [];
    for(var i = 0; i < game.gameSeats.length; ++i){
        var gs = game.gameSeats[i];
        dbResults.push({userid: gs.userId, totalscore: gs.score});
    }
    db.create_game(roomInfo.uuid, index, baseInfo, function(){
        db.update_game_result(roomInfo.uuid, index, JSON.stringify(dbResults), function(){});
    });

    // 局数耗尽 → 解散房间
    if(roomInfo.numOfGames >= roomInfo.conf.maxGames){
        var historyItem = {
            id: roomInfo.id,
            uuid: roomInfo.uuid,
            time: Math.ceil(Date.now()/1000),
            seats: []
        };
        for(var i = 0; i < roomInfo.seats.length; ++i){
            if(roomInfo.seats[i].userId > 0){
                historyItem.seats.push({
                    name: roomInfo.seats[i].name,
                    score: roomInfo.seats[i].score
                });
            }
        }
        for(var i = 0; i < roomInfo.seats.length; ++i){
            (function(seatIdx){
                var uid = roomInfo.seats[seatIdx].userId;
                if(uid <= 0) return;
                db.get_user_history(uid, function(oldHistory){
                    var history = oldHistory || [];
                    history.unshift(historyItem);
                    if(history.length > 20) history = history.slice(0, 20);
                    db.update_user_history(uid, history, function(){});
                });
            })(i);
        }

        // 通知最终结算
        var endinfo = [];
        for(var i = 0; i < roomInfo.seats.length; ++i){
            var rs = roomInfo.seats[i];
            if(rs.userId > 0){
                endinfo.push({userid: rs.userId, name: rs.name, score: rs.score});
            }
        }
        userMgr.brocastInRoom(roomId, 'dzpk_end_push', {endinfo: endinfo});

        setTimeout(function(){
            userMgr.brocastInRoom(roomId, 'dispress_push', {});
            setTimeout(function(){
                userMgr.kickAllInRoom(roomId);
                roomMgr.destroy(roomId);
            }, 500);
        }, 5000);
    } else {
        // 下一手：轮庄，6秒后自动开始
        roomInfo.nextButton = (roomInfo.nextButton + 1) % Math.max(1, roomInfo.seats.filter(function(s){return s.userId>0;}).length);
        setTimeout(function(){
            var room = roomMgr.getRoom(roomId);
            if(room != null){
                exports.begin(room);
            }
        }, 6000);
    }
}

// ============ 对外接口 ============

exports.start = function(roomInfo){
    var seatedPlayers = collectSeats(roomInfo);
    if(seatedPlayers.length < 2){
        console.log("[德州] 人数不足，无法开局");
        return;
    }

    var startChips = roomInfo.conf.chips || 1000;
    var game = {
        roomId: roomInfo.id,
        deck: [],
        deckIndex: 0,
        community: [],
        button: 0, // 游戏内座位索引（gameSeats下标）
        turn: -1,
        state: 'preflop',
        smallBlind: roomInfo.conf.smallBlind || 10,
        bigBlind: (roomInfo.conf.smallBlind || 10) * 2,
        startChips: startChips,
        currentBet: 0,
        minRaise: (roomInfo.conf.smallBlind || 10) * 2,
        gameSeats: [],
        gameOver: false,
        conf: roomInfo.conf
    };

    for(var i = 0; i < seatedPlayers.length; ++i){
        var sp = seatedPlayers[i];
        game.gameSeats.push({
            userId: sp.userId,
            name: sp.name,
            seatIndex: i,          // 游戏内座位索引
            roomSeatIndex: sp.roomSeatIndex,
            holds: [],
            chips: startChips,
            bet: 0,
            totalBet: 0,
            folded: false,
            allin: false,
            acted: false,
            score: sp.score,
            startScore: sp.score
        });
    }

    // 庄家：roomInfo.nextButton 是"在场玩家序数"，映射到 gameSeats
    game.button = roomInfo.nextButton % game.gameSeats.length;

    shuffle(game);

    // 发底牌
    for(var r = 0; r < 2; ++r){
        for(var i = 0; i < game.gameSeats.length; ++i){
            var idx = (game.button + 1 + i) % game.gameSeats.length;
            game.gameSeats[idx].holds.push(drawCard(game));
        }
    }

    games[roomInfo.id] = game;

    // 盲注
    var n = game.gameSeats.length;
    var sbSeat, bbSeat;
    if(n == 2){
        sbSeat = game.button; // 单挑：庄家=小盲
        bbSeat = nextToAct(game, game.button);
    } else {
        sbSeat = nextToAct(game, game.button);
        bbSeat = nextToAct(game, sbSeat);
    }

    function postBlind(seat, amount){
        var actual = Math.min(amount, seat.chips);
        seat.chips -= actual;
        seat.bet += actual;
        seat.totalBet += actual;
        if(seat.chips == 0) seat.allin = true;
    }
    postBlind(game.gameSeats[sbSeat], game.smallBlind);
    postBlind(game.gameSeats[bbSeat], game.bigBlind);
    game.currentBet = game.bigBlind;
    game.minRaise = game.bigBlind;
    game.sbSeat = sbSeat;
    game.bbSeat = bbSeat;

    // 逐个玩家推送开局数据（各自只见自己的底牌）
    for(var i = 0; i < game.gameSeats.length; ++i){
        var sd = game.gameSeats[i];
        var seatsInfo = [];
        for(var j = 0; j < game.gameSeats.length; ++j){
            var gs = game.gameSeats[j];
            seatsInfo.push({
                userid: gs.userId,
                name: gs.name,
                seatindex: gs.seatIndex,
                roomSeatIndex: gs.roomSeatIndex,
                chips: gs.chips,
                bet: gs.bet,
                folded: gs.folded,
                allin: gs.allin
            });
        }
        userMgr.sendMsg(sd.userId, 'dzpk_start_push', {
            button: game.button,
            sbSeat: sbSeat,
            bbSeat: bbSeat,
            smallBlind: game.smallBlind,
            bigBlind: game.bigBlind,
            startChips: game.startChips,
            state: game.state,
            currentBet: game.currentBet,
            community: [],
            myHolds: sd.holds.slice(),
            seats: seatsInfo
        });
    }

    // 翻牌前：单挑时小盲（庄家）先行动；多人时大盲下家先行动
    if(n == 2){
        game.turn = sbSeat;
    } else {
        game.turn = nextToAct(game, bbSeat);
    }
    setTimeout(function(){ notifyTurn(game); }, 600);
};

// 下注操作
exports.bet = function(userId, action, amount){
    var game = getGameByUserID(userId);
    if(game == null || game.gameOver) return;
    var roomId = game.roomId;
    var seatIndex = null;
    for(var i = 0; i < game.gameSeats.length; ++i){
        if(game.gameSeats[i].userId == userId){ seatIndex = i; break; }
    }
    if(seatIndex == null) return;
    if(seatIndex != game.turn) return;

    var s = game.gameSeats[seatIndex];
    if(!canAct(s)) return;

    var moved = 0; // 本动作实际投入筹码
    var valid = true;

    if(action == 'fold'){
        s.folded = true;
        s.acted = true;
    } else if(action == 'check'){
        if(s.bet != game.currentBet){
            valid = false;
        } else {
            s.acted = true;
        }
    } else if(action == 'call'){
        var need = Math.min(game.currentBet - s.bet, s.chips);
        if(need <= 0){
            // 无需跟注等同于过牌
            s.acted = true;
        } else {
            s.chips -= need;
            s.bet += need;
            s.totalBet += need;
            moved = need;
            if(s.chips == 0) s.allin = true;
            s.acted = true;
        }
    } else if(action == 'raise'){
        // amount = 本轮目标总下注额
        var raiseTo = parseInt(amount) || 0;
        var maxTo = s.bet + s.chips;
        if(raiseTo > maxTo) raiseTo = maxTo;
        var minTo = game.currentBet + game.minRaise;
        if(raiseTo < minTo && raiseTo < maxTo){
            valid = false; // 加注额不足且非全下
        } else {
            var put = raiseTo - s.bet;
            s.chips -= put;
            s.bet = raiseTo;
            s.totalBet += put;
            moved = put;
            if(s.chips == 0) s.allin = true;
            if(raiseTo > game.currentBet){
                var raiseSize = raiseTo - game.currentBet;
                if(raiseSize >= game.minRaise){
                    game.minRaise = raiseSize;
                }
                game.currentBet = raiseTo;
                // 加注后其他未弃牌未allin玩家需重新行动
                for(var i = 0; i < game.gameSeats.length; ++i){
                    var os = game.gameSeats[i];
                    if(os != s && canAct(os)){
                        os.acted = false;
                    }
                }
            }
            s.acted = true;
        }
    } else if(action == 'allin'){
        var put2 = s.chips;
        var raiseTo2 = s.bet + put2;
        s.chips = 0;
        s.bet = raiseTo2;
        s.totalBet += put2;
        moved = put2;
        s.allin = true;
        if(raiseTo2 > game.currentBet){
            var raiseSize2 = raiseTo2 - game.currentBet;
            if(raiseSize2 >= game.minRaise){
                game.minRaise = raiseSize2;
            }
            game.currentBet = raiseTo2;
            for(var i = 0; i < game.gameSeats.length; ++i){
                var os2 = game.gameSeats[i];
                if(os2 != s && canAct(os2)){
                    os2.acted = false;
                }
            }
        }
        s.acted = true;
    } else {
        valid = false;
    }

    if(!valid){
        console.log("[德州] 无效操作", userId, action, amount, "currentBet=", game.currentBet, "seatBet=", s.bet);
        notifyTurn(game); // 重新推送行动请求
        return;
    }

    console.log("[德州] 玩家", userId, "操作", action, moved > 0 ? moved : "", "bet=", s.bet, "chips=", s.chips);

    userMgr.brocastInRoom(roomId, 'dzpk_action_notify_push', {
        si: seatIndex,
        action: action,
        amount: moved,
        bet: s.bet,
        chips: s.chips,
        folded: s.folded,
        allin: s.allin,
        currentBet: game.currentBet,
        pot: totalPot(game)
    });

    // 只剩一人未弃牌 → 直接赢
    var remain = game.gameSeats.filter(function(x){ return !x.folded; });
    if(remain.length == 1){
        setTimeout(function(){ doShowdown(game, true); }, 800);
        return;
    }

    // 本轮结束？
    var complete = true;
    for(var i = 0; i < game.gameSeats.length; ++i){
        var os3 = game.gameSeats[i];
        if(canAct(os3)){
            if(!os3.acted || os3.bet != game.currentBet){
                complete = false;
                break;
            }
        }
    }

    if(complete){
        setTimeout(function(){ advanceStreet(game); }, 800);
    } else {
        game.turn = nextToAct(game, game.turn);
        if(game.turn == -1){
            setTimeout(function(){ advanceStreet(game); }, 800);
        } else {
            notifyTurn(game);
        }
    }
};

exports.isPlaying = function(roomId){
    return games[roomId] != null;
};

exports.hasBegan = function(roomId){
    //结算停留期(game对象保留且gameOver=true)不算对局中:否则结算期间退出/解散被误拒
    var game = games[roomId];
    return game != null && game.gameOver != true;
};

// 断线重连/中途进房补发当前牌局(复用 sendSync,含底牌/公共牌/当前行动者)
exports.resendGameState = function(roomId, userId){
    var game = games[roomId];
    if(game == null || game.gameOver) return;
    for(var i = 0; i < game.gameSeats.length; ++i){
        if(game.gameSeats[i].userId == userId){
            sendSync(game, i);
            return;
        }
    }
};

// 玩家准备；满员后自动开局；对局中重连则同步状态
exports.setReady = function(userId){
    var roomId = roomMgr.getUserRoom(userId);
    if(roomId == null) return;
    var roomInfo = roomMgr.getRoom(roomId);
    if(roomInfo == null) return;
    var seatIndex = roomMgr.getUserSeat(userId);
    if(seatIndex == null) return;
    var s = roomInfo.seats[seatIndex];

    // 对局进行中重连：同步当前状态
    var game = games[roomId];
    if(game != null && !game.gameOver){
        for(var i = 0; i < game.gameSeats.length; ++i){
            if(game.gameSeats[i].userId == userId){
                sendSync(game, i);
                return;
            }
        }
        return; // 对局中新入座，旁观等下一手
    }

    if(s.ready) return;
    s.ready = true;

    var count = 0;
    for(var i = 0; i < roomInfo.seats.length; ++i){
        if(roomInfo.seats[i].ready) count++;
    }

    // 德州扑克：2人即可开局（heads-up）
    if(count >= 2){
        setTimeout(function(){
            var room = roomMgr.getRoom(roomId);
            if(room != null){
                exports.begin(room);
            }
        }, 1000);
    }
};

// 断线重连同步
function sendSync(game, gameSeatIndex){
    var sd = game.gameSeats[gameSeatIndex];
    var seatsInfo = [];
    for(var j = 0; j < game.gameSeats.length; ++j){
        var gs = game.gameSeats[j];
        seatsInfo.push({
            userid: gs.userId,
            name: gs.name,
            seatindex: gs.seatIndex,
            roomSeatIndex: gs.roomSeatIndex,
            chips: gs.chips,
            bet: gs.bet,
            folded: gs.folded,
            allin: gs.allin
        });
    }
    userMgr.sendMsg(sd.userId, 'dzpk_start_push', {
        button: game.button,
        sbSeat: game.sbSeat,
        bbSeat: game.bbSeat,
        smallBlind: game.smallBlind,
        bigBlind: game.bigBlind,
        startChips: game.startChips,
        state: game.state,
        currentBet: game.currentBet,
        community: game.community.slice(),
        myHolds: sd.folded ? [] : sd.holds.slice(),
        seats: seatsInfo,
        sync: true
    });
    if(game.turn == gameSeatIndex){
        setTimeout(function(){ notifyTurn(game); }, 800);
    } else if(game.turn >= 0){
        userMgr.sendMsg(sd.userId, 'dzpk_turn_push', {
            si: game.turn,
            callAmount: 0,
            currentBet: game.currentBet,
            minRaise: game.currentBet + game.minRaise,
            pot: totalPot(game),
            chips: 0,
            state: game.state
        });
    }
}

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

// ============ 解散房间 ============
exports.dissolveRequest = function(roomId, userId){
    var roomInfo = roomMgr.getRoom(roomId);
    if(roomInfo == null) return null;
    if(roomInfo.dr != null) return {dr: roomInfo.dr};
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
    roomMgr.destroy(roomId);
};

// 麻将操作：德州玩法不使用，提供空实现防止崩溃
exports.chupai = function(){};
exports.peng = function(){};
exports.gang = function(){};
exports.hu = function(){};
exports.guo = function(){};
exports.chi = function(){};
exports.bao = function(){};
exports.huanSanZhang = function(){};
exports.dingQue = function(){};
