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
    return false;
}

// holds=11张, numMelds=1, expectedLen=11
// 0,1,2 + 8个财神(5) = 11张
// 将牌: 2财神, 组1: 0+2财神, 组2: 1+2财神, 组3: 2+2财神 = 8财神 ✓
console.log("3单+8财神(该胡):", checkCanHu([0,1,2,5,5,5,5,5,5,5,5], 5, 1));

// 单张+3财神(不该胡): 4张, numMelds需要满足 14-3*n=4 → n=10/3 不对
// 改成: holds=4, numMelds= (14-4)/3 不对
// 用 holds=11, numMelds=1: 0 + 10个财神
// 0单张 + 10财神: 将2财神, 组1:0+2财神, 组2:3财神, 组3:3财神 = 2+2+3+3=10 ✓
console.log("1单+10财神(该胡):", checkCanHu([0,5,5,5,5,5,5,5,5,5,5], 5, 1));

// 0单张 + 9财神: 将2财神, 组1:0+2财神, 组2:3财神, 还剩2财神不够一组 → 不该胡
console.log("1单+9财神(不该胡):", checkCanHu([0,5,5,5,5,5,5,5,5,5], 5, 1));

// 正常无财神
console.log("正常胡(该胡):", checkCanHu([0,1,2,3,4,5,6,7,8,9,9,9,10,10], -1, 0));
