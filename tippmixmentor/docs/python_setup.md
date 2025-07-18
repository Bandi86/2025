# Python környezet beállítása

A BettingMentor projekt több Python-alapú modult tartalmaz (pdfconverter, webscrapper, betmentors, soccerdata). A hatékony fejlesztés érdekében egy központi virtuális környezetet használunk az összes Python modul számára.

## Előfeltételek

- Python 3.9 vagy újabb verzió
- pip (Python csomagkezelő)

## Telepítés

A Python környezet beállításához használd a `python-setup.sh` szkriptet:

```bash
./python-setup.sh setup
```

Ez a szkript a következő műveleteket végzi:

1. Létrehoz egy `.venv` virtuális környezetet a projekt gyökérkönyvtárában
2. Telepíti az összes szükséges függőséget a különböző modulokból
3. Létrehozza a szükséges `.env` fájlokat a Python modulokhoz
4. Szimbolikus linkeket hoz létre a modulokhoz, hogy importálhatók legyenek
5. Frissíti a `.gitignore` fájlt a virtuális környezet kizárásához
6. Létrehozza a VSCode beállításokat a Python fejlesztéshez

## Virtuális környezet aktiválása

### Linux/macOS

```bash
source .venv/bin/activate
```

### Windows

```bash
.venv\Scripts\activate
```

## Függőségek frissítése

Ha új függőségeket adtál hozzá valamelyik modulhoz, frissítsd a virtuális környezetet:

```bash
./python-setup.sh update
```

## Modulok használata

A virtuális környezet aktiválása után az összes modul importálható a Python kódban:

```python
# soccerdata használata
import soccerdata as sd

# Saját modulok használata (ha telepítve vannak fejlesztői módban)
from pdfconverter import convert_pdf
from webscrapper import scrape_data
from betmentors import predict
```

## Docker integráció

A Docker konténerekben futó szolgáltatások (pl. backend) hozzáférnek a Python modulokhoz a kötetek (volumes) segítségével:

```yaml
volumes:
  - ./pdfconverter:/usr/src/pdfconverter
  - ./webscrapper:/usr/src/webscrapper
  - ./betmentors:/usr/src/betmentors
```

## Tesztelés

A tesztek futtatásához aktiváld a virtuális környezetet, majd futtasd a teszteket:

```bash
# Példa: soccerdata teszt futtatása
python test/soccerdata_test/fbref_test.py
```

## Hibaelhárítás

### ImportError: No module named...

Ha importálási hibát tapasztalsz, ellenőrizd, hogy:

1. A virtuális környezet aktiválva van-e
2. A modul telepítve van-e a virtuális környezetben
3. A modul fejlesztői módban van-e telepítve (`pip install -e ./modulnév`)

### PermissionError

Ha jogosultsági hibát tapasztalsz a szkript futtatásakor, add hozzá a futtatási jogot:

```bash
chmod +x python-setup.sh
```