# 麻将改造：4人 → 2人 + 仅保留诸暨/漳浦玩法

## Context（背景）
当前项目是 4 人四川麻将框架，房间固定 4 座位、发牌按 `%4` 轮转、胡牌得分由 3 个败者均摊（`/3`）。玩法路由支持 4 种：`xlch`(血流成河)、`xzdd`(血战到底)、`zp`(漳浦)、`zj`(诸暨)。

用户要求：
1. **所有游戏改为二人对战**（1v1，对手位于"上"方位，与"我"对面）
2. **只保留诸暨麻将(zj)和漳浦麻将(zp)**，删掉 `xlch` / `xzdd` 两种四川麻将玩法

目标：2 人局能正常发牌、出牌、碰杠吃胡、计分、结束；创建房间只能选 zj/zp。

## 改动方案

### 一、服务端 game_server

#### 1. [roommgr.js](file:///d:\babykylin_scmj\server\game_server\roommgr.js) — 座位数 4→2 + 删除 xzdd/xlch
- `constructRoomFromDb` (L22-72)：`seats:new Array(4)` → `new Array(2)`；`for(i=0;i<4)` → `i<2`（L48）；路由分支删掉 `xlch` 分支，只留 `zp`/`zj`，else 拒绝（L34-45）
- `createRoom` (L74-238)：校验只保留 `zp`/`zj` 分支，删除 `xzdd/xlch` 完整参数校验块（L77-112）和特有配置写入（L162-170）；`for(i=0;i<4)` 推座位 → `i<2`（L200）；路由加载删掉 xlch 分支（L186-197）
- `destroy` (L246)、`enterRoom` 的 `fnTakeSeat` (L282)、`exitRoom` 的玩家计数：`for i<4` → `i<2`
- 路由 default 分支改为返回错误而非 fallback 到 xzdd

#### 2. [gamemgr_zj.js](file:///d:\babykylin_scmj\server\game_server\gamemgr_zj.js) — 诸暨 2 人
- `deal` (L90-101)：`for(i=0;i<52)` 13×4=52 → `i<26` 13×2=26；`seatIndex=(seatIndex+1)%4` → `%2`（L97）
- `moveToNextUser` (L383)：`(game.turn+1)%4` → `%2`
- 所有游戏逻辑循环 `for(i=0;i<4)` → `i<2`：`chupai`(L464,L475)、`hu`(L612)、`guo`(L637)、`doGameOver`(L420)、`start`(L727,L753,L766,L777)
- `hu` 计分 (L611-616)：败者由 3 个变 1 个，`game.gameSeats[i].score -= Math.floor(score/3)` → `-= score`（败者全额付）
- `start` 的 `gameSeats` push 循环 (L727) → `i<2`

#### 3. [gamemgr_zp.js](file:///d:\babykylin_scmj\server\game_server\gamemgr_zp.js) — 漳浦 2 人
- `deal` (L123-137)：`for(i=0;i<64)` 16×4=64 → `i<32` 16×2=32；`%4` → `%2`（L132）
- `moveToNextUser` (L434)：`%4` → `%2`
- 所有 `for(i=0;i<4)` → `i<2`：`chupai`(L520,L534)、`hu`(L671)、`guo`(L699)、`doGameOver`(L473)、`start`(L787,L815,L828,L839)
- `hu` 计分 (L671-675)：`-= Math.floor(score/3)` → `-= score`
- `start` 的 `gameSeats` push (L787) → `i<2`

#### 4. 删除文件
- [gamemgr_xlch.js](file:///d:\babykylin_scmj\server\game_server\gamemgr_xlch.js)
- [gamemgr_xzdd.js](file:///d:\babykylin_scmj\server\game_server\gamemgr_xzdd.js)
（roommgr 路由已不再 require 它们）

### 二、客户端 client/assets/scripts/components

#### 5. [CreateRoom.js](file:///d:\babykylin_scmj\client\assets\scripts\components\CreateRoom.js) — 只留 zj/zp
- `onBtnOK` (L39)：`usedTypes=['xzdd','xlch','zp','zj']` → `['zp','zj']`
- `getType` (L49-70)：重写为只返回 `'zp'`/`'zj'`（按当前选中的单选项索引，0=zp,1=zj），默认 `'zp'`
- `createRoom` (L111-131)：删掉 `xzdd/xlch` 的 `constructSCMJConf` 分支，只留 zp/zj
- 玩法单选 UI：场景/预制里若有 4 个玩法按钮，保留 2 个（诸暨/漳浦），其余隐藏（这一步如需改 .prefab 由用户在编辑器配合，或我改 prefab JSON）

#### 6. [MJGame.js](file:///d:\babykylin_scmj\client\assets\scripts\components\MJGame.js) — 座位映射 2 人
- `getLocalIndex` (L862-866)：2 人下对手应在"上"方位。改为：`var ret = (index - cc.vv.gameNetMgr.seatIndex + 2) % 2; return ret === 0 ? 0 : 2;`（0→myself, 2→up），复用 `sides=["myself","right","up","left"]` 里的 myself/up 节点
- `sides` 初始化 (L84-102)：循环仍 4 次（节点引用照常建），但 right/left 节点设为 `active=false` 隐藏
- 凡按原始 seatIndex 直接取 `_seats2[index]`/`seats2[index]` 的位置，改用 `_seats2[getLocalIndex(index)]`，确保 2 座位正确落到 myself/up 节点

#### 7. [MJRoom.js](file:///d:\babykylin_scmj\client\assets\scripts\components\MJRoom.js) — 座位初始化
- `initView` (L38-56)：`seats2` 仍取 game/myself,right,up,left 4 节点；2 人局只激活 myself/up，right/left 隐藏
- `initSingleSeat` (L162-188)：按 `getLocalIndex(seat.seatindex)` 定向到 myself/up 节点，而非直接 `_seats2[index]`

#### 8. [Seat.js](file:///d:\babykylin_scmj\client\assets\scripts\components\Seat.js) / [Status.js](file:///d:\babykylin_scmj\client\assets\scripts\components\Status.js)
- 检查是否硬编码 4 座位循环；若有按 seatIndex 0..3 分支，改为通过 localIndex（0 或 2）定向

## 验证
1. 重启 game_server（hall/account 不需改，照常起）
2. 浏览器预览 → 创建房间：玩法只有诸暨/漳浦可选
3. 开两个浏览器窗口（不同账号）进同一房间，第 2 人加入后两人即满开局
4. 验证：发牌每人正确张数（诸暨13/庄14、漳浦16/庄17）、出牌轮转只在两人间、碰杠吃胡正常、胡牌后败者全额扣分、对局结束可开下一局
5. 控制台无 `gamemgr_xlch/xzdd` 相关报错
