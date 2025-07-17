# ML Pipeline (Foci predikció)

## Fő funkciók

- Adatfeldolgozás (datasettek egységesítése): `python cli.py summary`
- Modell tanítás: `python cli.py train`
- Predikció: `python cli.py predict`

## Mappastruktúra

- `src/` - minden logika (adatfeldolgozás, tanítás, predikció)
- `data/` - nyers CSV-k, letöltött adatok
- `db/` - egységes adatbázis (unified_football.db)
- `models/` - mentett modellek

## Használat

1. Töltsd le/frissítsd a datasetteket a `data/` mappába.
2. Futtasd az adatfeldolgozást:

   ```
   python cli.py summary
   ```

   Ez létrehozza/frissíti a `db/unified_football.db` adatbázist.
3. Tanítsd meg a modellt:

   ```
   python cli.py train
   ```

   Ez létrehozza/frissíti a `models/unified_football_model.pkl` modellt.
4. Predikció (példa):

   ```
   python cli.py predict
   ```

## Megjegyzés

- A PDF-feldolgozás nem része a core pipeline-nak.
- A projekt célja: strukturált adatokból predikciós modell tanítása és használata.

# A következő script(ek) debug/elemző segédprogramok, nem részei a fő pipeline-nak

# - clean_page2_matches.py

# - sample_page2_debug.py

# - pdf_line_dump.py

# - tisztit_labdarugas.py

# - extract_cli.py

# - extract_labdarugas.py

# Ezeket áthelyezzük a debug_scripts vagy legacy_scripts mappába
