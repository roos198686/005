var fs = require('fs');
var src = fs.readFileSync('d:/babykylin_scmj/server/game_server/gamemgr_zjzx4.js', 'utf8');

eval('var roomMgr={getUserSeat:function(){return null;},getUserRoom:function(){return null;},sendMsg:function(){}};var userMgr={sendMsg:function(){}};var db=null;var crypto=null;var games={};');
var result=[];var lines=src.split('\n');var inFunc=false,bc=0,cur=[];
for(var i=0;i<lines.length;i++){var l=lines[i];var m=l.match(/^\s*function\s+\w+\s*\(/);if(m&&!inFunc){inFunc=true;bc=0;cur=[];}if(inFunc){cur.push(l);for(var j=0;j<l.length;j++){if(l[j]==='{')bc++;else if(l[j]==='}')bc--;}if(bc===0&&cur.length>0){var n=cur[0].match(/function\s+(\w+)/);if(n)result.push({name:n[1],body:cur.join('\n')});inFunc=false;}}}
for(var i=0;i<result.length;i++){try{eval(result[i].body);}catch(e){console.log('ERR:',result[i].name,e.message);}}

// 用户牌: 吃出123筒, 手牌[3,5,5,6,7,7,9, 24(6万), 25(7万)] 双财, 应该4台
var seatData = {
    holds: [3,5,5,6,7,7,9,24,25],
    pengs: [],
    gangs: [],
    chis: [[0,1,2]] // 123筒
};
var mockGame = { caishen: 24, caishen2: 25, maxTai: 7, taiRules: { min_tai: 3, dong_ke: 2, zfb_ke: 1, ping_hu: 1, duidui_hu: 1, hun_yise: 1, qing_yise: 3, wu_cai: 1 } };

console.log('========== findAllHuSplits ==========');
var splits = findAllHuSplits(seatData, 24, 25);
console.log('拆法数量:', splits.length);
for(var i = 0; i < splits.length; i++){
    var s = splits[i];
    var r = calcTaiFromSplit(s, seatData, mockGame);
    console.log('--- #' + i + ' tai=' + r.tai + ' ' + JSON.stringify(r.logs));
    console.log('  jiang:', s.jiang < 0 ? '纯财' : s.jiang, ' kes:', s.kes, ' shuns:', JSON.stringify(s.shuns), ' csLeft:', s.csLeft);
}

console.log('\n========== calculateTai ==========');
var tai = calculateTai(seatData, mockGame, false, 0);
console.log('最终台数:', tai);
