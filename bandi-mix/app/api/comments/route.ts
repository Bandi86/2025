import { NextRequest } from 'next/server'
import { db } from '@/lib/db'

// KOMMENT ÍRÁSA
export async function POST(req: NextRequest) {
  try {
    const { postId, content, name } = await req.json()
    if (!postId || !content || content.trim().length < 2 || !name || name.trim().length < 2) {
      return new Response(JSON.stringify({ error: 'Hiányzó vagy érvénytelen adat!' }), {
        status: 400
      })
    }
    const comment = await db.comment.create({
      data: {
        postId,
        content,
        user: { connect: { id: name } }, // Using 'name' as a placeholder for userId
        post: { connect: { id: postId } } // Assuming "postId" is valid
      }
    })
    return new Response(JSON.stringify(comment), { status: 201 })
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Hiba a komment mentésekor!' }), { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const postId = searchParams.get('postId')
  if (!postId) return new Response(JSON.stringify([]), { status: 200 })
  const comments = await db.comment.findMany({
    where: { postId },
    orderBy: { createdAt: 'desc' }
  })
  return new Response(JSON.stringify(comments), { status: 200 })
}

// KOMMENT SZERKESZTÉSE
export async function PUT(req: NextRequest) {
  try {
    const { id, content, userId } = await req.json()
    if (!id || !content || content.trim().length < 2) {
      return new Response(JSON.stringify({ error: 'Hiányzó vagy érvénytelen adat!' }), {
        status: 400
      })
    }
    // Ellenőrzés: csak a saját komment szerkeszthető
    const comment = await db.comment.findUnique({ where: { id } })
    if (!comment)
      return new Response(JSON.stringify({ error: 'Nincs ilyen komment!' }), { status: 404 })
    if (userId && comment.userId && comment.userId !== userId) {
      return new Response(JSON.stringify({ error: 'Csak a saját komment szerkeszthető!' }), {
        status: 403
      })
    }
    const updated = await db.comment.update({
      where: { id },
      data: { content }
    })
    return new Response(JSON.stringify(updated), { status: 200 })
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Hiba a komment szerkesztésekor!' }), {
      status: 500
    })
  }
}

// KOMMENT TÖRLÉSE
export async function DELETE(req: NextRequest) {
  try {
    const { id, userId } = await req.json()
    if (!id)
      return new Response(JSON.stringify({ error: 'Hiányzó komment azonosító!' }), { status: 400 })
    // Ellenőrzés: csak a saját komment törölhető
    const comment = await db.comment.findUnique({ where: { id } })
    if (!comment)
      return new Response(JSON.stringify({ error: 'Nincs ilyen komment!' }), { status: 404 })
    if (userId && comment.userId && comment.userId !== userId) {
      return new Response(JSON.stringify({ error: 'Csak a saját komment törölhető!' }), {
        status: 403
      })
    }
    await db.comment.delete({ where: { id } })
    return new Response(JSON.stringify({ ok: true }), { status: 200 })
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Hiba a komment törlésekor!' }), { status: 500 })
  }
}

// KOMMENT MODERÁLÁS
export async function PATCH(req: NextRequest) {
  try {
    const { id, hidden } = await req.json()
    if (!id || typeof hidden !== 'boolean') {
      return new Response(JSON.stringify({ error: 'Hiányzó vagy hibás paraméter!' }), {
        status: 400
      })
    }
    const updated = await db.comment.update({ where: { id }, data: { hidden } })
    return new Response(JSON.stringify(updated), { status: 200 })
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Hiba a moderálásnál!' }), { status: 500 })
  }
}
