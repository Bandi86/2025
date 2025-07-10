# SP3 DATA PIPELINE KARBANTARTÁSI ÚTMUTATÓ

## RENDSZERES ELLENŐRZÉSEK

### Hetente (Recommended)

```bash
# Átfogó validáció futtatása
cd /home/bandi/Documents/code/2025/sp3
.venv/bin/python scripts/comprehensive_validation.py

# Eredmények áttekintése
cat reports/comprehensive_validation_report.json
```

### Havonta (Optional)

```bash
# Teljes adatbázis backup
docker exec sp3-postgres-1 pg_dump -U sp3_user sp3_db > backups/monthly_backup_$(date +%Y%m%d).sql

# Disk space ellenőrzés
df -h
du -sh ml_pipeline/betting_extractor/jsons/processed/
```

## MONITORING METRIKÁK

### Kritikus Küszöbök

- **Health Score**: < 80% → azonnal kivizsgálni
- **Data Coverage**: < 90% → JSON import probléma
- **Valuable Duplicates**: > 10 → duplikátum logika felülvizsgálata
- **Database Errors**: > 0 → schema/query problémák

### Normál Értékek (2025.01.05 baseline)

- JSON meccsek: ~1,276
- DB meccsek: ~1,726 (korábbi importokkal)
- Duplikátumok: ~223
- Értékes duplikátumok: 0
- Data coverage: 94.4%

## HIBAELHÁRÍTÁS

### JSON Import Problémák

```bash
# Backend logs ellenőrzése
docker logs sp3-backend-1 --tail 100

# JSON validáció
.venv/bin/python scripts/compare_json_vs_db.py

# Manuális import teszt
docker exec sp3-backend-1 npm run script:import-json
```

### Database Problémák

```bash
# Database kapcsolat teszt
docker exec sp3-postgres-1 psql -U sp3_user -d sp3_db -c "SELECT COUNT(*) FROM matches;"

# Schema ellenőrzés
docker exec sp3-postgres-1 psql -U sp3_user -d sp3_db -c "\dt"

# Index állapot
docker exec sp3-postgres-1 psql -U sp3_user -d sp3_db -c "SELECT schemaname,tablename,attname,n_distinct,correlation FROM pg_stats WHERE tablename='matches';"
```

### ML Pipeline Problémák

```bash
# PDF processing teszt
cd ml_pipeline/betting_extractor/scripts
.venv/bin/python process_all_pdfs.py

# JSON kimenet ellenőrzés
ls -la ml_pipeline/betting_extractor/jsons/processed/
```

## TELJESÍTMÉNY OPTIMALIZÁLÁS

### Database Tuning

```sql
-- Slow queries analízis
SELECT query, mean_time, calls
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;

-- Index használat
SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read, idx_tup_fetch
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;
```

### Disk Space Management

```bash
# Régi PDF-ek archiválása (6 hónap után)
find ml_pipeline/betting_extractor/pdfs -name "*.pdf" -mtime +180 -exec mv {} archive/ \;

# Log rotáció
find logs/ -name "*.log" -mtime +30 -delete
```

## FEJLESZTÉSI IRÁNYOK

### Rövidtáv (1-2 hét)

1. **JSON Import Javítás**
   - Competition mező null értékek kezelése
   - Time formátum standardizálása
   - Validation hibák debuggolása

2. **Monitoring Dashboard**
   - Grafana dashboard a key metrikákhoz
   - Alert system küszöbértékekhez
   - Email notifications kritikus hibákhoz

### Középtáv (1-2 hónap)

1. **Enhanced Duplicate Handling**
   - Smart merge logic új piacokhoz
   - Versioning system match-ekhez
   - Odds change tracking

2. **Performance Optimization**
   - Database indexing finomhangolása
   - Query optimization
   - Caching layer bevezetése

### Hosszútáv (3-6 hónap)

1. **Machine Learning Integration**
   - Automated data quality scoring
   - Anomaly detection
   - Predictive maintenance

2. **Scalability Improvements**
   - Horizontal scaling capability
   - Load balancing
   - Database sharding

## BACKUP STRATÉGIA

### Napi Backup

```bash
#!/bin/bash
# /home/bandi/Documents/code/2025/sp3/scripts/daily_backup.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/home/bandi/backups/sp3"

# Database backup
docker exec sp3-postgres-1 pg_dump -U sp3_user sp3_db | gzip > "$BACKUP_DIR/db_$DATE.sql.gz"

# JSON files backup
tar -czf "$BACKUP_DIR/jsons_$DATE.tar.gz" ml_pipeline/betting_extractor/jsons/processed/

# Reports backup
tar -czf "$BACKUP_DIR/reports_$DATE.tar.gz" reports/

# Cleanup old backups (keep 30 days)
find "$BACKUP_DIR" -type f -mtime +30 -delete

echo "Backup completed: $DATE"
```

### Restoration

```bash
# Database restore
gunzip -c backups/sp3/db_YYYYMMDD_HHMMSS.sql.gz | docker exec -i sp3-postgres-1 psql -U sp3_user sp3_db

# JSON files restore
tar -xzf backups/sp3/jsons_YYYYMMDD_HHMMSS.tar.gz
```

## CONTACT INFORMATION

- **Maintainer**: Bandi
- **Last Updated**: 2025.01.05
- **Next Review**: 2025.02.05

## EMERGENCY PROCEDURES

### System Down

1. Check Docker containers: `docker ps`
2. Restart services: `docker compose down && docker compose up -d`
3. Check logs: `docker logs sp3-backend-1`
4. Database recovery: Use latest backup if needed

### Data Corruption

1. Stop all imports immediately
2. Create emergency backup
3. Run comprehensive validation
4. Restore from last known good backup
5. Re-run ML pipeline from PDFs

### Performance Issues

1. Check system resources: `htop`, `df -h`
2. Database query analysis: See slow queries section
3. Container resource limits: `docker stats`
4. Scale up resources if needed
