import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { adminAuth } from '@/lib/middleware/adminAuth';

export async function GET(req: NextRequest, { params }: { params: { slug: string } }) {
  const user = await adminAuth(req);
  if (user instanceof Response) return user;
  // Próbáljuk slug alapján keresni, ha nincs slug mező, akkor title alapján
  let post = await db.adminPosts.findFirst({ where: { slug: params.slug } });
  if (!post) {
    post = await db.adminPosts.findFirst({ where: { title: params.slug } });
  }
  if (!post) {
    return new Response(JSON.stringify({ error: 'Nincs ilyen poszt!' }), { status: 404 });
  }
  const count = await db.comment.count({ where: { postId: post.id } });
  return new Response(JSON.stringify({ count }), { status: 200 });
}
