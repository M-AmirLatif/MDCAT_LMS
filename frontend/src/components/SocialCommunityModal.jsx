import { useEffect, useState } from 'react'
import { SOCIAL_COMMUNITY_LIST, SOCIAL_LINKS } from '../constants/socialLinks'
import './SocialCommunityModal.css'

const POPUP_ACK_KEY = 'mdcat_social_community_modal_ack_v1'

export function openSocialCommunityModal() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('open-social-community-modal'))
  }
}

function WhatsAppIcon({ size = 20 }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" aria-hidden="true">
      <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2zm0 18.15c-1.48 0-2.93-.4-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.18 8.18 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.24-8.24 2.2 0 4.27.86 5.82 2.42a8.182 8.182 0 0 1 2.41 5.83c.01 4.54-3.68 8.23-8.22 8.23zm4.52-6.17c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.12-.17.25-.64.81-.79.97-.14.17-.29.19-.54.06-.25-.12-1.05-.39-1.99-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.25-.02-.38.11-.51.11-.11.25-.29.37-.43.12-.14.17-.25.25-.41.08-.17.04-.31-.02-.43-.06-.12-.56-1.34-.76-1.84-.2-.48-.4-.42-.56-.43h-.48c-.17 0-.43.06-.66.31-.22.25-.87.85-.87 2.07 0 1.22.89 2.4 1.01 2.56.12.17 1.75 2.67 4.23 3.74.59.26 1.05.41 1.41.52.59.19 1.13.16 1.56.1.48-.07 1.47-.6 1.67-1.18.21-.58.21-1.07.14-1.18-.06-.1-.23-.17-.48-.3z" />
    </svg>
  )
}

function MegaphoneIcon({ size = 18 }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m3 11 18-5v12L3 13v-2z" />
      <path d="M11.6 16.8a3 3 0 1 1-5.8-1.6" />
    </svg>
  )
}

function BellIcon({ size = 18 }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  )
}

function ChatIcon({ size = 18 }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  )
}

function InstagramIcon({ size = 18 }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  )
}

function FacebookIcon({ size = 18 }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" aria-hidden="true">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  )
}

function PhoneIcon({ size = 18 }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  )
}

function getSocialIcon(type) {
  switch (type) {
    case 'channel':
      return <MegaphoneIcon />
    case 'updates':
      return <BellIcon />
    case 'discussion':
      return <ChatIcon />
    case 'instagram':
      return <InstagramIcon />
    case 'facebook':
      return <FacebookIcon />
    case 'support':
      return <PhoneIcon />
    default:
      return <WhatsAppIcon />
  }
}

export default function SocialCommunityModal() {
  const [isOpen, setIsOpen] = useState(false)
  const [hasInteracted, setHasInteracted] = useState(false)

  useEffect(() => {
    // Check if user has already acknowledged or dismissed recently
    try {
      const ack = localStorage.getItem(POPUP_ACK_KEY)
      // If never acknowledged, pop up on initial visit after a brief 1.2s delay
      if (!ack) {
        const timer = setTimeout(() => {
          setIsOpen(true)
        }, 1200)
        return () => clearTimeout(timer)
      }
    } catch {
      // ignore storage error
    }
  }, [])

  useEffect(() => {
    const handleOpen = () => setIsOpen(true)
    window.addEventListener('open-social-community-modal', handleOpen)
    return () => window.removeEventListener('open-social-community-modal', handleOpen)
  }, [])

  const handleClose = () => {
    try {
      localStorage.setItem(POPUP_ACK_KEY, JSON.stringify({ acknowledgedAt: Date.now() }))
    } catch {
      // ignore
    }
    setIsOpen(false)
  }

  const handleLinkClick = () => {
    setHasInteracted(true)
  }

  if (!isOpen) return null

  return (
    <div className="social-modal-backdrop" onClick={handleClose} role="dialog" aria-modal="true" aria-labelledby="social-modal-title">
      <div className="social-modal-container" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          className="social-modal-close"
          onClick={handleClose}
          aria-label="Close community dialog"
        >
          ✕
        </button>

        <div className="social-modal-header">
          <div className="social-modal-badge">
            <WhatsAppIcon size={16} /> Official MDCAT Communities
          </div>
          <h2 id="social-modal-title" className="social-modal-title">
            Join Our WhatsApp Groups & Channel
          </h2>
          <p className="social-modal-subtitle">
            Get instant PMDC & NUMS updates, daily practice questions, video solutions, and connect with thousands of MDCAT aspirants.
          </p>
        </div>

        <div className="social-modal-cards">
          {/* Primary 1: WhatsApp Channel */}
          <a
            href={SOCIAL_LINKS.whatsappChannel.url}
            target="_blank"
            rel="noopener noreferrer"
            className="social-card social-card--channel"
            onClick={handleLinkClick}
          >
            <div className="social-card-icon social-card-icon--channel">
              <MegaphoneIcon size={22} />
            </div>
            <div className="social-card-info">
              <div className="social-card-badge-row">
                <span className="social-card-badge">{SOCIAL_LINKS.whatsappChannel.badge}</span>
                <span className="social-card-pill">Recommended 🔥</span>
              </div>
              <strong className="social-card-title">{SOCIAL_LINKS.whatsappChannel.title}</strong>
              <span className="social-card-desc">{SOCIAL_LINKS.whatsappChannel.subtitle}</span>
            </div>
            <span className="social-card-btn social-card-btn--channel">
              Follow Channel →
            </span>
          </a>

          {/* Primary 2: Updates Group */}
          <a
            href={SOCIAL_LINKS.whatsappUpdatesGroup.url}
            target="_blank"
            rel="noopener noreferrer"
            className="social-card social-card--updates"
            onClick={handleLinkClick}
          >
            <div className="social-card-icon social-card-icon--updates">
              <BellIcon size={22} />
            </div>
            <div className="social-card-info">
              <span className="social-card-badge">{SOCIAL_LINKS.whatsappUpdatesGroup.badge}</span>
              <strong className="social-card-title">{SOCIAL_LINKS.whatsappUpdatesGroup.title}</strong>
              <span className="social-card-desc">{SOCIAL_LINKS.whatsappUpdatesGroup.subtitle}</span>
            </div>
            <span className="social-card-btn social-card-btn--updates">
              Join Group →
            </span>
          </a>

          {/* Primary 3: Student Discussion Group */}
          <a
            href={SOCIAL_LINKS.whatsappDiscussionGroup.url}
            target="_blank"
            rel="noopener noreferrer"
            className="social-card social-card--discussion"
            onClick={handleLinkClick}
          >
            <div className="social-card-icon social-card-icon--discussion">
              <ChatIcon size={22} />
            </div>
            <div className="social-card-info">
              <span className="social-card-badge">{SOCIAL_LINKS.whatsappDiscussionGroup.badge}</span>
              <strong className="social-card-title">{SOCIAL_LINKS.whatsappDiscussionGroup.title}</strong>
              <span className="social-card-desc">{SOCIAL_LINKS.whatsappDiscussionGroup.subtitle}</span>
            </div>
            <span className="social-card-btn social-card-btn--discussion">
              Join Chat →
            </span>
          </a>
        </div>

        {/* Secondary Social Channels: Instagram, Facebook, Support */}
        <div className="social-modal-subgrid">
          <a
            href={SOCIAL_LINKS.whatsappSupport.url}
            target="_blank"
            rel="noopener noreferrer"
            className="social-subcard social-subcard--support"
            onClick={handleLinkClick}
          >
            <span className="social-subcard-icon"><PhoneIcon size={16} /></span>
            <div className="social-subcard-text">
              <strong>WhatsApp Support</strong>
              <small>0307-4172603</small>
            </div>
          </a>

          <a
            href={SOCIAL_LINKS.instagram.url}
            target="_blank"
            rel="noopener noreferrer"
            className="social-subcard social-subcard--instagram"
            onClick={handleLinkClick}
          >
            <span className="social-subcard-icon"><InstagramIcon size={16} /></span>
            <div className="social-subcard-text">
              <strong>Instagram</strong>
              <small>@acemdcatofficial</small>
            </div>
          </a>

          <a
            href={SOCIAL_LINKS.facebook.url}
            target="_blank"
            rel="noopener noreferrer"
            className="social-subcard social-subcard--facebook"
            onClick={handleLinkClick}
          >
            <span className="social-subcard-icon"><FacebookIcon size={16} /></span>
            <div className="social-subcard-text">
              <strong>Facebook</strong>
              <small>Ace MDCAT</small>
            </div>
          </a>
        </div>

        {/* Modal Action Foot */}
        <div className="social-modal-footer">
          <button
            type="button"
            className="social-modal-continue-btn"
            onClick={handleClose}
          >
            {hasInteracted ? "✓ I've Joined - Continue to LMS" : "Continue to Explore Website →"}
          </button>
        </div>
      </div>
    </div>
  )
}
