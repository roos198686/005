// 把 t_game_config 里的 caishen_cpg 拆成 cai_chi / cai_peng / cai_gang 独立开关，新增 dianpao_hu 点炮胡开关
// 幂等：已存在的字段不重复 ALTER
var mysql = require('mysql');
var configs = require('../configs_win');
var db = configs.mysql();
var conn = mysql.createConnection({
    host: db.HOST, port: db.PORT,
    user: db.USER, password: db.PSWD,
    database: db.DB, charset: db.CHARSET
});
conn.connect(function(){ console.log('migrate_chi_peng_gang connected'); });

function q(sql, cb){ conn.query(sql, function(err, r){ if(err) { console.log('ERR:', sql, err.message); } else { console.log('OK:', sql.substring(0,70), 'rows=' + (r.affectedRows||0)); } if(cb) cb(); }); }

// 1. 加四个新列（用 DECIMAL 存 0/1 兼容现有 int/float 语义；DEFAULT=1 开）
q("ALTER TABLE t_game_config ADD COLUMN cai_chi DECIMAL(20,8) NOT NULL DEFAULT 1 AFTER caishen_cpg", function(){
q("ALTER TABLE t_game_config ADD COLUMN cai_peng DECIMAL(20,8) NOT NULL DEFAULT 1 AFTER cai_chi", function(){
q("ALTER TABLE t_game_config ADD COLUMN cai_gang DECIMAL(20,8) NOT NULL DEFAULT 1 AFTER cai_peng", function(){
q("ALTER TABLE t_game_config ADD COLUMN dianpao_hu DECIMAL(20,8) NOT NULL DEFAULT 1 AFTER cai_gang", function(){

    // 2. 用旧列 caishen_cpg 回填新列（兼容已有的配置值）
    q("UPDATE t_game_config SET cai_chi = caishen_cpg, cai_peng = caishen_cpg, cai_gang = caishen_cpg WHERE caishen_cpg IS NOT NULL", function(){

    // 3. 验证
    q("SELECT id, type, name, caishen_cpg, cai_chi, cai_peng, cai_gang, dianpao_hu FROM t_game_config", function(){
        conn.end();
    });
    });
}); }); }); });
