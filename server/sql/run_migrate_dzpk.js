// 德州扑克迁移执行脚本：执行 sql/migrate_dzpk.sql（逐条执行，已存在的列跳过）
var fs = require('fs');
var path = require('path');
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

var sqlFile = fs.readFileSync(path.join(__dirname, 'migrate_dzpk.sql'), 'utf8');
// 按分号拆分，去掉注释行
var statements = sqlFile.split(';').map(function(s){
    return s.split('\n').filter(function(line){
        var t = line.trim();
        return t.length > 0 && t.indexOf('--') != 0;
    }).join('\n').trim();
}).filter(function(s){ return s.length > 0; });

// ALTER TABLE 多列拆成单条执行，便于跳过已存在的列
var finalStatements = [];
statements.forEach(function(st){
    if(/^ALTER TABLE/i.test(st) && (st.match(/ADD COLUMN/g) || []).length > 1){
        var m = st.match(/ALTER TABLE\s+`?(\w+)`?\s+([\s\S]+)/i);
        if(m){
            var table = m[1];
            var body = m[2];
            // 按 "ADD COLUMN" 拆分
            var parts = body.split(/,\s*ADD COLUMN/i);
            parts.forEach(function(p, idx){
                var clause = (idx == 0 ? p : 'ADD COLUMN' + p).trim().replace(/,$/, '');
                if(clause){
                    finalStatements.push('ALTER TABLE `' + table + '` ' + clause);
                }
            });
            return;
        }
    }
    finalStatements.push(st);
});

function run(i){
    if(i >= finalStatements.length){
        console.log('迁移完成');
        process.exit(0);
        return;
    }
    var st = finalStatements[i];
    pool.getConnection(function(err, conn){
        if(err){ console.log('连接失败', err.message); process.exit(1); }
        conn.query(st, function(qerr){
            conn.release();
            if(qerr){
                if(qerr.code == 'ER_DUP_FIELDNAME' || qerr.code == 'ER_DUP_ENTRY'){
                    console.log('[跳过] 已存在:', st.substring(0, 60));
                } else {
                    console.log('[失败]', st.substring(0, 80));
                    console.log('       ', qerr.message);
                }
            } else {
                console.log('[成功]', st.substring(0, 60));
            }
            run(i + 1);
        });
    });
}

run(0);
