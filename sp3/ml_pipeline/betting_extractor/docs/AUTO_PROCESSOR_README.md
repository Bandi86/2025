# PDF Auto-Processor 🤖

Automatikus PDF feldolgozó rendszer, amely figyeli a `pdfs/` mappát és automatikusan feldolgozza az új PDF fájlokat.

## 🚀 Gyors indítás

### 1. Kézi tesztelés

```bash
# Watcher indítása előtérben (teszteléshez)
./manage_auto_processor.sh test
```

### 2. Systemd service telepítése (ajánlott)

```bash
# Service telepítése
./manage_auto_processor.sh install

# Service indítása
./manage_auto_processor.sh start

# Állapot ellenőrzése
./manage_auto_processor.sh status
```

## 📋 Kezelő parancsok

```bash
./manage_auto_processor.sh install    # Service telepítése
./manage_auto_processor.sh start      # Service indítása
./manage_auto_processor.sh stop       # Service leállítása
./manage_auto_processor.sh status     # Service állapota
./manage_auto_processor.sh logs       # Logok megtekintése (élő)
./manage_auto_processor.sh remove     # Service eltávolítása
./manage_auto_processor.sh test       # Kézi tesztelés előtérben
```

## 🔧 Működés

1. **Figyelt mappa**: `pdfs/`
2. **Trigger események**:
   - Új PDF fájl létrehozása
   - PDF fájl áthelyezése/átnevezése
3. **Automatikus folyamat**:

   ```
   PDF észlelése → 2s várakozás → process_all_pdfs.py futtatása → Eredmény
   ```

## 📊 Kimenet

A watcher automatikusan:

- ✅ Feldolgozza az új PDF fájlokat
- 📄 Létrehozza a TXT fájlokat (`txts/` mappa)
- 📋 Létrehozza a JSON fájlokat (`jsons/` mappa)
- 🔄 Kihagyja a már feldolgozott fájlokat (okos mód)

## 🎯 Használat

### Service módban (ajánlott)

```bash
# Telepítés és indítás
./manage_auto_processor.sh install
./manage_auto_processor.sh start

# PDF fájl másolása → automatikus feldolgozás
cp your_file.pdf pdfs/
# A watcher automatikusan feldolgozza!

# Logok figyelése
./manage_auto_processor.sh logs
```

### Kézi módban (teszteléshez)

```bash
# Terminal 1: Watcher indítása
./manage_auto_processor.sh test

# Terminal 2: PDF fájl hozzáadása
cp your_file.pdf pdfs/
# A watcher automatikusan reagál!
```

## 🛡️ Biztonság

- **Dupla feldolgozás védelem**: Egyszerre csak egy feldolgozás futhat
- **2s várakozás**: Biztosítja hogy a PDF fájl teljesen másolódott
- **Hiba tolerancia**: Hibák esetén folytatja a figyelést
- **Logolás**: Minden esemény naplózva van

## 📝 Logok

### Service logok

```bash
# Élő logok figyelése
./manage_auto_processor.sh logs

# Régebbi logok
sudo journalctl -u pdf-auto-processor --since "1 hour ago"
```

### Kézi mód logok

A kézi módban a logok közvetlenül a terminálra íródnak.

## 🔍 Hibaelhárítás

### Service nem indul el

```bash
# Állapot ellenőrzése
sudo systemctl status pdf-auto-processor

# Részletes hiba
sudo journalctl -u pdf-auto-processor -n 50
```

### Watcher nem reagál

1. Ellenőrizd hogy a `pdfs/` mappa létezik
2. Tesztelj kézi módban: `./manage_auto_processor.sh test`
3. Ellenőrizd a fájl jogosultságokat

### Feldolgozási hibák

```bash
# Kézi feldolgozás tesztelése
python3 process_all_pdfs.py --force

# Logok ellenőrzése
./manage_auto_processor.sh logs
```

## ⚡ Teljesítmény

- **Memóriahasználat**: ~10-20MB
- **CPU használat**: Minimális (csak eseménykor aktív)
- **Válaszidő**: 2-3 másodperc az új PDF észlelésétől

## 🎉 Példa workflow

```bash
# 1. Service telepítése és indítása
./manage_auto_processor.sh install
./manage_auto_processor.sh start

# 2. PDF fájlok hozzáadása
cp Web__53sz__K__07-08.pdf pdfs/
cp Web__54sz__P__07-11.pdf pdfs/

# 3. Automatikus feldolgozás (logok figyelése)
./manage_auto_processor.sh logs

# 4. Eredmény ellenőrzése
ls -la txts/
ls -la jsons/
```

A rendszer automatikusan feldolgozza mindkét PDF-et és létrehozza a megfelelő TXT és JSON fájlokat!
