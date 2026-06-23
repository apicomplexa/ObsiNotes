---
aliases: [LongQC]
date: 05-04-2026
dg-publish: true
summary: Инструмент оценки качества данных long-read секвенирования третьего поколения
tags: []
type: 📄note

💻Bioinfo:
- tool
- preprocessing

🦠Metagenomics:
- preprocessing

🧬Sequencing:
- trimming
---

# LongQC

## Описание
Оценка качества данных long-read секвенирования (третье поколение).

## Принцип работы
Оценивает долю атипичных ридов — «nonsense reads» — потенциально генерируемых низкокачественными порами (Nanopore).

## Входные данные
- FASTQ файлы (Nanopore, PacBio)

## Выходные данные
- Отчёт о качестве ридов

## Связанные концепты
- [[Контроль качества метагеномных данных]]
- [[NanoFilt]]
- [[Секвенирующие платформы]]

## CLI / Использование
```bash
- [ ] Дополнить примером команды LongQC #todo