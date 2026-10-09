import { useMemo } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useSearch } from '../../context/SearchContext'
import { getPageTitle } from '../../lib/platform'
import ThemeToggle from '../ThemeToggle'
import { getUserProfilePicture } from '../../utils/assetUrl'
import './Topbar.css'

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden="true">
      <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="2" />
      <path d="m16 16 4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

function BellIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden="true">
      <path d="M6 10a6 6 0 1 1 12 0v4.2l1.6 2.1a1 1 0 0 1-.8 1.6H5.2a1 1 0 0 1-.8-1.6L6 14.2V10Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M10 20a2 2 0 0 0 4 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

function MenuIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" aria-hidden="true">
      <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

function WhatsAppIcon({ size = 18 }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" aria-hidden="true">
      <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2zm0 18.15c-1.48 0-2.93-.4-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.18 8.18 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.24-8.24 2.2 0 4.27.86 5.82 2.42a8.182 8.182 0 0 1 2.41 5.83c.01 4.54-3.68 8.23-8.22 8.23zm4.52-6.17c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.12-.17.25-.64.81-.79.97-.14.17-.29.19-.54.06-.25-.12-1.05-.39-1.99-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.25-.02-.38.11-.51.11-.11.25-.29.37-.43.12-.14.17-.25.25-.41.08-.17.04-.31-.02-.43-.06-.12-.56-1.34-.76-1.84-.2-.48-.4-.42-.56-.43h-.48c-.17 0-.43.06-.66.31-.22.25-.87.85-.87 2.07 0 1.22.89 2.4 1.01 2.56.12.17 1.75 2.67 4.23 3.74.59.26 1.05.41 1.41.52.59.19 1.13.16 1.56.1.48-.07 1.47-.6 1.67-1.18.21-.58.21-1.07.14-1.18-.06-.1-.23-.17-.48-.3z" />
    </svg>
  )
}

import { openSocialCommunityModal } from '../SocialCommunityModal'

export default function Topbar({ onMenuClick }) {
  const location = useLocation()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { searchQuery, setSearchQuery, searchPlaceholder } = useSearch()

  const title = useMemo(
    () => getPageTitle(location.pathname, user?.role),
    [location.pathname, user?.role],
  )

  const initials = `${user?.firstName?.[0] || 'U'}${user?.lastName?.[0] || ''}`.toUpperCase()
  const profilePicture = getUserProfilePicture(user)
  return (
    <header className="topbar">
      <div className="topbar-left">
        <button
          className="topbar-toggle"
          onClick={onMenuClick}
          type="button"
          aria-label="Open navigation"
        >
          <MenuIcon />
        </button>

        <div className="topbar-heading">
          <h2 className="topbar-page-title">{title}</h2>
        </div>
      </div>

      <div className="topbar-center">
        <div className="topbar-search">
          <span className="topbar-search-icon">
            <SearchIcon />
          </span>
          <input
            type="text"
            placeholder={searchPlaceholder || 'Search courses, students, classes...'}
            aria-label="Search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery ? (
            <button
              type="button"
              className="topbar-search-clear"
              onClick={() => setSearchQuery('')}
              aria-label="Clear search"
              title="Clear search"
            >
              ✕
            </button>
          ) : null}
        </div>
      </div>

      <div className="topbar-right">
        {(!user || (typeof user?.role === 'string' ? user.role : user?.role?.name) === 'student') && (
          <button
            type="button"
            className="topbar-community-btn"
            onClick={openSocialCommunityModal}
            title="Join Official WhatsApp Channel & Groups"
            aria-label="Join Official WhatsApp Channel and Groups"
          >
            <WhatsAppIcon size={18} />
            <span className="topbar-community-text">WhatsApp & Socials</span>
            <span className="topbar-community-dot" />
          </button>
        )}

        <button
          className="topbar-action"
          onClick={() => navigate('/notifications')}
          type="button"
          aria-label="Notifications"
        >
          <BellIcon />
          <span className="topbar-action-dot" />
        </button>

        <ThemeToggle className="theme-toggle--topbar" />

        {user ? (
          <button className="topbar-user" onClick={() => navigate('/profile/edit')} type="button">
            {profilePicture ? (
              <img className="topbar-avatar topbar-avatar--image" src={profilePicture} alt={user?.firstName || 'Profile'} />
            ) : (
              <div className="topbar-avatar">{initials}</div>
            )}
            <div className="topbar-user-info">
              <span className="topbar-user-name">
                {user?.firstName ? `${user.firstName} ${user?.lastName || ''}`.trim() : 'Student'}
              </span>
            </div>
          </button>
        ) : (
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button className="btn btn-outline btn-sm" onClick={() => navigate('/login')} type="button">
              Log In
            </button>
            <button className="btn btn-primary btn-sm" onClick={() => navigate('/register')} type="button">
              Sign Up
            </button>
          </div>
        )}
      </div>
    </header>
  )
}



