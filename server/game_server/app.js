var http_service = require("./http_service");
var socket_service = require("./socket_service");

//从配置文件获取服务器信息
var configs = require(process.argv[2]);
var config = configs.game_server();

var db = require('../utils/db');
db.init(configs.mysql());

//服务重启后内存房间全部丢失,库内残留房间均为死房间:启动即清库,防止用户被残留映射卡在进房
db.delete_all_rooms();
db.clear_all_user_roomids();
db.clear_all_club_table_rooms();

//开启HTTP服务
http_service.start(config);

//开启外网SOCKET服务
socket_service.start(config);

//require('./gamemgr');