---
aliases:
  - ordination
  - ординации
  - MDS
  - ASV Ordination
date: 02-11-2025
dg-publish: true
parent:
summary: Пакет для анализа таксономических данных ASV
tags: []
type: 📄note
💻Bioinfo:
  - tool
🦠Metagenomics:
  - ASV
  - taxonomicProfiling
  - beta
---

> [!$] `$=dv.current().file.name`
> `$=dv.current().summary`

# ASV Ordination

> [!$] Оценка [Бета разнообразие](Notes/%D0%91%D0%B5%D1%82%D0%B0%20%D1%80%D0%B0%D0%B7%D0%BD%D0%BE%D0%BE%D0%B1%D1%80%D0%B0%D0%B7%D0%B8%D0%B5.md)

 __"Многомерное масштабирование" (MDS).__

- Помещаем образец в многомерную систему координат
- Измерения - любые величины
- Здесь - __Представленность ASVs__

Воспользуемся методом [PCoA](Notes/%D0%90%D0%BD%D0%B0%D0%BB%D0%B8%D0%B7%20%D0%B3%D0%BB%D0%B0%D0%B2%D0%BD%D1%8B%D1%85%20%D0%BA%D0%BE%D0%BE%D1%80%D0%B4%D0%B8%D0%BD%D0%B0%D1%82.md)

Для построения [Бета разнообразие](Notes/%D0%91%D0%B5%D1%82%D0%B0%20%D1%80%D0%B0%D0%B7%D0%BD%D0%BE%D0%BE%D0%B1%D1%80%D0%B0%D0%B7%D0%B8%D0%B5.md) нужно использовать [нормализированные каунты](Notes/%D0%9D%D0%BE%D1%80%D0%BC%D0%B0%D0%BB%D0%B8%D0%B7%D0%B0%D1%86%D0%B8%D1%8F%20AVS.md)

```R
# making our phyloseq object with transformed table
vst_count_phy <- otu_table(vst_trans_count_tab, taxa_are_rows=T)
sample_info_tab_phy <- sample_data(sample_info_tab)
vst_physeq <- phyloseq(vst_count_phy, sample_info_tab_phy)

    # generating and visualizing the PCoA with phyloseq
vst_pcoa <- ordinate(vst_physeq, method="MDS", distance="euclidean")
eigen_vals <- vst_pcoa$values$Eigenvalues # allows us to scale the axes according to their magnitude of separating apart the samples

plot_ordination(vst_physeq, vst_pcoa, color="char") + 
    geom_point(size=1) + 
    labs(col="type") + 
    geom_text(aes(label=rownames(sample_info_tab), hjust=0.3, vjust=-0.4)) + 
    coord_fixed(sqrt(eigen_vals[2]/eigen_vals[1])) + 
    ggtitle("PCoA") + 
    scale_color_manual(values=unique(sample_info_tab$color[order(sample_info_tab$char)])) + 
    theme_bw() + theme(legend.position="none")
```

![486](_.Settings/Media/Pasted%20image%2020260422093656.png)

> [!warning] Это исследовательская визуализация, не имеющая статистической значимости. но позволяет прикинуть, куда копать дальше

# Альфа разнообразие

> [!$] Построение графиков [Chao1 & Shannon](Notes/Chao1%20&%20Shannon.md)

- Воспользуемся `plot_richness()`
- Здесь нужна матрица __без нормализации__

```R
# first we need to create a phyloseq object using our un-transformed count table
count_tab_phy <- otu_table(count_tab, taxa_are_rows=T)
tax_tab_phy <- tax_table(tax_tab)

ASV_physeq <- phyloseq(count_tab_phy, tax_tab_phy, sample_info_tab_phy)

    # and now we can call the plot_richness() function on our phyloseq object
plot_richness(ASV_physeq, color="char", measures=c("Chao1", "Shannon")) + 
    scale_color_manual(values=unique(sample_info_tab$color[order(sample_info_tab$char)])) +
    theme_bw() + theme(legend.title = element_blank(), axis.text.x = element_text(angle = 90, vjust = 0.5, hjust = 1))
```

![445](_.Settings/Media/Pasted%20image%2020260424111448.png)

> [!warning] Не подходит для сравнения между экспериментами
> Это просто метрики, подсвечивающие образцы _внутри_ эксперимента, и не означают __реальные__ значения чего-либо

# Шпаргалка

## 🏗️ Структура объекта phyloseq

```
phyloseq
├── otu_table()      — матрица обилий (OTU/ASV × образцы)
├── tax_table()      — таксономическая аннотация (OTU × ранги)
├── sample_data()    — метаданные образцов (list: образцы × переменные)
├── phy_tree()       — филогенетическое дерево (класс phylo)
└── refseq()         — референсные последовательности (опц.)
```

### Создание объекта

```r
# Из отдельных компонентов
OTU  <- otu_table(matrix_data, taxa_are_rows = TRUE)
TAX  <- tax_table(taxonomy_matrix)   # colnames =    domain  phylum  class   order   family  genus   species
META <- sample_data(metadata_df)
TREE <- read_tree("tree.nwk")

ps <- phyloseq(OTU, TAX, META, TREE)
```

---

## 🔍 Базовые инспекторы

| Функция                              | Что возвращает         |
| ------------------------------------ | ---------------------- |
| `ntaxa(ps)`                          | Число таксонов         |
| `nsamples(ps)`                       | Число образцов         |
| `sample_names(ps)`                   | Имена образцов         |
| `taxa_names(ps)`                     | Имена таксонов         |
| `rank_names(ps)`                     | Таксономические ранги  |
| `sample_variables(ps)`               | Переменные метаданных  |
| `taxa_are_rows(ps)`                  | Ориентация OTU-таблицы |
| `microbiome::summarize_phyloseq(ps)` | Сводка объекта         |

```r
ps                        # краткое резюме
head(otu_table(ps))       # первые строки OTU-таблицы
head(tax_table(ps))       # первые строки таксономии
head(sample_data(ps))     # первые строки метаданных
```

---

## ✂️ Фильтрация и подмножества

### По образцам и таксонам

```r
# По метаданным (логическое условие)
ps_sub <- subset_samples(ps, Treatment == "Control")
ps_sub <- subset_samples(ps, Age > 30 & Site == "Gut")

# По таксономии
ps_bact <- subset_taxa(ps, Kingdom == "Bacteria")
ps_firm <- subset_taxa(ps, Phylum == "Firmicutes")

# По произвольной функции (filter_taxa)
# Оставить таксоны с суммой > 10 хотя бы в 20% образцов
ps_filt <- filter_taxa(ps, function(x) sum(x > 10) > 0.2 * nsamples(ps), TRUE)

# Удалить таксоны с нулевым обилием
ps_pruned <- prune_taxa(taxa_sums(ps) > 0, ps)

# Pruning by taxa names / sample names
ps_sub2  <- prune_samples(sample_names(ps)[1:10], ps)
ps_taxsub <- prune_taxa(top20_taxa, ps)
```

### Топ-N таксонов

```r
top20 <- names(sort(taxa_sums(ps), decreasing = TRUE))[1:20]
ps20  <-prune_taxa(top20, ps)
```

---

## 🔄 Нормализация (трансформации)

```r
# Относительное обилие (proportions)
ps_rel  <- transform_sample_counts(ps, function(x) x / sum(x))

# log-трансформация (CLR-подобная)
ps_log  <- transform_sample_counts(ps, function(x) log(1 + x))

# Rarefaction (разреживание до минимальной глубины)
ps_rare <- rarefy_even_depth(ps, sample.size = min(sample_sums(ps)),
                              rngseed = 42, replace = FALSE)

# Стандартизация по медиане (для DESeq2-совместимости)
# → см. секцию DESeq2 ниже
```

---

## 📊 Агрегация по таксономическому рангу

```r
ps_genus  <- tax_glom(ps, taxrank = "Genus")
ps_family <- tax_glom(ps, taxrank = "Family")
ps_phylum <- tax_glom(ps, taxrank = "Phylum")

# Проверить количество таксонов после агрегации
ntaxa(ps_genus)
```

---

## 📈 Альфа-разнообразие

```r
# Встроенные метрики: Observed, Chao1, ACE, Shannon, Simpson, InvSimpson, Fisher
alpha <- estimate_richness(ps, measures = c("Observed", "Shannon", "Simpson"))

# Визуализация (встроенная)
plot_richness(ps, x = "Treatment", color = "Site",
              measures = c("Shannon", "Simpson")) +
  geom_boxplot() +
  theme_bw()
```

### С пакетом `vegan`

```r
library(vegan)
otu_mat <- as(otu_table(ps), "matrix")
if (taxa_are_rows(ps)) otu_mat <- t(otu_mat)

# Evenness (Pielou's J)
shannon <- diversity(otu_mat, index = "shannon")
pielou_j <- shannon / log(specnumber(otu_mat))
```

---

## 🌐 Бета-разнообразие и ординация

### Вычисление дистанций

```r
# Встроенные методы: "bray", "jaccard", "unifrac", "wunifrac", "jsd", "euclidean"
dist_bray   <- phyloseq::distance(ps_rel, method = "bray")
dist_uni    <- phyloseq::distance(ps, method = "unifrac")   # нужно дерево
dist_wuni   <- phyloseq::distance(ps, method = "wunifrac")  # нужно дерево
```

### Ординация

```r
# Методы: "PCoA", "NMDS", "RDA", "CCA", "DCA", "DPCoA", "MDS"
ord_pcoa <- ordinate(ps_rel, method = "PCoA", distance = "bray")
ord_nmds <- ordinate(ps_rel, method = "NMDS", distance = "bray")
ord_wuni <- ordinate(ps,     method = "PCoA", distance = "wunifrac")

# Визуализация
plot_ordination(ps_rel, ord_pcoa, type = "samples",
                color = "Treatment", shape = "Site") +
  geom_point(size = 3) +
  stat_ellipse() +
  theme_bw()

# Biplot (образцы + таксоны)
plot_ordination(ps_rel, ord_pcoa, type = "biplot",
                color = "Phylum", title = "PCoA Bray-Curtis")

# Split plot
plot_ordination(ps_rel, ord_pcoa, type = "split",
                color = "Phylum", shape = "Treatment")
```

### Статистика (PERMANOVA с `vegan`)

```r
library(vegan)
meta <- data.frame(sample_data(ps_rel))
adonis2(dist_bray ~ Treatment * Site, data = meta,
        permutations = 999, method = "bray")

# Homogeneity of dispersion
betadisper_res <-betadisper(dist_bray, meta$Treatment)
permutest(betadisper_res)
```

---

## 📉 Визуализация состава

### Barplot

```r
# Агрегировать и нормировать перед построением
ps_rel_phylum <-tax_glom(ps_rel, "Phylum")

plot_bar(ps_rel_phylum, x = "Sample", fill = "Phylum") +
  geom_bar(stat = "identity", position = "stack") +
  theme_bw() +
  theme(axis.text.x = element_text(angle = 45, hjust = 1))
```

### Heatmap

```r
plot_heatmap(ps20, method = "NMDS", distance = "bray",
             taxa.label = "Genus", sample.label = "Treatment")
```

### Сеть (network)

```r
plot_net(ps_rel, distance = "bray", type = "samples",
         color = "Treatment", maxdist = 0.4)
```

---

## 🌳 Филогенетическое дерево

```r
plot_tree(ps, color = "Treatment", shape = "Phylum",
          size = "Abundance", label.tips = "Genus",
          ladderize = "left", plot.margin = 0.3)
```

---

## 🔗 Интеграция с другими пакетами

---

### 🔬 DESeq2 — дифференциальная обилие

```r
library(DESeq2)

# Конвертация phyloseq → DESeqDataSet
# (phyloseq_to_deseq2 — удобная обёртка)
dds <-phyloseq_to_deseq2(ps, ~ Treatment)

# Оценка размерных факторов (для данных с нулями)
dds <-estimateSizeFactors(dds, type = "poscounts")

dds <-DESeq(dds, test = "Wald", fitType = "parametric")
res <-results(dds, contrast = c("Treatment", "Case", "Control"),
               alpha = 0.05)

# Отфильтровать значимые
sig <-res[which(res$padj <- 0.05 & abs(res$log2FoldChange) > 1), ]
```

---

### 📦 Microbiome — расширенные утилиты

```r
library(microbiome)

# Трансформации
ps_clr  <-microbiome::transform(ps, "clr")   # centered log-ratio
ps_comp <-microbiome::transform(ps, "compositional")

# Альфа-разнообразие (дополнительные индексы)
div <-microbiome::alpha(ps, index = "all")

# Dominance, rarity, evenness
microbiome::dominance(ps, index = "all")
microbiome::rarity(ps, index = "all")
microbiome::evenness(ps, index = "all")

# Core microbiome (присутствует в X% образцов с порогом обилия Y)
core_taxa <-core_members(ps_comp, detection = 0.001, prevalence = 0.5)
ps_core   <-core(ps_comp, detection = 0.001, prevalence = 0.5)
```

---

### 🌲 Picante — филогенетическое разнообразие

```r
library(picante)

otu_mat <-as(otu_table(ps), "matrix")
if (taxa_are_rows(ps)) otu_mat <-t(otu_mat)
tree    <-phy_tree(ps)

# Faith's PD
pd_res <-pd(otu_mat, tree, include.root = TRUE)

# MPD, MNTD, SES
mpd_res  <-mpd(otu_mat, cophenetic(tree))
mntd_res <-mntd(otu_mat, cophenetic(tree))
ses_mpd  <-ses.mpd(otu_mat, cophenetic(tree), null.model = "taxa.labels",
                    runs = 999)
```

---

### 🧮 Vegan — экология сообществ

```r
library(vegan)

otu_mat <-as(otu_table(ps_rel), "matrix")
if (taxa_are_rows(ps_rel)) otu_mat <-t(otu_mat)
meta     <-data.frame(sample_data(ps_rel))

# Разнообразие
diversity(otu_mat, index = "shannon")
specnumber(otu_mat)

# Ordination (альтернатива встроенной)
nmds <-metaMDS(otu_mat, distance = "bray", k = 2, trymax = 100)

# Envfit (корреляция метаданных с осями ординации)
ef <-envfit(nmds, meta[, c("pH", "Temperature")], permutations = 999)
plot(nmds); plot(ef)

# PERMANOVA
adonis2(otu_mat ~ Treatment * Site, data = meta, method = "bray")

# ANOSIM
anosim(vegdist(otu_mat, "bray"), meta$Treatment)
```

---

### 📊 Ggplot2 + tidyverse — кастомная визуализация

```r
library(tidyverse)

# Конвертация phyloseq → tidy data frame (psmelt)
ps_melt <-psmelt(ps_rel_phylum)

# Кастомный barplot
ps_melt %>%
  group_by(Sample, Phylum, Treatment) %>%
  summarise(Abundance = sum(Abundance), .groups = "drop") %>%
  ggplot(aes(x = Sample, y = Abundance, fill = Phylum)) +
  geom_bar(stat = "identity") +
  facet_wrap(~ Treatment, scales = "free_x") +
  scale_fill_viridis_d() +
  theme_bw() +
  theme(axis.text.x = element_text(angle = 90, vjust = 0.5))
```

---

### 🧩 MicrobiotaProcess — расширенная экосистема

```r
# BiocManager::install("MicrobiotaProcess")
library(MicrobiotaProcess)

# Импорт DADA2-результатов напрямую
# mpse <-as.MPSE(ps)

# Альфа + бета разнообразие в tidyverse-стиле
mpse <-ps %>%
  as.MPSE() %>%
  mp_cal_alpha(.abundance = Abundance) %>%
  mp_plot_alpha(
    .alpha = c(Shannon, Observed),
    .group = Treatment
  )
```

---

### 🔀 MaAsLin2 — мультивариатный анализ

```r
# BiocManager::install("Maaslin2")
library(Maaslin2)

otu_mat <-as.data.frame(as(otu_table(ps_rel), "matrix"))
if (taxa_are_rows(ps_rel)) otu_mat <-as.data.frame(t(otu_mat))
meta    <-as.data.frame(sample_data(ps_rel))

fit_data <-Maaslin2(
  input_data     = otu_mat,
  input_metadata = meta,
  output         = "maaslin2_output",
  fixed_effects  = c("Treatment", "Age"),
  random_effects = c("Subject"),
  normalization  = "CLR",
  transform      = "NONE"
)
```

---

### 🌿 Ggtree — визуализация дерева

```r
# BiocManager::install("ggtree")
library(ggtree)

tree <-phy_tree(ps)
ggtree(tree, layout = "circular") +
  geom_tiplab(size = 2) +
  geom_tippoint(aes(color = ...), size = 1)
```

---

## 🔄 Типичные рабочие процессы

---

### Кейс 1: DADA2 → phyloseq → анализ

```r
library(dada2); library(phyloseq); library(DECIPHER); library(phangorn)

# После DADA2 получаем: seqtab.nochim, taxa

# 1. Создать phyloseq
ps <-phyloseq(
  otu_table(seqtab.nochim, taxa_are_rows = FALSE),
  tax_table(taxa),
  sample_data(metadata)
)

# 2. Переименовать ASV (по умолчанию — последовательности)
dna <-DNAStringSet(taxa_names(ps))
names(dna) <-taxa_names(ps)
ps <-merge_phyloseq(ps, dna)
taxa_names(ps) <-paste0("ASV", seq(ntaxa(ps)))

# 3. Базовая фильтрация
ps <-subset_taxa(ps, !is.na(Phylum) & Phylum != "")
ps <-prune_taxa(taxa_sums(ps) > 10, ps)
```

---

### Кейс 2: Сравнение групп (полный pipeline)

```r
library(phyloseq); library(vegan); library(DESeq2); library(ggplot2)

# 1. Фильтрация
ps_filt <-prune_taxa(taxa_sums(ps) > 5, ps)
ps_filt <-prune_samples(sample_sums(ps_filt) > 1000, ps_filt)

# 2. Нормализация
ps_rel <-transform_sample_counts(ps_filt, function(x) x / sum(x))

# 3. Альфа-разнообразие
alpha_div <-estimate_richness(ps_filt, measures = c("Shannon", "Observed"))
alpha_div$Treatment <-sample_data(ps_filt)$Treatment
kruskal.test(Shannon ~ Treatment, data = alpha_div)

# 4. Бета-разнообразие
dist_bray <-phyloseq::distance(ps_rel, method = "bray")
meta      <-data.frame(sample_data(ps_rel))
adonis2(dist_bray ~ Treatment, data = meta)

# 5. Ординация
ord <-ordinate(ps_rel, "PCoA", "bray")
plot_ordination(ps_rel, ord, color = "Treatment") +
  stat_ellipse() + theme_bw()

# 6. Дифф. обилие (DESeq2)
dds <-phyloseq_to_deseq2(ps_filt, ~ Treatment)
dds <-estimateSizeFactors(dds, type = "poscounts")
dds <-DESeq(dds)
res <-results(dds, contrast = c("Treatment", "Case", "Control"))
```

---

### Кейс 3: Core microbiome + превалентность

```r
library(microbiome)

ps_comp <-microbiome::transform(ps, "compositional")

# Превалентность каждого таксона
prev_df <-data.frame(
  Prevalence = apply(otu_table(ps), 1, function(x) sum(x > 0)),
  TotalAbundance = taxa_sums(ps),
  tax_table(ps)
)

# Фильтрация по превалентности (>5% образцов)
prev_threshold <-0.05 * nsamples(ps)
ps_prev <-prune_taxa(prev_df$Prevalence >= prev_threshold, ps)

# Core (обилие > 0.1% в > 50% образцов)
ps_core <-core(ps_comp, detection = 0.001, prevalence = 0.5)
plot_core(ps_comp, prevalences = c(0.1, 0.5, 0.9),
          detections = 10^seq(log10(1e-3), log10(0.2), length = 10),
          plot.type = "heatmap")
```

---

### Кейс 4: Продольные данные / смешанные модели

```r
library(lme4); library(phyloseq)

ps_glom <-tax_glom(ps_rel, "Genus")
ps_melt <-psmelt(ps_glom)

# Для каждого рода — смешанная модель с субъектом как random effect
genera <-unique(ps_melt$Genus)

results <-lapply(genera, function(g) {
  df <-ps_melt[ps_melt$Genus == g, ]
  tryCatch(
    lmer(Abundance ~ Timepoint + Treatment + (1 | Subject), data = df),
    error = function(e) NULL
  )
})
```

---

## 🛠️ Полезные утилиты

```r
# Слияние образцов (по переменной метаданных)
ps_merged <-merge_samples(ps, "Treatment")

# Слияние двух phyloseq-объектов
ps_combined <-merge_phyloseq(ps1, ps2)

# Экспорт OTU-таблицы в data.frame
otu_df <-as.data.frame(as(otu_table(ps), "matrix"))

# Добавить / изменить метаданные
sample_data(ps)$NewVariable <-c(...)

# Проверка корреляции глубины секвенирования с альфа-разнообразием
depth <-sample_sums(ps)
shannon <-estimate_richness(ps, measures = "Shannon")$Shannon
cor.test(depth, shannon, method = "spearman")

# Taxa prevalence plot (быстрый)
plot(sort(taxa_sums(ps), decreasing = TRUE),
     type = "l", log = "y",
     xlab = "Taxa rank", ylab = "Total abundance")
```

---

## ⚠️ Частые ошибки и советы

> [!WARNING] Ориентация OTU-таблицы Всегда проверяй `taxa_are_rows(ps)`. Если таксоны — в столбцах, `vegan` и другие пакеты ожидают транспонирование: `t(otu_table(ps))`.

> [!TIP] Rarefaction vs нормализация
>
> - `rarefy_even_depth()` — теряет данные, но прост и честен для альфа-разнообразия
> - `transform_sample_counts(ps, function(x) x/sum(x))` — для бета-разнообразия
> - CLR-трансформация (`microbiome\:\:transform(ps, "clr")`) — для Aitchison-дистанции и линейных моделей

> [!TIP] psmelt() для tidyverse `psmelt()` конвертирует phyloseq в длинный data.frame — удобная точка входа для `ggplot2`, `dplyr`, `lmer` и т.д.

> [!NOTE] Агрегация перед барплотом Всегда агрегируй через `tax_glom()` перед `plot_bar()`, иначе визуализация будет неинформативна.

> [!WARNING] DESeq2 и нули При использовании `phyloseq_to_deseq2()` не используй нормализованные/относительные данные — передавай сырые счёты и применяй `estimateSizeFactors(dds, type = "poscounts")`.

---

## 📚 Связанные пакеты — краткий справочник

| Пакет               | Назначение                                      |
| ------------------- | ----------------------------------------------- |
| `dada2`             | Денойзинг ридов, получение ASV-таблиц           |
| `vegan`             | PERMANOVA, ordination, diversity                |
| `DESeq2`            | Дифференциальное обилие                         |
| `microbiome`        | CLR, core microbiome, расширенные индексы       |
| `Maaslin2`          | Мультивариатные ассоциации                      |
| `picante`           | Филогенетическое разнообразие (Faith's PD, MPD) |
| `ggtree`            | Визуализация филогенетических деревьев          |
| `MicrobiotaProcess` | Tidyverse-интерфейс для микробиомного анализа   |
| `ANCOMBC`           | Дифф. обилие с учётом bias                      |
| `corncob`           | Beta-binomial для дифф. обилия                  |
| `NetCoMi`           | Сетевой анализ микробиома                       |
