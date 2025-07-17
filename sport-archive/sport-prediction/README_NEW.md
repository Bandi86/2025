# 🏆 Sports Betting Prediction System

Intelligens sport fogadási rendszer gépi tanulással, multi-liga támogatással és teljes automatizálással.

## 🚀 Gyors indítás

### ⭐ Napi használat

```bash
python master.py --daily                    # Premier League napi javaslatok
python master.py --daily --league mls       # MLS napi javaslatok
python master.py --daily --league brasileirao # Brasileirão javaslatok
```

### 🔧 Telepítés

```bash
python master.py --setup multi             # Multi-liga rendszer
python master.py --setup automation        # Automatizálás
python master.py --setup tracking          # Teljesítmény tracking
```

## 📁 Projekt struktúra

```
sport-prediction/
├── 📁 src/                    # Forráskód
│   ├── 📁 core/               # Alap modulok
│   │   ├── data_loader.py     # Adatbetöltés
│   │   ├── feature_engineering.py # Feature építés
│   │   ├── improved_strategies.py # Stratégiák
│   │   └── model_trainer.py   # Modell tanítás
│   ├── 📁 tools/              # Használható eszközök
│   │   ├── daily_betting_assistant.py  # 🌅 Napi asszisztens
│   │   ├── prediction_engine.py        # 🔮 Előrejelző motor
│   │   ├── realistic_betting_system.py # 📊 Realisztikus szimuláció
│   │   └── weekend_betting_example.py  # 📅 Hétvégi példa
│   ├── 📁 api/                # API integrálás
│   │   ├── mls_api_client.py  # 🇺🇸 MLS API
│   │   └── multi_league_system.py # 🌍 Multi-liga
│   ├── 📁 automation/         # Automatizálás
│   │   ├── automation_system.py # ⏰ Cron jobs
│   │   ├── telegram_bot.py    # 📱 Telegram bot
│   │   └── email_notifier.py  # 📧 Email értesítések
│   └── 📁 tracking/           # Teljesítmény tracking
│       └── performance_tracker.py # 📊 ROI követés
├── 📁 data/                   # Adatfájlok
│   ├── 📁 premier_league/     # Premier League adatok
│   ├── 📁 mls/               # MLS adatok
│   ├── 📁 brasileirao/       # Brasileirão adatok
│   └── 📁 j_league/          # J-League adatok
├── 📁 results/                # Eredmények, grafikonok
├── 📁 docs/                   # Dokumentáció
├── 📁 archive/                # Régi verziók
├── master.py                  # 🚀 Master control script
└── requirements.txt           # Python függőségek
```

## 🎯 Főbb funkciók

### ✅ Napi elemzés és javaslatok

- **Automatikus napi fogadási javaslatok**
- **Value betting**: Értékes fogadások azonosítása
- **Kombinációs fogadások**: Multi-match kombinációk
- **Kelly Criterion**: Optimális tét méret számítás
- **Kockázatmenedzsment**: Bankroll védelem

### 🌍 Multi-liga támogatás

- **Premier League** (működő)
- **MLS** (2025 aktív szezon)
- **Brasileirão** (2025 aktív szezon)
- **J-League** (2025 aktív szezon)
- **A-League** (szezon vége)

### 🤖 Teljes automatizálás

- **Cron jobs**: Napi 8:00 automatikus futtatás
- **Telegram bot**: Instant értesítések
- **Email jelentések**: Napi összefoglalók
- **Monitoring**: Rendszer állapot követés

### 📈 Teljesítmény tracking

- **ROI számítás**: Valós idejű profit követés
- **Bankroll menedzsment**: Növekedés nyomon követése
- **Stratégia optimalizálás**: A legjobb módszerek azonosítása
- **Részletes jelentések**: CSV/JSON export

### 🔄 Valós API integráció

- **API-Sports**: Live adatok és odds
- **Automatikus frissítés**: Naprakész információk
- **Multi-forrás**: Backup adatforrások

## 🔧 Telepítés

```bash
# 1. Projekt klónozása
git clone <repository>
cd sport-prediction

# 2. Virtual environment
python -m venv venv
source venv/bin/activate  # Linux/Mac
# or
venv\Scripts\activate     # Windows

# 3. Függőségek telepítése
pip install -r requirements.txt

# 4. Alaprendszer tesztelése
python master.py --daily
```

## 📊 Használati példák

### 🌅 Napi rutinok

```bash
# Reggeli futtatás - napi javaslatok
python master.py --daily

# Hétvégi nagy forduló
python src/tools/weekend_betting_example.py

# Teljesítmény ellenőrzése
python master.py --track
```

### 🔧 Rendszer beállítás

```bash
# Multi-liga rendszer telepítése
python master.py --setup multi

# MLS specifikus beállítás
python master.py --setup mls

# Automatizálás (cron, bot, email)
python master.py --setup automation

# Teljesítmény tracking
python master.py --setup tracking
```

### 🌍 Liga specifikus használat

```bash
# MLS (aktív júniusban)
python master.py --daily --league mls

# Brasileirão (aktív júniusban)
python master.py --daily --league brasileirao

# J-League (aktív júniusban)
python master.py --daily --league j_league
```

### 🔄 API és valós adatok

```bash
# API kulcs beállítása
export API_SPORTS_KEY='your_api_key_here'

# Valós MLS adatok letöltése
python master.py --api

# Telegram bot beállítása
export TELEGRAM_BOT_TOKEN='your_bot_token'
export TELEGRAM_CHAT_IDS='chat_id1,chat_id2'
```

## 📈 Valós használatra való áttérés

### 1. API kulcs beszerzése

1. Regisztráció: [API-Sports](https://rapidapi.com/api-sports/api/api-football)
2. Kulcs beállítása: `export API_SPORTS_KEY='your_key'`
3. Tesztelés: `python master.py --api`

### 2. Automatizálás beállítása

```bash
# Cron job (napi 8:00)
crontab -e
# Add hozzá: 00 08 * * * /path/to/project/scripts/daily_run.sh

# Telegram bot
python master.py --setup automation
# Kövesd az instrukciókat
```

### 3. Teljesítmény követés

```bash
# Napi használat után
python master.py --track

# Heti/havi jelentések
python src/tracking/performance_tracker.py
```

## 🎯 Következő fejlesztések

- [ ] **Több bajnokság**: Liga MX, Premier League 2
- [ ] **Live odds**: Valós idejű odds változások
- [ ] **Advanced ML**: Deep learning modellek
- [ ] **Mobile app**: React Native alkalmazás
- [ ] **Social features**: Közösségi javaslatok

## 🆘 Támogatás és troubleshooting

### Gyakori problémák

```bash
# Modul import hibák
pip install -r requirements.txt

# API kapcsolat problémák
python master.py --api

# Rendszer állapot ellenőrzése
python master.py --monitor
```

### Log fájlok

- `logs/automation.log` - Automatikus futások
- `logs/daily_assistant.log` - Napi javaslatok
- `results/betting_performance.json` - Teljesítmény adatok

### Dokumentáció

- `docs/VALÓS_ADATOK_INTEGRÁCIÓ.md` - API integráció
- `docs/RENDSZEREZÉS_ÖSSZEFOGLALÓ.md` - Projekt áttekintés

---

**🎉 A rendszer most már teljes mértékben használatra kész valós fogadási környezetben!**
