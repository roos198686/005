var express = require('express');
var path = require('path');
var crypto = require('../utils/crypto');
var db = require('../utils/db');
var http = require('../utils/http');

var app = express();
app.use(express.json());
// 静态文件：后台管理页面
app.use('/admin', express.static(path.join(__dirname, '..', 'admin')));
app.get('/', function(req, res){ res.redirect('/admin/index.html'); });

var config = null;
var tokenStore = {}; // 简单的内存 token 存储

// 跨域
app.all('*', function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Content-Type,X-Requested-With,Authorization");
    res.header("Access-Control-Allow-Methods","PUT,POST,GET,DELETE,OPTIONS");
    res.header("Content-Type", "application/json;charset=utf-8");
    if(req.method == "OPTIONS"){
        res.send(200);
    } else {
        next();
    }
});

function send(res, code, msg, data){
    res.send(JSON.stringify({code: code, msg: msg, data: data || null}));
}

// 认证中间件
function auth(req, res, next){
    var token = req.headers['authorization'] || req.query.token;
    if(!token || !tokenStore[token]){
        send(res, 401, "未登录");
        return;
    }
    req.adminUser = tokenStore[token];
    next();
}

exports.start = function(cfg){
    config = cfg;
    app.listen(config.ADMIN_API_PORT, config.ADMIN_API_IP);
    console.log("admin api is listening on " + config.ADMIN_API_IP + ":" + config.ADMIN_API_PORT);
};

// ============ 认证 ============
app.post('/admin/login', function(req, res){
    var username = req.body.username;
    var password = req.body.password;
    if(!username || !password){
        send(res, 1, "用户名或密码不能为空");
        return;
    }
    var psw = crypto.md5(password);
    var sql = 'SELECT * FROM t_admin_users WHERE username="' + username + '" AND password="' + psw + '"';
    db.query(sql, function(err, rows){
        if(err){
            send(res, 500, "数据库错误");
            return;
        }
        if(rows.length == 0){
            send(res, 1, "用户名或密码错误");
            return;
        }
        var token = crypto.md5(username + Date.now() + Math.random());
        tokenStore[token] = {id: rows[0].id, username: rows[0].username, role: rows[0].role, club_id: rows[0].club_id};
        var ret = {token: token, username: rows[0].username, role: rows[0].role, club_id: rows[0].club_id};
        if(rows[0].role == "club"){
            db.club_get(rows[0].club_id, function(club){
                ret.club_name = club ? club.name : null;
                send(res, 0, "ok", ret);
            });
            return;
        }
        send(res, 0, "ok", ret);
    });
});

app.post('/admin/logout', auth, function(req, res){
    var token = req.headers['authorization'];
    delete tokenStore[token];
    send(res, 0, "ok");
});

// ============ 玩法配置管理 ============
// 获取所有玩法配置
app.get('/admin/game_configs', auth, function(req, res){
    db.query('SELECT * FROM t_game_config ORDER BY sort ASC', function(err, rows){
        if(err){ send(res, 500, "数据库错误"); return; }
        var list = rows.map(function(r){
            return {
                id: r.id,
                type: r.type,
                name: r.name,
                difen_options: JSON.parse(r.difen_options),
                jushu_options: JSON.parse(r.jushu_options),
                cost_options: JSON.parse(r.cost_options),
                chips_options: r.chips_options ? JSON.parse(r.chips_options) : null,
                max_players: r.max_players,
                max_tai: r.max_tai,
                tai_rules: r.tai_rules ? JSON.parse(r.tai_rules) : null,
                caishen_cpg: r.caishen_cpg,
                cai_chi: r.cai_chi,
                cai_peng: r.cai_peng,
                cai_gang: r.cai_gang,
                dianpao_hu: r.dianpao_hu,
                tianhu_di: r.tianhu_di != null ? r.tianhu_di : 1,
                cai_diao: r.cai_diao != null ? r.cai_diao : 1,
                bao_tai_score: r.bao_tai_score != null ? r.bao_tai_score : 1,
                auto_dissolve_seconds: r.auto_dissolve_seconds != null ? r.auto_dissolve_seconds : 300,
                enabled: r.enabled,
                sort: r.sort
            };
        });
        send(res, 0, "ok", list);
    });
});

// 新增玩法
app.post('/admin/game_config', auth, function(req, res){
    var c = req.body;
    if(!c.type || !c.name){
        send(res, 1, "玩法类型和名称不能为空");
        return;
    }
    var difen = JSON.stringify(c.difen_options || [1,2,5]);
    var jushu = JSON.stringify(c.jushu_options || [4,8]);
    var cost = JSON.stringify(c.cost_options || [2,3]);
    var chips = JSON.stringify(c.chips_options || [1000,2000,5000]);
    var taiRules = c.tai_rules ? JSON.stringify(c.tai_rules) : null;
    var caiChi = c.cai_chi != null ? c.cai_chi : (c.caishen_cpg != null ? c.caishen_cpg : 1);
    var caiPeng = c.cai_peng != null ? c.cai_peng : (c.caishen_cpg != null ? c.caishen_cpg : 1);
    var caiGang = c.cai_gang != null ? c.cai_gang : (c.caishen_cpg != null ? c.caishen_cpg : 1);
    var dianpaoHu = c.dianpao_hu != null ? c.dianpao_hu : 1;
    var tianhuDi = c.tianhu_di != null ? c.tianhu_di : 1;
    var caiDiao = c.cai_diao != null ? c.cai_diao : 1;
    var baoTaiScore = c.bao_tai_score != null ? (parseInt(c.bao_tai_score) || 0) : 1;
    var autoDissolve = parseInt(c.auto_dissolve_seconds) || 300;
    var sql = 'INSERT INTO t_game_config(type,name,difen_options,jushu_options,cost_options,chips_options,max_players,max_tai,caishen_cpg,cai_chi,cai_peng,cai_gang,dianpao_hu,tianhu_di,cai_diao,bao_tai_score,auto_dissolve_seconds,tai_rules,enabled,sort) VALUES("'
        + c.type + '","' + c.name + '","' + difen + '","' + jushu + '","' + cost + '","' + chips + '",'
        + (c.max_players || 2) + ',' + (c.max_tai || 10) + ',' + (c.caishen_cpg != null ? c.caishen_cpg : 1) + ','
        + caiChi + ',' + caiPeng + ',' + caiGang + ',' + dianpaoHu + ',' + tianhuDi + ',' + caiDiao + ',' + baoTaiScore + ',' + autoDissolve + ','
        + (taiRules ? "'" + taiRules + "'" : 'NULL') + ','
        + (c.enabled ? 1 : 0) + ',' + (c.sort || 0) + ')';
    db.query(sql, function(err, result){
        if(err){ send(res, 500, "数据库错误: " + err.message); return; }
        send(res, 0, "ok");
    });
});

// 更新玩法
app.put('/admin/game_config/:id', auth, function(req, res){
    var id = req.params.id;
    var c = req.body;
    var sets = [];
    if(c.name != null) sets.push('name="' + c.name + '"');
    if(c.difen_options) sets.push('difen_options="' + JSON.stringify(c.difen_options) + '"');
    if(c.jushu_options) sets.push('jushu_options="' + JSON.stringify(c.jushu_options) + '"');
    if(c.cost_options) sets.push('cost_options="' + JSON.stringify(c.cost_options) + '"');
    if(c.chips_options) sets.push('chips_options="' + JSON.stringify(c.chips_options) + '"');
    if(c.max_players != null) sets.push('max_players=' + c.max_players);
    if(c.max_tai != null) sets.push('max_tai=' + c.max_tai);
    if(c.tai_rules != null) sets.push("tai_rules='" + JSON.stringify(c.tai_rules) + "'");
    if(c.caishen_cpg != null) sets.push('caishen_cpg=' + (c.caishen_cpg ? 1 : 0));
    if(c.cai_chi != null) sets.push('cai_chi=' + (c.cai_chi ? 1 : 0));
    if(c.cai_peng != null) sets.push('cai_peng=' + (c.cai_peng ? 1 : 0));
    if(c.cai_gang != null) sets.push('cai_gang=' + (c.cai_gang ? 1 : 0));
    if(c.dianpao_hu != null) sets.push('dianpao_hu=' + (c.dianpao_hu ? 1 : 0));
    if(c.tianhu_di != null) sets.push('tianhu_di=' + (c.tianhu_di ? 1 : 0));
    if(c.cai_diao != null) sets.push('cai_diao=' + (c.cai_diao ? 1 : 0));
    if(c.bao_tai_score != null) sets.push('bao_tai_score=' + (parseInt(c.bao_tai_score) || 0));
    if(c.auto_dissolve_seconds != null) sets.push('auto_dissolve_seconds=' + (parseInt(c.auto_dissolve_seconds) || 300));
    if(c.enabled != null) sets.push('enabled=' + (c.enabled ? 1 : 0));
    if(c.sort != null) sets.push('sort=' + c.sort);
    if(sets.length == 0){ send(res, 1, "无更新内容"); return; }
    var sql = 'UPDATE t_game_config SET ' + sets.join(',') + ' WHERE id=' + id;
    db.query(sql, function(err, result){
        if(err){ send(res, 500, "数据库错误"); return; }
        send(res, 0, "ok");
    });
});

// 删除玩法
app.delete('/admin/game_config/:id', auth, function(req, res){
    var id = req.params.id;
    db.query('DELETE FROM t_game_config WHERE id=' + id, function(err, result){
        if(err){ send(res, 500, "数据库错误"); return; }
        send(res, 0, "ok");
    });
});

// ============ 用户管理 ============
// 查询用户
app.get('/admin/users', auth, function(req, res){
    var keyword = req.query.keyword || '';
    var page = parseInt(req.query.page) || 1;
    var pageSize = parseInt(req.query.pageSize) || 20;
    var offset = (page - 1) * pageSize;
    var where = '';
    if(keyword){
        //昵称在库中是base64存储,中文昵称需转base64后匹配
        var kwName = /[^\x00-\x7F]/.test(keyword) ? Buffer.from(keyword, 'utf8').toString('base64') : keyword;
        where = ' WHERE userid LIKE "%' + keyword + '%" OR account LIKE "%' + keyword + '%" OR name LIKE "%' + kwName + '%"';
    }
    var countSql = 'SELECT COUNT(*) as total FROM t_users' + where;
    db.query(countSql, function(err, countRows){
        if(err){ send(res, 500, "数据库错误"); return; }
        var total = countRows[0].total;
        var sql = 'SELECT userid,account,name,sex,gems,coins,roomid FROM t_users' + where + ' ORDER BY userid DESC LIMIT ' + offset + ',' + pageSize;
        db.query(sql, function(err, rows){
            if(err){ send(res, 500, "数据库错误"); return; }
            rows.forEach(function(r){ if(r.name){ r.name = crypto.fromBase64(r.name); } });
            send(res, 0, "ok", {list: rows, total: total, page: page, pageSize: pageSize});
        });
    });
});

// 加减房卡（钻石）
app.post('/admin/user/gems', auth, function(req, res){
    var userid = req.body.userid;
    var gems = req.body.gems; // 正数加，负数减
    if(!userid || gems == null){
        send(res, 1, "参数错误");
        return;
    }
    db.add_user_gems(userid, gems, function(suc){
        if(suc){
            send(res, 0, "ok");
        } else {
            send(res, 1, "操作失败");
        }
    });
});

// ============ 系统配置 ============
app.get('/admin/sys_config', auth, function(req, res){
    db.query('SELECT * FROM t_sys_config', function(err, rows){
        if(err){ send(res, 500, "数据库错误"); return; }
        var map = {};
        rows.forEach(function(r){ map[r.k] = r.v; });
        send(res, 0, "ok", map);
    });
});

app.post('/admin/sys_config', auth, function(req, res){
    var items = req.body.items || {};
    var sqls = [];
    for(var k in items){
        sqls.push('("' + k + '","' + items[k] + '","")');
    }
    if(sqls.length == 0){ send(res, 1, "无数据"); return; }
    var sql = 'INSERT INTO t_sys_config(k,v,remark) VALUES ' + sqls.join(',') + ' ON DUPLICATE KEY UPDATE v=VALUES(v)';
    db.query(sql, function(err, result){
        if(err){ send(res, 500, "数据库错误"); return; }
        send(res, 0, "ok");
    });
});

// ============ 房间统计 ============
app.get('/admin/rooms/stats', auth, function(req, res){
    // 返回当前在线房间数（从 game_server 获取，这里简化为查数据库）
    db.query('SELECT COUNT(*) as total FROM t_rooms', function(err, rows){
        if(err){ send(res, 500, "数据库错误"); return; }
        send(res, 0, "ok", {online_rooms: rows[0].total});
    });
});

// ============ 战绩查询 ============
// 查询所有游戏记录
app.get('/admin/games', auth, function(req, res){
    var limit = parseInt(req.query.limit) || 50;
    var offset = parseInt(req.query.offset) || 0;
    var sql = 'SELECT g.*, r.id as room_id FROM t_games g LEFT JOIN t_rooms r ON g.room_uuid = r.uuid ORDER BY g.create_time DESC LIMIT ' + offset + ',' + limit;
    db.query(sql, function(err, rows){
        if(err){ send(res, 500, "数据库错误"); return; }
        // 解析 result 和 base_info
        rows.forEach(function(r){
            if(r.result){
                try { r.result = JSON.parse(r.result); } catch(e){}
            }
            if(r.base_info){
                try { r.base_info = JSON.parse(r.base_info); } catch(e){}
            }
        });
        send(res, 0, "ok", rows);
    });
});

// 查询某用户的战绩历史
app.get('/admin/history/:userId', auth, function(req, res){
    var userId = req.params.userId;
    db.get_user_history(userId, function(history){
        send(res, 0, "ok", history || []);
    });
});

// ============ 权限辅助 ============
// 超级管理员:拥有全部权限
function requireSuper(req, res, next){
    if(!req.adminUser || req.adminUser.role !== 'super'){
        send(res, 403, "需要超级管理员权限");
        return;
    }
    next();
}

// 校验是否可操作指定俱乐部:超级管理员可操作任意俱乐部,俱乐部管理员只能操作自己绑定的
function checkClubOwn(req, res, clubId){
    if(!req.adminUser){ send(res, 403, "未登录"); return false; }
    if(req.adminUser.role === 'super') return true;
    if(req.adminUser.role === 'club' && req.adminUser.club_id != null && req.adminUser.club_id == clubId) return true;
    send(res, 403, "无权操作该俱乐部");
    return false;
}

// 解析当前操作的俱乐部ID:超级管理员取请求参数club_id,俱乐部管理员固定为自己的俱乐部
function resolveClubId(req, res){
    if(!req.adminUser){ send(res, 403, "未登录"); return null; }
    if(req.adminUser.role === 'super'){
        var cid = parseInt(req.query.club_id || (req.body && req.body.club_id));
        if(!(cid > 0)){ send(res, 1, "club_id required"); return null; }
        return cid;
    }
    if(req.adminUser.role === 'club'){
        if(!(req.adminUser.club_id > 0)){ send(res, 403, "该账号未绑定俱乐部"); return null; }
        return req.adminUser.club_id;
    }
    send(res, 403, "无权限");
    return null;
}

// ============ 俱乐部内容管理(超级管理员/俱乐部管理员均可,按角色限权) ============
// 俱乐部信息
app.get('/admin/club_detail', auth, function(req, res){
    var cid = resolveClubId(req, res);
    if(!cid) return;
    db.club_get(cid, function(club){
        if(!club){ send(res, 1, "俱乐部不存在"); return; }
        send(res, 0, "ok", club);
    });
});

// 俱乐部玩法列表
app.get('/admin/club_games', auth, function(req, res){
    var cid = resolveClubId(req, res);
    if(!cid) return;
    db.club_games_with_count(cid, function(rows){
        var list = rows.map(function(r){
            return {
                id: r.id, club_id: r.club_id, game_type: r.game_type, name: r.name,
                difen_options: JSON.parse(r.difen_options),
                jushu_options: JSON.parse(r.jushu_options),
                cost_options: JSON.parse(r.cost_options),
                sort: r.sort, enabled: r.enabled, table_count: r.table_count,
                max_players: r.max_players
            };
        });
        send(res, 0, "ok", list);
    });
});

// 可添加的玩法(返回全局全部启用玩法,附带 added 标记,前端据此禁选已添加项)
app.get('/admin/club_available_games', auth, function(req, res){
    var cid = resolveClubId(req, res);
    if(!cid) return;
    db.query('SELECT type,name,difen_options,jushu_options,cost_options,max_players,sort FROM t_game_config WHERE enabled=1 ORDER BY sort', function(err, rows){
        if(err){ send(res, 500, "数据库错误"); return; }
        db.club_games_with_count(cid, function(used){
            var usedTypes = {};
            used.forEach(function(u){ usedTypes[u.game_type] = 1; });
            var list = rows.map(function(r){
                return {
                    type: r.type, name: r.name,
                    added: !!usedTypes[r.type],
                    difen_options: JSON.parse(r.difen_options),
                    jushu_options: JSON.parse(r.jushu_options),
                    cost_options: JSON.parse(r.cost_options),
                    max_players: r.max_players
                };
            });
            send(res, 0, "ok", list);
        });
    });
});

// 新增俱乐部玩法
app.post('/admin/club_game', auth, function(req, res){
    var cid = resolveClubId(req, res);
    if(!cid) return;
    var c = req.body || {};
    if(!c.game_type || !c.name){ send(res, 1, "玩法类型和名称不能为空"); return; }
    db.club_game_add(cid, c.game_type, c.name,
        c.difen_options || [1, 2, 5], c.jushu_options || [4, 8], c.cost_options || [2, 3],
        c.sort || 0, function(id){
            if(id == null){ send(res, 1, "添加失败(该玩法可能已存在)"); return; }
            send(res, 0, "ok", {id: id});
        });
});

// 修改俱乐部玩法
app.put('/admin/club_game/:id', auth, function(req, res){
    var id = parseInt(req.params.id);
    db.club_game_get(id, function(g){
        if(!g){ send(res, 1, "玩法不存在"); return; }
        if(!checkClubOwn(req, res, g.club_id)) return;
        db.club_game_update(id, req.body || {}, function(ok){
            send(res, ok ? 0 : 1, ok ? "ok" : "更新失败");
        });
    });
});

// 删除俱乐部玩法(连同该玩法下的牌桌)
app.delete('/admin/club_game/:id', auth, function(req, res){
    var id = parseInt(req.params.id);
    db.club_game_get(id, function(g){
        if(!g){ send(res, 1, "玩法不存在"); return; }
        if(!checkClubOwn(req, res, g.club_id)) return;
        db.club_game_delete(id, function(ok){
            send(res, ok ? 0 : 1, ok ? "ok" : "删除失败");
        });
    });
});

// 某玩法下的牌桌列表
app.get('/admin/club_tables', auth, function(req, res){
    var cid = resolveClubId(req, res);
    if(!cid) return;
    var gt = req.query.game_type;
    if(!gt){ send(res, 1, "game_type required"); return; }
    db.club_tables(cid, gt, function(rows){
        send(res, 0, "ok", rows);
    });
});

// 新增牌桌
app.post('/admin/club_table', auth, function(req, res){
    var cid = resolveClubId(req, res);
    if(!cid) return;
    var c = req.body || {};
    if(!c.game_type || !c.name){ send(res, 1, "玩法类型和牌桌名称不能为空"); return; }
    if(!checkClubOwn(req, res, cid)) return;
    var conf = c.conf;
    if(conf == null || conf === ''){ conf = {type: c.game_type, difen: 0, jushuxuanze: 0}; }
    if(typeof conf !== 'string'){ conf = JSON.stringify(conf); }
    db.club_add_table(cid, c.game_type, c.name, conf, function(id){
        if(id == null){ send(res, 1, "添加失败"); return; }
        send(res, 0, "ok", {id: id});
    });
});

// 删除牌桌
app.delete('/admin/club_table/:id', auth, function(req, res){
    var id = parseInt(req.params.id);
    db.club_get_table(id, function(t){
        if(!t){ send(res, 1, "牌桌不存在"); return; }
        if(!checkClubOwn(req, res, t.club_id)) return;
        db.club_delete_table(id, function(ok){
            send(res, ok ? 0 : 1, ok ? "ok" : "删除失败");
        });
    });
});

// ============ 清空牌桌(强制释放房间占用) ============
//按牌桌清空:解散该牌桌绑定的房间,踢出所有玩家并释放占用;成功后解绑牌桌。
//超级管理员可清任意俱乐部,俱乐部管理员只能清自己俱乐部的牌桌
app.post('/admin/club_table/clear', auth, function(req, res){
    var c = req.body || {};
    var tableId = parseInt(c.tableid);
    var roomId = c.roomid != null ? String(c.roomid) : null;
    var priKey = (config && config.ROOM_PRI_KEY) ? config.ROOM_PRI_KEY : '~!@#$(*&^%$&';
    var callGameServer = function(rid, cb){
        db.get_room_data(rid, function(roomData){
            if(roomData == null){ cb(false, "房间不存在或已释放"); return; }
            var sign = crypto.md5(rid + priKey);
            http.get(roomData.ip, roomData.port, '/clear_room?roomid=' + rid + '&sign=' + sign, null, function(ret, data){
                cb(ret && data && data.errcode == 0, ret ? (data && data.errmsg) : "游戏服无响应");
            });
        });
    };
    if(tableId > 0){
        db.club_get_table(tableId, function(t){
            if(!t){ send(res, 1, "牌桌不存在"); return; }
            if(!checkClubOwn(req, res, t.club_id)) return;
            if(t.roomid == null){ send(res, 0, "ok"); return; }
            callGameServer(String(t.roomid), function(ok, why){
                if(ok){
                    db.club_set_table_room(tableId, null, function(){ send(res, 0, "ok"); });
                    return;
                }
                //房间已不存在(游戏服已销毁/重启丢失)时直接解绑也算成功
                db.get_room_data(String(t.roomid), function(rd){
                    if(rd == null){
                        db.club_set_table_room(tableId, null, function(){ send(res, 0, "ok"); });
                    }
                    else{
                        send(res, 1, why || "清空失败");
                    }
                });
            });
        });
        return;
    }
    if(roomId != null){
        if(req.adminUser.role !== 'super'){ send(res, 403, "仅超级管理员可按房间号清空"); return; }
        callGameServer(roomId, function(ok, why){
            if(ok){ send(res, 0, "ok"); } else { send(res, 1, why || "清空失败"); }
        });
        return;
    }
    send(res, 1, "tableid或roomid必填其一");
});

// 俱乐部成员列表(含房卡)
app.get('/admin/club_members', auth, function(req, res){
    var cid = resolveClubId(req, res);
    if(!cid) return;
    db.club_members(cid, function(rows){
        send(res, 0, "ok", rows);
    });
});

// 给本俱乐部成员增减房卡(仅限成员)
app.post('/admin/club_member/gems', auth, function(req, res){
    var cid = resolveClubId(req, res);
    if(!cid) return;
    var c = req.body || {};
    var userid = parseInt(c.userid);
    var gems = parseInt(c.gems);
    if(!(userid > 0) || isNaN(gems)){ send(res, 1, "参数错误"); return; }
    db.club_member_gems(cid, userid, gems, function(ok, why){
        if(ok){ send(res, 0, "ok"); return; }
        send(res, 1, why === 'not_member' ? "该用户不是本俱乐部成员" : "操作失败");
    });
});

// ============ 俱乐部管理(仅超级管理员) ============
app.get('/admin/clubs', auth, requireSuper, function(req, res){
    db.admin_club_list(function(rows){
        send(res, 0, "ok", rows);
    });
});

app.post('/admin/club', auth, requireSuper, function(req, res){
    var c = req.body || {};
    var owner = parseInt(c.owner_userid);
    if(!c.name || !(owner > 0)){ send(res, 1, "俱乐部名称和社长用户ID不能为空"); return; }
    db.admin_club_add(c.name, owner, function(id){
        if(id == null){ send(res, 1, "创建失败"); return; }
        send(res, 0, "ok", {id: id});
    });
});

app.put('/admin/club/:id', auth, requireSuper, function(req, res){
    var id = parseInt(req.params.id);
    var c = req.body || {};
    db.admin_club_update(id, c.name || null, c.owner_userid ? parseInt(c.owner_userid) : null, function(ok){
        send(res, ok ? 0 : 1, ok ? "ok" : "更新失败");
    });
});

app.delete('/admin/club/:id', auth, requireSuper, function(req, res){
    var id = parseInt(req.params.id);
    db.admin_club_delete(id, function(ok){
        send(res, ok ? 0 : 1, ok ? "ok" : "删除失败");
    });
});

// ============ 管理员账号管理(仅超级管理员) ============
app.get('/admin/admin_users', auth, requireSuper, function(req, res){
    db.admin_user_list(function(rows){
        send(res, 0, "ok", rows);
    });
});

app.post('/admin/admin_user', auth, requireSuper, function(req, res){
    var c = req.body || {};
    var role = c.role === 'club' ? 'club' : 'super';
    var clubId = role === 'club' ? parseInt(c.club_id) : null;
    if(!c.username || !c.password){ send(res, 1, "用户名和密码不能为空"); return; }
    if(role === 'club' && !(clubId > 0)){ send(res, 1, "俱乐部管理员必须绑定俱乐部"); return; }
    db.admin_user_add(c.username, crypto.md5(c.password), role, clubId, function(id, err){
        if(id == null){
            send(res, 1, (err && err.code === 'ER_DUP_ENTRY') ? "用户名已存在" : "创建失败");
            return;
        }
        send(res, 0, "ok", {id: id});
    });
});

app.put('/admin/admin_user/:id', auth, requireSuper, function(req, res){
    var id = parseInt(req.params.id);
    var c = req.body || {};
    var fields = {};
    if(c.password){ fields.password = crypto.md5(c.password); }
    if(c.role){ fields.role = c.role === 'club' ? 'club' : 'super'; }
    if(c.club_id !== undefined && c.club_id !== null){
        fields.club_id = c.club_id === '' ? null : parseInt(c.club_id);
    }
    db.admin_user_update(id, fields, function(ok){
        send(res, ok ? 0 : 1, ok ? "ok" : "更新失败");
    });
});

app.delete('/admin/admin_user/:id', auth, requireSuper, function(req, res){
    var id = parseInt(req.params.id);
    if(id === 1){ send(res, 1, "默认超级管理员账号不可删除"); return; }
    db.admin_user_delete(id, function(ok){
        send(res, ok ? 0 : 1, ok ? "ok" : "删除失败");
    });
});

// 提供给游戏服读取玩法配置（无需认证）
app.get('/game_config/:type', function(req, res){
    var type = req.params.type;
    db.query('SELECT * FROM t_game_config WHERE type="' + type + '"', function(err, rows){
        if(err){ send(res, 500, "数据库错误"); return; }
        if(rows.length == 0){
            send(res, 1, "玩法不存在");
            return;
        }
        var r = rows[0];
        send(res, 0, "ok", {
            type: r.type,
            name: r.name,
            difen_options: JSON.parse(r.difen_options),
            jushu_options: JSON.parse(r.jushu_options),
            cost_options: JSON.parse(r.cost_options),
            chips_options: r.chips_options ? JSON.parse(r.chips_options) : null,
            max_players: r.max_players,
            enabled: r.enabled
        });
    });
});
