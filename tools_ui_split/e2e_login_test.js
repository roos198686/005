// 模拟客户端完整登录流程:guest -> hall login -> socket连game服 -> login -> 创建房间
var io = require('socket.io-client');
var http = require('http');

function get(url) {
    return new Promise(function(resolve, reject) {
        http.get(url, function(res) {
            var d = '';
            res.on('data', function(c) { d += c; });
            res.on('end', function() { resolve({ code: res.statusCode, body: d }); });
        }).on('error', reject);
    });
}

var account = 'guest_e2e_' + Date.now();

get('http://127.0.0.1:9000/guest?account=' + account + '&sign=e2e')
    .then(function(r) {
        console.log('[1] guest:', r.code, r.body.substring(0, 100));
        var g = JSON.parse(r.body);
        if (g.errcode != 0) throw new Error('guest失败: ' + r.body);
        return get('http://127.0.0.1:9001/login?account=' + encodeURIComponent(g.account) + '&sign=' + g.sign);
    })
    .then(function(r) {
        console.log('[2] hall login:', r.code, r.body.substring(0, 100));
        var l = JSON.parse(r.body);
        if (l.errcode != 0) throw new Error('hall login失败: ' + r.body);
        // 连接游戏服socket
        return new Promise(function(resolve, reject) {
            var socket = io('http://127.0.0.1:10000', { transports: ['websocket'] });
            var timer = setTimeout(function() { reject(new Error('socket连接超时')); }, 8000);
            socket.on('connect', function() {
                console.log('[3] socket已连接game服 10000');
                socket.emit('login', { account: account, sign: 'e2e' });
            });
            socket.on('login_result', function(data) {
                clearTimeout(timer);
                console.log('[4] login_result:', JSON.stringify(data).substring(0, 200));
                // 尝试创建房间(翻财神2人)
                socket.emit('create_room', 'zj', { difen: 1, jushu: 4, cost: 2, zimo: 1, diangang: 1, taiFengDing: 1, maxTai: 10 }, function(ret) {
                    console.log('[5] create_room回调:', JSON.stringify(ret));
                    socket.disconnect();
                    resolve('done');
                });
                setTimeout(function() { socket.disconnect(); resolve('done'); }, 6000);
            });
            socket.on('connect_error', function(e) { clearTimeout(timer); reject(new Error('socket连接失败: ' + e)); });
        });
    })
    .then(function() { console.log('=== 全链路完成 ==='); process.exit(0); })
    .catch(function(e) { console.log('=== 失败:', e.message, '==='); process.exit(1); });
