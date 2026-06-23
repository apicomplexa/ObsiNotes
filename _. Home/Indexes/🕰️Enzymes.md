---
aliases:
  - Ферменты
  - Enzymes
creation date: 2023-01-05
cssclasses: 
date: 02-11-2025
dg-publish: true
parent:
summary: 
tags: []
type: 🗂️index
---

# Ферменты

```dataviewjs
let otherRools = '#biology/mol_bio/enzymes' //start from spase " "
let a = dv.current();


let b = dv.pages(otherRools)

dv.table(['Название', 'Краткое определение', 'Ссылка на Wiki'], b.map(p => [dv.fileLink(p.file.path, false, p.title), p.def, p.wiki_link])
)
```
