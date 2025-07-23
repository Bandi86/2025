 Terv: Flashscore Scraper v2 (Playwright & LLM)

  Cél: Egy robusztus, intelligens és a korábbinál megbízhatóbban működő scraper fejlesztése, amely hatékonyan kezeli a dinamikusan betöltődő tartalmakat ("load more"
  gomb) és ellenállóbb a weboldal szerkezeti változásaival szemben.

  ---

  1. Fázis: Alapozás és Struktúra Kialakítása

  Ebben a fázisban létrehozzuk az új projekt alapjait, anélkül, hogy a régi kódot módosítanánk.

   1. Új Mappa Létrehozása:
       * Létrehozok egy v2 nevű mappát a webscrapper/automated-flashscore-scraper/ könyvtáron belül.
   2. Projekt Inicializálása:
       * A v2 mappában inicializálok egy új Node.js projektet (package.json létrehozása).
   3. Függőségek Telepítése:
       * Telepítem a szükséges alapvető csomagokat:
           * playwright: A böngésző automatizáláshoz.
           * fs-extra: A fájlrendszer műveletekhez (a régi projekthez hasonlóan).
           * inquirer: Az interaktív parancssori menükhöz.
   4. Könyvtárstruktúra Felállítása:
       * Kialakítom a v2 mappán belül a forráskód (src), a lementett adatok (data) és a logok (logs) helyét.

  ---

  2. Fázis: A Scraper Magjának Fejlesztése Playwright-tal

  Ez a legkritikusabb rész, ahol a "load more" problémát orvosoljuk.

   1. Böngésző Kezelő:
       * Létrehozok egy modult (src/browser.js), ami felelős a Playwright böngésző indításáért és bezárásáért.
   2. Navigáció és Adatgyűjtés:
       * Megírom a scraper alap logikáját (src/scraper.js).
       * "Load More" Kezelése: Implementálok egy ciklust, ami addig kattint a "Show more matches" gombra, amíg az létezik és új meccsek töltődnek be. A ciklus minden
         kattintás után ellenőrzi, hogy a meccsek száma a DOM-ban növekedett-e. Ez biztosítja, hogy az összes mérkőzést betöltsük.
       * Adatok Kinyerése: Miután az összes meccs betöltődött, a Playwright segítségével kinyerem az összes meccs azonosítóját (match ID) az oldalról.

  ---

  3. Fázis: Adatfeldolgozás és Tárolás

  A kinyert adatok feldolgozása és mentése.

   1. Részletes Adatok Lekérése:
       * A 2. fázis-ban összegyűjtött meccs ID-k alapján, egyenként lekérdezem minden meccs részletes adatait (statisztikák, információk), a régi scraper getMatchData
         funkciójához hasonlóan, de már Playwright-ot használva.
   2. Adatok Mentése:
       * A begyűjtött adatokat a már ismert data/{country}/{league}/{season}.json struktúrában mentem el.

  ---

  4. Fázis (Opcionális, de javasolt): Intelligens Funkciók - LLM Integráció

  Itt tesszük a scrapert "okosabbá" és ellenállóbbá.

   1. Dinamikus Selector Keresés:
       * Ahelyett, hogy a CSS selectorok (pl. .event__match--static) fixen lennének a kódban, egy LLM segítségével dinamikusan azonosíthatjuk őket.
       * Folyamat:
           1. A scraper letölti az oldal HTML szerkezetét.
           2. Ezt a HTML-t elküldi a lokális qwen3:8b modellnek egy specifikus prompt-tal (pl. "Elemezd ezt a HTML-t és add vissza a mérkőzéseket tartalmazó elemek CSS
              selectorát.").
           3. A scraper a modelltől kapott selectort használja az adatok kinyeréséhez.
       * Előny: Ha a Flashscore megváltoztatja az oldal felépítését, a scraper nagyobb eséllyel fog továbbra is működni, mert nem egy fix selectorra támaszkodik.
   2. LLM Adapter Létrehozása:
       * Készítek egy src/llm-adapter.js modult, ami a qwen3:8b modellel való kommunikációt kezeli az Ollama API-n keresztül.

  ---

  5. Fázis: Parancssori Interfész (CLI) és Felhasználói Interakció

  A felhasználói élmény javítása, a régi cli.js funkcióinak újraimplementálása.

   1. Interaktív Választó:
       * Az inquirer csomag segítségével újra megírom az interaktív menüt, ahol a felhasználó kiválaszthatja az országot, bajnokságot és szezont.
   2. Parancsok Implementálása:
       * Létrehozom a start, select, discover stb. parancsokat, ahogy a régi scraperben is működött.
