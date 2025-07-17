# Backend Scripts Organization

Ez a mappa a SP3 football prediction platform backend scripjeit tartalmazza, kategóriák szerint rendszerezve.

## 📁 Mappastruktúra (55 script rendszerezve)

### `/active` (4 script) - Aktív, használandó scriptek

- **import-matches.ts** - JSON fájlok importálása az adatbázisba (javított időkezelés + duplikáció szűrés)
- **comprehensive-data-validator.ts** - Teljes adatbázis validáció
- **backup-database.js** - Adatbázis biztonsági mentés
- **trigger-import.ts** - Import folyamat indítása

### `/tests` (12 script) - Tesztek és validációk

- **test-import-logic.ts** - Import logika tesztelése
- **test-frontend-*.js** - Frontend funkciók tesztelése
- **test-time-*.js** - Időkezelés tesztelése
- **validate-*.js** - Validációs scriptek

### `/debug` (16 script) - Debug és hibaelhárítás

- **check-*.js** - Különböző ellenőrzések (adatbázis, meccsek, időpontok)
- **investigate-*.js** - Problémák vizsgálata
- **debug-*.js** - Debug scriptek

### `/maintenance` (7 script) - Karbantartási műveletek

- **fix-*.js** - Adatok javítása (időzónák, csapatnevek)
- **deduplicate-*.js** - Duplikáció eltávolítása
- **remove-*.js** - Törlési műveletek
- **update-*.js** - Adatfrissítések

### `/archive` (18 script) - Archivált/elavult scriptek

- Régi, már nem használt scriptek
- Biztonsági másolatok
- Egyszeri javítási scriptek

## 🚀 Gyakran használt scriptek

### Adatimport

```bash
npx ts-node scripts/active/import-matches.ts
```

### Adatvalidáció

```bash
npx ts-node scripts/active/comprehensive-data-validator.ts
```

### Biztonsági mentés

```bash
node scripts/active/backup-database.js
```

### Import trigger

```bash
npx ts-node scripts/active/trigger-import.ts
```

## 📝 Jegyzetek

- Minden script tartalmazza a saját dokumentációját
- Futtatás előtt mindig ellenőrizd az adatbázis állapotát
- A tesztek és debug scriptek nem módosítják az adatokat
- Karbantartási scriptek előtt készíts biztonsági mentést

## 🗂️ Script kategóriák

| Kategória | Fájlok | Célja | Példák |
|-----------|--------|-------|--------|
| active | 4 | Aktív használat | import, backup, validate |
| tests | 12 | Tesztelés | test-*, validate-* |
| debug | 16 | Hibaelhárítás | check-*, investigate-*, debug-* |
| maintenance | 7 | Karbantartás | fix-*, deduplicate-*, remove-* |
| archive | 16 | Archívum | régi/elavult scriptek |

## ✅ Rendszerezés eredménye

- **53 → 55 script** kategorizálva
- **Strukturált mappa rendszer**
- **Egyértelmű kategóriák**
- **Könnyű navigáció**
- **Dokumentált használat**
