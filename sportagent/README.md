# Sport Agent

Egy intelligens sport ügynök, amely automatikusan gyűjti a sportmérkőzések adatait, elemzéseket készít, és részletes riportokat generál.

## ✨ Funkciók

- 🔍 **Automatikus adatgyűjtés** - Sportmérkőzések keresése az interneten
- 📊 **Adatelemzés** - Statisztikák és odds elemzés
- 📝 **Riportgenerálás** - HTML és Markdown riportok
- 🎯 **Részletes elemzés** - Kiválasztott meccsekhez mélyebb analízis
- 📅 **Időzített működés** - Napi vagy megadott dátumra szűrt adatok
- 🎭 **Demo mód** - Tesztadatok API kulcsok nélkül

## 🚀 Gyors Start

### Demo Mód (Teszteléshez)

```bash
# Környezet beállítása
python3 -m venv .venv
source .venv/bin/activate.fish  # vagy activate.bat Windows-on
pip install -r requirements.txt

# Demo riport holnapi "meccsekre"
python -m src.main --demo --date tomorrow

# Interaktív demo mód
python -m src.main --interactive --demo
```

### Éles Használat

```bash
# API kulcsok beállítása .env fájlban
cp .env.example .env
# Szerkeszd a .env fájlt

# Holnapi meccsek lekérése
python -m src.main --date tomorrow

# Interaktív mód
python -m src.main --interactive
```

## 📖 Dokumentáció

- 🎭 **[DEMO.md](DEMO.md)** - Gyors bemutató és demo mód
- 📚 **[USAGE.md](USAGE.md)** - Részletes használati útmutató
- ⚙️ **[.github/copilot-instructions.md](.github/copilot-instructions.md)** - Fejlesztői útmutató

```bash
# Holnapi meccsek lekérése
python -m sportagent --date tomorrow

# Megadott dátumra
python -m sportagent --date 2025-07-06

# Interaktív mód
python -m sportagent --interactive
```

## Konfiguráció

A `.env` fájlban állíthatók be az API kulcsok és beállítások.

## Projekt struktúra

```text
sportagent/
├── src/
│   ├── __init__.py
│   ├── main.py
│   ├── scrapers/
│   ├── apis/
│   ├── data/
│   ├── reports/
│   └── utils/
├── templates/
├── config/
├── tests/
└── output/
```
