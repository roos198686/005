const fs = require('fs');
for (const file of ['d:/babykylin_scmj/client/assets/module/hall/hall.fire', 'd:/babykylin_scmj/client/assets/module/hall/club.fire']) {
  const d = JSON.parse(fs.readFileSync(file, 'utf8'));
  const short = file.split('/').pop();
  console.log('===', short);
  // Canvas 组件
  const canvasComps = d[2]._components.map((c) => d[c.__id__].__type__);
  console.log('  Canvas comps:', canvasComps.join(','));
  const hallComp = d[2]._components.map((c) => d[c.__id__]).find((c) => c.__type__ === 'a63d9t3AuBKVLfInT9JAVaH');
  console.log('  hall comp joinGameWin =', hallComp.joinGameWin && hallComp.joinGameWin.__id__, d[hallComp.joinGameWin.__id__]._name);

  const cp = d[2]._children.map((c) => c.__id__).find((id) => d[id]._name === 'clubPage');
  const closure = (root) => { const s = new Set([root]); const w = [root]; while (w.length) { const id = w.pop(); const o = d[id]; (o._children || []).forEach((c) => { if (!s.has(c.__id__)) { s.add(c.__id__); w.push(c.__id__); } }); (o._components || []).forEach((c) => s.add(c.__id__)); } return s; };
  d[cp]._children.forEach((c) => {
    const win = d[c.__id__];
    if (!/Win/.test(win._name)) return;
    const sub = closure(c.__id__);
    let events = 0, external = [], handlers = {};
    const walk = [c.__id__];
    const seen = new Set();
    while (walk.length) {
      const id = walk.pop();
      if (seen.has(id)) continue;
      seen.add(id);
      const o = d[id];
      (o._components || []).forEach((cr) => {
        const comp = d[cr.__id__];
        if (!comp) return;
        (comp.clickEvents || []).forEach((er) => {
          const ev = d[er.__id__];
          if (!ev) return;
          events++;
          const t = ev.target && ev.target.__id__;
          if (!sub.has(t)) external.push(t + ':' + (d[t] && d[t]._name));
          const h = ev.component ? (ev.component.name || ev.component) + '.' + ev.handler : '?';
          handlers[h] = (handlers[h] || 0) + 1;
        });
      });
      (o._children || []).forEach((x) => walk.push(x.__id__));
    }
    // 键盘按钮
    const keypad = win._children.map((x) => d[x.__id__]).find((n) => n._name === 'New Node');
    const keys = keypad ? keypad._children.map((x) => d[x.__id__]._name) : [];
    console.log('  ' + win._name + ': clickEvents=' + events, 'externalTargets=[' + external.join(',') + ']',
      'keypadActive=' + (keypad ? keypad._active : 'NA'), 'keys=' + keys.length + (keys.length ? '(' + keys.join(',') + ')' : ''));
    console.log('    handlers:', JSON.stringify(handlers));
  });
}
