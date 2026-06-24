import { useState, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useInternships, useApplications, useUsers } from '../../hooks/useFirestore'
import { rankCandidates, scoreCandidate } from '../../utils/matching'
import { formatDate } from '../../utils/date'
import { statusLabel, statusBadgeClass } from '../../utils/status'
import { useAIConsent } from '../../hooks/useAIConsent'
import AIConsentModal from '../../components/AIConsentModal'
import Toast from '../../components/Toast'
import { downloadResumesZip } from '../../utils/zipResumes'

const MAX_BULK_RESUME_DOWNLOAD = 50

export default function EmployerDashboard() {
  const { user, employerApproved, availableRoles } = useAuth()
  const navigate = useNavigate()
  const isAdminUser = (availableRoles || []).includes('admin')
  // Scope listeners to this employer's postings / apps so they match the
  // Firestore read rule (employerUid == request.auth.uid). Admins fall
  // through to unfiltered queries — the rule's isAdmin() branch allows
  // them, and super-admins typically have no postings of their own so the
  // filter would otherwise hide everything.
  const myPostingsFilter = isAdminUser ? {} : { employerUid: user?.uid }
  const allAppsFilter = isAdminUser ? {} : { employerUid: user?.uid }
  const { data: myPostings } = useInternships(myPostingsFilter)
  const { data: allApps } = useApplications(allAppsFilter)
  // Subscribe to all users only when an admin is on this page. The users
  // collection's read rule is own-doc + admin; a non-admin listener would
  // be rejected wholesale and the candidate-matching tab would error out.
  // Non-admins fall back to a candidate list derived from applications.
  const { data: allUsers } = useUsers({ enabled: isAdminUser })
  const [selectedPostingId, setSelectedPostingId] = useState('')
  const [candidateTab, setCandidateTab] = useState('top')
  const [aiQuery, setAiQuery] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [aiResults, setAiResults] = useState(null)
  const [filters, setFilters] = useState({ location: '', availability: '', education: '', gpa: '' })
  const [selectedResumeIds, setSelectedResumeIds] = useState(() => new Set())
  const [downloading, setDownloading] = useState(false)
  const [toast, setToast] = useState(null)
  const aiConsent = useAIConsent()

  const activePosting = selectedPostingId
    ? myPostings.find(p => p.id === selectedPostingId)
    : myPostings.find(p => p.status === 'open') || myPostings[0]

  // Scope all stat-card aggregations to applications for THIS employer's postings.
  // Without this, every employer sees platform-wide totals.
  const myPostingIds = useMemo(() => new Set(myPostings.map(p => p.id)), [myPostings])
  const myApps = useMemo(() => allApps.filter(a => myPostingIds.has(a.internshipId)), [allApps, myPostingIds])
  const myOpenPostings = myPostings.filter(p => p.status === 'open')
  const myOpenPositionsTotal = myOpenPostings.reduce((sum, p) => sum + (parseInt(p.positions, 10) || 1), 0)

  const appsForPosting = useMemo(() =>
    allApps.filter(a => a.internshipId === activePosting?.id),
    [allApps, activePosting?.id]
  )

  const ranked = useMemo(() => {
    if (!activePosting) return []
    return rankCandidates(appsForPosting, activePosting)
  }, [appsForPosting, activePosting])

  const topCandidates = ranked.slice(0, 5)

  // ---- Bulk resume selection / download ----
  const toggleResumeSelect = (id) => {
    setSelectedResumeIds(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }
  const selectAllResumesInList = (list) => {
    const withResume = list.filter(c => c.resumeUrl).map(c => c.id || c.applicationId).filter(Boolean)
    setSelectedResumeIds(prev => {
      const allSelected = withResume.length > 0 && withResume.every(id => prev.has(id))
      if (allSelected) {
        const next = new Set(prev)
        for (const id of withResume) next.delete(id)
        return next
      }
      return new Set([...prev, ...withResume])
    })
  }
  const clearResumeSelection = () => setSelectedResumeIds(new Set())
  const downloadSelectedResumes = async () => {
    if (selectedResumeIds.size === 0 || downloading) return
    if (selectedResumeIds.size > MAX_BULK_RESUME_DOWNLOAD) {
      setToast(`Pick at most ${MAX_BULK_RESUME_DOWNLOAD} at a time`)
      return
    }
    const idMatches = (c) => selectedResumeIds.has(c.id) || selectedResumeIds.has(c.applicationId)
    // Build pool from both the ranked applicants and the all-interns list so
    // we cover selections made on either tab.
    const seen = new Set()
    const pool = [...ranked, ...allInterns].filter(c => {
      const id = c.id || c.applicationId
      if (!id || seen.has(id)) return false
      seen.add(id)
      return idMatches(c)
    })
    setDownloading(true)
    try {
      const safeTitle = (activePosting?.title || 'posting').replace(/[^\w-]+/g, '-').slice(0, 40)
      const safeCompany = (activePosting?.company || 'company').replace(/[^\w-]+/g, '-').slice(0, 30)
      const today = new Date().toISOString().slice(0, 10)
      const zipName = `${safeCompany}-${safeTitle}-resumes-${today}.zip`
      const { downloaded, skipped } = await downloadResumesZip(pool, zipName)
      if (downloaded === 0) setToast('No resumes could be downloaded')
      else if (skipped > 0) setToast(`Downloaded ${downloaded} resume${downloaded === 1 ? '' : 's'} (${skipped} skipped)`)
      else setToast(`Downloaded ${downloaded} resume${downloaded === 1 ? '' : 's'}`)
      clearResumeSelection()
    } catch (err) {
      setToast('Download failed: ' + (err?.message || 'unknown error'))
    } finally {
      setDownloading(false)
    }
  }

  // Candidate pool for the All-candidates tab.
  //   Admin: every registered intern, scored against the posting (rich
  //   discovery — includes interns who haven't applied yet).
  //   Non-admin employer: derived from applications they own. Same shape
  //   so the table / filters / AI search render unchanged.
  const allInterns = useMemo(() => {
    if (!activePosting) return []
    if (allUsers.length > 0) {
      return allUsers
        .filter(u => (u.roles || []).includes('intern'))
        .map(u => {
          const application = appsForPosting.find(a => a.applicantUid === u.uid)
          const profile = {
            applicantName: u.displayName || u.email || '—',
            email: u.email,
            school: u.school || '',
            gradeLevel: u.gradeLevel || '',
            linkedIn: u.linkedIn || '',
            portfolio: u.portfolio || '',
            resumeUrl: u.resumeUrl || null,
            profileSkills: u.skills || [],
            profileInterests: u.interests || [],
            nrivaMembership: u.nrivaMembership || '',
            availableFrom: application?.availableFrom || '',
            availableTo: application?.availableTo || '',
            hoursPerDay: application?.hoursPerDay || u.availability || '',
            relevantSkills: application?.relevantSkills || '',
            priorExperience: application?.priorExperience || u.experienceSummary || '',
            whyInterested: application?.whyInterested || '',
            status: application?.status || null,
            applicationId: application?.id || null,
            applied: !!application,
            uid: u.uid,
          }
          const match = scoreCandidate(profile, activePosting)
          return { ...profile, match }
        })
        .sort((a, b) => b.match.overall - a.match.overall)
    }
    // Non-admin fallback: just the ranked applicants for this posting.
    return ranked.map(c => ({ ...c, applied: true }))
  }, [allUsers, activePosting, appsForPosting, ranked])

  // Filtered from all interns
  const allFiltered = useMemo(() => {
    return allInterns.filter(c => {
      if (filters.location && !(c.school || '').toLowerCase().includes(filters.location.toLowerCase())) return false
      if (filters.education && !(c.gradeLevel || '').toLowerCase().includes(filters.education.toLowerCase())) return false
      if (filters.gpa) {
        const minGpa = parseFloat(filters.gpa)
        const cGpa = parseFloat(c.gpa || '0')
        if (!isNaN(minGpa) && cGpa < minGpa) return false
      }
      if (filters.availability) {
        if (c.match?.availability < parseInt(filters.availability, 10)) return false
      }
      return true
    })
  }, [allInterns, filters])

  const handleAiSearch = async () => {
    if (!aiQuery.trim() || !activePosting) return
    const ok = await aiConsent.ensureConsent()
    if (!ok) return
    setAiLoading(true)
    try {
      const res = await fetch('/api/ai-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `I have ${allInterns.length} registered interns for the "${activePosting.title}" internship (${appsForPosting.length} have applied). Here are their profiles:\n\n${allInterns.slice(0, 25).map((c, i) => `${i + 1}. ${c.applicantName} - School: ${c.school || 'N/A'}, Grade: ${c.gradeLevel || 'N/A'}, Skills: ${(c.profileSkills || []).join(', ') || c.relevantSkills || 'N/A'}, Match: ${c.match?.overall}%, Applied: ${c.applied ? 'Yes' : 'No'}, Availability: ${c.hoursPerDay || 'N/A'}`).join('\n')}\n\nBased on this data, ${aiQuery}`,
          role: 'employer',
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

  const selectPosting = (id) => {
    setSelectedPostingId(id)
    setAiResults(null)
  }

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
        <div className="stat-card" onClick={() => navigate('/employer/postings')} style={{ cursor: 'pointer' }}>
          <div className="stat-label">Active Postings</div>
          <div className="stat-value">{myOpenPostings.length}</div>
          <div style={{ fontSize: 12, color: 'var(--nriva-text-light)', marginTop: 4 }}>
            {myOpenPositionsTotal} position{myOpenPositionsTotal === 1 ? '' : 's'}
          </div>
        </div>
        <div className="stat-card" onClick={() => navigate('/employer/applicants')} style={{ cursor: 'pointer' }}>
          <div className="stat-label">Total Applicants</div>
          <div className="stat-value">{myApps.length}</div>
        </div>
        <div className="stat-card" onClick={() => navigate('/employer/applicants')} style={{ cursor: 'pointer' }}>
          <div className="stat-label">Shortlisted</div>
          <div className="stat-value" style={{ color: 'var(--nriva-success)' }}>{myApps.filter(a => a.status === 'shortlisted').length}</div>
        </div>
        <div className="stat-card" onClick={() => navigate('/employer/applicants')} style={{ cursor: 'pointer' }}>
          <div className="stat-label">Offers Sent</div>
          <div className="stat-value" style={{ color: 'var(--nriva-accent)' }}>
            {myApps.filter(a => ['offered', 'offer_accepted', 'offer_declined'].includes(a.status)).length}
          </div>
        </div>
      </div>

      {/* My Internship Postings - clickable rows */}
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
              <tr><th>Position</th><th>Status</th><th>Applicants</th><th>Deadline</th><th></th></tr>
            </thead>
            <tbody>
              {myPostings.length === 0 ? (
                <tr><td colSpan="5" style={{ textAlign: 'center', padding: 24, color: 'var(--nriva-text-light)' }}>
                  No postings yet. <Link to="/employer/new-posting" style={{ color: 'var(--nriva-primary)' }}>Create one →</Link>
                </td></tr>
              ) : myPostings.map(job => {
                const isActive = activePosting?.id === job.id
                const appCount = allApps.filter(a => a.internshipId === job.id).length
                return (
                  <tr key={job.id}
                    onClick={() => selectPosting(job.id)}
                    style={{
                      cursor: 'pointer',
                      background: isActive ? '#eef2ff' : undefined,
                      borderLeft: isActive ? '3px solid var(--nriva-primary)' : '3px solid transparent',
                    }}>
                    <td>
                      <div style={{ fontWeight: isActive ? 600 : 500 }}>{job.title}</div>
                      <div style={{ fontSize: 12, color: 'var(--nriva-text-light)' }}>{job.company}</div>
                    </td>
                    <td><span className={`badge badge-${job.status === 'pending_approval' ? 'pending' : job.status || 'open'}`}>{job.status === 'pending_approval' ? 'Pending' : job.status}</span></td>
                    <td style={{ fontWeight: 600 }}>{appCount}</td>
                    <td>{formatDate(job.deadline)}</td>
                    <td>
                      <button className="btn btn-sm btn-outline" onClick={(e) => { e.stopPropagation(); navigate('/employer/postings') }}
                        style={{ fontSize: 11, padding: '3px 10px' }}>Edit</button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Candidates section with tabs */}
      {!employerApproved ? (
        <div className="card" style={{ textAlign: 'center', padding: '40px 24px' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🔒</div>
          <h3 style={{ fontSize: 18, fontWeight: 600, color: 'var(--nriva-primary)', marginBottom: 8 }}>
            Candidate Matching Locked
          </h3>
          <p style={{ color: 'var(--nriva-text-light)', fontSize: 14, maxWidth: 400, margin: '0 auto' }}>
            You can post and edit internships. Candidate viewing will be unlocked once an admin approves your account.
          </p>
        </div>
      ) : (
      <div className="card">
        {selectedResumeIds.size > 0 && (
          <div style={{
            background: '#eef2ff', border: '1px solid #c7d2fe', borderRadius: 10,
            padding: '10px 14px', marginBottom: 12, display: 'flex',
            alignItems: 'center', gap: 12, flexWrap: 'wrap',
          }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#4338ca' }}>
              {selectedResumeIds.size} resume{selectedResumeIds.size === 1 ? '' : 's'} selected
            </span>
            <button className="btn btn-sm btn-primary"
              onClick={downloadSelectedResumes} disabled={downloading}>
              {downloading ? 'Zipping…' : `Download ${selectedResumeIds.size} resume${selectedResumeIds.size === 1 ? '' : 's'}`}
            </button>
            <button className="btn btn-sm btn-outline" onClick={clearResumeSelection} disabled={downloading}>
              Clear
            </button>
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
          <h2 style={{ fontSize: 18, fontWeight: 600 }}>
            Candidates for: {activePosting?.title || 'Select a posting'}
          </h2>
          <Link to="/employer/applicants" style={{ color: 'var(--nriva-primary)', fontSize: 14, fontWeight: 500 }}>
            Full View →
          </Link>
        </div>
        <p style={{ fontSize: 12, color: 'var(--nriva-text-light)', marginBottom: 16 }}>
          {appsForPosting.length} applicant{appsForPosting.length === 1 ? '' : 's'}
          {' · Click a posting above to switch'}
        </p>

        <div className="tabs" style={{ marginBottom: 16 }}>
          <button className={`tab ${candidateTab === 'top' ? 'active' : ''}`} onClick={() => setCandidateTab('top')}>
            🏆 Top 5
          </button>
          <button className={`tab ${candidateTab === 'all' ? 'active' : ''}`} onClick={() => setCandidateTab('all')}>
            📋 {isAdminUser ? 'All Interns' : 'All Applicants'} ({allInterns.length})
          </button>
        </div>

        {candidateTab === 'top' ? (
          topCandidates.length === 0 ? (
            <p style={{ color: 'var(--nriva-text-light)', fontSize: 14, padding: '20px 0', textAlign: 'center' }}>
              No applicants yet.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {topCandidates.map((c, idx) => (
                <Link key={c.id} to="/employer/applicants" style={{ textDecoration: 'none', color: 'inherit' }}>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 14,
                    padding: '14px 16px', border: '1px solid var(--nriva-border)', borderRadius: 10,
                  }}>
                    <input type="checkbox"
                      checked={selectedResumeIds.has(c.id)}
                      disabled={!c.resumeUrl}
                      onChange={(e) => toggleResumeSelect(c.id)}
                      onClick={(e) => { e.stopPropagation() }}
                      title={c.resumeUrl ? 'Include in resume bulk download' : 'No resume on file'}
                      style={{ flexShrink: 0 }} />
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
                        color: c.match?.overall >= 75 ? '#15803d' : c.match?.overall >= 50 ? '#ca8a04' : '#dc2626',
                      }}>
                        {c.match?.overall || 0}%
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )
        ) : (
          /* All Candidates tab with filters + AI search */
          <div>
            {!isAdminUser && (
              <p style={{ fontSize: 12, color: 'var(--nriva-text-light)', marginBottom: 10, lineHeight: 1.5 }}>
                Showing everyone who applied to this posting, scored and filterable.
                Admins can also see registered interns who haven&apos;t applied yet.
              </p>
            )}
            {/* Filters row */}
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 12 }}>
              <input placeholder="Location / School" value={filters.location}
                onChange={(e) => setFilters({ ...filters, location: e.target.value })}
                style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--nriva-border)', fontSize: 13, flex: '1 1 140px' }} />
              <select value={filters.education} onChange={(e) => setFilters({ ...filters, education: e.target.value })}
                style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--nriva-border)', fontSize: 13 }}>
                <option value="">All Grades</option>
                <option value="10th">10th Grade</option>
                <option value="11th">11th Grade</option>
                <option value="12th">12th Grade</option>
                <option value="Freshman">College Freshman</option>
                <option value="Sophomore">College Sophomore</option>
                <option value="Junior">College Junior</option>
                <option value="Senior">College Senior</option>
              </select>
              <select value={filters.availability} onChange={(e) => setFilters({ ...filters, availability: e.target.value })}
                style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--nriva-border)', fontSize: 13 }}>
                <option value="">Any Availability</option>
                <option value="50">≥ 50% available</option>
                <option value="70">≥ 70% available</option>
                <option value="90">≥ 90% available</option>
              </select>
              <input placeholder="Min GPA (e.g. 3.0)" value={filters.gpa}
                onChange={(e) => setFilters({ ...filters, gpa: e.target.value })}
                style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--nriva-border)', fontSize: 13, width: 120 }} />
            </div>

            {/* AI-powered search */}
            <div style={{
              display: 'flex', gap: 8, marginBottom: 16,
              padding: '12px 14px', background: '#f5f3ff', borderRadius: 10, border: '1px solid #ddd6fe',
            }}>
              <input placeholder="Describe the ideal candidate... (e.g., 'strong in Python with marketing experience')"
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
                <div style={{ fontWeight: 600, marginBottom: 6, color: '#7c3aed' }}>✨ AI Analysis</div>
                {aiResults}
              </div>
            )}

            {/* Candidates list */}
            {allFiltered.length === 0 ? (
              <p style={{ color: 'var(--nriva-text-light)', textAlign: 'center', padding: 20, fontSize: 14 }}>
                No candidates match the filters.
              </p>
            ) : (
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th style={{ width: 32 }}>
                        {(() => {
                          const withResume = allFiltered.filter(c => c.resumeUrl)
                          const allSel = withResume.length > 0 && withResume.every(c => selectedResumeIds.has(c.applicationId || c.uid))
                          return (
                            <input type="checkbox"
                              checked={allSel}
                              disabled={withResume.length === 0}
                              onChange={() => selectAllResumesInList(allFiltered.map(c => ({ ...c, id: c.applicationId || c.uid })))}
                              title="Select all candidates with a resume in this view" />
                          )
                        })()}
                      </th>
                      <th>Candidate</th>
                      <th>Match</th>
                      <th>School</th>
                      <th>Grade</th>
                      <th>Availability</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allFiltered.map(c => {
                      const rowId = c.applicationId || c.uid
                      return (
                      <tr key={c.id || rowId}>
                        <td>
                          <input type="checkbox"
                            checked={!!rowId && selectedResumeIds.has(rowId)}
                            disabled={!c.resumeUrl || !rowId}
                            onChange={() => rowId && toggleResumeSelect(rowId)}
                            title={c.resumeUrl ? 'Include in resume bulk download' : 'No resume on file'} />
                        </td>
                        <td>
                          <div style={{ fontWeight: 500, fontSize: 14 }}>{c.applicantName}</div>
                          <div style={{ fontSize: 11, color: 'var(--nriva-text-light)', display: 'flex', gap: 6 }}>
                            {c.email && <span>{c.email}</span>}
                            {c.linkedIn && <a href={c.linkedIn} target="_blank" rel="noopener noreferrer" style={{ color: '#0077b5', textDecoration: 'none' }}>LinkedIn</a>}
                            {c.resumeUrl && <a href={c.resumeUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#15803d', textDecoration: 'none' }}>Resume</a>}
                          </div>
                        </td>
                        <td>
                          <span style={{
                            fontWeight: 700, fontSize: 16,
                            color: c.match?.overall >= 75 ? '#15803d' : c.match?.overall >= 50 ? '#ca8a04' : '#dc2626',
                          }}>{c.match?.overall || 0}%</span>
                        </td>
                        <td style={{ fontSize: 13 }}>{c.school || '—'}</td>
                        <td style={{ fontSize: 13 }}>{c.gradeLevel || '—'}</td>
                        <td style={{ fontSize: 12 }}>
                          {c.availableFrom ? `${formatDate(c.availableFrom)} → ${formatDate(c.availableTo)}` : '—'}
                          <div style={{ color: 'var(--nriva-text-light)', fontSize: 11 }}>{c.hoursPerDay || ''}</div>
                        </td>
                        <td>
                          {c.applied ? (
                            <span className={`badge badge-${statusBadgeClass(c.status)}`}>
                              {statusLabel(c.status)}
                            </span>
                          ) : (
                            <span style={{ fontSize: 12, color: 'var(--nriva-text-light)' }}>Not applied</span>
                          )}
                        </td>
                      </tr>
                    )})}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
      )}

      <AIConsentModal open={aiConsent.promptOpen} onAccept={aiConsent.accept} onDecline={aiConsent.decline} />
      {toast && <Toast message={toast} type="success" onClose={() => setToast(null)} />}
    </div>
  )
}
