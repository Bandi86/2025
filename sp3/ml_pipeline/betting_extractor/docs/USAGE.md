# Betting Extractor - Okos Működés ⚡

## Új Mappastruktúra

```
betting_extractor/
├── pdfs/          # Input PDF fájlok
├── txts/          # PDF-ből kinyert szöveg fájlok
├── jsons/         # Feldolgozott JSON fájlok
├── logs/          # Log fájlok
├── txts/          # TXT fájlok (köztes formátum)
└── jsons/         # JSON fájlok (végső adatok) - **IDE KERÜLNEK A VÉGLEGES ADATOK**
```

## Okos Kihagyás Funkció 🧠

A rendszer automatikusan ellenőrzi a fájlok dátumát:

- **PDF → TXT**: Ha a TXT fájl létezik és újabb mint a PDF, kihagyja
- **TXT → JSON**: Ha a JSON fájl létezik és újabb mint a TXT, kihagyja
- **Force flag**: `--force` használatával erőltethető az újrafeldolgozás

## Scriptk Működése

### 1. pdf_to_lines.py ⚡

**Okos működés:** Ellenőrzi a TXT fájl létezését és dátumát

```bash
python3 pdf_to_lines.py sample.pdf
# Ha már létezik: ⏩ TXT fájl már létezik és frissebb
# Ha nem létezik: 🔄 PDF feldolgozása...

# Erőltetett újrafeldolgozás
python3 pdf_to_lines.py sample.pdf --force
```

### 2. extract_matches.py ⚡

**Okos működés:** Ellenőrzi a JSON fájl létezését és dátumát

```bash
# Automatikus mód (okos kihagyással)
python3 extract_matches.py
# Ha már létezik: ⏩ JSON fájl már létezik és frissebb

# Erőltetett újrafeldolgozás
python3 extract_matches.py --force

# Manuális mód
python3 extract_matches.py txts/sample_lines.txt jsons/sample.json --force
```

### 3. process_all_pdfs.py ⚡ (FRISSÍTETT)

**Okos batch feldolgozás:**

```bash
# Okos mód (kihagyja a meglévő fájlokat)
python3 process_all_pdfs.py

# Force mód (minden fájlt újrafeldolgoz)
python3 process_all_pdfs.py --force
```

**Példa kimenet:**

```
📄 2 PDF fájl feldolgozása...
⚡ Okos mód: meglévő fájlok kihagyása

🔄 Feldolgozás: file1.pdf
  → PDF szöveg kinyerése...
  ⏩ TXT fájl már létezik és frissebb
  → JSON létrehozása...
  ⏩ JSON fájl már létezik és friss

🔄 Feldolgozás: file2.pdf
  → PDF szöveg kinyerése...
  ✅ Sikeres feldolgozás!
  → JSON létrehozása...
  ✅ JSON elkészült

📊 Eredmény:
  - Feldolgozott: 1
  - Kihagyott: 1
  - Sikertelen: 0
```

## Használati Példák

### Első futtatás (minden új)

```bash
python3 process_all_pdfs.py
# Minden PDF feldolgozva
```

### Második futtatás (minden kihagyva)

```bash
python3 process_all_pdfs.py
# Minden fájl kihagyva (már léteznek és frissek)
# Rendkívül gyors! ⚡
```

### Új PDF hozzáadása

```bash
cp new_file.pdf pdfs/
python3 process_all_pdfs.py
# Csak az új fájl kerül feldolgozásra
```

### Minden újrafeldolgozása

```bash
python3 process_all_pdfs.py --force
# Minden fájl újrafeldolgozva
```

## Előnyök ⚡

1. **Gyors újrafuttatás** - meglévő fájlok kihagyása
2. **Időtakarékos** - csak a szükséges feldolgozás
3. **Erőforrás-hatékony** - kevesebb CPU és IO használat
4. **Inkrementális** - új fájlok hozzáadása egyszerű
5. **Biztonságos** - force flag a szükség esetén
6. **Átlátható** - részletes státusz jelentések
