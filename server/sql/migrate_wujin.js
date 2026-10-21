// 迁移：新增漳浦无金麻将玩法配置（wujin=4人，16张打法，无金无花）
// 幂等：可重复执行
var mysql = require('mysql');
var config = require('../server/configs_local2');

var dbConf = config.mysql();
var pool = mysql.createPool({
    host: dbConf.HOST,
    user: dbConf.USER,
    password: dbConf.PSWD,
    database: dbConf.DB,
    port: dbConf.PORT
});

// 无金台数规则（后台可改）：
// ping_hu平胡 zi_mo自摸 men_qing门清 peng_peng碰碰胡 cou_yise凑一色 qing_yise清一色
// qi_dui七对 da_sanyuan大三元 da_sixi大四喜
// ming_gang明杠 an_gang暗杠 gang_kai杠上开花 qiang_gang抢杠胡 hai_di海底捞月
// tian_hu天胡 di_hu地胡
// can_chi是否允许吃(1可0不可) yi_pao_duo_xiang一炮多响(1开0关) dian_pao_bao点炮包牌(1包0不包)
// chupai_timeout出牌超时秒
var TAI_RULES_WUJIN = JSON.stringify({
    ping_hu:1, zi_mo:1, men_qing:1, peng_peng:2, cou_yise:2, qing_yise:4,
    qi_dui:3, da_sanyuan:8, da_sixi:8,
    ming_gang:1, an_gang:2, gang_kai:1, qiang_gang:1, hai_di:1,
    tian_hu:8, di_hu:8,
    can_chi:1, yi_pao_duo_xiang:1, dian_pao_bao:0,
    chupai_timeout:15
});

var COLS = "(`type`,`name`,`difen_options`,`jushu_options`,`cost_options`,`max_players`,`max_tai`,`caishen_cpg`,`tai_rules`,`enabled`,`sort`)";
var statements = [
    "INSERT INTO `t_game_config` " + COLS + " VALUES ('wujin','漳浦无金麻将','[1,2,5]','[4,8]','[2,3]',4,10,0,'" + TAI_RULES_WUJIN + "',1,7)"
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
