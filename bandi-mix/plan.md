# Sportfogadási Tipp Oldal – Fejlesztési Terv

## 1. Projekt alapok

- Next.js (legújabb verzió, App Router, TypeScript)
- Verziókezelés (Git)
- Alapértelmezett mappa- és fájlstruktúra kialakítása

## 2. Felhasználói felület (UI/UX)

- Modern, letisztult design (pl. Tailwind CSS vagy shadcn/ui)
- Reszponzív kialakítás (mobil, tablet, desktop)
- Főoldal: napi ingyenes tipp kiemelve, rövid bemutatkozás
- Tipp lista oldal: összes tipp listázása (ingyenes + előfizetéses)
- Tipp részletező oldal: adott tipp részletes leírása
- Regisztráció / Bejelentkezés oldal
- Előfizetés vásárlás oldal (pl. Stripe integráció)
- Saját profil oldal (előfizetés kezelése, saját tippek)

## 3. Funkcionalitás

- Felhasználói regisztráció, bejelentkezés, jelszókezelés
- Jogosultságkezelés: ingyenes tipp mindenki számára, többi csak előfizetőknek
- Tipp feltöltése admin felületen (markdown vagy rich text)
- Tipp megjelenítése (markdown renderelés)
- Előfizetés kezelése (Stripe vagy más fizetési szolgáltató)
- E-mail értesítések (pl. új tipp, előfizetés lejárata)
- Kommentelési lehetőség a tippek alatt, megosztás
- Előző napi tippek összefoglalója

## 4. Backend / Adatbázis

- SQLite adatbázis (felhasználók, tippek, előfizetések)
- API végpontok (Next.js API routes vagy route handlers)
- Felhasználókezelés (auth, session)
- Tipp CRUD műveletek (admin jogosultsággal)
- Előfizetés státusz ellenőrzése

## 5. Adminisztrációs felület

- Tipp feltöltése, szerkesztése, törlése
- Felhasználók és előfizetések kezelése

## 6. Biztonság

- Jelszavak biztonságos tárolása (bcrypt)
- Session/cookie kezelés
- Jogosultságok ellenőrzése minden végponton

## 7. Tesztelés

- Egységtesztek (Jest, Testing Library)
- Felhasználói tesztek (Cypress vagy Playwright)

## 8. Deployment

- Vercel vagy más felhő szolgáltató
- Környezeti változók kezelése (.env)

## 9. Dokumentáció

- README.md: projekt leírása, telepítés, használat
- Felhasználói útmutató
