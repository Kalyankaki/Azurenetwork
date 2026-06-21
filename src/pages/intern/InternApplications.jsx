import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useApplications } from '../../hooks/useFirestore'
import { acceptOffer, getUser, updateApplicationStatus } from '../../services/firestore'
import { formatDate, addDays } from '../../utils/date'

const statusLabels = {
  pending: { label: 'Pending', class: 'pending' },
  under_review: { label: 'Under Review', class: 'pending' },
  shortlisted: { label: 'Shortlisted', class: 'open' },
  accepted: { label: 'Accepted', class: 'filled' },
  offered: { label: 'Offer Received', class: 'open' },
  offer_accepted: { label: 'Offer Accepted', class: 'filled' },
  offer_declined: { label: 'Offer Declined', class: 'closed' },
  rejected: { label: 'Not Selected', class: 'closed' },
}

export default function InternApplications() {
  const { user } = useAuth()
  const { data: sampleApplications } = useApplications({ applicantUid: user?.uid })
  const [selected, setSelected] = useState(null)
  const [profile, setProfile] = useState(null)
  const [acceptError, setAcceptError] = useState(null)

  useEffect(() => {
    if (user?.uid) getUser(user.uid).then(setProfile).catch(() => {})
  }, [user?.uid])

  const isPlaced = !!profile?.placedInternshipId
  const placedAt = profile?.placedCompany || profile?.placedInternshipTitle

  return (
    <div>
      <div className="page-header">
        <h1>My Applications</h1>
        <span style={{ color: 'var(--nriva-text-light)', fontSize: 14 }}>
          {sampleApplications.length} total applications
        </span>
      </div>

      {isPlaced && (
        <div style={{
          background: '#dcfce7', border: '1px solid #86efac', borderRadius: 10,
          padding: '14px 18px', marginBottom: 16, fontSize: 14, color: '#166534',
        }}>
          🎉 <strong>You&apos;re placed at {placedAt || 'an internship'}.</strong>{' '}
          You&apos;ve already accepted an offer; an intern can only accept one. All your other
          open applications have been auto-declined.
        </div>
      )}

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
                    <td>{formatDate(app.appliedDate)}</td>
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
                  <div style={{ fontWeight: 500, fontSize: 14 }}>{formatDate(selected.appliedDate)}</div>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: 'var(--nriva-text-light)' }}>Status</div>
                  <span className={`badge badge-${statusLabels[selected.status]?.class || 'pending'}`}>
                    {statusLabels[selected.status]?.label || selected.status}
                  </span>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: 'var(--nriva-text-light)' }}>School</div>
                  <div style={{ fontWeight: 500, fontSize: 14 }}>{selected.school || selected.university || '—'}</div>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: 'var(--nriva-text-light)' }}>Major</div>
                  <div style={{ fontWeight: 500, fontSize: 14 }}>{selected.major || '—'}</div>
                </div>
              </div>

              <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>Application Timeline</h4>
              <div className="timeline">
                <div className="timeline-item">
                  <div className="timeline-date">{formatDate(selected.appliedDate)}</div>
                  <div className="timeline-content">Application submitted</div>
                </div>
                {selected.status !== 'pending' && (
                  <div className="timeline-item">
                    <div className="timeline-date">{formatDate(addDays(selected.appliedDate, 2))}</div>
                    <div className="timeline-content">Application received and under review</div>
                  </div>
                )}
                {(selected.status === 'shortlisted' || selected.status === 'offered' || selected.status === 'offer_accepted' || selected.status === 'offer_declined' || selected.status === 'accepted') && (
                  <div className="timeline-item">
                    <div className="timeline-date">{formatDate(addDays(selected.appliedDate, 5))}</div>
                    <div className="timeline-content">Shortlisted</div>
                  </div>
                )}
                {(selected.status === 'offered' || selected.status === 'offer_accepted' || selected.status === 'offer_declined') && (
                  <div className="timeline-item">
                    <div className="timeline-date">{formatDate(addDays(selected.appliedDate, 7))}</div>
                    <div className="timeline-content">Offer extended by employer</div>
                  </div>
                )}
                {selected.status === 'offer_accepted' && (
                  <div className="timeline-item">
                    <div className="timeline-date">{formatDate(addDays(selected.appliedDate, 8))}</div>
                    <div className="timeline-content">You accepted the offer! 🎉</div>
                  </div>
                )}
                {selected.status === 'offer_declined' && (
                  <div className="timeline-item">
                    <div className="timeline-date">{formatDate(addDays(selected.appliedDate, 8))}</div>
                    <div className="timeline-content">Offer declined</div>
                  </div>
                )}
                {selected.status === 'accepted' && (
                  <div className="timeline-item">
                    <div className="timeline-date">{formatDate(addDays(selected.appliedDate, 10))}</div>
                    <div className="timeline-content">Offer extended - Accepted!</div>
                  </div>
                )}
              </div>
            </div>
            {selected.status === 'offered' && (
              <div style={{ padding: '0 24px 16px' }}>
                <div style={{ background: '#dcfce7', border: '1px solid #86efac', borderRadius: 10, padding: 16, textAlign: 'center' }}>
                  <div style={{ fontSize: 28, marginBottom: 8 }}>🎉</div>
                  <h4 style={{ fontSize: 16, fontWeight: 600, color: '#15803d', marginBottom: 8 }}>
                    You&apos;ve received an offer!
                  </h4>
                  <p style={{ fontSize: 13, color: '#166534', marginBottom: 8 }}>
                    {selected.company} has offered you the {selected.internshipTitle} position. Would you like to accept?
                  </p>
                  {isPlaced ? (
                    <p style={{ fontSize: 12, color: '#92400e', marginBottom: 12 }}>
                      You&apos;ve already accepted an offer at <strong>{placedAt}</strong>. An intern can only accept one offer.
                      Decline this if you no longer want it.
                    </p>
                  ) : (
                    <p style={{ fontSize: 11, color: '#166534', marginBottom: 12, fontStyle: 'italic' }}>
                      Reminder: you can only accept one offer. Accepting will auto-decline <strong>all</strong> your other open applications (pending, under review, shortlisted, and offered).
                    </p>
                  )}
                  {acceptError && (
                    <p style={{ fontSize: 12, color: '#dc2626', marginBottom: 12 }}>{acceptError}</p>
                  )}
                  <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                    <button className="btn btn-success" disabled={isPlaced} onClick={async () => {
                      setAcceptError(null)
                      try {
                        await acceptOffer({
                          applicationId: selected.id,
                          applicantUid: user.uid,
                          internshipId: selected.internshipId,
                          internshipTitle: selected.internshipTitle,
                          company: selected.company,
                        })
                        setSelected({ ...selected, status: 'offer_accepted' })
                        const fresh = await getUser(user.uid)
                        if (fresh) setProfile(fresh)
                      } catch (err) {
                        setAcceptError(err?.code === 'permission-denied'
                          ? "You've already accepted an offer; only one acceptance is allowed."
                          : (err?.message || 'Could not accept offer.'))
                      }
                    }}>
                      Accept Offer
                    </button>
                    <button className="btn btn-outline" style={{ color: '#dc2626', borderColor: '#dc2626' }} onClick={async () => {
                      await updateApplicationStatus(selected.id, 'offer_declined')
                      setSelected({ ...selected, status: 'offer_declined' })
                    }}>
                      Decline
                    </button>
                  </div>
                </div>
              </div>
            )}
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setSelected(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
