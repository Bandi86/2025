### TODO list
- [ ] **Kommentek moderálása**: Admin funkciók bővítése
- [ ] **Kommentek paginációja**: Ha sok komment van, érdemes lehet lapozást vagy végtelen görgetést hozzáadni.
- [ ] **Kommentek fejlettebb státuszai**: Jelentés (report), válasz (threaded comments)
- [ ] **Like/Dislike a kommentekre**

### 1. Komment moderáció/admin funkciók bővítése
- **Komment szerkesztés**: Admin tudja szerkeszteni a komment tartalmát.
- **Komment rejtése/megjelölése**: Pl. “hidden” flag, moderációs státusz.
- **Felhasználó tiltása**: Egy gombbal az adott komment szerzőjét letilthatod.

### 2. Kommentek paginációja
- Ha sok komment van, érdemes lehet lapozást vagy végtelen görgetést hozzáadni.

### 3. Kommentek fejlettebb státuszai
- **Jelentés (report)**: Felhasználók jelenthetik a kommenteket, admin látja a jelentéseket.
- **Válasz (threaded comments)**: Kommentekre lehet válaszolni (fésűsített/threaded rendszer).

### 4. Like/Dislike a kommentekre
- Hozzáadhatsz like/dislike funkciót a kommentekhez is.

### 5. Admin statisztikák, dashboard
- Hány komment, hány törölt, hány rejtett, stb.
- Aktív felhasználók, legtöbbet kommentelők.

### 6. Frontend UX fejlesztések
- **Jobb loading/error állapotok**.
- **Animációk** a komment hozzáadásához/törléséhez.
- **Rich text** kommentekhez (markdown, linkek, emoji).

### 7. Jogosultságok finomítása
- Csak admin vagy szerző törölhet/szerkeszthet.
- Moderátor szerepkör.

### 8. API bővítés
- REST endpointok a fenti funkciókhoz.
- Swagger/OpenAPI dokumentáció.

---

**Javaslat**:
Ha admin funkciókat szeretnél bővíteni, a komment szerkesztés vagy rejtés a leggyakoribb következő lépés.
Ha inkább UX-et fejlesztenél, akkor a pagináció vagy a loading state-ek javítása lehet jó választás.


