export async function POST() {
  return new Response(JSON.stringify({ message: 'Sikeres kijelentkezés.' }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
