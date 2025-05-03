import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { adminAuth } from '@/lib/middleware/adminAuth';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await adminAuth(req);
  if (user instanceof Response) return user;
  const userId = Number(params.id);
  if (isNaN(userId)) {
    return new Response(JSON.stringify({ error: 'Érvénytelen user ID!' }), { status: 400 });
  }
  const body = await req.json();
  if (typeof body.banned !== 'boolean') {
    return new Response(JSON.stringify({ error: 'Hiányzó vagy hibás banned mező!' }), {
      status: 400,
    });
  }
  await db.user.update({ where: { id: userId }, data: { isBanned: body.banned } });
  return new Response(JSON.stringify({ success: true }), { status: 200 });
}
