# Fő pipeline

Ebben a mappában találod a PDF→JSON fő feldolgozó pipeline minden lépését, jól dokumentált, átlátható módon.

- `01_pdf_to_json.py` – PDF-ből nyers JSON kinyerése (összes piac, minden meccs)
- `02_group_markets.py` – Piacok csoportosítása, végső JSON előállítása

A pipeline bemenete: PDF fájl
A pipeline kimenete: /tmp/all_matches_grouped.json

Futtatás menete:

1. python3 pipeline/01_pdf_to_json.py <PDF fájl>
2. python3 pipeline/02_group_markets.py

A részleteket lásd a scriptjeidben és a projekt README-ben.
