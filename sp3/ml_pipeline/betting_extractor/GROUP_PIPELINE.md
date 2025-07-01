# Betting Extractor: Meccs + Piacok csoportosítás

## Folyamat

1. **PDF → TXT**
   - `pdf_to_lines.py` → `/tmp/pdf_lines.txt`
2. **TXT → Nyers JSON**
   - `extract_matches.py` → `extracted_matches.json`
3. **JSON → Csoportosított JSON**
   - `group_markets.py` → `grouped_matches.json`

## Eredmény

- Egy meccshez több piac (`markets` tömb) tartozik.
- Minden piac külön névvel, odds értékekkel, eredeti sorral.

## Használat

```bash
python3 betting_extractor/pdf_to_lines.py <pdf1> > /tmp/pdf_lines.txt
python3 betting_extractor/pdf_to_lines.py <pdf2> >> /tmp/pdf_lines.txt
python3 betting_extractor/extract_matches.py
python3 betting_extractor/group_markets.py
```

Az eredmény: `grouped_matches.json` – minden meccshez összes piac.
