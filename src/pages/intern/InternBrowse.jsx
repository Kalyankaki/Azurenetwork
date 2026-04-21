import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useInternships } from '../../hooks/useFirestore'
import { formatDate } from '../../utils/date'

export default function InternBrowse() {
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [locationFilter, setLocationFilter] = useState('all')
  const [selected, setSelected] = useState(null)
  const { data: internships } = useInternships()

  useEffect(() => {
    const onEsc = (e) => { if (e.key === 'Escape') setSelected(null) }
    window.addEventListener('keydown', onEsc)
    return () => window.removeEventListener('keydown', onEsc)
  }, [])

  const filtered = internships.filter(job => {
    const matchSearch = job.title.toLowerCase().includes(search.toLowerCase()) ||
      job.company.toLowerCase().includes(search.toLowerCase()) ||
      job.skills.some(s => s.toLowerCase().includes(search.toLowerCase()))
    // Only show approved internships (open/closed/filled), not pending or rejected
    const isVisible = job.status === 'open' || job.status === 'closed' || job.status === 'filled'
    const matchType = typeFilter === 'all' || job.type === typeFilter
    const matchLocation = locationFilter === 'all' || job.location === locationFilter
    return isVisible && matchSearch && matchType && matchLocation
  })

  return (
    <div>
      <div className="page-header">
        <h1>Browse Internships</h1>
        <span style={{ color: 'var(--nriva-text-light)', fontSize: 14 }}>
          {filtered.length} {filtered.length === 1 ? 'position' : 'positions'} found
        </span>
      </div>

      <div className="filter-bar">
        <input
          className="search-input"
          placeholder="Search by title, company, or skill..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select className="filter-select" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
          <option value="all">All Types</option>
          <option value="Full-time">Full-time</option>
          <option value="Part-time">Part-time</option>
        </select>
        <select className="filter-select" value={locationFilter} onChange={(e) => setLocationFilter(e.target.value)}>
          <option value="all">All Locations</option>
          <option value="Remote">Remote</option>
          <option value="New York, NY">New York, NY</option>
          <option value="San Francisco, CA">San Francisco, CA</option>
          <option value="Houston, TX">Houston, TX</option>
        </select>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 1fr' : '1fr', gap: 24 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filtered.length === 0 && (
            <div className="empty-state">
              <h3>No internships found</h3>
              <p>Try adjusting your search or filters.</p>
            </div>
          )}
          {filtered.map(job => (
            <div
              key={job.id}
              className="card"
              role="button"
              tabIndex={0}
              aria-label={`View ${job.title} at ${job.company}`}
              style={{
                cursor: 'pointer',
                border: selected?.id === job.id ? '2px solid var(--nriva-primary)' : '2px solid transparent',
              }}
              onClick={() => setSelected(job)}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelected(job) } }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>{job.title}</h3>
                  <p style={{ fontSize: 14, color: 'var(--nriva-text-light)' }}>{job.company}</p>
                </div>
                <span className={`badge badge-${job.status}`}>{job.status}</span>
              </div>
              <div style={{ display: 'flex', gap: 16, margin: '12px 0', fontSize: 13, color: 'var(--nriva-text-light)' }}>
                <span>📍 {job.location}</span>
                <span>⏱ {job.duration}</span>
                {job.expectedHoursPerDay && <span>🕐 {job.expectedHoursPerDay}/day</span>}
                <span>🕐 {job.type}</span>
                <span>💰 {job.stipend}</span>
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {job.skills.map(s => (
                  <span key={s} style={{
                    background: '#e8eaf6',
                    color: 'var(--nriva-primary)',
                    padding: '3px 10px',
                    borderRadius: 4,
                    fontSize: 12,
                    fontWeight: 500,
                  }}>{s}</span>
                ))}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
                <span style={{ fontSize: 12, color: 'var(--nriva-text-light)' }}>
                  {job.applicants || 0} {(job.applicants || 0) === 1 ? 'applicant' : 'applicants'} · {job.positions || 0} {(job.positions || 0) === 1 ? 'position' : 'positions'}
                </span>
                <span style={{ fontSize: 12, color: 'var(--nriva-text-light)' }}>
                  Deadline: {formatDate(job.deadline)}
                </span>
              </div>
            </div>
          ))}
        </div>

        {selected && (
          <div className="card" style={{ position: 'sticky', top: 80, alignSelf: 'start' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 16 }}>
              <div>
                <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>{selected.title}</h2>
                <p style={{ color: 'var(--nriva-text-light)' }}>{selected.company}</p>
              </div>
              <button
                onClick={() => setSelected(null)}
                style={{ background: 'none', border: 'none', fontSize: 20, color: 'var(--nriva-text-light)', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 12,
              padding: '16px 0',
              borderTop: '1px solid var(--nriva-border)',
              borderBottom: '1px solid var(--nriva-border)',
              margin: '16px 0',
            }}>
              <div>
                <div style={{ fontSize: 12, color: 'var(--nriva-text-light)' }}>Location</div>
                <div style={{ fontSize: 14, fontWeight: 500 }}>{selected.location}</div>
              </div>
              <div>
                <div style={{ fontSize: 12, color: 'var(--nriva-text-light)' }}>Type</div>
                <div style={{ fontSize: 14, fontWeight: 500 }}>{selected.type}</div>
              </div>
              <div>
                <div style={{ fontSize: 12, color: 'var(--nriva-text-light)' }}>Duration</div>
                <div style={{ fontSize: 14, fontWeight: 500 }}>{selected.duration}</div>
              </div>
              <div>
                <div style={{ fontSize: 12, color: 'var(--nriva-text-light)' }}>Stipend</div>
                <div style={{ fontSize: 14, fontWeight: 500 }}>{selected.stipend}</div>
              </div>
              <div>
                <div style={{ fontSize: 12, color: 'var(--nriva-text-light)' }}>Deadline</div>
                <div style={{ fontSize: 14, fontWeight: 500 }}>{formatDate(selected.deadline)}</div>
              </div>
              <div>
                <div style={{ fontSize: 12, color: 'var(--nriva-text-light)' }}>Positions</div>
                <div style={{ fontSize: 14, fontWeight: 500 }}>{selected.positions}</div>
              </div>
            </div>

            <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 8 }}>Description</h3>
            <p style={{ fontSize: 14, color: 'var(--nriva-text-light)', lineHeight: 1.6, marginBottom: 16 }}>
              {selected.description}
            </p>

            <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 8 }}>Requirements</h3>
            <p style={{ fontSize: 14, color: 'var(--nriva-text-light)', lineHeight: 1.6, marginBottom: 16 }}>
              {selected.requirements}
            </p>

            <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 8 }}>Skills</h3>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 24 }}>
              {selected.skills.map(s => (
                <span key={s} style={{
                  background: '#e8eaf6',
                  color: 'var(--nriva-primary)',
                  padding: '4px 12px',
                  borderRadius: 6,
                  fontSize: 13,
                  fontWeight: 500,
                }}>{s}</span>
              ))}
            </div>

            {selected.status === 'open' ? (
              <Link to={`/intern/apply/${selected.id}`} className="btn btn-primary btn-lg" style={{ width: '100%', justifyContent: 'center' }}>
                Apply for this Position
              </Link>
            ) : (
              <button className="btn btn-lg" style={{ width: '100%', justifyContent: 'center', background: '#e2e8f0', color: '#94a3b8', cursor: 'not-allowed' }} disabled>
                {selected.status === 'closed' ? 'Applications Closed' : 'Position Filled'}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
