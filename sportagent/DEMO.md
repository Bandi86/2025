# 🏆 Sport Agent - Bemutató

## Mit csinál ez az alkalmazás?

A Sport Agent egy intelligens ügynök, ami automatikusan:

1. **Gyűjti** a sport meccsek adatait az internetről
2. **Elemzi** és rendszerezi ezeket az adatokat
3. **Generál** szép riportokat HTML/Markdown/JSON formátumban
4. **Részletes elemzést** készít kiválasztott meccsekről

## 🎯 Gyors Start - Demo Mód

```bash
# Egyszerű riport holnapi "meccsekre" (demo adatok)
python -m src.main --demo --date tomorrow

# Interaktív mód - válaszd ki, mit szeretnél
python -m src.main --interactive --demo
```

## 🔍 Mit tartalmaz egy riport?

### Alapriport

- ⚽ Meccsek listája (csapatok, időpont, liga)
- 📊 Odds/fogadási kurokok
- 🏆 Liga kategorizálás
- ⭐ Fontossági pontszám

### Részletes elemzés

- 📈 Statisztikai előnézet
- 💰 Odds elemzés és értékelés
- 🎯 Eredmény előrejelzés
- 🔑 Kulcs tényezők azonosítása

## 🌐 Adatforrások

### Web Scraping

- ESPN Sports
- BBC Sport
- Sky Sports

### API Integráció

- Football-Data.org (⚽ foci)
- The Odds API (💰 fogadási odds)
- Sports Data API (🏀 kosárlabda, 🏈 amerikai foci)

## 📱 Használati módok

### 1. Egyszeri riport

```bash
python -m src.main --date 2025-07-10 --format html
```

### 2. Interaktív mód

```bash
python -m src.main --interactive
```

- Válassz dátumot
- Generálj riportot
- Válassz meccseket részletes elemzésre

### 3. Demo mód (nincs szükség API kulcsokra)

```bash
python -m src.main --demo --interactive
```

## 🎨 Riport típusok

| Formátum | Leírás | Használat |
|----------|---------|-----------|
| **HTML** | Szép, webes megjelenés | Böngészőben megnyitható |
| **Markdown** | Egyszerű szöveg | GitHub, dokumentáció |
| **JSON** | Strukturált adatok | Programozói használat |

## 🚀 Következő lépések

1. **Próbáld ki** a demo módot
2. **Szerezz be** API kulcsokat az éles használathoz
3. **Személyre szabd** a ligákat és csapatokat
4. **Automatizáld** a daily riportokat

## 🛠️ Konfigurálás

Szerkeszd a `.env` fájlt:

```env
# API kulcsok (opcionális)
FOOTBALL_API_KEY=your_key_here
ODDS_API_KEY=your_key_here

# Riport beállítások
REPORTS_DIR=output/reports
LOG_LEVEL=INFO
```

## 📞 Támogatás

- 📖 Részletes útmutató: `USAGE.md`
- 🐛 Hibák jelentése: GitHub Issues
- 💡 Ötletek és javaslatok szívesen látottak!

---

**Tipp:** Kezdd a `--demo` móddal, hogy lásd, hogyan működik API kulcsok nélkül! 🎭
