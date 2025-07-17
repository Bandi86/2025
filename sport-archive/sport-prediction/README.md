# 🏆 Sports Betting Prediction System

Intelligens sport fogadási rendszer gépi tanulással és kockázatmenedzsmenttel.

## 📁 Projekt struktúra

```
sport-prediction/
├── 📁 src/                    # Forráskód
│   ├── 📁 core/               # Alap modulok
│   │   ├── data_loader.py     # Adatbetöltés
│   │   ├── feature_engineering.py # Feature építés
│   │   ├── improved_strategies.py # Stratégiák
│   │   └── model_trainer.py   # Modell tanítás
│   └── 📁 tools/              # Használható eszközök
│       ├── daily_betting_assistant.py  # 🌅 Napi asszisztens
│       ├── prediction_engine.py        # 🔮 Előrejelző motor
│       ├── realistic_betting_system.py # 📊 Realisztikus szimuláció
│       └── weekend_betting_example.py  # 📅 Hétvégi példa
├── 📁 data/                   # Adatfájlok
│   └── 📁 premier_league/     # Premier League adatok
├── 📁 results/                # Eredmények, grafikonok
├── 📁 docs/                   # Dokumentáció
├── 📁 archive/                # Régi verziók
└── requirements.txt           # Python függőségek
```

## 🚀 Gyors indítás

### 1. Napi fogadási javaslatok

```bash
python src/tools/daily_betting_assistant.py
```

### 2. Jövőbeli mérkőzések előrejelzése

```bash
python src/tools/prediction_engine.py
```

### 3. Hétvégi fogadási stratégia

```bash
python src/tools/weekend_betting_example.py
```

## 🎯 Főbb funkciók

- ✅ **Napi elemzés**: Automatikus napi fogadási javaslatok
- ✅ **Value betting**: Értékes fogadások azonosítása
- ✅ **Kombinációs fogadások**: Multi-match kombinációk
- ✅ **Kelly Criterion**: Optimális tét méret számítás
- ✅ **Kockázatmenedzsment**: Bankroll védelem
- ✅ **Gépi tanulás**: Random Forest, XGBoost modellek

## 🔧 Telepítés

```bash
pip install -r requirements.txt
```

## 📊 Valós adatok integrálása

Jelenleg Premier League (2022-2025) adatokat használ.
További bajnokságok hozzáadásához lásd a `data/` mappát.

## 🆘 Támogatás

Problémák esetén nézd meg a `docs/` mappában lévő dokumentációt.
