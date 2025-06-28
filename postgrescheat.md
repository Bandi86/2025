---

## 🌱 **1️⃣ PostgreSQL telepítése (ha még nincs)**

Ubuntu/Debian:

```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
```

Ellenőrizd:

```bash
psql --version
```

Pl. `psql (PostgreSQL) 16.x`

---

## 🌱 **2️⃣ PostgreSQL indítása/leállítása**

```bash
sudo systemctl start postgresql
sudo systemctl stop postgresql
sudo systemctl status postgresql
```

💡 Állítsd be, hogy bootnál induljon:

```bash
sudo systemctl enable postgresql
```

---

## 🌱 **3️⃣ Belépés a psql konzolba**

A PostgreSQL alapértelmezett userje: `postgres`

Lépj be:

```bash
sudo -u postgres psql
```

(ha a saját usered alatt van usered az adatbázishoz, akkor: `psql -U sajatuser -d adatbazis`)

Kilépés:

```bash
\q
```

---

## 🌱 **4️⃣ Adatbázis létrehozása**

A psql-ben:

```sql
CREATE DATABASE mydb;
```

vagy shell-ből:

```bash
sudo -u postgres createdb mydb
```

---

## 🌱 **5️⃣ User létrehozása (opcionális)**

```sql
CREATE USER myuser WITH PASSWORD 'mypassword';
GRANT ALL PRIVILEGES ON DATABASE mydb TO myuser;
```

💡 Ha biztonságosabb setupot akarsz, jelezd, segítek finomhangolni.

---

## 🌱 **6️⃣ Táblák létrehozása**

Lépj be az adatbázisba:

```bash
sudo -u postgres psql mydb
```

Példa tábla:

```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## 🌱 **7️⃣ Táblák listázása**

psql-ben:

```sql
\dt
```

Ha konkrét séma:

```sql
\dt public.*
```

---

## 🌱 **8️⃣ Táblák oszlopai**

```sql
\d users
```

(megmutatja a tábla oszlopait, indexeit)

---

## 🌱 **9️⃣ Adatok nézése**

```sql
SELECT * FROM users;
```

---

## 🌱 **10️⃣ Kapcsolódás más programból**

Példa connection string:

```
postgresql://myuser:mypassword@localhost:5432/mydb
```

Ezt tudod használni pl. Prisma, TypeORM, vagy bármely backendben.

---

## ⚡ **Gyors parancs összefoglaló (cheat sheet)**

```bash
sudo -u postgres psql                 # belépés konzolba
sudo -u postgres createdb mydb         # db létrehozás
sudo -u postgres createuser myuser     # user létrehozás
sudo -u postgres psql mydb             # adott db-re belépés
```

psql-ben:

```sql
\l        -- adatbázisok listája
\dt       -- táblák listája
\d tábla  -- tábla szerkezete
\q        -- kilépés
```

---

## 🌟 **Extra tipp: pgAdmin helyett terminálbarát GUI**

Ha szeretnél látványosabb CLI-t:

```bash
sudo apt install pgcli
pgcli -U postgres -d mydb
```

Szép színezés, autocompletion!

---

Összegzés lépések
✅ Ellenőrizd, fut-e a PostgreSQL:

sudo systemctl status postgresql

✅ Listázz adatbázist:

sudo -u postgres psql -l

✅ Hozz létre adatbázist (ha kell):

sudo -u postgres createdb postgres

✅ Lépj be:

sudo -u postgres psql

# role es uj user es db hozzadasa

sudo -u postgres psql

CREATE ROLE bandi WITH LOGIN PASSWORD 'jelszo123';
CREATE DATABASE bandimix_db OWNER bandi;

ha letezik mar
ALTER DATABASE bandimix_db OWNER TO bandi;

jelszavas belepes engedelyezese:

Nyisd meg a pg_hba.conf fájlt:
(A helye általában: /etc/postgresql/<version>/main/pg_hba.conf, pl.)

sudo nano /etc/postgresql/*/main/pg_hba.conf

local   all             postgres                                peer
local    all             postgres                                md5 -re

masik helyen is ird at md5re
ujrainditas
sudo systemctl restart postgresql

psql -U bandi -d dbneve -h localhost
