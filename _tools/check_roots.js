const fs = require('fs');
for (const file of ['d:/babykylin_scmj/client/assets/module/hall/hall.fire', 'd:/babykylin_scmj/client/assets/module/hall/club.fire']) {
  const d = JSON.parse(fs.readFileSync(file, 'utf8'));
  const short = file.split('/').pop();
  console.log('===', short, 'd[0]=', JSON.stringify(d[0]));
  d.forEach((o, i) => {
    if (o && (o.__type__ === 'cc.Scene' || o.__type__ === 'cc.SceneAsset')) {
      const kids = (o._children || []).map((c) => c.__id__ + ':' + (d[c.__id__] && d[c.__id__]._name));
      console.log(' id=' + i, o.__type__, 'name=' + (o._name || '-'), 'sceneRef=' + (o.scene && o.scene.__id__), 'children=[' + kids.join(',') + ']');
    }
  });
}
