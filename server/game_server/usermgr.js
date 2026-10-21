var roomMgr = require('./roommgr');
var userList = {};
var userOnline = 0;
//玩家最后真实操作时间(心跳game_ping不计入)与断线开始时间,供房间无动作/断线自动解散扫描使用
var lastActivity = {};
var offlineSince = {};

exports.bind = function(userId,socket){
    userList[userId] = socket;
    userOnline++;
    exports.touchActivity(userId);
};

exports.del = function(userId,socket){
    delete userList[userId];
    userOnline--;
    //记录断线开始时间
    if(offlineSince[userId] == null){
        offlineSince[userId] = Date.now();
    }
};

//刷新玩家活跃时间(任意真实操作消息触发,心跳除外)
exports.touchActivity = function(userId){
    if(userId == null){
        return;
    }
    lastActivity[userId] = Date.now();
    delete offlineSince[userId];
};

exports.getLastActivity = function(userId){
    return lastActivity[userId] || 0;
};

exports.getOfflineSince = function(userId){
    return offlineSince[userId] || 0;
};

exports.get = function(userId){
    return userList[userId];
};

exports.isOnline = function(userId){
    var data = userList[userId];
    if(data != null){
        return true;
    }
    return false;
};

exports.getOnlineCount = function(){
    return userOnline;
}

exports.sendMsg = function(userId,event,msgdata){
    console.log(event);
    var userInfo = userList[userId];
    if(userInfo == null){
        return;
    }
    var socket = userInfo;
    if(socket == null){
        return;
    }

    socket.emit(event,msgdata);
};

exports.kickAllInRoom = function(roomId){
    if(roomId == null){
        return;
    }
    var roomInfo = roomMgr.getRoom(roomId);
    if(roomInfo == null){
        return;
    }

    for(var i = 0; i < roomInfo.seats.length; ++i){
        var rs = roomInfo.seats[i];

        //如果不需要发给发送方，则跳过
        if(rs.userId > 0){
            var socket = userList[rs.userId];
            if(socket != null){
                exports.del(rs.userId);
                socket.disconnect();
            }
        }
    }
};

//按房间号广播给房间内所有玩家(含发送方)
exports.brocastInRoom = function(roomId,event,data){
    if(roomId == null){
        return;
    }
    var roomInfo = roomMgr.getRoom(roomId);
    if(roomInfo == null){
        return;
    }
    for(var i = 0; i < roomInfo.seats.length; ++i){
        var rs = roomInfo.seats[i];
        var socket = userList[rs.userId];
        if(socket != null){
            socket.emit(event,data);
        }
    }
};

exports.broacastInRoom = function(event,data,sender,includingSender){
    var roomId = roomMgr.getUserRoom(sender);
    if(roomId == null){
        return;
    }
    var roomInfo = roomMgr.getRoom(roomId);
    if(roomInfo == null){
        return;
    }

    for(var i = 0; i < roomInfo.seats.length; ++i){
        var rs = roomInfo.seats[i];

        //如果不需要发给发送方，则跳过
        if(rs.userId == sender && includingSender != true){
            continue;
        }
        var socket = userList[rs.userId];
        if(socket != null){
            socket.emit(event,data);
        }
    }
};