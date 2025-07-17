# 📄 MAGYAR PDF FOGADÁSI RENDSZER DOKUMENTÁCIÓ

## Áttekintés

A Magyar PDF Fogadási Rendszer lehetővé teszi a magyar fogadóirodák PDF-jeiből történő automatikus adatkinyerést és részletes predikciók készítését. A rendszer heti 3 naponta frissülő PDF-eket képes feldolgozni, és pontos meccs adatokat, odds-okat nyerni ki belőlük.

## Főbb funkciók

### 1. PDF Feldolgozó (`hungarian_pdf_processor.py`)

- **Automatikus PDF letöltés** - Magyar fogadóirodák PDF-jeinek automatikus letöltése
- **Intelligens szövegfelismerés** - pdfplumber és PyPDF2 használatával
- **Meccs adatok kinyerése** - Csapat nevek, dátumok, idők automatikus felismerése
- **Odds feldolgozás** - 1X2, Over/Under, BTTS, Szögletek, Lapok
- **JSON export** - Strukturált adatok mentése predikciókhoz

### 2. Továbbfejlesztett Predikciós Motor (`enhanced_prediction_engine.py`)

- **Részletes elemzések** - Meccs eredmény, gólok, szögletek, lapok
- **Value betting javaslatok** - Várható nyereség számítása
- **Bizalmi szintek** - Predikciók megbízhatóságának értékelése
- **Többfajta piac** - 1X2, Total Goals, BTTS, Corners, Cards

## Használat

### Gyors Start

```bash
# PDF feldolgozás és JSON generálás
python master.py --pdf-betting

# Továbbfejlesztett predikciók a JSON alapján
python master.py --enhanced-prediction

# Kombinált workflow
python master.py --pdf-betting && python master.py --enhanced-prediction
```

### Részletes használat

#### 1. PDF Feldolgozás

```python
from src.tools.hungarian_pdf_processor import HungarianBettingPDFProcessor

processor = HungarianBettingPDFProcessor()

# PDF letöltése (ha van URL)
pdf_path = processor.download_latest_pdf("https://example.com/odds.pdf")

# Szöveg kinyerése
text_pages = processor.extract_text_from_pdf(pdf_path)

# Meccsek elemzése
matches = processor.parse_matches_from_text(text_pages)

# JSON mentés
json_file = processor.save_matches_to_json(matches)
```

#### 2. Predikciók Készítése

```python
from src.prediction.enhanced_prediction_engine import EnhancedPredictionEngine

engine = EnhancedPredictionEngine()

# JSON betöltése
matches = engine.load_matches_from_json("data/daily_matches_20250628.json")

# Predikciók generálása
for match in matches:
    prediction = engine.generate_detailed_prediction(match)
    engine.display_prediction_summary(prediction)
```

## Támogatott Piacok

### Alap Piacok

- **1X2** - Meccs eredmény (Hazai/Döntetlen/Vendég)
- **Total Goals** - Over/Under 2.5 gólok
- **BTTS** - Both Teams to Score (Mindkét csapat góloz)

### Speciális Piacok

- **Szögletek** - Over/Under 9 szöglet
- **Sárga Lapok** - Over/Under 3 lap
- **Handicap** - Ázsiai hendikep (tervezett)

## Fájl Struktúra

```
data/
├── pdf_cache/                    # Letöltött PDF-ek cache
├── daily_matches_YYYYMMDD.json  # Napi meccs adatok
└── team_stats_cache/             # Csapat statisztikák cache

src/
├── tools/
│   └── hungarian_pdf_processor.py    # PDF feldolgozó
└── prediction/
    └── enhanced_prediction_engine.py # Predikciós motor
```

## JSON Struktúra

```json
{
  "generated_at": "2025-06-28T20:44:52.488406",
  "total_matches": 3,
  "matches": [
    {
      "match_id": "2025-06-29_Manchester_City_Liverpool",
      "date": "2025-06-29",
      "time": "16:00",
      "home_team": "Manchester City",
      "away_team": "Liverpool FC",
      "competition": "Premier League",
      "venue": "Etihad Stadium",
      "odds": {
        "match_result": {
          "home_win": 2.1,
          "draw": 3.4,
          "away_win": 3.2
        },
        "total_goals": {
          "over_25": 1.85,
          "under_25": 1.95
        },
        "both_teams_score": {
          "yes": 1.75,
          "no": 2.05
        },
        "corners": {
          "over_9": 1.9,
          "under_9": 1.9
        },
        "cards": {
          "over_3": 2.1,
          "under_3": 1.7
        }
      }
    }
  ]
}
```

## Konfigurációs Lehetőségek

### PDF Processor beállítások

```python
processor = HungarianBettingPDFProcessor()

# Cache könyvtár beállítása
processor.pdf_cache_dir = "custom/cache/path"

# Csapat név mapping bővítése
processor.team_name_mapping.update({
    "Custom Team": ["Alternative Name", "Short Name"]
})
```

### Prediction Engine beállítások

```python
engine = EnhancedPredictionEngine()

# Különböző súlyozások beállítása
engine.confidence_weights = {
    'recent_form': 0.4,
    'historical_performance': 0.3,
    'league_position': 0.2,
    'other_factors': 0.1
}
```

## Hibakezelés és Logging

A rendszer részletes logging-ot használ minden fontos művelethez:

```python
import logging

# Logging szint beállítása
logging.basicConfig(level=logging.INFO)

# Egyéni logger
logger = logging.getLogger(__name__)
```

## Fejlesztési Lehetőségek

### Közelgő funkciók

1. **Automatikus PDF letöltés** - Scheduled job magyar fogadóirodákból
2. **Real-time odds frissítés** - Live odds változások követése
3. **Gépi tanulás modellek** - Történeti adatok alapján pontosabb predikciók
4. **Web dashboard** - Grafikus felület a predikciókhoz
5. **Mobile app** - iOS/Android alkalmazás

### API integráció

- Odds API-k beintegrálása
- Live score API-k
- Csapat statisztika API-k
- Sérülés és felfüggesztés adatok

## Hibaelhárítás

### Gyakori problémák

#### PDF feldolgozási hibák

```bash
# Függőségek telepítése
pip install PyPDF2 pdfplumber

# Jogosultságok ellenőrzése
chmod +r /path/to/pdf/file
```

#### JSON parsing hibák

```python
# JSON fájl validálása
import json
with open('daily_matches.json', 'r') as f:
    data = json.load(f)  # ValueError esetén hibás JSON
```

#### Predikciós hibák

```python
# Hiányzó adatok ellenőrzése
if not match.get('odds'):
    print("Hiányzó odds adatok")
```

## Teljesítmény Optimalizálás

### Cache stratégiák

- PDF cache automatikus tisztítása (7 nap után)
- Csapat statisztikák cache-elése
- Predikciós eredmények cache-elése

### Párhuzamos feldolgozás

```python
from concurrent.futures import ThreadPoolExecutor

with ThreadPoolExecutor(max_workers=4) as executor:
    predictions = list(executor.map(generate_prediction, matches))
```

## Biztonság

### API kulcsok védelme

```python
import os
from dotenv import load_dotenv

load_dotenv()
api_key = os.getenv('BETTING_API_KEY')
```

### PDF validáció

- Fájl méret ellenőrzése
- MIME típus validáció
- Vírus scan integráció (opcionális)

## Támogatás és Közreműködés

### Kapcsolat

- GitHub Issues: Hibák jelentése és feature kérések
- Email: technikai támogatás
- Discord: Közösségi támogatás

### Közreműködés

1. Fork a repository
2. Feature branch létrehozása
3. Tesztek írása
4. Pull request küldése

---

**Verzió:** 1.0
**Utolsó frissítés:** 2025-06-28
**Szerzők:** Sport Prediction System Team
**Licenc:** MIT
