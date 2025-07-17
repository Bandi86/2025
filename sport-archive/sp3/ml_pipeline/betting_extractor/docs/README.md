# Betting Data Extractor

Ez a mappa tartalmazza a jól működő betting adatkinyerő rendszert. A pipeline PDF fájlokból strukturált JSON-t készít, ahol minden meccshez az összes piac (főpiac, félidő piacok, stb.) egy objektumban van csoportosítva.

## Jellemzők

- **Robusztus csapatnév felismerés**: `"Palmeiras SP"` → `"palmeiras sp"`
- **Intelligens piac csoportosítás**: `"1. félidő"`, `"2. félidő"` → egy meccs alatt
- **Strukturált kimenet**: Minden meccshez összes piac egy JSON objektumban
- **Adatmegőrzés**: Eredeti csapatnevek és piacnevek megőrződnek `orig_*` mezőkben

## Fájlok

### `pdf_to_lines.py`

PDF fájlokat soronkénti szöveggé alakít.

**Használat:**

```bash
python3 pdf_to_lines.py <pdf_file> [output_lines.txt]
```

### `extract_matches.py`

A soronkénti szövegből strukturált JSON meccsadatokat készít.

**Használat:**

```bash
python3 extract_matches.py [input_lines.txt] [output_matches.json]
```

### `group_markets.py`

A nyers meccs-piac rekordokat csoportosítja, minden meccshez több piacot rendel.

**Javított logika (2025-07-01):**

- Intelligens csapatnév felismerés különböző formátumokból
- Piac indikátorok felismerése (`1. félidő`, `2. félidő`, stb.)
- Normalizált csapatnevek (`palmeiras sp`, `botafogo rj`)

**Használat:**

```bash
python3 group_markets.py [input_matches.json] [output_grouped.json]
```

## Teljes folyamat (több PDF esetén)

```bash
python3 pdf_to_lines.py pdf1.pdf pdf1_lines.txt
python3 extract_matches.py pdf1_lines.txt pdf1_matches.json
python3 group_markets.py pdf1_matches.json pdf1_grouped.json

python3 pdf_to_lines.py pdf2.pdf pdf2_lines.txt
python3 extract_matches.py pdf2_lines.txt pdf2_matches.json
python3 group_markets.py pdf2_matches.json pdf2_grouped.json
```

## Kimenet példa

```json
{
  "page": 7,
  "date": "2025-06-28",
  "day": "Szombat",
  "time": "18:00",
  "league": "Klubcsapat vb",
  "team1": "palmeiras sp",
  "team2": "botafogo rj",
  "orig_team1": "Palmeiras SP",
  "orig_team2": "Botafogo RJ",
  "markets": [
    {
      "name": "Fő piac",
      "odds1": "2.10",
      "oddsX": "2.96",
      "odds2": "3.40",
      "orig_team1": "Palmeiras SP",
      "orig_team2": "Botafogo RJ",
      "orig_market": ""
    },
    {
      "name": "1. félidő",
      "odds1": "2.99",
      "oddsX": "1.90",
      "odds2": "4.00",
      "orig_team1": "Palmeiras SP - Botafogo RJ 1. félidő",
      "orig_team2": "1X2",
      "orig_market": "1. félidő"
    },
    {
      "name": "2. félidő",
      "odds1": "2.60",
      "oddsX": "2.14",
      "odds2": "3.35",
      "orig_team1": "Palmeiras SP - Botafogo RJ 2. félidő",
      "orig_team2": "1X2",
      "orig_market": "2. félidő"
    }
  ]
}
```

Így minden PDF-hez külön JSON lesz, minden meccshez összes piac egy objektumban.
