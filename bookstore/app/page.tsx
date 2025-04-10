'use client'; // Add this directive for client-side hooks

import { useState, useEffect } from 'react';

import Book from '../types/Book';


export default function Home() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBooks = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/books');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setBooks(data);
        setError(null);
      } catch (e: any) {
        console.error('Failed to fetch books:', e);
        setError(e.message || 'Failed to load books.');
      } finally {
        setLoading(false);
      }
    };

    fetchBooks();
  }, []); // Empty dependency array means this effect runs once on mount

  return (
    <div className="min-h-screen p-8 sm:p-12 font-[family-name:var(--font-geist-sans)]">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-center">Bookstore Inventory</h1>
      </header>
      <main>
        {loading && <p className="text-center">Loading books...</p>}
        {error && <p className="text-center text-red-500">Error: {error}</p>}
        {!loading && !error && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {books.length > 0 ? (
              books.map((book) => (
                <div key={book.id} className="border rounded-lg p-4 shadow-md bg-white dark:bg-gray-800">
                  <h2 className="text-xl font-semibold mb-2">{book.title}</h2>
                  <p className="text-gray-600 dark:text-gray-400 mb-1">Author: {book.author_name || 'Unknown'}</p>
                  <p className="text-gray-600 dark:text-gray-400 mb-1">ISBN: {book.isbn}</p>
                  <p className="text-lg font-medium text-green-600 dark:text-green-400 mb-1">Price: ${book.price.toFixed(2)}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-300">Stock: {book.stock}</p>
                </div>
              ))
            ) : (
              <p className="col-span-full text-center">No books found.</p>
            )}
          </div>
        )}
      </main>
      <footer className="mt-12 text-center text-gray-500 dark:text-gray-400 text-sm">
        Bookstore App &copy; 2025
      </footer>
    </div>
  );
}
