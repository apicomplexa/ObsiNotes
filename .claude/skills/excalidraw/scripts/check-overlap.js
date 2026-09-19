#!/usr/bin/env node
// check-overlap.js — не легли ли новые элементы поверх существующих.
// Ставя блок «на глаз» по координатам, промахнуться очень легко, а увидеть это
// можно только открыв схему. Скрипт ловит наложения до записи.
//
//   node check-overlap.js "C:/.../Схема.excalidraw.md" id1,id2,id3
//   node check-overlap.js "C:/.../Схема.excalidraw.md" --color "#6741d9"
//
// Оговорка: ширина текста здесь — оценка (CHAR_W в excalidraw-io.js).
// Плагин пересчитывает её точно при открытии, и реальные блоки выходят
// процентов на 15 шире. Проверяй с запасом либо сверяйся после открытия в Obsidian.

const ex = require("./excalidraw-io.js");

const [, , path, sel, colorArg] = process.argv;
if (!path || !sel) {
  console.error('usage: node check-overlap.js <file.excalidraw.md> <id1,id2,...|--color "#rrggbb">');
  process.exit(1);
}

const doc = ex.load(path);
const live = doc.elements.filter(e => !e.isDeleted);

// У стрелок габаритная рамка почти всегда пересекает что-нибудь по диагонали,
// хотя сама линия проходит мимо — проверять их бессмысленно, только шум.
const SOLID = ["text", "rectangle", "ellipse", "diamond", "image"];

const targets = (sel === "--color"
  ? live.filter(e => e.strokeColor === colorArg)
  : sel.split(",").map(id => doc.get(id.trim()))
).filter(e => SOLID.includes(e.type));

if (!targets.length) { console.error("nothing selected"); process.exit(1); }
const targetIds = new Set(targets.map(e => e.id));

let found = 0;
for (const t of targets) {
  const clashes = live.filter(e =>
    !targetIds.has(e.id) &&
    e.containerId == null &&                       // подписи внутри контейнеров не считаем
    SOLID.includes(e.type) &&
    ex.overlaps(t, e));
  found += clashes.length;
  const b = ex.bbox(t);
  const box = `[${Math.round(b.x)},${Math.round(b.y)} .. ${Math.round(b.x + b.width)},${Math.round(b.y + b.height)}]`;
  console.log(`${t.id} ${box} ->`,
    clashes.length
      ? clashes.map(e => `${e.id} ${JSON.stringify((e.text || e.type).slice(0, 30))}`).join(", ")
      : "ok");
}
console.log(found ? `\n${found} наложений` : "\nналожений нет");
process.exit(found ? 1 : 0);
