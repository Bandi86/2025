# mixlabor-clone

This project is a monorepo containing a frontend and a backend application.

## Frontend

The frontend is a [Next.js](https://nextjs.org/) application.

To run the frontend development server:

```bash
pnpm --filter=frontend dev
```

## Backend

The backend is a [NestJS](https://nestjs.com/) application.

To run the backend development server:

```bash
pnpm --filter=backend start:dev
```

## Both

To run both development servers concurrently:

```bash
pnpm dev
```