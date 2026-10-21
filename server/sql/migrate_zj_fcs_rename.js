// 迁移：原「翻财神」玩法(zj_cs/zj4_cs)下线，赖倒胡(zj/zj4)更名为「翻财神」并写入新台数规则
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

var TAI_RULES_ZJ  = JSON.stringify({min_tai:1, dong_ke:2, zfb_ke:1, ping_hu:1, duidui_hu:1, hun_yise:1, qing_yise:3, gang_kai:1, wu_cai:1});
var TAI_RULES_ZJ4 = TAI_RULES_ZJ;

var statements = [
    "UPDATE `t_game_config` SET `name`='翻财神(2人)', `tai_rules`='" + TAI_RULES_ZJ + "', `enabled`=1 WHERE `type`='zj'",
    "UPDATE `t_game_config` SET `name`='翻财神(4人)', `tai_rules`='" + TAI_RULES_ZJ4 + "', `enabled`=1 WHERE `type`='zj4'",
    "DELETE FROM `t_game_config` WHERE `type` IN ('zj_cs','zj4_cs')",
    "UPDATE `t_club_games` SET `name`='翻财神(2人)' WHERE `game_type`='zj'",
    "UPDATE `t_club_games` SET `name`='翻财神(4人)' WHERE `game_type`='zj4'",
    "DELETE FROM `t_club_games` WHERE `game_type` IN ('zj_cs','zj4_cs')",
    "DELETE FROM `t_club_tables` WHERE `game_type` IN ('zj_cs','zj4_cs')"
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
