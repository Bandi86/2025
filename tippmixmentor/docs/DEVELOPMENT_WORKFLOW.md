# BettingMentor Development Workflow

Ez a dokumentum leírja a BettingMentor projekt fejlesztői workflow-ját és az automatizált folyamatokat.

## 🚀 Gyors Kezdés Fejlesztőknek

### Első Indítás
```bash
# Teljes fejlesztői környezet beállítása
./dev-setup.sh dev
```

Ez a parancs:
1. ✅ Elindítja a Docker szolgáltatásokat
2. ✅ Futtatja az összes scrapper-t
3. ✅ Összefésüli az adatokat
4. ✅ Szinkronizálja az adatbázisba
5. ✅ Futtatja a monitoring ellenőrzést
6. ✅ Megmutatja a rendszer állapotát

### Napi Fejlesztői Workflow

```bash
# Adatok frissítése (reggel/este)
./dev-setup.sh sync

# Rendszer állapot ellenőrzése
./dev-setup.sh status

# Szolgáltatások újraindítása
./dev-setup.sh restart
```

## 📊 Adatforrások és Scrapper-ek

### 1. TippmixPro Scrapper
- **Mit csinál**: Jövőbeli meccsek adatait gyűjti odds információkkal
- **Mikor fut**: Minden nap reggel 6:00-kor (automatikusan)
- **Manuális futtatás**: `python3 webscrapper/src/tippmixpro/tippmixpro.py`
- **Kimenet**: `webscrapper/src/tippmixpro/data/tippmix_matches_YYYYMMDD.json`

### 2. Results Scrapper
- **Mit csinál**: Befejezett meccsek eredményeit gyűjti
- **Mikor fut**: Minden nap este 22:00-kor (automatikusan)
- **Manuális futtatás**: `python3 webscrapper/src/results_scrapper/tippmix_results_scraper.py`
- **Kimenet**: `webscrapper/src/results_scrapper/data/tippmix_results_YYYY-MM-DD.json`

### 3. Merge Rendszer
- **Mit csinál**: Összefésüli a különböző forrásokból származó adatokat
- **Mikor fut**: Minden scrapper futás után automatikusan
- **Manuális futtatás**: `python3 merge_json_data/merge_json.py`
- **Kimenet**: `merge_json_data/merged_data/merged_matches_*.json`

## 🔄 Automatizált Folyamatok

### Cron Job-ok Beállítása
```bash
# Automatikus cron job-ok telepítése
./setup_cron.sh
```

### Ütemezett Feladatok
- **06:00** - Reggeli adatgyűjtés (TippmixPro + merge)
- **22:00** - Esti eredménygyűjtés (Results + merge)
- **2 óránként (8-20)** - Rendszer monitoring
- **4 óránként** - Adatbázis szinkronizálás
- **Vasárnap 03:00** - Heti takarítás (régi log fájlok törlése)

## 📈 Monitoring és Jelentések

### Monitoring Script
```bash
# Rendszer állapot ellenőrzése
python3 monitoring/monitor_data_pipeline.py
```

### Jelentések Helye
- **Legfrissebb jelentés**: `monitoring/reports/latest_report.md`
- **Összes jelentés**: `monitoring/reports/monitoring_report_*.md`
- **JSON formátum**: `monitoring/reports/monitoring_report_*.json`

### Log Fájlok
- **Cron job-ok**: `logs/cron_*.log`
- **Scrapper-ek**: `webscrapper/src/*/logs/`
- **Merge folyamat**: `merge_json_data/merger.log`
- **Monitoring**: `monitoring/logs/`

## 🐳 Docker Szolgáltatások

### Szolgáltatások Listája
- **Backend** (NestJS): `http://localhost:3001`
- **Frontend** (Next.js): `http://localhost:3000`
- **PostgreSQL**: `localhost:55432`
- **Redis**: `localhost:6379`
- **pgAdmin**: `http://localhost:5050`

### Hasznos Parancsok
```bash
# Szolgáltatások indítása
./dev-setup.sh start

# Szolgáltatások leállítása
./dev-setup.sh stop

# Log-ok megtekintése
./dev-setup.sh logs

# Teljes takarítás
./dev-setup.sh cleanup
```

## 🔧 Fejlesztői Eszközök

### API Végpontok
- **Adatbázis statisztikák**: `GET http://localhost:3001/data-ingestion/stats`
- **Adatok betöltése**: `POST http://localhost:3001/data-ingestion/ingest-all`
- **Egyes fájl betöltése**: `POST http://localhost:3001/data-ingestion/ingest-file`

### Adatbázis Hozzáférés
```bash
# pgAdmin: http://localhost:5050
# Email: admin@bettingmentor.com
# Password: admin123

# Közvetlen PostgreSQL kapcsolat:
# Host: localhost
# Port: 55432
# Database: sp3_db
# Username: sp3_user
# Password: sp3_password
```

## 🚨 Hibaelhárítás

### Gyakori Problémák

1. **"Module not found" hiba**
   ```bash
   # Virtuális környezet aktiválása
   source .venv/bin/activate
   
   # Függőségek telepítése
   ./fix_venv.sh
   ```

2. **Docker szolgáltatások nem indulnak**
   ```bash
   # Docker újraindítása
   sudo systemctl restart docker
   
   # Szolgáltatások tiszta újraindítása
   ./dev-setup.sh cleanup
   ./dev-setup.sh start
   ```

3. **Adatbázis kapcsolat hiba**
   ```bash
   # Adatbázis inicializálása
   ./dev-setup.sh setup-db
   ```

4. **Scrapper hibák**
   ```bash
   # Chrome driver telepítése (Ubuntu/Debian)
   sudo apt-get update
   sudo apt-get install chromium-browser chromium-chromedriver
   
   # Selenium függőségek
   pip install selenium beautifulsoup4
   ```

### Log Fájlok Ellenőrzése
```bash
# Legfrissebb hibák keresése
grep -r "ERROR" logs/
grep -r "FAILED" logs/

# Scrapper log-ok
tail -f webscrapper/src/tippmixpro/logs/scraper.log
tail -f webscrapper/src/results_scrapper/logs/scraper.log
```

## 🔮 Jövőbeli Fejlesztések

### Tervezett Scrapper-ek
- **Játékos adatok scrapper** - Játékos statisztikák és információk
- **Részletes meccs adatok scrapper** - Mélyebb meccs elemzések
- **Odds történet scrapper** - Odds változások követése
- **Élő meccs scrapper** - Valós idejű meccs adatok

### Fejlesztési Irányok
- **Machine Learning modellek** - Predikciós algoritmusok
- **API bővítések** - További végpontok
- **Frontend fejlesztés** - Felhasználói felület
- **Teljesítmény optimalizálás** - Gyorsabb adatfeldolgozás

## 📞 Támogatás

Ha problémába ütközöl:
1. Ellenőrizd a log fájlokat
2. Futtasd a monitoring scriptet: `python3 monitoring/monitor_data_pipeline.py`
3. Ellenőrizd a rendszer állapotát: `./dev-setup.sh status`
4. Nézd meg a legfrissebb monitoring jelentést: `monitoring/reports/latest_report.md`