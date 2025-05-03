'use client';
import React, { useEffect, useState } from 'react';
import { marked } from 'marked';
import type { PostMeta } from '../types/t';

const RenderPosts = () => {
  const [posts, setPosts] = useState<PostMeta[]>([]);
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
          className="card-compact card-bordered bg-base-100 w-96 shadow-sm hover:shadow-xl transition-shadow duration-200 flex flex-col justify-between relative"
        >
          <div className="flex flex-row items-stretch">

            <div className="relative min-w-[96px] max-w-[120px] w-28 flex-shrink-0 flex flex-col justify-start">
              {(post.isPremium || post.isPremium === false) && (
                <span
                  className={`badge absolute left-2 top-2 z-10 ${post.isPremium ? 'badge-primary' : 'badge-success'}`}
                >
                  {post.isPremium ? 'Prémium' : 'Ingyenes'}
                </span>
              )}
              {post.imageurl && (
                <figure className="h-24 w-full overflow-hidden rounded-l-box rounded-tr-none rounded-br-none">
                  <img src={post.imageurl} alt={post.title} className="w-full h-full object-cover" />
                </figure>
              )}
            </div>
            <div className="flex-1 flex flex-col justify-between p-3">
              <h2 className="card-title text-base font-semibold mb-1 line-clamp-2">{post.title}</h2>
              <p className="text-sm text-base-content/70 line-clamp-2 mb-2">
                {post.content?.replace(/[#*_`>\-\[\]!\n]/g, '').slice(0, 70) || ''}...
              </p>
            </div>
          </div>
          <div className="flex items-center justify-between px-3 pb-2 pt-1 text-xs text-base-content/60">
            <span>{post.createdAt ? new Date(post.createdAt).toLocaleDateString('hu-HU') : ''}</span>
            <div className="flex items-center gap-2">
              {post.deadline && <span className="badge badge-info badge-xs">{post.deadline}</span>}
              <span className="badge badge-neutral badge-xs">💬 {post.commentsCount ?? 0}</span>
            </div>
          </div>
          <div className="card-actions justify-end px-3 pb-2">
            <a href={`/posts/${post.slug}`} className="btn btn-primary btn-xs btn-outline">
              Részletek
            </a>
          </div>
        </div>
      ))}
    </div>
  );
};

export default RenderPosts;
