'use client';
import React, { useEffect, useState } from 'react';
import { marked } from 'marked';

interface AdminPostMeta {
  slug: string;
  title: string;
  content: string;
  isPremium: boolean;
  deadline: string;
  imageurl?: string;
  tippmixPicture?: string;
  createdAt?: string;
  updatedAt?: string;
  commentsCount?: number;
}

const RenderPosts = () => {
  const [posts, setPosts] = useState<AdminPostMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/public/posts-with-comments')
      .then((res) => {
        if (!res.ok) throw new Error('Hiba a posztok lekérésekor');
        return res.json();
      })
      .then((data) => {
        setPosts(data);
        setError(null);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading)
    return (
      <div className="flex justify-center">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  if (error) return <div className="alert alert-error">{error}</div>;

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {posts.map((post) => (
        <div
          key={post.slug}
          className="card card-bordered bg-base-100 shadow-md hover:shadow-xl transition-shadow duration-200"
        >
          {post.imageurl && (
            <figure className="h-36 overflow-hidden rounded-t-box">
              <img src={post.imageurl} alt={post.title} className="w-full h-full object-cover" />
            </figure>
          )}
          <div className="card-body p-4">
            <h2 className="card-title text-base font-semibold mb-1 line-clamp-2">{post.title}</h2>
            <div className="flex items-center gap-2 mb-2">
              {post.deadline && <span className="badge badge-info badge-xs">{post.deadline}</span>}
              <span className="badge badge-neutral badge-xs">💬 {post.commentsCount ?? 0}</span>
            </div>
            <p className="text-sm text-base-content/70 line-clamp-2 mb-3">
              {post.content?.replace(/[#*_`>\-\[\]!\n]/g, '').slice(0, 70) || ''}...
            </p>
            <div className="card-actions justify-end">
              <a href={`/posts/${post.slug}`} className="btn btn-primary btn-xs btn-outline">
                Részletek
              </a>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default RenderPosts;
