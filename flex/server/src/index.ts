import { Request, Response, NextFunction } from 'express';
import * as express from 'express';
import * as cors from 'cors';
import * as dotenv from 'dotenv';
import * as bodyParser from 'body-parser';
import { initDatabase } from './db/database';
import mediaRoutes from './routes/mediaRoutes';
import scanRoutes from './routes/scanRoutes';
import streamRoutes from './routes/streamRoutes';
import dirsRoutes from './routes/dirsRoutes';
import { startWatchers } from './watcher/mediaWatcher';

// Környezeti változók betöltése
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Köztes rétegek
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Főoldal
app.get('/', (_req: Request, res: Response) => {
  res.send('Flex Server is running!');
});

// API végpontok
app.use('/api', mediaRoutes);
app.use('/api', scanRoutes);
app.use('/api', streamRoutes);
app.use('/api', dirsRoutes);

// 404-es hiba kezelése (opcionális)
app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Általános hiba kezelő (mindig a legvégén!)
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error' });
});

// Szerver indítása
(async () => {
  await initDatabase();
  await startWatchers()
  app.listen(port, () => {
    console.log(`Szerver fut a http://localhost:${port} címen`);
  });
})();
