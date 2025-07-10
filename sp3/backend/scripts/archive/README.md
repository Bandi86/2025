# Backend Scripts Organization

Ez a mappa a SP3 football prediction platform backend scripjeit tartalmazza, kategóriák szerint rendszerezve.

## 📁 Mappastruktúra

### `/active` - Aktív, használandó scriptek
- **import-matches.ts** - JSON fájlok importálása az adatbázisba
- **comprehensive-data-validator.ts** - Teljes adatbázis validáció
- **backup-database.js** - Adatbázis biztonsági mentés

### `/tests` - Tesztek és validációk
- **test-import-logic.ts** - Import logika tesztelése
- **test-\*.js** - Különböző funkciók tesztelése
- **validate-\*.js** - Validációs scriptek

### `/debug` - Debug és hibaelhárítás
- **check-\*.js** - Különböző ellenőrzések
- **investigate-\*.js** - Problémák vizsgálata
- **debug-\*.js** - Debug scriptek

### `/maintenance` - Karbantartási műveletek
- **fix-\*.js** - Adatok javítása
- **deduplicate-\*.js** - Duplikáció eltávolítása
- **remove-\*.js** - Törlési művetek

### `/archive` - Archivált/elavult scriptek
- Régi, már nem használt scriptek
- Biztonsági másolatok

## 🚀 Gyakran használt scriptek

### Adatimport
```bash
npx ts-node scripts/active/import-matches.ts
```

### Adatvalidáció
```bash
node scripts/active/comprehensive-data-validator.js
```

### Biztonsági mentés
```bash
node scripts/active/backup-database.js
```

## 📝 Jegyzetek

- Minden script tartalmazza a saját dokumentációját
- Futtatás előtt mindig ellenőrizd az adatbázis állapotát
- A tesztek és debug scriptek nem módosítják az adatokat
- Karbantartási scriptek előtt készíts biztonsági mentést

## 🗂️ Script kategóriák

| Kategória | Célja | Példák |
|-----------|-------|--------|
| active | Aktív használat | import, backup, validate |
| tests | Tesztelés | test-*, validate-* |
| debug | Hibaelhárítás | check-*, investigate-*, debug-* |
| maintenance | Karbantartás | fix-*, deduplicate-*, remove-* |
| archive | Archívum | régi/elavult scriptek |
