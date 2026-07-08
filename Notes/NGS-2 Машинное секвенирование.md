---
aliases:
  - "NGS - Machine sequencing"
cssclasses:
  - "page-color-pu"
date: 02-11-2025
dg-publish: true
parent:
summary: Технологии массивного параллельного секвенирования ДНК и РНК
tags: []
type: "📄note"
🧬Sequencing:
  - "machineSeq"
---

# Раздел: [[_NGS|NGS]]

---

# Технологии

```dataviewjs
let otherRools = ' and #biology/methods/seq/ngs/tech' //start from spase " "
let a = dv.current();

let inlinkedPages = a.file.inlinks.values.map((link) => `"${link.path}"`);

if (inlinkedPages.length) {
	let b = dv.pages(`${inlinkedPages.join(' or ')}${otherRools}`)
	b.sort(p => p.title).map(p => `${dv.header(3, dv.fileLink(p.file.path, false, p.title))}\n\n`)
}
```
