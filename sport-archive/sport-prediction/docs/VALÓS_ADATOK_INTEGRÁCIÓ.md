# 🌍 VALÓS ADATOK INTEGRÁLÁSI ÚTMUTATÓ

## 🎯 Cél

A jelenlegi rendszer Premier League (2022-2025) szimulált adatokkal működik.
Most valós adatokkal és más bajnokságokkal bővítjük ki.

## 📊 Jelenlegi állapot

✅ **Működő rendszer**: Napi fogadási asszisztens, kombinációs javaslatok
✅ **Tiszta struktúra**: src/core, src/tools, data/, results/
✅ **Gépi tanulás**: Random Forest, XGBoost, Kelly Criterion
✅ **Kockázatmenedzsment**: Bankroll védelem, stop-loss

## 🔍 Valós adatforrások keresése

### 1. Ingyenes API-k

```bash
# Football Data API (ingyenes tier)
curl "https://api.football-data.org/v4/competitions/PL/matches" \
  -H "X-Auth-Token: YOUR_TOKEN"

# API-Football (freemium)
curl "https://v3.football.api-sports.io/fixtures" \
  -H "X-RapidAPI-Key: YOUR_KEY"
```

### 2. Nyári bajnokságok (2025 június)

- 🇺🇸 **MLS**: Regular season (északi nyár = fő szezon)
- 🇧🇷 **Brasileirão**: Serie A (májustól decemberig)
- 🇦🇷 **Primera División**: Copa de la Liga
- 🇯🇵 **J-League**: Division 1 (márciustól decemberig)
- 🇦🇺 **A-League**: Szezon vége, play-off

### 3. Európai nyári tornák/barátságosok

- ⚽ **Copa América**: Július 2025
- 🏆 **EURO U21**: Nyári torna
- 🤝 **Felkészülési meccsek**: Július-augusztus

## 🛠️ Implementációs lépések

### 1. Adatforrás kiválasztása

```python
# Példa: Football Data API integráció
import requests

def get_live_matches():
    url = "https://api.football-data.org/v4/matches"
    headers = {"X-Auth-Token": "YOUR_TOKEN"}
    response = requests.get(url, headers=headers)
    return response.json()
```

### 2. Új bajnokság hozzáadása

```bash
# Új bajnokság struktúra
mkdir data/mls
mkdir data/brasileirao
mkdir data/j_league
```

### 3. Adatkonverzió

```python
# data/mls/converter.py
def convert_mls_data_to_standard_format(raw_data):
    """Konvertálja az MLS adatokat a rendszer formátumára"""
    return standardized_df
```

## 📅 Javaslat: MLS implementáció

### Miért MLS?

- ✅ **Aktív szezon**: Június a csúcsidőszak
- ✅ **Jó odds ellátottság**: Európai fogadóirodák
- ✅ **Elérhető adatok**: Statisztikák, forma
- ✅ **Időzóna**: US keleti part = EU este (ideális)

### Implementációs terv

1. **Adatgyűjtés**: MLS 2023-2024 múltbeli mérkőzések
2. **Adaptáció**: Team form analyzer MLS csapatokra
3. **Odds integráció**: Bet365, Pinnacle MLS odds
4. **Tesztelés**: Napi javaslatok validation

### Kód struktúra

```
data/
├── premier_league/     # Meglévő
├── mls/               # Új
│   ├── mls2023.csv
│   ├── mls2024.csv
│   └── team_info.json
└── config/
    └── league_configs.json
```

## 🎯 Következő lépések

### 1. Azonnali (1-2 nap)

- [ ] Football Data API kulcs regisztráció
- [ ] MLS múltbeli adatok letöltése
- [ ] Adatkonverziós script írása

### 2. Rövid távon (1 hét)

- [ ] Live odds scraping beépítése
- [ ] MLS daily assistant adaptálása
- [ ] Backtesting MLS adatokon

### 3. Hosszú távon (1 hónév)

- [ ] Multi-liga rendszer
- [ ] Automatikus napi futtatás
- [ ] Telegram/Discord bot integrálás

## 💡 Tippek

### Adatgyűjtés

```bash
# Kaggle datasets keresése
pip install kaggle
kaggle datasets search "mls soccer"

# GitHub scraping scripts
git clone https://github.com/search?q=mls+data+scraping
```

### Odds források

- **Pinnacle**: Legjobb odds, API elérhető
- **Bet365**: Legnagyobb piac
- **OddsPortal**: Historikus odds

### Validation

```python
# Backtest új ligával
python src/tools/realistic_betting_system.py --league mls
```

## 🚀 Quick Start: MLS integráció

1. **Adatok letöltése**:

```bash
# MLS adatok keresése
wget "https://example.com/mls_2024.csv" -O data/mls/mls2024.csv
```

2. **Converter futtatása**:

```bash
python data/mls/convert_mls_data.py
```

3. **Tesztelés**:

```bash
python src/tools/daily_betting_assistant.py --league mls
```

---

**💬 Kérdések?**

- Melyik bajnokságot részesíted előnyben?
- Van kedvenc odds provider?
- Automatikus vagy manuális adatfrissítés?
