var db = require('../utils/db');

var rooms = {};
var creatingRooms = {};

var userLocation = {};
var totalRooms = 0;

//定时解散无人/超时房间:
//1)任一座位玩家断线超过配置秒数,或在线但无真实操作超过配置秒数 → 自动解散
//  (秒数由后台玩法配置 t_game_config.auto_dissolve_seconds 设置,默认300秒;心跳game_ping不算操作)
//2)全员离线超过5分钟自动解散(兜底)
//3)创建超过4小时强制解散,保证房间不会永久存在
setInterval(function(){
    var userMgr = require('./usermgr'); //函数内加载,避免与usermgr循环依赖
    var now = Date.now();
    for(var roomId in rooms){
        var room = rooms[roomId];
        if(room == null || room.seats == null){ continue; }
        checkRoomAutoDissolve(room, userMgr, now);
    }
}, 60*1000);

//对单个房间执行自动解散检查
function checkRoomAutoDissolve(room, userMgr, now){
    var roomId = room.id;
    //4小时强制解散
    var createTime = (room.createTime || 0) * 1000;
    if(createTime > 0 && (now - createTime) >= 4*60*60*1000){
        console.log('[roommgr] force dissolve (4h timeout):', roomId);
        dissolveIdleRoom(room);
        return;
    }
    //统计是否有在线玩家
    var hasOnline = false;
    for(var i = 0; i < room.seats.length; ++i){
        var uid = room.seats[i].userId;
        if(uid > 0 && userMgr.isOnline(uid)){ hasOnline = true; break; }
    }
    //兜底:全员离线超过5分钟解散
    if(hasOnline){
        room.emptySince = null;
    }
    else if(room.emptySince == null){
        room.emptySince = now;
    }
    if(room.emptySince != null && now - room.emptySince >= 5*60*1000){
        dissolveIdleRoom(room);
        return;
    }
    //按玩法配置的秒数检查:任一玩家断线超时或在线无动作超时 → 解散
    var conf = room.conf || {};
    var type = conf.game_type || conf.type || null;
    getGameConfig(type, function(cfg){
        //异步回调时房间可能已被解散
        if(rooms[roomId] !== room){ return; }
        var sec = (cfg && cfg.auto_dissolve_seconds != null ? cfg.auto_dissolve_seconds : 300);
        if(!(sec > 0)){ sec = 300; }
        var limit = sec * 1000;
        for(var i = 0; i < room.seats.length; ++i){
            var uid = room.seats[i].userId;
            if(uid <= 0){ continue; }
            if(userMgr.isOnline(uid)){
                //在线但长时间无真实操作(心跳不算)
                var lastAct = userMgr.getLastActivity(uid);
                if(lastAct > 0 && (now - lastAct) >= limit){
                    console.log('[roommgr] auto dissolve (no activity ' + sec + 's): room=' + roomId + ' userId=' + uid);
                    dissolveIdleRoom(room);
                    return;
                }
            }
            else{
                //断线超过配置秒数
                var offSince = userMgr.getOfflineSince(uid);
                if(offSince > 0 && (now - offSince) >= limit){
                    console.log('[roommgr] auto dissolve (offline ' + sec + 's): room=' + roomId + ' userId=' + uid);
                    dissolveIdleRoom(room);
                    return;
                }
            }
        }
    });
}

function dissolveIdleRoom(room){
    var userMgr = require('./usermgr');
    for(var i = 0; i < room.seats.length; ++i){
        var uid = room.seats[i].userId;
        if(uid > 0 && userMgr.isOnline(uid)){
            userMgr.sendMsg(uid, 'dispress_push', {});
        }
    }
    //广播俱乐部牌桌清空(座位清空快照):自动解散时牌桌列表同步清零,避免残留满员状态
    try{
        var snap = JSON.parse(JSON.stringify(room));
        snap.seats = [];
        require('./socket_service').broadcastClubUpdatePublic(room.id, snap);
    }catch(e){}
    console.log('[roommgr] idle room dissolved:', room.id);
    exports.destroy(room.id);
}

// 从数据库读取玩法配置，带缓存
var configCache = {};
var CONFIG_CACHE_TTL = 30 * 1000; // 30秒缓存,保证后台修改台数/封顶等配置后自动生效
function getGameConfig(type, callback, force){
	var cached = configCache[type];
	if(!force && cached && (Date.now() - cached.time) < CONFIG_CACHE_TTL){
		callback(cached.cfg);
		return;
	}
	db.get_game_config(type, function(cfg){
		if(cfg){
			configCache[type] = {time: Date.now(), cfg: cfg};
		}
		callback(cfg);
	});
}

// 清除配置缓存（后台修改配置后调用）
exports.clearConfigCache = function(){
	configCache = {};
};

// 玩法类型 → 独立游戏管理器（诸暨三玩法各自独立文件）
function getGameMgrByType(type){
	if(type == "zj"){
		return require("./gamemgr_ldh");   // 翻财神 (2人)
	}
	else if(type == "zj_lao"){
		return require("./gamemgr_zjlao"); // 诸暨赖倒胡 (2人,无台数门槛,财吊)
	}
	else if(type == "zj_bt"){
		return require("./gamemgr_bmj");   // 包麻将（包财神）2人
	}
	else if(type == "zj4"){
		return require("./gamemgr_zj4");   // 翻财神 4人
	}
	else if(type == "zj4_bt"){
		return require("./gamemgr_zj4_bt"); // 包麻将（包财神）4人
	}
	else if(type == "zj_zx"){
		return require("./gamemgr_zjzx");  // 诸暨自选麻将 2人(自选财神)
	}
	else if(type == "zj4_zx"){
		return require("./gamemgr_zjzx4"); // 诸暨自选麻将 4人(自选财神)
	}
	else if(type == "zp"){
		return require("./gamemgr_zp");    // 漳浦麻将 2人
	}
	else if(type == "zp4"){
		return require("./gamemgr_zp4");   // 漳浦麻将 4人
	}
	else if(type == "wujin"){
		return require("./gamemgr_wujin"); // 漳浦无金麻将 4人
	}
	else if(type == "dzpk"){
		return require("./gamemgr_dzpk");
	}
	else if(type == "guanpai2" || type == "guanpai3"){
		return require("./gamemgr_guanpai"); // 关牌(扑克) 2人/3人共用
	}
	// 旧数据(xlch等)兜底，防恢复崩溃；新建房间已被createRoom拦截
	return require("./gamemgr_ldh");
}

function generateRoomId(){
	var roomId = "";
	for(var i = 0; i < 6; ++i){
		roomId += Math.floor(Math.random()*10);
	}
	return roomId;
}

function constructRoomFromDb(dbdata){
	var conf = JSON.parse(dbdata.base_info);
	// 向后兼容补齐:老房间从 DB 恢复时,conf 可能缺后续版本加的字段
	// 1) 先补 conf 自身已有的(驼峰/下划线/旧命名)
	if(conf.baseScore == null && conf.base != null) conf.baseScore = conf.base;
	if(conf.baseScore == null && conf.base_score != null) conf.baseScore = conf.base_score;
	if(conf.maxGames == null && conf.max_games != null) conf.maxGames = conf.max_games;
	if(conf.maxGames == null && conf.jushuxuanze != null) conf.maxGames = conf.jushuxuanze;
	if(conf.maxTai == null && conf.max_tai != null) conf.maxTai = conf.max_tai;
	// 2) 再从内存 configCache(游戏启动/新建房时已填充)拿最新后台配置补齐
	var type = conf.type;
	var cachedCfg = configCache[type];
	if(cachedCfg && cachedCfg.cfg){
		var c = cachedCfg.cfg;
		if(conf.maxTai == null) conf.maxTai = c.max_tai || 10;
		if(conf.taiRules == null) conf.taiRules = c.tai_rules || null;
	}else{
		// configCache 没命中(老房间首次恢复):用默认值兜底,同时触发一次 getGameConfig 把缓存填上
		if(conf.maxTai == null) conf.maxTai = 10;
		getGameConfig(type, function(){}, true); // force=true 强制查 DB 写缓存,后续新建房/恢复房就命中了
	}
	console.log("[constructRoomFromDb] roomId=", dbdata.id, " type=", type, " conf keys=", Object.keys(conf).join(","), " baseScore=", conf.baseScore, " maxTai=", conf.maxTai, " maxGames=", conf.maxGames, " taiRules=", conf.taiRules);

	var maxPlayers = conf.maxPlayers || 2;
	var roomInfo = {
		uuid:dbdata.uuid,
		id:dbdata.id,
		numOfGames:dbdata.num_of_turns,
		createTime:dbdata.create_time,
		nextButton:dbdata.next_button,
		seats:new Array(maxPlayers),
		conf:conf
	};

	roomInfo.gameMgr = getGameMgrByType(conf.type);
	var roomId = roomInfo.id;

	for(var i = 0; i < maxPlayers; ++i){
		var s = roomInfo.seats[i] = {};
		s.userId = dbdata["user_id" + i] || 0;
		s.score = dbdata["user_score" + i] || 0;
		s.name = dbdata["user_name" + i] || "";
		s.ready = false;
		s.seatIndex = i;
		s.numZiMo = 0;
		s.numJiePao = 0;
		s.numDianPao = 0;
		s.numAnGang = 0;
		s.numMingGang = 0;
		s.numChaJiao = 0;

		if(s.userId > 0){
			userLocation[s.userId] = {
				roomId:roomId,
				seatIndex:i
			};
		}
	}
	rooms[roomId] = roomInfo;
	totalRooms++;
	return roomInfo;
}

exports.createRoom = function(creator,roomConf,gems,ip,port,callback){
	var type = roomConf.type;
	// 仅开放诸暨四玩法（翻财神/赖倒胡/包财神，2人/4人） + 德州扑克 + 漳浦(带金/无金)
	if(type != "zj" && type != "zj_lao" && type != "zj_bt" && type != "zj4" && type != "zj4_bt" && type != "zj_zx" && type != "zj4_zx" && type != "dzpk" && type != "zp" && type != "zp4" && type != "wujin" && type != "guanpai2" && type != "guanpai3"){
		callback(1,null);
		return;
	}

	// 从数据库读取玩法配置（建房必须走最新配置,不走缓存,确保后台开关（去条子/单双财神等）立即生效）
	getGameConfig(type, function(cfg){
		if(!cfg){
			callback(1,null);
			return;
		}
		if(cfg.enabled == 0){
			callback(1,null);
			return;
		}
		var DI_FEN = cfg.difen_options;
		var JU_SHU = cfg.jushu_options;
		var JU_SHU_COST = cfg.cost_options;
		var CHIPS = cfg.chips_options || [1000];
		var maxPlayers = cfg.max_players || 2;

		if(roomConf.type == null || roomConf.difen == null || roomConf.jushuxuanze == null){
			callback(1,null);
			return;
		}
		if(roomConf.difen < 0 || roomConf.difen >= DI_FEN.length){
			callback(1,null);
			return;
		}
		if(roomConf.jushuxuanze < 0 || roomConf.jushuxuanze >= JU_SHU.length){
			callback(1,null);
			return;
		}
		// 德州扑克：起始筹码选项校验
		if(type == "dzpk"){
			if(roomConf.chips == null || roomConf.chips < 0 || roomConf.chips >= CHIPS.length){
				callback(1,null);
				return;
			}
		}

		var cost = JU_SHU_COST[roomConf.jushuxuanze];
		if(cost > gems){
			callback(2222,null);
			return;
		}

		var fnCreate = function(){
			var roomId = generateRoomId();
			if(rooms[roomId] != null || creatingRooms[roomId] != null){
				fnCreate();
			}
			else{
				creatingRooms[roomId] = true;
				db.is_room_exist(roomId, function(ret) {

					if(ret){
						delete creatingRooms[roomId];
						fnCreate();
					}
					else{
						var createTime = Math.ceil(Date.now()/1000);
						var conf = {
							type: roomConf.type,
							baseScore: DI_FEN[roomConf.difen],
							maxGames: JU_SHU[roomConf.jushuxuanze],
							cost: cost,
							creator: creator,
							maxTai: cfg.max_tai || 10,
							maxPlayers: maxPlayers
						};

						//俱乐部牌桌:保留俱乐部id/玩法,供人数变化时向 club_<clubid> 广播(由大厅服写入conf)
						if(roomConf.clubid != null){ conf.clubid = roomConf.clubid; }
						if(roomConf.game_type != null){ conf.game_type = roomConf.game_type; }

						// 诸暨麻将特有配置
						if(type == "zj" || type == "zj_lao" || type == "zj_bt" || type == "zj4" || type == "zj4_bt" || type == "zj_zx" || type == "zj4_zx"){
							if(type == "zj" || type == "zj4") conf.playStyle = 'fancaishen';
							else if(type == "zj_bt" || type == "zj4_bt") conf.playStyle = 'baocaishen';
							else if(type == "zj_zx" || type == "zj4_zx") conf.playStyle = 'zixuancaishen';
							conf.maxTai = roomConf.maxTai || cfg.max_tai || 10;
							conf.caishen_cpg = cfg.caishen_cpg != null ? cfg.caishen_cpg : 1;
							conf.taiRules = cfg.tai_rules || null;
							conf.baoSeatIndex = roomConf.baoSeatIndex != null ? roomConf.baoSeatIndex : -1;
							conf.baoTai = roomConf.baoTai || 2;
							conf.baoTaiFee = roomConf.baoTaiFee || 0;
							// 后台全局开关:财吃/财碰/财杠/点炮胡(赖倒胡与翻财神共用)
							conf.cai_chi = cfg.cai_chi != null ? cfg.cai_chi : 1;
							conf.cai_peng = cfg.cai_peng != null ? cfg.cai_peng : 1;
							conf.cai_gang = cfg.cai_gang != null ? cfg.cai_gang : 1;
							conf.dianpao_hu = cfg.dianpao_hu != null ? cfg.dianpao_hu : 1;
							// 二人诸暨玩法:是否去掉条子(仅 zj/zj_lao/zj_bt 生效,zj4/zj4_bt 忽略)
							conf.remove_tiao = cfg.remove_tiao != null ? cfg.remove_tiao : 0;
							// 翻财神/赖倒胡:财神模式(1=双财神7财,0=单财神4财)
							conf.cai7 = cfg.cai7 != null ? cfg.cai7 : 0;
							// 赖倒胡专属开关:天胡地胡翻倍/财吊翻倍
							if(type == "zj_lao"){
								conf.tianhu_di = cfg.tianhu_di != null ? cfg.tianhu_di : 1;
								conf.cai_diao = cfg.cai_diao != null ? cfg.cai_diao : 1;
							}
							// 包财神专属:每台包台分数(结算时包台分=包台数×此值)
							if(type == "zj_bt" || type == "zj4_bt"){
								conf.bao_tai_score = cfg.bao_tai_score != null ? cfg.bao_tai_score : 1;
								// 结算分:胡牌分=底分×2^(台数-1), 包台分=底分×2^(包台数-1), 底分取添加牌桌时选的底分
							}
							// 自选财神专属:老庄结算倍数(默认2)
							if(type == "zj_zx" || type == "zj4_zx"){
								conf.laozhuang_multiplier = cfg.laozhuang_multiplier != null ? cfg.laozhuang_multiplier : 2;
							}
						}

						// 漳浦麻将特有配置：台数规则全部走后台 tai_rules
						if(type == "zp" || type == "zp4" || type == "wujin"){
							conf.taiRules = cfg.tai_rules || null;
						}

						// 德州扑克特有配置：小盲、起始筹码
						if(type == "dzpk"){
							conf.smallBlind = DI_FEN[roomConf.difen];
							conf.chips = CHIPS[roomConf.chips];
						}

						// 关牌(扑克)：7 个后台开关原样透传给对局
						if(type == "guanpai2" || type == "guanpai3"){
							conf.gp_four_two = cfg.gp_four_two != null ? cfg.gp_four_two : 1;
							conf.gp_four_three = cfg.gp_four_three != null ? cfg.gp_four_three : 1;
							conf.gp_three_one = cfg.gp_three_one != null ? cfg.gp_three_one : 1;
							conf.gp_last_three_one = cfg.gp_last_three_one != null ? cfg.gp_last_three_one : 0;
							conf.gp_last_four_two_three = cfg.gp_last_four_two_three != null ? cfg.gp_last_four_two_three : 0;
							conf.gp_bomb = cfg.gp_bomb != null ? cfg.gp_bomb : 1;
							conf.gp_bomb_four = cfg.gp_bomb_four != null ? cfg.gp_bomb_four : 1;
							conf.gp_card_history = cfg.gp_card_history != null ? cfg.gp_card_history : 0;
							conf.gp_straight_a2 = cfg.gp_straight_a2 != null ? cfg.gp_straight_a2 : 1;
							conf.taiRules = cfg.tai_rules || null; //出牌倒计时 chupai_timeout 走 tai_rules
						}

						var roomInfo = {
							uuid:"",
							id:roomId,
							numOfGames:0,
							createTime:createTime,
							nextButton:0,
							seats:[],
							conf:conf
						};
						console.log("[createRoom] roomId=", roomId, " type=", type, " conf keys=", Object.keys(conf), " baseScore=", conf.baseScore, " maxTai=", conf.maxTai, " maxGames=", conf.maxGames, " taiRules=", JSON.stringify(conf.taiRules).substring(0,80));

						roomInfo.gameMgr = getGameMgrByType(type);
						console.log(roomInfo.conf);

						for(var i = 0; i < maxPlayers; ++i){
							roomInfo.seats.push({
								userId:0,
								score:0,
								name:"",
								ready:false,
								seatIndex:i,
								numZiMo:0,
								numJiePao:0,
								numDianPao:0,
								numAnGang:0,
								numMingGang:0,
								numChaJiao:0,
							});
						}


						//写入数据库
						db.create_room(roomInfo.id,roomInfo.conf,ip,port,createTime,function(uuid){
							delete creatingRooms[roomId];
							if(uuid != null){
								roomInfo.uuid = uuid;
								console.log(uuid);
								rooms[roomId] = roomInfo;
								totalRooms++;
								callback(0,roomId);
							}
							else{
								callback(3,null);
							}
						});
					}
				});
			}
		}

		fnCreate();
	}, true);
};

exports.destroy = function(roomId,callback){
	var roomInfo = rooms[roomId];
	if(roomInfo == null){
		if(callback){ callback(); }
		return;
	}

	for(var i = 0; i < roomInfo.seats.length; ++i){
		var userId = roomInfo.seats[i].userId;
		if(userId > 0){
			delete userLocation[userId];
			db.set_room_id_of_user(userId,null);
		}
	}

	delete rooms[roomId];
	totalRooms--;
	db.delete_room(roomId);
	//同步解绑俱乐部牌桌(所有绑定到该房间的牌桌roomid置NULL):
	//否则牌桌列表LEFT JOIN出旧房间座位数据,牌桌一直显示被占用
	//回调在解绑落库后触发:调用方需等DB最终一致再回包/广播,否则客户端立即回查会读回旧数据
	db.club_unbind_room(roomId,function(){
		if(callback){ callback(); }
	});
}

exports.getTotalRooms = function(){
	return totalRooms;
}

exports.getRoom = function(roomId){
	return rooms[roomId];
};

exports.isCreator = function(roomId,userId){
	var roomInfo = rooms[roomId];
	if(roomInfo == null){
		return false;
	}
	return roomInfo.conf.creator == userId;
};

exports.enterRoom = function(roomId,userId,userName,callback){
	var fnTakeSeat = function(room){
		if(exports.getUserRoom(userId) == roomId){
			//已存在
			return 0;
		}

		for(var i = 0; i < room.seats.length; ++i){
			var seat = room.seats[i];
			if(seat.userId <= 0){
				seat.userId = userId;
				seat.name = userName;
				userLocation[userId] = {
					roomId:roomId,
					seatIndex:i
				};
				//console.log(userLocation[userId]);
				db.update_seat_info(roomId,i,seat.userId,"",seat.name);
				//同步写用户房间绑定:退出/销毁时清NULL,保证DB绑定与内存一致(非房主进桌此前从未落盘)
				db.set_room_id_of_user(userId,roomId);
				//正常
				return 0;
			}
		}
		//房间已满
		return 1;
	}
	var room = rooms[roomId];
	if(room){
		var ret = fnTakeSeat(room);
		callback(ret);
	}
	else{
		db.get_room_data(roomId,function(dbdata){
			if(dbdata == null){
				//找不到房间
				callback(2);
			}
			else{
				//construct room.
				room = constructRoomFromDb(dbdata);
				//
				var ret = fnTakeSeat(room);
				callback(ret);
			}
		});
	}
};

exports.setReady = function(userId,value){
	var roomId = exports.getUserRoom(userId);
	if(roomId == null){
		return;
	}

	var room = exports.getRoom(roomId);
	if(room == null){
		return;
	}

	var seatIndex = exports.getUserSeat(userId);
	if(seatIndex == null){
		return;
	}

	var s = room.seats[seatIndex];
	s.ready = value;
}

exports.isReady = function(userId){
	var roomId = exports.getUserRoom(userId);
	if(roomId == null){
		return;
	}

	var room = exports.getRoom(roomId);
	if(room == null){
		return;
	}

	var seatIndex = exports.getUserSeat(userId);
	if(seatIndex == null){
		return;
	}

	var s = room.seats[seatIndex];
	return s.ready;
}


exports.getUserRoom = function(userId){
	var location = userLocation[userId];
	if(location != null){
		return location.roomId;
	}
	return null;
};

// 别名：gamemgr 中使用 getRoomIdOfUser，保持兼容
exports.getRoomIdOfUser = exports.getUserRoom;

exports.getUserSeat = function(userId){
	var location = userLocation[userId];
	//console.log(userLocation[userId]);
	if(location != null){
		return location.seatIndex;
	}
	return null;
};

exports.getUserLocations = function(){
	return userLocation;
};

exports.exitRoom = function(userId,callback){
	var location = userLocation[userId];
	if(location == null){
		if(callback){ callback(); }
		return;
	}

	var roomId = location.roomId;
	var seatIndex = location.seatIndex;
	var room = rooms[roomId];
	delete userLocation[userId];
	if(room == null || seatIndex == null) {
		if(callback){ callback(); }
		return;
	}

	var seat = room.seats[seatIndex];
	seat.userId = 0;
	seat.name = "";

	//清座位与清绑定两条SQL都落库后再回调,避免调用方立即回查读到旧座位(牌桌列表"退出后不更新")
	var left = 2;
	var done = function(){
		left--;
		if(left <= 0 && callback){ callback(); }
	};

	//同步清掉DB座位,否则俱乐部详情页/club_tables(LEFT JOIN t_rooms)仍显示已退出玩家
	db.update_seat_info(roomId,seatIndex,0,"","",done);

	//条件清绑定:仅当DB绑定仍指向本房间才置NULL,
	//防止"退出→立刻重进新房间"时本清空SQL异步后到误清新房间的绑定
	db.set_room_id_of_user(userId,null,roomId,done);

	//退出仅清座位,不销毁房间:退出≠解散,房间必须保留供他人再进
	//空房由调用方判断后销毁(未开局退出)/自动解散定时器兜底回收(全员离线5分钟/创建超4小时)
};

//房间内已无任何占位玩家时销毁释放:仅在"未开局退出/整场打完退出/后台清桌"分支调用,
//对局进行中严禁调用(否则正在打牌的房间被误释放)
exports.destroyIfEmpty = function(roomId,callback){
	var roomInfo = rooms[roomId];
	if(roomInfo == null){
		if(callback){ callback(); }
		return;
	}
	for(var i = 0; i < roomInfo.seats.length; ++i){
		if(roomInfo.seats[i].userId > 0){
			if(callback){ callback(); }
			return;
		}
	}
	exports.destroy(roomId,callback);
};
