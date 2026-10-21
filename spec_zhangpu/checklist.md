# 漳浦麻将 验收清单

- [x] gamemgr_zp.js（2人）完整实现漳浦规则：144张/庄17闲16/自动补花/开金（花重翻）/金牌百搭+白板附带/金不可点炮/2金禁点炮/三金倒/抢金/游金逐级翻倍/台数结算/连庄/流局
- [x] gamemgr_zp4.js（4人）独立文件，SEAT_COUNT=4，分饼逻辑随4人生效
- [x] roommgr 白名单+映射+conf.taiRules 传递，zp/zp4 可建房
- [x] socket_service 新增 youjin / youjin_go 消息（带方法守卫，其他玩法不受影响）
- [x] migrate_zp.js 执行成功，t_game_config 存在 zp/zp4 两行且 /game_config/:type 接口返回正确台项 JSON
- [x] 客户端 mjgame_zp.fire / mjgame_zp4.fire 独立场景 + MJGameZP.js / MJGameZP4.js 独立主脚本（新 uuid，.meta 齐全）
- [x] 花牌用牌底+花名Label渲染；游金按钮/继续游金按钮/抢金按钮接入 action 扩展字段
- [x] GameNetMgr 场景路由 zp→mjgame_zp、zp4→mjgame_zp4；game_hua_push/game_youjin_push/game_fenbing_push 处理器接线
- [x] hall.js 人数判断 zp4=4人
- [x] admin/index.html 按 type 以 zp 开头分流渲染 ZP_TAI_RULE_FIELDS（16项），诸暨/德州分支不变
- [x] 未改动任何现有玩法文件（MJGameLDH/ldh场景/GameOver/GameResult/MJRoom/MahjongMgr 内容不变）
- [x] 服务端全部改动文件 node --check 通过
- [x] tests/test_zp.js 规则单测 35/35 通过（金判定/面子组合/胡结构/七对/点炮限制/抢金/游金/台数/2人4人一致性）
- [x] tests/test_e2e_zp.js 端到端冒烟 20/20 通过（发牌/开金非花/补花/出牌摸牌链路/游金宣告/断线补发）
- [x] game_server 重启后日志无错，9003/10000 正常监听
