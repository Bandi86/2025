import { getAllAdminPostsMeta } from '@/lib/admin/readPostsMeta';
import { NextRequest } from 'next/server';

export async function GET(_req: NextRequest) {
  // Csak az ingyenes posztokat adjuk vissza
  const posts = getAllAdminPostsMeta().filter((p) => !p.isPremium);
  return new Response(JSON.stringify(posts), { status: 200 });
}
