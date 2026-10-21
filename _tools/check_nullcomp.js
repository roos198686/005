// 定位 live 节点中指向 null slot 的组件引用,并对比备份
function scan(file, label) {
  const d = JSON.parse(require('fs').readFileSync(file, 'utf8'));
  console.log('===', label);
  d.forEach((o, i) => {
    if (!o || !o._components) return;
    o._components.forEach((c, k) => {
      if (c && typeof c.__id__ === 'number' && (c.__id__ >= d.length || d[c.__id__] == null)) {
        console.log('  node id=' + i, o._name, 'components[' + k + '] -> null slot', c.__id__);
      }
    });
  });
}
scan('d:/babykylin_scmj/client/assets/module/hall/hall.fire', 'hall CURRENT');
scan('d:/babykylin_scmj/_tools/backup/hall.fire.bak_gc', 'hall BACKUP');
scan('d:/babykylin_scmj/client/assets/module/hall/club.fire', 'club CURRENT');
scan('d:/babykylin_scmj/_tools/backup/club.fire.bak_gc', 'club BACKUP');
