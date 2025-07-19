# Data Ingestion Module

Ez a modul felelős a JSON fájlokból származó adatok Prisma adatbázisba való integrálásáért.

## Funkciók

- **JSON fájl feldolgozás**: Egyesített JSON fájlok beolvasása és feldolgozása
- **Adatbázis integráció**: Adatok mentése PostgreSQL adatbázisba Prisma ORM-en keresztül
- **Duplikáció kezelés**: Upsert műveletek a duplikált adatok elkerülésére
- **Statisztikák**: Adatbázis állapot és feldolgozási statisztikák

## API Végpontok

### POST /data-ingestion/ingest-file
Egyetlen JSON fájl feldolgozása.

**Request Body:**
```json
{
  "filePath": "merge_json_data/merged_data/merged_matches_2025-07-19.json"
}
```

### POST /data-ingestion/ingest-all
Összes JSON fájl feldolgozása egy könyvtárból.

**Request Body:**
```json
{
  "directoryPath": "merge_json_data/merged_data" // opcionális
}
```

### GET /data-ingestion/stats
Adatbázis statisztikák lekérése.

## Gateway API Végpontok

### GET /api/matches
Összes meccs lekérése lapozással.

### GET /api/matches/upcoming
Közelgő meccsek lekérése.

### GET /api/matches/date/:date
Adott napi meccsek lekérése.

### POST /api/ingest
Adatfeldolgozás indítása a gateway-en keresztül.

### GET /api/stats
Adatbázis statisztikák lekérése a gateway-en keresztül.

## Használat

### 1. Adatbázis séma frissítése
```bash
cd backend
pnpm prisma migrate dev --name "add-unique-constraints"
pnpm prisma generate
```

### 2. Fejlesztői szerver indítása
```bash
cd backend
pnpm start:dev
```

### 3. Adatok feldolgozása
```bash
# Összes fájl feldolgozása
curl -X POST http://localhost:3001/api/ingest \
  -H "Content-Type: application/json" \
  -d '{}'

# Statisztikák ellenőrzése
curl http://localhost:3001/api/stats
```

### 4. Meccsek lekérése
```bash
# Összes meccs
curl http://localhost:3001/api/matches

# Közelgő meccsek
curl http://localhost:3001/api/matches/upcoming

# Adott napi meccsek
curl http://localhost:3001/api/matches/date/2025-07-19
```