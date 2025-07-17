# Sport Agent - Használati Útmutató

## Projekt Áttekintése

A Sport Agent egy intelligens sport ügynök alkalmazás, amely automatikusan gyűjti sportmérkőzések adatait különböző forrásokból, elemzi azokat és részletes riportokat generál.

## Főbb Funkciók

### 🔍 Automatikus Adatgyűjtés

- **Web scraping**: ESPN, BBC Sport, Sky Sports
- **API integráció**: Football-Data.org, The Odds API, Sports Data API
- **Demo mód**: Tesztadatok a fejlesztéshez

### 📊 Adatelemzés és Feldolgozás

- Meccs prioritás pontszám számítása
- Liga kategorizálás (Tier 1, 2, 3)
- Odds elemzés és értékelés
- Duplikációk eltávolítása

### 📝 Riportgenerálás

- **HTML riportok**: Szép, modern megjelenés
- **Markdown riportok**: Egyszerű szöveges formátum
- **JSON riportok**: Strukturált adatok
- **Részletes elemzések**: Mélyebb analízis kiválasztott meccsekhez

## Telepítés és Használat

### 1. Környezet Előkészítése

```bash
cd /home/bandi/Documents/code/2025/sportagent
python3 -m venv .venv
source .venv/bin/activate.fish  # Fish shell esetén
pip install -r requirements.txt
```

### 2. Konfigurálás

Szerkeszd a `.env` fájlt és add meg az API kulcsokat (opcionális):

```env
FOOTBALL_API_KEY=your_key_here
ODDS_API_KEY=your_key_here
SPORTS_API_KEY=your_key_here
```

### 3. Alaphasználat

#### Demo Mód (Tesztadatokkal)

```bash
# Egyszerű riport holnapi meccsekre
python -m src.main --demo --date tomorrow

# Interaktív mód demo adatokkal
python -m src.main --interactive --demo

# Markdown riport
python -m src.main --demo --format markdown
```

#### Éles Mód (API-kkal és scraping-gel)

```bash
# Holnapi meccsek lekérése
python -m src.main --date tomorrow

# Megadott dátumra
python -m src.main --date 2025-07-10

# Interaktív mód
python -m src.main --interactive
```

### 4. Parancsok és Opciók

| Opció | Leírás | Példa |
|-------|---------|--------|
| `--date` / `-d` | Dátum megadása | `--date 2025-07-10` |
| `--interactive` / `-i` | Interaktív mód | `--interactive` |
| `--format` / `-f` | Riport formátum | `--format html` |
| `--demo` | Demo mód | `--demo` |
| `--help` | Súgó megjelenítése | `--help` |

## Projekt Struktúra

```
sportagent/
├── src/                    # Fő forráskód
│   ├── main.py            # Belépési pont
│   ├── config.py          # Konfigurálás
│   ├── scrapers/          # Web scraping modulok
│   ├── apis/              # API integrációk
│   ├── data/              # Adatfeldolgozás
│   ├── reports/           # Riportgenerálás
│   └── utils/             # Segédeszközök
├── templates/             # HTML sablonok
├── output/               # Generált riportok
├── config/               # Konfigurációs fájlok
├── .env                  # Környezeti változók
└── requirements.txt      # Python függőségek
```

## Kimenetek

### Riportok

- **HTML**: `output/reports/matches_report_YYYYMMDD_HHMMSS.html`
- **Markdown**: `output/reports/matches_report_YYYYMMDD_HHMMSS.md`
- **JSON**: `output/reports/matches_report_YYYYMMDD_HHMMSS.json`

### Részletes Elemzések

- **HTML**: `output/reports/detailed_analysis_YYYYMMDD_HHMMSS.html`

### Logok

- **Napi log fájlok**: `logs/sportagent_YYYYMMDD.log`

## API Kulcsok Beszerzése

### Football-Data.org

1. Regisztráció: <https://www.football-data.org/client/register>
2. API kulcs beszerzése ingyenes szinten
3. Hozzáadás `.env` fájlhoz: `FOOTBALL_API_KEY=your_key`

### The Odds API

1. Regisztráció: <https://the-odds-api.com/>
2. API kulcs beszerzése
3. Hozzáadás `.env` fájlhoz: `ODDS_API_KEY=your_key`

### Sports Data API

1. Regisztráció: <https://sportsdata.io/>
2. API kulcs beszerzése
3. Hozzáadás `.env` fájlhoz: `SPORTS_API_KEY=your_key`

## Fejlesztési Lehetőségek

### Új Ligák és Sportok

- További API-k integrálása
- Új scraping források
- Specifikus sportok támogatása

### Fejlett Elemzések

- Machine learning predikciók
- Statisztikai modellek
- Trend analízis

### UI Fejlesztések

- Web interfész
- Dashboard
- Mobil alkalmazás

### Automatizálás

- Cron job-ok
- Scheduled riportok
- Email értesítések

## Hibaelhárítás

### Gyakori Problémák

#### Import hibák

```bash
# Virtual environment aktiválása
source .venv/bin/activate.fish
```

#### API hibák

- Ellenőrizd az API kulcsokat a `.env` fájlban
- Használd a `--demo` flaget teszteléshez

#### Riport generálási hibák

- Ellenőrizd a `templates/` könyvtár létezését
- Nézd meg a log fájlokat a `logs/` könyvtárban

### Debug Mód

```bash
export LOG_LEVEL=DEBUG
python -m src.main --demo --interactive
```

## Licenc és Közreműködés

Ez egy nyílt forráskódú projekt. Közreműködők és visszajelzések szívesen látottak!

### Kódolási Irányelvek

- Magyar kommentek és docstring-ek
- Type hints használata
- Robusztus hibakezelés
- Részletes dokumentáció
