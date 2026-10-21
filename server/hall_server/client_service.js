var crypto = require('../utils/crypto'); //加密工具
var express = require('express'); 
var db = require('../utils/db');  //数据库管理工具
var http = require('../utils/http'); //http 管理工具
var room_service = require("./room_service"); 
//应用级中间件绑定到 app 对象 使用
var app = express();
var config = null;

//判断账号密码都不为空
function check_account(req,res){
	var account = req.query.account;
	var sign = req.query.sign;
	if(account == null || sign == null){
		http.send(res,1,"unknown error");
		return false;
	}
	/*
	var serverSign = crypto.md5(account + req.ip + config.ACCOUNT_PRI_KEY);
	if(serverSign != sign){
		http.send(res,2,"login failed.");
		return false;
	}
	*/
	return true;
}

//设置跨域访问
app.all('*', function(req, res, next) {
	res.header("Access-Control-Allow-Origin", "*");
	res.header("Access-Control-Allow-Headers", "X-Requested-With");
	res.header("Access-Control-Allow-Methods","PUT,POST,GET,DELETE,OPTIONS");
	res.header("X-Powered-By",' 3.2.1');
	res.header("Content-Type", "application/json;charset=utf-8");
	next();
});


//login请求 
app.get('/login',function(req,res){
    //判断账号密码是否为空
    if(!check_account(req,res)){
		return;
	}
	//获取接受的ip
    var ip = req.ip;
    //校验ip
	if(ip.indexOf("::ffff:") != -1){
		ip = ip.substr(7);
	}
	//账号
    var account = req.query.account;
    //从数据库获取用户信息
	db.get_user_data(account,function(data){
        //如果查询为空 返回
        if(data == null){
			http.send(res,0,"ok");
			return;
		}
        //返回数据库查询信息
		var ret = {
			account:data.account,
			userid:data.userid,
			name:data.name,
			lv:data.lv,
			exp:data.exp,
			coins:data.coins,
			gems:data.gems,
			ip:ip,
			sex:data.sex,
		};
        
        //数据库查询房间是否存在
		db.get_room_id_of_user(data.userid,function(roomId){
			//如果用户处于房间中，则需要对其房间进行检查。 如果房间还在，则通知用户进入
			if(roomId != null){
				//检查房间是否存在于数据库中
				db.is_room_exist(roomId,function (retval){
					if(retval){
						ret.roomid = roomId;
					}
					else{
						//如果房间不在了，表示信息不同步，清除掉用户记录
						db.set_room_id_of_user(data.userid,null);
					}
					http.send(res,0,"ok",ret);
				});
			}
			else {
				http.send(res,0,"ok",ret);
			}
		});
	});
});

//创建用户接口 游客登录创建用户名
app.get('/create_user',function(req,res){
    //判断账号密码是否不为空
    if(!check_account(req,res)){
		return;
	}
	var account = req.query.account; //账号
	var name = req.query.name;  //获取名字
	var coins = 1000;//初试金兵
	var gems = 99;//初试房卡
	console.log(name);
    //判断名字用户是否已经存在
	db.is_user_exist(account,function(ret){
        //如果不存在
        if(!ret){
            //数据库创建该用户
			db.create_user(account,name,coins,gems,0,null,function(ret){
               //返回为空 返回错误请求
                if (ret == null) {
					http.send(res,2,"system error.");
				}
				else{
                    //返会ok
					http.send(res,0,"ok");					
				}
			});
		}
		else{
            //用户已经存在
			http.send(res,1,"account have already exist.");
		}
	});
});


//创建房间
app.get('/create_private_room',function(req,res){
	//验证参数合法性
	var data = req.query;
	//验证玩家身份
	if(!check_account(req,res)){
		return;
	}
    //账号
	var account = data.account; 
    //置空
	data.account = null;
	data.sign = null;
    var conf = data.conf; //获取金兵数量
    //获取user数据 
	db.get_user_data(account,function(data){
        //如果数据为空 系统错误
        if(data == null){
			http.send(res,1,"system error");
			return;
        } 
        //获取用户id name
		var userId = data.userid; 
		var name = data.name;
		//验证玩家状态
		db.get_room_id_of_user(userId,function(roomId){
			if(roomId != null){
				http.send(res,-1,"user is playing in room now.");
				return;
			}
			//创建房间
			room_service.createRoom(account,userId,conf,function(err,roomId){
				if(err == 0 && roomId != null){
                    //进入房间
					room_service.enterRoom(userId,name,roomId,function(errcode,enterInfo){
						if(enterInfo){
							var ret = {
								roomid:roomId,
								ip:enterInfo.ip,
								port:enterInfo.port,
								token:enterInfo.token,
								time:Date.now()
							};
							ret.sign = crypto.md5(ret.roomid + ret.token + ret.time + config.ROOM_PRI_KEY);
							http.send(res,0,"ok",ret);
						}
						else{
							http.send(res,errcode,"room doesn't exist.");
						}
					});
				}
				else{
					http.send(res,err,"create failed.");					
				}
			});
		});
	});
});


//进入房间
app.get('/enter_private_room',function(req,res){
	var data = req.query;
    var roomId = data.roomid;
    //判断房间id是否存在
	if(roomId == null){
		http.send(res,-1,"parameters don't match api requirements.");
		return;
    }
    //判断账号是否是否不为空
	if(!check_account(req,res)){
		return;
	}
    //获取数据
	var account = data.account;
    //获取数据
	db.get_user_data(account,function(data){
		if(data == null){
			http.send(res,-1,"system error");
			return;
		}
		var userId = data.userid;
		var name = data.name;

		//验证玩家状态
		//todo
		//进入房间
		room_service.enterRoom(userId,name,roomId,function(errcode,enterInfo){
			if(enterInfo){
				var ret = {
					roomid:roomId,
					ip:enterInfo.ip,
					port:enterInfo.port,
					token:enterInfo.token,
					time:Date.now()
				};
				ret.sign = crypto.md5(roomId + ret.token + ret.time + config.ROOM_PRI_KEY);
				http.send(res,0,"ok",ret);
			}
			else{
				http.send(res,errcode,"enter room failed.");
			}
		});
	});
});

//获取历史记录
app.get('/get_history_list',function(req,res){
    var data = req.query; //数据合法性
    //账号合法性
	if(!check_account(req,res)){
		return;
    }
    //获取用户信息
	var account = data.account;
	db.get_user_data(account,function(data){
		if(data == null){
			http.send(res,-1,"system error");
			return;
		}
        var userId = data.userid;
        //数据库查询历史记录
		db.get_user_history(userId,function(history){
			http.send(res,0,"ok",{history:history});
		});
	});
});
//获取在哪个房间game
app.get('/get_games_of_room',function(req,res){
	var data = req.query;
    var uuid = data.uuid;
    //获取uuid
	if(uuid == null){
		http.send(res,-1,"parameters don't match api requirements.");
		return;
    }
    //账号合法性
	if(!check_account(req,res)){
		return;
    }
    //数据库查询
	db.get_games_of_room(uuid,function(data){
		console.log(data);
		http.send(res,0,"ok",{data:data});
	});
});

//获取游戏细节
app.get('/get_detail_of_game',function(req,res){
	var data = req.query;
	var uuid = data.uuid;
    var index = data.index;
    //判断是否为空
	if(uuid == null || index == null){
		http.send(res,-1,"parameters don't match api requirements.");
		return;
    }
    //验证账号合法性
	if(!check_account(req,res)){
		return;
    }
    //数据库获取细节
	db.get_detail_of_game(uuid,index,function(data){
		http.send(res,0,"ok",{data:data});
	});
});

//获取房卡状态
app.get('/get_user_status',function(req,res){
    //账号合法性
	if(!check_account(req,res)){
		return;
    }
    //获取房卡数量
	var account = req.query.account;
	db.get_gems(account,function(data){
		if(data != null){
			http.send(res,0,"ok",{gems:data.gems});	
		}
		else{
			http.send(res,1,"get gems failed.");
		}
	});
});

//获的notcie信息
app.get('/get_message',function(req,res){
	if(!check_account(req,res)){
		return;
    }
    //type
	var type = req.query.type;
	
	if(type == null){
		http.send(res,-1,"parameters don't match api requirements.");
		return;
	}
	//版本
    var version = req.query.version;
    //获取类型
	db.get_message(type,version,function(data){
		if(data != null){
			http.send(res,0,"ok",{msg:data.msg,version:data.version});	
		}
		else{
			http.send(res,1,"get message failed.");
		}
	});
});

//判断是否在线
app.get('/is_server_online',function(req,res){
	if(!check_account(req,res)){
		return;
    }
    //ip 端口
	var ip = req.query.ip;
    var port = req.query.port;
    //是否在线
	room_service.isServerOnline(ip,port,function(isonline){
		var ret = {
			isonline:isonline
		};
		http.send(res,0,"ok",ret);
	}); 
});

//==================== 俱乐部接口 ====================
//club名称防注入清洗(去引号反斜杠)
function cleanClubStr(s){
	return String(s).replace(/[\\'"]/g,"");
}

//我的俱乐部列表(附带是否代理,客户端据此显示创建按钮)
app.get('/club_list',function(req,res){
	if(!check_account(req,res)){
		return;
	}
	db.get_user_data(req.query.account,function(data){
		if(data == null){
			http.send(res,-1,"system error");
			return;
		}
		var userId = data.userid;
		db.is_agent(userId,function(isAgent){
			db.club_list_of_user(userId,function(clubs){
				http.send(res,0,"ok",{is_agent:isAgent,clubs:clubs});
			});
		});
	});
});

//创建俱乐部(仅代理可用)
app.get('/club_create',function(req,res){
	if(!check_account(req,res)){
		return;
	}
	var name = req.query.name;
	if(name == null || name.length == 0){
		http.send(res,-1,"club name required.");
		return;
	}
	db.get_user_data(req.query.account,function(data){
		if(data == null){
			http.send(res,-1,"system error");
			return;
		}
		db.is_agent(data.userid,function(isAgent){
			if(!isAgent){
				http.send(res,2,"only agent can create club.");
				return;
			}
			db.club_create(cleanClubStr(name),data.userid,function(clubId){
				if(clubId == null){
					http.send(res,1,"create failed.");
					return;
				}
				http.send(res,0,"ok",{clubid:clubId});
			});
		});
	});
});

//加入俱乐部(输入俱乐部ID)
app.get('/club_join',function(req,res){
	if(!check_account(req,res)){
		return;
	}
	var clubId = parseInt(req.query.clubid);
	if(!(clubId > 0)){
		http.send(res,-1,"clubid required.");
		return;
	}
	db.get_user_data(req.query.account,function(data){
		if(data == null){
			http.send(res,-1,"system error");
			return;
		}
		db.club_get(clubId,function(club){
			if(club == null){
				http.send(res,3,"club not found.");
				return;
			}
			db.club_join(clubId,data.userid,function(ok){
				if(!ok){
					http.send(res,1,"join failed.");
					return;
				}
				http.send(res,0,"ok",{clubid:clubId,name:club.name});
			});
		});
	});
});

//退出俱乐部(社长不可退)
app.get('/club_quit',function(req,res){
	if(!check_account(req,res)){
		return;
	}
	var clubId = parseInt(req.query.clubid);
	if(!(clubId > 0)){
		http.send(res,-1,"clubid required.");
		return;
	}
	db.get_user_data(req.query.account,function(data){
		if(data == null){
			http.send(res,-1,"system error");
			return;
		}
		db.club_get(clubId,function(club){
			if(club == null){
				http.send(res,3,"club not found.");
				return;
			}
			if(club.owner_userid == data.userid){
				http.send(res,4,"owner cannot quit.");
				return;
			}
			db.club_quit(clubId,data.userid,function(ok){
				http.send(res,ok?0:1,ok?"ok":"quit failed.");
			});
		});
	});
});

//俱乐部玩法列表(左侧列表,当前仅血战麻将)
app.get('/club_games',function(req,res){
	if(!check_account(req,res)){
		return;
	}
	var clubId = parseInt(req.query.clubid);
	if(!(clubId > 0)){
		http.send(res,-1,"clubid required.");
		return;
	}
	db.get_user_data(req.query.account,function(data){
		if(data == null){
			http.send(res,-1,"system error");
			return;
		}
		db.club_is_member(clubId,data.userid,function(isMember){
			if(!isMember){
				http.send(res,2,"not club member.");
				return;
			}
			//俱乐部玩法列表改读独立的俱乐部玩法表(t_club_games),支持先加玩法再加牌桌
			db.club_games_with_count(clubId,function(rows){
				var games = rows.filter(function(r){ return r.enabled == 1; }).map(function(r){
					//底分/局数选项下发给客户端,牌桌卡片按桌conf换算显示
					var difens = [], jushus = [];
					try{ difens = JSON.parse(r.difen_options) || []; }catch(e){}
					try{ jushus = JSON.parse(r.jushu_options) || []; }catch(e){}
					return {
						id:r.id,
						game_type:r.game_type,
						name:r.name,
						table_count:r.table_count,
						difen_options:difens,
						jushu_options:jushus,
						enabled:true
					};
				});
				http.send(res,0,"ok",{games:games});
			});
		});
	});
});

//俱乐部某玩法的桌面列表(右侧列表,带人数)
app.get('/club_tables',function(req,res){
	if(!check_account(req,res)){
		return;
	}
	var clubId = parseInt(req.query.clubid);
	var gameType = req.query.game_type;
	if(!(clubId > 0) || gameType == null){
		http.send(res,-1,"parameters don't match api requirements.");
		return;
	}
	db.get_user_data(req.query.account,function(data){
		if(data == null){
			http.send(res,-1,"system error");
			return;
		}
		db.club_is_member(clubId,data.userid,function(isMember){
			if(!isMember){
				http.send(res,2,"not club member.");
				return;
			}
			db.club_tables(clubId,gameType,function(tables){
				//注入清桌权限标记:仅俱乐部创建者可在牌桌卡片上看到"清空"按钮
				db.club_get(clubId,function(club){
					var isOwner = (club != null && club.owner_userid == data.userid);
					var rows = (tables || []).map(function(t){
						t.can_clear = isOwner;
						return t;
					});
					http.send(res,0,"ok",{tables:rows});
				});
			});
		});
	});
});

//俱乐部后台清空牌桌:仅俱乐部创建者可操作;解散牌桌绑定房间、踢出所有玩家并彻底释放占用,
//清空后被占用的玩家可自由进入其它房间
app.get('/club_clear_table',function(req,res){
	if(!check_account(req,res)){
		return;
	}
	var tableId = parseInt(req.query.tableid);
	if(!(tableId > 0)){
		http.send(res,-1,"tableid required.");
		return;
	}
	db.get_user_data(req.query.account,function(data){
		if(data == null){
			http.send(res,-1,"system error");
			return;
		}
		db.club_get_table(tableId,function(table){
			if(table == null){
				http.send(res,3,"table not found.");
				return;
			}
			db.club_get(table.club_id,function(club){
				if(club == null || club.owner_userid != data.userid){
					http.send(res,4,"only club owner can clear table.");
					return;
				}
				if(table.roomid == null){
					http.send(res,0,"ok");
					return;
				}
				var roomId = String(table.roomid);
				var finish = function(){
					db.club_set_table_room(tableId,null,function(){
						http.send(res,0,"ok");
					});
				};
				db.get_room_data(roomId,function(roomData){
					if(roomData == null){
						//房间已不存在(游戏服已销毁/重启丢失):直接解绑
						finish();
						return;
					}
					var sign = crypto.md5(roomId + config.ROOM_PRI_KEY);
					http.get(roomData.ip,roomData.port,"/clear_room",{roomid:roomId,sign:sign},function(ret,gdata){
						if(ret && gdata && gdata.errcode == 0){
							finish();
						}
						else{
							http.send(res,-2,"clear failed:" + ((gdata && gdata.errmsg) || "game server no response"));
						}
					});
				});
			});
		});
	});
});

//俱乐部桌面人数实时订阅:返回游戏服的socket连接地址(ip/port来自配置文件,不硬编码)
app.get('/club_subscribe_info',function(req,res){
	if(!check_account(req,res)){
		return;
	}
	//游戏服暴露给客户端的socket地址,由大厅服从配置读取后转发给客户端
	var ip = config.GAME_CLIENT_IP;
	var port = config.GAME_CLIENT_PORT;
	if(ip == null || port == null){
		http.send(res,1,"game server socket address not configured.");
		return;
	}
	http.send(res,0,"ok",{ip:ip,port:port});
});

//点击桌面进入游戏:复用桌面已绑定且未满的房间,否则按桌面配置建房并绑定
app.get('/club_enter_table',function(req,res){
	if(!check_account(req,res)){
		return;
	}
	var tableId = parseInt(req.query.tableid);
	if(!(tableId > 0)){
		http.send(res,-1,"tableid required.");
		return;
	}
	db.get_user_data(req.query.account,function(data){
		if(data == null){
			http.send(res,-1,"system error");
			return;
		}
		var userId = data.userid;
			var name = data.name;
			//房卡不足(0张)不允许进入桌面:与创建房间返回的2222保持一致,避免0房卡用户点击牌桌直接进桌
			if(!(data.gems > 0)){
				http.send(res,2222,"房卡不足，无法进入桌面");
				return;
			}
			db.club_get_table(tableId,function(table){
			if(table == null){
				http.send(res,3,"table not found.");
				return;
			}
			db.club_is_member(table.club_id,userId,function(isMember){
				if(!isMember){
					http.send(res,2,"not club member.");
					return;
				}
				db.get_room_id_of_user(userId,function(myRoomId){
					//仅当记录的房间正是本次点击桌面绑定的房间时才直接引导回去;
					//否则(如上一局残留的其它玩法房间,2人/4人场景前后端完全独立)必须先清除映射再按本桌面进桌,避免进错场景
					if(myRoomId != null && myRoomId == table.roomid){
						//已在本张桌面绑定的房间中,直接引导回去
						room_service.enterRoom(userId,name,myRoomId,function(errcode,enterInfo){
							if(enterInfo){
								var ret = {
									roomid:myRoomId,
									ip:enterInfo.ip,
									port:enterInfo.port,
									token:enterInfo.token,
									time:Date.now()
								};
								ret.sign = crypto.md5(ret.roomid + ret.token + ret.time + config.ROOM_PRI_KEY);
								http.send(res,0,"ok",ret);
							}
							else if(errcode == 5){
								//占用其他房间被拒:透传,不清映射不重建
								http.send(res,5,"你已在其他房间中，请先退出原房间再进入其它桌面");
							}
							else{
								//记录的房间已失效(如游戏服重启后丢失):清除残留映射,改走桌面绑定的正常进桌流程
								db.set_room_id_of_user(userId,null,function(){
									proceedTable();
								});
							}
						});
						return;
					}
					if(myRoomId != null){
						//残留的是别的房间(不同桌面/不同玩法):清除映射后走本次点击桌面的正常进桌流程
						db.set_room_id_of_user(userId,null,function(){
							proceedTable();
						});
						return;
					}
					proceedTable();
				});
				var proceedTable = function(){
					//建房时把俱乐部id与玩法写入房间conf,供游戏服在人数变化时定位 club_<clubid> 广播
					var clubConf = table.conf;
					try{
						var confObj = JSON.parse(table.conf) || {};
						confObj.clubid = table.club_id;
						confObj.game_type = table.game_type;
						clubConf = JSON.stringify(confObj);
					}catch(e){ clubConf = table.conf; }
					var tryEnter = function(roomId){
						room_service.enterRoom(userId,name,roomId,function(errcode,enterInfo){
							if(enterInfo){
								var ret = {
									roomid:roomId,
									ip:enterInfo.ip,
									port:enterInfo.port,
									token:enterInfo.token,
									time:Date.now()
								};
								ret.sign = crypto.md5(ret.roomid + ret.token + ret.time + config.ROOM_PRI_KEY);
								http.send(res,0,"ok",ret);
							}
							else if(errcode == 5){
								//玩家仍占用其他房间被游戏服拒绝:直接透传错误码,
								//严禁解绑/重建(否则会陷入无限建房循环且破坏牌桌绑定)
								http.send(res,5,"你已在其他房间中，请先退出原房间再进入其它桌面");
							}
							else{
								//绑定房间已失效:解绑重建
								db.club_set_table_room(tableId,null,function(){
									createAndEnter();
								});
							}
						});
					};
					var createAndEnter = function(){
						room_service.createRoom(req.query.account,userId,clubConf,function(err,roomId){
							if(err == 0 && roomId != null){
								db.club_set_table_room(tableId,roomId,function(){
									tryEnter(roomId);
								});
							}
							else{
								//2222=房卡不足,单独提示,不再统一报create room failed
								http.send(res,err == null?1:err, err == 2222 ? "房卡不足，无法创建房间" : "create room failed.");
							}
						});
					};
					var reuseBoundRoom = function(){
						if(table.roomid == null){
							createAndEnter();
							return;
						}
						db.get_room_data(table.roomid,function(roomData){
							if(roomData == null){
								//房间已不存在,解除绑定重建
								db.club_set_table_room(tableId,null,function(){
									createAndEnter();
								});
								return;
							}
							var count = 0;
							//按该房间实际人数上限判断是否满员(2人桌不能用固定4判定)
							var maxPlayers = 2;
							try{
								var roomConf = JSON.parse(roomData.base_info) || {};
								maxPlayers = roomConf.maxPlayers || 2;
							}catch(e){ maxPlayers = 2; }
							for(var i = 0; i < maxPlayers; ++i){
								if(roomData["user_id" + i] > 0){
									count++;
								}
							}
							if(count >= maxPlayers){
								//该桌已满员:拒绝进入,不再另开新房间
								http.send(res,4,"该桌已满员，无法进入");
								return;
							}
							else{
								tryEnter(table.roomid);
							}
						});
					};
					reuseBoundRoom();
				};
			});
		});
	});
});

//初始化监听
exports.start = function($config){
	config = $config;
	app.listen(config.CLEINT_PORT);
	console.log("client service is listening on port " + config.CLEINT_PORT);
};