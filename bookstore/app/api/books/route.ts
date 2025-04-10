import { NextResponse } from 'next/server';
import db from '@/lib/db'; // Assuming db setup is exported from lib/db.ts

export async function GET() {
  return new Promise((resolve) => {
    db.all('SELECT books.*, authors.name as author_name FROM books LEFT JOIN authors ON books.author_id = authors.id', [], (err, rows) => {
      if (err) {
        console.error('Error fetching books:', err.message);
        resolve(NextResponse.json({ error: 'Failed to fetch books' }, { status: 500 }));
      } else {
        resolve(NextResponse.json(rows));
      }
    });
  });
}
