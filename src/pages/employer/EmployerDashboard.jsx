import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useInternships, useApplications } from '../../hooks/useFirestore'
import { rankCandidates } from '../../utils/matching'
import { formatDate } from '../../utils/date'
import { statusLabel, statusBadgeClass } from '../../utils/status'

export default function EmployerDashboard() {
  const { user } = useAuth()
  const { data: myPostings } = useInternships({ employerUid: user?.uid })
  const { data: allApps } = useApplications()
  const [selectedPostingId, setSelectedPostingId] = useState('')

  const activePosting = selectedPostingId
    ? myPostings.find(p => p.id === selectedPostingId)
    : myPostings.find(p => p.status === 'open') || myPostings[0]

  const appsForPosting = useMemo(() =>
    allApps.filter(a => a.internshipId === activePosting?.id),
    [allApps, activePosting?.id]
  )

  const topCandidates = useMemo(() => {
    if (!activePosting) return []
    return rankCandidates(appsForPosting, activePosting).slice(0, 3)
  }, [appsForPosting, activePosting])

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Employer Dashboard</h1>
          <p style={{ color: 'var(--nriva-text-light)', fontSize: 14, marginTop: 4 }}>
            Welcome back! Here&apos;s your hiring overview.
          </p>
        </div>
        <Link to="/employer/new-posting" className="btn btn-primary">
          + Post New Internship
        </Link>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Active Postings</div>
          <div className="stat-value">{myPostings.filter(p => p.status === 'open').length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total Applicants</div>
          <div className="stat-value">{allApps.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Shortlisted</div>
          <div className="stat-value" style={{ color: 'var(--nriva-success)' }}>{allApps.filter(a => a.status === 'shortlisted').length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Offers Sent</div>
          <div className="stat-value" style={{ color: 'var(--nriva-accent)' }}>
            {allApps.filter(a => ['offered', 'offer_accepted', 'offer_declined'].includes(a.status)).length}
          </div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ fontSize: 18, fontWeight: 600 }}>My Internship Postings</h2>
          <Link to="/employer/postings" style={{ color: 'var(--nriva-primary)', fontSize: 14, fontWeight: 500 }}>
            View All →
          </Link>
        </div>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr><th>Position</th><th>Status</th><th>Applicants</th><th>Deadline</th></tr>
            </thead>
            <tbody>
              {myPostings.length === 0 ? (
                <tr><td colSpan="4" style={{ textAlign: 'center', padding: 24, color: 'var(--nriva-text-light)' }}>
                  No postings yet. <Link to="/employer/new-posting" style={{ color: 'var(--nriva-primary)' }}>Create one →</Link>
                </td></tr>
              ) : myPostings.map(job => (
                <tr key={job.id}>
                  <td>
                    <div style={{ fontWeight: 500 }}>{job.title}</div>
                    <div style={{ fontSize: 12, color: 'var(--nriva-text-light)' }}>{job.company}</div>
                  </td>
                  <td><span className={`badge badge-${job.status === 'pending_approval' ? 'pending' : job.status || 'open'}`}>{job.status === 'pending_approval' ? 'Pending' : job.status}</span></td>
                  <td>{allApps.filter(a => a.internshipId === job.id).length}</td>
                  <td>{formatDate(job.deadline)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Top Candidates section */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h2 style={{ fontSize: 18, fontWeight: 600 }}>🏆 Top Candidates</h2>
          <Link to="/employer/applicants" style={{ color: 'var(--nriva-primary)', fontSize: 14, fontWeight: 500 }}>
            View All →
          </Link>
        </div>

        {myPostings.length > 1 && (
          <select className="form-control" style={{ marginBottom: 16, maxWidth: 400 }}
            value={activePosting?.id || ''} onChange={(e) => setSelectedPostingId(e.target.value)}>
            {myPostings.map(p => (
              <option key={p.id} value={p.id}>{p.title} ({allApps.filter(a => a.internshipId === p.id).length} applicants)</option>
            ))}
          </select>
        )}

        {topCandidates.length === 0 ? (
          <p style={{ color: 'var(--nriva-text-light)', fontSize: 14, padding: '12px 0' }}>
            No applicants yet for {activePosting?.title || 'this internship'}.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {topCandidates.map((c, idx) => (
              <Link key={c.id} to="/employer/applicants" style={{ textDecoration: 'none', color: 'inherit' }}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  padding: '14px 16px', border: '1px solid var(--nriva-border)', borderRadius: 10,
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--nriva-primary)'}
                onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--nriva-border)'}>
                  <div style={{
                    width: 36, height: 36, borderRadius: '50%',
                    background: idx === 0 ? '#fef3c7' : '#e8eaf6',
                    color: idx === 0 ? '#92400e' : 'var(--nriva-primary)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 700, fontSize: 14, flexShrink: 0,
                  }}>#{idx + 1}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{c.applicantName}</div>
                    <div style={{ fontSize: 12, color: 'var(--nriva-text-light)', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <span>{c.school || c.email || '—'}</span>
                      {c.gradeLevel && <span>· {c.gradeLevel}</span>}
                      {c.linkedIn && <span style={{ color: '#0077b5' }}>· LinkedIn</span>}
                      {c.resumeUrl && <span style={{ color: '#15803d' }}>· Resume</span>}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                    <span className={`badge badge-${statusBadgeClass(c.status)}`}>
                      {statusLabel(c.status)}
                    </span>
                    <div style={{
                      fontSize: 18, fontWeight: 700,
                      color: c.match.overall >= 75 ? '#15803d' : c.match.overall >= 50 ? '#ca8a04' : '#dc2626',
                    }}>
                      {c.match.overall}%
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
