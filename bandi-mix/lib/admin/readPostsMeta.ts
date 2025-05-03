import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { db } from '@/lib/db';

const POSTS_DIR = path.join(process.cwd(), 'content/admin-posts');

export interface AdminPostMeta {
  slug: string;
  title: string;
  content: string;
  isPremium: boolean;
  deadline: string;
  imageurl?: string;
  tippmixPicture?: string;
  createdAt?: string;
  updatedAt?: string;
}

export function getAllAdminPostsMeta(): AdminPostMeta[] {
  try {
    const files = fs.readdirSync(POSTS_DIR).filter((f) => f.endsWith('.mdx'));
    return files.map((filename) => {
      const filePath = path.join(POSTS_DIR, filename);
      const raw = fs.readFileSync(filePath, 'utf8');
      const { data, content } = matter(raw);
      // Fájl stat lekérése a létrehozás/frissítés dátumhoz
      const stat = fs.statSync(filePath);
      // Szinkronizáljuk az adatbázist az MDX slug alapján
      const slug = data.slug || filename.replace(/\.mdx$/, '');
      // Ellenőrizzük, hogy van-e ilyen slug az adatbázisban, ha nincs, létrehozzuk
      db.adminPosts
        .upsert({
          where: { slug },
          update: {
            title: data.title || '',
            isPremium: !!data.isPremium,
            deadline: data.deadline || '',
            imageurl: data.imageurl,
            tippmixPicture: data.tippmixPicture,
          },
          create: {
            slug,
            title: data.title || '',
            isPremium: !!data.isPremium,
            deadline: data.deadline || '',
            imageurl: data.imageurl,
            tippmixPicture: data.tippmixPicture,
          },
        })
        .catch(() => {}); // hibát lenyeljük, hogy ne akadjon meg a beolvasás
      return {
        slug,
        title: data.title || '',
        isPremium: !!data.isPremium,
        deadline: data.deadline || '',
        imageurl: data.imageurl,
        tippmixPicture: data.tippmixPicture,
        content,
        createdAt: stat.birthtime.toISOString(),
        updatedAt: stat.mtime.toISOString(),
      };
    });
  } catch (err) {
    console.error('Admin post meta read error:', err);
    return [];
  }
}
