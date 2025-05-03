import { NextRequest } from 'next/server';
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { db } from '@/lib/db';
import { adminAuth } from '@/lib/middleware/adminAuth';

const POSTS_DIR = path.join(process.cwd(), 'content/admin-posts');

export async function GET(req: Request, { params }: { params: { slug: string } }) {
  const user = await adminAuth(req as NextRequest);
  if (user instanceof Response) return user;

  const slug = params.slug;
  const filePath = path.join(POSTS_DIR, `${slug}.mdx`);
  if (!fs.existsSync(filePath)) {
    return new Response(JSON.stringify({ error: 'MDX file not found' }), { status: 404 });
  }
  const raw = fs.readFileSync(filePath, 'utf8');
  const { data, content } = matter(raw);

  // Opcionálisan: lekérheted az adatbázisból is a metaadatokat
   const dbPost = await db.adminPosts.findUnique({ where: { slug } });

  return new Response(
    JSON.stringify({
      slug,
      title: data.title || '',
      isPremium: !!data.isPremium,
      deadline: data.deadline || '',
      imageurl: data.imageurl,
      tippmixPicture: data.tippmixPicture,
      content,
    }),
    { status: 200 }
  );
}

// PATCH
export async function PATCH(req: NextRequest, { params }: { params: { slug: string } }) {
  const user = await adminAuth(req);
  if (user instanceof Response) return user;

  const slug = params.slug;
  const body = await req.json();
  const { content, meta } = body; // meta: {title, isPremium, deadline, ...}

  const filePath = path.join(POSTS_DIR, `${slug}.mdx`);
  if (!fs.existsSync(filePath)) {
    return new Response(JSON.stringify({ error: 'MDX file not found' }), { status: 404 });
  }

  // Frissítjük az MDX file-t (frontmatter + content)
  const newRaw = matter.stringify(content, meta);
  fs.writeFileSync(filePath, newRaw, 'utf8');

  // Szinkronizáljuk az adatbázist is
  await db.adminPosts.upsert({
    where: { slug },
    update: {
      title: meta.title || '',
      isPremium: !!meta.isPremium,
      deadline: meta.deadline || '',
      imageurl: meta.imageurl,
      tippmixPicture: meta.tippmixPicture,
    },
    create: {
      slug,
      title: meta.title || '',
      isPremium: !!meta.isPremium,
      deadline: meta.deadline || '',
      imageurl: meta.imageurl,
      tippmixPicture: meta.tippmixPicture,
      content,
    },
  });

  return new Response(JSON.stringify({ success: true }), { status: 200 });
}
