import { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useApplications } from '../../hooks/useFirestore'

const statusLabels = {
  pending: { label: 'Pending', class: 'pending' },
  under_review: { label: 'Under Review', class: 'pending' },
  shortlisted: { label: 'Shortlisted', class: 'open' },
  accepted: { label: 'Accepted', class: 'filled' },
  rejected: { label: 'Not Selected', class: 'closed' },
}

export default function InternApplications() {
  const { user } = useAuth()
  const { data: sampleApplications } = useApplications({ applicantUid: user?.uid })
  const [selected, setSelected] = useState(null)

  return (
    <div>
      <div className="page-header">
        <h1>My Applications</h1>
        <span style={{ color: 'var(--nriva-text-light)', fontSize: 14 }}>
          {sampleApplications.length} total applications
        </span>
      </div>

      <div className="card">
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Position</th>
                <th>Company</th>
                <th>Applied Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sampleApplications.map(app => {
                const status = statusLabels[app.status] || statusLabels.pending
                return (
                  <tr key={app.id}>
                    <td style={{ fontWeight: 500 }}>{app.internshipTitle}</td>
                    <td>{app.company}</td>
                    <td>{new Date(app.appliedDate).toLocaleDateString()}</td>
                    <td>
                      <span className={`badge badge-${status.class}`}>{status.label}</span>
                    </td>
                    <td>
                      <button className="btn btn-sm btn-outline" onClick={() => setSelected(app)}>
                        View Details
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {selected && (
        <div className="modal-overlay" onClick={() => setSelected(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Application Details</h2>
              <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer' }}>✕</button>
            </div>
            <div className="modal-body">
              <div style={{ marginBottom: 20 }}>
                <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 4 }}>{selected.internshipTitle}</h3>
                <p style={{ color: 'var(--nriva-text-light)' }}>{selected.company}</p>
              </div>

              <div style={{
                display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16,
                padding: '16px 0', borderTop: '1px solid var(--nriva-border)', borderBottom: '1px solid var(--nriva-border)',
                marginBottom: 20,
              }}>
                <div>
                  <div style={{ fontSize: 12, color: 'var(--nriva-text-light)' }}>Applied Date</div>
                  <div style={{ fontWeight: 500, fontSize: 14 }}>{new Date(selected.appliedDate).toLocaleDateString()}</div>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: 'var(--nriva-text-light)' }}>Status</div>
                  <span className={`badge badge-${statusLabels[selected.status]?.class || 'pending'}`}>
                    {statusLabels[selected.status]?.label || selected.status}
                  </span>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: 'var(--nriva-text-light)' }}>University</div>
                  <div style={{ fontWeight: 500, fontSize: 14 }}>{selected.university}</div>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: 'var(--nriva-text-light)' }}>Major</div>
                  <div style={{ fontWeight: 500, fontSize: 14 }}>{selected.major}</div>
                </div>
              </div>

              <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>Application Timeline</h4>
              <div className="timeline">
                <div className="timeline-item">
                  <div className="timeline-date">{new Date(selected.appliedDate).toLocaleDateString()}</div>
                  <div className="timeline-content">Application submitted</div>
                </div>
                {selected.status !== 'pending' && (
                  <div className="timeline-item">
                    <div className="timeline-date">{new Date(new Date(selected.appliedDate).getTime() + 86400000 * 2).toLocaleDateString()}</div>
                    <div className="timeline-content">Application received and under review</div>
                  </div>
                )}
                {(selected.status === 'shortlisted' || selected.status === 'accepted') && (
                  <div className="timeline-item">
                    <div className="timeline-date">{new Date(new Date(selected.appliedDate).getTime() + 86400000 * 5).toLocaleDateString()}</div>
                    <div className="timeline-content">Shortlisted for interview</div>
                  </div>
                )}
                {selected.status === 'accepted' && (
                  <div className="timeline-item">
                    <div className="timeline-date">{new Date(new Date(selected.appliedDate).getTime() + 86400000 * 10).toLocaleDateString()}</div>
                    <div className="timeline-content">Offer extended - Accepted!</div>
                  </div>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setSelected(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
