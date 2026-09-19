// excalidraw-io.js — чтение и правка .excalidraw.md вне Obsidian.
//
// Зачем: сцена в этом хранилище лежит в блоке ```compressed-json``` (LZ-String base64),
// её нельзя ни прочитать, ни отредактировать обычными текстовыми инструментами.
// Модуль распаковывает сцену, даёт править элементы как обычный JS-объект и
// собирает файл обратно ровно в том формате, который ждёт obsidian-excalidraw-plugin.
//
// ВАЖНО, прежде чем писать в хранилище: прочитай references/EDITING-PROGRAMMATICALLY.md —
// там про ловушку с Obsidian Linter, которая портит многострочные текстовые элементы.
//
// Использование:
//   const ex = require('./excalidraw-io.js');
//   const doc = ex.load('C:/.../Схема.excalidraw.md');
//   doc.setText('UuuTZTjl', '48,9%');
//   const c = doc.addText({ text: 'комментарий', x: -100, y: -200, fontSize: ex.FONT.S, color: ex.COLORS.violet });
//   doc.addArrow({ from: [-100, -180], to: [40, -120], color: ex.COLORS.violet });
//   doc.labelArrow('arrowId', '11,3%');
//   doc.save();

const fs = require("fs");
const LZ = require("./lzstring.js");

// --- палитра Excalidraw (stroke) ---
const COLORS = {
  black: "#1e1e1e",
  red: "#e03131",
  green: "#2f9e44",
  blue: "#1971c2",
  orange: "#f08c00",
  violet: "#6741d9",
  grape: "#9c36b5",
  teal: "#0c8599",
  grey: "#868e96",
};

// --- размеры шрифта в UI Excalidraw ---
const FONT = { S: 16, M: 20, L: 28, XL: 36 };

const LINE_HEIGHT = 1.25;
// Эмпирический коэффициент ширины символа для fontFamily 5 (Excalifont).
// Плагин всё равно пересчитает ширину при открытии — это оценка для раскладки.
const CHAR_W = 0.54;

const ID_ALPHA = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
const IDX_ALPHA = "123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

const lines = t => String(t).split("\n");
const textHeight = (t, fontSize) => lines(t).length * fontSize * LINE_HEIGHT;
const textWidth = (t, fontSize) =>
  Math.max(...lines(t).map(l => l.length)) * fontSize * CHAR_W + 6;

/**
 * Габаритная рамка элемента. У стрелок и линий x/y — это НАЧАЛО, а width/height —
 * абсолютные размахи, поэтому x..x+width врёт для стрелок, идущих влево или вверх;
 * для них рамку надо считать по points.
 */
function bbox(e) {
  if ((e.type === "arrow" || e.type === "line") && Array.isArray(e.points)) {
    const xs = e.points.map(p => p[0]), ys = e.points.map(p => p[1]);
    return {
      x: e.x + Math.min(...xs), y: e.y + Math.min(...ys),
      width: Math.max(...xs) - Math.min(...xs), height: Math.max(...ys) - Math.min(...ys),
    };
  }
  return { x: e.x, y: e.y, width: e.width, height: e.height };
}

/** Габаритные рамки элементов пересекаются? */
function overlaps(a, b) {
  const p = bbox(a), q = bbox(b);
  return !(p.x + p.width < q.x || q.x + q.width < p.x ||
    p.y + p.height < q.y || q.y + q.height < p.y);
}

class Doc {
  constructor(path, md, scene, block) {
    this.path = path;
    this.md = md;
    this.scene = scene;
    this._block = block;           // { raw, compressed: bool }
    this._now = Date.now();
    this._seed = 100003;
    this.reindex();
    this._nextIdx = 0;
    this._maxIndex = this.scene.elements
      .map(e => e.index || "")
      .reduce((a, b) => (a > b ? a : b), "a0");
  }

  reindex() {
    this.elements = this.scene.elements;
    this.byId = {};
    for (const e of this.elements) this.byId[e.id] = e;
  }

  get(id) {
    const e = this.byId[id];
    if (!e) throw new Error("no element with id " + id);
    return e;
  }

  /** Живые (не удалённые) текстовые элементы. */
  texts() {
    return this.elements.filter(e => e.type === "text" && !e.isDeleted);
  }

  _seedNext() { return (this._seed += 7919) % 2147483647; }
  _indexNext() { return this._maxIndex + IDX_ALPHA[this._nextIdx++]; }

  /** id текстового элемента ОБЯЗАН быть длиной ровно 8 — так его парсит плагин. */
  _newTextId() {
    let id;
    do {
      id = "";
      for (let i = 0; i < 8; i++) id += ID_ALPHA[Math.floor(Math.random() * ID_ALPHA.length)];
    } while (this.byId[id]);
    return id;
  }

  _newId(prefix) {
    let id;
    do {
      id = (prefix || "el") + "-";
      for (let i = 0; i < 12; i++) id += ID_ALPHA[Math.floor(Math.random() * ID_ALPHA.length)];
    } while (this.byId[id]);
    return id;
  }

  _touch(e) { e.version = (e.version || 1) + 1; e.versionNonce = this._seedNext(); e.updated = this._now; }

  /** Заменить текст существующего элемента (и пересчитать габариты). */
  setText(id, text) {
    const e = this.get(id);
    if (e.type !== "text") throw new Error(id + " is not a text element");
    e.text = text; e.rawText = text; e.originalText = text;
    e.width = textWidth(text, e.fontSize);
    e.height = textHeight(text, e.fontSize);
    this._touch(e);
    return e;
  }

  addText({ text, x, y, fontSize = FONT.M, color = COLORS.black, containerId = null, id = null }) {
    const el = {
      id: id || this._newTextId(), type: "text",
      x, y, width: textWidth(text, fontSize), height: textHeight(text, fontSize),
      angle: 0, strokeColor: color, backgroundColor: "transparent",
      fillStyle: "hachure", strokeWidth: 2, strokeStyle: "solid",
      roughness: 0, opacity: 100, groupIds: [], frameId: null,
      index: this._indexNext(), roundness: null,
      seed: this._seedNext(), version: 1, versionNonce: this._seedNext(),
      isDeleted: false, boundElements: [], updated: this._now, locked: false,
      text, rawText: text, fontSize, fontFamily: 5,
      textAlign: containerId ? "center" : "left",
      verticalAlign: containerId ? "middle" : "top",
      containerId, originalText: text, autoResize: true, lineHeight: LINE_HEIGHT,
      hasTextLink: false, link: null, labelPosition: null,
    };
    if (el.id.length !== 8) throw new Error("text element id must be exactly 8 chars: " + el.id);
    this.elements.push(el); this.byId[el.id] = el;
    return el;
  }

  /**
   * Стрелка по координатам. Без привязки к элементам (startBinding/endBinding = null):
   * так она рисуется ровно там, где сказано, и Excalidraw её не пересчитывает.
   * Для «живой» привязки проще открыть схему в Obsidian и перетащить концы.
   */
  addArrow({ from, to, color = COLORS.black, endArrowhead = "arrow", startArrowhead = null, points = null, id = null }) {
    const pts = points || [[0, 0], [to[0] - from[0], to[1] - from[1]]];
    const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]);
    const el = {
      id: id || this._newId("arrow"), type: "arrow",
      x: from[0], y: from[1],
      width: Math.max(...xs) - Math.min(...xs),
      height: Math.max(...ys) - Math.min(...ys),
      angle: 0, strokeColor: color, backgroundColor: "transparent",
      fillStyle: "hachure", strokeWidth: 2, strokeStyle: "solid",
      roughness: 0, opacity: 100, groupIds: [], frameId: null,
      index: this._indexNext(), roundness: { type: 2 },
      seed: this._seedNext(), version: 1, versionNonce: this._seedNext(),
      isDeleted: false, boundElements: [], updated: this._now,
      link: null, locked: false, points: pts,
      startBinding: null, endBinding: null, startArrowhead, endArrowhead,
      elbowed: false, fixedSegments: null, startIsSpecial: null, endIsSpecial: null,
      moveMidPointsWithElement: false, hasTextLink: false,
      customData: { legacyTextWrap: true },
    };
    this.elements.push(el); this.byId[el.id] = el;
    return el;
  }

  /** Подпись на стрелке (как проценты на рёбрах). Позиция — середина стрелки. */
  labelArrow(arrowId, text, { fontSize = FONT.M, color = COLORS.black } = {}) {
    const a = this.get(arrowId);
    const last = a.points[a.points.length - 1];
    const midX = a.x + last[0] / 2, midY = a.y + last[1] / 2;
    const w = textWidth(text, fontSize), h = textHeight(text, fontSize);
    const t = this.addText({ text, x: midX - w / 2, y: midY - h / 2, fontSize, color, containerId: arrowId });
    a.boundElements = (a.boundElements || []).concat([{ type: "text", id: t.id }]);
    this._touch(a);
    return t;
  }

  /**
   * LaTeX-узел (image-элемент с customData.latex). fileId — просто ключ в
   * секции "## Embedded Files", менять его не надо; достаточно переписать формулу.
   */
  setLatex(imageId, latex) {
    const img = imageId
      ? this.get(imageId)
      : this.elements.find(e => e.type === "image" && e.customData && e.customData.latex);
    if (!img) throw new Error("no latex image element found");
    const old = img.customData.latex;
    img.customData.latex = latex;
    this._touch(img);
    const esc = old.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const re = new RegExp("(" + img.fileId + ":\\s*\\$\\$\\s*\\n?)" + esc + "(\\s*\\n?\\$\\$)");
    if (!re.test(this.md)) throw new Error("latex source not found in '## Embedded Files' for " + img.fileId);
    this.md = this.md.replace(re, "$1" + latex.replace(/\$/g, "$$$$") + "$2");
    return img;
  }

  /** Собрать markdown обратно и записать файл. */
  save(outPath) {
    this.md = this._rebuildTextSection(this.md);
    this.md = this._rebuildDrawing(this.md);
    fs.writeFileSync(outPath || this.path, this.md, "utf8");
    return outPath || this.path;
  }

  // --- секция "## Text Elements" ---
  // Формат плагина: `${raw} ^${id}\n\n` для каждого текстового элемента.
  // Парсер плагина: /\s\^(.{8})[\n]+/g, затем pos += 12. Отсюда два требования:
  // id ровно 8 символов и ровно два перевода строки после него.
  _rebuildTextSection(md) {
    const head = "## Text Elements\n";
    const at = md.indexOf(head);
    if (at < 0) throw new Error("no '## Text Elements' section");
    const bodyStart = at + head.length;
    let end = -1;
    for (const marker of ["\n## Element Links", "\n## Embedded Files", "\n## Drawing", "\n# Markdown Images"]) {
      const i = md.indexOf(marker, bodyStart);
      if (i >= 0 && (end < 0 || i < end)) end = i;
    }
    if (end < 0) throw new Error("no section after '## Text Elements'");

    const body = md.slice(bodyStart, end);
    const entries = [];
    const re = /\s\^(.{8})[\n]+/g;
    let pos = 0, m;
    while ((m = re.exec(body)) !== null) {
      entries.push({ id: m[1], raw: body.substring(pos, m.index) });
      pos = m.index + 12;
    }
    const known = new Set(entries.map(e => e.id));
    // синхронизировать текст существующих
    for (const e of entries) {
      const el = this.byId[e.id];
      if (el && el.type === "text") e.raw = el.originalText;
    }
    // дописать всё, чего в секции нет
    for (const el of this.elements) {
      if (el.type === "text" && !el.isDeleted && !known.has(el.id)) {
        entries.push({ id: el.id, raw: el.originalText });
        known.add(el.id);
      }
    }
    let out = "";
    for (const e of entries) out += `${e.raw} ^${e.id}\n\n`;
    return md.slice(0, bodyStart) + out + md.slice(end + 1);
  }

  // --- блок ```compressed-json``` / ```json``` ---
  _rebuildDrawing(md) {
    // Плагин сериализует сцену с отступом в таб — повторяем, иначе пересохранение
    // без правок даёт другой файл и мусорный diff в git.
    const json = JSON.stringify(this.scene, null, "\t");
    let replacement;
    if (this._block.compressed) {
      // и пишет base64 строками по 256 символов, разделёнными пустой строкой
      const chunked = LZ.compressToBase64(json).match(/.{1,256}/g).join("\n\n");
      replacement = "```compressed-json\n" + chunked + "\n```";
    } else {
      replacement = "```json\n" + json + "\n```";
    }
    return md.replace(this._block.raw, () => replacement);
  }
}

/** Прочитать .excalidraw.md. */
function load(path) {
  const md = fs.readFileSync(path, "utf8");
  let m = md.match(/```compressed-json\n([\s\S]*?)\n```/);
  if (m) {
    const json = LZ.decompressFromBase64(m[1].replace(/[\n\r ]/g, ""));
    if (!json) throw new Error("failed to decompress drawing data");
    return new Doc(path, md, JSON.parse(json), { raw: m[0], compressed: true });
  }
  m = md.match(/```json\n([\s\S]*?)\n```/);
  if (m) return new Doc(path, md, JSON.parse(m[1]), { raw: m[0], compressed: false });
  throw new Error("no drawing block found in " + path);
}

module.exports = { load, Doc, COLORS, FONT, textWidth, textHeight, bbox, overlaps, LZ };
