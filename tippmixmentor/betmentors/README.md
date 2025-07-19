# 🤖 BettingMentor AI System

Ez a mappa tartalmazza a BettingMentor AI/ML rendszer összes komponensét. A rendszer több adatforrásból tanul és intelligens fogadási előrejelzéseket készít.

## 🚀 Gyors Kezdés

```bash
# 1. Setup és függőségek telepítése
python setup.py

# 2. Rendszer tesztelése
python test_system.py

# 3. Adatok feldolgozása
python main.py data

# 4. Modellek tréningelése
python main.py train

# 5. Értékes fogadások keresése
python main.py value-bets

# 6. Teljes pipeline futtatása
python main.py full
```

## 📁 Struktúra

```
betmentors/
├── data/                    # Adatforrások és feldolgozott adatok
│   ├── sources/            # Különböző adatforrások
│   │   ├── flashscore/     # Flashscore scraper adatok
│   │   ├── tippmix/        # PDF-ből kinyert adatok
│   │   └── sofascore/      # Sofascore API adatok
│   ├── processed/          # Feldolgozott, ML-ready adatok
│   ├── merged/             # Összevont adatok több forrásból
│   └── features/           # Feature engineering eredmények
├── training/               # ML modellek tréningelése
│   ├── models/            # Tréningelt modellek
│   ├── experiments/       # Kísérletek és eredmények
│   └── pipelines/         # Tréning pipeline-ok
├── mentor_bots/           # AI mentorok és predikciós botok
│   ├── match_predictor/   # Meccs eredmény előrejelzés
│   ├── value_finder/      # Értékes fogadási lehetőségek
│   └── risk_analyzer/     # Kockázatelemzés
├── strat/                 # Fogadási stratégiák
└── utils/                 # Közös segédeszközök
```

## 🎯 Fő komponensek

### 1. **Data Pipeline** (`data/`)
- Több forrásból adatgyűjtés
- Adattisztítás és normalizálás
- Feature engineering
- Adatok összevonása

### 2. **ML Training** (`training/`)
- Modell tréningelés
- Hyperparameter tuning
- Model validation
- Experiment tracking

### 3. **AI Mentorok** (`mentor_bots/`)
- Meccs előrejelzés
- Értékes fogadások keresése
- Kockázatelemzés
- Stratégia javaslatok

### 4. **Stratégiák** (`strat/`)
- Fogadási stratégiák
- Bankroll management
- Risk management

## 🚀 Használat

```bash
# Adatok feldolgozása
python data/process_all_sources.py

# Modell tréningelés
python training/train_match_predictor.py

# Predikciók futtatása
python mentor_bots/match_predictor/predict.py

# Értékes fogadások keresése
python mentor_bots/value_finder/find_values.py
```