var mysql = require('D:/babykylin_scmj/server/node_modules/mysql');
var dbs = ['db_babykylin', 'majiang'];
var i = 0;
function next() {
    if (i >= dbs.length) process.exit(0);
    var db = dbs[i++];
    var c = mysql.createConnection({ host: '127.0.0.1', user: 'root', password: 'qwe12233', database: db, port: 3306 });
    c.connect(function (err) {
        if (err) { console.log(db + ' 连接失败: ' + err.code); next(); return; }
        c.query('SHOW TABLES', function (e, rows) {
            if (e) { console.log(db + ' 查询失败: ' + e.message); c.end(); next(); return; }
            var names = rows.map(function (r) { return Object.values(r)[0]; });
            var want = ['t_users', 't_accounts', 't_rooms', 't_game_config', 't_clubs', 't_club_tables', 't_games_archive'];
            var found = want.filter(function (w) { return names.indexOf(w) >= 0; });
            console.log('=== ' + db + ' 共' + names.length + '张表, 游戏核心表命中 ' + found.length + '/' + want.length + ': ' + found.join(','));
            if (found.indexOf('t_users') >= 0) {
                c.query('SELECT COUNT(*) AS n FROM t_users', function (e2, r2) {
                    if (!e2) console.log('    t_users行数: ' + r2[0].n);
                    c.end(); next();
                });
            } else { c.end(); next(); }
        });
    });
}
next();
