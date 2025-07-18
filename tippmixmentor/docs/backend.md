# ORM és adatbázis
pnpm add @nestjs/config @nestjs/serve-static @nestjs/passport @nestjs/jwt
pnpm add @prisma/client
pnpm add pg
pnpm add class-validator class-transformer
pnpm add bcrypt
pnpm add ioredis
pnpm add passport passport-jwt
pnpm add uuid

# Dev dependency
pnpm add -D prisma ts-node @types/bcrypt @types/passport-jwt

backend/
│
├── src/
│   ├── main.ts
│   ├── app.module.ts
│   ├── config/                # környezeti változók kezelése
│   ├── modules/
│   │   ├── auth/              # bejelentkezés, regisztráció
│   │   ├── users/             # felhasználói adatok
│   │   ├── matches/           # meccsek és események
│   │   ├── tips/              # bot predikciók
│   │   ├── aggregator/        # különböző adatok összefésülése
│   │   └── ...
│   ├── redis/                 # redis publikus/subs modul
│   └── database/
│       ├── prisma.service.ts
│       └── schema.prisma
│
├── prisma/
│   └── migrations/
├── .env
├── Dockerfile
├── docker-compose.yml
└── README.md

DATABASE_URL="postgresql://postgres:postgres@db:5432/tippster"
JWT_SECRET="supersecretkey"
REDIS_HOST="redis"
REDIS_PORT=6379
PORT=3000


 Auth modul (JWT + bcrypt)
Funkciók:

Regisztráció

Bejelentkezés

Token frissítés

Jogosultság middleware

@Injectable()
export class AuthService {
  async validateUser(email: string, pass: string): Promise<any> {
    const user = await this.userService.findByEmail(email);
    if (user && await bcrypt.compare(pass, user.password)) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  async login(user: any) {
    const payload = { username: user.email, sub: user.id };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }
}

Meccsek és adatok kezelése
matches/: meccsek, események, oddsok

tips/: bot predikciók és AI ajánlások

model Match {
  id        String   @id @default(uuid())
  homeTeam  String
  awayTeam  String
  date      DateTime
  odds      Json
  tips      Tip[]
}

model Tip {
  id        String   @id @default(uuid())
  matchId   String
  match     Match    @relation(fields: [matchId], references: [id])
  botName   String
  prediction String
  probability Float
  createdAt DateTime @default(now())
}

Redis – Queue vagy Pub/Sub
Pl. background task queue (tip generálás async)

Események real-time küldése más szolgáltatásoknak (pl. új meccs)

const redis = new Redis({
  host: process.env.REDIS_HOST,
  port: Number(process.env.REDIS_PORT),
});


Dockerfile & docker-compose

**Backend Dockerfile (Multi-stage):**
```dockerfile
FROM node:20-alpine AS base
RUN npm install -g pnpm

FROM base AS development
WORKDIR /usr/src/app
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm prisma generate
EXPOSE 3001
CMD ["pnpm", "run", "start:dev"]
```

**Docker Compose Setup:**
```yaml
services:
  backend:
    build:
      context: ./backend
      target: development
    container_name: betting_mentor_backend
    environment:
      - DATABASE_URL=postgresql://sp3_user:sp3_password@postgres:5432/sp3_db?schema=public
      - REDIS_HOST=redis
      - REDIS_PORT=6379
    ports:
      - "3001:3001"
    depends_on:
      - postgres
      - redis

  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: sp3_user
      POSTGRES_PASSWORD: sp3_password
      POSTGRES_DB: sp3_db
    ports:
      - "55432:5432"

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
```

Alap parancsok
# Prisma inicializálás
npx prisma init

# Prisma migráció
npx prisma migrate dev --name init

# Prisma generálás
npx prisma generate

# Fejlesztői szerver
pnpm start:dev


Tervek a jövőre
GraphQL opció REST mellett

Rate limiter Redis-szel

WebSocket élő frissítésekhez

Bot API: minden bot külön microservice (Docker container)

