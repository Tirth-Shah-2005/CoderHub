import { useNavigate } from 'react-router-dom'

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

export default function NotificationDropdown({ notifications, onRead, onReadAll, onClose }) {
  const navigate = useNavigate()

  const handleNotificationClick = (notif) => {
    onRead(notif._id)
    onClose()
    
    if (notif.type === 'FOLLOW') {
      navigate(`/profile/${notif.sender.user_id}`)
    } else if (notif.type === 'LIKE' || notif.type === 'COMMENT') {
      navigate(`/feed`)
      // Optional: Add logic to scroll to post if needed
    }
  }

  const getTypeIcon = (type) => {
    switch (type) {
      case 'FOLLOW': return '👤'
      case 'LIKE': return '❤️'
      case 'COMMENT': return '💬'
      default: return '🔔'
    }
  }

  const getTypeLabel = (type) => {
    switch (type) {
      case 'FOLLOW': return 'started following you'
      case 'LIKE': return 'liked your post'
      case 'COMMENT': return 'commented on your post'
      default: return 'sent a notification'
    }
  }

  return (
    <div className="notif-dropdown">
      <div className="notif-header">
        <h3>Notifications</h3>
        {notifications.some(n => !n.isRead) && (
          <button className="btn-mark-read" onClick={onReadAll}>Mark all read</button>
        )}
      </div>

      <div className="notif-list">
        {notifications.length === 0 ? (
          <div className="notif-empty">
            <p>No notifications yet</p>
          </div>
        ) : (
          notifications.map((notif) => (
            <div
              key={notif._id}
              className={`notif-item ${!notif.isRead ? 'unread' : ''}`}
              onClick={() => handleNotificationClick(notif)}
            >
              <div
                className="notif-avatar"
                style={{ background: notif.sender.avatarColor }}
              >
                {notif.sender.user_id[0].toUpperCase()}
              </div>
              <div className="notif-content">
                <p>
                  <strong>@{notif.sender.user_id}</strong> {getTypeLabel(notif.type)}
                </p>
                {notif.type === 'COMMENT' && notif.commentText && (
                  <p className="notif-snippet">"{notif.commentText.substring(0, 40)}..."</p>
                )}
                <span className="notif-time">
                  {getTypeIcon(notif.type)} {timeAgo(notif.createdAt)}
                </span>
              </div>
              {!notif.isRead && <div className="notif-unread-dot" />}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
