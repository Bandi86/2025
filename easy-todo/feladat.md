Példa feladat: "Teendőlista alkalmazás"
Feladat leírása:
Készíts egy egyszerű teendőlista (to-do list) alkalmazást, amely lehetővé teszi a felhasználók számára, hogy teendőket hozzanak létre, szerkesszenek, töröljenek, és megjelölhessék őket késznek. A teendőknek legyen egy címe, leírása és státusza (pl. "kész" vagy "folyamatban").

Követelmények:
Frontend:
Használj HTML, CSS és JavaScript-et (opcionálisan valamilyen keretrendszert, pl. React vagy Vue.js, ha ismered).
Legyen egy egyszerű, reszponzív felület, ahol a felhasználó:
Láthatja a teendők listáját.
Hozzáadhat új teendőt egy űrlap segítségével.
Törölhet vagy szerkeszthet meglévő teendőt.
Megjelölheti a teendőt késznek (pl. egy checkbox-szal).
A dizájn legyen letisztult és könnyen használható.
Backend:
Készíts egy egyszerű szervert (pl. Node.js + Express, vagy bármilyen más nyelvet/keretrendszert, amit ismersz, pl. Python Flask, PHP).
API végpontok:
GET /todos: Visszaadja az összes teendőt.
POST /todos: Új teendő létrehozása.
PUT /todos/:id: Meglévő teendő szerkesztése.
DELETE /todos/:id: Teendő törlése.
A szerver JSON formátumban kommunikáljon a frontenddel.
Adatbázis:
Tárold a teendőket egy adatbázisban (pl. SQLite vagy MongoDB, de akár egy JSON fájl is elfogadható egyszerűbb megoldásként).
A teendőnek legyenek ezek a mezői: id, title, description, status (pl. "pending" vagy "completed"), createdAt (létrehozás dátuma).
Extrák (opcionális):
Adj hozzá felhasználói autentikációt (pl. bejelentkezés/regisztráció), hogy csak a saját teendőidet lásd.
Szűrési lehetőség a teendőkre (pl. csak a kész vagy folyamatban lévő feladatok mutatása).
Deployold az alkalmazást egy ingyenes platformra (pl. Render, Vercel, Netlify).
Technológiai stack javaslat:
Frontend: HTML/CSS/JavaScript vagy React
Backend: Node.js + Express
Adatbázis: SQLite (könnyű beállítani) vagy MongoDB
Stílus: Bootstrap vagy Tailwind CSS az egyszerűbb dizájnért
Példa teendő objektum:
json

Collapse

Wrap

Copy
{
  "id": 1,
  "title": "Bevásárlás",
  "description": "Tejet, kenyeret és tojást venni",
  "status": "pending",
  "createdAt": "2025-03-08T10:00:00Z"
}
Értékelési szempontok (ha állásinterjúra készülsz):
A kód olvashatósága és struktúrája.
Hibakezelés (pl. üres űrlap beküldése).
Alapvető REST API ismeret.
Egyszerű, de működőképes UI/UX.
Hogyan kezdj neki?
Kezdj a frontenddel: készíts egy statikus oldalt, ahol megjeleníted a teendőket (akár hardcoded adatokkal).
Építsd fel a backendet: hozz létre API-t, ami kezeli a teendőket.
Kapcsold össze az adatbázist a backenddel.
Integráld a frontenddel az API-t (pl. fetch vagy axios használatával).
Teszteld az alkalmazást, és javítsd az esetleges hibákat.
Ha szeretnéd, tudok részletesebb útmutatót adni egy-egy részhez (pl. kódpéldákkal), vagy segíthetek, ha elakadsz! Mit gondolsz, nekiállnál ennek?