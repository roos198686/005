// 完整复制服务端逻辑测试
function isZi(pai){ return pai >= 27 && pai < 34; }

function canFormMeldsWithJin(countMap, jinCount, caishen){
    var labels = Object.keys(countMap).filter(function(k){ return countMap[k] > 0; });
    if(labels.length === 0){ return jinCount % 3 === 0; }
    labels.sort(function(a, b){ return parseInt(a) - parseInt(b); });
    var first = parseInt(labels[0]);

    if(countMap[first] >= 3){
        countMap[first] -= 3;
        if(canFormMeldsWithJin(countMap, jinCount, caishen)){ countMap[first] += 3; return true; }
        countMap[first] += 3;
    }
    if(countMap[first] >= 2 && jinCount >= 1){
        countMap[first] -= 2;
        if(canFormMeldsWithJin(countMap, jinCount - 1, caishen)){ countMap[first] += 2; return true; }
        countMap[first] += 2;
    }
    if(countMap[first] >= 1 && jinCount >= 2){
        countMap[first] -= 1;
        if(canFormMeldsWithJin(countMap, jinCount - 2, caishen)){ countMap[first] += 1; return true; }
        countMap[first] += 1;
    }
    if(!isZi(first)){
        var v = first % 9;
        if(v <= 6){
            var p2 = first + 1, p3 = first + 2;
            var c2 = countMap[p2] || 0, c3 = countMap[p3] || 0;
            if(c2 > 0 && c3 > 0){
                countMap[first]--; countMap[p2]--; countMap[p3]--;
                if(canFormMeldsWithJin(countMap, jinCount, caishen)){ countMap[first]++; countMap[p2]++; countMap[p3]++; return true; }
                countMap[first]++; countMap[p2]++; countMap[p3]++;
            }
            var neededJin = 0;
            if(c2 === 0) neededJin++;
            if(c3 === 0) neededJin++;
            if(neededJin > 0 && neededJin <= jinCount){
                var usedJin = 0;
                countMap[first]--;
                if(c2 > 0) countMap[p2]--; else usedJin++;
                if(c3 > 0) countMap[p3]--; else usedJin++;
                if(canFormMeldsWithJin(countMap, jinCount - usedJin, caishen)){
                    countMap[first]++; if(c2 > 0) countMap[p2]++; if(c3 > 0) countMap[p3]++; return true;
                }
                countMap[first]++; if(c2 > 0) countMap[p2]++; if(c3 > 0) countMap[p3]++;
            }
        }
    }
    if(jinCount >= 3){
        var oldCount = countMap[first];
        countMap[first] = 0;
        if(canFormMeldsWithJin(countMap, jinCount - 3, caishen)){ countMap[first] = oldCount; return true; }
        countMap[first] = oldCount;
    }
    return false;
}

function checkCanHu(holds, caishen, numMelds){
    var expectedLen = 14 - 3 * numMelds;
    if(holds.length !== expectedLen) return false;
    var countMap = {};
    for(var i = 0; i < holds.length; ++i){
        var p = holds[i];
        countMap[p] = (countMap[p] || 0) + 1;
    }
    var jinCount = countMap[caishen] || 0;
    if(jinCount > 0) delete countMap[caishen];
    for(var pai in countMap){
        pai = parseInt(pai);
        if(countMap[pai] >= 2){
            countMap[pai] -= 2;
            if(canFormMeldsWithJin(countMap, jinCount, caishen)){ countMap[pai] += 2; return true; }
            countMap[pai] += 2;
        }
        if(jinCount >= 2){
            if(canFormMeldsWithJin(countMap, jinCount - 2, caishen)) return true;
        }
    }
    if(holds.length === 14){
        var pairs = 0, singles = 0;
        for(var k in countMap){
            var c = countMap[k];
            pairs += Math.floor(c / 2);
            if(c % 2 === 1) singles++;
        }
        if(singles <= jinCount && pairs + Math.floor((jinCount - singles) / 2) + singles >= 7) return true;
    }
    return false;
}

// 测试1：3顺子+1刻子+1对（无财神）
var h1 = [0,1,2, 3,4,5, 6,7,8, 9,9,9, 10,10];
console.log("测试1(能胡):", checkCanHu(h1, -1, 0));

// 测试2：13张听牌，加一张能胡
var h2 = [0,1,2, 3,4,5, 6,7,8, 9,9,9, 10];
console.log("测试2听10筒:", checkCanHu(h2.concat([10]), -1, 0));
console.log("测试2听11筒:", checkCanHu(h2.concat([11]), -1, 0));

// 测试3：字牌将牌
var h3 = [0,1,2, 3,4,5, 6,7,8, 9,9,9, 27,27];
console.log("测试3(字对能胡):", checkCanHu(h3, -1, 0));

// 测试4：有碰牌
var h4 = [0,1,2, 3,4,5, 6,7,8, 10,10]; // 11张，1个碰(算3张)
console.log("测试4(有碰能胡):", checkCanHu(h4, -1, 1));
