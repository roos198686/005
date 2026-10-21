-- 德州扑克迁移脚本
-- 1. t_rooms 扩展座位列（支持最多9人）
ALTER TABLE `t_rooms`
  ADD COLUMN `user_id4` int(11) NOT NULL DEFAULT '0' AFTER `user_score3`,
  ADD COLUMN `user_icon4` varchar(128) NOT NULL DEFAULT '' AFTER `user_id4`,
  ADD COLUMN `user_name4` varchar(32) NOT NULL DEFAULT '' AFTER `user_icon4`,
  ADD COLUMN `user_score4` int(11) NOT NULL DEFAULT '0' AFTER `user_name4`,
  ADD COLUMN `user_id5` int(11) NOT NULL DEFAULT '0' AFTER `user_score4`,
  ADD COLUMN `user_icon5` varchar(128) NOT NULL DEFAULT '' AFTER `user_id5`,
  ADD COLUMN `user_name5` varchar(32) NOT NULL DEFAULT '' AFTER `user_icon5`,
  ADD COLUMN `user_score5` int(11) NOT NULL DEFAULT '0' AFTER `user_name5`,
  ADD COLUMN `user_id6` int(11) NOT NULL DEFAULT '0' AFTER `user_score5`,
  ADD COLUMN `user_icon6` varchar(128) NOT NULL DEFAULT '' AFTER `user_id6`,
  ADD COLUMN `user_name6` varchar(32) NOT NULL DEFAULT '' AFTER `user_icon6`,
  ADD COLUMN `user_score6` int(11) NOT NULL DEFAULT '0' AFTER `user_name6`,
  ADD COLUMN `user_id7` int(11) NOT NULL DEFAULT '0' AFTER `user_score6`,
  ADD COLUMN `user_icon7` varchar(128) NOT NULL DEFAULT '' AFTER `user_id7`,
  ADD COLUMN `user_name7` varchar(32) NOT NULL DEFAULT '' AFTER `user_icon7`,
  ADD COLUMN `user_score7` int(11) NOT NULL DEFAULT '0' AFTER `user_name7`,
  ADD COLUMN `user_id8` int(11) NOT NULL DEFAULT '0' AFTER `user_score7`,
  ADD COLUMN `user_icon8` varchar(128) NOT NULL DEFAULT '' AFTER `user_id8`,
  ADD COLUMN `user_name8` varchar(32) NOT NULL DEFAULT '' AFTER `user_icon8`,
  ADD COLUMN `user_score8` int(11) NOT NULL DEFAULT '0' AFTER `user_name8`;

-- 2. t_game_config 增加起始筹码选项列
ALTER TABLE `t_game_config`
  ADD COLUMN `chips_options` varchar(64) NOT NULL DEFAULT '[1000,2000,5000]' COMMENT '德州扑克起始筹码选项JSON数组' AFTER `cost_options`;

-- 3. 插入德州扑克玩法配置
-- difen_options = 小盲选项，jushu_options = 牌局手数选项，cost_options = 房卡消耗，chips_options = 起始筹码
INSERT INTO `t_game_config` (`type`,`name`,`difen_options`,`jushu_options`,`cost_options`,`chips_options`,`max_players`,`max_tai`,`caishen_cpg`,`enabled`,`sort`) VALUES
('dzpk','德州扑克','[5,10,20]','[5,10,20]','[2,3,4]','[1000,2000,5000]',9,10,1,1,4)
ON DUPLICATE KEY UPDATE `name`=VALUES(`name`);
