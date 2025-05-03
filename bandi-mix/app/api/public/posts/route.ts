import { NextRequest } from 'next/server';
import { getAllAdminPostsMeta } from '@/lib/admin/readPostsMeta';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const slug = searchParams.get('slug');
  if (!slug) return new Response(JSON.stringify({ error: 'Hiányzó slug paraméter!' }), { status: 400 });
  const posts = getAllAdminPostsMeta();
  const post = posts.find((p) => p.slug === slug);
  if (!post) return new Response(JSON.stringify({ error: 'Nincs ilyen poszt!' }), { status: 404 });
  return new Response(JSON.stringify(post), { status: 200 });
}
