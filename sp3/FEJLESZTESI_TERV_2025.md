# 🚀 SP3 Futball Predikciós Rendszer - Fejlesztési Terv 2025

## 📋 Jelenlegi Állapot Értékelése

### ✅ Meglévő Komponensek

#### Backend (NestJS)

- ✅ Alapvető projekt struktúra
- ✅ Docker compose környezet
- ✅ PostgreSQL konfiguráció
- ✅ Mikroszolgáltatás architektúra váz
- ❌ Prisma ORM integráció hiányzik
- ❌ API végpontok nincs implementálva

#### Frontend (Next.js 15)

- ✅ Modern React alapok
- ✅ Tailwind CSS és Shadcn/ui
- ✅ TypeScript konfiguráció
- ❌ Komplex UI komponensek hiányoznak
- ❌ Routing és state management nincs

#### ML Pipeline (Python)

- ✅ Adatfeldolgozás (`data_processor.py`)
- ✅ Modell tanítás (`train_pipeline.py`)
- ✅ Predikciós motor (`predict_pipeline.py`)
- ✅ CLI interface
- ✅ SQLite adatbázis (`unified_football.db`)
- ❌ PostgreSQL integráció hiányzik
- ❌ Real-time pipeline nincs

#### PDF Processing

- ✅ PDF konvertálás (`convertpdf.py`)
- ✅ Labdarúgás.hu extrakció
- ❌ Automatizált pipeline hiányzik

---

## 🎯 Fejlesztési Célkitűzések

### 1. **Komplex Adatbázis Rendszer (Prisma + PostgreSQL)**

- **Meccsek egyedi ID-kkal** → `/meccs/{id}` oldalak
- **Csapatok egyedi profil oldalakkal** → `/csapat/{id}`
- **Bajnokságok/Kupák külön kezelése** → `/bajnoksag/{id}`
- **Történelmi táblázatok és statisztikák**
- **Szezonális adatok** idősor alapján

### 2. **Modern Frontend Fejlesztés**

- **Dashboard** - napi meccsek, predikciók
- **Meccs részletes oldal** - statisztikák, előzmények, head-to-head
- **Csapat profil** - forma, játékosok, történelem
- **Bajnokság táblázatok** - élő és történelmi
- **Admin panel** - manuális adatfelvitel
- **Vizualizációk** - grafikonok, heatmap-ek

### 3. **Backend API Architektúra**

- **REST API** minden frontend komponenshez
- **Real-time WebSocket** élő eredményekhez
- **Cron job-ok** automatikus adatfrissítéshez
- **ML pipeline integráció** predikciókhoz
- **File upload** PDF és CSV-khez

### 4. **Automatizált Data Pipeline**

- **PDF → strukturált adatok** automatikus folyamat
- **API integráció** külső forrásokkal
- **Adatvalidáció és tisztítás**
- **Duplikátum kezelés**
- **Error handling és logging**

---

## 🏗️ Részletes Implementációs Terv

### Fázis 1: Adatbázis Architektúra (2-3 hét)

#### Prisma Schema Kialakítása

```prisma
// Bajnokságok és kupák
model Competition {
  id          String    @id @default(cuid())
  name        String
  country     String
  type        CompetitionType  // LEAGUE, CUP, INTERNATIONAL
  tier        Int       @default(1)
  season      String
  isActive    Boolean   @default(true)

  teams       CompetitionTeam[]
  matches     Match[]
  tables      LeagueTable[]

  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
}

// Csapatok
model Team {
  id            String    @id @default(cuid())
  name          String
  shortName     String?
  alternativeNames Json? // ["Man Utd", "MUFC"]
  city          String?
  country       String
  founded       Int?
  stadium       String?
  isActive      Boolean   @default(true)

  homeMatches   Match[]   @relation("HomeTeam")
  awayMatches   Match[]   @relation("AwayTeam")
  competitions  CompetitionTeam[]
  players       Player[]

  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
}

// Meccsek (történelmi és jövőbeli)
model Match {
  id            String      @id @default(cuid())
  date          DateTime
  homeTeamId    String
  awayTeamId    String
  competitionId String
  round         Int?
  matchday      Int?
  season        String

  // Eredmények (null ha jövőbeli)
  homeScore     Int?
  awayScore     Int?
  status        MatchStatus @default(SCHEDULED)

  // Predikciók
  prediction    Json?      // {homeWin: 0.4, draw: 0.3, awayWin: 0.3}
  confidence    Float?

  // Metadata
  sourceType    DataSource
  sourcePath    String?
  extractionConfidence Float?
  manualVerified Boolean  @default(false)

  homeTeam      Team       @relation("HomeTeam", fields: [homeTeamId], references: [id])
  awayTeam      Team       @relation("AwayTeam", fields: [awayTeamId], references: [id])
  competition   Competition @relation(fields: [competitionId], references: [id])

  createdAt     DateTime   @default(now())
  updatedAt     DateTime   @updatedAt
}

// Liga táblázatok (időpont specifikus)
model LeagueTable {
  id            String      @id @default(cuid())
  competitionId String
  teamId        String
  matchday      Int
  season        String

  position      Int
  points        Int
  played        Int
  won           Int
  drawn         Int
  lost          Int
  goalsFor      Int
  goalsAgainst  Int
  goalDifference Int

  competition   Competition @relation(fields: [competitionId], references: [id])
  team          Team       @relation(fields: [teamId], references: [id])

  createdAt     DateTime   @default(now())

  @@unique([competitionId, teamId, matchday, season])
}

enum CompetitionType {
  LEAGUE
  CUP
  INTERNATIONAL
}

enum MatchStatus {
  SCHEDULED
  LIVE
  FINISHED
  POSTPONED
  CANCELLED
}

enum DataSource {
  PDF_EXTRACTION
  MANUAL_INPUT
  API_IMPORT
  WEB_SCRAPING
}
```

#### Migrációs Stratégia

1. **SQLite → PostgreSQL** átvezetés
2. **Meglévő ML adatok** importálása
3. **PDF extrakciós eredmények** integrálása
4. **Adattisztítás és validáció**

### Fázis 2: Backend API Fejlesztés (3-4 hét)

#### Core API Modulok

```typescript
// src/matches/matches.module.ts
@Module({
  imports: [PrismaModule],
  controllers: [MatchesController],
  providers: [MatchesService, MLProcessorService],
})
export class MatchesModule {}

// API végpontok
GET    /api/matches              // Lista meccsekről (pagination, filter)
GET    /api/matches/{id}         // Egyedi meccs részletei
POST   /api/matches              // Új meccs felvitele (admin)
PUT    /api/matches/{id}         // Meccs frissítése
GET    /api/matches/predictions  // Jövőbeli meccsek predikciókkal

GET    /api/teams                // Csapatok listája
GET    /api/teams/{id}           // Csapat profilja
GET    /api/teams/{id}/matches   // Csapat meccseli (form)
GET    /api/teams/{id}/stats     // Csapat statisztikák

GET    /api/competitions         // Bajnokságok listája
GET    /api/competitions/{id}    // Bajnokság részletei
GET    /api/competitions/{id}/table  // Jelenlegi tabella
GET    /api/competitions/{id}/history // Történelmi táblázatok

POST   /api/upload/pdf          // PDF feltöltés és feldolgozás
POST   /api/upload/csv          // CSV import
GET    /api/admin/dashboard     // Admin statisztikák
```

#### ML Pipeline Integráció

```typescript
// src/ml-processor/ml-processor.service.ts
@Injectable()
export class MLProcessorService {
  async predictMatch(homeTeamId: string, awayTeamId: string): Promise<Prediction> {
    // Python ML pipeline hívás
    const pythonProcess = spawn('python', [
      'ml_pipeline/predict_api.py',
      '--home-team', homeTeamId,
      '--away-team', awayTeamId
    ]);

    return prediction;
  }

  async batchProcessPredictions(): Promise<void> {
    // Minden jövőbeli meccsre predikció
  }
}
```

### Fázis 3: Frontend UI Fejlesztés (4-5 hét)

#### Oldal Struktúra

```
src/app/
├── page.tsx                    // Dashboard
├── meccs/
│   ├── page.tsx                // Meccsek listája
│   └── [id]/
│       └── page.tsx            // Meccs részletes oldal
├── csapat/
│   ├── page.tsx                // Csapatok listája
│   └── [id]/
│       ├── page.tsx            // Csapat profil
│       ├── meccsek/page.tsx    // Csapat meccseli
│       └── statisztikak/page.tsx // Részletes statisztikák
├── bajnoksag/
│   ├── page.tsx                // Bajnokságok listája
│   └── [id]/
│       ├── page.tsx            // Bajnokság főoldal
│       ├── tabella/page.tsx    // Jelenlegi tabella
│       └── tortenelem/page.tsx // Történelmi adatok
└── admin/
    ├── page.tsx                // Admin dashboard
    ├── meccs-felvetel/page.tsx // Új meccs felvitele
    └── pdf-upload/page.tsx     // PDF feltöltés
```

#### Komponens Tervek

**Dashboard (/):**

```typescript
// Mai/közeli meccsek
// Predikciós highlights
// Forma analysis widget
// Gyors csapat/meccs keresés
```

**Meccs részletes oldal (/meccs/[id]):**

```typescript
// Meccs header (csapatok, időpont, eredmény/predikció)
// Head-to-head statisztikák (utolsó 10 találkozó)
// Csapat formák (utolsó 5 meccs)
// Liga kontextus (pozíciók, pontok)
// ML predikció magyarázat
// Hasonló meccsek elemzése
```

**Csapat profil (/csapat/[id]):**

```typescript
// Csapat header (név, logo, basic info)
// Jelenlegi szezon statisztikák
// Forma chart (pont/mérkőzés trend)
// Legutóbbi meccsek eredményeivel
// Következő meccsek predikciókkal
// Történelmi teljesítmény
```

**Bajnokság tabella (/bajnoksag/[id]/tabella):**

```typescript
// Jelenlegi liga tabella
// Interaktív pozíció változások
// Forma trendek
// Következő forduló előzetes
// Play-off/kiesési zóna highlight
```

#### Modern UI Komponensek (Shadcn/ui alapon)

```typescript
// Statisztika kártyák
<StatCard
  title="Hazai forma"
  value="W-W-D-L-W"
  trend="+15%"
  color="green"
/>

// Meccs előnézet kártya
<MatchCard
  homeTeam={team1}
  awayTeam={team2}
  prediction={prediction}
  confidence={85}
  date={matchDate}
/>

// Liga tabella
<LeagueTable
  teams={teams}
  highlightTeam={selectedTeam}
  showForm={true}
  interactive={true}
/>

// Trend chart
<TrendChart
  data={formData}
  type="line"
  period="last10games"
/>
```

### Fázis 4: Admin Panel és Data Management (2-3 hét)

#### Admin Funkciók

**Manuális Adatfelvitel:**

- Meccs eredmények beírása
- Csapat információk szerkesztése
- Liga táblázat kézi korrekció
- Bulk CSV import interface

**PDF Processing Dashboard:**

- PDF feltöltés és státusz követés
- Extrakciós eredmények review
- Hibás adatok korrekciója
- Batch processing indítás

**Rendszer Monitoring:**

- ML pipeline státusz
- Adatbázis integrity ellenőrzések
- Performance metrikák
- Error log viewer

### Fázis 5: Automatizáció és Optimalizáció (3-4 hét)

#### Automatizált Folyamatok

```typescript
// src/automation/automation.service.ts
@Injectable()
export class AutomationService {

  @Cron('0 8 * * *') // Minden nap 8-kor
  async dailyDataProcessing() {
    // PDF feldolgozás
    // API adatok lekérése
    // Predikciók frissítése
    // Adatvalidáció
  }

  @Cron('0 */2 * * *') // 2 óránként
  async updateLivePredictions() {
    // Aktív meccsek predikció frissítése
  }
}
```

#### Performance Optimalizáció

**Backend:**

- Database indexing
- Redis caching
- API response optimization
- Background job queue

**Frontend:**

- Image optimization
- Component lazy loading
- Server-side rendering
- Static generation where possible

---

## 📊 Implementációs Ütemterv

### Hét 1-3: Adatbázis és Backend Alapok

- [ ] Prisma schema finalizálás
- [ ] PostgreSQL migráció
- [ ] Core API végpontok
- [ ] Basic CRUD operations

### Hét 4-7: ML Pipeline Integráció

- [ ] Python-NestJS bridge
- [ ] Predikciós API végpontok
- [ ] Batch processing jobs
- [ ] Admin interface ML részéhez

### Hét 8-12: Frontend Fejlesztés

- [ ] Dashboard és routing
- [ ] Meccs részletes oldalak
- [ ] Csapat profilok
- [ ] Bajnokság táblázatok
- [ ] Admin panel

### Hét 13-15: PDF Pipeline és Automatizáció

- [ ] PDF upload és processing
- [ ] Automated data ingestion
- [ ] Error handling és monitoring
- [ ] Performance optimalizáció

### Hét 16+: Tesztelés és Finomhangolás

- [ ] End-to-end tesztelés
- [ ] UI/UX finomítások
- [ ] Performance monitoring
- [ ] Dokumentáció

---

## 🔧 Technológiai Stack

### Core Technologies

- **Backend**: NestJS + TypeScript
- **Database**: PostgreSQL + Prisma ORM
- **Frontend**: Next.js 15 + React 19
- **Styling**: Tailwind CSS + Shadcn/ui
- **ML Pipeline**: Python + scikit-learn
- **Caching**: Redis
- **Queue**: Bull Queue
- **Monitoring**: Winston + Custom dashboard

### Development Tools

- **Docker**: Helyi fejlesztési környezet
- **ESLint/Prettier**: Code quality
- **Jest**: Testing framework
- **GitHub Actions**: CI/CD (future)

---

## 🎯 Várható Eredmények

### Végfelhasználói Élmény

- **Gyors navigáció** meccsek, csapatok, bajnokságok között
- **Gazdaag vizualizációk** statisztikákkal és trendekkel
- **Intelligens keresés** és szűrési lehetőségek
- **Mobil-optimalizált** responsive design
- **Real-time updates** élő meccsekhez

### Admin Funkciók

- **Könnyű adatkezelés** drag & drop interface-szel
- **Automatizált folyamatok** minimális manuális munkával
- **Hibakezelés és validáció** adatminőség biztosításához
- **Monitoring és analytics** rendszer állapotról

### Technikai Előnyök

- **Skálázható architektúra** jövőbeli fejlesztésekhez
- **Modern tech stack** long-term maintainability-hez
- **Separation of concerns** tiszta kód struktúrával
- **Comprehensive testing** megbízható működéshez

---

## 💡 Jövőbeli Kiterjesztési Lehetőségek

1. **Mobil App** (React Native)
2. **Real-time betting odds** integráció
3. **Social features** (felhasználói predikciók, ranglisták)
4. **Advanced analytics** (deep learning, computer vision)
5. **Multi-sport support** (kosárlabda, tenisz, stb.)
6. **API marketplace** külső fejlesztőknek

---

Ez a terv egy robusztus, modern, és user-friendly sport predikciós platformot eredményez, amely kombinälja a gépi tanulás erejét egy intuitív web interface-szel. A moduláris architektúra lehetővé teszi a fokozatos fejlesztést és a jövőbeli bővítményeket.
