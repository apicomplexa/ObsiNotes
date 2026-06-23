---
dg-publish: true
type: 📄note
aliases:
  - ORPHAdata
tags: 
summary: уникальный ресурс, собирающий и совершенствующий знания о редких заболеваниях с целью улучшения диагностики, ухода и лечения пациентов с редкими заболеваниями
💻Bioinfo:
  - database
🥼Med:
  - disease
wiki_link:
  - https://www.orphadata.com
  - https://www.orpha.net
---

> [!$] `$=dv.current().file.name`
> `$=dv.current().summary`


- содержит 6 тыс. При этом используется собственная система кодирования, отличная от МКБ.
- Отношения с МКБ:
	- __Exact:__ ORPHACode соответствует МКБ и обозначают одну патологию
	- __BTNT__ (broader term to narrower term): ORPHACode описывает более широкое понятие, чем МКБ
	- __NTBT__ (narrower term to broader term): более узкое понятие
	- __ND__ (not yet decided or unable to decide): остальные случаи
- Более подробно, о правилах номенклатуры см [rules.pdf](https://www.orpha.net/pdfs/orphacom/cahiers/docs/GB/Orphanet_ICD10_coding_rules.pdf)
- 
