import { useAuth } from '../context/AuthContext'
import './PlatformPages.css'
import { adminTransactions } from './platformContent'

function PaymentMethod({ method }) {
  if (method === 'JazzCash') {
    return <span className="payment-method-pill payment-method-pill--jazzcash"><span className="payment-method-icon">JC</span> JazzCash</span>
  }

  if (method === 'Card') {
    return (
      <span className="payment-method-pill payment-method-pill--card">
        <span className="payment-method-icon">
          <svg viewBox="0 0 24 24" width="10" height="10" fill="none" aria-hidden="true">
            <path d="M3 7h18v10H3V7Zm0 3h18" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
          </svg>
        </span>
        Card
      </span>
    )
  }

  return <span className="payment-method-pill payment-method-pill--card"><span className="payment-method-icon">EP</span> EasyPaisa</span>
}

function StatusBadge({ status }) {
  const normalized = status.toLowerCase()
  const className =
    normalized === 'paid'
      ? 'status-pill status-pill--paid'
      : normalized === 'pending'
        ? 'status-pill status-pill--pending'
        : normalized === 'failed'
          ? 'status-pill status-pill--failed'
          : normalized === 'refunded'
            ? 'status-pill status-pill--refunded'
            : 'status-pill status-pill--pending'

  return <span className={className}>{status}</span>
}

function StudentPayments() {
  return (
    <div className="workspace-page workspace-page--payments animate-fade-up">
      <section className="workspace-card pricing-card pricing-card--featured payments-active-plan">
        <div className="workspace-card-head">
          <div>
            <div className="label-xs">Active Plan</div>
            <h2 className="workspace-card-title">No active plan yet</h2>
            <p>Real subscription status will appear after the student purchases a plan.</p>
          </div>
          <span className="badge badge-purple">Inactive</span>
        </div>
        <div className="workspace-card-body">
          <div className="workspace-columns-3">
            <div className="metric-row"><span>Amount</span><strong>Rs 0</strong></div>
            <div className="metric-row"><span>Gateway</span><strong>Not selected</strong></div>
            <div className="metric-row"><span>Status</span><strong>Inactive</strong></div>
          </div>
        </div>
      </section>

      <div className="pricing-grid">
        <div className="pricing-card payments-plan-card">
          <div className="label-xs">Starter</div>
          <h3 className="workspace-card-title">Rs 4,999</h3>
          <p>Topic practice and basic analytics.</p>
          <button className="btn btn-secondary" type="button">Choose Plan</button>
        </div>
        <div className="pricing-card pricing-card--featured payments-plan-card">
          <div className="label-xs">Most Popular</div>
          <h3 className="workspace-card-title">Premium Plus</h3>
          <p>Everything needed for daily MDCAT preparation.</p>
          <button className="btn btn-primary" type="button">Current Plan</button>
        </div>
        <div className="pricing-card payments-plan-card">
          <div className="label-xs">Elite Mentorship</div>
          <h3 className="workspace-card-title">Rs 24,999</h3>
          <p>Live doubt support and mentor check-ins.</p>
          <button className="btn btn-ghost" type="button">Upgrade</button>
        </div>
      </div>

      <div className="workspace-card payments-history-card">
        <div className="workspace-card-head"><div><div className="label-xs">History</div><h3 className="workspace-card-title">Payment history</h3></div></div>
        <div className="workspace-card-body">
          <table className="simple-table">
            <thead>
              <tr><th>DATE</th><th>METHOD</th><th>AMOUNT</th><th>STATUS</th></tr>
            </thead>
            <tbody>
              <tr><td colSpan="4"><div className="empty-state empty-state--compact"><div className="empty-orb" /><h3>No payment history yet</h3><p>Real transactions will appear here after payment gateway activity starts.</p></div></td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function AdminPayments() {
  return (
    <div className="workspace-page workspace-page--payments animate-fade-up">
      <div className="workspace-columns-4">
        <div className="stat-tile"><span>Monthly Revenue</span><strong>Rs 0</strong><small>No transactions yet</small></div>
        <div className="stat-tile"><span>Refund Requests</span><strong>0</strong><small>No refund activity</small></div>
        <div className="stat-tile"><span>JazzCash Share</span><strong>0%</strong><small>No gateway data</small></div>
        <div className="stat-tile"><span>EasyPaisa Share</span><strong>0%</strong><small>No gateway data</small></div>
      </div>

      <div className="workspace-card payments-history-card">
        <div className="workspace-card-head"><div><div className="label-xs">Transactions</div><h2 className="workspace-card-title">Revenue stream</h2></div></div>
        <div className="workspace-card-body">
          <table className="simple-table">
            <thead><tr><th>STUDENT</th><th>AMOUNT</th><th>METHOD</th><th>STATUS</th><th>DATE</th><th>ACTION</th></tr></thead>
            <tbody>
              {adminTransactions.map((row) => (
                <tr key={`${row.student}-${row.date}`}>
                  <td>{row.student}</td>
                  <td><span className="amount-strong">{row.amount}</span></td>
                  <td><PaymentMethod method={row.method} /></td>
                  <td><StatusBadge status={row.status} /></td>
                  <td>{row.date}</td>
                  <td><button className="btn btn-ghost btn-sm" type="button">Refund</button></td>
                </tr>
              ))}
              {adminTransactions.length === 0 ? (
                <tr><td colSpan="6"><div className="empty-state empty-state--compact"><div className="empty-orb" /><h3>No transactions yet</h3><p>Revenue rows will appear after real student payments.</p></div></td></tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>

      <div className="pricing-grid">
        <div className="pricing-card payments-plan-card"><div className="label-xs">Starter Plan</div><h3 className="workspace-card-title">Rs 4,999</h3><p>Basic access and tests.</p></div>
        <div className="pricing-card payments-plan-card"><div className="label-xs">Premium Plus</div><h3 className="workspace-card-title">Rs 15,000</h3><p>Most popular annual plan.</p></div>
        <div className="pricing-card payments-plan-card"><div className="label-xs">Gateway Controls</div><h3 className="workspace-card-title">JazzCash / EasyPaisa / Card</h3><p>Master settlement and payout routing.</p></div>
      </div>
    </div>
  )
}

export default function PlatformPayments() {
  const { user } = useAuth()
  if (user?.role === 'admin') return <AdminPayments />
  return <StudentPayments />
}
