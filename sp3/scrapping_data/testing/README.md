# Testing Directory

## Cél

Ez a mappa a részletes meccs scraping tesztelésére szolgál.

## Probléma meghatározása

- A FlashScore fő oldala csak jövőbeli meccseket mutat
- Minden meccs "scheduled" státuszban van
- Nincs múltbeli adat a fő listában

## Megoldás

1. **Manuális befejezett meccs keresése**
   - Menj a FlashScore.com-ra
   - Keress egy befejezett meccset (Results/Eredmények szekcióban)
   - Másold ki a meccs URL-jét

2. **Teszt futtatása konkrét linkkel**
   - Add hozzá a linket a teszt szkripthez
   - Futtasd a részletes scraping tesztet

## Fájlok

- `simple_test_real_match.py` - Egyszerű teszt konkrét befejezett meccs linkkel
- `README.md` - Ez a fájl

## Következő lépések

1. Keress valós befejezett meccs linket
2. Teszteld a részletes scraping funkciót
3. Ellenőrizd a kinyert adatok minőségét
4. Integráld a production scraper-be

## Példa URL formátum

```
https://www.flashscore.com/match/football/XXXXXXXXX/#/match-summary
```

Ahol `XXXXXXXXX` egy valós meccs ID egy befejezett meccsről.
