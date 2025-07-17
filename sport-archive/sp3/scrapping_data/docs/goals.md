# Scrapping Data - Projektterv

## Mi a cél?

- **Aznapi meccslista létrehozása**: Adott nap futball meccsek listájának automatikus lekérése
- **Részletes meccs adatok gyűjtése**: Minden meccshez teljes statisztikai és esemény adatok
- **Strukturált adattárolás**: JSON formátumban, dátum alapú szervezéssel
- **Többforrású adatgyűjtés**: Különböző weboldalakról (FlashScore, Eredmények.com, stb.)

## Mappa és fájl struktúra

### Főmappák

```
scrapping_data/
├── data/                    # Nyers adatok dátum szerint
│   └── 2025/07/10/         # Példa: 2025. július 10.
│       ├── 20250710.json   # Aznapi meccslista
│       └── matches/        # Részletes meccs adatok
│           ├── 20250710_bolivar_vs_independiente.json
│           └── 20250710_the_strongest_vs_blooming.json
├── scripts/                # Python szkriptek
│   ├── scrapping.py        # Fő koordináló szkript
│   ├── daily_match_list.py # Napi meccslista generálás
│   ├── detailed_match_scraper.py # Részletes meccs adatok
│   ├── sources/            # Forrás-specifikus scrapers
│   │   ├── flashscore.py   # FlashScore scraper
│   │   ├── eredmenyek.py   # Eredmenyek.com scraper
│   │   └── base_scraper.py # Alap scraper osztály
│   └── utils/              # Segédeszközök
│       ├── json_handler.py # JSON fájl kezelés
│       ├── date_utils.py   # Dátum műveletek
│       └── validators.py   # Adatvalidáció
├── docs/                   # Dokumentáció
├── test/                   # Unit tesztek
├── debug/                  # Debug fájlok
├── logs/                   # Naplófájlok
└── reports/                # Jelentések
```

### Folyamat leírás

1. **daily_match_list.py** - Adott nap meccslistája (20250710.json)
2. **detailed_match_scraper.py** - Linkek alapján részletes adatok gyűjtése
3. **scrapping.py** - Teljes folyamat koordinálása

## Részletes meccs JSON struktúra

### Header információk

```json
{
  "match_header": {
    "country": "Bolivia",
    "league": "División Profesional",
    "round": 13,
    "date": "2025-07-07",
    "time": "20:00",
    "teams": {
      "home": "Bolivar",
      "away": "Independiente"
    },
    "pre_match_odds": {
      "home_win": 1.75,
      "draw": 3.00,
      "away_win": 5.12
    },
    "winning_odds": 1.75,
    "final_score": {
      "home": 4,
      "away": 0
    }
  }
}
```

### Pre-match adatok

```json
{
  "pre_match_data": {
    "referee": "Carlos Mendez",
    "venue": "Estadio Hernando Siles",
    "capacity": 42000,
    "attendance": 38500,
    "weather": "Sunny",
    "temperature": "18°C"
  }
}
```

### Meccs események (Timeline)

```json
{
  "match_timeline": [
    {
      "minute": 11,
      "event_type": "yellow_card",
      "player": "Juan Perez",
      "team": "home",
      "description": "Rough tackle"
    },
    {
      "minute": 15,
      "event_type": "goal",
      "player": "Carlos Rodriguez",
      "team": "home",
      "assist": "Miguel Santos",
      "description": "Header from corner"
    }
  ]
}
```

### Részletes statisztikák

#### Top statisztikák

```json
{
  "top_stats": {
    "expected_goals": {"home": 2.1, "away": 0.8},
    "possession": {"home": 65, "away": 35},
    "total_shots": {"home": 15, "away": 8},
    "shots_on_target": {"home": 7, "away": 3},
    "big_chances": {"home": 4, "away": 1},
    "corners": {"home": 8, "away": 3},
    "passes": {"home": 456, "away": 278},
    "yellow_cards": {"home": 2, "away": 4},
    "red_cards": {"home": 0, "away": 1}
  }
}
```

#### Lövések részletesen

```json
{
  "shots_detailed": {
    "expected_goals": {"home": 2.1, "away": 0.8},
    "expected_goals_on_target": {"home": 1.8, "away": 0.6},
    "total_shots": {"home": 15, "away": 8},
    "shots_on_target": {"home": 7, "away": 3},
    "shots_off_target": {"home": 6, "away": 4},
    "blocked_shots": {"home": 2, "away": 1},
    "shots_inside_box": {"home": 10, "away": 5},
    "shots_outside_box": {"home": 5, "away": 3},
    "hit_woodwork": {"home": 1, "away": 0},
    "headed_shots": {"home": 3, "away": 2}
  }
}
```

#### Támadások

```json
{
  "attacks": {
    "big_chances": {"home": 4, "away": 1},
    "corners": {"home": 8, "away": 3},
    "touches_in_opposition_box": {"home": 23, "away": 12},
    "accurate_crosses": {"home": 5, "away": 2},
    "offsides": {"home": 3, "away": 1},
    "free_kicks": {"home": 12, "away": 18}
  }
}
```

#### Passzok

```json
{
  "passing": {
    "total_passes": {"home": 456, "away": 278},
    "long_passes": {"home": 45, "away": 38},
    "passes_final_third": {"home": 89, "away": 52},
    "through_balls": {"home": 6, "away": 3},
    "expected_assists": {"home": 1.2, "away": 0.4},
    "throw_ins": {"home": 15, "away": 12}
  }
}
```

#### Védelem

```json
{
  "defense": {
    "fouls": {"home": 12, "away": 18},
    "tackles": {"home": 18, "away": 25},
    "duels_won": {"home": 28, "away": 22},
    "clearances": {"home": 12, "away": 28},
    "interceptions": {"home": 8, "away": 15},
    "errors_leading_to_shot": {"home": 0, "away": 2},
    "errors_leading_to_goal": {"home": 0, "away": 1}
  }
}
```

#### Kapus statisztikák

```json
{
  "goalkeeper": {
    "saves": {"home": 3, "away": 7},
    "expected_goals_conceded": {"home": 0.8, "away": 2.1},
    "goals_prevented": {"home": 0, "away": -1.1}
  }
}
```

#### Fogadási esélyek

```json
{
  "betting_odds": {
    "pre_match": {
      "home_win": 1.75,
      "draw": 3.00,
      "away_win": 5.12
    },
    "live_odds": {
      "home_win": 1.25,
      "draw": 6.50,
      "away_win": 12.00
    }
  }
}
```

## Bővítési lehetőségek

### Többforrású adatgyűjtés

- **FlashScore**: Részletes statisztikák és élő adatok
- **Eredmenyek.com**: Magyar nyelvű információk
- **ESPN**: Nemzetközi meccsek
- **BBC Sport**: Alternatív forrás

### Adatok összehasonlítása

- Különböző források adatainak összevetése
- Pontosság validálás
- Hiányzó adatok pótlása

### Automatizálás

- Napi automatikus futtatás
- Valós idejű frissítések
- Hibajelentések és logging

### API integráció

- REST API a frontend számára
- Real-time WebSocket kapcsolat
- Adatbázis szinkronizálás

## Technikai követelmények

### Python függőségek

- `requests` - HTTP kérések
- `beautifulsoup4` - HTML parsing
- `selenium` - JavaScript oldal kezelés
- `json` - JSON adatkezelés
- `datetime` - Dátum műveletek
- `logging` - Naplózás

### Adatbázis (opcionális)

- SQLite egyszerű projektekhez
- PostgreSQL nagyobb projektekhez
- MongoDB NoSQL megoldáshoz

### Monitoring

- Log fájlok automatikus generálása
- Hiba értesítések
- Teljesítmény mérés
- Adatminőség ellenőrzés
