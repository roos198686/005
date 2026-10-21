-- 后台管理系统数据库表
-- 玩法配置表
CREATE TABLE IF NOT EXISTS `t_game_config` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `type` varchar(16) NOT NULL COMMENT '玩法类型 zj(翻财神2人)/zj_bt(包财神2人)/zj4(翻财神4人)/zj4_bt(包财神4人)',
  `name` varchar(32) NOT NULL COMMENT '玩法名称',
  `difen_options` varchar(64) NOT NULL DEFAULT '[1,2,5]' COMMENT '底分选项JSON数组',
  `jushu_options` varchar(64) NOT NULL DEFAULT '[4,8]' COMMENT '局数选项JSON数组',
  `cost_options` varchar(64) NOT NULL DEFAULT '[2,3]' COMMENT '对应局数的房卡消耗JSON数组',
  `max_players` int(11) NOT NULL DEFAULT 2 COMMENT '最大玩家数',
  `max_tai` int(11) NOT NULL DEFAULT 10 COMMENT '封顶台数',
  `caishen_cpg` tinyint(1) NOT NULL DEFAULT 1 COMMENT '财神是否可参与吃碰杠 1=是 0=否',
  `tai_rules` text DEFAULT NULL COMMENT '台数规则JSON(后台可调)',
  `enabled` tinyint(1) NOT NULL DEFAULT 1 COMMENT '是否启用',
  `sort` int(11) NOT NULL DEFAULT 0 COMMENT '排序',
  PRIMARY KEY (`id`),
  UNIQUE KEY `type` (`type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- 初始化玩法配置（翻财神台数规则JSON：min_tai起胡门槛 dong_ke东风刻 zfb_ke中发白刻
-- ping_hu平胡 duidui_hu对对胡 hun_yise混一色 qing_yise清一色 gang_kai杠上开花 qiang_gang抢杠胡 wu_cai无财）
INSERT INTO `t_game_config` (`type`,`name`,`difen_options`,`jushu_options`,`cost_options`,`max_players`,`max_tai`,`caishen_cpg`,`tai_rules`,`enabled`,`sort`) VALUES
('zj','翻财神(2人)','[1,2,5]','[4,8]','[2,3]',2,10,1,'{"min_tai":1,"dong_ke":2,"zfb_ke":1,"ping_hu":1,"duidui_hu":1,"hun_yise":1,"qing_yise":3,"gang_kai":1,"qiang_gang":1,"wu_cai":1}',1,2),
('zj_bt','包麻将(2人)','[1,2,5]','[4,8]','[2,3]',2,10,1,NULL,1,3),
('zj4','翻财神(4人)','[1,2,5]','[4,8]','[2,3]',4,10,1,'{"min_tai":1,"dong_ke":2,"zfb_ke":1,"ping_hu":1,"duidui_hu":1,"hun_yise":1,"qing_yise":3,"gang_kai":1,"qiang_gang":1,"wu_cai":1}',1,2),
('zj4_bt','包麻将(4人)','[1,2,5]','[4,8]','[2,3]',4,10,1,NULL,1,3)
ON DUPLICATE KEY UPDATE `name`=VALUES(`name`);

-- 后台管理员表
CREATE TABLE IF NOT EXISTS `t_admin_users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `username` varchar(32) NOT NULL COMMENT '用户名',
  `password` varchar(64) NOT NULL COMMENT '密码(md5)',
  `role` varchar(16) NOT NULL DEFAULT 'admin' COMMENT '角色',
  `created_at` int(11) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- 默认管理员 admin/admin123
INSERT INTO `t_admin_users` (`username`,`password`,`role`,`created_at`) VALUES
('admin',MD5('admin123'),'super',UNIX_TIMESTAMP())
ON DUPLICATE KEY UPDATE `username`=VALUES(`username`);

-- 后台管理员绑定俱乐部ID(role=club 时为俱乐部管理员，绑定到对应俱乐部)
-- 若该列已存在会报 Duplicate column name，忽略即可(迁移脚本已按幂等处理)
ALTER TABLE `t_admin_users` ADD COLUMN `club_id` int(10) unsigned NULL DEFAULT NULL COMMENT '俱乐部管理员绑定的俱乐部ID';

-- 俱乐部玩法表(每个俱乐部独立维护自己的玩法列表)
CREATE TABLE IF NOT EXISTS `t_club_games` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `club_id` int(10) unsigned NOT NULL COMMENT '俱乐部ID',
  `game_type` varchar(16) NOT NULL COMMENT '对应 t_game_config.type 的玩法类型',
  `name` varchar(32) NOT NULL COMMENT '玩法名称',
  `difen_options` varchar(64) NOT NULL DEFAULT '[1,2,5]' COMMENT '底分选项JSON数组',
  `jushu_options` varchar(64) NOT NULL DEFAULT '[4,8]' COMMENT '局数选项JSON数组',
  `cost_options` varchar(64) NOT NULL DEFAULT '[2,3]' COMMENT '对应局数的房卡消耗JSON数组',
  `sort` int(11) NOT NULL DEFAULT 0 COMMENT '排序',
  `enabled` tinyint(1) NOT NULL DEFAULT 1 COMMENT '是否启用',
  `create_time` int(11) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `club_type` (`club_id`,`game_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- 用存量牌桌回填俱乐部玩法(保证升级后玩家侧俱乐部玩法列表不丢失)
INSERT INTO `t_club_games` (`club_id`,`game_type`,`name`,`difen_options`,`jushu_options`,`cost_options`,`sort`,`enabled`,`create_time`)
SELECT t.club_id, t.game_type, COALESCE(g.name, t.game_type),
       COALESCE(g.difen_options,'[1,2,5]'), COALESCE(g.jushu_options,'[4,8]'), COALESCE(g.cost_options,'[2,3]'),
       COALESCE(g.sort,0), 1, UNIX_TIMESTAMP()
FROM (SELECT DISTINCT club_id, game_type FROM `t_club_tables`) t
LEFT JOIN `t_game_config` g ON g.type = t.game_type
ON DUPLICATE KEY UPDATE `name`=VALUES(`name`);

-- 系统配置表
CREATE TABLE IF NOT EXISTS `t_sys_config` (
  `k` varchar(64) NOT NULL,
  `v` varchar(512) NOT NULL DEFAULT '',
  `remark` varchar(128) DEFAULT '',
  PRIMARY KEY (`k`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

INSERT INTO `t_sys_config` (`k`,`v`,`remark`) VALUES
('notice','欢迎来到幼麟麻将','公告内容'),
('maintain_mode','0','维护模式 0正常 1维护'),
('min_version','1.0.0','最低版本号')
ON DUPLICATE KEY UPDATE `v`=VALUES(`v`);
