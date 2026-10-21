-- 台数规则可配置化：t_game_config 增加 tai_rules JSON 列
-- 键位说明：dong_ke_banker(东风刻庄家) dong_ke_player(东风刻闲家/四人通用) zfb_ke(中发白刻各)
-- ping_hu(平胡) duidui_hu(对对胡) hun_yise(混一色) hun_duidui_extra(混一色对对追加)
-- qing_yise(清一色) qing_extra(清一色平胡/对对追加) gang_kai(杠上开花) wu_cai(无财) bao_wucai(包财神无财模式)
ALTER TABLE `t_game_config` ADD COLUMN `tai_rules` text DEFAULT NULL COMMENT '台数规则JSON(后台可调)' AFTER `caishen_cpg`;
