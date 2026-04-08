import { useState, useEffect } from 'react';
import api from '../api/axios';

export default function SavePostModal({ postId, onClose }) {
  const [folders, setFolders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchFolders();
  }, []);

  const fetchFolders = async () => {
    try {
      const res = await api.get('/folders');
      setFolders(res.data);
    } catch (err) {
      console.error('Error fetching folders', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (folderId) => {
    setSaving(true);
    setMessage('');
    try {
      await api.post(`/folders/${folderId}/posts/${postId}`);
      setMessage('✅ Saved!');
      setTimeout(onClose, 1000);
    } catch (err) {
      setMessage(err.response?.data?.message || 'Error saving');
    } finally {
      setSaving(false);
    }
  };

  const createAndSave = async () => {
    const name = prompt('New folder name:');
    if (!name) return;
    setSaving(true);
    try {
      const folderRes = await api.post('/folders', { name });
      await api.post(`/folders/${folderRes.data._id}/posts/${postId}`);
      setMessage('✅ Created & Saved!');
      setTimeout(onClose, 1000);
    } catch (err) {
      setMessage('Error creating folder');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-box" style={{ maxWidth: '400px' }}>
        <div className="modal-header">
          <h3>Save to Folder</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        {message && (
          <div className="save-message" style={{ textAlign: 'center', padding: '10px', color: 'var(--accent)', fontWeight: 700 }}>
            {message}
          </div>
        )}

        {loading ? (
          <div className="loading-spinner"><div className="spinner" /></div>
        ) : (
          <div className="folders-list-select">
            {folders.map(folder => (
              <button 
                key={folder._id} 
                className="folder-select-item"
                onClick={() => handleSave(folder._id)}
                disabled={saving}
              >
                <span>{folder.isCollaboration ? '🤝' : '📁'} {folder.name}</span>
                {folder.posts.includes(postId) && <span className="already-saved">Already saved</span>}
              </button>
            ))}

            <button className="folder-select-item create-new" onClick={createAndSave} disabled={saving}>
              <span>➕ Create New Folder</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
