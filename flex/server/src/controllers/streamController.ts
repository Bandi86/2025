import { Request, Response, RequestHandler } from 'express';
import { getAllMediaItems } from '../db/mediaRepository';
import * as fs from 'fs';
import * as mime from 'mime-types';

export const streamHandler: RequestHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const items = await getAllMediaItems();
    const media = items.find((item) => String(item.id) === String(id));

    if (!media) {
      res.status(404).json({ error: 'Nincs ilyen média.' });
      return;
    }

    const filePath = media.path;

    const stat = await fs.promises.stat(filePath);
    const fileSize = stat.size;
    const range = req.headers.range;

    const mimeType = mime.lookup(filePath) || 'application/octet-stream';

    if (!range) {
      res.writeHead(200, {
        'Content-Length': fileSize,
        'Content-Type': mimeType,
      });
      const stream = fs.createReadStream(filePath);
      stream.on('error', (err) => {
        console.error('Stream error:', err);
        res.sendStatus(500);
      });
      stream.pipe(res);
      return;
    }

    const parts = range.replace(/bytes=/, '').split('-');
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

    if (isNaN(start) || isNaN(end) || start > end || end >= fileSize) {
      res.status(416).send('Érvénytelen range fejléc.');
      return;
    }

    const chunkSize = end - start + 1;
    const stream = fs.createReadStream(filePath, { start, end });

    res.writeHead(206, {
      'Content-Range': `bytes ${start}-${end}/${fileSize}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunkSize,
      'Content-Type': mimeType,
    });

    stream.on('error', (err) => {
      console.error('Stream error:', err);
      res.sendStatus(500);
    });

    stream.pipe(res);
  } catch (err) {
    console.error('Hiba a streamHandler-ben:', err);
    res.sendStatus(500);
  }
}
