import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { adminAuth } from '@/lib/middleware/adminAuth';

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await adminAuth(req);
  if (user instanceof Response) return user;
  const commentId = Number(params.id);
  if (isNaN(commentId)) {
    return new Response(JSON.stringify({ error: 'Érvénytelen komment ID!' }), { status: 400 });
  }
  await db.comment.delete({ where: { id: commentId } });
  return new Response(JSON.stringify({ success: true }), { status: 200 });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await adminAuth(req);
  if (user instanceof Response) return user;
  const commentId = Number(params.id);
  if (isNaN(commentId)) {
    return new Response(JSON.stringify({ error: 'Érvénytelen komment ID!' }), { status: 400 });
  }
  const body = await req.json();
  const updateData: any = {};
  if (typeof body.content === 'string') updateData.content = body.content;
  if (typeof body.hidden === 'boolean') updateData.hidden = body.hidden;
  const updated = await db.comment.update({ where: { id: commentId }, data: updateData });
  return new Response(JSON.stringify(updated), { status: 200 });
}
