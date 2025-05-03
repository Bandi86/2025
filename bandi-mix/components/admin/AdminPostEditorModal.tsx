import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '@/components/AuthContext';
import { marked } from 'marked';

import { AdminPostMeta } from '@/lib/admin/readPostsMeta'

const AdminPostEditorModal = ({
  post,
  onClose,
  onSaved,
}: {
  post: AdminPostMeta;
  onClose: () => void;
  onSaved: () => void;
}) => {
  const { token } = useAuth();
  const [editContent, setEditContent] = useState(post.content || '');
  const [editMeta, setEditMeta] = useState({
    title: post.title,
    isPremium: post.isPremium,
    deadline: post.deadline,
    imageurl: post.imageurl,
    tippmixPicture: post.tippmixPicture,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewHtml, setPreviewHtml] = useState('');
  const [validation, setValidation] = useState<{ title?: string; content?: string }>({});
  const previewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
      const parseMarkdown = async () => {
        const result = await marked.parse(editContent || '');
        setPreviewHtml(result);
      };
      parseMarkdown();
    }, [editContent]);

  const validate = () => {
    const v: { title?: string; content?: string } = {};
    if (!editMeta.title || editMeta.title.trim().length < 3)
      v.title = 'A cím legalább 3 karakter legyen!';
    if (!editContent || editContent.trim().length < 10)
      v.content = 'A tartalom legalább 10 karakter legyen!';
    setValidation(v);
    return Object.keys(v).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setLoading(true);
    setError(null);
    try {
      await axios.patch(
        `/api/admin/posts/${post.slug}`,
        {
          content: editContent,
          meta: editMeta,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      onSaved();
      onClose();
    } catch (e: any) {
      setError('Mentés sikertelen!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <dialog open className="modal modal-middle">
      <div className="modal-box w-full max-w-2xl">
        <h3 className="font-bold text-lg mb-4">Poszt szerkesztése</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <input
            className={`input input-bordered w-full${validation.title ? ' input-error' : ''}`}
            value={editMeta.title}
            onChange={(e) => setEditMeta({ ...editMeta, title: e.target.value })}
            placeholder="Cím"
          />
          <input
            className="input input-bordered w-full"
            value={editMeta.deadline}
            onChange={(e) => setEditMeta({ ...editMeta, deadline: e.target.value })}
            placeholder="Határidő (pl. 2025-05-10)"
            type="date"
          />
          <input
            className="input input-bordered w-full"
            value={editMeta.imageurl || ''}
            onChange={(e) => setEditMeta({ ...editMeta, imageurl: e.target.value })}
            placeholder="Kép URL"
          />
          <input
            className="input input-bordered w-full"
            value={editMeta.tippmixPicture || ''}
            onChange={(e) => setEditMeta({ ...editMeta, tippmixPicture: e.target.value })}
            placeholder="Tippmix kép URL"
          />
          <label className="flex items-center gap-2 col-span-1 md:col-span-2">
            <input
              type="checkbox"
              className="checkbox checkbox-primary"
              checked={!!editMeta.isPremium}
              onChange={(e) => setEditMeta({ ...editMeta, isPremium: e.target.checked })}
            />
            Prémium poszt
          </label>
        </div>
        {validation.title && <div className="alert alert-error mb-2">{validation.title}</div>}
        <label className="label mb-1">
          <span className="label-text">MDX tartalom</span>
        </label>
        <textarea
          className={`textarea textarea-bordered w-full mb-4 min-h-[200px]${
            validation.content ? ' textarea-error' : ''
          }`}
          rows={12}
          value={editContent}
          onChange={(e) => setEditContent(e.target.value)}
          placeholder="MDX tartalom..."
        />
        {validation.content && <div className="alert alert-error mb-2">{validation.content}</div>}
        <div className="divider divider-info mb-2">Élő előnézet</div>
        <div
          ref={previewRef}
          className="prose bg-base-200 rounded p-4 max-h-64 overflow-auto mb-4"
          dangerouslySetInnerHTML={{ __html: previewHtml }}
        />
        {error && <div className="alert alert-error mb-2">{error}</div>}
        <div className="modal-action flex gap-2">
          <button className="btn btn-primary" onClick={handleSave} disabled={loading}>
            {loading ? <span className="loading loading-spinner loading-xs"></span> : 'Mentés'}
          </button>
          <button className="btn" onClick={onClose}>
            Mégse
          </button>
        </div>
      </div>
      <form method="dialog" className="modal-backdrop">
        <button onClick={onClose}>close</button>
      </form>
    </dialog>
  );
};

export default AdminPostEditorModal;
