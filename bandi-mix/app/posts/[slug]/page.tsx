'use client'
import { notFound } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import { useAuth } from '@/components/AuthContext';
import axios from 'axios';

// Dinamikus oldal generálása slug alapján
export default function PostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = React.use(params);
  const [post, setPost] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [postLoading, setPostLoading] = useState(true);

  //FETCH POSTS
  useEffect(() => {
    setPostLoading(true);
    fetch(`/api/public/posts?slug=${slug}`)
      .then(res => res.json())
      .then(data => {
        if (data.error) notFound();
        return data;
      })
      .then(data => setPost(data))
      .finally(() => setPostLoading(false));
  }, [slug]);

  // FETCH KOMMENTS
  useEffect(() => {
    if (!post?.id) return;
    setLoading(true);
    fetch(`/api/comments?postId=${post.id}`)
      .then(res => res.json())
      .then(setComments)
      .finally(() => setLoading(false));
  }, [post?.id]);

  if (postLoading) return <div className="text-center py-10">Betöltés...</div>;
  if (!post || post.error) return <div className="text-center py-10 text-error">Nincs ilyen poszt!</div>;

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-4">{post.title}</h1>
      {post.imageurl && (
        <img src={post.imageurl} alt={post.title} className="mb-4 rounded w-full max-h-64 object-cover" />
      )}
      <div className="prose mb-8" dangerouslySetInnerHTML={{ __html: post.content || '' }} />
      <div className="border-t pt-6 mt-8">
        <h2 className="text-xl font-semibold mb-2">Hozzászólások</h2>
        <CommentForm postId={post.id} onNewComment={c => setComments([c, ...comments])} />
        {loading ? (
          <div className="text-center text-base-content/50">Betöltés...</div>
        ) : (
          <ul className="mt-4 space-y-4">
            {comments.map((c: any) => (
              <CommentItem
                key={c.id}
                c={c}
                onEdit={(id, content) => setComments(comments.map(comment => comment.id === id ? { ...comment, content } : comment))}
                onDelete={id => setComments(comments.filter(comment => comment.id !== id))}
                onModerate={(id, hidden) => setComments(comments.map(comment => comment.id === id ? { ...comment, hidden } : comment))}
              />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

// Komment beküldő űrlap
function CommentForm({ postId, onNewComment }: { postId: string, onNewComment: (c: any) => void }) {
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      axios.post('/api/comments', {data: {content, postId, userId: user?.id, name}});
      const res = await fetch('/api/comments')
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Hiba');
      onNewComment(data);
      setContent('');
      setName('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="flex flex-col gap-2 mb-4" onSubmit={handleSubmit}>
      {!user && (
        <input className="input input-bordered" name="name" placeholder="Név (opcionális)" minLength={2} value={name} onChange={e => setName(e.target.value)} />
      )}
      <textarea className="textarea textarea-bordered" name="content" rows={3} placeholder="Írd meg a véleményed..." required value={content} onChange={e => setContent(e.target.value)} />
      {error && <div className="alert alert-error py-1 px-2 text-xs">{error}</div>}
      <button type="submit" className="btn btn-primary btn-sm self-end" disabled={loading || !content.trim() || (!user && !name.trim())}>{loading ? 'Küldés...' : 'Küldés'}</button>
    </form>
  );
}

function CommentItem({ c, onEdit, onDelete, onModerate }: { c: any, onEdit: (id: string, content: string) => void, onDelete: (id: string) => void, onModerate: (id: string, hidden: boolean) => void }) {
  const { user } = useAuth();
  const [editMode, setEditMode] = useState(false);
  const [editContent, setEditContent] = useState(c.content);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isOwn = user && c.userId && user.id === c.userId;

  async function handleEditSave() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/comments', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: c.id, content: editContent, userId: user?.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Hiba');
      onEdit(c.id, editContent);
      setEditMode(false);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!confirm('Biztosan törlöd ezt a kommentet?')) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/comments', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: c.id, userId: user?.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Törlés sikertelen');
      onDelete(c.id);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleModerate() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/comments', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: c.id, hidden: !c.hidden }),
      });
      if (!res.ok) throw new Error('Moderálás sikertelen');
      onModerate(c.id, !c.hidden);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (c.hidden) {
    return (
      <li className="bg-base-200 rounded p-3 opacity-60 italic">
        <div className="text-xs text-base-content/50 mb-1">(Moderált hozzászólás)</div>
        <button className="btn btn-xs btn-outline" onClick={handleModerate} disabled={loading}>Visszaállítás</button>
      </li>
    );
  }

  return (
    <li className="bg-base-200 rounded p-3">
      <div className="flex items-center gap-2 mb-1">
        <span className="font-semibold text-base-content/80 text-sm">{c.name}</span>
        <span className="text-xs text-base-content/50">{new Date(c.createdAt).toLocaleString('hu-HU')}</span>
      </div>
      {editMode ? (
        <div>
          <textarea className="textarea textarea-bordered w-full mb-2" value={editContent} onChange={e => setEditContent(e.target.value)} />
          {error && <div className="alert alert-error py-1 px-2 text-xs">{error}</div>}
          <div className="flex gap-2">
            <button className="btn btn-xs btn-primary" onClick={handleEditSave} disabled={loading || !editContent.trim()}>{loading ? 'Mentés...' : 'Mentés'}</button>
            <button className="btn btn-xs" onClick={() => setEditMode(false)} disabled={loading}>Mégse</button>
          </div>
        </div>
      ) : (
        <div>
          <div className="text-sm text-base-content/80 mb-1">{c.content}</div>
          <div className="flex gap-2 mt-1">
            {isOwn && <button className="btn btn-xs btn-outline" onClick={() => setEditMode(true)}>Szerkesztés</button>}
            {isOwn && <button className="btn btn-xs btn-outline btn-error" onClick={handleDelete}>Törlés</button>}
            <button className="btn btn-xs btn-outline" onClick={handleModerate}>{c.hidden ? 'Visszaállítás' : 'Moderálás'}</button>
          </div>
        </div>
      )}
    </li>
  );
}
