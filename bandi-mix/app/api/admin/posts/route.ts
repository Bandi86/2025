import { NextRequest } from 'next/server';
import { adminAuth } from '@/lib/middleware/adminAuth';
import { getAllAdminPostsMeta } from '@/lib/admin/readPostsMeta';

export async function GET(req: NextRequest) {
  const user = await adminAuth(req);
  if (user instanceof Response) return user;
  const posts = getAllAdminPostsMeta();
  return new Response(JSON.stringify(posts), { status: 200 });
}
