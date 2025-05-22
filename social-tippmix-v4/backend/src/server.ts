import { Request, Response, NextFunction } from 'express';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';
import prisma from './lib/client';
import helmet from 'helmet';
import morgan from 'morgan';
import session from 'express-session';
import rateLimit from 'express-rate-limit';
import passport from './lib/passport';
import { ApiError } from './lib/error';
import { requireAuth } from './middlewares/auth';
import asyncHandler from './lib/asyncHandler';
import userRoutes from './routes/user';
import postRoutes from './routes/post';
import commentRoutes from './routes/comment';
import { globalSearch } from './controllers/search';
import uploadPostImage from './controllers/image/postImage';
import getAllCategories from './controllers/categories/getAllCategories';
import likeRoutes from './routes/like';
import statRoutes from './routes/stat';
import testRoutes from './routes/test';

// Környezeti változók betöltése
dotenv.config();

// Logger importálása
import logger, { logHttp } from './lib/logger';
import {
  errorHandler,
  notFoundHandler,
  requestLogger,
  requestTimeoutHandler,
} from './middlewares/error';
import { sanitizeInput } from './middlewares/validation';

const app = express();
const PORT = process.env.PORT || 8080;

// Swagger dokumentáció beállítása
const swaggerOptions = {
  swaggerDefinition: {
    openapi: '3.0.0',
    info: {
      title: 'API dokumentáció',
      version: '1.0.0',
      description: 'Social Tippmix API dokumentáció',
    },
    servers: [
      {
        url: `http://localhost:${PORT}`, // vagy a szerver címe
      },
    ],
  },
  apis: [
    './src/routes/*.ts', // Meglévő route fájlok
    './src/swagger-definitions/*.js', // Új Swagger definíciós fájlok
  ],
};
const swaggerDocs = swaggerJsdoc(swaggerOptions);

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// Köztes rétegek
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000', // Frontend címe környezeti változóból vagy alapértelmezett
    credentials: true, // Engedélyezi a sütik küldését a cross-origin kéréseknél
  })
);

// Helmet a biztonsági fejlécekhez
app.use(helmet());

// Morgan a HTTP kérés naplózáshoz - Winston-t használ
app.use(
  morgan('combined', {
    stream: {
      write: (message: string) => {
        logger.http(message.trim());
      },
    },
  })
);

// Request időzítő middleware
app.use(requestTimeoutHandler(60000)); // 60 másodperc

// Saját kérés naplózás
app.use(requestLogger);

// Express-session beállítása
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'titkoskulcs',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: process.env.SESSION_HTTP_ONLY === 'true',
      sameSite:
        process.env.SESSION_COOKIE_SAMESITE === 'lax' ||
        process.env.SESSION_COOKIE_SAMESITE === 'none' ||
        process.env.SESSION_COOKIE_SAMESITE === 'strict'
          ? (process.env.SESSION_COOKIE_SAMESITE as 'lax' | 'none' | 'strict')
          : 'strict',
      maxAge: process.env.SESSION_COOKIE_MAXAGE
        ? parseInt(process.env.SESSION_COOKIE_MAXAGE, 10)
        : 1000 * 60 * 60 * 24, // 1 nap
    },
  })
);

app.use(passport.initialize());
app.use(passport.session());

// Rate limiter beállítása (pl. 100 kérés 15 perc alatt)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 perc
  max: 100, // maximum 100 kérés
  standardHeaders: true, // RateLimit-* fejlécek
  legacyHeaders: false, // X-RateLimit-* fejlécek
});
app.use(limiter);

app.use((req, res, next) => {
  console.log(`Bejövő kérés: ${req.method} ${req.originalUrl}`);
  next();
});

// Express middleware-ek
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Input sanitizáció
app.use(sanitizeInput());

app.use('/api/user', userRoutes);
app.use('/api/comment', commentRoutes);
app.use('/api/categories', asyncHandler(getAllCategories));
app.use('/api/upload', requireAuth, asyncHandler(uploadPostImage));
app.use('/api/post', postRoutes);
app.use('/api/like', likeRoutes);
app.use('/api/stat', statRoutes);
app.get('/api/post-categories', (req, res) => {
  // Prisma enum értékek visszaadása külön endpointon
  const { PostCategory } = require('@prisma/client');
  res.json({ postCategories: Object.values(PostCategory) });
});

// Egészség-ellenőrzési végpont
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: process.env.npm_package_version || '1.0.0',
  });
});

app.get('/api/search', asyncHandler(globalSearch));

// 404-es hibakezelő a nem létező útvonalakra
app.use(notFoundHandler);

// Általános hibakezelő (mindig a legvégén!)
app.use(errorHandler as express.ErrorRequestHandler);

// Szerver indítása
(async () => {
  app.listen(PORT, async () => {
    logger.info(`Server is running on http://localhost:${PORT}`, {
      port: PORT,
      environment: process.env.NODE_ENV || 'development',
      apiDocs: `http://localhost:${PORT}/api-docs`,
    });

    // Adatbázis kapcsolat ellenőrzése
    try {
      await prisma.$connect();
      logger.info('Database connection established successfully');
    } catch (err) {
      logger.error('Database connection failed', err);
    }
  });
})();
