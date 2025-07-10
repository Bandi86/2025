# SP3 Data Validation Scripts

Ez a mappa tartalmazza az SP3 adatfolyam validációs és monitoring szkripteket.

## Szkriptek Áttekintése

### 🔍 Core Validation Scripts

#### `comprehensive_validation.py`

**Fő validációs szkript** - Ezt futtasd rendszeresen!

```bash
.venv/bin/python scripts/comprehensive_validation.py
```

- Futtatja az összes validációs szkriptet
- Átfogó állapot értékelést ad
- Egészségügyi pontszámot számol
- Ajánlásokat ad

#### `quick_db_validation.py`

Database integritás gyors ellenőrzés

```bash
.venv/bin/python scripts/quick_db_validation.py
```

- Alapvető DB statisztikák
- Foreign key integritás
- Árva rekordok keresése

#### `compare_json_vs_db.py`

JSON vs Database tartalom összehasonlítás

```bash
.venv/bin/python scripts/compare_json_vs_db.py
```

- Data coverage számítás
- Missing/extra meccsek azonosítása
- Field és market különbségek

#### `analyze_weekly_duplicates.py`

Heteken belüli duplikátumok részletes elemzése

```bash
.venv/bin/python scripts/analyze_weekly_duplicates.py
```

- Időbeli progresszió tracking
- Új piacok/odds változások detektálása
- Valuable duplicates azonosítása

### 📊 Legacy/Archived Scripts

#### `analyze_duplicate_content.py`

Duplikált meccsek tartalom szintű összehasonlítása

- **Státusz**: Archivált (comprehensive_validation-be integrálva)
- Market-by-market comparison
- Metadata vs content analysis

## Használati Útmutató

### Napi Használat

```bash
# Gyors health check
.venv/bin/python scripts/comprehensive_validation.py

# Eredmények áttekintése
cat reports/comprehensive_validation_report.json
```

### Problémás Esetek

```bash
# Database probléma esetén
.venv/bin/python scripts/quick_db_validation.py

# JSON import probléma esetén
.venv/bin/python scripts/compare_json_vs_db.py

# Duplikátum logika kérdés esetén
.venv/bin/python scripts/analyze_weekly_duplicates.py
```

### Új Funkció Fejlesztés Után

```bash
# Teljes validáció
.venv/bin/python scripts/comprehensive_validation.py

# Specifikus terület ellenőrzése
.venv/bin/python scripts/[relevant_script].py
```

## Output Fájlok

### Reports Directory

```
reports/
├── comprehensive_validation_report.json    # Fő jelentés
├── json_vs_db_comparison.json             # JSON vs DB
├── weekly_duplicates_analysis.json        # Duplikátum elemzés
└── duplicate_content_analysis.json        # Részletes content összehasonlítás
```

### Report Struktura

#### `comprehensive_validation_report.json`

```json
{
  "timestamp": "2025-01-05T11:10:08",
  "health_score": 100.0,
  "status": "🟢 EGÉSZSÉGES",
  "script_results": {...},
  "reports_summary": {...}
}
```

#### `json_vs_db_comparison.json`

```json
{
  "summary": {
    "json_matches": 1276,
    "db_matches": 1726,
    "data_coverage_percent": 94.4
  },
  "differences": {...},
  "sample_differences": [...]
}
```

## Troubleshooting

### Common Issues

#### Python Environment

```bash
# Ha import error
source .venv/bin/activate
pip install -r requirements.txt
```

#### Database Connection

```bash
# Ha psycopg2 error
docker ps  # Check if postgres is running
docker logs sp3-postgres-1
```

#### Permission Issues

```bash
chmod +x scripts/*.py
```

### Error Codes

- **Exit 0**: Sikeres futás
- **Exit 1**: Általános hiba
- **Exit 2**: Database kapcsolódási hiba
- **Exit 3**: File/directory nem található

## Development

### Új Validációs Szkript Hozzáadása

1. Hozd létre a szkriptet a `scripts/` mappában
2. Add hozzá a `comprehensive_validation.py`-hoz:

   ```python
   scripts = [
       # ... existing scripts
       {
           'path': 'scripts/your_new_script.py',
           'description': 'Your script description',
           'report_file': 'reports/your_report.json'
       }
   ]
   ```

3. Teszteld:

   ```bash
   .venv/bin/python scripts/comprehensive_validation.py
   ```

### Best Practices

- **Mindig használd a project venv-et**: `.venv/bin/python`
- **Kezelj exceptionsöket gracefully**
- **Írj részletes log output-ot**
- **Mentsd az eredményeket JSON-ba**
- **Kövesd a meglévő kódstílust**

## Contact

- **Maintainer**: Bandi
- **Last Updated**: 2025.01.05
- **Documentation**: `docs/MAINTENANCE_GUIDE.md`
