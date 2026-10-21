// 验证截图手牌摸到财神是否应胡（临时调试）
var fs = require('fs');
var vm = require('vm');
var src = fs.readFileSync(__dirname + '/../game_server/gamemgr_ldh.js', 'utf8');
var s = src.indexOf('function getMJType');
var e = src.indexOf('function checkTingPai');
var test = [
    'function hu(holds, cs) {',
    '    var sd = { holds: holds.slice(), pengs: [], chis: [], gangs: [] };',
    '    return checkCanHu(sd, cs, -1);',
    '}',
    // 截图：财神=三条(11)。手牌13张: 七筒x2 一万x3 四五六万 三四五筒 六条x2，摸到财神
    'var h1 = [6,6,18,18,18,21,22,23,2,3,4,14,14];',
    'console.log("A 13张+摸财神(11) 胡 =", hu(h1.concat([11]), 11));',
    // 变体：右侧是 三筒四筒八筒
    'var h2 = [6,6,18,18,18,21,22,23,2,3,7,14,14];',
    'console.log("B 13张(含八筒)+摸财神(11) 胡 =", hu(h2.concat([11]), 11));',
    // A型去掉财神后听什么
    'var t=[]; for(var i=0;i<34;++i){ if(hu(h1.concat([i]),11)) t.push(i);}',
    'console.log("A 13张听牌 =", t.join(","));'
].join('\n');
vm.runInThisContext(src.substring(s, e) + '\n' + test);
