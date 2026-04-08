import { useState, useEffect, useRef } from 'react'
import api from '../api/axios'
import NotificationDropdown from './NotificationDropdown'

export default function NotificationBell() {
  const [notifications, setNotifications] = useState([])
  const [showDropdown, setShowDropdown] = useState(false)
  const dropdownRef = useRef(null)

  const unreadCount = notifications.filter(n => !n.isRead).length

  useEffect(() => {
    fetchNotifications()
    // Poll every 30 seconds for new notifications
    const interval = setInterval(fetchNotifications, 30000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications')
      setNotifications(res.data)
    } catch (err) {
      console.error('Failed to fetch notifications', err)
    }
  }

  const markAsRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`)
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n))
    } catch (err) {
      console.error('Failed to mark notification as read', err)
    }
  }

  const markAllAsRead = async () => {
    try {
      await api.put('/notifications/read-all')
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
    } catch (err) {
      console.error('Failed to mark all as read', err)
    }
  }

  return (
    <div className="notif-bell-container" ref={dropdownRef}>
      <button
        className={`notif-bell-btn ${unreadCount > 0 ? 'has-unread' : ''}`}
        onClick={() => setShowDropdown(!showDropdown)}
        aria-label="Notifications"
      >
        <span className="bell-icon">🔔</span>
        {unreadCount > 0 && <span className="notif-badge">{unreadCount}</span>}
      </button>

      {showDropdown && (
        <NotificationDropdown
          notifications={notifications}
          onRead={markAsRead}
          onReadAll={markAllAsRead}
          onClose={() => setShowDropdown(false)}
        />
      )}
    </div>
  )
}
