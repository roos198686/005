// 测试诸暨麻将胡牌逻辑
var mgr = require('../game_server/gamemgr_zj');

// 模拟一个能胡的牌型：3个顺子 + 1个刻子 + 1对
// 0,1,2万  3,4,5万  6,7,8万  9,9,9筒  10,10筒
var seatData = {
    holds: [0,1,2, 3,4,5, 6,7,8, 9,9,9, 10,10],
    countMap: {},
    pengs: [],
    chis: [],
    gangs: []
};
for(var i=0;i<seatData.holds.length;i++){
    var p = seatData.holds[i];
    seatData.countMap[p] = (seatData.countMap[p]||0)+1;
}

// 直接调用内部函数需要重新加载，这里用 checkTingPai 间接测试
// 先测试 checkTingPai 是否能找到听牌
var testHolds = [0,1,2, 3,4,5, 6,7,8, 9,9,9, 10]; // 13张，听10筒
var testSeat = {
    holds: testHolds.slice(),
    countMap: {},
    pengs: [],
    chis: [],
    gangs: [],
    tingMap: {}
};
for(var i=0;i<testSeat.holds.length;i++){
    var p = testSeat.holds[i];
    testSeat.countMap[p] = (testSeat.countMap[p]||0)+1;
}

console.log("测试听牌：holds=", testSeat.holds);
// 手动复制 checkTingPai 逻辑
var caishen = -1;
testSeat.tingMap = {};
for(var i = 0; i < 34; ++i){
    testSeat.holds.push(i);
    testSeat.countMap[i] = (testSeat.countMap[i] || 0) + 1;
    // 复制 checkCanHu 核心逻辑
    var holds = testSeat.holds;
    var numMelds = 0;
    var expectedLen = 14 - 3 * numMelds;
    if(holds.length !== expectedLen){
        testSeat.countMap[i]--;
        testSeat.holds.pop();
        continue;
    }
    var cm = {};
    for(var j=0;j<holds.length;j++){
        cm[holds[j]] = (cm[holds[j]]||0)+1;
    }
    var jinCount = cm[caishen] || 0;
    if(jinCount>0) delete cm[caishen];
    // 简化版胡牌检测（不含财神）
    function canHu(cm){
        var keys = Object.keys(cm).filter(function(k){return cm[k]>0;}).map(Number).sort(function(a,b){return a-b;});
        if(keys.length===0) return true;
        var first = keys[0];
        // 刻子
        if(cm[first]>=3){
            cm[first]-=3;
            if(canHu(cm)){cm[first]+=3;return true;}
            cm[first]+=3;
        }
        // 顺子
        if(first<27){
            var v=first%9;
            if(v<=6){
                var p2=first+1,p3=first+2;
                if((cm[p2]||0)>0 && (cm[p3]||0)>0){
                    cm[first]--;cm[p2]--;cm[p3]--;
                    if(canHu(cm)){cm[first]++;cm[p2]++;cm[p3]++;return true;}
                    cm[first]++;cm[p2]++;cm[p3]++;
                }
            }
        }
        return false;
    }
    var hu = false;
    for(var pai in cm){
        pai = parseInt(pai);
        if(cm[pai]>=2){
            cm[pai]-=2;
            if(canHu(cm)){hu=true;}
            cm[pai]+=2;
            if(hu) break;
        }
    }
    if(hu) testSeat.tingMap[i] = true;
    testSeat.countMap[i]--;
    testSeat.holds.pop();
}
console.log("听牌列表:", Object.keys(testSeat.tingMap));
