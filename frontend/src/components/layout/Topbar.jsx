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
          >
            <span className="topbar-community-dot" />
            <span>WhatsApp & Socials</span>
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



