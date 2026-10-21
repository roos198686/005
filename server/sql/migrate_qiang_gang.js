/**
 * 抢杠胡 +1 台规则迁移：给翻财神玩法的 tai_rules JSON 加 qiang_gang:1
 * 幂等：已存在 qiang_gang 的跳过；不存在则补充进 JSON 字符串
 * usage: node sql/migrate_qiang_gang.js
 */
var configs = require('../configs_win');
var mysql = require('mysql');
var m = configs.mysql();
var dbconf = { host: m.HOST || '127.0.0.1', port: m.PORT || 3306, user: m.USER || 'root', password: m.PSWD || '', database: m.DB || 'db_babykylin' };

var conn = mysql.createConnection(dbconf);

conn.connect(function(err){
    if(err){ console.error('connect err:', err.message); process.exit(1); }
    console.log('[migrate_qiang_gang] connected');

    conn.query("SELECT type, tai_rules FROM t_game_config WHERE type IN ('zj','zj4')", function(err, rows){
        if(err){ console.error('select err:', err.message); conn.end(); process.exit(1); }
        var tasks = [];
        rows.forEach(function(row){
            var rules = {};
            if(row.tai_rules){
                try { rules = JSON.parse(row.tai_rules); } catch(e){ rules = {}; }
            }
            if(rules.qiang_gang !== undefined){
                console.log('  [' + row.type + '] qiang_gang 已存在，跳过');
                return;
            }
            rules.qiang_gang = 1;
            var newJson = JSON.stringify(rules);
            tasks.push({ type: row.type, newRules: newJson });
        });
        if(tasks.length == 0){
            console.log('无需要更新的玩法');
            conn.end();
            return;
        }
        var done = 0;
        tasks.forEach(function(t){
            conn.query("UPDATE t_game_config SET tai_rules=? WHERE type=?", [t.newRules, t.type], function(err, res){
                if(err){ console.error('update [' + t.type + '] err:', err.message); }
                else { console.log('  [' + t.type + '] updated, affected=' + res.affectedRows + ' tai_rules=' + t.newRules); }
                done++;
                if(done == tasks.length){
                    conn.end();
                    console.log('[migrate_qiang_gang] done');
                }
            });
        });
    });
});
