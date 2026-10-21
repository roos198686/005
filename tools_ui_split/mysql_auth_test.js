var mysql = require('D:/babykylin_scmj/server/node_modules/mysql');
var tries = [
    { host: '127.0.0.1', user: 'root', pswd: 'qq1314' },
    { host: '127.0.0.1', user: 'root', pswd: '' },
    { host: 'localhost', user: 'root', pswd: 'qq1314' },
];
var i = 0;
function next() {
    if (i >= tries.length) { console.log('全部尝试失败'); process.exit(1); }
    var t = tries[i++];
    var c = mysql.createConnection({ host: t.host, user: t.user, password: t.pswd, database: 'qqq', port: 3306 });
    c.connect(function (err) {
        if (err) {
            console.log(t.host + ' / ' + t.user + ' / "' + t.pswd + '" -> 失败: ' + err.code);
            try { c.destroy(); } catch (e) {}
            next();
        } else {
            c.query('SELECT user,host FROM mysql.user WHERE user="root"', function (e2, rows) {
                console.log(t.host + ' / ' + t.user + ' / "' + t.pswd + '" -> 成功!');
                if (!e2 && rows) { rows.forEach(function (r) { console.log('  root账号存在: root@' + r.host); }); }
                c.end();
                process.exit(0);
            });
        }
    });
}
next();
