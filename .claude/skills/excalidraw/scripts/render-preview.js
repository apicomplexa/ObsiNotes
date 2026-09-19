#!/usr/bin/env node
// render-preview.js — отрендерить схему в PNG, чтобы посмотреть результат правок.
// Единственный способ действительно проверить раскладку: координаты в JSON ничего
// не говорят о том, как это выглядит. Рендерит сам плагин внутри запущенного Obsidian.
//
//   node render-preview.js "Projects/.../Схема.excalidraw.md" "media/preview.png" [scale]
//
// Оба пути — ОТНОСИТЕЛЬНО корня хранилища (их получает Obsidian API, не файловая система).
// scale по умолчанию 0.35 — на нём крупная схема влезает в один разборчивый скриншот.
// Файл кладётся внутрь хранилища; после просмотра удали его.

const { execFileSync } = require("child_process");

const [, , src, dest, scaleArg] = process.argv;
if (!src || !dest) {
  console.error('usage: node render-preview.js <vault/rel/src.excalidraw.md> <vault/rel/out.png> [scale]');
  process.exit(1);
}
const scale = Number(scaleArg || 0.35);
const VAULT = "ObsiNotes";

const run = code => execFileSync("obsidian", [`vault=${VAULT}`, "eval", `code=${code}`], { encoding: "utf8" }).trim();

// eval не дожидается промисов — запускаем задачу и опрашиваем глобальный флаг
const start = `(()=>{window.__exRender='running';(async()=>{try{
const ea=app.plugins.plugins['obsidian-excalidraw-plugin'].ea.getAPI();
const blob=await ea.createPNG(${JSON.stringify(src)},${scale},{withBackground:true,withTheme:true},undefined,'light');
const buf=await blob.arrayBuffer();
const p=${JSON.stringify(dest)};
const f=app.vault.getAbstractFileByPath(p);
if(f){await app.vault.modifyBinary(f,buf);}else{await app.vault.createBinary(p,buf);}
window.__exRender='done '+buf.byteLength;
}catch(e){window.__exRender='err '+e.message;}})();return 'started';})()`;

run(start.replace(/\n/g, ""));

for (let i = 0; i < 40; i++) {
  const s = run("window.__exRender");
  if (s.includes("done")) { console.log(dest, "—", s); process.exit(0); }
  if (s.includes("err")) { console.error(s); process.exit(1); }
  execFileSync(process.execPath, ["-e", "setTimeout(()=>{},500)"]);
}
console.error("timeout");
process.exit(1);
