var crypto = require('../utils/crypto');
var db = require('../utils/db');
var express = require('express');

var tokenMgr = require('./tokenmgr');
var roomMgr = require('./roommgr');
var userMgr = require('./usermgr');
var http = require('../utils/http');
var io = null;

var app = express();

//设置跨域访问
app.all('*', function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");
    res.header("Access-Control-Allow-Methods","PUT,POST,GET,DELETE,OPTIONS");
    res.header("X-Powered-By",' 3.2.1')
    res.header("Content-Type", "application/json;charset=utf-8");
	http.send(res,0,"ok",{});
});

var config = null;

//俱乐部桌面人数变化广播:房间conf中带clubid时,向 club_<clubid> 房间推送 club_update
//roomInfo 可传入变更前的房间快照(房间销毁后仍能取到 clubid/剩余座位数)
function broadcastClubUpdate(roomId,roomInfo){
	if(io == null){
		return;
	}
	if(roomInfo == null){
		roomInfo = roomMgr.getRoom(roomId);
	}
	if(roomInfo == null || roomInfo.conf == null){
		return;
	}
	var clubId = parseInt(roomInfo.conf.clubid);
	if(!(clubId > 0)){
		return;
	}
	var count = 0;
	var seats = roomInfo.seats || [];
	var seatList = [];
	for(var i = 0; i < seats.length; ++i){
		if(seats[i].userId > 0){
			count++;
			seatList.push({seatindex:i,userid:seats[i].userId});
		}
	}
	var payload = {
		clubid:clubId,
		game_type:roomInfo.conf.game_type || roomInfo.conf.type || null,
		roomid:roomId,
		player_count:count,
		seats:seatList
	};
	console.log('[club_update] room=' + roomId + ' club=' + clubId + ' count=' + count + ' seats=' + JSON.stringify(seatList));
	io.to('club_' + clubId).emit('club_update',payload);
}

//供各玩法 gamemgr 在解散房间时广播俱乐部牌桌清空(必须传销毁前的房间快照)
exports.broadcastClubUpdatePublic = broadcastClubUpdate;

exports.start = function(conf,mgr){
	config = conf;
	
	var httpServer = require('http').createServer(app);
	io = require('socket.io')(httpServer);
	httpServer.listen(config.CLIENT_PORT);
	
	io.sockets.on('connection',function(socket){
		//追踪玩家真实操作时间:包装socket.on,除心跳(game_ping)/断开(disconnect)外的任意消息均刷新活跃时间,
		//供房间"无动作/断线超时自动解散"功能使用(秒数由后台玩法配置)
		var _origOn = socket.on.bind(socket);
		socket.on = function(event, listener){
			if(event != 'game_ping' && event != 'disconnect' && typeof listener == 'function'){
				return _origOn(event, function(data){
					try{
						if(socket.userId != null){
							userMgr.touchActivity(socket.userId);
						}
					}catch(e){}
					listener(data);
				});
			}
			return _origOn(event, listener);
		};

		//错误处理（防止 ECONNRESET 等导致崩溃）
		socket.on('error',function(err){
			console.log('[socket error]', err && err.message);
		});

		//俱乐部桌面人数实时订阅:无需登录,校验clubid后加入 club_<clubid> 房间,人数变化时收到 club_update
		socket.on('club_subscribe',function(data){
			try{
				if(typeof data === 'string'){ data = JSON.parse(data); }
			}catch(e){ return; }
			if(data == null){ return; }
			var clubId = parseInt(data.clubid);
			if(!(clubId > 0)){ return; }
			socket.clubId = clubId;
			socket.join('club_' + clubId);
			console.log('[club_subscribe] socket join club_' + clubId);
		});

		socket.on('login',function(data){
			try{
				if(typeof data === 'string'){ data = JSON.parse(data); }
			}catch(e){ console.log('[login parse error]', e.message); return; }
			if(socket.userId != null){
				//已经登陆过的就忽略
				return;
			}
			var token = data.token;
			var roomId = data.roomid;
			var time = data.time;
			var sign = data.sign;

			console.log(roomId);
			console.log(token);
			console.log(time);
			console.log(sign);

			
			//检查参数合法性
			if(token == null || roomId == null || sign == null || time == null){
				console.log(1);
				socket.emit('login_result',{errcode:1,errmsg:"invalid parameters"});
				return;
			}
			
			//检查参数是否被篡改
			var md5 = crypto.md5(roomId + token + time + config.ROOM_PRI_KEY);
			if(md5 != sign){
				console.log(2);
				socket.emit('login_result',{errcode:2,errmsg:"login failed. invalid sign!"});
				return;
			}

			//检查token是否有效
			if(tokenMgr.isTokenValid(token)==false){
				console.log(3);
				socket.emit('login_result',{errcode:3,errmsg:"token out of time."});
				return;
			}
			
			//检查房间合法性
			var userId = tokenMgr.getUserID(token);

			//单房间限制:一个玩家同时只能在一个房间,已在A房时再登B房直接拒绝
			//(真源在内存:hall侧查不到game_server运行态,必须在login处拦截)
			var curRoomId = roomMgr.getUserRoom(userId);
			if(curRoomId != null && curRoomId != roomId){
				console.log('[login reject] userId=' + userId + ' 已在房间' + curRoomId + ',拒绝进入' + roomId);
				socket.emit('login_result',{errcode:5,errmsg:"你已在其他房间中,请先退出后再进入其它房间"});
				return;
			}

			var roomId = roomMgr.getUserRoom(userId);

			userMgr.bind(userId,socket);
			socket.userId = userId;

			//返回房间信息
			var roomInfo = roomMgr.getRoom(roomId);

			var seatIndex = roomMgr.getUserSeat(userId);
			//房间或座位不存在(如游戏服重启后内存丢失):返回明确错误,避免客户端无限等待
			if(roomInfo == null || seatIndex == null || seatIndex < 0 || roomInfo.seats[seatIndex] == null){
				socket.emit('login_result',{errcode:4,errmsg:"房间已失效,请重新进入"});
				return;
			}
			roomInfo.seats[seatIndex].ip = socket.handshake.address;

			var userData = null;
			var seats = [];
			for(var i = 0; i < roomInfo.seats.length; ++i){
				var rs = roomInfo.seats[i];
				var online = false;
				if(rs.userId > 0){
					online = userMgr.isOnline(rs.userId);
				}

				seats.push({
					userid:rs.userId,
					ip:rs.ip,
					score:rs.score,
					name:rs.name,
					online:online,
					ready:rs.ready,
					seatindex:i
				});

				if(userId == rs.userId){
					userData = seats[i];
				}
			}

			console.log('[login] userId=' + userId + ' userName=' + (roomInfo.seats[seatIndex] && roomInfo.seats[seatIndex].name) + ' roomId=' + roomId + ' mySeatIndex=' + seatIndex + ' seats=' + JSON.stringify(seats.map(function(s){return s.userid + ':' + s.name + '@' + s.seatindex;})));

			//通知前端
			var ret = {
				errcode:0,
				errmsg:"ok",
				data:{
					roomid:roomInfo.id,
					conf:roomInfo.conf,
					numofgames:roomInfo.numOfGames,
					seats:seats
				}
			};
			socket.emit('login_result',ret);

			//通知其它客户端（异常不影响后续流程）
			try{
				userMgr.broacastInRoom('new_user_comes_push',userData,userId);
			}catch(e){
				console.log('[login broadcast error]', e && e.stack);
			}

			socket.gameMgr = roomInfo.gameMgr;

			//俱乐部牌桌:玩家进房后向 club_<clubid> 广播人数变化
			broadcastClubUpdate(roomId,roomInfo);

			// 进房不再自动准备：必须由玩家点击"开始"(ready)后,且所有在线座位都准备完毕才开局
			// 对局进行中重连由 resendGameState 补发牌局状态,不依赖准备状态

			//无论如何都要下发login_finished,避免客户端永久卡在"正在进入房间"
			socket.emit('login_finished');

			//若该房对局已进行中(断线重连/中途进房),补发当前牌局状态,避免客户端看不到手牌
			try{
				if(socket.gameMgr && socket.gameMgr.resendGameState){
					socket.gameMgr.resendGameState(roomId, userId);
				}
			}catch(e){
				console.log('[login resend state error]', e && e.stack);
			}

			if(roomInfo.dr != null){
				var dr = roomInfo.dr;
				var ramaingTime = (dr.endTime - Date.now()) / 1000;
				var data = {
					time:ramaingTime,
					states:dr.states
				}
				userMgr.sendMsg(userId,'dissolve_notice_push',data);	
			}
		});

		socket.on('ready',function(data){
			var userId = socket.userId;
			if(userId == null){
				return;
			}
			socket.gameMgr.setReady(userId);
			userMgr.broacastInRoom('user_ready_push',{userid:userId,ready:true},userId,true);
		});

		//换牌
		socket.on('huanpai',function(data){
			if(socket.userId == null){
				return;
			}
			if(data == null){
				return;
			}

			if(typeof(data) == "string"){
				try{ data = JSON.parse(data); }catch(e){ return; }
			}

			var p1 = data.p1;
			var p2 = data.p2;
			var p3 = data.p3;
			if(p1 == null || p2 == null || p3 == null){
				console.log("invalid data");
				return;
			}
			socket.gameMgr.huanSanZhang(socket.userId,p1,p2,p3);
		});

		//定缺
		socket.on('dingque',function(data){
			if(socket.userId == null){
				return;
			}
			var que = data;
			socket.gameMgr.dingQue(socket.userId,que);
		});

		//出牌
		socket.on('chupai',function(data){
			if(socket.userId == null){
				return;
			}
			var pai = data;
			console.log("chupai request from", socket.userId, "pai=", pai);
			socket.gameMgr.chuPai(socket.userId,pai);
		});
		
		//碰
		socket.on('peng',function(data){
			if(socket.userId == null){
				return;
			}
			socket.gameMgr.peng(socket.userId);
		});
		
		//杠
		socket.on('gang',function(data){
			if(socket.userId == null || data == null){
				return;
			}
			var pai = -1;
			if(typeof(data) == "number"){
				pai = data;
			}
			else if(typeof(data) == "string"){
				pai = parseInt(data);
			}
			else{
				console.log("gang:invalid param");
				return;
			}
			socket.gameMgr.gang(socket.userId,pai);
		});
		
		//胡
		socket.on('hu',function(data){
			if(socket.userId == null){
				return;
			}
			socket.gameMgr.hu(socket.userId);
		});

		//过  遇上胡，碰，杠的时候，可以选择过
		socket.on('guo',function(data){
			if(socket.userId == null){
				return;
			}
			socket.gameMgr.guo(socket.userId);
		});

		//漳浦麻将：游金宣告（打出普通牌，将=金+普通牌）
		socket.on('youjin',function(data){
			if(socket.userId == null || data == null){
				return;
			}
			if(typeof(socket.gameMgr.youjin) != "function"){
				return;
			}
			var pai = -1;
			if(typeof(data) == "number"){
				pai = data;
			}
			else if(data.pai != null){
				pai = parseInt(data.pai);
			}
			if(pai < 0){
				return;
			}
			socket.gameMgr.youjin(socket.userId,pai);
		});

		//漳浦麻将：游金继续（放弃本次胡，继续游，倍数提升）
		socket.on('youjin_go',function(data){
			if(socket.userId == null){
				return;
			}
			if(typeof(socket.gameMgr.youjinContinue) != "function"){
				return;
			}
			socket.gameMgr.youjinContinue(socket.userId);
		});

		//包财神：庄家选择是否包（caishenMode: 1=单财神 2=双财神）
		socket.on('bao',function(data){
			if(socket.userId == null || data == null){
				return;
			}
			var isBao = data.isBao == true;
			var baoTai = data.baoTai || 2;
			var baoTaiFee = data.baoTaiFee || 0;
			var caishenMode = data.caishenMode || 1;
			socket.gameMgr.bao(socket.userId, isBao, baoTai, baoTaiFee, caishenMode);
		});

		//吃
		socket.on('chi',function(data){
			if(socket.userId == null || data == null){
				return;
			}
			var chipai = data;
			if(typeof(chipai) == "string"){
				try{ chipai = JSON.parse(chipai); }catch(e){ return; }
			}
			if(socket.gameMgr.chi){
				socket.gameMgr.chi(socket.userId, chipai);
			}
		});

		//德州扑克下注：{action: fold/check/call/raise/allin, amount: 加注目标额}
		socket.on('dzpk_bet',function(data){
			if(socket.userId == null || data == null){
				return;
			}
			if(typeof(data) == "string"){
				try{ data = JSON.parse(data); }catch(e){ return; }
			}
			if(socket.gameMgr.bet){
				socket.gameMgr.bet(socket.userId, data.action, data.amount);
			}
		});
		
		//聊天
		socket.on('chat',function(data){
			if(socket.userId == null){
				return;
			}
			var chatContent = data;
			userMgr.broacastInRoom('chat_push',{sender:socket.userId,content:chatContent},socket.userId,true);
		});
		
		//快速聊天
		socket.on('quick_chat',function(data){
			if(socket.userId == null){
				return;
			}
			var chatId = data;
			userMgr.broacastInRoom('quick_chat_push',{sender:socket.userId,content:chatId},socket.userId,true);
		});
		
		//语音聊天
		socket.on('voice_msg',function(data){
			if(socket.userId == null){
				return;
			}
			console.log(data.length);
			userMgr.broacastInRoom('voice_msg_push',{sender:socket.userId,content:data},socket.userId,true);
		});
		
		//表情
		socket.on('emoji',function(data){
			if(socket.userId == null){
				return;
			}
			var phizId = data;
			userMgr.broacastInRoom('emoji_push',{sender:socket.userId,content:phizId},socket.userId,true);
		});
		
		//语音使用SDK不出现在这里
		
		//退出房间
		//规则:退出即释放自己的占用(不再保留座位)。
		//1)房内还有其他玩家(如2人房未开局)→仅自己退出,房间保留,牌桌广播剩余人数;
		//2)房间已无其他玩家→销毁房间并广播座位清空快照,牌桌列表立即清零;
		//3)对局进行中(gamestate=begin)属断线保护:座位保留,避免正在进行的牌局被拆散
		socket.on('exit',function(data){
			var userId = socket.userId;
			if(userId == null){
				return;
			}

			var roomId = roomMgr.getUserRoom(userId);
			console.log('[exit] user=' + userId + ' room=' + roomId);
			if(roomId == null){
				socket.emit('exit_result');
				socket.disconnect();
				return;
			}

			var roomInfo = roomMgr.getRoom(roomId);
			var playing = false;
			try{ playing = !!(roomInfo && roomInfo.gameMgr && roomInfo.gameMgr.hasBegan && roomInfo.gameMgr.hasBegan(roomId)); }catch(e){}
			if(playing){
				//对局中:仅断开连接,座位/绑定保留(牌局无法中途拆座),断开处理器广播离线状态
				socket.emit('exit_result');
				socket.disconnect();
				return;
			}

			//释放式退出:仅自己退出,清自己座位/绑定
			userMgr.broacastInRoom('exit_notify_push',userId,userId,false);
			roomMgr.exitRoom(userId,function(){
				userMgr.del(userId);
				var finish = function(){
					var leftRoom = roomMgr.getRoom(roomId);
					if(leftRoom == null){
						//房间已释放:广播座位清空快照,牌桌列表立即清零
						if(roomInfo != null){
							var snap = JSON.parse(JSON.stringify(roomInfo));
							snap.seats = [];
							broadcastClubUpdate(roomId,snap);
						}
					}
					else{
						//房间保留(还有其他玩家):广播退出后的最新人数,牌桌列表人数-1
						broadcastClubUpdate(roomId,leftRoom);
					}
					socket.emit('exit_result');
					socket.disconnect();
				};
				//等DB最终一致(座位清空/牌桌解绑)后再广播并回包:
				//客户端收到推送会立即回查牌桌列表,过早回查会读到旧数据导致"退出后不更新"
				roomMgr.destroyIfEmpty(roomId,finish);
			});
		});

		//设置弹窗"申请解散房间"按钮:不管玩家是否准备,点击即整房解散——
		//通知房内所有人→踢出全部连接→销毁房间→广播座位清空快照(牌桌列表立即清零),
		//与投票解散完成后的 gamemgr.doDissolve 同一安全拆房路径
		socket.on('exit_release',function(data){
			var userId = socket.userId;
			if(userId == null){
				return;
			}

			var roomId = roomMgr.getUserRoom(userId);
			console.log('[exit_release] user=' + userId + ' room=' + roomId);
			if(roomId == null){
				socket.emit('exit_result');
				socket.disconnect();
				return;
			}

			var roomInfo = roomMgr.getRoom(roomId);
			if(roomInfo == null){
				socket.emit('exit_result');
				socket.disconnect();
				return;
			}

			//整房解散(先广播再踢,顺序与doDissolve一致)
			userMgr.brocastInRoom(roomId,'dispress_push',{});
			userMgr.kickAllInRoom(roomId);
			var snap = JSON.parse(JSON.stringify(roomInfo));
			snap.seats = [];
			//等DB解绑落库后再广播,客户端立即回查牌桌列表才能读到清空后的最终态
			roomMgr.destroy(roomId,function(){
				broadcastClubUpdate(roomId,snap);
			});
		});

		//牌局全部结束后,点击"退出房间"发送(与 exit 处理方式一致)
		socket.on('leave_room',function(data){
			var userId = socket.userId;
			if(userId == null){
				return;
			}

			var roomId = roomMgr.getUserRoom(userId);
			console.log('[leave_room] user=' + userId + ' room=' + roomId);
			if(roomId == null){
				socket.emit('exit_result');
				socket.disconnect();
				return;
			}

			var roomInfo = roomMgr.getRoom(roomId);
			var allGamesDone = (roomInfo != null && roomInfo.conf != null && roomInfo.conf.maxGames != null && roomInfo.numOfGames > 0 && roomInfo.numOfGames >= roomInfo.conf.maxGames);

			if(roomInfo != null && !allGamesDone){
				//整场未打完:占用式退出——座位/绑定全部保留(牌桌列表保持占用,可随时重进回到当前状态),仅断开连接
				socket.emit('exit_result');
				socket.disconnect();
				return;
			}

			//整场已打完:释放式退出
			userMgr.broacastInRoom('exit_notify_push',userId,userId,false);
			userMgr.del(userId);
			roomMgr.exitRoom(userId);

			var leftRoom = roomMgr.getRoom(roomId);
			if(leftRoom != null){
				roomMgr.destroyIfEmpty(roomId);
				leftRoom = roomMgr.getRoom(roomId);
			}
			if(leftRoom == null){
				//房间已释放:广播座位清空快照,牌桌列表立即清零
				if(roomInfo != null){
					var snap = JSON.parse(JSON.stringify(roomInfo));
					snap.seats = [];
					broadcastClubUpdate(roomId,snap);
				}
			}
			else{
				//房间保留(还有其他玩家):广播退出后的最新人数
				broadcastClubUpdate(roomId,leftRoom);
			}

			socket.emit('exit_result');
			socket.disconnect();
		});

		//查牌桌列表(俱乐部用)
		
		//解散房间
		//规则:对局未开始时任何人可点解散,解散=释放所有玩家对本房间的占用(全员踢出+销毁+牌桌清零);
		//对局已开始则不可直接解散(走投票dissolve_request流程)
		socket.on('dispress',function(data){
			var userId = socket.userId;
			if(userId == null){
				return;
			}

			var roomId = roomMgr.getUserRoom(userId);
			if(roomId == null){
				return;
			}

			var roomInfo = roomMgr.getRoom(roomId);
			if(roomInfo == null){
				return;
			}

			//对局已开始:不可直接解散
			if(socket.gameMgr.hasBegan(roomId)){
				return;
			}

			//解散整房:所有人(含发起者)都收到dispress_push退出房间
			userMgr.broacastInRoom('dispress_push',{},userId,true);
			userMgr.sendMsg(userId, 'dispress_push', {});
			userMgr.kickAllInRoom(roomId);

			//俱乐部牌桌:房间解散后广播人数清零(必须传"座位已清空"的快照)
			var snap = JSON.parse(JSON.stringify(roomInfo));
			snap.seats = [];
			//等DB解绑落库后再广播,客户端立即回查牌桌列表才能读到清空后的最终态
			roomMgr.destroy(roomId,function(){
				broadcastClubUpdate(roomId,snap);
			});

			socket.disconnect();
		});

		//解散房间
		socket.on('dissolve_request',function(data){
			var userId = socket.userId;
			console.log(1);
			if(userId == null){
				console.log(2);
				return;
			}

			var roomId = roomMgr.getUserRoom(userId);
			if(roomId == null){
				console.log(3);
				return;
			}

			//如果游戏未开始，则不可以
			if(socket.gameMgr.hasBegan(roomId) == false){
				console.log(4);
				return;
			}

			var ret = socket.gameMgr.dissolveRequest(roomId,userId);
			if(ret != null){
				var dr = ret.dr;
				var ramaingTime = (dr.endTime - Date.now()) / 1000;
				var data = {
					time:ramaingTime,
					states:dr.states
				}
				console.log(5);
				userMgr.broacastInRoom('dissolve_notice_push',data,userId,true);
			}
			console.log(6);
		});

		socket.on('dissolve_agree',function(data){
			var userId = socket.userId;

			if(userId == null){
				return;
			}

			var roomId = roomMgr.getUserRoom(userId);
			if(roomId == null){
				return;
			}

			var ret = socket.gameMgr.dissolveAgree(roomId,userId,true);
			if(ret != null){
				var dr = ret.dr;
				var ramaingTime = (dr.endTime - Date.now()) / 1000;
				var data = {
					time:ramaingTime,
					states:dr.states
				}
				userMgr.broacastInRoom('dissolve_notice_push',data,userId,true);

				var doAllAgree = true;
				for(var i = 0; i < dr.states.length; ++i){
					if(dr.states[i] == false){
						doAllAgree = false;
						break;
					}
				}

				if(doAllAgree){
					socket.gameMgr.doDissolve(roomId);					
				}
			}
		});

		socket.on('dissolve_reject',function(data){
			var userId = socket.userId;

			if(userId == null){
				return;
			}

			var roomId = roomMgr.getUserRoom(userId);
			if(roomId == null){
				return;
			}

			var ret = socket.gameMgr.dissolveAgree(roomId,userId,false);
			if(ret != null){
				userMgr.broacastInRoom('dissolve_cancel_push',{},userId,true);
			}
		});

		//错误处理（防止 ECONNRESET 导致崩溃）
		socket.on('error',function(err){
			console.log('[socket error]', err && err.message);
		});

		//断开链接
		socket.on('disconnect',function(data){
			var userId = socket.userId;
			if(!userId){
				return;
			}

			//如果是旧链接断开，则不需要处理。
			if(userMgr.get(userId) != socket){
				return;
			}

			var data = {
				userid:userId,
				online:false
			};

			//清除该玩家的座位准备状态:离线座位残留ready=true会导致"人齐"误判,
			//且重连后必须能重新触发开局判定,因此这里置为false
			try{
				var roomId = roomMgr.getUserRoom(userId);
				var room = roomId != null ? roomMgr.getRoom(roomId) : null;
				if(room != null){
					var seatIndex = roomMgr.getUserSeat(userId);
					if(seatIndex != null && room.seats[seatIndex] != null){
						room.seats[seatIndex].ready = false;
					}
				}
			}catch(e){
				console.log('[disconnect clear ready error]', e && e.stack);
			}

			//通知房间内其它玩家
			userMgr.broacastInRoom('user_state_push',data,userId);

			//清除玩家的在线信息
			userMgr.del(userId);

			//俱乐部牌桌:玩家断线后向 club_<clubid> 广播(座位仍占位,用于客户端刷新)
			broadcastClubUpdate(roomMgr.getUserRoom(userId));

			socket.userId = null;
		});
		
		socket.on('game_ping',function(data){
			var userId = socket.userId;
			if(!userId){
				return;
			}
			//console.log('game_ping');
			socket.emit('game_pong');
		});
	});

	console.log("game server is listening on " + config.CLIENT_PORT);	
};