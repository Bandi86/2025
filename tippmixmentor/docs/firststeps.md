# BettingMentor – AI-alapú sportfogadási rendszer

## 🎯 Projekt célja

A BettingMentor célja egy modern, AI-alapú sportfogadási rendszer kiépítése, amely hasonlóan működik, mint a [mixlabor.hu](https://www.mixlabor.hu), de nyílt, moduláris és saját fejlesztésű megközelítéssel. A rendszer több adatforrásból tanul, saját predikciós modelleket használ, és automatizált módon segít a felhasználóknak értékes fogadási lehetőségeket találni.

---

## 🧠 Inspiráció – Mi az a Mixlabor és miért követendő példa?

A mixlabor egy fejlett sportfogadási AI rendszer, amely:
- Több mint **5 millió adatpontot** dolgoz fel,
- **XGBoost** és **deep learning** modelleket kombinál,
- Hetente **újra tanulja** az adatokat,
- **Automatizált minőség-ellenőrzést (QC)** végez,
- Akár **300 ms alatt** képes tippeket generálni,
- API-integrációval csatlakozik külső rendszerekhez,
- **Önfejlesztő tréninget** futtat élő adatok alapján.

---

## 🧱 Rendszer architektúra

A projekt több különálló, de együttműködő modulból épül fel:

### 1. Frontend
- **Technológia**: Next.js (legfrissebb verzió)
- **UI könyvtár**: shadcn/ui
- **Feladat**:
  - Megjeleníti a napi kínálatot és korábbi eseményeket,
  - Vizualizálja a botok predikcióit.

### 2. Backend
- **Technológia**: NestJS (legfrissebb), Prisma ORM
- **Adatbázis**: PostgreSQL
- **Gyorsítótár és pub/sub**: Redis
- **Architektúra**: mikroservice alapú, API Gateway-en keresztül

### 3. BettingMentor AI modul
- **Nyelv**: Python
- **Modellek**: XGBoost + deep learning ensemble modellek
- **Funkciók**:
  - Tanulási pipeline: történelmi adatfeldolgozás
  - Botok specializálása (pl. döntetlen, gólt lő mindkét csapat, kombinációk, szögletek, sárgalapok)

### 4. PDF Converter modul
- **Feladat**: PDF fájlok konvertálása szöveggé, majd JSON formátumba,
- **Technológia**: Python
- **Output**: PostgreSQL-be menthető JSON struktúra

### 5. Web Search modul
- **Feladat**: Aktuális hírek, sérülések, lineup-ok keresése a neten
- **Technológia**: Python + webkereső interfész (pl. Google vagy DuckDuckGo scraping)

### 6. Data Scraping modul
- **Cél**: Adatok gyűjtése sportoldalakról, például Flashscore, Wikipedia stb.
- **Modulok**:
  - `flashscoreScraper`: bajnokságok adatainak lekérése JSON/CSV formában
  - `dailyScraper`: az aktuális napi meccsek és kínálat reggeli riportja
  - További scraper-ek: lineup, statisztikák, időjárás stb.

---

## ⚙️ Fő célok és funkciók

### 1. Web Scraping
- Több forrásból (Flashscore, Wikipedia, stb.)
- JSON/CSV output
- Automatizált futtatás időzítve (pl. reggelente)

### 2. PDF → Text → JSON konverzió
- PDF fájlok automatikus feldolgozása
- Mentés PostgreSQL adatbázisba

### 3. Adat-összefésülés
- A scrappelt és konvertált JSON fájlok egységesítése
- Teljes, struktúrált adatcsomag előállítása meccsekkel és oddsokkal

### 4. Model tanítás (BettingMentor)
- Történelmi adatgyűjtés és tanítás
- Különféle botok:
  - Kombinációs tippek
  - Döntetlen-kereső
  - Mindkét csapat gólt lő
  - Szöglet- és sárgalap-fókusz

### 5. Frontend megjelenítés
- Napi ajánlatok, korábbi eredmények
- Tippek vizualizálása, különféle szűrési lehetőségek

### 6. Backend mikroservice API
- REST/GraphQL endpointok
- Redis-alapú pub/sub
- Docker-kompatibilitás, skálázhatóság

---

## 🐳 Docker és Deployment

A teljes rendszer **Dockerrel** konténerizáltan működik. Az egyes komponensek (frontend, backend, AI modulok, scraper-ek) külön konténerként futnak, Docker Compose segítségével könnyen indíthatók.

---

## 📈 További lehetőségek

- CI/CD pipeline létrehozása GitHub Actions-szel
- Admin dashboard fejlesztése bot teljesítmények nyomon követésére
- Mobil app támogatás (React Native)
- Telegram / Discord bot integráció

---

## 📅 Fejlesztési fázisok (javasolt roadmap)

1. ✅ Webscraping és adatmentés
2. ✅ PDF konverzió
3. 🔜 Adatösszefűzés és DB schema finomítás
4. 🔜 AI modellek tréningje és bot logika
5. 🔜 Frontend UI fejlesztés
6. 🔜 API gateway és microservice kapcsolat

---

## 📌 Összefoglalás

A BettingMentor célja egy olyan intelligens, önfejlesztő sportfogadási rendszer létrehozása, amely:
- Valós adatokon alapul,
- Modern AI eszközöket használ,
- Átlátható és bővíthető architektúrával rendelkezik,
- Felhasználói és fejlesztői szempontból is skálázható.

---