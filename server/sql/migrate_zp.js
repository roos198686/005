// 迁移：新增漳浦麻将玩法配置（zp=2人 / zp4=4人）
// 幂等：可重复执行
var mysql = require('mysql');
var config = require('../configs_win');

var dbConf = config.mysql();
var pool = mysql.createPool({
    host: dbConf.HOST,
    user: dbConf.USER,
    password: dbConf.PSWD,
    database: dbConf.DB,
    port: dbConf.PORT
});

// 漳浦台数规则（后台可改）：
// hua_tai每花台数 jin_tai每金台数 ming_gang明杠 an_gang暗杠
// san_jin_dao三金倒 qiang_jin抢金 qi_dui七对 hun_yise混一色 qing_yise清一色
// gang_kai杠上开花 qiang_gang抢杠胡 ping_hu平胡
// you_jin_multi游金每级倍数 you_jin_max游金最高级 fenbing分饼开关(0关1开,仅4人) chupai_timeout出牌超时秒
var TAI_RULES_ZP = JSON.stringify({
    hua_tai:1, jin_tai:1, ming_gang:1, an_gang:2,
    san_jin_dao:2, qiang_jin:2, qi_dui:3, hun_yise:1, qing_yise:3,
    gang_kai:1, qiang_gang:1, ping_hu:0,
    you_jin_multi:2, you_jin_max:3, fenbing:0, chupai_timeout:15
});

var COLS = "(`type`,`name`,`difen_options`,`jushu_options`,`cost_options`,`max_players`,`max_tai`,`caishen_cpg`,`tai_rules`,`enabled`,`sort`)";
var statements = [
    "INSERT INTO `t_game_config` " + COLS + " VALUES ('zp','漳浦麻将(2人)','[1,2,5]','[4,8]','[2,3]',2,10,1,'" + TAI_RULES_ZP + "',1,5)"
        + " ON DUPLICATE KEY UPDATE `name`=VALUES(`name`), `tai_rules`=VALUES(`tai_rules`)",
    "INSERT INTO `t_game_config` " + COLS + " VALUES ('zp4','漳浦麻将(4人)','[1,2,5]','[4,8]','[2,3]',4,10,1,'" + TAI_RULES_ZP + "',1,6)"
        + " ON DUPLICATE KEY UPDATE `name`=VALUES(`name`), `tai_rules`=VALUES(`tai_rules`)"
];

function run(i){
    if(i >= statements.length){
        console.log('迁移完成');
        pool.end();
        return;
    }
    var st = statements[i];
    pool.query(st, function(err, r){
        if(err){
            console.log('[失败]', st.substring(0, 70), '->', err.message);
        } else {
            console.log('[成功]', st.substring(0, 70), 'affected=', r.affectedRows);
        }
        run(i + 1);
    });
}
run(0);
