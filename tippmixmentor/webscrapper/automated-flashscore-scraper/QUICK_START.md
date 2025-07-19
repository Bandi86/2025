# 🚀 Gyors Kezdés

## 1. Telepítés

```bash
cd webscrapper/automated-flashscore-scraper
./install.sh
```

## 2. Teszt futtatása

```bash
npm test
```

Ez leteszt egy meccs adatainak lekérését a Magyar NB I-ből és ment egy példa JSON-t.

## 3. Konfiguráció ellenőrzése

```bash
npm run config
```

## 4. Scraping módok

### 🎯 Alapértelmezett (konfigurált ligák)
```bash
npm start
```

### 🌟 MINDEN elérhető adat (átfogó)
```bash
npm run comprehensive
```
⚠️ Ez **órákig** tarthat! Minden országból minden ligát letölt.

### 🔍 Liga felfedezés (mi érhető el)
```bash
npm run discover
```

## 5. Monitoring

```bash
npm run status    # Aktuális státusz
npm run stats     # Részletes statisztikák
```

## 6. ML Dataset generálás

```bash
npm run ml-dataset
```

Ez minden JSON fájlból generál ML-ready CSV fájlokat.

Az adatok a `scraped_data/` mappában lesznek:

```
scraped_data/
├── hungary/
│   └── nb-i-2024-2025/
│       └── 2024-2025/
│           └── nb-i-2024-2025_matches.json
└── ...
```

## ⚙️ Testreszabás

Szerkeszd a `src/config/index.js` fájlt:

- **Késleltetések módosítása** (rate limiting)
- **Új ligák hozzáadása**
- **Fájlformátum váltása** (JSON ↔ CSV)

## 🛑 Leállítás

`Ctrl+C` a futó scraper leállításához.

## 📊 Monitoring

- **Logok**: `logs/scraper.log`
- **Konzol**: Színes, valós idejű kimenet
- **Statisztikák**: `npm run stats`

## 🔧 Hibaelhárítás

1. **Browser hiba**: `sudo apt-get install -y gconf-service libasound2-dev`
2. **Memória hiba**: Csökkentsd a párhuzamos folyamatok számát
3. **Timeout**: Növeld a `TIMEOUT` értéket a config-ban