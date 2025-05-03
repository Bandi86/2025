import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { adminAuth } from '@/lib/middleware/adminAuth';

export async function GET(req: NextRequest, { params }: { params: { slug: string } }) {
  const user = await adminAuth(req);
  if (user instanceof Response) return user;
  // Az MDX slug alapján keresd meg az adatbázisban a postot (feltételezzük, hogy a slug az AdminPosts.title vagy egyedi azonosító)
  const post = await db.adminPosts.findFirst({ where: { title: params.slug } });
  if (!post) {
    return new Response(JSON.stringify({ error: 'Nincs ilyen poszt!' }), { status: 404 });
  }
  const comments = await db.comment.findMany({
    where: { postId: post.id },
    include: { user: { select: { username: true, email: true, avatar: true } } },
    orderBy: { createdAt: 'desc' },
  });
  return new Response(JSON.stringify(comments), { status: 200 });
}
