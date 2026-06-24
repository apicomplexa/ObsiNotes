---
aliases:
  - sourmash
date: 05-04-2026
dg-publish: true
parent:
summary: Библиотека для MinHash скетчинга ДНК, используемая в таксономическом профилировании
tags: []
type: 📄note

💻Bioinfo:
  - tool

🖥️IT:
  - algorithm
  - strings/comparison

🦠Metagenomics:
  - taxonomicProfiling
---

# Sourmash

## Описание

Библиотека для MinHash скетчинга ДНК. Обобщённый метод, применимый для таксономического профилирования как short-read, так и long-read данных.

## Принцип работы

- MinHash: подвыборки k-меров для оценки геномного сходства
- Оценка индекса сходства последовательностей

## Входные данные

- FASTQ/FASTA файлы

## Выходные данные

- Таксономический профиль

## Применение

- Высокие precision и recall без фильтрации
- Эффективно для long-read данных

## Связанные концепты

- [[k-mer таксономическая классификация]]
- [[Metalign]]
- [[Mash Screen]]

## CLI / Использование

```bash
- [ ] Дополнить примером команды sourmash #todo
