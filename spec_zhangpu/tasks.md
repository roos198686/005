# 漳浦麻将 实施任务

## 服务端
- [x] T1 重写 `server/game_server/gamemgr_zp.js`（SEAT_COUNT=2，漳浦全规则，接口对齐 ldh）
- [x] T2 新增 `server/game_server/gamemgr_zp4.js`（复制 T1，SEAT_COUNT=4，分饼逻辑生效）
- [x] T3 改 `server/game_server/roommgr.js`：白名单 zp/zp4、getGameMgrByType 映射、conf.taiRules 传递
- [x] T4 改 `server/game_server/socket_service.js`：加 youjin / youjin_go 消息（带 gameMgr 方法守卫）
- [x] T5 新增 `server/sql/migrate_zp.js` 插入 zp/zp4 配置行

## 客户端
- [x] T6 生成两个新脚本 uuid；克隆 `MJGameLDH.js` → `MJGameZP.js`/`MJGameZP4.js`（含 .meta），加花牌区/游金按钮/补花与游金消息处理
- [x] T7 克隆 `GameOver.js`→`GameOverZP.js`、`GameResult.js`→`GameResultZP.js`（漳浦台数/游金结算展示），MJGameZP* 依赖指向克隆版
- [x] T8 克隆 `mjgame_ldh.fire` → `mjgame_zp.fire`/`mjgame_zp4.fire`（替换 MJGameLDH 脚本 uuid→新 uuid、类名字符串；含 .meta）
- [x] T9 改 `GameNetMgr.js`：场景路由、玩法名、hua/youjinLevel 透传、game_hua_push/game_youjin_push/game_fenbing_push 处理器
- [x] T10 改 `hall.js`：zp4 人数=4

## 后台
- [x] T11 改 `server/admin/index.html`：ZP_TAI_RULE_FIELDS 按 type 分流渲染/读取

## 验证
- [x] T12 `node --check` 所有服务端改动文件；新增并跑通 `server/tests/test_zp.js`
- [x] T13 执行迁移并核验数据库；重启 game_server/account_server 确认日志无错、/admin/game_configs 返回 zp/zp4

依赖顺序：T1→T2→T3→T4→T5；T6→T7→T8→T9→T10；T11 独立；T12/T13 最后。
