var mysql=require("mysql");  
var crypto = require('./crypto');

var pool = null;

function nop(a,b,c,d,e,f,g){

}
  
function generateUserId() {
    var Id = "";
    for (var i = 0; i < 6; ++i) {
        if (i > 0) {
            Id += Math.floor(Math.random() * 10);
        } else {
            Id += Math.floor(Math.random() * 9) + 1;
        }
    }
    return Id;
}

function query(sql,callback){  
    pool.getConnection(function(err,conn){  
        if(err){  
            callback(err,null,null);  
        }else{  
            conn.query(sql,function(qerr,vals,fields){  
                //释放连接  
                conn.release();  
                //事件驱动回调  
                callback(qerr,vals,fields);  
            });  
        }  
    });  
};

exports.init = function(config){
    pool = mysql.createPool({  
        host: config.HOST,
        user: config.USER,
        password: config.PSWD,
        database: config.DB,
        port: config.PORT,
    });
};

exports.is_account_exist = function(account,callback){
    callback = callback == null? nop:callback;
    if(account == null){
        callback(false);
        return;
    }

    var sql = 'SELECT * FROM t_accounts WHERE account = "' + account + '"';
    query(sql, function(err, rows, fields) {
        if (err) {
            callback(false);
            throw err;
        }
        else{
            if(rows.length > 0){
                callback(true);
            }
            else{
                callback(false);
            }
        }
    });
};

exports.create_account = function(account,password,callback){
    callback = callback == null? nop:callback;
    if(account == null || password == null){
        callback(false);
        return;
    }

    var psw = crypto.md5(password);
    var sql = 'INSERT INTO t_accounts(account,password) VALUES("' + account + '","' + psw + '")';
    query(sql, function(err, rows, fields) {
        if (err) {
            if(err.code == 'ER_DUP_ENTRY'){
                callback(false);
                return;         
            }
            callback(false);
            throw err;
        }
        else{
            callback(true);            
        }
    });
};

exports.get_account_info = function(account,password,callback){
    callback = callback == null? nop:callback;
    if(account == null){
        callback(null);
        return;
    }  

    var sql = 'SELECT * FROM t_accounts WHERE account = "' + account + '"';
    query(sql, function(err, rows, fields) {
        if (err) {
            callback(null);
            throw err;
        }
        
        if(rows.length == 0){
            callback(null);
            return;
        }
        
        if(password != null){
            var psw = crypto.md5(password);
            if(rows[0].password == psw){
                callback(null);
                return;
            }    
        }

        callback(rows[0]);
    }); 
};

exports.is_user_exist = function(account,callback){
    callback = callback == null? nop:callback;
    if(account == null){
        callback(false);
        return;
    }

    var sql = 'SELECT userid FROM t_users WHERE account = "' + account + '"';
    query(sql, function(err, rows, fields) {
        if (err) {
            throw err;
        }

        if(rows.length == 0){
            callback(false);
            return;
        }

        callback(true);
    });  
}


exports.get_user_data = function(account,callback){
    callback = callback == null? nop:callback;
    if(account == null){
        callback(null);
        return;
    }

    var sql = 'SELECT userid,account,name,lv,exp,coins,gems,roomid FROM t_users WHERE account = "' + account + '"';
    query(sql, function(err, rows, fields) {
        if (err) {
            callback(null);
            throw err;
        }

        if(rows.length == 0){
            callback(null);
            return;
        }
        rows[0].name = crypto.fromBase64(rows[0].name);
        callback(rows[0]);
    });
};

exports.get_user_data_by_userid = function(userid,callback){
    callback = callback == null? nop:callback;
    if(userid == null){
        callback(null);
        return;
    }

    var sql = 'SELECT userid,account,name,lv,exp,coins,gems,roomid FROM t_users WHERE userid = ' + userid;
    query(sql, function(err, rows, fields) {
        if (err) {
            callback(null);
            throw err;
        }

        if(rows.length == 0){
            callback(null);
            return;
        }
        rows[0].name = crypto.fromBase64(rows[0].name);
        callback(rows[0]);
    });
};

/**增加玩家房卡 */
exports.add_user_gems = function(userid,gems,callback){
    callback = callback == null? nop:callback;
    if(userid == null){
        callback(false);
        return;
    }
    
    var sql = 'UPDATE t_users SET gems = gems +' + gems + ' WHERE userid = ' + userid;
    console.log(sql);
    query(sql,function(err,rows,fields){
        if(err){
            console.log(err);
            callback(false);
            return;
        }
        else{
            callback(rows.affectedRows > 0);
            return; 
        } 
    });
};

exports.get_gems = function(account,callback){
    callback = callback == null? nop:callback;
    if(account == null){
        callback(null);
        return;
    }

    var sql = 'SELECT gems FROM t_users WHERE account = "' + account + '"';
    query(sql, function(err, rows, fields) {
        if (err) {
            callback(null);
            throw err;
        }

        if(rows.length == 0){
            callback(null);
            return;
        }

        callback(rows[0]);
    });
}; 

exports.get_user_history = function(userId,callback){
    callback = callback == null? nop:callback;
    if(userId == null){
        callback(null);
        return;
    }

    var sql = 'SELECT history FROM t_users WHERE userid = "' + userId + '"';
    query(sql, function(err, rows, fields) {
        if (err) {
            callback(null);
            throw err;
        }

        if(rows.length == 0){
            callback(null);
            return;
        }
        var history = rows[0].history;
        if(history == null || history == ""){
            callback(null);    
        }
        else{
            console.log(history.length);
            history = JSON.parse(history);
            callback(history);
        }        
    });
};

exports.update_user_history = function(userId,history,callback){
    callback = callback == null? nop:callback;
    if(userId == null || history == null){
        callback(false);
        return;
    }

    history = JSON.stringify(history);
    var sql = 'UPDATE t_users SET roomid = null, history = \'' + history + '\' WHERE userid = "' + userId + '"';
    //console.log(sql);
    query(sql, function(err, rows, fields) {
        if (err) {
            callback(false);
            throw err;
        }

        if(rows.length == 0){
            callback(false);
            return;
        }

        callback(true);
    });
};

exports.get_games_of_room = function(room_uuid,callback){
    callback = callback == null? nop:callback;
    if(room_uuid == null){
        callback(null);
        return;
    }

    var sql = 'SELECT game_index,create_time,result FROM t_games_archive WHERE room_uuid = "' + room_uuid + '"';
    //console.log(sql);
    query(sql, function(err, rows, fields) {
        if (err) {
            callback(null);
            throw err;
        }

        if(rows.length == 0){
            callback(null);
            return;
        }

        callback(rows);
    });
};

exports.get_detail_of_game = function(room_uuid,index,callback){
    callback = callback == null? nop:callback;
    if(room_uuid == null || index == null){
        callback(null);
        return;
    }
    var sql = 'SELECT base_info,action_records FROM t_games_archive WHERE room_uuid = "' + room_uuid + '" AND game_index = ' + index ;
    //console.log(sql);
    query(sql, function(err, rows, fields) {
        if (err) {
            callback(null);
            throw err;
        }

        if(rows.length == 0){
            callback(null);
            return;
        }
        callback(rows[0]);
    });
}

exports.create_user = function(account,name,coins,gems,sex,headimg,callback){
    callback = callback == null? nop:callback;
    if(account == null || name == null || coins==null || gems==null){
        callback(false);
        return;
    }
    if(headimg){
        headimg = '"' + headimg + '"';
    }
    else{
        headimg = 'null';
    }
    name = crypto.toBase64(name);
    var userId = generateUserId();

    var sql = 'INSERT INTO t_users(userid,account,name,coins,gems,sex,headimg) VALUES("{0}", "{1}","{2}",{3},{4},{5},{6})';
    sql = sql.format(userId,account,name,coins,gems,sex,headimg);
    console.log(sql);
    query(sql, function(err, rows, fields) {
        if (err) {
            throw err;
        }
        callback(true);
    });
};

exports.update_user_info = function(userid,name,headimg,sex,callback){
    callback = callback == null? nop:callback;
    if(userid == null){
        callback(null);
        return;
    }
 
    if(headimg){
        headimg = '"' + headimg + '"';
    }
    else{
        headimg = 'null';
    }
    name = crypto.toBase64(name);
    var sql = 'UPDATE t_users SET name="{0}",headimg={1},sex={2} WHERE account="{3}"';
    sql = sql.format(name,headimg,sex,userid);
    console.log(sql);
    query(sql, function(err, rows, fields) {
        if (err) {
            throw err;
        }
        callback(rows);
    });
};

exports.get_user_base_info = function(userid,callback){
    callback = callback == null? nop:callback;
    if(userid == null){
        callback(null);
        return;
    }
    var sql = 'SELECT name,sex,headimg FROM t_users WHERE userid={0}';
    sql = sql.format(userid);
    console.log(sql);
    query(sql, function(err, rows, fields) {
        if (err) {
            throw err;
        }
        rows[0].name = crypto.fromBase64(rows[0].name);
        callback(rows[0]);
    });
};

exports.is_room_exist = function(roomId,callback){
    callback = callback == null? nop:callback;
    var sql = 'SELECT * FROM t_rooms WHERE id = "' + roomId + '"';
    query(sql, function(err, rows, fields) {
        if(err){
            callback(false);
            throw err;
        }
        else{
            callback(rows.length > 0);
        }
    });
};

exports.cost_gems = function(userid,cost,callback){
    callback = callback == null? nop:callback;
    var sql = 'UPDATE t_users SET gems = gems -' + cost + ' WHERE userid = ' + userid;
    console.log(sql);
    query(sql, function(err, rows, fields) {
        if(err){
            callback(false);
            throw err;
        }
        else{
            callback(rows.length > 0);
        }
    });
};

//设置用户当前房间绑定:roomId=null时清空;oldRoomId传入时仅当当前绑定仍指向oldRoomId才清,
//防止"退出→立刻重进新房间"时退出线程的清绑定SQL后到误清新绑定(竞态)
exports.set_room_id_of_user = function(userId,roomId,oldRoomId,callback){
    if(typeof oldRoomId == 'function'){ callback = oldRoomId; oldRoomId = null; }
    callback = callback == null? nop:callback;
    if(roomId != null){
        roomId = '"' + roomId + '"';
    }
    var cond = 'userid = "' + userId + '"';
    if(roomId == null && oldRoomId != null){
        cond += ' AND roomid = "' + oldRoomId + '"';
    }
    var sql = 'UPDATE t_users SET roomid = '+ roomId + ' WHERE ' + cond;
    console.log(sql);
    query(sql, function(err, rows, fields) {
        if(err){
            console.log(err);
            callback(false);
            throw err;
        }
        else{
            callback(rows.length > 0);
        }
    });
};

exports.get_room_id_of_user = function(userId,callback){
    callback = callback == null? nop:callback;
    var sql = 'SELECT roomid FROM t_users WHERE userid = "' + userId + '"';
    query(sql, function(err, rows, fields) {
        if(err){
            callback(null);
            throw err;
        }
        else{
            if(rows.length > 0){
                callback(rows[0].roomid);
            }
            else{
                callback(null);
            }
        }
    });
};


exports.clear_user_room_id = function(userId,callback){
    callback = callback == null? nop:callback;
    var sql = 'UPDATE t_users SET roomid = null WHERE userid = "' + userId + '"';
    query(sql, function(err, rows, fields) {
        if(err){
            callback(false);
            throw err;
        }
        callback(true);
    });
};

exports.create_room = function(roomId,conf,ip,port,create_time,callback){
    callback = callback == null? nop:callback;
    var sql = "INSERT INTO t_rooms(uuid,id,base_info,ip,port,create_time) \
                VALUES('{0}','{1}','{2}','{3}',{4},{5})";
    var uuid = Date.now() + roomId;
    var baseInfo = JSON.stringify(conf);
    sql = sql.format(uuid,roomId,baseInfo,ip,port,create_time);
    console.log(sql);
    query(sql,function(err,row,fields){
        if(err){
            callback(null);
            throw err;
        }
        else{
            callback(uuid);
        }
    });
};

exports.get_room_uuid = function(roomId,callback){
    callback = callback == null? nop:callback;
    var sql = 'SELECT uuid FROM t_rooms WHERE id = "' + roomId + '"';
    query(sql,function(err,rows,fields){
        if(err){
            callback(null);
            throw err;
        }
        else{
            callback(rows[0].uuid);
        }
    });
};

exports.update_seat_info = function(roomId,seatIndex,userId,icon,name,callback){
    callback = callback == null? nop:callback;
    var sql = 'UPDATE t_rooms SET user_id{0} = {1},user_icon{0} = "{2}",user_name{0} = "{3}" WHERE id = "{4}"';
    name = crypto.toBase64(name);
    sql = sql.format(seatIndex,userId,icon,name,roomId);
    //console.log(sql);
    query(sql,function(err,row,fields){
        if(err){
            callback(false);
            throw err;
        }
        else{
            callback(true);
        }
    });
}

exports.update_num_of_turns = function(roomId,numOfTurns,callback){
    callback = callback == null? nop:callback;
    var sql = 'UPDATE t_rooms SET num_of_turns = {0} WHERE id = "{1}"'
    sql = sql.format(numOfTurns,roomId);
    //console.log(sql);
    query(sql,function(err,row,fields){
        if(err){
            callback(false);
            throw err;
        }
        else{
            callback(true);
        }
    });
};


exports.update_next_button = function(roomId,nextButton,callback){
    callback = callback == null? nop:callback;
    var sql = 'UPDATE t_rooms SET next_button = {0} WHERE id = "{1}"'
    sql = sql.format(nextButton,roomId);
    //console.log(sql);
    query(sql,function(err,row,fields){
        if(err){
            callback(false);
            throw err;
        }
        else{
            callback(true);
        }
    });
};

exports.get_room_addr = function(roomId,callback){
    callback = callback == null? nop:callback;
    if(roomId == null){
        callback(false,null,null);
        return;
    }

    var sql = 'SELECT ip,port FROM t_rooms WHERE id = "' + roomId + '"';
    query(sql, function(err, rows, fields) {
        if(err){
            callback(false,null,null);
            throw err;
        }
        if(rows.length > 0){
            callback(true,rows[0].ip,rows[0].port);
        }
        else{
            callback(false,null,null);
        }
    });
};

exports.get_room_data = function(roomId,callback){
    callback = callback == null? nop:callback;
    if(roomId == null){
        callback(null);
        return;
    }

    var sql = 'SELECT * FROM t_rooms WHERE id = "' + roomId + '"';
    query(sql, function(err, rows, fields) {
        if(err){
            callback(null);
            throw err;
        }
        if(rows.length > 0){
            for(var i = 0; i < 16; ++i){
                var k = "user_name" + i;
                if(rows[0][k] != null){
                    rows[0][k] = crypto.fromBase64(rows[0][k]);
                } else {
                    break;
                }
            }
            callback(rows[0]);
        }
        else{
            callback(null);
        }
    });
};

exports.delete_room = function(roomId,callback){

    callback = callback == null? nop:callback;
    if(roomId == null){
        callback(false);
    }
    var sql = "DELETE FROM t_rooms WHERE id = '{0}'";
    sql = sql.format(roomId);
    console.log(sql);
    query(sql,function(err,rows,fields){
        if(err){
            callback(false);
            throw err;
        }
        else{
            callback(true);
        }
    });
}

//删除所有房间记录(GS启动时内存房间为空,库内房间均为死房间)
exports.delete_all_rooms = function(callback){
    callback = callback == null? nop:callback;
    query('DELETE FROM t_rooms',function(err){
        if(err){ console.log(err); callback(false); return; }
        callback(true);
    });
};

//清空所有用户房间映射(配合delete_all_rooms清理死房间残留)
exports.clear_all_user_roomids = function(callback){
    callback = callback == null? nop:callback;
    query('UPDATE t_users SET roomid = NULL WHERE roomid IS NOT NULL',function(err){
        if(err){ console.log(err); callback(false); return; }
        callback(true);
    });
};

//清空所有俱乐部桌面的房间绑定
exports.clear_all_club_table_rooms = function(callback){
    callback = callback == null? nop:callback;
    query('UPDATE t_club_tables SET roomid = NULL WHERE roomid IS NOT NULL',function(err){
        if(err){ console.log(err); callback(false); return; }
        callback(true);
    });
};

exports.create_game = function(room_uuid,index,base_info,callback){
    callback = callback == null? nop:callback;
    var sql = "INSERT INTO t_games(room_uuid,game_index,base_info,create_time) VALUES('{0}',{1},'{2}',unix_timestamp(now())) ON DUPLICATE KEY UPDATE base_info=VALUES(base_info)";
    sql = sql.format(room_uuid,index,base_info);
    //console.log(sql);
    query(sql,function(err,rows,fields){
        if(err){
            callback(null);
            console.log("create_game error:", err.message);
        }
        else{
            callback(rows.insertId);
        }
    });
};

exports.delete_games = function(room_uuid,callback){
    callback = callback == null? nop:callback;
    if(room_uuid == null){
        callback(false);
    }    
    var sql = "DELETE FROM t_games WHERE room_uuid = '{0}'";
    sql = sql.format(room_uuid);
    console.log(sql);
    query(sql,function(err,rows,fields){
        if(err){
            callback(false);
            throw err;
        }
        else{
            callback(true);
        }
    });
}

exports.archive_games = function(room_uuid,callback){
    callback = callback == null? nop:callback;
    if(room_uuid == null){
        callback(false);
    }
    var sql = "INSERT INTO t_games_archive(SELECT * FROM t_games WHERE room_uuid = '{0}')";
    sql = sql.format(room_uuid);
    console.log(sql);
    query(sql,function(err,rows,fields){
        if(err){
            callback(false);
            throw err;
        }
        else{
            exports.delete_games(room_uuid,function(ret){
                callback(ret);
            });
        }
    });
}

exports.update_game_action_records = function(room_uuid,index,actions,callback){
    callback = callback == null? nop:callback;
    var sql = "UPDATE t_games SET action_records = '"+ actions +"' WHERE room_uuid = '" + room_uuid + "' AND game_index = " + index ;
    //console.log(sql);
    query(sql,function(err,rows,fields){
        if(err){
            callback(false);
            throw err;
        }
        else{
            callback(true);
        }
    });
};

exports.update_game_result = function(room_uuid,index,result,callback){
    callback = callback == null? nop:callback;
    if(room_uuid == null || !result){
        callback(false);
        return;
    }
    
    var sql = "UPDATE t_games SET result = '"+ result +"' WHERE room_uuid = '" + room_uuid + "' AND game_index = " + index ;
    //console.log(sql);
    query(sql,function(err,rows,fields){
        if(err){
            callback(false);
            throw err;
        }
        else{
            callback(true);
        }
    });
};

exports.get_message = function(type,version,callback){
    callback = callback == null? nop:callback;
    
    var sql = 'SELECT * FROM t_message WHERE type = "'+ type + '"';
    
    if(version == "null"){
        version = null;
    }
    
    if(version){
        version = '"' + version + '"';
        sql += ' AND version != ' + version;   
    }
     
    query(sql, function(err, rows, fields) {
        if(err){
            callback(false);
            throw err;
        }
        else{
            if(rows.length > 0){
                callback(rows[0]);    
            }
            else{
                callback(null);
            }
        }
    });
};

exports.query = query;

/*==================== 俱乐部相关 ====================*/
//查询用户是否代理
exports.is_agent = function(userid,callback){
    callback = callback == null? nop:callback;
    if(userid == null){
        callback(false);
        return;
    }
    var sql = 'SELECT is_agent FROM t_users WHERE userid = ' + userid;
    query(sql, function(err, rows){
        if(err || rows.length == 0){
            callback(false);
            return;
        }
        callback(rows[0].is_agent == 1);
    });
};

//创建俱乐部(仅代理),俱乐部ID为6位数字(客户端加入俱乐部弹窗输入6位)
exports.club_create = function(name,ownerUserid,callback){
    callback = callback == null? nop:callback;
    var createTime = Math.ceil(Date.now()/1000);
    var tries = 0;
    var attempt = function(){
        tries++;
        var clubId = 100000 + Math.floor(Math.random()*900000); //6位俱乐部ID
        var sql = 'INSERT INTO t_clubs(id,name,owner_userid,create_time) VALUES(' + clubId + ',"' + name + '",' + ownerUserid + ',' + createTime + ')';
        query(sql, function(err, rows){
            if(err){
                if(err.code == 'ER_DUP_ENTRY' && tries < 20){ attempt(); return; } //ID冲突重试
                console.log(err);
                callback(null);
                return;
            }
            //创建者自动加入为成员
            var sql2 = 'INSERT IGNORE INTO t_club_members(club_id,userid,join_time) VALUES(' + clubId + ',' + ownerUserid + ',' + createTime + ')';
            query(sql2, function(){ });
            callback(clubId);
        });
    };
    attempt();
};

//查询单个俱乐部
exports.club_get = function(clubId,callback){
    callback = callback == null? nop:callback;
    if(clubId == null){
        callback(null);
        return;
    }
    var sql = 'SELECT * FROM t_clubs WHERE id = ' + clubId;
    query(sql, function(err, rows){
        if(err || rows.length == 0){
            callback(null);
            return;
        }
        callback(rows[0]);
    });
};

//判断是否俱乐部成员
exports.club_is_member = function(clubId,userid,callback){
    callback = callback == null? nop:callback;
    if(clubId == null || userid == null){
        callback(false);
        return;
    }
    var sql = 'SELECT userid FROM t_club_members WHERE club_id = ' + clubId + ' AND userid = ' + userid;
    query(sql, function(err, rows){
        if(err){
            callback(false);
            return;
        }
        callback(rows.length > 0);
    });
};

//加入俱乐部
exports.club_join = function(clubId,userid,callback){
    callback = callback == null? nop:callback;
    var joinTime = Math.ceil(Date.now()/1000);
    var sql = 'INSERT IGNORE INTO t_club_members(club_id,userid,join_time) VALUES(' + clubId + ',' + userid + ',' + joinTime + ')';
    query(sql, function(err, rows){
        if(err){
            console.log(err);
            callback(false);
            return;
        }
        callback(rows.affectedRows > 0 || rows.insertId > 0);
    });
};

//退出俱乐部(普通成员)
exports.club_quit = function(clubId,userid,callback){
    callback = callback == null? nop:callback;
    var sql = 'DELETE FROM t_club_members WHERE club_id = ' + clubId + ' AND userid = ' + userid;
    query(sql, function(err, rows){
        callback(!err && rows.affectedRows > 0);
    });
};

//我的俱乐部列表(含成员数)
exports.club_list_of_user = function(userid,callback){
    callback = callback == null? nop:callback;
    var sql = 'SELECT c.id,c.name,c.owner_userid,c.create_time,'
        + '(SELECT COUNT(*) FROM t_club_members m WHERE m.club_id = c.id) AS member_count '
        + 'FROM t_clubs c JOIN t_club_members m2 ON m2.club_id = c.id AND m2.userid = ' + userid
        + ' ORDER BY c.id DESC';
    query(sql, function(err, rows){
        if(err){
            console.log(err);
            callback([]);
            return;
        }
        callback(rows);
    });
};

//后台添加俱乐部桌面
exports.club_add_table = function(clubId,gameType,name,conf,callback){
    callback = callback == null? nop:callback;
    var createTime = Math.ceil(Date.now()/1000);
    //conf为JSON字符串含双引号,需SQL转义
    var escConf = String(conf).replace(/\\/g,"\\\\").replace(/"/g,'\\"');
    var escName = String(name).replace(/\\/g,"\\\\").replace(/"/g,'\\"');
    var sql = 'INSERT INTO t_club_tables(club_id,game_type,name,conf,create_time) VALUES('
        + clubId + ',"' + gameType + '","' + escName + '","' + escConf + '",' + createTime + ')';
    query(sql, function(err, rows){
        if(err){
            console.log(err);
            callback(null);
            return;
        }
        callback(rows.insertId);
    });
};

//删除俱乐部桌面
exports.club_delete_table = function(tableId,callback){
    callback = callback == null? nop:callback;
    var sql = 'DELETE FROM t_club_tables WHERE id = ' + tableId;
    query(sql, function(err, rows){
        callback(!err && rows.affectedRows > 0);
    });
};

//俱乐部玩法列表(去重)
exports.club_game_types = function(clubId,callback){
    callback = callback == null? nop:callback;
    var sql = 'SELECT game_type,COUNT(*) AS table_count FROM t_club_tables WHERE club_id = ' + clubId + ' GROUP BY game_type ORDER BY game_type';
    query(sql, function(err, rows){
        if(err){
            callback([]);
            return;
        }
        callback(rows);
    });
};

//俱乐部某玩法的桌面列表(带当前人数)
exports.club_tables = function(clubId,gameType,callback){
    callback = callback == null? nop:callback;
    var sql = 'SELECT t.id,t.name,t.roomid,t.conf,'
        + 'IF(r.id IS NULL,0,(r.user_id0 > 0) + (r.user_id1 > 0) + (r.user_id2 > 0) + (r.user_id3 > 0)) AS player_count,'
        + 'r.num_of_turns,r.user_id0,r.user_id1,r.user_id2,r.user_id3 '
        + 'FROM t_club_tables t LEFT JOIN t_rooms r ON r.id = t.roomid '
        + 'WHERE t.club_id = ' + clubId + ' AND t.game_type = "' + gameType + '" ORDER BY t.id';
    query(sql, function(err, rows){
        if(err){
            console.log(err);
            callback([]);
            return;
        }
        callback(rows);
    });
};

//查询桌面
exports.club_get_table = function(tableId,callback){
    callback = callback == null? nop:callback;
    if(tableId == null){
        callback(null);
        return;
    }
    var sql = 'SELECT * FROM t_club_tables WHERE id = ' + tableId;
    query(sql, function(err, rows){
        if(err || rows.length == 0){
            callback(null);
            return;
        }
        callback(rows[0]);
    });
};

//绑定桌面当前房间
exports.club_set_table_room = function(tableId,roomId,callback){
    callback = callback == null? nop:callback;
    var sql = 'UPDATE t_club_tables SET roomid = ' + (roomId != null ? ('"' + roomId + '"') : 'NULL') + ' WHERE id = ' + tableId;
    query(sql, function(err){
        callback(!err);
    });
};

//按房间号解绑牌桌:房间销毁/释放时调用,把所有绑定到该房间的牌桌roomid置NULL,
//避免牌桌列表LEFT JOIN出已销毁房间的旧座位数据导致"牌桌一直显示被占用"
exports.club_unbind_room = function(roomId,callback){
    callback = callback == null? nop:callback;
    if(roomId == null){
        callback(false);
        return;
    }
    var sql = "UPDATE t_club_tables SET roomid = NULL WHERE roomid = '{0}'".format(roomId);
    query(sql, function(err){
        if(err){ console.log(err); }
        callback(!err);
    });
};

/*==================== 俱乐部玩法(独立表)/后台管理 ====================*/
//带参数的查询(防注入)
function queryP(sql,params,callback){
    callback = callback == null? nop:callback;
    pool.getConnection(function(err,conn){
        if(err){
            callback(err,null);
            return;
        }
        conn.query(sql,params,function(qerr,vals,fields){
            conn.release();
            callback(qerr,vals,fields);
        });
    });
}

//俱乐部玩法列表(含该玩法下的牌桌数/人数上限)
exports.club_games_with_count = function(clubId,callback){
    callback = callback == null? nop:callback;
    //联表全局玩法配置取max_players,供后台按玩法人数上限渲染(2人玩法不出现4人相关项)
    var sql = 'SELECT g.*, c.max_players AS max_players, '
        + '(SELECT COUNT(*) FROM t_club_tables t WHERE t.club_id = g.club_id AND t.game_type = g.game_type) AS table_count '
        + 'FROM t_club_games g LEFT JOIN t_game_config c ON c.type = g.game_type WHERE g.club_id = ? ORDER BY g.sort,g.id';
    queryP(sql,[clubId],function(err,rows){
        if(err){ console.log(err); callback([]); return; }
        callback(rows);
    });
};

//单个俱乐部玩法
exports.club_game_get = function(id,callback){
    callback = callback == null? nop:callback;
    queryP('SELECT * FROM t_club_games WHERE id = ?',[id],function(err,rows){
        if(err || rows.length == 0){ callback(null); return; }
        callback(rows[0]);
    });
};

//新增俱乐部玩法
exports.club_game_add = function(clubId,gameType,name,difen,jushu,cost,sort,callback){
    callback = callback == null? nop:callback;
    var createTime = Math.ceil(Date.now()/1000);
    var sql = 'INSERT INTO t_club_games(club_id,game_type,name,difen_options,jushu_options,cost_options,sort,enabled,create_time) VALUES(?,?,?,?,?,?,?,1,?)';
    queryP(sql,[clubId,gameType,name,JSON.stringify(difen),JSON.stringify(jushu),JSON.stringify(cost),sort||0,createTime],function(err,rows){
        if(err){ console.log(err); callback(null); return; }
        callback(rows.insertId);
    });
};

//更新俱乐部玩法
exports.club_game_update = function(id,fields,callback){
    callback = callback == null? nop:callback;
    var sets = [];
    var params = [];
    if(fields.name != null){ sets.push('name = ?'); params.push(fields.name); }
    if(fields.difen_options){ sets.push('difen_options = ?'); params.push(JSON.stringify(fields.difen_options)); }
    if(fields.jushu_options){ sets.push('jushu_options = ?'); params.push(JSON.stringify(fields.jushu_options)); }
    if(fields.cost_options){ sets.push('cost_options = ?'); params.push(JSON.stringify(fields.cost_options)); }
    if(fields.sort != null){ sets.push('sort = ?'); params.push(fields.sort); }
    if(fields.enabled != null){ sets.push('enabled = ?'); params.push(fields.enabled ? 1 : 0); }
    if(sets.length == 0){ callback(false); return; }
    params.push(id);
    queryP('UPDATE t_club_games SET ' + sets.join(',') + ' WHERE id = ?',params,function(err,rows){
        if(err){ console.log(err); callback(false); return; }
        callback(rows.affectedRows > 0);
    });
};

//删除俱乐部玩法(连同该玩法下的牌桌)
exports.club_game_delete = function(id,callback){
    callback = callback == null? nop:callback;
    exports.club_game_get(id,function(g){
        if(g == null){ callback(false); return; }
        queryP('DELETE FROM t_club_tables WHERE club_id = ? AND game_type = ?',[g.club_id,g.game_type],function(){
            queryP('DELETE FROM t_club_games WHERE id = ?',[id],function(err,rows){
                if(err){ console.log(err); callback(false); return; }
                callback(rows.affectedRows > 0);
            });
        });
    });
};

//俱乐部成员列表(含房卡)
exports.club_members = function(clubId,callback){
    callback = callback == null? nop:callback;
    var sql = 'SELECT u.userid,u.account,u.name,u.gems,m.join_time FROM t_club_members m '
        + 'LEFT JOIN t_users u ON u.userid = m.userid WHERE m.club_id = ? ORDER BY m.join_time DESC';
    queryP(sql,[clubId],function(err,rows){
        if(err){ console.log(err); callback([]); return; }
        rows.forEach(function(r){ if(r.name){ r.name = crypto.fromBase64(r.name); } });
        callback(rows);
    });
};

//俱乐部管理员给成员增减房卡(仅限本俱乐部成员)
exports.club_member_gems = function(clubId,userid,gems,callback){
    callback = callback == null? nop:callback;
    exports.club_is_member(clubId,userid,function(isMember){
        if(!isMember){ callback(false,'not_member'); return; }
        exports.add_user_gems(userid,gems,function(ok){
            callback(ok,ok?null:'failed');
        });
    });
};

//后台:俱乐部列表(含社长信息/成员数/玩法数/牌桌数)
exports.admin_club_list = function(callback){
    callback = callback == null? nop:callback;
    var sql = 'SELECT c.id,c.name,c.owner_userid,c.create_time,u.account AS owner_account,u.name AS owner_name,'
        + '(SELECT COUNT(*) FROM t_club_members m WHERE m.club_id = c.id) AS member_count,'
        + '(SELECT COUNT(*) FROM t_club_games g WHERE g.club_id = c.id) AS game_count,'
        + '(SELECT COUNT(*) FROM t_club_tables t WHERE t.club_id = c.id) AS table_count,'
        + '(SELECT GROUP_CONCAT(a.username) FROM t_admin_users a WHERE a.club_id = c.id) AS admin_names '
        + 'FROM t_clubs c LEFT JOIN t_users u ON u.userid = c.owner_userid ORDER BY c.id DESC';
    query(sql,function(err,rows){
        if(err){ console.log(err); callback([]); return; }
        rows.forEach(function(r){ if(r.owner_name){ r.owner_name = crypto.fromBase64(r.owner_name); } });
        callback(rows);
    });
};

//后台:添加俱乐部(并把社长加入成员表),俱乐部ID为6位数字(客户端加入俱乐部弹窗输入6位)
exports.admin_club_add = function(name,ownerUserid,callback){
    callback = callback == null? nop:callback;
    var createTime = Math.ceil(Date.now()/1000);
    var tries = 0;
    var attempt = function(){
        tries++;
        var clubId = 100000 + Math.floor(Math.random()*900000); //6位俱乐部ID
        queryP('INSERT INTO t_clubs(id,name,owner_userid,create_time) VALUES(?,?,?,?)',[clubId,name,ownerUserid,createTime],function(err,rows){
            if(err){
                if(err.code == 'ER_DUP_ENTRY' && tries < 20){ attempt(); return; } //ID冲突重试
                console.log(err); callback(null); return;
            }
            queryP('INSERT IGNORE INTO t_club_members(club_id,userid,join_time) VALUES(?,?,?)',[clubId,ownerUserid,createTime],function(){});
            callback(clubId);
        });
    };
    attempt();
};

//后台:修改俱乐部(名称/社长)
exports.admin_club_update = function(id,name,ownerUserid,callback){
    callback = callback == null? nop:callback;
    var sets = [];
    var params = [];
    if(name != null){ sets.push('name = ?'); params.push(name); }
    if(ownerUserid != null){ sets.push('owner_userid = ?'); params.push(ownerUserid); }
    if(sets.length == 0){ callback(false); return; }
    params.push(id);
    queryP('UPDATE t_clubs SET ' + sets.join(',') + ' WHERE id = ?',params,function(err,rows){
        if(err){ console.log(err); callback(false); return; }
        if(ownerUserid != null){
            var joinTime = Math.ceil(Date.now()/1000);
            queryP('INSERT IGNORE INTO t_club_members(club_id,userid,join_time) VALUES(?,?,?)',[id,ownerUserid,joinTime],function(){});
        }
        callback(rows.affectedRows > 0);
    });
};

//后台:删除俱乐部(连同成员/玩法/牌桌,并解绑其管理员)
exports.admin_club_delete = function(id,callback){
    callback = callback == null? nop:callback;
    queryP('DELETE FROM t_club_members WHERE club_id = ?',[id],function(){
        queryP('DELETE FROM t_club_tables WHERE club_id = ?',[id],function(){
            queryP('DELETE FROM t_club_games WHERE club_id = ?',[id],function(){
                queryP('UPDATE t_admin_users SET club_id = NULL WHERE club_id = ?',[id],function(){
                    queryP('DELETE FROM t_clubs WHERE id = ?',[id],function(err,rows){
                        if(err){ console.log(err); callback(false); return; }
                        callback(rows.affectedRows > 0);
                    });
                });
            });
        });
    });
};

//后台:管理员账号列表
exports.admin_user_list = function(callback){
    callback = callback == null? nop:callback;
    var sql = 'SELECT a.id,a.username,a.role,a.club_id,a.created_at,c.name AS club_name '
        + 'FROM t_admin_users a LEFT JOIN t_clubs c ON c.id = a.club_id ORDER BY a.id';
    query(sql,function(err,rows){
        if(err){ console.log(err); callback([]); return; }
        callback(rows);
    });
};

//后台:单个管理员账号
exports.admin_user_get = function(id,callback){
    callback = callback == null? nop:callback;
    queryP('SELECT * FROM t_admin_users WHERE id = ?',[id],function(err,rows){
        if(err || rows.length == 0){ callback(null); return; }
        callback(rows[0]);
    });
};

//后台:添加管理员账号(role=super 超级管理员 / club 俱乐部管理员,club管理员必须绑定club_id)
exports.admin_user_add = function(username,password,role,clubId,callback){
    callback = callback == null? nop:callback;
    var createTime = Math.ceil(Date.now()/1000);
    var sql = 'INSERT INTO t_admin_users(username,password,role,club_id,created_at) VALUES(?,?,?,?,?)';
    queryP(sql,[username,password,role,clubId == null ? null : clubId,createTime],function(err,rows){
        if(err){ console.log(err); callback(null,err); return; }
        callback(rows.insertId,null);
    });
};

//后台:更新管理员账号(密码/角色/绑定俱乐部)
exports.admin_user_update = function(id,fields,callback){
    callback = callback == null? nop:callback;
    var sets = [];
    var params = [];
    if(fields.password != null){ sets.push('password = ?'); params.push(fields.password); }
    if(fields.role != null){ sets.push('role = ?'); params.push(fields.role); }
    if(fields.club_id !== undefined){ sets.push('club_id = ?'); params.push(fields.club_id); }
    if(sets.length == 0){ callback(false); return; }
    params.push(id);
    queryP('UPDATE t_admin_users SET ' + sets.join(',') + ' WHERE id = ?',params,function(err,rows){
        if(err){ console.log(err); callback(false); return; }
        callback(rows.affectedRows > 0);
    });
};

//后台:删除管理员账号
exports.admin_user_delete = function(id,callback){
    callback = callback == null? nop:callback;
    queryP('DELETE FROM t_admin_users WHERE id = ?',[id],function(err,rows){
        if(err){ console.log(err); callback(false); return; }
        callback(rows.affectedRows > 0);
    });
};

//按用户名查管理员(用于校验唯一)
exports.admin_user_by_name = function(username,callback){
    callback = callback == null? nop:callback;
    queryP('SELECT * FROM t_admin_users WHERE username = ?',[username],function(err,rows){
        if(err || rows.length == 0){ callback(null); return; }
        callback(rows[0]);
    });
};

// 获取玩法配置
exports.get_game_config = function(type, callback){
    callback = callback == null? nop:callback;
    var sql = 'SELECT * FROM t_game_config WHERE type = "' + type + '"';
    query(sql, function(err, rows){
        if(err || rows.length == 0){
            callback(null);
            return;
        }
        var r = rows[0];
        callback({
            type: r.type,
            name: r.name,
            difen_options: JSON.parse(r.difen_options),
            jushu_options: JSON.parse(r.jushu_options),
            cost_options: JSON.parse(r.cost_options),
            chips_options: r.chips_options ? JSON.parse(r.chips_options) : null,
            max_players: r.max_players,
            max_tai: r.max_tai || 10,
            caishen_cpg: r.caishen_cpg != null ? r.caishen_cpg : 1,
            cai_chi: r.cai_chi != null ? r.cai_chi : (r.caishen_cpg != null ? r.caishen_cpg : 1),
            cai_peng: r.cai_peng != null ? r.cai_peng : (r.caishen_cpg != null ? r.caishen_cpg : 1),
            cai_gang: r.cai_gang != null ? r.cai_gang : (r.caishen_cpg != null ? r.caishen_cpg : 1),
            dianpao_hu: r.dianpao_hu != null ? r.dianpao_hu : 1,
            // 诸暨赖倒胡专属开关（t_game_config 里还没这些列时用兜底值）
            tianhu_di: r.tianhu_di != null ? r.tianhu_di : 1,
            cai_diao: r.cai_diao != null ? r.cai_diao : 1,
            // 包财神专属:每台包台分数（列不存在时用兜底值1）
            bao_tai_score: r.bao_tai_score != null ? r.bao_tai_score : 1,
            tai_rules: r.tai_rules ? JSON.parse(r.tai_rules) : null,
            auto_dissolve_seconds: r.auto_dissolve_seconds != null ? r.auto_dissolve_seconds : 300,
            enabled: r.enabled
        });
    });
};