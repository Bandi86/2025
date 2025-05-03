import { NextRequest } from 'next/server';

// PROFILE FETCHING
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const slug = searchParams.get('slug');
  if (!slug) return new Response(JSON.stringify({ error: 'Hiányzó slug paraméter!' }), { status: 400 });
  
}
