# 📊 SZERENCSEMIX PDF ARCHÍVUM ELEMZÉS

## 🎯 PROJEKT ÖSSZEFOGLALÓ

**2025. június 28.** - Részletes elemzés a SzerencseMix PDF archívum feldolgozásáról

---

## 📋 MIT FEDEZTÜNK FEL

### 📈 Archívum mérete

- **816 PDF fájl** érhető el a tippmix.hu oldalon
- **Időszak**: 2015-2025 (6+ év történelmi adat)
- **Becsült méret**: ~1.6 GB
- **Letöltési idő**: ~40 perc

### 📊 Éves eloszlás

```
2025: 671 PDFs
2024: 97 PDFs
2023: 8 PDFs
2020: 6 PDFs
2019: 12 PDFs
2016: 20 PDFs
2015: 2 PDFs
```

---

## 🔍 PDF FORMÁTUM KIHÍVÁSOK

### ❌ Problémák

1. **Többsportágú tartalom** - nem csak labdarúgás
2. **Magyar nyelvű szöveg** - összetett feldolgozás
3. **Komplex layout** - táblázatok, oszlopok
4. **Változó formátum** - évek során módosult
5. **Képeket tartalmazó tartalom** - OCR szükséges

### ⚠️ Specifikus kihívások

- A PDF-ek 29+ oldalasak
- Sok különböző sportág (tenisz, kosár, jégkorong, stb.)
- Labdarúgás csak egy kis részét teszi ki
- Magyar csapat- és liganevek
- Változó odds formátumok

---

## 🛠️ FEJLESZTETT MEGOLDÁSOK

### 1️⃣ Intelligens szűrés

```python
# Labdarúgás-specifikus kulcsszavak
football_leagues = [
    'labdarúgás', 'foci', 'football',
    'premier league', 'bundesliga', 'la liga',
    'champions league', 'europa league',
    'nb i', 'otp bank liga'
]
```

### 2️⃣ Fejlett minta felismerés

```python
# Meccs formátumok
team_patterns = [
    'Csapat1 - Csapat2',
    'Csapat1 vs Csapat2',
    'Hazai – Vendég'
]

# Odds minták
odds_pattern = r'\d+[.,]\d{2,3}'  # 2.50, 1,85
```

### 3️⃣ Magyar nyelv támogatás

- Ékezetes karakterek kezelése
- Magyar liga nevek felismerése
- Hazai csapat nevek azonosítása

---

## 📊 IMPLEMENTÁLT ESZKÖZÖK

### 🔧 1. SzerencseMix Downloader

```bash
python src/data_collection/szerencsemix_downloader.py
```

**Funkciók:**

- Automatikus PDF link kinyerés
- Párhuzamos letöltés
- Folytatható letöltés
- Metadata tracking

### 🔧 2. Batch PDF Processor

```bash
python src/data_collection/batch_pdf_processor.py
```

**Funkciók:**

- Párhuzamos feldolgozás
- Labdarúgás szűrés
- JSON/CSV export
- Hibakezelés

### 🔧 3. Improved Football Processor

```bash
python improved_football_processor.py
```

**Funkciók:**

- Labdarúgás-specifikus elemzés
- Magyar nyelv támogatás
- Confidence scoring
- Strukturált adatkinyerés

---

## 📈 BECSÜLT EREDMÉNYEK

### 🎯 Várható output (teljes archívum)

- **~816 PDF** → **~800 labdarúgás oldal**
- **~40,000 meccs** összesen (becsülés)
- **~15,000 labdarúgás meccs** (szűrés után)
- **~5,000 releváns odds** (minőségi szűrés)

### ⏱️ Feldolgozási idő

- **Letöltés**: ~40 perc
- **Feldolgozás**: ~2-4 óra (4 worker)
- **Tisztítás/szűrés**: ~30 perc

---

## 🚀 KÖVETKEZŐ LÉPÉSEK

### 🔥 Sürgős fejlesztések

1. **OCR integráció** - képek szövegének kinyerése
2. **Liga-specifikus szűrők** - Premier League, Bundesliga, stb.
3. **Dátum normalizálás** - egységes dátum formátum
4. **Csapat névfelismerés** - variációk kezelése

### 📊 Adatminőség javítása

1. **Duplikáció szűrés** - ugyanaz a meccs több helyen
2. **Validation logika** - irreális odds kiszűrése
3. **Manual review** - minőségellenőrzés
4. **Statistical analysis** - adatminőség mérése

### 🤖 ML integráció

1. **Historical training data** - 6+ év adat
2. **Feature engineering** - új változók
3. **Model validation** - backtesting
4. **Real-time enhancement** - live predictions javítása

---

## 💡 ALTERNATÍV MEGKÖZELÍTÉSEK

### 🔄 API alapú megoldás

- **Sportmonks API** - tiszta, strukturált adat
- **Football-data.org** - ingyenes alternatíva
- **RapidAPI Sports** - komplex odds data

### 🎯 Hibrid megoldás

- **PDF archívum** - történelmi trend elemzés
- **Live API** - aktuális predikciók
- **Combined model** - legjobb mindkét világból

---

## 📋 TECHNIKAI SPEC

### 🛠️ Eszközök

- **Python 3.12+**
- **pdfplumber** - PDF text extraction
- **pandas** - adatkezelés
- **requests** - letöltés
- **concurrent.futures** - párhuzamosítás

### 📁 File struktura

```
data/
├── szerencsemix_archive/     # Letöltött PDFs
│   ├── 2025/01/             # Év/hónap
│   └── metadata.json        # Tracking
├── processed_matches/        # Feldolgozott data
│   ├── by_pdf/              # PDF-enkénti JSON
│   ├── all_matches.json     # Konszolidált
│   └── all_matches.csv      # CSV export
└── demo_analysis/           # Teszt fájlok
```

---

## 🎉 EREDMÉNY

✅ **Működő PDF letöltő rendszer**
✅ **Labdarúgás-specifikus feldolgozó**
✅ **Magyar nyelv támogatás**
✅ **Batch processing képesség**
✅ **816 PDF azonosítva és elérhető**

🚧 **Folyamatban**: Teljes archívum feldolgozása
🎯 **Cél**: 15,000+ labdarúgás meccs tiszta adatként

---

*Készült: 2025. június 28. | Sport Betting Prediction System v2.0*
