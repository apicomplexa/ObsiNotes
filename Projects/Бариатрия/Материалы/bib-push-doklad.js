// Разовый скрипт: добавляет в коллекцию Zotero «Бариатрия» источники, собранные
// для вступления к докладу (Артефакты/БАР - Доклад. Вступление.md).
//
//   node "Projects/Бариатрия/Материалы/bib-push-doklad.js"
//
// Пишет через локальный HTTP API Zotero. Запись требует двух вещей:
//   1) заголовка Zotero-Server-ID — его значение отдаёт любой GET в заголовке ответа;
//   2) ключа от POST /api/local/authorize (нужен appName) — ключ разовый, remember: false,
//      поэтому нигде не сохраняется, запрашивается заново при каждом запуске.
// Citation key закрепляется строкой "Citation Key: …" в поле Extra — так же,
// как у остальных записей коллекции.
//
// Идемпотентность: перед вставкой сверяет citation key уже лежащих в коллекции
// записей и вставляет только отсутствующие. Повторный запуск безопасен.

const http = require('http');

const COLLECTION_KEY = 'QD46G62K';
const ZOTERO = { host: '127.0.0.1', port: 23119 };

function request(options, body) {
  return new Promise((resolve, reject) => {
    options = { ...options, agent: false };
    const req = http.request(options, res => {
      let d = '';
      res.setEncoding('utf8');
      res.on('data', c => (d += c));
      res.on('end', () => resolve({ status: res.statusCode, body: d, headers: res.headers }));
    });
    req.on('error', reject);
    req.end(body);
  });
}

const ACCESSED = '2026-09-28';

// авторы русских статей: инициалы в firstName, как принято в Zotero для ГОСТ-стилей
const ru = (last, initials) => ({ creatorType: 'author', lastName: last, firstName: initials });
const en = (first, last) => ({ creatorType: 'author', firstName: first, lastName: last });

const web = (key, title, site, date, url) => ({
  itemType: 'webpage',
  title,
  websiteTitle: site,
  date,
  url,
  accessDate: ACCESSED,
  language: 'ru',
  extra: `Citation Key: ${key}`,
});

const ITEMS = [
  {
    itemType: 'journalArticle',
    title: 'Распространенность метаболических фенотипов у жителей Арктической зоны Российской Федерации (на примере г. Архангельска)',
    creators: [ru('Постоева', 'А. В.'), ru('Дворяшина', 'И. В.'), ru('Кудрявцев', 'А. В.'), ru('Постоев', 'В. А.')],
    publicationTitle: 'Ожирение и метаболизм',
    volume: '20',
    issue: '1',
    pages: '34–42',
    date: '2023',
    DOI: '10.14341/omet12926',
    ISSN: '2071-8713',
    url: 'https://www.omet-endojournals.ru/jour/article/view/12994',
    accessDate: ACCESSED,
    language: 'ru',
    extra: 'Citation Key: postoeva-fenotipy-2023',
  },
  {
    itemType: 'journalArticle',
    title: 'Assessing the prevalence of obesity in a Russian adult population by six indices and their associations with hypertension, diabetes mellitus and hypercholesterolaemia',
    creators: [en('Kamila', 'Kholmatova'), en('Alexandra', 'Krettek'), en('Irina V.', 'Dvoryashina'), en('Sofia', 'Malyutina'), en('Alexander V.', 'Kudryavtsev')],
    publicationTitle: 'International Journal of Circumpolar Health',
    volume: '83',
    issue: '1',
    pages: '2386783',
    date: '2024-08-06',
    DOI: '10.1080/22423982.2024.2386783',
    ISSN: '2242-3982',
    url: 'https://www.tandfonline.com/doi/full/10.1080/22423982.2024.2386783',
    accessDate: ACCESSED,
    language: 'en',
    extra: 'Citation Key: kholmatova-obesity-2024\nИсследование «Узнай своё сердце» (Know Your Heart), Архангельск и Новосибирск, n = 4495, 35–69 лет, 2015–2018',
  },
  {
    itemType: 'journalArticle',
    title: 'Распространенность ожирения среди населения Российской Федерации: период до пандемии COVID-19',
    creators: [ru('Савина', 'А. А.'), ru('Фейгинова', 'С. И.')],
    publicationTitle: 'Социальные аспекты здоровья населения',
    volume: '68',
    issue: '5',
    date: '2022',
    DOI: '10.21045/2071-5021-2022-68-5-4',
    url: 'http://vestnik.mednet.ru/content/view/1414/30/lang,ru/',
    accessDate: ACCESSED,
    language: 'ru',
    extra: 'Citation Key: savina-ozhirenie-2022\nРанжирование субъектов РФ по данным 2019 г.',
  },
  {
    itemType: 'report',
    title: 'Численность постоянного населения Российской Федерации по муниципальным образованиям на 1 января 2025 года',
    creators: [{ creatorType: 'author', name: 'Федеральная служба государственной статистики' }],
    institution: 'Росстат',
    date: '2025-04-25',
    url: 'https://rosstat.gov.ru/compendium/document/13282',
    accessDate: ACCESSED,
    language: 'ru',
    extra: 'Citation Key: rosstat-naselenie-2025\nАрхангельская область 989 434 чел. с НАО, ≈ 947,5 тыс. без НАО',
  },
  web('29ru-oblast-ves-2026', 'В Архангельской области растет количество людей с лишним весом: врачи опасаются за детей', '29.ru', '2026-05-27', 'https://29.ru/text/health/2026/05/27/76444198/'),
  web('29ru-profilaktika-2026', 'Ожирение и его профилактика в Архангельской области: причины и методы лечения', '29.ru', '2026-07-02', 'https://29.ru/text/health/2026/07/02/76509454/'),
  web('region29-bariatriya-2025', 'В Архангельске провели две сложные операции пациентам с ожирением', 'Регион 29', '2025-03-20', 'https://region29.ru/2025/03/20/67dc2be55a78a18e34050014.html'),
  web('smkc-semashko-bariatriya-2024', 'История успешного похудения: как бариатрическая операция изменила жизнь архангелогородца', 'Северный медицинский клинический центр им. Н. А. Семашко ФМБА России', '2024-09-18', 'https://www.nmcs.ru/news/istoriya_uspeshnogo_pokhudeniya_kak_bariatricheskaya_operatsiya_izmenila_zhizn_arkhangelogorodtsa/'),
  web('profil-pgg-bariatriya-2026', 'Россияне с ожирением смогут получить хирургическую помощь по ОМС', 'Профиль', '2026-04-17', 'https://profile.ru/news/society/health/rossiyane-s-ozhireniem-smogut-poluchit-hirurgicheskuju-pomoshh-po-oms-1848364/'),
  web('foms-kvoty-bariatriya-2026', 'При тяжелом ожирении с 2026 года могут назначить операции по полису ОМС', 'Телепорт.РФ (по сообщению ФОМС для ТАСС)', '2026-09-14', 'https://www.teleport2001.ru/news/2026-09-14/218962-operacii-pri-tyazhelom-ozhirenii-s-2026-goda-mozhno-poluchit-po-oms.html'),
  web('metro-bariatriya-oms-2026', 'Суперожирение, угрожающее жизни, будут бесплатно лечить хирургически: все подробности', 'Metro', '2026-04-17', 'https://www.gazetametro.ru/articles/milliony-rossijan-s-ozhireniem-budut-spaseny-komu-polozhena-besplatnaja-operatsija-17-04-2026'),
  web('vademecum-registr-2024', 'Объем бариатрических операций в РФ вырос почти в три раза за последние три года', 'Vademecum', '2024-01-29', 'https://vademec.ru/news/2024/01/29/obem-bariatricheskikh-operatsiy-v-rf-vyros-pochti-v-tri-raza-za-poslednie-tri-goda/'),
  web('pomorie-registr-sd-2023', 'Архангельская область — на первом месте в России по ведению регистра заболевших сахарным диабетом', 'Поморье', '2023-09-06', 'https://www.pomorie.ru/2023/09/06/64f76a725fb86ce8c40cfff3.html'),
];

const keyOf = extra => (extra.match(/Citation Key:\s*(\S+)/) || [])[1];

(async () => {
  const head = await request({
    ...ZOTERO, path: `/api/users/0/collections/${COLLECTION_KEY}/items/top?limit=200`, method: 'GET',
  });
  if (head.status !== 200) throw new Error(`Zotero local API вернул ${head.status}`);
  const serverId = head.headers['zotero-server-id'];
  if (!serverId) throw new Error('сервер не отдал zotero-server-id — запись невозможна');

  const existing = new Set(
    JSON.parse(head.body)
      .map(i => i.data.citationKey || keyOf(i.data.extra || ''))
      .filter(Boolean)
  );
  console.log('в коллекции уже:', existing.size, 'записей');

  const todo = ITEMS.filter(i => !existing.has(keyOf(i.extra)));
  if (!todo.length) {
    console.log('все записи уже на месте, вставлять нечего');
    return;
  }

  const authBody = Buffer.from(JSON.stringify({ appName: 'Claudian (ObsiNotes)' }), 'utf8');
  const auth = await request({
    ...ZOTERO, path: '/api/local/authorize', method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': authBody.length,
      'Zotero-Server-ID': serverId,
    },
  }, authBody);
  if (auth.status !== 200) throw new Error(`authorize → ${auth.status}: ${auth.body.slice(0, 300)}`);
  const apiKey = JSON.parse(auth.body).key;

  const payload = todo.map(i => ({ ...i, collections: [COLLECTION_KEY] }));
  const body = Buffer.from(JSON.stringify(payload), 'utf8');
  const res = await request({
    ...ZOTERO, path: '/api/users/0/items', method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': body.length,
      'Zotero-Server-ID': serverId,
      'Zotero-API-Key': apiKey,
    },
  }, body);

  if (res.status >= 300) throw new Error(`POST /items → ${res.status}: ${res.body.slice(0, 500)}`);

  const out = JSON.parse(res.body);
  const ok = Object.keys(out.successful || {});
  const failed = out.failed || {};
  ok.forEach(idx => console.log('  + ', keyOf(payload[idx].extra), '—', out.successful[idx].key));
  Object.entries(failed).forEach(([idx, e]) =>
    console.error('  ! ', keyOf(payload[idx].extra), '—', e.message || JSON.stringify(e)));
  console.log('вставлено:', ok.length, 'из', payload.length);
})();
