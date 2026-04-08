import { useState, useEffect } from 'react';
import api from '../api/axios';
import PostCard from '../components/PostCard';
import { useAuth } from '../context/AuthContext';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('liked'); // liked, commented, saved
  const [items, setItems] = useState([]);
  const [folders, setFolders] = useState([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (activeTab === 'saved') {
      fetchFolders();
    } else {
      fetchActivity();
    }
  }, [activeTab]);

  const fetchActivity = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/activity/${activeTab}`);
      setItems(res.data);
    } catch (err) {
      console.error('Activity fetch error', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchFolders = async () => {
    setLoading(true);
    try {
      const res = await api.get('/folders');
      setFolders(res.data);
    } catch (err) {
      console.error('Folders fetch error', err);
    } finally {
      setLoading(false);
    }
  };

  const createFolder = async () => {
    const name = prompt('Enter folder name:');
    if (!name) return;
    const isCollab = window.confirm('Make this a collaboration folder?');
    try {
      const res = await api.post('/folders', { name, isCollaboration: isCollab });
      setFolders([res.data, ...folders]);
    } catch (err) {
      alert('Error creating folder');
    }
  };

  return (
    <div className="settings-page">
      <div className="settings-header">
        <h1>⚙️ Settings & Activity</h1>
        <p>Manage your interactions and saved content</p>
      </div>

      <div className="settings-tabs">
        <button 
          className={`settings-tab ${activeTab === 'liked' ? 'active' : ''}`}
          onClick={() => setActiveTab('liked')}
        >
          ❤️ Liked
        </button>
        <button 
          className={`settings-tab ${activeTab === 'commented' ? 'active' : ''}`}
          onClick={() => setActiveTab('commented')}
        >
          💬 Comments
        </button>
        <button 
          className={`settings-tab ${activeTab === 'saved' ? 'active' : ''}`}
          onClick={() => setActiveTab('saved')}
        >
          🔖 Saved
        </button>
      </div>

      <div className="settings-content">
        {loading ? (
          <div className="loading-spinner"><div className="spinner" /></div>
        ) : (
          <>
            {activeTab === 'saved' ? (
              <div className="folders-grid">
                <button className="create-folder-card" onClick={createFolder}>
                  <div className="plus-icon">+</div>
                  <span>New Folder</span>
                </button>
                {folders.map(folder => (
                  <div key={folder._id} className="folder-card">
                    <div className="folder-icon">📂</div>
                    <div className="folder-info">
                      <h3>{folder.name}</h3>
                      <p>{folder.posts?.length || 0} items</p>
                      {folder.isCollaboration && <span className="collab-badge">🤝 Collaborative</span>}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="activity-list">
                {items.length === 0 ? (
                  <div className="empty-state">
                    <p>No activity found for this section.</p>
                  </div>
                ) : (
                  items.map(post => <PostCard key={post._id} post={post} />)
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
