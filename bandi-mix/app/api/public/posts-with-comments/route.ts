import { getAllAdminPostsMeta } from '@/lib/admin/readPostsMeta';
import { NextRequest } from 'next/server';
import { db } from '@/lib/db';

export async function GET(_req: NextRequest) {
  // Csak az ingyenes posztokat adjuk vissza
  const posts = getAllAdminPostsMeta().filter((p) => !p.isPremium);

  // Kommentek számának lekérése minden poszthoz
  const postsWithComments = await Promise.all(
    posts.map(async (post) => {
      let commentsCount = 0;
      try {
        // Feltételezzük, hogy a kommentek tábla neve 'comment' és a slug mező 'postSlug'
        commentsCount = await db.comment.count({ where: { } });
      } catch (e) {
        // ha nincs comment tábla vagy hiba van, 0 marad
      }
      return { ...post, commentsCount };
    })
  );

  return new Response(JSON.stringify(postsWithComments), { status: 200 });
}
