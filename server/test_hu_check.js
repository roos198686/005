// 用磁盘源码原文提取 checkCanHu/canFormMelds 验证,杜绝手抄误差
var fs = require("fs");
var src = fs.readFileSync("d:/babykylin_scmj/server/game_server/gamemgr_ldh.js", "utf8");

// 提取 isZi(39-41行区域) 与 checkCanHu~checkTingPai 之间全部函数
function extract(startMarker, endMarker){
    var s = src.indexOf(startMarker);
    var e = src.indexOf(endMarker);
    if(s < 0 || e < 0 || e <= s){ throw new Error("extract fail: " + startMarker); }
    return src.substring(s, e);
}
var isZiSrc = "function isZi(pai){\n    return pai >= 27 && pai < 34;\n}\n";
var huSrc = extract("function checkCanHu(", "function checkTingPai(");
eval(isZiSrc + huSrc);

// 用户真实场景: caishen=31(西风), 碰4万(21), 对家打6筒(5)
// 碰后手牌(试进6筒): [6,6,1,29,31,7,29,1,8,7,5] => 7筒x2,2筒x2,白x2,西风,8筒x2,9筒,6筒
var seatData = {
    holds: [6,6,1,29,31,7,29,1,8,7],
    pengs: [21],
    chis: [],
    gangs: []
};
seatData.holds.push(5); // 对家打6筒,试进
console.log("手牌(" + seatData.holds.length + "张):", JSON.stringify(seatData.holds));
var r = checkCanHu(seatData, 31, -1);
console.log("checkCanHu 结果:", r);
