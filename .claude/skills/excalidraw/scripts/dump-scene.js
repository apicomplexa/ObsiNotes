#!/usr/bin/env node
// dump-scene.js — читаемая выгрузка сцены .excalidraw.md.
// Первое, что стоит запустить: без неё непонятно, какой id у какого блока,
// куда ведут стрелки и где что лежит на холсте.
//
//   node dump-scene.js "C:/.../Схема.excalidraw.md"            # текстовый дамп
//   node dump-scene.js "C:/.../Схема.excalidraw.md" --json out.json
//   node dump-scene.js "C:/.../Схема.excalidraw.md" --tree     # только граф стрелок

const ex = require("./excalidraw-io.js");
const fs = require("fs");

const [, , path, flag, out] = process.argv;
if (!path) { console.error("usage: node dump-scene.js <file.excalidraw.md> [--json out.json|--tree]"); process.exit(1); }

const doc = ex.load(path);
const els = doc.elements.filter(e => !e.isDeleted);

if (flag === "--json") {
  fs.writeFileSync(out || "scene.json", JSON.stringify(doc.scene, null, 2), "utf8");
  console.log("written", out || "scene.json", "—", els.length, "live elements");
  process.exit(0);
}

const label = e => {
  if (e.type === "text") return JSON.stringify((e.originalText || e.text || "").slice(0, 60));
  const bound = (e.boundElements || []).find(b => b.type === "text");
  if (bound && doc.byId[bound.id]) return "[label] " + JSON.stringify(doc.byId[bound.id].text);
  return e.type;
};

if (flag === "--tree") {
  for (const a of els.filter(e => e.type === "arrow")) {
    const s = a.startBinding && doc.byId[a.startBinding.elementId];
    const t = a.endBinding && doc.byId[a.endBinding.elementId];
    const lbl = (a.boundElements || []).find(b => b.type === "text");
    console.log(
      (s ? label(s) : "(free)") + "  --" + (lbl && doc.byId[lbl.id] ? doc.byId[lbl.id].text : "") + "->  " +
      (t ? label(t) : "(free)"));
  }
  process.exit(0);
}

console.log("elements:", els.length, "(+" + (doc.elements.length - els.length) + " deleted)");
for (const e of els) {
  let line = `[${e.type}] id=${e.id} x=${Math.round(e.x)} y=${Math.round(e.y)} w=${Math.round(e.width)} h=${Math.round(e.height)}`;
  if (e.type === "text") {
    line += ` fs=${e.fontSize} color=${e.strokeColor} container=${e.containerId || "-"}\n    ${label(e)}`;
  } else if (e.type === "arrow" || e.type === "line") {
    line += ` start=${e.startBinding ? e.startBinding.elementId : "-"} end=${e.endBinding ? e.endBinding.elementId : "-"}`;
    line += ` pts=${JSON.stringify(e.points.map(p => p.map(Math.round)))}`;
  } else if (e.type === "image") {
    line += ` fileId=${e.fileId}` + (e.customData && e.customData.latex ? ` latex=${JSON.stringify(e.customData.latex)}` : "");
  } else {
    line += ` stroke=${e.strokeColor} bg=${e.backgroundColor}`;
  }
  if (e.boundElements && e.boundElements.length) line += `\n    bound=${JSON.stringify(e.boundElements)}`;
  if (e.groupIds && e.groupIds.length) line += `\n    groups=${JSON.stringify(e.groupIds)}`;
  console.log(line);
}
