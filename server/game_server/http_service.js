var crypto = require('../utils/crypto');
var express = require('express');
var db = require('../utils/db');
var http = require('../utils/http');
var roomMgr = require("./roommgr");
var userMgr = require("./usermgr");
var tokenMgr = require("./tokenmgr");

var app = express();
var config = null;

var serverIp = "";

//测试
app.all('*', function(req, res, next) {
	res.header("Access-Control-Allow-Origin", "*");
	res.header("Access-Control-Allow-Headers", "X-Requested-With");
	res.header("Access-Control-Allow-Methods","PUT,POST,GET,DELETE,OPTIONS");
	res.header("X-Powered-By",' 3.2.1');
	res.header("Content-Type", "application/json;charset=utf-8");
	next();
});

app.get('/get_server_info',function(req,res){
	var serverId = req.query.serverid;
	var sign = req.query.sign;
	console.log(serverId);
	console.log(sign);
	if(serverId  != config.SERVER_ID || sign == null){
		http.send(res,1,"invalid parameters");
		return;
	}

	var md5 = crypto.md5(serverId + config.ROOM_PRI_KEY);
	if(md5 != sign){
		http.send(res,1,"sign check failed.");
		return;
	}

	var locations = roomMgr.getUserLocations();
	var arr = [];
	for(var userId in locations){
		var roomId = locations[userId].roomId;
		arr.push(userId);
		arr.push(roomId);
	}
	http.send(res,0,"ok",{userroominfo:arr});
});

app.get('/create_room',function(req,res){
	var userId = parseInt(req.query.userid);
	var sign = req.query.sign;
	var gems = req.query.gems;
	var conf = req.query.conf
	if(userId == null || sign == null || conf == null){
		http.send(res,1,"invalid parameters");
		return;
	}

	var md5 = crypto.md5(userId + conf + gems + config.ROOM_PRI_KEY);
	if(md5 != req.query.sign){
		console.log("invalid reuqest.");
		http.send(res,1,"sign check failed.");
		return;
	}

	conf = JSON.parse(conf);
	roomMgr.createRoom(userId,conf,gems,serverIp,config.CLIENT_PORT,function(errcode,roomId){
		if(errcode != 0 || roomId == null){
			http.send(res,errcode,"create failed.");
			return;	
		}
		else{
			http.send(res,0,"ok",{roomid:roomId});			
		}
	});
});

app.get('/enter_room',function(req,res){
	var userId = parseInt(req.query.userid);
	var name = req.query.name;
	var roomId = req.query.roomid;
	var sign = req.query.sign;
	if(userId == null || roomId == null || sign == null){
		http.send(res,1,"invalid parameters");
		return;
	}

	var md5 = crypto.md5(userId + name + roomId + config.ROOM_PRI_KEY);
	console.log(req.query);
	console.log(md5);
	if(md5 != sign){
		http.send(res,2,"sign check failed.");
		return;
	}

	//单房间规则:一个玩家同时只能在一个房间。
	//用户已在A房时进入B房:无论A房是否已准备/已开局/结算停留,一律放行,
	//并在进入B房的同时释放A房的占用(否则退出后占用残留会导致之后所有房间都进不去)。
	var curRoomId = roomMgr.getUserRoom(userId);
	if(curRoomId != null && curRoomId != roomId){
		var curRoom = roomMgr.getRoom(curRoomId);
		var oldState = '未知';
		if(curRoom != null){
			var seatIdx = roomMgr.getUserSeat(userId);
			var seatReady = (seatIdx != null && curRoom.seats && curRoom.seats[seatIdx] != null && curRoom.seats[seatIdx].ready == true);
			var began = false;
			try{ began = curRoom.gameMgr && curRoom.gameMgr.hasBegan(curRoomId); }catch(e){}
			oldState = 'ready=' + seatReady + ',began=' + began + ',games=' + curRoom.numOfGames;
		}
		//迁移:释放原房间占用(清座位/绑定,空房销毁并解绑牌桌,广播俱乐部牌桌人数)
		console.log('[enter_room migrate] userId=' + userId + ' 从房间' + curRoomId + '(' + oldState + ') 迁移到 ' + roomId);
		roomMgr.exitRoom(userId);
		var leftRoom = roomMgr.getRoom(curRoomId);
		if(leftRoom != null){
			roomMgr.destroyIfEmpty(curRoomId);
			leftRoom = roomMgr.getRoom(curRoomId);
		}
		try{
			var ss = require('./socket_service');
			if(leftRoom == null){
				var snap = JSON.parse(JSON.stringify(curRoom));
				snap.seats = [];
				ss.broadcastClubUpdatePublic(curRoomId, snap);
			}
			else{
				ss.broadcastClubUpdatePublic(curRoomId, leftRoom);
			}
		}catch(e){
			console.log('[enter_room migrate broadcast error]', e && e.message);
		}
	}

	//安排玩家坐下
	roomMgr.enterRoom(roomId,userId,name,function(ret){
		if(ret != 0){
			if(ret == 1){
				http.send(res,4,"room is full.");
			}
			else if(ret == 2){
				http.send(res,3,"can't find room.");
			}	
			return;		
		}

		var token = tokenMgr.createToken(userId,5000);
		http.send(res,0,"ok",{token:token});
	});
});

//大厅服探活接口,供 /is_server_online 判定本游戏服是否在线
app.get('/ping',function(req,res){
	var sign = req.query.sign;
	if(sign != crypto.md5(config.ROOM_PRI_KEY)){
		http.send(res,2,"sign check failed");
		return;
	}
	http.send(res,0,"ok");
});

app.get('/is_room_runing',function(req,res){
	var roomId = req.query.roomid;
	var sign = req.query.sign;
	if(roomId == null || sign == null){
		http.send(res,1,"invalid parameters");
		return;
	}

	var md5 = crypto.md5(roomId + config.ROOM_PRI_KEY);
	if(md5 != sign){
		http.send(res,2,"sign check failed.");
		return;
	}
	
	//var roomInfo = roomMgr.getRoom(roomId);
	http.send(res,0,"ok",{runing:true});
});

//清空牌桌(管理后台/俱乐部后台用):强制踢出在线玩家、清座位与占位、销毁房间并广播牌桌清空。
//清空后所有玩家的房间占用彻底释放,可自由进入其它房间
app.get('/clear_room',function(req,res){
	var roomId = req.query.roomid;
	var sign = req.query.sign;
	if(roomId == null || sign == null){
		http.send(res,1,"invalid parameters");
		return;
	}

	var md5 = crypto.md5(roomId + config.ROOM_PRI_KEY);
	if(md5 != sign){
		http.send(res,2,"sign check failed.");
		return;
	}

	var roomInfo = roomMgr.getRoom(roomId);
	if(roomInfo == null){
		http.send(res,3,"room not found.");
		return;
	}

	//先通知在线玩家解散(客户端收dispress_push清状态并返回上一页),再踢断连接
	var userMgr = require('./usermgr');
	for(var i = 0; i < roomInfo.seats.length; ++i){
		var uid = roomInfo.seats[i].userId;
		if(uid > 0 && userMgr.isOnline(uid)){
			userMgr.sendMsg(uid, 'dispress_push', {});
		}
	}
	userMgr.kickAllInRoom(roomId);
	roomMgr.destroy(roomId);

	//俱乐部牌桌:广播座位清空快照,牌桌列表立即显示无人
	var snap = JSON.parse(JSON.stringify(roomInfo));
	snap.seats = [];
	try{ require('./socket_service').broadcastClubUpdatePublic(roomId, snap); }catch(e){}

	console.log('[clear_room] room=' + roomId + ' cleared by admin');
	http.send(res,0,"ok");
});

var gameServerInfo = null;
var lastTickTime = 0;

//向大厅服定时心跳
function update(){
	if(lastTickTime + config.HTTP_TICK_TIME < Date.now()){
		lastTickTime = Date.now();
		gameServerInfo.load = roomMgr.getTotalRooms();
		http.get(config.HALL_IP,config.HALL_PORT,"/register_gs",gameServerInfo,function(ret,data){
				if(ret == true){
					if(data.errcode != 0){
						console.log(data.errmsg);
					}

					//对外地址固定用配置CLIENT_IP:大厅回的data.ip是心跳来源地址(req.ip),
					//同机部署时为127.0.0.1,客户端拿到会连回自身导致进房黑屏
					serverIp = config.CLIENT_IP;
				}
			else{
				//
				lastTickTime = 0;
			}
		});

		var mem = process.memoryUsage();
		var format = function(bytes) {  
              return (bytes/1024/1024).toFixed(2)+'MB';  
        }; 
		//console.log('Process: heapTotal '+format(mem.heapTotal) + ' heapUsed ' + format(mem.heapUsed) + ' rss ' + format(mem.rss));
	}
}

exports.start = function($config){
	config = $config;
	//对外socket地址:初始化即取配置CLIENT_IP,避免首跳前建房拿到空地址
	serverIp = config.CLIENT_IP;

	//
	gameServerInfo = {
		id:config.SERVER_ID,
		clientip:config.CLIENT_IP,
		clientport:config.CLIENT_PORT,
		httpPort:config.HTTP_PORT,
		load:roomMgr.getTotalRooms(),
	};

	setInterval(update,1000);
	app.listen(config.HTTP_PORT, "0.0.0.0");
	console.log("game server is listening on " + config.FOR_HALL_IP + ":" + config.HTTP_PORT);
};