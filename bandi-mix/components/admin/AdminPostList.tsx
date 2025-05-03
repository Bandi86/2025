'use client';
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '@/components/AuthContext';
import CommentsModal from './CommentsModal';
import AdminPostEditorModal from './AdminPostEditorModal';
import { AdminPostMeta } from '@/lib/admin/readPostsMeta';

const AdminPostList: React.FC = () => {
  const [posts, setPosts] = useState<AdminPostMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPost, setSelectedPost] = useState<string | null>(null);
  const [commentsCount, setCommentsCount] = useState<{ [key: string]: number }>({});
  const { token } = useAuth();
  const [editPost, setEditPost] = useState<AdminPostMeta | null>(null);
  const [editModalKey, setEditModalKey] = useState(0);

  const handleEditClick = async (slug: string) => {
    try {
      const res = await axios.get(`/api/admin/posts/${slug}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const postWithContent: AdminPostMeta = {
        ...res.data,
        content: res.data.content || '', // Ensure content is included
      };
      setEditPost(postWithContent);
      setEditModalKey((prev) => prev + 1); // force modal remount for fresh state
    } catch {
      alert('Nem sikerült betölteni a poszt tartalmát!');
    }
  };

  const handleEditSaved = () => {
    // Frissítsd a posztlistát mentés után
    if (token) fetchPosts();
  };

  const fetchPosts = async () => {
    try {
      const response = await axios.get('/api/admin/posts', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPosts(response.data);
      // Kommentek számának lekérése minden poszthoz
      const counts: { [key: string]: number } = {};
      await Promise.all(
        response.data.map(async (p: AdminPostMeta) => {
          try {
            const res = await axios.get(`/api/admin/posts/${p.slug}/comments/count`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            counts[p.slug] = res.data.count;
          } catch {
            counts[p.slug] = 0;
          }
        })
      );
      setCommentsCount(counts);
    } catch (err) {
      setError('Hiba történt a posztok betöltésekor.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchPosts();
  }, [token]);

  return (
    <div className="overflow-x-auto mt-6">
      <h2 className="text-2xl font-bold mb-4">Admin posztok</h2>
      {loading ? (
        <div className="flex justify-center">
          <span className="loading loading-spinner loading-lg"></span>
        </div>
      ) : error ? (
        <div className="alert alert-error">{error}</div>
      ) : (
        <table className="table table-zebra w-full">
          <thead>
            <tr>
              <th>Slug</th>
              <th>Cím</th>
              <th>Prémium?</th>
              <th>Határidő</th>
              <th>Létrehozva</th>
              <th>Frissítve</th>
              <th>Kép</th>
              <th>Kommentek</th>
              <th>Műveletek</th>
            </tr>
          </thead>
          <tbody>
            {posts.map((p) => (
              <tr key={p.slug}>
                <td>{p.slug}</td>
                <td>{p.title}</td>
                <td>
                  {p.isPremium ? (
                    <span className="badge badge-primary badge-sm">igen</span>
                  ) : (
                    <span className="badge badge-neutral badge-sm">nem</span>
                  )}
                </td>
                <td>{p.deadline}</td>
                <td>{p.createdAt ? new Date(p.createdAt).toLocaleString() : '-'}</td>
                <td>{p.updatedAt ? new Date(p.updatedAt).toLocaleString() : '-'}</td>
                <td>
                  {p.imageurl && (
                    <img src={p.imageurl} alt="kép" className="w-16 h-10 object-cover rounded" />
                  )}
                </td>
                <td>
                  <button
                    className="badge badge-info badge-sm"
                    onClick={() => setSelectedPost(p.slug)}
                  >
                    {commentsCount[p.slug] ?? 0}
                  </button>
                </td>
                <td>
                  <div className="join">
                    <button
                      className="btn btn-xs btn-primary join-item"
                      onClick={() => handleEditClick(p.slug)}
                    >
                      Szerkesztés
                    </button>
                    {/* ...további admin gombok, pl. törlés... */}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {selectedPost && <CommentsModal slug={selectedPost} onClose={() => setSelectedPost(null)} />}
      {editPost && (
        <AdminPostEditorModal
          key={editModalKey}
          post={editPost}
          onClose={() => setEditPost(null)}
          onSaved={handleEditSaved}
        />
      )}
    </div>
  );
};

export default AdminPostList;
