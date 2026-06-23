---
aliases: []
date: 16-02-2025
dg-publish: true
parent:
summary: Исторически сложивщийся формат хранения для генных сигнатур [[MSigDB (Molecular Signature Database)|MSigDB]]
tags: []
type: 📄note
💻Bioinfo:
  - fileFormat
📊Transcriptomics:
  - functionalAnalisis
---

> [!$] `$=dv.current().file.name`
> `$=dv.current().summary`

![[{4684F292-2EF6-4358-A004-160768BD5476}.png]]

# Как преобразовать в словарь

```python
signatures = {}

with open("gene_signatures.gmt") as f:
  for line in f.readlines():
    signatures[line.split("\t")[0]] = line.strip().split("\t")[2:]
```
