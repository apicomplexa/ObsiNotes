---
aliases:
  - Phred
  - Phred quality score
  - Q score
date: 02-11-2025
dg-publish: true
parent:
summary: вероятность ошибочного определения основания
tags: []
type: 📄note
⚙️Methods:
  - QC
🧬Sequencing:
---

> [!$] `$=dv.current().file.name`
> `$=dv.current().summary`

- Риды с Phred score <30 содержат технические артефакты (ошибки секвенирования, PCR-артефакты, адаптерные последовательности)
- Обычно оставляют более 30 - остальное [[Тримминг|отрезать]]

[Expected errors predicted by Phred (Q) scores](https://www.drive5.com/usearch/manual/exp_errs.html)
