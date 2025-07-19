# Automatizált Flashscore Scraper

Ez egy intelligens, háttérben futó scraper rendszer, amely automatikusan gyűjti a Flashscore-ról a labdarúgó meccsek eredményeit és statisztikáit.

## ✨ Főbb funkciók

- **Rate limiting**: Intelligens késleltetések az IP ban elkerülésére
- **Szervezett fájlstruktúra**: Országok/ligák/szezonok szerint rendezett adatok
- **Inkrementális scraping**: Csak az új meccseket tölti le
- **Részletes logging**: Minden művelet naplózva
- **Graceful shutdown**: Biztonságos leállítás
- **Hibatűrés**: Folytatja a munkát hibák esetén is

## 🚀 Telepítés

```bash
cd webscrapper/automated-flashscore-scraper
npm install
```

## ⚙️ Konfiguráció

A `src/config/index.js` fájlban állíthatod be:

- **Késleltetések**: Meccsek/ligák/országok közötti szünetek
- **Célligák**: Mely országok és ligák legyenek letöltve
- **Fájlformátum**: JSON vagy CSV
- **Logging szint**: debug, info, warn, error

### Alapértelmezett célligák:
- 🇭🇺 Magyarország: NB I, NB II
- 🏴󠁧󠁢󠁥󠁮󠁧󠁿 Anglia: Premier League, Championship
- 🇪🇸 Spanyolország: La Liga, Segunda División
- 🇩🇪 Németország: Bundesliga, 2. Bundesliga
- 🇮🇹 Olaszország: Serie A, Serie B
- 🇫🇷 Franciaország: Ligue 1, Ligue 2

## 🎯 Használat

### Egyszerű indítás
```bash
npm start
```

### Fejlesztői mód (auto-restart)
```bash
npm run dev
```

## 📁 Kimeneti struktúra

```
scraped_data/
├── hungary/
│   ├── nb-i-2024-2025/
│   │   └── 2024-2025/
│   │       └── nb-i-2024-2025_matches.json
│   └── nb-ii-2024-2025/
│       └── 2024-2025/
│           └── nb-ii-2024-2025_matches.json
├── england/
│   ├── premier-league-2024-2025/
│   └── championship-2024-2025/
└── ...
```

## 📊 Adatstruktúra

Minden meccsről a következő adatok kerülnek mentésre:

```json
{
  "matchId": {
    "stage": "PREMIER LEAGUE - ROUND 20",
    "date": "15.01.2025 16:00",
    "status": "FINISHED",
    "home": {
      "name": "Arsenal",
      "image": "https://..."
    },
    "away": {
      "name": "Chelsea", 
      "image": "https://..."
    },
    "result": {
      "home": "2",
      "away": "1"
    },
    "information": [
      {
        "category": "Referee",
        "value": "Michael Oliver (Eng)"
      }
    ],
    "statistics": [
      {
        "category": "Ball Possession",
        "homeValue": "58%",
        "awayValue": "42%"
      }
    ]
  }
}
```

## 🛡️ Rate Limiting

A scraper intelligens késleltetéseket alkalmaz:

- **Meccsek között**: 3-5 másodperc
- **Ligák között**: 10 másodperc  
- **Országok között**: 30 másodperc

Ez biztosítja, hogy ne terheljük túl a Flashscore szervereit.

## 📝 Logging

A logok két helyen jelennek meg:
- **Konzol**: Színes, olvasható formátum
- **Fájl**: `logs/scraper.log` (JSON formátum)

Log szintek: `debug`, `info`, `warn`, `error`

## 🔧 Testreszabás

### Új liga hozzáadása

```javascript
// src/config/index.js
TARGET_LEAGUES: [
  {
    country: 'portugal',
    leagues: ['primeira-liga-2024-2025']
  }
]
```

### Késleltetések módosítása

```javascript
// src/config/index.js
DELAY_BETWEEN_MATCHES: 5000, // 5 másodperc
DELAY_BETWEEN_LEAGUES: 15000, // 15 másodperc
```

## 🚨 Fontos megjegyzések

1. **Etikus használat**: A scraper respektálja a Flashscore szervereit
2. **IP védelem**: Rate limiting megakadályozza a bannolást
3. **Adatmentés**: Rendszeres mentés az adatvesztés elkerülésére
4. **Hibatűrés**: Egy sikertelen meccs nem állítja le a teljes folyamatot

## 📈 Monitoring

A scraper részletes statisztikákat nyújt:
- Futási idő
- Sikeres/sikertelen meccsek száma
- Sikerességi arány
- Feldolgozott ligák

## 🛠️ Hibaelhárítás

### Gyakori problémák:

1. **Browser nem indul**: Telepítsd a szükséges függőségeket
2. **Timeout hibák**: Növeld a `TIMEOUT` értéket
3. **Memória problémák**: Csökkentsd a párhuzamos folyamatok számát

### Debug mód:

```javascript
// src/config/index.js
LOG_LEVEL: 'debug',
HEADLESS: false // Browser ablak megjelenítése
```

## 🤝 Közreműködés

1. Fork-old a projektet
2. Készíts egy feature branch-et
3. Commit-old a változásokat
4. Push-old a branch-et
5. Nyiss egy Pull Request-et

## 📄 Licenc

MIT License - Lásd a LICENSE fájlt a részletekért.