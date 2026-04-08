import { useState, useEffect, useRef } from 'react'
import PostModal from './PostModal'
import TipModal from './TipModal'
import QuizModal from './QuizModal'

export default function CreateMenu({ onPostCreated }) {
  const [isOpen, setIsOpen] = useState(false)
  const [activeModal, setActiveModal] = useState(null) // 'code' | 'tip' | 'quiz'
  const menuRef = useRef(null)

  // Close on click outside
  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsOpen(false)
      }
    }
    if (isOpen) document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [isOpen])

  const openModal = (type) => {
    setIsOpen(false)
    setActiveModal(type)
  }

  const closeModal = () => setActiveModal(null)

  const handlePostCreated = (post) => {
    setActiveModal(null)
    onPostCreated(post)
  }

  return (
    <>
      <div className="create-menu-container" ref={menuRef}>
        {/* Menu items — appear above the FAB when open */}
        <div className={`create-menu-items ${isOpen ? 'open' : ''}`}>
          <button
            className="create-menu-item quiz-item"
            onClick={() => openModal('quiz')}
            title="Post Quiz"
          >
            <span className="create-menu-item-icon">🧩</span>
            <span className="create-menu-item-label">Post Quiz</span>
          </button>
          <button
            className="create-menu-item tip-item"
            onClick={() => openModal('tip')}
            title="Post Tip"
          >
            <span className="create-menu-item-icon">💡</span>
            <span className="create-menu-item-label">Post Tip</span>
          </button>
          <button
            className="create-menu-item code-item"
            onClick={() => openModal('code')}
            title="New Code"
          >
            <span className="create-menu-item-icon">💻</span>
            <span className="create-menu-item-label">New Code</span>
          </button>
        </div>

        {/* Main FAB */}
        <button
          className={`fab create-fab ${isOpen ? 'fab-open' : ''}`}
          onClick={() => setIsOpen((v) => !v)}
          title="Create"
          aria-label="Create new post"
        >
          <span className="fab-icon create-fab-icon">{isOpen ? '✕' : '✦'}</span>
          <span className="fab-label">{isOpen ? 'Close' : 'Create'}</span>
        </button>
      </div>

      {/* Modals */}
      {activeModal === 'code' && (
        <PostModal onPostCreated={handlePostCreated} onClose={closeModal} />
      )}
      {activeModal === 'tip' && (
        <TipModal onPostCreated={handlePostCreated} onClose={closeModal} />
      )}
      {activeModal === 'quiz' && (
        <QuizModal onPostCreated={handlePostCreated} onClose={closeModal} />
      )}
    </>
  )
}
