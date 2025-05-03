'use client';
import React, { useEffect, useState } from 'react';
import { useAuth } from '@/components/AuthContext';
import axios from 'axios';

interface Comment {
  id: number;
  content: string;
  createdAt: string;
  updatedAt: string;
  user: {
    id: number;
    username: string;
    email: string;
    avatar?: string;
    isBanned?: boolean;
  };
  hidden?: boolean;
}

const CommentsModal: React.FC<{ slug: string; onClose: () => void }> = ({ slug, onClose }) => {
  const { token } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editComment, setEditComment] = useState<Comment | null>(null);
  const [editContent, setEditContent] = useState('');
  const [editLoading, setEditLoading] = useState(false);
  const [banLoading, setBanLoading] = useState<number | null>(null);
  const [modLoading, setModLoading] = useState<number | null>(null);

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    fetch(`/api/admin/posts/${slug}/comments`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (res.status === 404) return [];
        if (!res.ok) throw new Error('Hiba a kommentek lekérdezésekor');
        return res.json();
      })
      .then(setComments)
      .catch(() => setError('Nincs jogosultság vagy hiba történt.'))
      .finally(() => setLoading(false));
  }, [slug, token]);

  // DELETE 
  const handleDelete = async (commentId: number) => {
    if (!token) return;
    if (!confirm('Biztosan törlöd ezt a kommentet?')) return;
    try {
      await axios.delete(`/api/admin/comments/${commentId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setComments((prev) => prev.filter((c) => c.id !== commentId));
    } catch {
      alert('Hiba történt a törléskor.');
    }
  };

  const openEditModal = (comment: Comment) => {
    setEditComment(comment);
    setEditContent(comment.content);
  };

  const handleEditSave = async () => {
    if (!editComment || !token) return;
    setEditLoading(true);
    try {
      await axios.patch(
        `/api/admin/comments/${editComment.id}`,
        { content: editContent },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setComments((prev) =>
        prev.map((c) => (c.id === editComment.id ? { ...c, content: editContent } : c))
      );
      setEditComment(null);
    } catch {
      alert('Hiba történt a mentéskor.');
    } finally {
      setEditLoading(false);
    }
  };

  const handleToggleHidden = async (commentId: number, hidden: boolean) => {
    if (!token) return;
    setModLoading(commentId);
    try {
      await axios.patch(
        `/api/admin/comments/${commentId}`,
        { hidden },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setComments((prev) => prev.map((c) => (c.id === commentId ? { ...c, hidden } : c)));
    } catch {
      alert('Hiba történt a moderációnál.');
    } finally {
      setModLoading(null);
    }
  };

  const handleBanUser = async (userId: number, banned: boolean) => {
    if (!token) return;
    setBanLoading(userId);
    try {
      await axios.post(
        `/api/admin/users/${userId}/ban`,
        { banned },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setComments((prev) =>
        prev.map((c) =>
          c.user.id === userId ? { ...c, user: { ...c.user, isBanned: banned } } : c
        )
      );
    } catch {
      alert('Hiba történt a tiltásnál.');
    } finally {
      setBanLoading(null);
    }
  };

  return (
    <dialog open className="modal modal-middle">
      <div className="modal-box w-full max-w-2xl">
        <h3 className="font-bold text-lg mb-4">Kommentek</h3>
        {loading ? (
          <div className="flex justify-center">
            <span className="loading loading-spinner loading-lg"></span>
          </div>
        ) : error ? (
          <div className="alert alert-error">{error}</div>
        ) : comments.length === 0 ? (
          <div className="alert alert-info">Nincs komment ehhez a poszthoz.</div>
        ) : (
          <table className="table table-zebra w-full">
            <thead>
              <tr>
                <th>Felhasználó</th>
                <th>Tartalom</th>
                <th>Létrehozva</th>
                <th>Frissítve</th>
                <th>Művelet</th>
              </tr>
            </thead>
            <tbody>
              {comments.map((c) => (
                <tr key={c.id}>
                  <td>
                    <div className="flex items-center gap-2">
                      <div className="avatar">
                        <div className="w-8 rounded-full">
                          <img src={c.user.avatar || 'https://picsum.photos/40/40'} alt="avatar" />
                        </div>
                      </div>
                      <span className="font-medium text-sm">{c.user.username}</span>
                    </div>
                  </td>
                  <td>{c.content}</td>
                  <td>{new Date(c.createdAt).toLocaleString()}</td>
                  <td>{new Date(c.updatedAt).toLocaleString()}</td>
                  <td>
                    <div className="join">
                      <button
                        className="btn btn-xs btn-primary join-item"
                        onClick={() => openEditModal(c)}
                      >
                        Szerkesztés
                      </button>
                      <button
                        className={`btn btn-xs join-item ${
                          c.hidden ? 'btn-warning' : 'btn-success'
                        }`}
                        disabled={modLoading === c.id}
                        onClick={() => handleToggleHidden(c.id, !c.hidden)}
                      >
                        {modLoading === c.id ? (
                          <span className="loading loading-spinner loading-xs"></span>
                        ) : c.hidden ? (
                          'Jóváhagyás'
                        ) : (
                          'Rejtés'
                        )}
                      </button>
                      <button
                        className={`btn btn-xs join-item ${
                          c.user.isBanned ? 'btn-neutral' : 'btn-error'
                        }`}
                        disabled={banLoading === c.user.id}
                        onClick={() => handleBanUser(c.user.id, !c.user.isBanned)}
                      >
                        {banLoading === c.user.id ? (
                          <span className="loading loading-spinner loading-xs"></span>
                        ) : c.user.isBanned ? (
                          'Engedélyezés'
                        ) : (
                          'Tiltás'
                        )}
                      </button>
                      <button
                        className="btn btn-xs btn-error join-item"
                        title="Törlés"
                        onClick={() => handleDelete(c.id)}
                      >
                        Törlés
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <div className="modal-action">
          <form method="dialog">
            <button className="btn btn-sm" onClick={onClose}>
              Bezárás
            </button>
          </form>
        </div>
      </div>
      <form method="dialog" className="modal-backdrop">
        <button onClick={onClose}>close</button>
      </form>
      {/* Szerkesztő modal */}
      {editComment && (
        <dialog open className="modal modal-middle">
          <div className="modal-box w-full max-w-md">
            <h3 className="font-bold text-lg mb-4">Komment szerkesztése</h3>
            <textarea
              className="textarea textarea-bordered w-full mb-4"
              rows={4}
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
            />
            <div className="modal-action">
              <button className="btn btn-primary" onClick={handleEditSave} disabled={editLoading}>
                {editLoading ? (
                  <span className="loading loading-spinner loading-xs"></span>
                ) : (
                  'Mentés'
                )}
              </button>
              <button className="btn" onClick={() => setEditComment(null)}>
                Mégse
              </button>
            </div>
          </div>
          <form method="dialog" className="modal-backdrop">
            <button onClick={() => setEditComment(null)}>close</button>
          </form>
        </dialog>
      )}
    </dialog>
  );
};

export default CommentsModal;
