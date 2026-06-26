---
aliases:
  - enetic Investigation of Communities by Reconstruction of Unobserved States
date: 02-11-2025
dg-publish: true
parent:
summary: Программное обеспечение для прогнозирования функциональной распространенности исключительно на основе последовательностей маркерных генов. Обычно ASV 16S rRNA
tags: []
type: 📄note
wiki_link: https://github.com/picrust/picrust2/wiki
💻Bioinfo:
  - tool
  - database
🦠Metagenomics:
  - 16S
  - taxonomicProfiling
  - functionalAnnotation
---

> [!abstract] Кратко
> **PICRUSt2** (*Phylogenetic Investigation of Communities by Reconstruction of Unobserved States*) — инструмент для **предсказания функционального потенциала** микробного сообщества по последовательностям маркерного гена (обычно [[ASV]] 16S rRNA). Он не секвенирует геномы, а *достраивает* (reconstruct unobserved states) набор генов каждой [[ASV]] по её положению на референсном филогенетическом дереве и затем суммирует по образцам. Результат — таблицы предсказанной численности генов (KO/EC) и метаболических путей (MetaCyc), сопоставимые по структуре с данными шотган-метагеномики, но получаемые из дешёвого 16S-ампликона.

# Общий пайплайн работы

![[Pasted image 20260626171004.png]]

# Как это работает

PICRUSt2 выполняет **4 последовательных шага** (один на каждый под-скрипт; `picrust2_pipeline.py` объединяет их):

1. **Sequence placement** — каждая входная [[ASV]] размещается на референсном дереве ~20 000 геномов прокариот.
   - Дефолт — **EPA-ng** (`-t epa-ng`); альтернатива — **SEPP** (`-t sepp`).
   - Под капотом: выравнивание на референс (HMMER), затем филогенетическое размещение → файл `out.tre`.
2. **Hidden-state prediction (HSP)** — по дереву предсказывается набор копий генов для каждой ASV.
   - R-пакет **castor**; метод по умолчанию `mp` (maximum parsimony), доступны `emp_prob`, `pic`, `subtree_average` и др. (`-m`).
   - Параллельно предсказывается **число копий гена 16S** → используется для нормализации (организмы с многими копиями 16S «переоценены» в ампликоне).
3. **Metagenome prediction** — численность ASV (нормированная на копийность 16S) умножается на предсказанный генный профиль → суммарная численность каждого KO/EC по образцам.
4. **Pathway abundance inference** — KO/EC регруппируются в реакции и пути **MetaCyc**; для отсечения «ложных» путей применяется **MinPath** (выбирает минимальный набор путей, объясняющий наблюдаемые ферменты).

## NSTI — метрика доверия

**NSTI** (*Nearest Sequenced Taxon Index*) — филогенетическое расстояние от ASV до ближайшего референсного генома. Чем больше NSTI, тем менее надёжно предсказание.
- ASV с **NSTI > 2** (`--max_nsti 2`, дефолт) отбрасываются.
- Отсев единиц-десятков ASV из десятков тысяч — норма. Массовый отсев = ваши ASV плохо представлены в референсе → PICRUSt2 для этих данных малопригоден.
- На образец считается **weighted NSTI** (`weighted_nsti.tsv.gz`) — взвешенное по численности среднее; полезно как QC-показатель образца.

# Установка

```bash
# через conda (рекомендуется, тянет EPA-ng, gappa, HMMER, castor, MinPath)
mamba create -n picrust2 -c bioconda -c conda-forge picrust2
conda activate picrust2
picrust2_pipeline.py -h
```

# Полный пайплайн: `picrust2_pipeline.py`

Один вызов отрабатывает все 4 шага.

```bash
picrust2_pipeline.py \
  -s asv_seqs.fna \         # FASTA с ASV (НЕ сырые риды)
  -i asv_table.biom \       # таблица численности ASV (biom / tsv / mothur shared)
  -o picrust2_out \         # выходная директория (не должна существовать)
  -p 16 \                   # число процессов
  --max_nsti 2 \            # порог отсечения по NSTI
  --stratified \            # (опц.) вклад каждого таксона в функцию — тяжело по RAM/времени
  --verbose
```

| Флаг | Назначение |
|------|-----------|
| `-s` | FASTA представительных последовательностей ASV |
| `-i` | таблица численности ASV (biom/tsv/mothur) |
| `-o` | выходная папка |
| `-p` | параллельные процессы |
| `-t` | инструмент размещения: `epa-ng` (дефолт) / `sepp` |
| `-m` | метод HSP: `mp` (дефолт), `emp_prob`, `pic` … |
| `--max_nsti` | порог NSTI (дефолт 2) |
| `--stratified` | стратифицированный вывод (по таксонам) |
| `--no_pathways` | пропустить шаг путей MetaCyc |

> [!warning] Частые причины падений
> - **ID последовательностей в FASTA не совпадают с ID в таблице** — обрежьте заголовки: `awk '{print $1}' in.fna > out.fna`.
> - На вход идут **ASV** (репрезентативные последовательности из [[DADA2]]), а не сырые/демультиплексированные риды.
> - При ошибке параллелизма перезапустите проблемный под-скрипт с `--processes 1` для читаемого сообщения.

## Структура вывода

```
picrust2_out/
├── out.tre                                   # дерево с размещёнными ASV (newick)
├── *_marker_predicted_and_nsti.tsv.gz        # копийность 16S + NSTI на каждую ASV
├── KO_metagenome_out/
│   ├── pred_metagenome_unstrat.tsv.gz        # KO × образцы — численность генов
│   ├── pred_metagenome_contrib.tsv.gz        # стратифицированно (если --stratified)
│   ├── seqtab_norm.tsv.gz                     # ASV, нормированные на копийность 16S
│   └── weighted_nsti.tsv.gz                   # weighted NSTI на образец (QC)
├── EC_metagenome_out/                         # то же для EC-номеров ферментов
└── pathways_out/
    ├── path_abun_unstrat.tsv.gz              # MetaCyc-пути × образцы — численность
    └── path_cov_unstrat.tsv.gz              # покрытие путей
```

Главные таблицы для анализа: `KO_metagenome_out/pred_metagenome_unstrat.tsv.gz`, `EC_metagenome_out/pred_metagenome_unstrat.tsv.gz`, `pathways_out/path_abun_unstrat.tsv.gz`.

## Добавление описаний: `add_descriptions.py`

KO/EC/MetaCyc-таблицы содержат только идентификаторы. Чтобы добавить человекочитаемые названия в первый столбец:

```bash
add_descriptions.py -i KO_metagenome_out/pred_metagenome_unstrat.tsv.gz \
                    -m KO  -o KO_pred_described.tsv.gz
add_descriptions.py -i pathways_out/path_abun_unstrat.tsv.gz \
                    -m METACYC -o path_abun_described.tsv.gz
```

Типы карт `-m`: `KO`, `EC`, `COG`, `PFAM`, `TIGRFAM`, `METACYC`.

# Ключевые ограничения

> [!caution] Что важно помнить при интерпретации
> - **Это предсказание, а не измерение.** Корреляция с шотган-метагеномикой высокая, но *конкретный* набор дифференциально-представленных функций может заметно расходиться.
> - **Зависимость от референса.** Предсказываются только гены, присутствующие в референсных геномах; штаммовая вариабельность по 16S не разрешается. Среды представлены неравномерно (кишечник человека — хорошо, рубец/экзотические среды — хуже).
> - **EPA-ng невоспроизводим** при разном наборе входных последовательностей — выводы на уровне отдельных ASV хрупки.
> - **KEGG-пути** официально не поддерживаются (KEGG закрыт); по умолчанию — MetaCyc. KEGG-пути возможны только через устаревший маппинг ~2011 г. (`--no_regroup`). См. [[KEGG]].
> - **Праймер-байес.** Предсказание охватывает лишь те таксоны, что улавливают ваши праймеры.
> - **Композиционные данные.** Выход нельзя анализировать наивными тестами — нужны CLR/композиционные методы (см. ниже).

# Использование в пайплайне (Snakemake + DADA2 + Phyloseq)

PICRUSt2 встаёт **между** таксономическим профилированием и статистикой:

```
Сырые риды
   │  cutadapt / trimming
   ▼
DADA2 ──► ASV-таблица (seqtab) + репрезентативные последовательности (ASV)
   │                         │
   │ export                  │ export
   ▼                         ▼
asv_table.biom          asv_seqs.fna
   └──────────┬───────────────┘
              ▼
        PICRUSt2 (picrust2_pipeline.py)
              ▼
   KO / EC / MetaCyc-таблицы (pred_metagenome_unstrat, path_abun_unstrat)
              ▼
   Phyloseq / ggpicrust2 / ALDEx2  ──►  дифф. анализ, ординация, визуализация
```

## Подготовка входа из DADA2

PICRUSt2 нужны **две вещи**, обе получаются из объекта [[DADA2]] `seqtab.nochim`:

```r
library(Biostrings); library(biomformat)
seqs <- colnames(seqtab.nochim)              # сами последовательности ASV
ids  <- paste0("ASV", seq_along(seqs))       # короткие ID

# 1) FASTA репрезентативных последовательностей
names(seqs) <- ids
writeXStringSet(DNAStringSet(seqs), "asv_seqs.fna")

# 2) BIOM-таблица численности (features = ASV, columns = образцы)
tab <- t(seqtab.nochim); rownames(tab) <- ids
write_biom(make_biom(tab), "asv_table.biom")
```

Главное — **синхронизировать ID** между FASTA и таблицей (одинаковые `ASV1, ASV2…`), иначе пайплайн упадёт.

## Обёртка в Snakemake

PICRUSt2 — обычный CLI-шаг, удобно завернуть отдельным правилом. Контролируйте сборку мусора: выходная папка `-o` **не должна существовать** заранее, поэтому полезно удалять её в начале правила.

```python
rule picrust2:
    input:
        seqs = "results/dada2/asv_seqs.fna",
        table = "results/dada2/asv_table.biom",
    output:
        ko   = "results/picrust2/KO_metagenome_out/pred_metagenome_unstrat.tsv.gz",
        path = "results/picrust2/pathways_out/path_abun_unstrat.tsv.gz",
    params:
        outdir = "results/picrust2",
        nsti   = 2,
    threads: 16
    conda: "envs/picrust2.yaml"          # picrust2 из bioconda
    shell:
        r"""
        rm -rf {params.outdir}
        picrust2_pipeline.py \
            -s {input.seqs} -i {input.table} \
            -o {params.outdir} -p {threads} \
            --max_nsti {params.nsti} --verbose
        """

rule picrust2_describe:
    input:  "results/picrust2/KO_metagenome_out/pred_metagenome_unstrat.tsv.gz"
    output: "results/picrust2/KO_described.tsv.gz"
    conda:  "envs/picrust2.yaml"
    shell:  "add_descriptions.py -i {input} -m KO -o {output}"
```

> [!tip] Практика
> - Минимальная глубина образцов **до** PICRUSt2 — ориентир ~4000 ридов; **не рарефицировать** перед предсказанием.
> - `--stratified` резко увеличивает время и RAM — включайте только если нужен вклад таксонов в функцию.
> - Логируйте долю отсеянных по NSTI ASV и `weighted_nsti` как QC.

## Импорт результата обратно в Phyloseq

KO/EC/path-таблицы можно загрузить как `otu_table` нового `phyloseq`-объекта, переиспользуя `sample_data` из 16S-анализа (имена образцов = столбцы таблицы PICRUSt2):

```r
library(phyloseq)
ko <- read.delim(gzfile("results/picrust2/KO_metagenome_out/pred_metagenome_unstrat.tsv.gz"),
                 row.names = 1)
ps_func <- phyloseq(
  otu_table(as.matrix(ko), taxa_are_rows = TRUE),
  sample_data(ps_16s)            # переиспользуем метаданные из 16S-объекта
)
```

Дальше — те же приёмы, что и для таксономии в [[Phyloseq]]: фильтрация, ординация, дифф. анализ. Поскольку данные **композиционные**, для дифф. представленности используйте **ALDEx2 / ANCOM-BC** или специализированный **ggpicrust2** (CLR-преобразование, PCA, аннотация путей KEGG/MetaCyc), а не обычный t-test на сырых счётчиках.

> [!info] Полезные ссылки
> - Wiki: https://github.com/picrust/picrust2/wiki — разделы *Standard full pipeline*, *Standard output*, *Key limitations*, *FAQ*.
> - `ggpicrust2`, `FuncDiv` — R-пакеты для downstream-анализа и функционального разнообразия.
