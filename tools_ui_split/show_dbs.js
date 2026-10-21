var mysql = require('D:/babykylin_scmj/server/node_modules/mysql');
var c = mysql.createConnection({ host: '127.0.0.1', user: 'root', password: 'qwe12233', port: 3306 });
c.connect(function (err) {
    if (err) { console.log('连接失败: ' + err.code); process.exit(1); }
    c.query('SHOW DATABASES', function (e, rows) {
        if (e) { console.log('查询失败: ' + e.message); process.exit(1); }
        console.log('当前MySQL实例(3306)中的所有数据库:');
        rows.forEach(function (r) { console.log('  ' + Object.values(r)[0]); });
        c.end();
    });
});
