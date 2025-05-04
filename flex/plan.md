# Fejlesztési terv: Saját médiaszerver backend (Node.js + Express + TypeScript)

Ez a terv dokumentum lépésről lépésre vázlatolja a saját fejlesztésű médiaszerver backend elkészítését. A szerver célja, hogy egy mappában lévő videókat beolvassa, lekérje hozzájuk a metaadatokat, mentse azokat egy adatbázisba, majd API-n keresztül elérhetővé tegye.

## 1. Projekt inicializálása

* Initialize the project structure as outlined in the plan.md file.

## 2. Projekt struktúra

```
/server
  |-- src/
  |    |-- index.ts             # Express indítás
  |    |-- scanner/
  |    |    |-- mediaScanner.ts    # Mappában lévő videók felderítése
  |    |-- metadata/
  |    |    |-- tmdbFetcher.ts     # Metaadatok lekérése TMDb API-ból
  |    |-- db/
  |    |    |-- database.ts        # SQLite inicializálás és kezelés
  |    |-- routes/
  |    |    |-- mediaRoutes.ts     # REST API a klienseknek
  |-- media/                  # Itt vannak a videók
  |-- plan.md                 # Ez a terv
  |-- tsconfig.json
  |-- package.json
```

## 3. Médiafájlok keresése

**mediaScanner.ts**

*

## 4. Metaadat lekérdezés (TMDb API)

**tmdbFetcher.ts**

*

## 5. Adatbázis kezelés (SQLite)

**database.ts**

*

## 6. REST API végpontok

**mediaRoutes.ts**

*

## 7. Videó streamelés

**index.ts vagy külön streamHandler.ts**

*

## 8. Tesztelés

*

## 9. Extra lehetőségek (később)

* Felhasználó authentikáció
* "Folytasd, ahol abbahagytad" pozíció mentés
* Feliratfájl (.srt) kezelés
* Szezon/epizód felismerés

---

Ez a terv egy MVP (minimum viable product) alapjait fedi le. Ha szeretnéd, elkezdhetjük az első modult közösen megírni, pl. a `mediaScanner.ts`-t.
