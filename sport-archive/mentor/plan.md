## Bet Mentor - Részletes Terv

### **Projekt Célja**
Egy olyan webalkalmazás létrehozása, amely historikus sportmérkőzések adatainak elemzése alapján gépi tanulási modellek segítségével tippeket és valószínűségi előrejelzéseket ad jövőbeli mérkőzések kimenetelére. Az alkalmazás célja, hogy segítse a felhasználókat a tájékozottabb sportfogadási döntések meghozatalában.

---

### **1. Architektúra és Adatfolyam**

Az alkalmazás négy fő részből áll, amelyek a következőképpen kommunikálnak egymással:

1.  **Adatgyűjtő réteg (`scrapping`, `pdf`):**
    *   **Feladat:** Külső forrásokból (weboldalak, PDF dokumentumok) sportadatok (mérkőzések, eredmények, statisztikák) automatizált gyűjtése.
    *   **Technológia:** Python (Scrapy, BeautifulSoup, PyMuPDF).
    *   **Kimenet:** Nyers, strukturálatlan vagy félig strukturált adatok.

2.  **Adatfeldolgozó és Predikciós Motor (`mentor`):**
    *   **Feladat:** A nyers adatok tisztítása, transzformálása és strukturált formában való elmentése az adatbázisba. Ezt követően a tiszta adatokon gépi tanulási modelleket tanít be, majd új előrejelzéseket generál a közelgő mérkőzésekre.
    *   **Technológia:** Python (Pandas, Scikit-learn, NumPy).
    *   **Adatfolyam:**
        *   Beolvassa a `scrapping` és `pdf` által gyűjtött adatokat.
        *   Tisztítja, normalizálja az adatokat.
        *   A tiszta adatokat elmenti az `SQLite` adatbázisba.
        *   Betölti a historikus adatokat az adatbázisból a modell tanításához.
        *   Elmenti az új predikciókat az adatbázisba.
    *   **Futtatás:** Időzítetten (pl. naponta cron jobbal) lefutó scriptek.

3.  **Backend API (`backend`):**
    *   **Feladat:** Egy REST API szolgáltatás, amely kiszolgálja a frontendet a feldolgozott és adatbázisban tárolt adatokkal (pl. mérkőzések listája, egy adott mérkőzés adatai, predikciók). Kezeli a felhasználói logikát (a jövőben).
    *   **Technológia:** Node.js, Express, TypeScript, SQLite3 (a Python scriptek által feltöltött adatbázist olvassa).
    *   **Kommunikáció:** A frontend kéréseket küld az API-nak, ami adatbázis-lekérdezésekkel válaszol.

4.  **Frontend (`frontend`):**
    *   **Feladat:** A felhasználói felület megjelenítése, ahol a felhasználók böngészhetik a mérkőzéseket, megtekinthetik a hozzájuk tartozó tippeket és statisztikákat.
    *   **Technológia:** Next.js, React, TypeScript.
    *   **Kommunikáció:** A Backend API-tól kapott adatok megjelenítése.

---

### **2. Komponensek Részletezése**

#### **Adatbázis (SQLite)**
*   **Táblák:**
    *   `Teams`: `id`, `name`, `country`, `league`
    *   `Matches`: `id`, `match_date`, `home_team_id`, `away_team_id`, `home_score`, `away_score`, `status` (lejátszott, jövőbeli)
    *   `MatchStats`: `id`, `match_id`, `stat_name` (pl. labdabirtoklás, kapuralövés), `home_value`, `away_value`
    *   `Predictions`: `id`, `match_id`, `model_version`, `predicted_outcome` (pl. '1', 'X', '2'), `probability`, `created_at`

#### **Backend (Express API)**
*   **API Végpontok (Endpoints):**
    *   `GET /api/matches`: Visszaadja a jövőbeli mérkőzéseket a hozzájuk tartozó predikciókkal. Szűrési lehetőségek (dátum, liga).
    *   `GET /api/matches/:id`: Egy konkrét mérkőzés részletes adatai.
    *   `GET /api/matches/history`: Lejátszott mérkőzések listája az eredményekkel.
    *   `GET /api/stats/teams/:id`: Egy csapat historikus statisztikái.

#### **Frontend (Next.js)**
*   **Oldalak (Pages):**
    *   **Főoldal / Dashboard:** A legfrissebb, kiemelt predikciók megjelenítése.
    *   **Mérkőzések:** Böngészhető és szűrhető lista a közelgő mérkőzésekről.
    *   **Mérkőzés Részletek:** Egy adott meccs minden adata, statisztikája és a hozzá tartozó tippek.
    *   **Statisztikák:** Korábbi predikciók sikerességi rátája, modellek teljesítménye.

---

### **3. Fejlesztési Ütemterv (Roadmap)**

1.  **Fázis 1: Adatgyűjtés és Feldolgozás**
    *   [ ] Adatbázis séma véglegesítése és létrehozása.
    *   [ ] Web scraper scriptek megírása 1-2 megbízható forráshoz.
    *   [ ] (Opcionális) PDF feldolgozó script elkészítése.
    *   [ ] Adattisztító és adatbázisba töltő Python script megírása.

2.  **Fázis 2: Predikciós Modell**
    *   [ ] Egyszerű, alap statisztikai modell létrehozása (pl. Poisson-eloszlás alapú).
    *   [ ] A modell tanítását és predikciók generálását végző script elkészítése.
    *   [ ] A teljes adatfeldolgozási folyamat (`scrapping` -> `cleaning` -> `prediction`) automatizálása.

3.  **Fázis 3: Backend API**
    *   [ ] Express projekt inicializálása, alapvető beállítások.
    *   [ ] Adatbázis kapcsolat létrehozása.
    *   [ ] A szükséges API végpontok implementálása (kezdetben csak olvasási műveletek).

4.  **Fázis 4: Frontend**
    *   [ ] Next.js projekt inicializálása.
    *   [ ] Komponens könyvtár (pl. Shadcn/UI, MUI) kiválasztása és beállítása.
    *   [ ] A főbb oldalak (Mérkőzések listája, Részletek) felépítése dummy adatokkal.
    *   [ ] Frontend összekötése a Backend API-val.

5.  **Fázis 5: Integráció és Tesztelés**
    *   [ ] End-to-end tesztelés: az adatgyűjtéstől a frontend-en való megjelenésig.
    *   [ ] A predikciós modell finomhangolása, pontosságának értékelése.
    *   [ ] Hibajavítás, felhasználói visszajelzések alapján történő fejlesztések.
