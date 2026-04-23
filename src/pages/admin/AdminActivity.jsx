import { useActivity } from '../../hooks/useFirestore'
import { formatDate } from '../../utils/date'

const actionLabels = {
  user_signup: { icon: '👤', label: 'User signed up', color: '#1a237e' },
  roles_changed: { icon: '🔑', label: 'Roles changed', color: '#7c3aed' },
  coordinator_assigned: { icon: '🤝', label: 'Coordinator assigned', color: '#059669' },
  internship_created: { icon: '📋', label: 'Internship created', color: '#0891b2' },
  internship_approved: { icon: '✅', label: 'Internship approved', color: '#15803d' },
  internship_rejected: { icon: '❌', label: 'Internship rejected', color: '#b91c1c' },
  internship_status_changed: { icon: '🔄', label: 'Internship status changed', color: '#64748b' },
  internship_deleted: { icon: '🗑️', label: 'Internship deleted', color: '#b91c1c' },
  application_submitted: { icon: '📝', label: 'Application submitted', color: '#1d4ed8' },
  application_status_changed: { icon: '🔄', label: 'Application status changed', color: '#64748b' },
  message_submitted: { icon: '✉️', label: 'Message submitted', color: '#ca8a04' },
  message_status_changed: { icon: '🔄', label: 'Message status changed', color: '#64748b' },
}

function renderDetails(activity) {
  switch (activity.action) {
    case 'user_signup':
      return `${activity.displayName || activity.email || 'Unknown user'}`
    case 'roles_changed':
      return `Roles: ${(activity.newRoles || []).join(', ') || 'none'}${activity.actorEmail ? ` (by ${activity.actorEmail})` : ''}`
    case 'coordinator_assigned':
      return activity.coordinator ? `${activity.coordinator.name} (${activity.coordinator.email})` : 'Removed'
    case 'internship_created':
      return `"${activity.title}" at ${activity.company}`
    case 'internship_approved':
    case 'internship_rejected':
      return `${activity.internshipId}${activity.reason ? ` — ${activity.reason}` : ''}`
    case 'internship_status_changed':
      return `Status: ${activity.newStatus}`
    case 'application_submitted':
      return `${activity.applicantName} → "${activity.internshipTitle}"`
    case 'application_status_changed':
      return `Status: ${activity.newStatus}`
    case 'message_submitted':
      return `${activity.category}: "${activity.subject}"`
    case 'message_status_changed':
      return `Status: ${activity.newStatus}`
    default:
      return ''
  }
}

export default function AdminActivity() {
  const { data: activity, loading, error, retry } = useActivity({ limit: 100 })

  return (
    <div>
      <div className="page-header">
        <h1>Activity Log</h1>
        <span style={{ color: 'var(--nriva-text-light)', fontSize: 14 }}>
          Last {activity.length} events
        </span>
      </div>

      {error && (
        <div style={{
          background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 12,
          padding: '16px 20px', marginBottom: 16, display: 'flex',
          justifyContent: 'space-between', alignItems: 'center', gap: 12,
        }}>
          <div style={{ fontSize: 13, color: '#b91c1c' }}>{error}</div>
          <button className="btn btn-sm btn-outline" onClick={retry}>Retry</button>
        </div>
      )}

      {loading ? (
        <div className="empty-state"><p>Loading activity...</p></div>
      ) : activity.length === 0 ? (
        <div className="empty-state">
          <div style={{ fontSize: 48, marginBottom: 12 }}>📜</div>
          <h3>No activity yet</h3>
          <p>User actions will appear here as they happen.</p>
        </div>
      ) : (
        <div className="card">
          <div className="timeline" style={{ paddingLeft: 40 }}>
            {activity.map(a => {
              const cfg = actionLabels[a.action] || { icon: '•', label: a.action, color: '#64748b' }
              return (
                <div key={a.id} className="timeline-item" style={{ marginBottom: 14 }}>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'start' }}>
                    <span style={{ fontSize: 18 }}>{cfg.icon}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 500, color: cfg.color }}>
                        {cfg.label}
                      </div>
                      <div style={{ fontSize: 13, color: 'var(--nriva-text-light)', marginTop: 2 }}>
                        {renderDetails(a)}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--nriva-text-light)', marginTop: 4 }}>
                        {formatDate(a.createdAt)}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
