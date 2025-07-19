# 🔍 RENDSZER MONITORING JELENTÉS
**Generálva:** 2025-07-19T17:28:19.517951

## ⚠️ ÖSSZEFOGLALÓ: 3 probléma azonosítva

## 🚨 AZONOSÍTOTT PROBLÉMÁK:
- ⚠️ Sofascore: Nincs legutóbbi aktivitás
- ❌ Merge: 6 duplikált ID
- ❌ Merge: 7 hibás formátumú ID

## 📊 ADATFORRÁSOK STÁTUSZA:
### SOFASCORE
- **Utolsó futás:** 2025-07-18T16:11:26.008255
- **Legutóbbi aktivitás:** ❌
- **Adatfájlok:** 2

### MERGE
- **Kimeneti fájlok:** 5
- **Legutóbbi merge:** merged_matches_2025-07-22.json
- **ID problémák:** Duplikált ID-k: 6, Hibás formátumú ID-k: 7

### FLASHSCORE
- **Országok:** 1
- **Összes meccs:** 105
- **Legutóbbi scrape:** scraped_data/czech-republic/fortuna-liga-2024-2025/2024-2025/fortuna-liga-2024-2025_matches.json

## 💡 JAVASLATOK:
### HIGH - Sofascore
**Probléma:** Nincs legutóbbi aktivitás
**Megoldás:** Ellenőrizd a Sofascore scraper működését
**Parancs:** `cd webscrapper/src/sofascore && python3 scripts/daily_update.py`

### MEDIUM - Merge System
**Probléma:** ID problémák a merge rendszerben
**Megoldás:** Javítsd az ID generálási logikát a merge_json.py-ban
**Parancs:** `cd merge_json_data && python3 merge_json.py --fix-ids`
