---
aliases:
  - Trimmomatic
date: 05-04-2026
dg-publish: true
parent:
summary: Гибкий инструмент для триммирования и фильтрации ридов Illumina
tags: []
type: 📄note

💻Bioinfo:
  - tool
  - preprocessing

🦠Metagenomics:
  - preprocessing

🧬Sequencing:
  - trimming
  - tech/illumina
---

# Trimmomatic

## Описание

Гибкий инструмент для триммирования данных Illumina. Удаляет адаптеры, низкокачественные основания и короткие риды после обрезки.

## Принцип работы

- Удаление адаптерных последовательностей
- Sliding window trimming по качеству
- Отбрасывание ридов ниже порогового значения длины

## Входные данные

- FASTQ файлы (paired-end или single-end)

## Выходные данные

- Очищенные FASTQ файлы

## Применение

- Short-read метагеномика (Illumina)

## Связанные концепты

- [[Контроль качества метагеномных данных]]
- [[Projects/_To restore/notes_metagenome/FastQC]]
- [[BBTOOLS]]

## CLI / Использование

```bash
- [ ] Дополнить примером команды Trimmomatic #todo
```
