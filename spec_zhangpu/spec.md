# 漳浦麻将 新增玩法 规格说明

## 1. 目标与边界
新增独立玩法「漳浦麻将」，2人(`zp`)/4人(`zp4`)，前后端、页面、文件全部独立于现有玩法(zj/zj_bt/zj4/zj4_bt/dzpk)；管理后台与俱乐部后台可配置。不改动现有玩法的任何行为。

已确认决策：
- 客户端两个完全独立场景：`mjgame_zp.fire`(2人) + `mjgame_zp4.fire`(4人)，独立脚本 `MJGameZP.js` / `MJGameZP4.js`
- 花牌渲染：现有牌底 Sprite + 中文花名 Label（梅/兰/竹/菊/春/夏/秋/冬），不新增图集

## 2. 牌值编码（与现有客户端 MahjongMgr 一致）
- 0-8 筒、9-17 条、18-26 万、27中 28发 29白 30东 31南 32西 33北、34-41 花(梅兰竹菊春夏秋冬)
- 144张 = 万筒条108 + 字28 + 花8
- 金牌百搭集合 `wilds`：{jinPai}；若 jinPai 为万筒条(<27)，白板(29)也视为金牌（白板附带规则）；j进Pai==29 时无附带

## 3. 服务端规则实现（gamemgr_zp.js / gamemgr_zp4.js）
顶部常量 `SEAT_COUNT`（zp=2 / zp4=4），其余逻辑参数化，两文件完全独立。

- 牌墙：`mahjongs[144]`，`currentIndex`(头)/`tailIndex`(尾，初始143)。正常摸牌取头；**补花、杠补、开金均取尾**。剩余数 = tailIndex-currentIndex+1；取尽即流局
- 发牌：轮流摸至闲16/庄17；摸到花自动亮出(hua[])并从尾补，递归至非花
- 开金：发牌补花完成后从尾翻牌，花牌则继续向内重翻直至非花；fanPai=翻出牌(移出牌墙展示)，jinPai=fanPai 面值；其后判定：庄17已成胡→天胡(canHu)；闲16+金成胡→抢金选项(game_action_push 带 qiangjin:true)。`game.qiangJinOpen=true`，首次吃/碰/杠后置 false
- 行牌：turn 轮转 `(turn+1)%N`；吃仅允许上家(discarder==(eater+N-1)%N)；碰/杠任意家；**吃碰杠仅限真实牌，金不参与代牌**；打出的金牌所有人不可吃碰杠胡（操作检测前 isWild(target) 直接跳过）
- 胡牌结构：5组面子+1将(17张)，金可代；七对=7对子+1刻(17张，金可补)；清一色(全同色无字)/混一色(同色+字)
- 点炮限制：手牌金牌数>=2 时禁止点炮胡(仅自摸/游金)；三金倒(手牌>=3金)直接胡，赔付按自摸
- 游金：自己回合摸牌后(17张)，枚举非金牌X使 holds-{X}=4面子+1金 → action 带 youjin:[X...]；客户端发 `youjin {pai}` → 打出X并置 seatData.youJinLevel=1，广播 game_youjin_push{si,level}。任一玩家游金期间：其他人打出的牌所有人不可吃碰杠胡(只能自摸)。游金者每次摸牌必 canHu；level<you_jin_max(默认3)时另给「继续游」选项，客户端发 `youjin_go` → 代打摸到的牌、level++、再广播；超时未操作自动胡。他人胡牌则游金自然结束(无额外结算)
- 杠：暗杠(4真)、点杠(3真+人打出)、弯杠(碰后摸到第4张真牌)；杠后从尾补一张(lastGangHua 标记供杠上开花)；弯杠用真牌时先暂停，检查其他家抢杠胡(点炮赔付+qiang_gang台)，无人抢再续杠；金不可用于杠
- 台数(tai_rules JSON 全可配，缺省值)：hua_tai1/朵、jin_tai1/张、ming_gang1、an_gang2、san_jin_dao2、qiang_jin2、qi_dui3、hun_yise1、qing_yise3、gang_kai1、qiang_gang1、ping_hu0、you_jin_multi2(每级乘)、you_jin_max3、fenbing0(分饼开关)、chupai_timeout15
- 结算：tai 封顶 conf.maxTai(默认10)；score = baseScore × 2^tai × (游金时 you_jin_multi^level)。点炮放炮者付；自摸/三金倒/抢金/杠开其他每家付；抢杠胡杠者付。完整 tailog 明细 console 输出并随 huinfo 下发
- 分饼(仅4人且 fenbing=1)：其余各家首张出牌均与庄家首张相同 → 庄家立即赔每家 baseScore，广播 game_fenbing_push{si}
- 连庄：庄胡或流局 → 下局连庄(lastHuIsBanker=true)；闲胡轮庄
- 对齐 ldh 健壮性：个性化推送(自己 holds 数组/他人数量)、clearMoPaiTimeout/clearTurnTimeout、超时托管(出牌打末张/操作自动过)、game_over_push 携带全量 seats 数据(holds/pengs/chis/folds/angangs/diangangs/wangangs/hua/huinfo.tailog)、endinfo 统计、roundHistory、final 标记、房卡按局扣除、db.create_game/update_game_result/update_num_of_turns、resendGameState(含 turn/jinPai/fanPai/hua/youjinLevel)、bao/huanSanZhang/dingQue 空实现防崩、__getGame/__calculateTai 测试钩子

## 4. 服务端接入改动
- `roommgr.js`：createRoom 白名单加 "zp"/"zp4"；getGameMgrByType 加映射 zp→gamemgr_zp、zp4→gamemgr_zp4；conf 组装加 zp 分支(conf.taiRules=cfg.tai_rules)
- `socket_service.js`：新增 `youjin`(data.pai→gameMgr.youjin)、`youjin_go`(→gameMgr.youjinContinue) 两个带守卫的消息处理

## 5. 客户端改动
- 新场景/脚本(克隆 mjgame_ldh.fire + MJGameLDH.js，替换脚本 uuid 与类名)：
  - `assets/module/mjgame/mjgame_zp.fire` + `MJGameZP.js`(新uuid A)
  - `assets/module/mjgame/mjgame_zp4.fire` + `MJGameZP4.js`(新uuid B)
  - 克隆 `GameOver.js`→`GameOverZP.js`、`GameResult.js`→`GameResultZP.js`(结算展示台数/游金明细，不碰共享文件)
  - MJGameZP*.js 新增：花牌区(huaArea 容器运行时建于各座位侧，牌底+花名 Label)、game_hua_push 处理、游金/继续游按钮(复用 _options 区)、game_youjin_push 状态标示、金牌标示复用 initCaishenTip(caishen=jinPai)
- `resources/script/GameNetMgr.js`：getGameScene 加 zp→mjgame_zp、zp4→mjgame_zp4；getWanfa 加名称；game_start_push 透传 seat.hua/youjinLevel；新增 game_hua_push/game_youjin_push/game_fenbing_push 处理器(仅透传 dispatchEvent)
- `module/hall/srcipts/hall.js` L1098：人数判断加 `gt.indexOf("zp4")===0 → 4`

## 6. 后台改动
- `server/sql/migrate_zp.js`(仿现有 migrate 脚本)：向 t_game_config 插入
  - ('zp','漳浦麻将(2人)','[1,2,5]','[4,8]','[2,3]',2,10, tai_rules=漳浦JSON, enabled=1)
  - ('zp4','漳浦麻将(4人)','[1,2,5]','[4,8]','[2,3]',4,10, 同上)
  - ON DUPLICATE KEY UPDATE name
- `server/admin/index.html`：TAI_RULE_FIELDS 按 type 分流 —— type 以 'zp' 开头时用 ZP_TAI_RULE_FIELDS(上述16项)，renderTaiRules/getTaiRules 带 type 参数；列表/编辑/保存复用现有接口(admin_api.js 已通用)
- 俱乐部后台(club.html)添加玩法下拉自动出现 zp/zp4(数据源 t_game_config，无需改动)

## 7. 验证
1. `node --check` 全部改动/新增服务端 js
2. 新增 `server/tests/test_zp.js` 单测：发牌张数(庄17/闲16/补花)、开金非花、白板附带代入胡牌、5组+将胡牌判定、七对、2金禁点炮、三金倒、游金候选枚举、台数计算(花/金/杠/牌型/封顶/游金翻倍)、抢金窗口关闭；`node tests/test_zp.js` 全绿
3. 执行迁移 `node sql/migrate_zp.js`，SELECT 确认两行落库
4. 重启 game_server/account_server，日志无报错；后台 /admin/game_configs 可见 zp/zp4
5. 客户端 Cocos Creator 刷新资源后由用户编译实测(场景需在构建面板勾选)

## 8. 不做的事
- 不改 zj/zj_bt/zj4/zj4_bt/dzpk 任何代码与配置
- 不为花牌新增图集/AI图片
- 不实现规则文本外的民间变体(除分饼开关外)
