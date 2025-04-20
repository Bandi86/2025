'use client';
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Post from '@/types/types';

const page = () => {
  const [post, setPost] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getPosts = async () => {
    try {
      setLoading(true);
      const response = await axios.get<{ post: Post[] }>('/api/posts');
      setPost(response.data.post);
      setError(null);
    } catch (err: unknown) {
      if (err instanceof Error && err.message) {
        setError(err.message);
      } else {
        setError('Failed to fetch articles');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getPosts();
  }, []);

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-blue-600 text-white p-4">
        <h1 className="text-3xl font-bold text-center">Posts</h1>
      </header>
      <main className="container mx-auto p-4">
        {loading && (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
          </div>
        )}
        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4" role="alert">
            <p className="font-bold">Error</p>
            No Posts Found
            <p>{error}</p>
            <button
              onClick={getPosts}
              className="mt-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
            >
              Try Again
            </button>
          </div>
        )}
        {!loading && !error && post.length === 0 && (
          <div className="text-center py-12">
            <h2 className="text-2xl font-semibold text-gray-600">No Articles Found</h2>
            <p className="mt-2 text-gray-500">Check back later for new content!</p>
          </div>
        )}
        {!loading && !error && post.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {post.map((p) => (
              <div
                key={p.id}
                className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition"
              >
                <h2 className="text-xl font-semibold text-gray-800 mb-2">{p.title}</h2>
                <p className="text-gray-600 line-clamp-3">{p.content}</p>
                <a
                  href={`/post/${p.id}`}
                  className="mt-4 inline-block text-blue-600 hover:text-blue-800"
                >
                  Read More →
                </a>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default page;
