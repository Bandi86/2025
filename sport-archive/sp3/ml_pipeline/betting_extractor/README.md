# Betting Extractor - Projekt Struktúra

## Fő Fájlok

- `extract_matches.py` - Fő extraction script meccsek feldolgozásához
- `pdf_to_lines.py` - PDF fájlok szöveggé konvertálása

## Mappák

### 📁 `debug/`

Debug és hibaelhárító scriptek:

- `debug_*.py` fájlok különböző részfeladatok debugolásához

### 📁 `tests/`

Test fájlok és tesztelési segédanyagok:

- `test_*.txt` - Teszt input fájlok
- `test_*.json` - Teszt output fájlok

### 📁 `scripts/`

Segéd scriptek és automatizálási eszközök:

- `auto_watcher.py` - Automatikus fájl figyelő
- `batch_process.py` - Batch feldolgozási script
- `check_duplicates.py` - Duplikátum ellenőrző
- `group_markets.py` - Piacok csoportosítása
- `process_*.py` - PDF feldolgozási scriptek
- `*.sh` - Shell scriptek
- `*.service` - Systemd service fájlok

### 📁 `docs/`

Dokumentáció és README fájlok:

- `*.md` fájlok projektdokumentációval

### 📁 `inputs/`

#### 📁 `pdfs/`

Input PDF fájlok

#### 📁 `txts/`

PDF-ből konvertált szöveges fájlok

#### 📁 `jsons/`

**Végső JSON kimenetek** - Itt találhatóak a feldolgozott meccsadatok JSON formátumban.

- Minden PDF fájlhoz egy JSON fájl készül
- Formátum: `{PDF_név}_lines.json`
- **Ez a mappa tartalmazza a végső adatokat, amelyeket az API használ**

### 📁 `outputs/`

**Egyéb kimenetek** - Egyéb típusú kimeneteknek (nem JSON)

#### 📁 `outputs/archive/`

Régi output fájlok archívuma

### 📁 `logs/`

Log fájlok és hibanapló

#### 📁 `logs/archive/`

Régi log fájlok archívuma

### 📁 `archive/`

Egyéb archivált fájlok

### 📁 `__pycache__/`

Python cache fájlok (automatikusan generált)

## Használat

### Alap használat

```bash
python extract_matches.py input.txt output.json
```

### PDF feldolgozás

```bash
python pdf_to_lines.py input.pdf output.txt
```

### Batch feldolgozás

```bash
python scripts/batch_process.py
```

## Státusz

✅ Hajnali meccsek bug javítva
✅ Frontend refaktorálva
✅ Docker környezet működik
✅ Projekt rendrakás kész
