---
dg-publish: true
type: 📄note
aliases:
  - GSEA
  - Gene Set Enreachment Analisis
tags: 
summary: Метод функционального анализа экспрессий генов, основанный на оценке численного изменения их экспрессии в зависимости от условия
📊Transcriptomics:
  - functionalAnalisis
💻Bioinfo:
  - tool
---

> [!$] `$=dv.current().file.name`
> `$=dv.current().summary`
>
# Стандартный GSEA

>[!$] Отказываемся от оценки генов как значимы, диф. экспрессированных и тп. Вместо этого оцениваем, какие гены больше похожи на фенотип

Вместо этого строим матрицу:

| фенотип  | A        | A        | ... | B        | B        |
| -------- | -------- | -------- | --- | -------- | -------- |
| образцы: | sampleA1 | sampleA2 |     | SampleB1 | SampleB2 |
| Gene1    |          |          |     |          |          |
| Gene2    |          |          |     |          |          |
| Gene3    |          |          |     |          |          |

Посчитаю [[коэффициент корреляции Пирсона]] c вектором фенотипов

Ранжируем образцы по корреляции:
![[{917F74B7-126D-4C64-B841-FCFCC8D56ACD}.png]] 
(тут вверху те, что выше в фенотипе А, внизу те, что в В)

И теперь проверяем, а где в этом ранжированном списке находятся гены интереса (сигнатура) (н.п. GO категории или [[MSigDB (Molecular Signature Database)|MSigDB]]). 3 варианта: Ближе к А (к верху), Ближе в B, Равномерно

Теперь будем проходиться по этому листу. И записывать в переменную EnreachmentScore +1 если ген входит в наш сэт и -1 если не входит 

![[{43ED31ED-4034-448C-AA27-55D07974931E}.png]]

Максимум/минимум будет итоговым скором

## P-value (Пермутационный тест)

Теперь перемешиваем фенотипы и образцы. 
Получается хаос, в котором не должно быть высокого ES. 
Проходимся 1000 раз - нулевое распределение ES. 
Считаем p-value для ES
## Проблемы малых сэмплов

Когда малое количесво сэмплов, есть большая вероятность что шум даст разницу

## Нормализованный ES

> [!$] __Проблема__: 
> ES будет сильно зависеть от размера сета генов интереса. И сравнивать разные ES нельзя

![[{2DF8CB99-F3B4-4C23-BFD1-AD71673D2494}.png]]

Красный и зеленый имеют ~ ES, но очевидно, что различия между ними значительные

Поэтому ES нормируют на количество генов в сигнатуре

# Preranked GSEA

Чтобы решить [[GSEA (Gene Set Enreachment Analisis)#Проблемы малых сэмплов|проблему малых сэмплов]] стали использовать для ранжирования не корреляцию с вектором фенотипа, а др. показатели:

- logFC гена между условиями
- p-value различия гена между условиями
- любая другая метрика

## P-value 

Проводится пермутационный тест, но теперь перемешиваем гены сигнатуры

Но тут будет проблема, что при пермутации генов утрачиваются связи между генами - больше ложно положительных

# Single Sample (ssGSEA)

Есть один образец. Теперь отсортируем гены по уровню экспрессии в нем (обязательно [[Нормализация RNAseq#Transcripts Per kilobase Million (TPM)|TPM]], т.к. сравниваем разные гены)

__Можно посчитать ES для образца__ - численно описание представленности сигнатуры в образце. 

Для одного образца ничего не даст. Но можно сравнить много образцов по многим сигнатурам:

![[{E5A6E1CC-CE96-4614-BD6E-728015E2EFCF}.png]]

> [!$] Позволяет перейти от сравнения образцов на уровне генов, в физичным ген-категориям


# GSEApy

> [!$] пакет на python для запуска gsea

[GSEApy 1.1.5 documentation](https://gseapy.readthedocs.io/en/latest/introduction.html)

Загрузка сигнатур из gmt:

![[gmt#Как преобразовать в словарь]]

## ssGSEA

```python
import gseapy as gp

ss = gp.ssgsea(
    data=df,
    # конкретно в gseapy нужно передавать копию словаря сигнатур
    # т.к. есть баг, что gseapy удалит сигнатуру из слваря если не найдет ее
    gene_sets=signatures.copy(),
    outdir=None,
    # С какого количесво найденых генов начинаем оценивать сигнатуру
    min_size=3,
    sample_norm_method="rank",
    no_plot=True
)
# получаем результаты
ssGSEA = ss.res2d.pivot(index='Term', columns='Name', values='NES')
ssGSEA = pd.DataFrame(ssGSEA, dtype=float)

sns.clustermap(ssGSEA, cmap="RdBu_r", vmin=-0.5, vmax=0.5, figsize=(14, 10), method="average")
```

![[Pasted image 20250216170819.png]]


## GSEA

```python
gs_res = gp.gsea(
    data=df, # DF c TPM 
    # конкретно в gseapy нужно передавать копию словаря сигнатур
    # т.к. есть баг, что gseapy удалит сигнатуру из слваря если не найдет ее
    gene_sets=signatures.copy(),
    cls=labels,
    min_size=3,
    permutation_type="phenotype",
    permutation_num=1000,
    outdir=None,
    method="signal_to_noise"
)

gs_res.res2d = gs_res.res2d.set_index("Term")
gs_res.res2d
```

|         Term | Name | ES        | NES       | NOM p-val | FDR q-val | FWER p-val | Tag % | Gene % | Lead_genes                                    |
| -----------: | ---- | --------- | --------- | --------- | --------- | ---------- | ----- | ------ | --------------------------------------------- |
| MDSC_traffic | gsea | -0.745332 | -1.976668 | 0.00188   | 0.005629  | 0.003003   | 8/15  | 12.00% | CXCR2;CXCL12;CSF1;CSF2RA;IL6;CSF3;CSF1R;CXCR4 |
| Angiogenesis | gsea | -0.693673 | -1.635938 | 0.002037  | 0.300208  | 0.175175   | 6/15  | 8.22%  | CXCR2;CDH5;ANGPT1;KDR;VWF;TEK                 |
|         MDSC | gsea | -0.758428 | -1.600749 | 0.031185  | 0.277067  | 0.233233   | 5/7   | 18.56% | IDO1;ARG1;IL6;CYBB;IL10                       |

```python
from gseapy import gseaplot, heatmap
terms = "Th1_signature"
axs = gs_res.plot(terms=terms)
```
![[Pasted image 20250216170855.png]]

```python
genes = gs_res.res2d.Lead_genes[terms].split(";")
heatmap(df=gs_res.heatmat.loc[genes], z_score=0, title=terms,
        figsize=(15, 3))
```

![[Pasted image 20250216170928.png]]