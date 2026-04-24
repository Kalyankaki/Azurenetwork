import { Link } from 'react-router-dom'
import { useInternships, useApplications, useMessages, useUsers } from '../../hooks/useFirestore'
import { INTERNSHIP_STATUSES, isSuperAdmin } from '../../services/firestore'
import { statusLabel } from '../../utils/status'

const STALE_DAYS = 7

function daysSince(ts) {
  if (!ts) return 999
  const d = ts.toDate ? ts.toDate() : ts.seconds ? new Date(ts.seconds * 1000) : new Date(ts)
  return Math.floor((Date.now() - d.getTime()) / (1000 * 60 * 60 * 24))
}

export default function AdminDashboard() {
  const { data: internships } = useInternships()
  const { data: applications } = useApplications()
  const { data: messages } = useMessages()
  const { data: users } = useUsers()

  // Counts
  const openPositions = internships.filter(i => i.status === 'open').length
  const pendingApprovals = internships.filter(i => i.status === INTERNSHIP_STATUSES.PENDING_APPROVAL).length
  const openMessages = messages.filter(m => m.status === 'open').length
  const resolvedMessages = messages.filter(m => m.status === 'resolved').length
  const pendingUsers = users.filter(u => {
    if (isSuperAdmin(u.email)) return false
    return !(u.roles || []).length
  }).length

  // Pipeline funnel
  const pipeline = {
    total: applications.length,
    pending: applications.filter(a => a.status === 'pending').length,
    under_review: applications.filter(a => a.status === 'under_review').length,
    shortlisted: applications.filter(a => a.status === 'shortlisted').length,
    offered: applications.filter(a => a.status === 'offered').length,
    offer_accepted: applications.filter(a => a.status === 'offer_accepted').length,
    offer_declined: applications.filter(a => a.status === 'offer_declined').length,
    rejected: applications.filter(a => a.status === 'rejected').length,
  }

  // Stale applications (pending/under_review for > STALE_DAYS)
  const staleApps = applications.filter(a =>
    (a.status === 'pending' || a.status === 'under_review') &&
    daysSince(a.appliedDate) > STALE_DAYS
  )

  // Offers pending response
  const pendingOffers = applications.filter(a => a.status === 'offered')

  // Employer performance
  const employerMap = {}
  internships.forEach(i => {
    const key = i.employerUid || i.employerName || 'unknown'
    if (!employerMap[key]) employerMap[key] = { name: i.employerName || 'Unknown', postings: 0, apps: 0, reviewed: 0, offered: 0, accepted: 0 }
    employerMap[key].postings++
  })
  applications.forEach(a => {
    const intern = internships.find(i => i.id === a.internshipId)
    const key = intern?.employerUid || intern?.employerName || 'unknown'
    if (employerMap[key]) {
      employerMap[key].apps++
      if (['under_review', 'shortlisted', 'offered', 'offer_accepted', 'rejected'].includes(a.status)) employerMap[key].reviewed++
      if (['offered', 'offer_accepted', 'offer_declined'].includes(a.status)) employerMap[key].offered++
      if (a.status === 'offer_accepted') employerMap[key].accepted++
    }
  })
  const employers = Object.values(employerMap).sort((a, b) => b.postings - a.postings)

  // Intern placement tracker
  const placed = applications.filter(a => a.status === 'offer_accepted').length
  const lookingInterns = users.filter(u => (u.roles || []).includes('intern')).length
  const withOffers = new Set(applications.filter(a => a.status === 'offered').map(a => a.applicantUid)).size

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Program Dashboard</h1>
          <p style={{ color: 'var(--nriva-text-light)', fontSize: 14, marginTop: 4 }}>
            NRIVA Internship Program Overview
          </p>
        </div>
      </div>

      {/* Alert banners */}
      {pendingApprovals > 0 && (
        <Link to="/admin/internships" style={{ textDecoration: 'none' }}>
          <AlertBanner icon="⏳" color="#f59e0b" bg="#fffbeb" border="#fbbf24"
            title={`${pendingApprovals} internship${pendingApprovals === 1 ? '' : 's'} awaiting approval`}
            subtitle="Review before students can see them" badge={`${pendingApprovals} pending`} />
        </Link>
      )}
      {staleApps.length > 0 && (
        <Link to="/admin/applications" style={{ textDecoration: 'none' }}>
          <AlertBanner icon="🚨" color="#dc2626" bg="#fef2f2" border="#fecaca"
            title={`${staleApps.length} application${staleApps.length === 1 ? '' : 's'} waiting ${STALE_DAYS}+ days with no review`}
            subtitle="Students are waiting — please follow up with employers" badge={`${staleApps.length} stale`} />
        </Link>
      )}
      {pendingOffers.length > 0 && (
        <AlertBanner icon="📩" color="#7c3aed" bg="#f5f3ff" border="#c4b5fd"
          title={`${pendingOffers.length} offer${pendingOffers.length === 1 ? '' : 's'} waiting for intern response`}
          subtitle={pendingOffers.slice(0, 3).map(a => a.applicantName).join(', ')} badge={`${pendingOffers.length} pending`} />
      )}
      {pendingUsers > 0 && (
        <Link to="/admin/users" style={{ textDecoration: 'none' }}>
          <AlertBanner icon="👤" color="#7c3aed" bg="#f5f3ff" border="#a78bfa"
            title={`${pendingUsers} user${pendingUsers === 1 ? '' : 's'} awaiting role assignment`}
            subtitle="Sign up completed but no roles assigned" badge={`${pendingUsers} pending`} />
        </Link>
      )}
      {openMessages > 0 && (
        <Link to="/admin/messages" style={{ textDecoration: 'none' }}>
          <AlertBanner icon="✉️" color="#c2410c" bg="#fff7ed" border="#fbbf24"
            title="Messages & Issues"
            subtitle={`${openMessages} open · ${resolvedMessages} resolved`}
            badge={openMessages > 0 ? `${openMessages} need attention` : null} />
        </Link>
      )}

      {/* Key stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Open Internships</div>
          <div className="stat-value">{openPositions}</div>
          <div style={{ fontSize: 12, color: 'var(--nriva-text-light)', marginTop: 4 }}>of {internships.length} total</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total Applications</div>
          <div className="stat-value">{pipeline.total}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Interns Placed</div>
          <div className="stat-value" style={{ color: 'var(--nriva-success)' }}>{placed}</div>
          <div style={{ fontSize: 12, color: 'var(--nriva-text-light)', marginTop: 4 }}>{withOffers} with pending offers</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Registered Interns</div>
          <div className="stat-value">{lookingInterns}</div>
        </div>
      </div>

      {/* Pipeline funnel */}
      <div className="card" style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>Application Pipeline</h2>
        <div style={{ display: 'flex', gap: 4, marginBottom: 16 }}>
          {[
            { key: 'pending', label: 'Pending', color: '#f59e0b' },
            { key: 'under_review', label: 'Reviewing', color: '#3b82f6' },
            { key: 'shortlisted', label: 'Shortlisted', color: '#8b5cf6' },
            { key: 'offered', label: 'Offered', color: '#06b6d4' },
            { key: 'offer_accepted', label: 'Accepted', color: '#22c55e' },
            { key: 'rejected', label: 'Rejected', color: '#ef4444' },
          ].map(stage => {
            const count = pipeline[stage.key] || 0
            const pct = pipeline.total > 0 ? Math.max(2, (count / pipeline.total) * 100) : 0
            return (
              <div key={stage.key} style={{ flex: pct, minWidth: count > 0 ? 40 : 0, textAlign: 'center' }}>
                <div style={{
                  background: stage.color, height: 32, borderRadius: 4,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'white', fontSize: 12, fontWeight: 700,
                }}>
                  {count > 0 ? count : ''}
                </div>
                <div style={{ fontSize: 10, color: 'var(--nriva-text-light)', marginTop: 4 }}>{stage.label}</div>
              </div>
            )
          })}
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 16, fontSize: 12, color: 'var(--nriva-text-light)' }}>
          <span>Conversion: {pipeline.total > 0 ? Math.round((pipeline.offer_accepted / pipeline.total) * 100) : 0}% placed</span>
          <span>·</span>
          <span>{pipeline.offered + pipeline.offer_accepted + pipeline.offer_declined} offers sent</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: window.innerWidth > 768 ? '1fr 1fr' : '1fr', gap: 24 }}>
        {/* Employer Performance */}
        <div className="card">
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Employer Performance</h3>
          {employers.length === 0 ? (
            <p style={{ color: 'var(--nriva-text-light)', fontSize: 13 }}>No employer data yet.</p>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead><tr><th>Employer</th><th>Apps</th><th>Reviewed</th><th>Offers</th></tr></thead>
                <tbody>
                  {employers.slice(0, 8).map((e, i) => {
                    const reviewRate = e.apps > 0 ? Math.round((e.reviewed / e.apps) * 100) : 0
                    return (
                      <tr key={i}>
                        <td style={{ fontWeight: 500, fontSize: 13 }}>{e.name}</td>
                        <td style={{ fontSize: 13 }}>{e.apps}</td>
                        <td>
                          <span style={{ fontWeight: 600, color: reviewRate >= 80 ? '#15803d' : reviewRate >= 50 ? '#ca8a04' : '#dc2626', fontSize: 13 }}>
                            {reviewRate}%
                          </span>
                        </td>
                        <td style={{ fontSize: 13 }}>{e.offered} sent · {e.accepted} accepted</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Quick Actions + Intern Tracker */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card">
            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Quick Actions</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <Link to="/admin/internships" className="btn btn-outline" style={{ justifyContent: 'center' }}>Manage Internships</Link>
              <Link to="/admin/applications" className="btn btn-outline" style={{ justifyContent: 'center' }}>Review Applications</Link>
              <Link to="/admin/messages" className="btn btn-outline" style={{ justifyContent: 'center' }}>View Messages</Link>
              <Link to="/admin/users" className="btn btn-outline" style={{ justifyContent: 'center' }}>Manage Users</Link>
              <Link to="/admin/reports" className="btn btn-outline" style={{ justifyContent: 'center' }}>View Reports</Link>
            </div>
          </div>

          <div className="card">
            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>Internships by Status</h3>
            {['open', 'pending_approval', 'closed', 'filled', 'rejected'].map(status => {
              const count = internships.filter(i => i.status === status).length
              if (count === 0) return null
              const pct = internships.length > 0 ? Math.round((count / internships.length) * 100) : 0
              return (
                <div key={status} style={{ marginBottom: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 3 }}>
                    <span style={{ textTransform: 'capitalize' }}>{status.replace('_', ' ')}</span>
                    <span style={{ fontWeight: 600 }}>{count}</span>
                  </div>
                  <div style={{ height: 6, background: '#e2e8f0', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{
                      height: '100%', width: `${pct}%`, borderRadius: 3,
                      background: status === 'open' ? '#22c55e' : status === 'pending_approval' ? '#f59e0b' : status === 'filled' ? '#3b82f6' : '#94a3b8',
                    }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

function AlertBanner({ icon, color, bg, border, title, subtitle, badge }) {
  return (
    <div className="card" style={{ marginBottom: 12, padding: '14px 20px', border: `2px solid ${border}`, background: bg }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 22 }}>{icon}</span>
          <div>
            <div style={{ fontWeight: 600, fontSize: 14, color }}>{title}</div>
            <div style={{ fontSize: 12, color, opacity: 0.8 }}>{subtitle}</div>
          </div>
        </div>
        {badge && (
          <span style={{ background: color, color: 'white', padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700 }}>
            {badge}
          </span>
        )}
      </div>
    </div>
  )
}
