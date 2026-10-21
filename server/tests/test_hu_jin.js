// 测试修复后的胡牌逻辑
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
        if(canFormMeldsWithJin(countMap, jinCount - 3, caishen)){ return true; }
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

// 测试：单张牌 + 3个财神 不应该胡
console.log("单张+3财神(不该胡):", checkCanHu([0, 5,5,5], 5, 0)); // holds=[0,5,5,5], caishen=5, jinCount=3
// 0是单张，5是财神，3个财神替代一组后0还在，应该false

// 测试：正常能胡的牌（无财神）
console.log("正常胡(该胡):", checkCanHu([0,1,2, 3,4,5, 6,7,8, 9,9,9, 10,10], -1, 0));

// 测试：1张单牌 + 3财神 作为将牌+一组？不对，3财神是一组，单牌无法处理
console.log("单牌+3财神做组(不该胡):", checkCanHu([0,5,5,5], 5, 0));

// 测试：2张单牌 + 4财神 = 1对(2财神) + 1组(3财神) + 1单牌 → 不该胡
console.log("2单+4财神(不该胡):", checkCanHu([0,1,5,5,5,5], 5, 0));

// 测试：2张单牌 + 5财神 = 1对(2财神) + 1组(3财神) + 1组(1单+2财神) → 该胡？
// 0,1 单牌，5个财神
// 将牌：2财神
// 组1：0+2财神
// 组2：1+2财神
// 组3：1财神... 不对，5-2-2-2=-1
// 实际：0+2财神(组1), 1+2财神(组2), 2财神(将) = 6财神，但只有5个
// 或者：0+1+1财神(组1), 4财神做将+一组？不对
// 让我算：5个财神 + 0,1 = 7张
// 将牌：0,1不是对子，用2财神做将，剩3财神+0,1=5张
// 组1：0+1+1财神=顺子？0是万,1是万，可以组成0,1,2顺子，用1财神替代2
// 剩2财神，不够一组
// 所以不该胡
console.log("2单+5财神(不该胡):", checkCanHu([0,1,5,5,5,5,5], 5, 0));

// 测试：3张单牌 + 6财神 = 3组(每单+2财神) + 0将 → 不该胡（缺将）
console.log("3单+6财神缺将(不该胡):", checkCanHu([0,1,2,5,5,5,5,5,5], 5, 0));

// 测试：3张单牌 + 8财神 = 3组(每单+2财神) + 1对(2财神) → 该胡
// 0+2财神, 1+2财神, 2+2财神, 2财神做将 = 8财神 ✓
console.log("3单+8财神(该胡):", checkCanHu([0,1,2,5,5,5,5,5,5,5,5], 5, 0));
