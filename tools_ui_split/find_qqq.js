// 在常见磁盘位置搜索 MySQL 数据目录中的 qqq 库文件夹(qqq目录下含 .ibd/.frm 文件)
const fs = require('fs');
const path = require('path');

const roots = [
    'C:/ProgramData/MySQL',
    'C:/Program Files/MySQL',
    'D:/',
    'C:/Users/xsc',
    'C:/mysql',
    'D:/mysql',
    'D:/babykylin_scmj'
];

const hits = [];
function isMysqlDataDir(d) {
    // mysql数据目录特征:含 mysql 或 performance_schema 或 sys 子目录
    try {
        const names = fs.readdirSync(d);
        return names.includes('mysql') || names.includes('performance_schema');
    } catch (e) { return false; }
}
function walk(d, depth) {
    if (depth > 4) return;
    let entries;
    try { entries = fs.readdirSync(d, { withFileTypes: true }); } catch (e) { return; }
    for (const e of entries) {
        if (!e.isDirectory()) continue;
        const p = path.join(d, e.name);
        if (e.name.toLowerCase() === 'qqq') {
            // 确认是mysql库目录(含ibd/frm/opt文件)
            let files = [];
            try { files = fs.readdirSync(p); } catch (err) { files = ['<无权限>']; }
            hits.push({ dir: p, files: files.slice(0, 8) });
            continue;
        }
        // 疑似数据目录的上级才深入
        if (isMysqlDataDir(p)) {
            try {
                if (fs.readdirSync(p).map(x => x.toLowerCase()).includes('qqq')) {
                    hits.push({ dir: path.join(p, 'qqq'), files: fs.readdirSync(path.join(p, 'qqq')).slice(0, 8) });
                }
            } catch (err) {}
            continue;
        }
        walk(p, depth + 1);
    }
}
for (const r of roots) {
    if (fs.existsSync(r)) walk(r, 0);
}
if (!hits.length) console.log('未找到 qqq 库数据目录');
for (const h of hits) console.log('找到: ' + h.dir + '  文件: ' + h.files.join(','));
