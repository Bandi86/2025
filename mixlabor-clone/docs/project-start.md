# AI-alapú Sportfogadási Asszisztens Projektterv

## 1. Projekt Célja

Egy olyan webalkalmazás létrehozása, amely a Mixlaborhoz hasonlóan mesterséges intelligencia segítségével elemzi a sporteseményeket (kezdetben fókuszban a labdarúgás), és a felhasználóknak adatvezérelt tippeket, javaslatokat és statisztikai elemzéseket nyújt a fogadásaikhoz. A cél egy könnyen használható, informatív felület, amely segít a felhasználóknak jobb döntéseket hozni.

## 2. Főbb Funkciók

- **Felhasználói Rendszer:** Regisztráció, bejelentkezés, profilkezelés.
- **Dashboard:** A felhasználó személyes felülete, ahol áttekintheti a legfrissebb tippeket, kedvenc ligáit vagy csapatait.
- **Mérkőzés Elemző:** Részletes statisztikák megjelenítése mérkőzések előtt (forma, egymás elleni eredmények, várható gólok, stb.).
- **AI Tippek:** A modell által generált javaslatok a legvalószínűbb kimenetelekre (pl. győztes, gólok száma, szögletek, lapok).
- **"Streak" Figyelő:** Automatizált rendszer, amely figyeli a csapatok és játékosok sorozatait (pl. veretlenségi sorozat, gólszerzési sorozat, több mint 2.5 gól egy mérkőzésen sorozat).
- **Adatvizualizáció:** Grafikonok és diagramok a statisztikák és trendek könnyebb megértéséhez.
- **Kereső és Szűrő:** Mérkőzések, ligák, csapatok egyszerű keresése és szűrése.

## 3. Architektúra és Technológiai Stack

A javasolt stack modern, skálázható és jól karbantartható.

- **Frontend:** **Next.js (TypeScript)**
  - **UI:** [Tailwind CSS](https://tailwindcss.com/) vagy [Material-UI (MUI)](https://mui.com/) a reszponzív és esztétikus felületekért.
  - **State Management:** Zustand vagy a beépített React eszközök (Context, useReducer).
  - **Adatlekérdezés:** SWR vagy React Query (TanStack Query).

- **Backend:** **Nest.js (TypeScript)**
  - **API:** REST vagy GraphQL API a frontend és a backend közötti kommunikációra.
  - **ORM:** **Prisma** a könnyű és biztonságos adatbázis-kezelésért.
  - **Authentikáció:** Passport.js (JWT stratégiával).

- **Adatbázis:** **PostgreSQL**
  - Robusztus, megbízható és jól skálázható relációs adatbázis, amely a Prisma által tökéletesen támogatott.

- **AI/ML Modell:**
  - **Nyelv/Keretrendszer:** **Python** a domináns nyelv az AI/ML területén.
    - **Adatfeldolgozás:** Pandas, NumPy.
    - **Modellezés:**
      - **Kezdeti fázis:** **XGBoost** vagy **LightGBM**. Ezek a modellek kiváló teljesítményt nyújtanak strukturált adatokon (amilyen a sportstatisztika is) és gyorsabbak a neurális hálóknál.
      - **Haladó fázis:** **PyTorch** vagy **TensorFlow** a komplexebb modellekhez, ha szükséges (pl. idősoros elemzések, komplexebb mintázatok felismerése).
  - **Integráció:** A Python modellt egy különálló szolgáltatásként (pl. egy egyszerű Flask/FastAPI szerverrel) lehet futtatni, amelyet a Nest.js backend API-hívásokkal ér el.

- **Adatforrások:**
  - **Kezdeti adatok:** Ingyenes adathalmazok **Kaggle**-ről vagy más sportstatisztikai oldalakról (pl. football-data.co.uk).
  - **Folyamatos adatok:** Érdemes megvizsgálni ingyenes vagy megfizethető sportadat API-kat a naprakész adatokért (pl. The Odds API, API-Football).
  - **Saját adatok:** Kézzel gyűjtött vagy korrigált adatok a modell pontosságának növelésére.

## 4. Fejlesztési Útiterv (Mérföldkövek)

### 1. Fázis: Alapok és Adatgyűjtés (MVP Core)

1. **Projekt Setup:** Monorepo létrehozása (pl. Turborepo vagy Nx) a frontend és backend kód együttes kezelésére.
2. **Backend Alapok:** Nest.js projekt inicializálása, Prisma integrálása, PostgreSQL adatbázis felállítása.
3. **Frontend Alapok:** Next.js projekt inicializálása, UI keretrendszer kiválasztása és beállítása.
4. **Adatbázis Séma:** Az alapvető táblák (Users, Matches, Teams, Leagues) megtervezése a Prisma sémában.
5. **Felhasználói Authentikáció:** Regisztráció és bejelentkezés implementálása.
6. **Adatgyűjtés és -tisztítás:** Az első adathalmazok letöltése és feldolgozásra való előkészítése (Python scriptekkel).

### 2. Fázis: Első Modell és Alapvető Funkciók

1. **Első Prediktív Modell:** Egy egyszerű modell létrehozása (pl. XGBoost), amely a mérkőzés győztesét jósolja meg.
2. **Modell Szolgáltatás:** A Python modell elérhetővé tétele egy egyszerű API-n keresztül (Flask/FastAPI).
3. **Backend Integráció:** A Nest.js backend lekérdezi a tippeket a Python szolgáltatástól.
4. **Frontend Megjelenítés:** A mérkőzések és a hozzájuk tartozó tippek listázása a Next.js felületen.
5. **Streak Figyelő v1:** Alapvető sorozatok figyelése és megjelenítése (pl. csapatok utolsó 5 meccse).

### 3. Fázis: Haladó Funkciók és Finomítás

1. **Haladó Modellek:** Új modellek fejlesztése (szögletek, lapok, gólok száma).
2. **Részletes Elemző Oldal:** Dedikált oldalak létrehozása minden mérkőzéshez, részletes statisztikákkal és vizualizációkkal.
3. **Dashboard Fejlesztése:** Személyre szabható dashboard widgetekkel.
4. **Tesztelés:** Unit és E2E tesztek írása a kritikus funkciókhoz.
5. **Deployment:** Az alkalmazás "élesítése" (pl. Vercel a frontendnek, Heroku/Render/DigitalOcean a backendnek és a modellnek).

## 5. Kockázatok és Kihívások

- **Adatminőség és -elérhetőség:** A megbízható és naprakész (ideális esetben valós idejű) adatok beszerzése a legnagyobb kihívás. Az ingyenes források gyakran hiányosak vagy késnek.
- **Modell Pontossága:** A sportesemények kimenetele rendkívül véletlenszerű. Reális elvárásokat kell támasztani a modell pontosságával szemben. A cél nem a 100%-os találati arány, hanem a pozitív ROI elérése hosszú távon.
- **Jogi Megfontolások:** Tisztázni kell a sportfogadási tanácsadás jogi kereteit. Az oldalon egyértelműen fel kell tüntetni, hogy a tippek nem garantálnak nyereséget, és a felhasználók saját felelősségükre fogadnak.
