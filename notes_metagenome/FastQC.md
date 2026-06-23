---
aliases: [FastQC]
date: 05-04-2026
dg-publish: true
summary: Инструмент контроля качества для данных high-throughput секвенирования
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

# FastQC

## Описание
Инструмент контроля качества для данных high-throughput секвенирования. Широко используется как первый шаг QC в метагеномных пайплайнах.

## Принцип работы
Анализирует FASTQ файлы и генерирует отчёт по нескольким метрикам

## Входные данные
- FASTQ файлы

## Выходные данные
- HTML/текстовый отчёт с модулями:
  - Per-base sequence quality
  - Per-sequence quality scores
  - GC content
  - Sequence length distribution
  - Adapter content
  - Overrepresented sequences (k-мер анализ)

## Применение
- Оценка качества сырых ридов перед триммингом
- Проверка после триммирования

## Связанные концепты
- [[Контроль качества метагеномных данных]]
- [[Trimmomatic]]
- [[PRINSEQ]]

## CLI / Использование
```bash
- [ ] Дополнить примером команды FastQC #todo