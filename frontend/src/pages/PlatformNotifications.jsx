import './PlatformPages.css'
import { studentNotifications } from './platformContent'

export default function PlatformNotifications() {
  const inboxItems = studentNotifications

  const unreadCount = 0
  const liveClassCount = inboxItems.filter((item) => item.tone === 'teal').length
  const paymentCount = inboxItems.filter((item) => item.tone === 'amber').length
  const systemCount = inboxItems.filter((item) => item.tone === 'coral').length

  const toneMeta = {
    purple: { label: 'Progress', chip: 'badge-purple' },
    teal: { label: 'Live Class', chip: 'badge-teal' },
    amber: { label: 'Payments', chip: 'badge-amber' },
    coral: { label: 'System', chip: 'badge-coral' },
  }

  return (
    <div className="workspace-page workspace-page--notifications animate-fade-up">
      <section className="workspace-hero notification-hero">
        <div className="workspace-hero-grid notification-hero-grid">
          <div className="workspace-hero-copy">
            <div className="label-xs" style={{ color: 'rgba(255,255,255,0.82)' }}>Inbox</div>
            <h1 className="gradient-text" style={{ WebkitTextFillColor: 'unset', color: '#fff' }}>
              Notifications that feel part of the platform
            </h1>
            <p>
              Track live classes, billing reminders, and study updates from one colored workspace instead of a flat white list.
            </p>
            <div className="workspace-hero-actions">
              <button className="btn btn-primary" type="button">Mark all as read</button>
              <button className="btn btn-secondary" type="button">Notification settings</button>
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
            <button className="filter-pill filter-pill--active" type="button">All</button>
            <button className="filter-pill" type="button">Unread</button>
            <button className="filter-pill" type="button">Live Classes</button>
            <button className="filter-pill" type="button">Payments</button>
            <button className="filter-pill" type="button">System</button>
          </div>
          <div className="notification-toolbar-note">No activity synced yet</div>
        </div>
      </section>

      <div className="workspace-columns-4">
        <div className="stat-tile stat-tile--purple">
          <div className="stat-tile-top"><span>Total inbox</span><span className="badge badge-purple">Today</span></div>
          <strong>{String(inboxItems.length).padStart(2, '0')}</strong>
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
              <p>Important updates are grouped in richer cards so the page does not read like a plain document.</p>
            </div>
            <span className="state-chip state-chip--neutral">4 Active</span>
          </div>
          <div className="workspace-card-body list-stack">
            {inboxItems.map((item) => (
              <article key={item.title} className={`notification-showcase notification-showcase--${item.tone}`}>
                <div className="notification-showcase-top">
                  <span className={`badge ${toneMeta[item.tone]?.chip || 'badge-purple'}`}>
                    {toneMeta[item.tone]?.label || 'Update'}
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
                  <button className="btn btn-ghost" type="button">Open</button>
                  <button className="btn btn-secondary btn-sm" type="button">Archive</button>
                </div>
              </article>
            ))}
            {inboxItems.length === 0 ? (
              <div className="empty-state empty-state--compact">
                <div className="empty-orb" />
                <h3>No notifications yet</h3>
                <p>Real class alerts, payment reminders, and announcements will appear here after launch.</p>
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
              <button className="filter-pill" type="button">Urgent</button>
              <button className="filter-pill" type="button">Classes</button>
              <button className="filter-pill" type="button">Payments</button>
              <button className="filter-pill" type="button">Progress</button>
            </div>
          </div>

          <div className="notification-summary-panel">
            <div className="label-xs">Auto clean-up</div>
            <p>Archive resolved alerts after 7 days and keep critical broadcasts pinned.</p>
          </div>

          <button className="btn btn-ghost notification-summary-button" type="button">Mark All Read</button>
        </aside>
      </div>
    </div>
  )
}
