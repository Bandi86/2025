
---

## 🎯 **Cél: Sportfogadási tippek weboldal prémium tartalommal**

* Nyilvános blog jellegű posztok
* Regisztráció / bejelentkezés
* Prémium tartalom fizetős előfizetőknek
* Mobilbarát, gyors oldal
* Egyszerű admin felület a posztokhoz

---

## 🏗 **Architektúra áttekintés**

### Frontend:

* **Next.js 15 App Router**
* **TailwindCSS + shadcn/ui**
* **TypeScript**
* Auth: JWT vagy session cookie (NextAuth, Clerk, stb.)

### Backend:

* **NestJS microservice alapon**
* **PostgreSQL** adatbázis (Prisma ORM)
* **Redis** cache + session store
* **Stripe (vagy SimplePay)** a fizetésekhez
* **RabbitMQ vagy Redis pub/sub** az aszinkron műveletekhez (pl. email küldés, statisztikák)

### Infrastruktúra:

* Docker Compose fejlesztéshez
* Később bővíthető Kubernetes-re / felhőbe
* CI/CD (GitHub Actions / GitLab CI)

---

## 💡 **Mikroszolgáltatások javaslat**

Kezdésként **ne bonyolítsd túl**, de legyen előkészítve skálázásra:
1️⃣ **User service**

* regisztráció / login
* auth token / session kezelés
* előfizetés státusz

2️⃣ **Post service**

* nyilvános + prémium poszt CRUD
* kategóriák / címkék (opcionális)

3️⃣ **Payment service**

* Stripe integráció
* előfizetés kezelés
* webhook-ok feldolgozása

4️⃣ **Notification service (később)**

* email / push értesítések

---

## 🚀 **Lépésenkénti indulás**

### 1️⃣ **Monorepo setup**

* Használj Nx, TurboRepo vagy simán `apps/frontend`, `apps/backend`
* Struktúra:

  ```
  apps/
    frontend (Next.js 15)
    backend (NestJS)
  packages/
    (közös lib-ek, pl. types, ui komponensek)
  docker/
    docker-compose.yml
  ```

### 2️⃣ **Adatbázis modell**

Prisma segítségével tervezd meg:

```prisma
model User {
  id        String   @id @default(uuid())
  email     String   @unique
  password  String
  role      String   // "FREE" | "PREMIUM"
  createdAt DateTime @default(now())
}

model Post {
  id          String   @id @default(uuid())
  title       String
  content     String
  isPremium   Boolean  @default(false)
  createdAt   DateTime @default(now())
  authorId    String
  author      User     @relation(fields: [authorId], references: [id])
}
```

Stripe webhook-al frissítsd a role-t.

---

### 3️⃣ **Next.js frontend**

* Nyilvános oldal: blog feed + poszt oldalak
* Auth oldalak: login, regisztráció
* Protected route: prémium posztok (middleware + API hívás backendre)
* Dashboard (admin, ha akarsz)

---

### 4️⃣ **NestJS backend**

* Auth microservice: JWT / session cookie kiadás
* Post microservice: CRUD
* Payment microservice: Stripe webhook és előfizetés státusz frissítés
* Használj `@nestjs/microservices` RabbitMQ adaptert vagy Redis pubsubot a kommunikációra (akár egyszerű sima REST-el indulhatsz és később bontod szét)

---

### 5️⃣ **Docker + local dev**

Írj egy `docker-compose.yml`-t:

```yaml
services:
  db:
    image: postgres:16
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: tippster
    ports:
      - "5432:5432"
  redis:
    image: redis:7
    ports:
      - "6379:6379"
  rabbitmq:
    image: rabbitmq:3-management
    ports:
      - "5672:5672"
      - "15672:15672"
```

Frontend + backend futtatható lokálisan, ne Dockerbe tedd őket fejlesztés alatt.

---

## ⚡ **Biztonsági alapok**

✅ **Password hashing** → bcrypt / argon2
✅ **CSRF védelem** → Next.js API + session cookie / SameSite cookie
✅ **Rate limiting** → API-n, pl. NestJS interceptorral
✅ **Stripe webhook hitelesítés**
✅ **Middleware prémium ellenőrzés Next.js-ben**

---

## 🌱 **Fejlesztési sorrend**

1️⃣ Monorepo + Docker környezet
2️⃣ Prisma adatmodell + alap backend auth + post CRUD
3️⃣ Next.js frontend váz → feed + poszt oldal
4️⃣ Auth flow + fizetés flow
5️⃣ Prémium tartalom védelem
6️⃣ Admin CRUD UI (ha kell)

---

## 💬 **Ha akarod, segíthetek ezekben**

* docker-compose inicial fájl
* Prisma séma megírása
* Next.js védett route middleware
* NestJS microservice alap sablon
* Stripe flow mockolása lokálban

---

