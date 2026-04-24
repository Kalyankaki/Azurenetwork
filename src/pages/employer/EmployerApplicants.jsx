import { useState, useMemo } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useApplications, useInternships } from '../../hooks/useFirestore'
import { updateApplicationStatus } from '../../services/firestore'
import { rankCandidates } from '../../utils/matching'
import { formatDate } from '../../utils/date'
import Toast from '../../components/Toast'

const statusLabels = {
  pending: 'Pending',
  under_review: 'Under Review',
  shortlisted: 'Shortlisted',
  accepted: 'Accepted',
  offered: 'Offer Sent',
  offer_accepted: 'Offer Accepted',
  offer_declined: 'Offer Declined',
  rejected: 'Rejected',
}

const statusBadgeClass = {
  pending: 'pending',
  under_review: 'pending',
  shortlisted: 'open',
  accepted: 'filled',
  offered: 'pending',
  offer_accepted: 'filled',
  offer_declined: 'closed',
  rejected: 'closed',
}

export default function EmployerApplicants() {
  const { user } = useAuth()
  const { data: applications } = useApplications()
  const { data: internships } = useInternships({ employerUid: user?.uid })
  const [selected, setSelected] = useState(null)
  const [toast, setToast] = useState(null)
  const [selectedInternshipId, setSelectedInternshipId] = useState('')
  const [activeTab, setActiveTab] = useState('top') // 'top' | 'all'
  const [filters, setFilters] = useState({ minMatch: 50, minAvail: 0, search: '' })

  // Auto-pick first internship if none selected
  const activeInternshipId = selectedInternshipId || internships[0]?.id || ''
  const activeInternship = internships.find(i => i.id === activeInternshipId)

  // Apps for this internship
  const appsForInternship = useMemo(
    () => applications.filter(a => a.internshipId === activeInternshipId),
    [applications, activeInternshipId]
  )

  const ranked = useMemo(() => {
    if (!activeInternship) return []
    return rankCandidates(appsForInternship, activeInternship)
  }, [appsForInternship, activeInternship])

  const top5 = ranked.slice(0, 5)
  const allMatches = ranked.filter(c => c?.match?.overall >= filters.minMatch && c?.match?.availability >= filters.minAvail)
    .filter(c => {
      if (!filters.search) return true
      const q = filters.search.toLowerCase()
      return (c.applicantName || '').toLowerCase().includes(q) ||
        (c.school || '').toLowerCase().includes(q) ||
        (c.relevantSkills || '').toLowerCase().includes(q)
    })

  const updateStatus = async (id, newStatus) => {
    try {
      await updateApplicationStatus(id, newStatus)
      setToast(`Status updated to ${statusLabels[newStatus]}`)
      if (selected?.id === id) setSelected({ ...selected, status: newStatus })
    } catch (err) {
      setToast('Error: ' + err.message)
    }
  }

  if (internships.length === 0) {
    return (
      <div>
        <div className="page-header"><h1>Applicants</h1></div>
        <div className="empty-state">
          <h3>No internships posted yet</h3>
          <p>Post your first internship to start receiving applications.</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="page-header">
        <h1>Applicants</h1>
      </div>

      {/* Internship selector */}
      <div className="card" style={{ marginBottom: 16 }}>
        <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--nriva-text-light)', marginBottom: 8, display: 'block' }}>
          Select Internship
        </label>
        <select className="form-control" value={activeInternshipId}
          onChange={(e) => setSelectedInternshipId(e.target.value)}>
          {internships.map(i => (
            <option key={i.id} value={i.id}>
              {i.title} · {i.company} ({applications.filter(a => a.internshipId === i.id).length} applicants)
            </option>
          ))}
        </select>
      </div>

      {/* Tabs */}
      <div className="tabs" style={{ marginBottom: 16 }}>
        <button className={`tab ${activeTab === 'top' ? 'active' : ''}`} onClick={() => setActiveTab('top')}>
          🏆 Top 5 Candidates
        </button>
        <button className={`tab ${activeTab === 'all' ? 'active' : ''}`} onClick={() => setActiveTab('all')}>
          📋 All Matches ({ranked.filter(c => c.match.overall >= 50).length})
        </button>
      </div>

      {appsForInternship.length === 0 ? (
        <div className="empty-state">
          <h3>No applications yet</h3>
          <p>Applications for this internship will appear here.</p>
        </div>
      ) : activeTab === 'top' ? (
        <TopCandidates candidates={top5} onSelect={setSelected} internship={activeInternship} />
      ) : (
        <AllMatches candidates={allMatches} filters={filters} setFilters={setFilters} onSelect={setSelected} />
      )}

      {selected && (
        <ApplicantModal selected={selected} internship={activeInternship}
          onClose={() => setSelected(null)} onUpdateStatus={updateStatus} />
      )}

      {toast && <Toast message={toast} type="success" onClose={() => setToast(null)} />}
    </div>
  )
}

function MatchBar({ score, label }) {
  const color = score >= 75 ? '#15803d' : score >= 50 ? '#ca8a04' : '#dc2626'
  return (
    <div style={{ fontSize: 11 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
        <span style={{ color: 'var(--nriva-text-light)' }}>{label}</span>
        <span style={{ fontWeight: 600, color }}>{score}%</span>
      </div>
      <div style={{ height: 4, background: '#e2e8f0', borderRadius: 2, overflow: 'hidden' }}>
        <div style={{ width: `${score}%`, height: '100%', background: color, transition: 'width 0.3s' }} />
      </div>
    </div>
  )
}

function TopCandidates({ candidates, onSelect }) {
  if (candidates.length === 0) {
    return <div className="empty-state"><p>No candidates to rank yet.</p></div>
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {candidates.map((c, idx) => (
        <div key={c.id} className="card" style={{ display: 'flex', gap: 16, alignItems: 'flex-start', cursor: 'pointer' }}
          onClick={() => onSelect(c)}>
          <div style={{
            width: 48, height: 48, borderRadius: '50%',
            background: idx === 0 ? '#fef3c7' : '#e8eaf6',
            color: idx === 0 ? '#92400e' : 'var(--nriva-primary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 700, fontSize: 18, flexShrink: 0,
          }}>
            #{idx + 1}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 600 }}>{c.applicantName}</h3>
                <p style={{ fontSize: 13, color: 'var(--nriva-text-light)' }}>
                  {c.school || 'Unknown school'} · {c.gradeLevel || 'Grade unknown'}
                </p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 24, fontWeight: 700, color: c.match.overall >= 75 ? '#15803d' : '#ca8a04' }}>
                  {c.match.overall}%
                </div>
                <div style={{ fontSize: 11, color: 'var(--nriva-text-light)' }}>match</div>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 10 }}>
              <MatchBar score={c.match.skills} label="Skills" />
              <MatchBar score={c.match.availability} label="Availability" />
              <MatchBar score={c.match.hours} label="Hours" />
              <MatchBar score={c.match.interest} label="Interest Fit" />
              <MatchBar score={c.match.grade} label="Grade Level" />
              <MatchBar score={c.match.experience} label="Experience" />
            </div>
            {c.match.matchedSkills.length > 0 && (
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
                {c.match.matchedSkills.slice(0, 5).map(s => (
                  <span key={s} style={{ background: '#dcfce7', color: '#15803d', padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 500 }}>
                    ✓ {s}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

function AllMatches({ candidates, filters, setFilters, onSelect }) {
  return (
    <>
      <div className="filter-bar">
        <input className="search-input" placeholder="Search by name, school, or skills..."
          value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })} />
        <select className="filter-select" value={filters.minMatch}
          onChange={(e) => setFilters({ ...filters, minMatch: parseInt(e.target.value, 10) })}>
          <option value={50}>Match ≥ 50%</option>
          <option value={70}>Match ≥ 70%</option>
          <option value={85}>Match ≥ 85%</option>
        </select>
        <select className="filter-select" value={filters.minAvail}
          onChange={(e) => setFilters({ ...filters, minAvail: parseInt(e.target.value, 10) })}>
          <option value={0}>Any availability</option>
          <option value={50}>Availability ≥ 50%</option>
          <option value={80}>Availability ≥ 80%</option>
        </select>
      </div>

      <div className="card">
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Candidate</th>
                <th>Match</th>
                <th>Availability</th>
                <th>Hours</th>
                <th>Skills Matched</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {candidates.length === 0 && (
                <tr><td colSpan="7" style={{ textAlign: 'center', padding: 40, color: 'var(--nriva-text-light)' }}>
                  No candidates meet the filter criteria.
                </td></tr>
              )}
              {candidates.map(c => (
                <tr key={c.id}>
                  <td>
                    <div style={{ fontWeight: 500, fontSize: 14 }}>{c.applicantName}</div>
                    <div style={{ fontSize: 12, color: 'var(--nriva-text-light)' }}>
                      {c.school || '—'} · {c.gradeLevel || '—'}
                    </div>
                  </td>
                  <td>
                    <span style={{
                      fontWeight: 700, fontSize: 16,
                      color: c.match.overall >= 75 ? '#15803d' : c.match.overall >= 50 ? '#ca8a04' : '#64748b',
                    }}>
                      {c.match.overall}%
                    </span>
                  </td>
                  <td>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>{c.match.availability}%</div>
                    <div style={{ fontSize: 11, color: 'var(--nriva-text-light)' }}>
                      {c.availableFrom ? formatDate(c.availableFrom) : '—'}
                      {c.availableTo ? ` → ${formatDate(c.availableTo)}` : ''}
                    </div>
                  </td>
                  <td style={{ fontSize: 13 }}>
                    <div>{c.hoursPerDay || '—'}</div>
                    <div style={{ fontSize: 11, color: 'var(--nriva-text-light)' }}>{c.match.hours}% fit</div>
                  </td>
                  <td style={{ fontSize: 12 }}>
                    <div style={{ fontWeight: 600 }}>{c.match.matchedSkills.length} skills</div>
                    <div style={{ color: 'var(--nriva-text-light)', fontSize: 11 }}>
                      {c.match.matchedSkills.slice(0, 2).join(', ')}
                      {c.match.matchedSkills.length > 2 ? ` +${c.match.matchedSkills.length - 2}` : ''}
                    </div>
                  </td>
                  <td>
                    <span className={`badge badge-${statusBadgeClass[c.status] || 'pending'}`}>
                      {statusLabels[c.status] || 'Pending'}
                    </span>
                  </td>
                  <td>
                    <button className="btn btn-sm btn-outline" onClick={() => onSelect(c)}>View</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}

function ApplicantModal({ selected, internship, onClose, onUpdateStatus }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 700 }}>
        <div className="modal-header">
          <h2>{selected.applicantName}</h2>
          <button onClick={onClose} aria-label="Close"
            style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer' }}>✕</button>
        </div>
        <div className="modal-body">
          {/* Match score breakdown */}
          {selected.match && (
            <div style={{ background: '#f8fafc', borderRadius: 10, padding: 16, marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <h4 style={{ fontSize: 14, fontWeight: 600 }}>Match Analysis</h4>
                <span style={{ fontSize: 20, fontWeight: 700, color: selected.match.overall >= 75 ? '#15803d' : '#ca8a04' }}>
                  {selected.match.overall}% overall
                </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
                <MatchBar score={selected.match.skills} label="Skills Match" />
                <MatchBar score={selected.match.availability} label="Availability" />
                <MatchBar score={selected.match.hours} label="Hours" />
                <MatchBar score={selected.match.interest} label="Interest Fit" />
                <MatchBar score={selected.match.grade} label="Grade Level" />
                <MatchBar score={selected.match.experience} label="Experience" />
              </div>
              {selected.match.matchedSkills.length > 0 && (
                <div style={{ marginTop: 12 }}>
                  <div style={{ fontSize: 12, color: 'var(--nriva-text-light)', marginBottom: 4 }}>Matched skills:</div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {selected.match.matchedSkills.map(s => (
                      <span key={s} style={{ background: '#dcfce7', color: '#15803d', padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 500 }}>
                        ✓ {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            <div><strong>Email:</strong> {selected.email || '—'}</div>
            <div><strong>School:</strong> {selected.school || '—'}</div>
            <div><strong>Grade Level:</strong> {selected.gradeLevel || '—'}</div>
            <div><strong>Hours/day:</strong> {selected.hoursPerDay || '—'}</div>
            <div><strong>Available:</strong> {
              selected.availableFrom || selected.availableTo
                ? `${selected.availableFrom ? formatDate(selected.availableFrom) : '—'} → ${selected.availableTo ? formatDate(selected.availableTo) : '—'}`
                : '—'
            }</div>
            {selected.nrivaMembership && <div><strong>NRIVA Member:</strong> {selected.nrivaMembership}</div>}
          </div>

          {(selected.linkedIn || selected.portfolio || selected.resumeUrl) && (
            <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
              {selected.linkedIn && (
                <a href={selected.linkedIn} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-outline">
                  LinkedIn ↗
                </a>
              )}
              {selected.portfolio && (
                <a href={selected.portfolio} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-outline">
                  Portfolio ↗
                </a>
              )}
              {selected.resumeUrl && (
                <a href={selected.resumeUrl} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-primary">
                  📎 View Resume
                </a>
              )}
            </div>
          )}

          {selected.whyInterested && (
            <>
              <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 6 }}>Why Interested</h4>
              <p style={{ fontSize: 13, color: 'var(--nriva-text-light)', marginBottom: 14, lineHeight: 1.5 }}>{selected.whyInterested}</p>
            </>
          )}
          {selected.relevantSkills && (
            <>
              <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 6 }}>Relevant Skills</h4>
              <p style={{ fontSize: 13, color: 'var(--nriva-text-light)', marginBottom: 14, lineHeight: 1.5 }}>{selected.relevantSkills}</p>
            </>
          )}
          {selected.expectations && (
            <>
              <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 6 }}>Expectations</h4>
              <p style={{ fontSize: 13, color: 'var(--nriva-text-light)', marginBottom: 14, lineHeight: 1.5 }}>{selected.expectations}</p>
            </>
          )}
          {selected.priorExperience && (
            <>
              <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 6 }}>Prior Experience</h4>
              <p style={{ fontSize: 13, color: 'var(--nriva-text-light)', marginBottom: 14, lineHeight: 1.5 }}>{selected.priorExperience}</p>
            </>
          )}
          {selected.notesToEmployer && (
            <>
              <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 6 }}>Notes to Employer</h4>
              <p style={{ fontSize: 13, color: 'var(--nriva-text-light)', marginBottom: 14, lineHeight: 1.5 }}>{selected.notesToEmployer}</p>
            </>
          )}

          <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--nriva-border)' }}>
            <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Update Status</h4>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {['pending', 'under_review', 'shortlisted', 'rejected'].map(s => (
                <button key={s} className={`btn btn-sm ${selected.status === s ? 'btn-primary' : 'btn-outline'}`}
                  onClick={() => onUpdateStatus(selected.id, s)}>
                  {statusLabels[s]}
                </button>
              ))}
            </div>

            {(selected.status === 'shortlisted' || selected.status === 'accepted') && (
              <div style={{ marginTop: 16, padding: 14, background: '#f0fdf4', borderRadius: 10, border: '1px solid #86efac' }}>
                <h4 style={{ fontSize: 14, fontWeight: 600, color: '#15803d', marginBottom: 6 }}>Send Internship Offer</h4>
                <p style={{ fontSize: 12, color: '#166534', marginBottom: 10 }}>
                  Intern will see the offer and can accept or decline through the portal.
                </p>
                <button className="btn btn-success" onClick={() => onUpdateStatus(selected.id, 'offered')}>
                  Send Offer to {selected.applicantName}
                </button>
              </div>
            )}
            {selected.status === 'offered' && (
              <div style={{ marginTop: 16, padding: 14, background: '#fffbeb', borderRadius: 10, border: '1px solid #fde68a', fontSize: 13, color: '#92400e' }}>
                Offer sent — waiting for {selected.applicantName} to respond.
              </div>
            )}
            {selected.status === 'offer_accepted' && (
              <div style={{ marginTop: 16, padding: 14, background: '#dcfce7', borderRadius: 10, border: '1px solid #86efac' }}>
                <h4 style={{ fontSize: 14, fontWeight: 600, color: '#15803d', marginBottom: 6 }}>🎉 Offer Accepted</h4>
                <p style={{ fontSize: 12, color: '#166534', marginBottom: 10 }}>
                  Send onboarding info to {selected.applicantName} ({selected.email})
                </p>
                <button className="btn btn-primary" onClick={() => {
                  const subject = encodeURIComponent(`Welcome aboard! Onboarding for ${selected.internshipTitle}`)
                  const body = encodeURIComponent(`Hi ${selected.applicantName},\n\nCongratulations! We're excited to have you join us as an intern for the ${selected.internshipTitle} position.\n\nHere are your next steps:\n1. \n2. \n3. \n\nStart date: \nReporting to: \n\nPlease let us know if you have any questions.\n\nBest regards`)
                  window.open(`mailto:${selected.email}?subject=${subject}&body=${body}`, '_blank')
                }}>
                  Send Onboarding Email
                </button>
              </div>
            )}
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-outline" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  )
}
