# PDF to JSON Converter

Egy robusztus alkalmazás nagy méretű PDF dokumentumok JSON formátumra konvertálásához.

## Funkciók

- **Alapvető konverzió**: Teljes PDF tartalom JSON-né alakítása
- **Strukturált konverzió**: Előre definiált JSON séma alapján
- **Batch feldolgozás**: Több PDF egyszerre
- **Progress tracking**: Nagy fájlokhoz
- **Football adat kinyerés**: Labdarúgás mérkőzések és oddsok kiszűrése
- **Web API**: FastAPI alapú REST API
- **Web felület**: Streamlit alapú felhasználói felület

## Telepítés

1. Klónozd a repository-t:
```bash
git clone <repository-url>
cd pdf-to-json
```

2. Hozz létre egy virtuális környezetet:
```bash
python -m venv venv
source venv/bin/activate  # Linux/Mac
# vagy
venv\Scripts\activate  # Windows
```

3. Telepítsd a függőségeket:
```bash
pip install -r requirements.txt
```

## Használat

### 1. Parancssori használat

```bash
# Alapvető PDF konverzió
python main.py --input source/document.pdf --output jsons/output.json

# Football adatok kinyerése JSON-ből
python main.py --extract-football jsons/output.json --football-output jsons/football.json

# Csak fő mérkőzések (1X2 odds)
python main.py --extract-football jsons/output.json --football-output jsons/main_matches.json --main-matches-only
```

### 2. Web API használat

Indítsd el a szervert:
```bash
uvicorn src.api.main:app --reload
```

### 3. Web felület használat

Indítsd el a Streamlit alkalmazást:
```bash
streamlit run src.ui.streamlit_app.py
```

## Projekt struktúra

```
pdf-to-json/
├── src/
│   ├── converter/          # PDF konverzió logika
│   ├── api/               # FastAPI endpoint-ok
│   └── ui/                # Streamlit felület
├── config/                # Konfigurációs fájlok
├── tests/                 # Unit tesztek
├── source/                # Bemeneti PDF fájlok
└── jsons/                 # Kimeneti JSON fájlok
```

## Konfiguráció

A JSON séma definíciókat a `config/schemas/` mappában találod.

## Fejlesztés

Tesztek futtatása:
```bash
pytest tests/
```

Kód formázás:
```bash
black src/
```

## Licenc

MIT 