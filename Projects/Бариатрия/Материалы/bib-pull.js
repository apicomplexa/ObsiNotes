// Забирает записи коллекции Zotero «Бариатрия» в проектную библиографию CSL JSON.
//
//   node "Projects/Бариатрия/Материалы/bib-pull.js"
//
// Зачем не глобальный zotero_lib.bib: тот собирается Better BibTeX с опцией
// asciiBibLaTeX, которая превращает кириллицу в \cyrchar\CYRF… — citeproc такие
// макросы не разворачивает, и русские источники в библиографии теряют текст.
// CSL JSON от BBT отдаёт Unicode как есть.
//
// Требуется запущенный Zotero с плагином Better BibTeX.

const fs = require('fs');
const http = require('http');
const path = require('path');

const COLLECTION_KEY = 'QD46G62K'; // «Бариатрия» в локальной библиотеке
const OUT = path.join(__dirname, 'Бариатрия.json');
const ZOTERO = { host: '127.0.0.1', port: 23119 };

function request(options, body) {
  return new Promise((resolve, reject) => {
    // agent: false обязателен — с keep-alive ответ HTTP/1.0-сервера Zotero не закрывается;
    // заголовок Connection ставить нельзя, BBT на нём подвисает
    options = { ...options, agent: false };
    const req = http.request(options, res => {
      let d = '';
      res.setEncoding('utf8');
      res.on('data', c => (d += c));
      res.on('end', () => resolve({ status: res.statusCode, body: d }));
    });
    req.on('error', reject);
    req.end(body);
  });
}

async function rpc(method, params) {
  const body = Buffer.from(JSON.stringify({ jsonrpc: '2.0', method, params, id: 1 }), 'utf8');
  const res = await request({
    ...ZOTERO, path: '/better-bibtex/json-rpc', method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Content-Length': body.length },
  }, body);
  const parsed = JSON.parse(res.body);
  if (parsed.error) throw new Error(`${method}: ${parsed.error.message}`);
  return parsed.result;
}

(async () => {
  const res = await request({
    ...ZOTERO,
    path: `/api/users/0/collections/${COLLECTION_KEY}/items/top?limit=200`,
    method: 'GET',
  });
  if (res.status !== 200) throw new Error(`Zotero local API вернул ${res.status}`);

  const items = JSON.parse(res.body);
  const keys = items.map(i => i.data.citationKey).filter(Boolean).sort();
  const noKey = items.filter(i => !i.data.citationKey);
  if (noKey.length) {
    console.warn('без citation key (в библиографию не попадут):');
    noKey.forEach(i => console.warn('  -', i.data.title || i.data.nameOfAct));
  }

  const json = await rpc('item.export', [keys, 'Better CSL JSON']);
  JSON.parse(json); // проверка, что это валидный JSON
  fs.writeFileSync(OUT, json, 'utf8');

  console.log('записей выгружено:', keys.length);
  keys.forEach(k => console.log('  ', k));
  console.log('→', OUT);
})();
