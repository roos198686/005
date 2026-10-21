// 验证无财神胡牌逻辑 - 用截图中的牌型
function isZi(pai){ return pai >= 27 && pai < 34; }

function canFormMelds(countMap){
    var labels = Object.keys(countMap).filter(function(k){ return countMap[k] > 0; });
    if(labels.length === 0) return true;
    labels.sort(function(a, b){ return parseInt(a) - parseInt(b); });
    var first = parseInt(labels[0]);

    if(countMap[first] >= 3){
        countMap[first] -= 3;
        if(canFormMelds(countMap)){ countMap[first] += 3; return true; }
        countMap[first] += 3;
    }
    if(!isZi(first)){
        var v = first % 9;
        if(v <= 6){
            var p2 = first + 1, p3 = first + 2;
            var c2 = countMap[p2] || 0, c3 = countMap[p3] || 0;
            if(c2 > 0 && c3 > 0){
                countMap[first]--; countMap[p2]--; countMap[p3]--;
                if(canFormMelds(countMap)){ countMap[first]++; countMap[p2]++; countMap[p3]++; return true; }
                countMap[first]++; countMap[p2]++; countMap[p3]++;
            }
        }
    }
    return false;
}

function checkCanHu(holds, numMelds){
    var expectedLen = 14 - 3 * numMelds;
    if(holds.length !== expectedLen) return false;
    var countMap = {};
    for(var i = 0; i < holds.length; ++i){
        countMap[holds[i]] = (countMap[holds[i]] || 0) + 1;
    }
    for(var pai in countMap){
        pai = parseInt(pai);
        if(countMap[pai] >= 2){
            countMap[pai] -= 2;
            if(canFormMelds(countMap)){ countMap[pai] += 2; return true; }
            countMap[pai] += 2;
        }
    }
    if(holds.length === 14){
        var pairs = 0;
        for(var k in countMap){ pairs += Math.floor(countMap[k] / 2); }
        if(pairs >= 7) return true;
    }
    return false;
}

// 截图牌型：六筒(14)x3, 三万(20)x3, 六万(23), 八万(25), 西(32)x2, 南(31)x2
// 假设六筒和三万都是碰牌(numMelds=2)，手牌=六万,八万,西x2,南x2 = 6张
var holds1 = [23, 25, 32, 32, 31, 31];
console.log("截图牌型(2碰,6张):", checkCanHu(holds1, 2)); // 应该false

// 假设只有六筒是碰牌(numMelds=1)，手牌=三万x3,六万,八万,西x2,南x2 = 9张
var holds2 = [20,20,20, 23, 25, 32,32, 31,31];
console.log("截图牌型(1碰,9张):", checkCanHu(holds2, 1)); // 应该false

// 假设无碰牌，手牌=六筒x3,三万x3,六万,八万,西x2,南x2 = 12张
var holds3 = [14,14,14, 20,20,20, 23, 25, 32,32, 31,31];
console.log("截图牌型(0碰,12张):", checkCanHu(holds3, 0)); // 应该false (12!=14)

// 正常胡牌测试
console.log("正常胡(3顺+1刻+1对):", checkCanHu([0,1,2,3,4,5,6,7,8,9,9,9,10,10], 0)); // true
console.log("七对:", checkCanHu([0,0,1,1,2,2,3,3,4,4,5,5,6,6], 0)); // true
console.log("碰碰胡:", checkCanHu([0,0,0,1,1,1,2,2,2,3,3,3,4,4], 0)); // true
console.log("不能胡(散牌):", checkCanHu([0,2,4,6,8,10,12,14,16,18,20,22,24,26], 0)); // false
