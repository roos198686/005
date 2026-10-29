//录像录制:服务端全量录制房间内的对局推送,供玩家事后以"上帝视角"回放
//录制过程不向任何客户端额外推送数据,客户端只能在主动请求回放时拿到本局全量数据
var roomMgr = require('./roommgr');
var db = require('../utils/db');

//单局事件条数上限,防止异常房间无限增长
var MAX_EVENTS = 4000;

//不参与回放的噪音事件
var SKIP_EVENTS = {
    game_ping: 1,
    ping: 1,
    chat_push: 1,
    chat_msg_push: 1,
    game_num_push: 1,
    input_notice_push: 1
};

//roomId -> 录制中的一局
var rooms = {};

function roomType(roomInfo){
    return (roomInfo.conf && roomInfo.conf.type) ? roomInfo.conf.type : "";
}

//把某座位发到的真实手牌合并进上帝视角
function mergeSeat(rec, seat){
    if(seat == null || seat.userid == null){
        return;
    }
    var uid = seat.userid;
    if(rec.players[uid] == null){
        rec.players[uid] = {userid: uid, name: seat.name || "", seat: rec.seatCount++};
        rec.seatList.push(rec.players[uid]);
    }
    else if(seat.name){
        rec.players[uid].name = seat.name;
    }
    if(Array.isArray(seat.holds) && seat.holds.length > 0){
        rec.hands[uid] = seat.holds.slice();
    }
}

//game_start_push 每个座位各收一份,合并后即为四(二)家全明手牌
function mergeStart(rec, data){
    if(data == null){
        return;
    }
    if(data.seats != null){
        for(var i = 0; i < data.seats.length; ++i){
            mergeSeat(rec, data.seats[i]);
        }
    }
    if(rec.start == null){
        rec.start = {
            button: data.button,
            caishen: data.caishen,
            caishen2: data.caishen2,
            fanPai: data.fanPai,
            playStyle: data.playStyle,
            numofmj: data.numofmj,
            seatCount: data.seats ? data.seats.length : 0
        };
    }
}

function startRecord(roomId, data){
    var roomInfo = roomMgr.getRoom(roomId);
    if(roomInfo == null || !roomInfo.uuid){
        return;
    }
    var index = roomInfo.numOfGames || 0;
    var rec = rooms[roomId];
    //同一局重复收到的开局推送只做手牌合并,不重置已录事件
    if(rec == null || rec.index !== index){
        rec = {
            index: index,
            type: roomType(roomInfo),
            uuid: roomInfo.uuid,
            roomid: roomInfo.id,
            startTime: Date.now(),
            start: null,
            players: {},
            seatList: [],
            seatCount: 0,
            hands: {},
            finalHands: {},
            events: []
        };
        rooms[roomId] = rec;
    }
    mergeStart(rec, data);
}

function buildPayload(rec){
    var players = [];
    for(var i = 0; i < rec.seatList.length; ++i){
        var p = rec.seatList[i];
        players.push({userid: p.userid, name: p.name, seat: p.seat});
    }
    return {
        v: 2,
        uuid: rec.uuid,
        index: rec.index,
        type: rec.type,
        startTime: Math.ceil(rec.startTime / 1000),
        start: rec.start || {},
        players: players,
        hands: rec.hands,
        finalHands: rec.finalHands,
        events: rec.events
    };
}

function finishRecord(roomId, data){
    var rec = rooms[roomId];
    if(rec == null){
        return;
    }
    delete rooms[roomId];

    var roomInfo = roomMgr.getRoom(roomId);
    var userIds = [];
    if(roomInfo != null){
        for(var i = 0; i < roomInfo.seats.length; ++i){
            if(roomInfo.seats[i].userId > 0){
                userIds.push(roomInfo.seats[i].userId);
            }
        }
    }
    if(userIds.length == 0){
        return;
    }

    var payload = buildPayload(rec);
    var text = JSON.stringify(payload);
    //单引号转义,避免拼SQL时截断
    text = text.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
    db.save_replay(rec.uuid, rec.index, rec.type, rec.roomid, userIds.join(','), text, function(ok){
        if(!ok){
            console.log("[replay] 保存失败", rec.uuid, rec.index);
        }
    });
}

//推送统一入口(单发/房间广播),由 usermgr 调用
exports.onSend = function(roomId, userId, event, data){
    if(roomId == null || event == null || SKIP_EVENTS[event]){
        return;
    }
    if(event == 'game_start_push'){
        startRecord(roomId, data);
        return;
    }
    var rec = rooms[roomId];
    if(rec == null){
        return;
    }
    if(event == 'game_over_push'){
        //结算数据里带每家最终手牌,一并并入上帝视角
        if(data != null && data.results != null){
            for(var i = 0; i < data.results.length; ++i){
                var r = data.results[i];
                if(r != null && r.userid != null && Array.isArray(r.holds)){
                    rec.finalHands[r.userid] = r.holds.slice();
                }
            }
        }
        //结算事件本身也进时间轴,回放端据此同步最终手牌/副露并停在终局
        if(rec.events.length < MAX_EVENTS){
            rec.events.push({
                t: Date.now() - rec.startTime,
                e: event,
                u: 0,
                d: data
            });
        }
        finishRecord(roomId, data);
        return;
    }
    if(rec.events.length >= MAX_EVENTS){
        return;
    }
    rec.events.push({
        t: Date.now() - rec.startTime,
        e: event,
        u: userId || 0,
        d: data
    });
};

//房间销毁时丢弃未收尾的录制
exports.discard = function(roomId){
    delete rooms[roomId];
};
