# 🏟️ Sport Prediction v2.0

Modern PDF-ből Excel-be konvertáló sport adat feldolgozó alkalmazás. Teljesen újraírt, tiszta architektúrával és modern technológiákkal.

## 🚀 Gyors Indítás (Mindkét Szerver)

```bash
cd frontend
npm run dev:both
```

Ez a parancs egyszerre indítja el mindkét szervert:

- **Backend API**: <http://localhost:8000>
- **Frontend**: <http://localhost:3000>

## 📋 Elérhető NPM Scriptek

### Fő Scriptek

- `npm run dev:both` - **Mindkét szerver indítása színes kimenettel** 🌈
- `npm run dev:full` - Mindkét szerver indítása egyszerű kimenettel
- `npm run dev` - Csak frontend (Next.js)
- `npm run dev:frontend` - Csak frontend (alias)
- `npm run dev:backend` - Csak backend (FastAPI/Uvicorn)
- `npm run backend:only` - Csak backend (alias)

### Tesztelő Scriptek

- `npm run test:api` - API gyors teszt (curl + jq)
- `npm run open:api-docs` - API dokumentáció megnyitása böngészőben

## ✨ Főbb Jellemzők

- **🚀 Modern Tech Stack**: FastAPI + Next.js 15 + TypeScript
- **📄 PDF Feldolgozás**: SzerencseMix PDF-ek automatikus elemzése
- **📊 Excel Export**: Strukturált adatok egy kattintással
- **🎨 Modern UI**: shadcn/ui komponensekkel
- **⚡ Gyors**: Optimalizált feldolgozás és megjelenítés
- **🔍 Liga Felismerés**: Intelligens algoritmusokkal

## 🛠️ Technológiai Stack

### Backend

- **FastAPI** - Modern Python API framework
- **SQLAlchemy** - ORM adatbázis kezeléshez
- **PyPDF2** - PDF szöveg kinyerés
- **openpyxl + pandas** - Excel export funkciók
- **SQLite** - Helyi adatbázis

### Frontend

- **Next.js 15** - React framework App Router-rel
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **shadcn/ui** - Modern UI komponensek
- **Lucide React** - Ikonok

## 🚀 Gyors Indítás

### Előfeltételek

- Python 3.11+
- Node.js 18+
- npm

### 1. Projekt klónozása

```bash
git clone <repo-url>
cd sp2
```

### 2. Backend indítása

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Linux/Mac
# vagy: venv\\Scripts\\activate  # Windows
pip install -r requirements.txt
python main.py
```

### 3. Frontend indítása

```bash
cd frontend
npm install
npm run dev
```

### 4. Alkalmazás elérése

- Frontend: <http://localhost:3000>
- Backend API: <http://localhost:8000>
- API dokumentáció: <http://localhost:8000/docs>

## 📱 Használat

1. **PDF Feltöltés**: Válasszon ki egy SzerencseMix PDF fájlt
2. **Feldolgozás**: Kattintson a "Feldolgozás" gombra
3. **Eredmények**: Nézze meg a kinyert meccsek listáját
4. **Export**: Töltse le Excel formátumban

## 🏗️ Projekt Struktúra

```
sp2/
├── backend/              # FastAPI Backend
│   ├── app/
│   │   ├── api/         # API endpoints
│   │   ├── services/    # Üzleti logika
│   │   ├── models/      # Database modellek
│   │   └── core/        # Konfiguráció
│   ├── requirements.txt
│   └── main.py
│
├── frontend/            # Next.js Frontend
│   ├── src/
│   │   ├── app/        # App Router
│   │   ├── components/ # UI komponensek
│   │   └── lib/        # Utilities
│   └── package.json
│
└── PROJECT_PLAN.md     # Részletes projekt terv
```

## 🔧 Fejlesztés

### Backend fejlesztési környezet

```bash
cd backend
source venv/bin/activate
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend fejlesztési környezet

```bash
cd frontend
npm run dev
```

## 📊 API Endpointok

- `POST /api/upload-pdf` - PDF feltöltés és feldolgozás
- `POST /api/export-excel` - Excel export generálás
- `GET /api/matches` - Meccsek listázása
- `GET /docs` - Interactive API dokumentáció

## 🎯 Jövőbeli Fejlesztések

### Fázis 2

- [ ] PostgreSQL adatbázis migráció
- [ ] Fejlett filtering és keresés
- [ ] Batch PDF feldolgozás
- [ ] Liga táblázatok kinyerése

### Fázis 3

- [ ] Predikciós algoritmusok
- [ ] Real-time adatok integráció
- [ ] Analytics dashboard
- [ ] Mobile app

## 🐛 Hibakeresés

### Gyakori problémák

**PDF feldolgozás hibák:**

- Ellenőrizze, hogy a fájl valóban PDF-e
- Próbáljon kisebb fájlmérettel

**CORS hibák:**

- Győződjön meg róla, hogy a backend fut a 8000-es porton
- Ellenőrizze a CORS beállításokat

**Dependencies hibák:**

```bash
# Backend
pip install -r requirements.txt --upgrade

# Frontend
npm install
npm audit fix
```

## 📝 Változásnapló

### v2.0.0 (2025-06-29)

- ✅ Teljes újraírás clean architektúrával
- ✅ Modern UI shadcn/ui-val
- ✅ FastAPI backend
- ✅ Excel export funkció
- ✅ Liga felismerés javítása

## 🤝 Közreműködés

1. Fork-olja a projektet
2. Készítsen feature branch-et (`git checkout -b feature/UjFunkció`)
3. Commit-olja a változásokat (`git commit -am 'Új funkció hozzáadása'`)
4. Push-olja a branch-et (`git push origin feature/UjFunkció`)
5. Nyisson Pull Request-et

## 📄 Licenc

Ez a projekt MIT licenc alatt áll. Lásd a [LICENSE](LICENSE) fájlt a részletekért.

## 👨‍💻 Készítők

- Fejlesztés: GitHub Copilot asszisztenciával
- Design: shadcn/ui komponens könyvtár
- PDF Processing: PyPDF2 könyvtár

---

⭐ Ha tetszik a projekt, adjon neki egy csillagot! ⭐
