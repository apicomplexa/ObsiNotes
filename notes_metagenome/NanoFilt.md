---
aliases: [NanoFilt]
date: 05-04-2026
dg-publish: true
summary: Инструмент фильтрации длинных ридов Nanopore по качеству и длине
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

# NanoFilt

## Описание
Фильтрация long-read ридов секвенирования (Nanopore) по стандартным параметрам.

## Параметры фильтрации
- Среднее качество рида
- Длина рида
- GC-содержание

## Входные данные
- FASTQ файлы (Nanopore)

## Выходные данные
- Отфильтрованные FASTQ файлы

## Применение
- QC long-read метагеномных данных

## Связанные концепты
- [[Контроль качества метагеномных данных]]
- [[LongQC]]
- [[Секвенирующие платформы]]

## CLI / Использование
```bash
- [ ] Дополнить примером команды NanoFilt #todo