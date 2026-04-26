import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useInternships } from '../../hooks/useFirestore'
import { getUser } from '../../services/firestore'
import { scoreCandidate } from '../../utils/matching'
import { formatDate } from '../../utils/date'

function scoreInternshipForIntern(internship, profile) {
  if (!profile) return { overall: 0 }
  const fakeApp = {
    profileSkills: profile.skills || [],
    profileInterests: profile.interests || [],
    gradeLevel: profile.gradeLevel || '',
    relevantSkills: '',
    priorExperience: profile.experienceSummary || '',
    hoursPerDay: profile.availability === 'flexible' ? 'Flexible' : '',
    availableFrom: '', availableTo: '',
  }
  return scoreCandidate(fakeApp, internship)
}

export default function InternBrowse() {
  const { user } = useAuth()
  const { data: internships } = useInternships()
  const [profile, setProfile] = useState(null)
  const [activeTab, setActiveTab] = useState('recommended')
  const [selected, setSelected] = useState(null)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [locationFilter, setLocationFilter] = useState('all')
  const [sortField, setSortField] = useState('match')
  const [sortDir, setSortDir] = useState('desc')
  const [aiQuery, setAiQuery] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [aiResults, setAiResults] = useState(null)

  useEffect(() => {
    if (user?.uid) getUser(user.uid).then(p => setProfile(p)).catch(() => {})
  }, [user?.uid])

  useEffect(() => {
    const onEsc = (e) => { if (e.key === 'Escape') setSelected(null) }
    window.addEventListener('keydown', onEsc)
    return () => window.removeEventListener('keydown', onEsc)
  }, [])

  const openInternships = useMemo(() =>
    internships.filter(i => i.status === 'open' || i.status === 'closed' || i.status === 'filled')
      .map(i => ({ ...i, match: scoreInternshipForIntern(i, profile) })),
    [internships, profile]
  )

  const recommended = useMemo(() =>
    [...openInternships].filter(i => i.status === 'open')
      .sort((a, b) => b.match.overall - a.match.overall).slice(0, 3),
    [openInternships]
  )

  const locations = useMemo(() => [...new Set(openInternships.map(i => i.location).filter(Boolean))].sort(), [openInternships])

  const allFiltered = useMemo(() => {
    let result = openInternships.filter(job => {
      const q = search.toLowerCase()
      const matchSearch = !q || (job.title || '').toLowerCase().includes(q) ||
        (job.company || '').toLowerCase().includes(q) ||
        (job.skills || []).some(s => s.toLowerCase().includes(q))
      const matchType = typeFilter === 'all' || job.type === typeFilter
      const matchLocation = locationFilter === 'all' || job.location === locationFilter
      return matchSearch && matchType && matchLocation
    })
    result.sort((a, b) => {
      let va, vb
      switch (sortField) {
        case 'match': va = a.match.overall; vb = b.match.overall; break
        case 'title': va = (a.title || '').toLowerCase(); vb = (b.title || '').toLowerCase(); break
        case 'company': va = (a.company || '').toLowerCase(); vb = (b.company || '').toLowerCase(); break
        case 'deadline': va = a.deadline || ''; vb = b.deadline || ''; break
        default: va = a.match.overall; vb = b.match.overall
      }
      if (va < vb) return sortDir === 'asc' ? -1 : 1
      if (va > vb) return sortDir === 'asc' ? 1 : -1
      return 0
    })
    return result
  }, [openInternships, search, typeFilter, locationFilter, sortField, sortDir])

  const toggleSort = (field) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortField(field); setSortDir(field === 'match' ? 'desc' : 'asc') }
  }
  const sortIcon = (field) => sortField === field ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''

  const handleAiSearch = async () => {
    if (!aiQuery.trim()) return
    setAiLoading(true)
    try {
      const res = await fetch('/api/ai-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `I'm a student looking for internships. Here are the available internships:\n\n${openInternships.filter(i => i.status === 'open').slice(0, 20).map((i, idx) => `${idx + 1}. "${i.title}" at ${i.company} - Location: ${i.location}, Type: ${i.type}, Duration: ${i.duration}, Hours: ${i.expectedHoursPerDay || 'N/A'}, Stipend: ${i.stipend}, Skills: ${(i.skills || []).join(', ')}, Grade: ${i.gradeLevelMin || 'Any'}${i.gradeLevelMax ? '-' + i.gradeLevelMax : '+'}`).join('\n')}\n\nMy question: ${aiQuery}`,
          role: 'intern',
        }),
      })
      const data = await res.json()
      setAiResults(data.reply || data.error || 'No results')
    } catch {
      setAiResults('AI search unavailable. Please try again.')
    } finally {
      setAiLoading(false)
    }
  }

  const hasProfile = profile?.skills?.length > 0

  return (
    <div>
      <div className="page-header">
        <h1>Browse Internships</h1>
        <span style={{ color: 'var(--nriva-text-light)', fontSize: 14 }}>
          {openInternships.filter(i => i.status === 'open').length} open positions
        </span>
      </div>

      <div className="tabs" style={{ marginBottom: 16 }}>
        <button className={`tab ${activeTab === 'recommended' ? 'active' : ''}`} onClick={() => setActiveTab('recommended')}>
          🎯 Recommended ({recommended.length})
        </button>
        <button className={`tab ${activeTab === 'all' ? 'active' : ''}`} onClick={() => setActiveTab('all')}>
          📋 All Internships ({openInternships.length})
        </button>
      </div>

      {activeTab === 'recommended' ? (
        <div>
          {!hasProfile && (
            <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 10, padding: '12px 16px', marginBottom: 16, fontSize: 13, color: '#92400e' }}>
              💡 Complete your profile with skills and interests for better recommendations.
            </div>
          )}
          {recommended.length === 0 ? (
            <div className="empty-state">
              <h3>No open internships yet</h3>
              <p>Check back soon for new opportunities!</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {recommended.map((job, idx) => (
                <div key={job.id} className="card" style={{ padding: '20px 24px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 12 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                        <span style={{
                          width: 28, height: 28, borderRadius: '50%',
                          background: idx === 0 ? '#fef3c7' : '#e8eaf6',
                          color: idx === 0 ? '#92400e' : 'var(--nriva-primary)',
                          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                          fontWeight: 700, fontSize: 13,
                        }}>#{idx + 1}</span>
                        <h3 style={{ fontSize: 18, fontWeight: 600 }}>{job.title}</h3>
                      </div>
                      <p style={{ fontSize: 14, color: 'var(--nriva-text-light)' }}>{job.company}</p>
                    </div>
                    {hasProfile && (
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 24, fontWeight: 700, color: job.match.overall >= 75 ? '#15803d' : job.match.overall >= 50 ? '#ca8a04' : '#64748b' }}>
                          {job.match.overall}%
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--nriva-text-light)' }}>match</div>
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', fontSize: 13, color: 'var(--nriva-text-light)', marginBottom: 12 }}>
                    <span>📍 {job.location}</span>
                    <span>⏱ {job.duration}</span>
                    {job.expectedHoursPerDay && <span>🕐 {job.expectedHoursPerDay}/day</span>}
                    <span>💼 {job.type}</span>
                    <span>💰 {job.stipend}</span>
                  </div>
                  {(job.skills || []).length > 0 && (
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
                      {job.skills.map(s => (
                        <span key={s} style={{
                          background: (profile?.skills || []).some(ps => ps.toLowerCase() === s.toLowerCase()) ? '#dcfce7' : '#e8eaf6',
                          color: (profile?.skills || []).some(ps => ps.toLowerCase() === s.toLowerCase()) ? '#15803d' : 'var(--nriva-primary)',
                          padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 500,
                        }}>{s}</span>
                      ))}
                    </div>
                  )}
                  {job.description && (
                    <p style={{ fontSize: 13, color: 'var(--nriva-text-light)', lineHeight: 1.5, marginBottom: 12 }}>
                      {job.description.length > 150 ? job.description.substring(0, 150) + '...' : job.description}
                    </p>
                  )}
                  <div style={{ display: 'flex', gap: 8 }}>
                    <Link to={`/intern/apply/${job.id}`} className="btn btn-primary btn-sm" style={{ flex: 1, justifyContent: 'center' }}>
                      Apply Now
                    </Link>
                    <button className="btn btn-sm btn-outline" onClick={() => setSelected(job)}>Details</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div>
          {/* Filters */}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 12 }}>
            <input className="search-input" placeholder="Search by title, company, or skill..."
              value={search} onChange={(e) => setSearch(e.target.value)} style={{ flex: '1 1 200px' }} />
            <select className="filter-select" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
              <option value="all">All Types</option>
              <option value="Full-time">Full-time</option>
              <option value="Part-time">Part-time</option>
            </select>
            <select className="filter-select" value={locationFilter} onChange={(e) => setLocationFilter(e.target.value)}>
              <option value="all">All Locations</option>
              {locations.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>

          {/* AI Search */}
          <div style={{
            display: 'flex', gap: 8, marginBottom: 16,
            padding: '12px 14px', background: '#f5f3ff', borderRadius: 10, border: '1px solid #ddd6fe',
          }}>
            <input placeholder="Ask AI: e.g., 'remote marketing internships for beginners'"
              value={aiQuery} onChange={(e) => setAiQuery(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleAiSearch() }}
              style={{ flex: 1, padding: '8px 12px', borderRadius: 8, border: '1px solid #c4b5fd', fontSize: 13, background: 'white' }} />
            <button onClick={handleAiSearch} disabled={aiLoading || !aiQuery.trim()}
              style={{
                padding: '8px 16px', borderRadius: 8, border: 'none',
                background: '#7c3aed', color: 'white', fontSize: 13, fontWeight: 600,
                cursor: aiLoading ? 'wait' : 'pointer', opacity: aiLoading ? 0.6 : 1,
              }}>
              {aiLoading ? '...' : '✨ AI Search'}
            </button>
          </div>

          {aiResults && (
            <div style={{
              background: '#faf5ff', border: '1px solid #e9d5ff', borderRadius: 10,
              padding: '14px 18px', marginBottom: 16, fontSize: 13, lineHeight: 1.6,
              color: '#581c87', whiteSpace: 'pre-wrap',
            }}>
              <div style={{ fontWeight: 600, marginBottom: 6, color: '#7c3aed' }}>✨ AI Suggestions</div>
              {aiResults}
            </div>
          )}

          {/* Sortable table */}
          <div className="card">
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    {hasProfile && <th style={{ cursor: 'pointer' }} onClick={() => toggleSort('match')}>Match{sortIcon('match')}</th>}
                    <th style={{ cursor: 'pointer' }} onClick={() => toggleSort('title')}>Position{sortIcon('title')}</th>
                    <th style={{ cursor: 'pointer' }} onClick={() => toggleSort('company')}>Company{sortIcon('company')}</th>
                    <th>Location</th>
                    <th>Type</th>
                    <th>Duration</th>
                    <th>Stipend</th>
                    <th style={{ cursor: 'pointer' }} onClick={() => toggleSort('deadline')}>Deadline{sortIcon('deadline')}</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {allFiltered.length === 0 ? (
                    <tr><td colSpan={hasProfile ? 9 : 8} style={{ textAlign: 'center', padding: 40, color: 'var(--nriva-text-light)' }}>
                      No internships match your filters.
                    </td></tr>
                  ) : allFiltered.map(job => (
                    <tr key={job.id} style={{ cursor: 'pointer' }} onClick={() => setSelected(job)}>
                      {hasProfile && (
                        <td>
                          <span style={{
                            fontWeight: 700, fontSize: 15,
                            color: job.match.overall >= 75 ? '#15803d' : job.match.overall >= 50 ? '#ca8a04' : '#64748b',
                          }}>{job.match.overall}%</span>
                        </td>
                      )}
                      <td>
                        <div style={{ fontWeight: 500 }}>{job.title}</div>
                        <div style={{ fontSize: 11, color: 'var(--nriva-text-light)' }}>
                          {(job.skills || []).slice(0, 2).join(', ')}
                        </div>
                      </td>
                      <td style={{ fontSize: 13 }}>{job.company}</td>
                      <td style={{ fontSize: 13 }}>{job.location}</td>
                      <td style={{ fontSize: 13 }}>{job.type}</td>
                      <td style={{ fontSize: 13 }}>{job.duration}</td>
                      <td style={{ fontSize: 13 }}>{job.stipend}</td>
                      <td style={{ fontSize: 13 }}>{formatDate(job.deadline)}</td>
                      <td>
                        {job.status === 'open' && (
                          <Link to={`/intern/apply/${job.id}`} className="btn btn-sm btn-primary"
                            onClick={(e) => e.stopPropagation()}>Apply</Link>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Detail panel */}
      {selected && (
        <div className="modal-overlay" onClick={() => setSelected(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 600 }}>
            <div className="modal-header">
              <h2>{selected.title}</h2>
              <button onClick={() => setSelected(null)} aria-label="Close"
                style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer' }}>✕</button>
            </div>
            <div className="modal-body">
              <p style={{ color: 'var(--nriva-text-light)', marginBottom: 16 }}>{selected.company}</p>
              {hasProfile && selected.match && (
                <div style={{ background: '#f0fdf4', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: '#15803d', fontWeight: 600 }}>
                  {selected.match.overall}% match with your profile
                </div>
              )}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                <div><div style={{ fontSize: 12, color: 'var(--nriva-text-light)' }}>Location</div><div style={{ fontWeight: 500 }}>{selected.location}</div></div>
                <div><div style={{ fontSize: 12, color: 'var(--nriva-text-light)' }}>Type</div><div style={{ fontWeight: 500 }}>{selected.type}</div></div>
                <div><div style={{ fontSize: 12, color: 'var(--nriva-text-light)' }}>Duration</div><div style={{ fontWeight: 500 }}>{selected.duration}</div></div>
                <div><div style={{ fontSize: 12, color: 'var(--nriva-text-light)' }}>Stipend</div><div style={{ fontWeight: 500 }}>{selected.stipend}</div></div>
                <div><div style={{ fontSize: 12, color: 'var(--nriva-text-light)' }}>Deadline</div><div style={{ fontWeight: 500 }}>{formatDate(selected.deadline)}</div></div>
                <div><div style={{ fontSize: 12, color: 'var(--nriva-text-light)' }}>Positions</div><div style={{ fontWeight: 500 }}>{selected.positions || 1}</div></div>
              </div>
              {selected.description && (
                <>
                  <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 6 }}>Description</h4>
                  <p style={{ fontSize: 13, color: 'var(--nriva-text-light)', lineHeight: 1.6, marginBottom: 16, whiteSpace: 'pre-wrap' }}>{selected.description}</p>
                </>
              )}
              {selected.requirements && (
                <>
                  <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 6 }}>Requirements</h4>
                  <p style={{ fontSize: 13, color: 'var(--nriva-text-light)', lineHeight: 1.6, marginBottom: 16, whiteSpace: 'pre-wrap' }}>{selected.requirements}</p>
                </>
              )}
              {(selected.skills || []).length > 0 && (
                <>
                  <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 6 }}>Skills</h4>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
                    {selected.skills.map(s => (
                      <span key={s} style={{
                        background: (profile?.skills || []).some(ps => ps.toLowerCase() === s.toLowerCase()) ? '#dcfce7' : '#e8eaf6',
                        color: (profile?.skills || []).some(ps => ps.toLowerCase() === s.toLowerCase()) ? '#15803d' : 'var(--nriva-primary)',
                        padding: '4px 12px', borderRadius: 20, fontSize: 13, fontWeight: 500,
                      }}>{s}</span>
                    ))}
                  </div>
                </>
              )}
            </div>
            <div className="modal-footer">
              {selected.status === 'open' ? (
                <Link to={`/intern/apply/${selected.id}`} className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }}>
                  Apply for this Position
                </Link>
              ) : (
                <button className="btn" disabled style={{ flex: 1, justifyContent: 'center', background: '#e2e8f0', color: '#94a3b8' }}>
                  {selected.status === 'closed' ? 'Applications Closed' : 'Position Filled'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
