import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import API, { getUserFriendlyErrorMessage } from '../services/api'
import './PlatformPages.css'

const filterOptions = [
  { key: 'all', label: 'All' },
  { key: 'unread', label: 'Unread' },
  { key: 'classes', label: 'Live Classes' },
  { key: 'payments', label: 'Payments' },
  { key: 'system', label: 'System' },
]

const quickFilters = [
  { key: 'urgent', label: 'Urgent' },
  { key: 'classes', label: 'Classes' },
  { key: 'payments', label: 'Payments' },
  { key: 'progress', label: 'Progress' },
]

const toneMeta = {
  purple: { label: 'Progress', chip: 'badge-purple' },
  teal: { label: 'Live Class', chip: 'badge-teal' },
  amber: { label: 'Payments', chip: 'badge-amber' },
  coral: { label: 'System', chip: 'badge-coral' },
}

const getText = (item) => `${item?.type || ''} ${item?.title || ''} ${item?.message || item?.body || ''}`.toLowerCase()

const getNotificationCategory = (item) => {
  const type = String(item?.type || '').toLowerCase()
  const text = getText(item)

  if (text.includes('urgent') || text.includes('critical') || text.includes('important')) return 'urgent'
  if (type === 'lecture' || text.includes('class') || text.includes('lecture') || text.includes('live')) return 'classes'
  if (text.includes('payment') || text.includes('billing') || text.includes('invoice') || text.includes('subscription')) return 'payments'
  if (type === 'test' || text.includes('progress') || text.includes('score') || text.includes('attempt') || text.includes('result')) return 'progress'
  return 'system'
}

const getNotificationTone = (category) => {
  if (category === 'classes') return 'teal'
  if (category === 'payments') return 'amber'
  if (category === 'progress') return 'purple'
  return 'coral'
}

const formatNotificationTime = (value) => {
  const date = value ? new Date(value) : null
  if (!date || Number.isNaN(date.getTime())) return 'Just now'
  const seconds = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000))
  if (seconds < 60) return 'Just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes} min ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} hr ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days} day${days === 1 ? '' : 's'} ago`
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

const normalizeNotification = (item) => {
  const category = getNotificationCategory(item)
  return {
    id: item._id || item.id || item.title,
    title: item.title || 'Notification',
    body: item.message || item.body || '',
    type: item.type || 'general',
    isRead: Boolean(item.isRead),
    category,
    tone: getNotificationTone(category),
    time: formatNotificationTime(item.createdAt || item.updatedAt || item.time),
  }
}

export default function PlatformNotifications() {
  const [notifications, setNotifications] = useState([])
  const [activeFilter, setActiveFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const [settingsOpen, setSettingsOpen] = useState(false)

  useEffect(() => {
    let alive = true
    setLoading(true)

    API.get('/notifications?limit=100')
      .then((res) => {
        if (!alive) return
        setNotifications((res.data.notifications || []).map(normalizeNotification))
      })
      .catch((error) => {
        if (!alive) return
        toast.error(getUserFriendlyErrorMessage(error, 'We could not load notifications right now.'))
        setNotifications([])
      })
      .finally(() => {
        if (alive) setLoading(false)
      })

    return () => {
      alive = false
    }
  }, [])

  const inboxItems = useMemo(() => {
    if (activeFilter === 'all') return notifications
    if (activeFilter === 'unread') return notifications.filter((item) => !item.isRead)
    if (activeFilter === 'system') return notifications.filter((item) => item.category === 'system' || item.category === 'urgent')
    return notifications.filter((item) => item.category === activeFilter)
  }, [activeFilter, notifications])

  const unreadCount = notifications.filter((item) => !item.isRead).length
  const liveClassCount = notifications.filter((item) => item.category === 'classes').length
  const paymentCount = notifications.filter((item) => item.category === 'payments').length
  const systemCount = notifications.filter((item) => item.category === 'system' || item.category === 'urgent').length
  const progressCount = notifications.filter((item) => item.category === 'progress').length

  const markAllRead = async () => {
    if (!notifications.some((item) => !item.isRead)) return

    const previous = notifications
    setNotifications((current) => current.map((item) => ({ ...item, isRead: true })))

    try {
      await API.post('/notifications/mark-all-read')
      toast.success('All notifications marked as read')
    } catch (error) {
      setNotifications(previous)
      toast.error(getUserFriendlyErrorMessage(error, 'We could not mark notifications as read.'))
    }
  }

  const markOneRead = async (notificationId) => {
    const item = notifications.find((notification) => notification.id === notificationId)
    if (!item || item.isRead) return

    setNotifications((current) => current.map((notification) => (
      notification.id === notificationId ? { ...notification, isRead: true } : notification
    )))

    try {
      await API.post('/notifications/mark-as-read', { notificationId })
    } catch (error) {
      setNotifications((current) => current.map((notification) => (
        notification.id === notificationId ? { ...notification, isRead: false } : notification
      )))
      toast.error(getUserFriendlyErrorMessage(error, 'We could not update the notification.'))
    }
  }

  const archiveNotification = async (notificationId) => {
    const previous = notifications
    setNotifications((current) => current.filter((item) => item.id !== notificationId))

    try {
      await API.post('/notifications/archive', { notificationId })
      toast.success('Notification archived')
    } catch (error) {
      setNotifications(previous)
      toast.error(getUserFriendlyErrorMessage(error, 'We could not archive the notification.'))
    }
  }

  const filterLabel = [...filterOptions, ...quickFilters].find((item) => item.key === activeFilter)?.label || 'All'

  return (
    <div className="workspace-page workspace-page--notifications animate-fade-up">
      <section className="workspace-hero notification-hero">
        <div className="workspace-hero-grid notification-hero-grid">
          <div className="workspace-hero-copy">
            <div className="label-xs" style={{ color: 'rgba(255,255,255,0.82)' }}>Inbox</div>
            <h1 className="gradient-text" style={{ WebkitTextFillColor: 'unset', color: '#fff' }}>
              Notifications built into your platform
            </h1>
            <p>
              Track live classes, billing reminders, and study updates from one clear workspace instead of a plain list.
            </p>
            <div className="workspace-hero-actions">
              <button className="btn btn-primary" type="button" onClick={markAllRead} disabled={unreadCount === 0}>Mark all as read</button>
              <button className="btn btn-secondary" type="button" onClick={() => setSettingsOpen((value) => !value)}>Notification settings</button>
            </div>
          </div>

          <div className="workspace-hero-stats notification-hero-stats">
            <div className="hero-mini-card notification-hero-card">
              <span className="label-xs" style={{ color: 'rgba(255,255,255,0.82)' }}>Unread now</span>
              <strong>{String(unreadCount).padStart(2, '0')}</strong>
              <p>Priority updates from classes, payments, and system events.</p>
            </div>
            <div className="notification-hero-panel">
              <div className="notification-hero-panel-row">
                <span>Live class alerts</span>
                <strong>{liveClassCount}</strong>
              </div>
              <div className="notification-hero-panel-row">
                <span>Payment reminders</span>
                <strong>{paymentCount}</strong>
              </div>
              <div className="notification-hero-panel-row">
                <span>System notices</span>
                <strong>{systemCount}</strong>
              </div>
            </div>
          </div>
        </div>

        <div className="notification-toolbar">
          <div className="filter-pills">
            {filterOptions.map((item) => (
              <button
                key={item.key}
                className={`filter-pill ${activeFilter === item.key ? 'filter-pill--active' : ''}`}
                type="button"
                onClick={() => setActiveFilter(item.key)}
              >
                {item.label}
              </button>
            ))}
          </div>
          <div className="notification-toolbar-note">
            {loading ? 'Loading inbox...' : `${inboxItems.length} item${inboxItems.length === 1 ? '' : 's'} in ${filterLabel}`}
          </div>
        </div>
      </section>

      <div className="card-grid">
        <div className="stat-tile stat-tile--purple">
          <div className="stat-tile-top"><span>Total inbox</span><span className="badge badge-purple">Today</span></div>
          <strong>{String(notifications.length).padStart(2, '0')}</strong>
          <small>Every real alert, reminder, and announcement in one stream.</small>
        </div>
        <div className="stat-tile stat-tile--teal">
          <div className="stat-tile-top"><span>Live classes</span><span className="badge badge-teal">Action</span></div>
          <strong>{String(liveClassCount).padStart(2, '0')}</strong>
          <small>Class alerts will appear after sessions are scheduled.</small>
        </div>
        <div className="stat-tile stat-tile--amber">
          <div className="stat-tile-top"><span>Payments</span><span className="badge badge-amber">Due</span></div>
          <strong>{String(paymentCount).padStart(2, '0')}</strong>
          <small>Subscription and invoice alerts will appear after real transactions.</small>
        </div>
        <div className="stat-tile stat-tile--coral">
          <div className="stat-tile-top"><span>System notes</span><span className="badge badge-coral">Broadcast</span></div>
          <strong>{String(systemCount).padStart(2, '0')}</strong>
          <small>Operational notices will appear when admins publish them.</small>
        </div>
      </div>

      <div className="workspace-section-grid">
        <div className="workspace-card notification-feed-card">
          <div className="workspace-card-head">
            <div>
              <div className="label-xs">Latest activity</div>
              <h2 className="workspace-card-title">Priority inbox</h2>
              <p>{filterLabel} notifications are shown here. Open marks a notification as read; Archive removes it from the active inbox.</p>
            </div>
            <span className="state-chip state-chip--neutral">{inboxItems.length} Active</span>
          </div>
          <div className="workspace-card-body list-stack">
            {inboxItems.map((item) => (
              <article key={item.id} className={`notification-showcase notification-showcase--${item.tone} ${item.isRead ? 'notification-showcase--read' : ''}`}>
                <div className="notification-showcase-top">
                  <span className={`badge ${toneMeta[item.tone]?.chip || 'badge-purple'}`}>
                    {toneMeta[item.tone]?.label || 'Update'} - {item.isRead ? 'Read' : 'New'}
                  </span>
                  <small>{item.time}</small>
                </div>
                <div className="notification-showcase-body">
                  <div className={`notification-icon notification-icon--${item.tone}`}>
                    <span className="notification-dot" />
                  </div>
                  <div>
                    <strong>{item.title}</strong>
                    <p>{item.body}</p>
                  </div>
                </div>
                <div className="notification-showcase-actions">
                  <button className="btn btn-ghost" type="button" onClick={() => markOneRead(item.id)} disabled={item.isRead}>Open</button>
                  <button className="btn btn-secondary btn-sm" type="button" onClick={() => archiveNotification(item.id)}>Archive</button>
                </div>
              </article>
            ))}
            {!loading && inboxItems.length === 0 ? (
              <div className="empty-state empty-state--compact">
                <div className="empty-orb" />
                <h3>No notifications here</h3>
                <p>{activeFilter === 'all' ? 'Real class alerts, payment reminders, and announcements will appear here after launch.' : `No ${filterLabel.toLowerCase()} notifications are currently active.`}</p>
              </div>
            ) : null}
          </div>
        </div>

        <aside className="summary-card notification-summary-card">
          <div className="label-xs">This Week</div>
          <h3 className="workspace-card-title">Inbox summary</h3>
          <div className="summary-row">
            <div className="summary-meta"><span className="summary-dot summary-dot--red" /><span>Unread</span></div>
            <strong>{String(unreadCount).padStart(2, '0')}</strong>
          </div>
          <div className="summary-row">
            <div className="summary-meta"><span className="summary-dot summary-dot--teal" /><span>Live class alert</span></div>
            <strong>{String(liveClassCount).padStart(2, '0')}</strong>
          </div>
          <div className="summary-row">
            <div className="summary-meta"><span className="summary-dot summary-dot--amber" /><span>Payment reminder</span></div>
            <strong>{String(paymentCount).padStart(2, '0')}</strong>
          </div>
          <div className="summary-row">
            <div className="summary-meta"><span className="summary-dot summary-dot--red" /><span>System notice</span></div>
            <strong>{String(systemCount).padStart(2, '0')}</strong>
          </div>

          <div className="notification-summary-panel">
            <div className="label-xs">Quick Filters</div>
            <div className="filter-pills" style={{ marginTop: '10px' }}>
              {quickFilters.map((item) => (
                <button
                  key={item.key}
                  className={`filter-pill ${activeFilter === item.key ? 'filter-pill--active' : ''}`}
                  type="button"
                  onClick={() => setActiveFilter(item.key)}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div className="notification-summary-panel">
            <div className="label-xs">Auto clean-up</div>
            <p>{settingsOpen ? 'Settings are ready for future reminder rules. Archived notifications are hidden from this inbox.' : 'Archive resolved alerts after 7 days and keep critical broadcasts pinned.'}</p>
          </div>

          <button className="btn btn-ghost notification-summary-button" type="button" onClick={markAllRead} disabled={unreadCount === 0}>Mark All Read</button>
        </aside>
      </div>
    </div>
  )
}