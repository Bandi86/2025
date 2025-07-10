# 🔧 SP3 Adatfolyam Ellenőrző és Javító Eszközök

## Áttekintés

Ez a dokumentum a SP3 projekt adatfolyam ellenőrző és javító eszközeit ismerteti. Ezek az eszközök segítenek felismerni és javítani az adatok útjában fellépő problémákat a JSON fájloktól a frontend megjelenítésig.

## 📊 Comprehensive Data Validator

### Funkciók

A **Comprehensive Data Validator** végigköveti az egész adatfolyamatot és részletes jelentést készít:

1. **JSON fájlok elemzése** - Ellenőrzi a forrás JSON fájlokat
2. **Adatbázis elemzése** - Vizsgálja az adatbázisban tárolt adatokat
3. **API elemzése** - Teszteli az API végpontokat
4. **Eltérések elemzése** - Összehasonlítja az egyes fázisokat
5. **Anomália detektálás** - Felismeri a gyanús adatokat

### Használat

```bash
# Backend containerben
cd /home/bandi/Documents/code/2025/sp3/backend
npm run validate-data

# Vagy közvetlenül
npx ts-node scripts/comprehensive-data-validator.ts
```

### Kimenet

- **Konzol jelentés** - Részletes elemzés a konzolban
- **JSON jelentés** - Strukturált adatok a `/backend/reports/` mappában
- **Adatminőség pontszám** - 0-100 skála
- **Kategorizált problémák** - Kritikus, figyelmeztetés, javaslat

## 🔧 Data Fixer

### Funkciók

A **Data Fixer** automatikusan javítja a felismert problémákat:

1. **Duplikált csapatok egyesítése** - Azonos nevű csapatok összevonása
2. **Tiszta adatok újraimportálása** - Adatbázis reset és újra import
3. **Időpontok javítása** - Hiányzó időpontok pótlása
4. **Komplett javítás** - Minden javítás egyszerre

### Használat

```bash
# Minden javítás egyszerre
npm run fix-data

# Vagy részlegesen
npx ts-node scripts/data-fixer.ts fix-duplicates  # Duplikátumok javítása
npx ts-node scripts/data-fixer.ts reimport       # Újraimportálás
npx ts-node scripts/data-fixer.ts fix-times      # Időpontok javítása
```

## 🔄 Import Trigger

### Funkciók

A **Import Trigger** manuálisan elindítja a JSON import folyamatot:

1. **Automatikus file detektálás** - Megkeresi a legújabb JSON fájlt
2. **Import trigger** - Elindítja a watcher szolgáltatást
3. **Temp file cleanup** - Takarítás az import után

### Használat

```bash
npm run trigger-import

# Vagy közvetlenül
npx ts-node scripts/trigger-import.ts
```

## 📋 Tipikus Használati Forgatókönyv

### 1. Problémás adatok diagnosztizálása

```bash
# Futtasd az elemzőt
npm run validate-data

# Nézd meg a jelentést
cat backend/reports/data-validation-*.json | jq '.summary'
```

### 2. Problémák javítása

```bash
# Automatikus javítás
npm run fix-data

# Vagy lépésről lépésre
npx ts-node scripts/data-fixer.ts fix-duplicates
npx ts-node scripts/data-fixer.ts reimport
```

### 3. Ellenőrzés a javítás után

```bash
# Újra elemzés
npm run validate-data

# API tesztelés
curl "http://localhost:3001/api/matches?dateFrom=2025-07-04&dateTo=2025-07-04"
```

## 🚨 Gyakori Problémák és Megoldások

### Problem: "Nagy eltérés a JSON és adatbázis között"

**Oka**: A JSON fájlok nem lettek importálva vagy a duplikátumok miatt rosszul számolódnak.

**Megoldás**:

```bash
npm run fix-data
```

### Problem: "API nem ad vissza meccseket"

**Oka**: A backend API date filtering hibája vagy a frontend rossz paraméterekkel hívja.

**Megoldás**: Ellenőrizd a backend controller-ben a date paraméter kezelését.

### Problem: "Duplikált csapatok/meccsek"

**Oka**: Többszöri import vagy hibás ID generálás.

**Megoldás**:

```bash
npx ts-node scripts/data-fixer.ts fix-duplicates
```

### Problem: "Gyanús csapat/bajnokság nevek"

**Oka**: PDF parsing hibák, piaci információk csapatnevekként értelmezve.

**Megoldás**: Ellenőrizd a PDF parsing logikát és szűrd ki a hibás neveket.

## 📊 Jelentés Értelmezése

### Adatminőség Pontszám

- **90-100**: Kiváló ✅
- **70-89**: Jó ⚠️
- **50-69**: Közepes ⚠️
- **0-49**: Kritikus 🚨

### Státusz Kategóriák

- **HEALTHY**: Minden rendben ✅
- **WARNING**: Kisebb problémák ⚠️
- **CRITICAL**: Súlyos problémák 🚨

### Fázis Elemzés

1. **Phase 1 (JSON)**: Forrás fájlok állapota
2. **Phase 2 (Database)**: Adatbázis konzisztencia
3. **Phase 3 (API)**: API működés
4. **Phase 4 (Discrepancy)**: Fázisok közti eltérések
5. **Phase 5 (Anomaly)**: Gyanús adatok

## 🔧 Fejlesztés és Testreszabás

### Új Ellenőrzés Hozzáadása

A `ComprehensiveDataValidator` osztályban:

1. Adj hozzá új interfészt a `report` típushoz
2. Implementáld az új fázist `phase*_` metódusként
3. Hívd meg a `runFullValidation()` metódusban
4. Adj hozzá a `generateSummary()` metódusban logikát

### Új Javítás Hozzáadása

A `DataFixer` osztályban:

1. Implementálj új `fix*()` metódust
2. Adj hozzá a `fixAll()` metódushoz
3. Frissítsd a CLI interface-t

## 📞 Támogatás

Ha problémák merülnek fel:

1. Futtasd le a comprehensive validator-t
2. Nézd meg a részletes JSON jelentést
3. Próbáld meg a data fixer-t
4. Ellenőrizd a Docker logs-okat

```bash
# Docker logs ellenőrzése
docker-compose logs backend
docker-compose logs postgres
```
