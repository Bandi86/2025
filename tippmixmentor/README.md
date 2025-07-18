# BettingMentor - AI-alapú sportfogadási rendszer

## 🎯 Projekt áttekintés

A BettingMentor egy modern, AI-alapú sportfogadási rendszer, amely több adatforrásból tanul és automatizált módon segít értékes fogadási lehetőségeket találni.

## 🏗️ Architektúra

### Szolgáltatások
- **Frontend**: Next.js 15 + TypeScript + Tailwind CSS
- **Backend**: NestJS + Prisma ORM + TypeScript
- **Adatbázis**: PostgreSQL 16
- **Cache**: Redis 7
- **Admin**: pgAdmin 4
- **AI Modulok**: Python-alapú ML pipeline
- **Scraping**: Web scraper és PDF converter

### Portok
- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:3001`
- PostgreSQL: `localhost:55432`
- Redis: `localhost:6379`
- pgAdmin: `http://localhost:5050`

## 🚀 Gyors indítás

### Előfeltételek
- Docker és Docker Compose telepítve
- Git telepítve

### 1. Projekt klónozása
```bash
git clone <repository-url>
cd tippmixmentor
```

### 2. Szolgáltatások indítása
```bash
# Egyszerű indítás
./dev-setup.sh start

# Vagy manuálisan
docker-compose up --build -d
```

### 3. Adatbázis inicializálása
```bash
# Prisma migrációk futtatása
./dev-setup.sh setup-db

# Vagy manuálisan
docker-compose exec backend pnpm prisma migrate dev --name init
docker-compose exec backend pnpm prisma generate
```

### 4. Ellenőrzés
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- pgAdmin: http://localhost:5050 (használd a környezeti változókban beállított hitelesítő adatokat)

## 🛠️ Fejlesztői parancsok

### Dev script használata
```bash
./dev-setup.sh start      # Szolgáltatások indítása
./dev-setup.sh setup-db   # Adatbázis inicializálása
./dev-setup.sh logs       # Logok megtekintése
./dev-setup.sh stop       # Szolgáltatások leállítása
./dev-setup.sh restart    # Újraindítás
./dev-setup.sh cleanup    # Teljes tisztítás
```

### Docker parancsok
```bash
# Szolgáltatások állapota
docker-compose ps

# Logok megtekintése
docker-compose logs -f [service-name]

# Konténerbe belépés
docker-compose exec backend sh
docker-compose exec frontend sh

# Adatbázis kapcsolat tesztelése
docker-compose exec postgres psql -U <felhasználónév> -d <adatbázis>
```

### Backend fejlesztés
```bash
# Prisma parancsok
docker-compose exec backend pnpm prisma studio
docker-compose exec backend pnpm prisma migrate dev
docker-compose exec backend pnpm prisma generate

# Tesztek futtatása
docker-compose exec backend pnpm test
docker-compose exec backend pnpm test:e2e
```

### Frontend fejlesztés
```bash
# Fejlesztői szerver (hot reload)
docker-compose exec frontend npm run dev

# Build tesztelése
docker-compose exec frontend npm run build
```

## 📁 Projekt struktúra

```
tippmixmentor/
├── backend/                 # NestJS backend
│   ├── src/                # Forráskód
│   ├── prisma/             # Adatbázis schema és migrációk
│   ├── Dockerfile          # Multi-stage Docker build
│   └── package.json        # Dependencies
├── frontend/               # Next.js frontend
│   ├── app/                # App Router
│   ├── public/             # Statikus fájlok
│   ├── Dockerfile          # Multi-stage Docker build
│   └── package.json        # Dependencies
├── pdfconverter/           # PDF → JSON converter
├── webscrapper/            # Web scraping modulok
├── betmentors/             # AI modellek és botok
├── docs/                   # Dokumentáció
├── docker-compose.yml      # Szolgáltatások definíciója
└── dev-setup.sh           # Fejlesztői script
```

## 🔧 Konfigurációk

### Környezeti változók

**Backend (.env)**
```env
DATABASE_URL="postgresql://<felhasználónév>:<jelszó>@postgres:5432/<adatbázis>?schema=public"
REDIS_HOST=redis
REDIS_PORT=6379
```

**Frontend**
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### Adatbázis kapcsolat
- **Host**: localhost (külső) / postgres (konténer)
- **Port**: 55432 (külső) / 5432 (belső)
- **User**: <felhasználónév>
- **Password**: <jelszó>
- **Database**: <adatbázis>

## 🧪 Tesztelés

### Szolgáltatások tesztelése
```bash
# Backend API health check
curl http://localhost:3001/health

# Frontend elérhetőség
curl http://localhost:3000

# Redis kapcsolat
docker-compose exec redis redis-cli ping

# PostgreSQL kapcsolat
docker-compose exec postgres pg_isready -U <felhasználónév>
```

### Adatbázis tesztelése
```bash
# pgAdmin-on keresztül
# http://localhost:5050

# Vagy CLI-ből
docker-compose exec postgres psql -U <felhasználónév> -d <adatbázis> -c "SELECT version();"
```

## 🐛 Hibaelhárítás

### Gyakori problémák

**Port foglalt hiba**
```bash
# Portok ellenőrzése
lsof -i :3000
lsof -i :3001
lsof -i :55432

# Szolgáltatások leállítása
./dev-setup.sh stop
```

**Adatbázis kapcsolat hiba**
```bash
# Postgres újraindítása
docker-compose restart postgres

# Kapcsolat tesztelése
docker-compose exec postgres pg_isready -U <felhasználónév>
```

**Node modules problémák**
```bash
# Volumes tisztítása
docker-compose down -v
docker-compose up --build
```

**Prisma problémák**
```bash
# Schema újragenerálása
docker-compose exec backend pnpm prisma generate
docker-compose exec backend pnpm prisma db push
```

### Logok ellenőrzése
```bash
# Összes szolgáltatás
docker-compose logs -f

# Specifikus szolgáltatás
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f postgres
```

## 📈 Következő lépések

1. **Backend API fejlesztés**
   - REST endpointok implementálása
   - Autentikáció és authorizáció
   - Swagger dokumentáció

2. **Frontend UI fejlesztés**
   - shadcn/ui komponensek
   - Responsive design
   - State management

3. **AI modulok integráció**
   - Python modellek API-n keresztül
   - Predikciós pipeline
   - Bot logika implementáció

4. **Adatgyűjtés**
   - Web scraping automatizálás
   - PDF processing pipeline
   - Adatvalidáció és tisztítás

## 🤝 Közreműködés

1. Fork a repository-t
2. Hozz létre egy feature branch-et
3. Commitold a változásokat
4. Push-old a branch-et
5. Nyiss egy Pull Request-et

## 📄 Licenc

Ez a projekt [MIT License](LICENSE) alatt áll.