import { useState, useEffect, useMemo } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useInternships } from '../../hooks/useFirestore'
import { useNavigate } from 'react-router-dom'
import { getUser, updateUserProfile, exportUserData, selfDeleteUser, GRADE_LEVELS } from '../../services/firestore'
import { uploadResume, deleteAllResumes, deleteCurrentAuthUser, logOut } from '../../firebase'

const INTERN_SKILLS = [
  'Python', 'JavaScript', 'React', 'Java', 'HTML/CSS',
  'Data Analysis', 'Excel / Google Sheets', 'SQL',
  'Graphic Design', 'Video Editing', 'Canva / Figma',
  'Social Media Marketing', 'Content Writing', 'Public Speaking',
  'Research', 'Financial Analysis', 'Project Management',
  'AI / Machine Learning', 'Mobile App Development', 'Cloud / DevOps',
]

const INTERNSHIP_CATEGORIES = [
  { id: 'software', label: 'Software Development', icon: '💻' },
  { id: 'data', label: 'Data & Analytics', icon: '📊' },
  { id: 'marketing', label: 'Marketing & Social Media', icon: '📱' },
  { id: 'design', label: 'Graphic Design & UI/UX', icon: '🎨' },
  { id: 'finance', label: 'Finance & Accounting', icon: '💰' },
  { id: 'ai', label: 'AI & Content Creation', icon: '🤖' },
  { id: 'healthcare', label: 'Healthcare & Medical', icon: '🏥' },
  { id: 'sales', label: 'Sales & Business Dev', icon: '📈' },
  { id: 'engineering', label: 'Engineering & Cloud', icon: '☁️' },
  { id: 'media', label: 'Journalism & Media', icon: '📝' },
  { id: 'nonprofit', label: 'Non-Profit & Community', icon: '🤝' },
  { id: 'other', label: 'Other', icon: '✨' },
]

const AVAILABILITY_OPTIONS = [
  { value: '', label: 'Select...' },
  { value: 'summer', label: 'Summer only (Jun-Aug)' },
  { value: 'fall', label: 'Fall semester' },
  { value: 'spring', label: 'Spring semester' },
  { value: 'year-round', label: 'Year-round' },
  { value: 'flexible', label: 'Flexible' },
]

const inputStyle = {
  width: '100%', padding: '10px 12px', borderRadius: 8,
  border: '1px solid var(--nriva-border)', fontSize: 14, fontFamily: 'inherit',
  background: 'white',
}
const labelStyle = { display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6, color: 'var(--nriva-text)' }
const fieldStyle = { marginBottom: 16 }

export default function InternProfile() {
  const { user } = useAuth()
  const { data: allInternships } = useInternships()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)

  // Editable profile fields
  const [displayName, setDisplayName] = useState('')
  const [gradeLevel, setGradeLevel] = useState('')
  const [school, setSchool] = useState('')
  const [city, setCity] = useState('')
  const [skills, setSkills] = useState([])
  const [interests, setInterests] = useState([])
  const [availability, setAvailability] = useState('')
  const [linkedIn, setLinkedIn] = useState('')
  const [portfolio, setPortfolio] = useState('')
  const [aboutMe, setAboutMe] = useState('')
  const [experienceSummary, setExperienceSummary] = useState('')
  const [resumeUrl, setResumeUrl] = useState(null)
  const [resumeName, setResumeName] = useState(null)
  const [resumeFile, setResumeFile] = useState(null)
  const [resumeQuarantined, setResumeQuarantined] = useState(false)

  // Skill-match selector
  const [matchInternshipId, setMatchInternshipId] = useState('')

  useEffect(() => {
    if (!user?.uid) return
    getUser(user.uid)
      .then(profile => {
        if (!profile) return
        setDisplayName(profile.displayName || '')
        setGradeLevel(profile.gradeLevel || '')
        setSchool(profile.school || '')
        setCity(profile.city || '')
        setSkills(profile.skills || [])
        setInterests(profile.interests || [])
        setAvailability(profile.availability || '')
        setLinkedIn(profile.linkedIn || '')
        setPortfolio(profile.portfolio || '')
        setAboutMe(profile.aboutMe || '')
        setExperienceSummary(profile.experienceSummary || '')
        setResumeUrl(profile.resumeUrl || null)
        setResumeName(profile.resumeName || null)
        setResumeQuarantined(!!profile.resumeQuarantined)
      })
      .catch(err => setError(err.message || 'Failed to load profile'))
      .finally(() => setLoading(false))
  }, [user?.uid])

  const openInternships = useMemo(
    () => allInternships.filter(i => i.status === 'open'),
    [allInternships]
  )

  const matchInternship = useMemo(
    () => openInternships.find(i => i.id === matchInternshipId) || null,
    [openInternships, matchInternshipId]
  )

  const toggle = (arr, setArr, item) => {
    setArr(prev => prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item])
  }

  // Add the chosen internship's skills (and pick a matching interest category) into the user's profile
  const applyMatch = () => {
    if (!matchInternship) return
    const internSkills = (matchInternship.skills || []).filter(Boolean)
    setSkills(prev => {
      const lower = new Set(prev.map(s => s.toLowerCase()))
      const merged = [...prev]
      internSkills.forEach(s => {
        if (!lower.has(s.toLowerCase())) {
          merged.push(s)
          lower.add(s.toLowerCase())
        }
      })
      return merged
    })

    // Best-effort interest tag based on title/description
    const text = `${matchInternship.title || ''} ${matchInternship.description || ''}`.toLowerCase()
    const categoryKeywords = {
      software: ['software', 'developer', 'programming', 'code', 'web', 'app'],
      data: ['data', 'analytics', 'sql', 'python', 'statistics'],
      marketing: ['marketing', 'social media', 'content', 'brand', 'campaign'],
      design: ['design', 'graphic', 'ui', 'ux', 'figma', 'creative'],
      finance: ['finance', 'accounting', 'budget', 'financial', 'bookkeeping'],
      ai: ['ai', 'machine learning', 'artificial intelligence', 'automation'],
      healthcare: ['health', 'medical', 'clinical', 'patient', 'care'],
      sales: ['sales', 'business development', 'revenue', 'client'],
      engineering: ['cloud', 'devops', 'infrastructure', 'engineer', 'aws', 'azure'],
      media: ['journalism', 'writing', 'editor', 'media', 'news', 'blog'],
      nonprofit: ['non-profit', 'nonprofit', 'volunteer', 'community', 'nriva'],
    }
    const matchedCategories = Object.entries(categoryKeywords)
      .filter(([, kws]) => kws.some(kw => text.includes(kw)))
      .map(([id]) => id)
    if (matchedCategories.length) {
      setInterests(prev => {
        const set = new Set(prev)
        matchedCategories.forEach(c => set.add(c))
        return Array.from(set)
      })
    }
    setSuccess(false)
  }

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    setSuccess(false)
    try {
      let resumeData = null
      if (resumeFile) {
        try {
          resumeData = await uploadResume(resumeFile, user.uid)
        } catch (err) {
          setError('Resume upload failed: ' + err.message)
          setSaving(false)
          return
        }
      }
      const updates = {
        displayName: displayName.trim(),
        gradeLevel,
        school: school.trim(),
        city: city.trim(),
        skills,
        interests,
        availability,
        linkedIn: linkedIn.trim(),
        portfolio: portfolio.trim(),
        aboutMe: aboutMe.trim(),
        experienceSummary: experienceSummary.trim(),
      }
      if (resumeData) {
        updates.resumeUrl = resumeData.url
        updates.resumeName = resumeData.name
        updates.resumeQuarantined = false
        setResumeUrl(resumeData.url)
        setResumeName(resumeData.name)
        setResumeQuarantined(false)
        setResumeFile(null)
      }
      await updateUserProfile(user.uid, updates)
      setSuccess(true)
      setTimeout(() => setSuccess(false), 4000)
    } catch (err) {
      setError(err.message || 'Failed to save profile')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div>
        <div className="page-header"><h1>My Profile</h1></div>
        <p style={{ color: 'var(--nriva-text-light)' }}>Loading…</p>
      </div>
    )
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>My Profile</h1>
          <p style={{ color: 'var(--nriva-text-light)', fontSize: 14, marginTop: 4 }}>
            Keep your profile up to date so we can match you with the best internships.
          </p>
        </div>
      </div>

      {/* Skill-match from internship */}
      <div className="card" style={{ marginBottom: 24, borderLeft: '4px solid #1a237e' }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>
          🎯 Match my skills to an internship I like
        </h2>
        <p style={{ fontSize: 13, color: 'var(--nriva-text-light)', marginBottom: 12 }}>
          Pick an open internship and we&apos;ll add its required skills to your profile so employers see you as a match.
        </p>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ flex: '1 1 280px' }}>
            <label style={labelStyle}>Choose an internship</label>
            <select value={matchInternshipId} onChange={(e) => setMatchInternshipId(e.target.value)} style={inputStyle}>
              <option value="">Select an open internship…</option>
              {openInternships.map(i => (
                <option key={i.id} value={i.id}>
                  {i.title} — {i.company}
                </option>
              ))}
            </select>
          </div>
          <button type="button" disabled={!matchInternship} onClick={applyMatch}
            className="btn btn-primary"
            style={{ opacity: matchInternship ? 1 : 0.5 }}>
            Add skills to my profile
          </button>
        </div>
        {matchInternship && (
          <div style={{ marginTop: 12, padding: 12, background: '#f8fafc', borderRadius: 8, fontSize: 13 }}>
            <div style={{ fontWeight: 600, marginBottom: 6 }}>
              {matchInternship.title} — {matchInternship.company}
            </div>
            {(matchInternship.skills || []).length > 0 ? (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {matchInternship.skills.map(s => {
                  const have = skills.some(us => us.toLowerCase() === s.toLowerCase())
                  return (
                    <span key={s} style={{
                      background: have ? '#dcfce7' : '#fef3c7',
                      color: have ? '#15803d' : '#92400e',
                      padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 500,
                    }}>
                      {have ? '✓ ' : '+ '}{s}
                    </span>
                  )
                })}
              </div>
            ) : (
              <span style={{ color: 'var(--nriva-text-light)' }}>No required skills listed.</span>
            )}
          </div>
        )}
      </div>

      {/* Edit profile */}
      <div className="card">
        <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>Edit Profile</h2>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div style={fieldStyle}>
            <label style={labelStyle}>Full Name</label>
            <input type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)} style={inputStyle} />
          </div>
          <div style={fieldStyle}>
            <label style={labelStyle}>Email</label>
            <input type="email" value={user?.email || ''} disabled style={{ ...inputStyle, background: '#f8fafc', color: '#94a3b8' }} />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
          <div style={fieldStyle}>
            <label style={labelStyle}>Grade Level</label>
            <select value={gradeLevel} onChange={(e) => setGradeLevel(e.target.value)} style={inputStyle}>
              <option value="">Select...</option>
              {GRADE_LEVELS.map(gl => <option key={gl} value={gl}>{gl}</option>)}
            </select>
          </div>
          <div style={fieldStyle}>
            <label style={labelStyle}>School / University</label>
            <input type="text" value={school} onChange={(e) => setSchool(e.target.value)} style={inputStyle} />
          </div>
          <div style={fieldStyle}>
            <label style={labelStyle}>City / Location</label>
            <input type="text" value={city} onChange={(e) => setCity(e.target.value)} autoComplete="address-level2" style={inputStyle} />
          </div>
        </div>

        <div style={fieldStyle}>
          <label style={labelStyle}>Your Skills</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {Array.from(new Set([...INTERN_SKILLS, ...skills])).map(s => (
              <button key={s} type="button" onClick={() => toggle(skills, setSkills, s)}
                style={{
                  padding: '6px 12px', borderRadius: 20, fontSize: 12, fontWeight: 500,
                  border: skills.includes(s) ? 'none' : '1px solid var(--nriva-border)',
                  background: skills.includes(s) ? '#1a237e' : 'white',
                  color: skills.includes(s) ? 'white' : 'var(--nriva-text-light)',
                  cursor: 'pointer',
                }}>
                {s}
              </button>
            ))}
          </div>
          <p style={{ fontSize: 11, color: 'var(--nriva-text-light)', marginTop: 6 }}>
            Tap a skill to add or remove it.
          </p>
        </div>

        <div style={fieldStyle}>
          <label style={labelStyle}>Areas of Interest</label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 8 }}>
            {INTERNSHIP_CATEGORIES.map(cat => (
              <button key={cat.id} type="button" onClick={() => toggle(interests, setInterests, cat.id)}
                style={{
                  padding: '10px 12px', borderRadius: 10, textAlign: 'left',
                  display: 'flex', alignItems: 'center', gap: 10,
                  border: interests.includes(cat.id) ? '2px solid #1a237e' : '1px solid var(--nriva-border)',
                  background: interests.includes(cat.id) ? '#eef2ff' : 'white', cursor: 'pointer',
                }}>
                <span style={{ fontSize: 18 }}>{cat.icon}</span>
                <span style={{ fontSize: 12, fontWeight: interests.includes(cat.id) ? 600 : 400, color: interests.includes(cat.id) ? '#1a237e' : 'var(--nriva-text-light)' }}>{cat.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
          <div style={fieldStyle}>
            <label style={labelStyle}>Availability</label>
            <select value={availability} onChange={(e) => setAvailability(e.target.value)} style={inputStyle}>
              {AVAILABILITY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <div style={fieldStyle}>
            <label style={labelStyle}>LinkedIn Profile</label>
            <input type="url" value={linkedIn} onChange={(e) => setLinkedIn(e.target.value)} placeholder="https://linkedin.com/in/..." style={inputStyle} />
          </div>
          <div style={fieldStyle}>
            <label style={labelStyle}>Portfolio / GitHub</label>
            <input type="url" value={portfolio} onChange={(e) => setPortfolio(e.target.value)} placeholder="https://..." style={inputStyle} />
          </div>
        </div>

        <div style={fieldStyle}>
          <label style={labelStyle}>Experience Summary</label>
          <textarea value={experienceSummary} onChange={(e) => setExperienceSummary(e.target.value)}
            placeholder="School projects, clubs, volunteering, past jobs or internships, awards..."
            style={{ ...inputStyle, minHeight: 90, resize: 'vertical' }} />
        </div>

        <div style={fieldStyle}>
          <label style={labelStyle}>About Me</label>
          <textarea value={aboutMe} onChange={(e) => setAboutMe(e.target.value)}
            placeholder="Goals, career aspirations, fun facts..."
            style={{ ...inputStyle, minHeight: 70, resize: 'vertical' }} />
        </div>

        <div style={fieldStyle}>
          <label style={labelStyle}>Resume / CV (PDF, DOC, DOCX - max 5MB)</label>
          {resumeQuarantined && (
            <div style={{ marginBottom: 8, fontSize: 12, color: '#b91c1c', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 6, padding: '8px 10px' }}>
              ⚠ Your previous upload was flagged by our virus scanner and was removed. Please upload a different file.
            </div>
          )}
          {resumeUrl && !resumeFile && (
            <div style={{ marginBottom: 8, fontSize: 13 }}>
              Current: <a href={resumeUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--nriva-primary)' }}>{resumeName || 'View resume'}</a>
            </div>
          )}
          <input type="file" accept=".pdf,.doc,.docx"
            onChange={(e) => setResumeFile(e.target.files[0] || null)}
            style={{ ...inputStyle, padding: 8 }} />
          {resumeFile && (
            <div style={{ fontSize: 12, color: '#15803d', marginTop: 4 }}>
              New: {resumeFile.name} ({(resumeFile.size / 1024).toFixed(1)} KB) — will replace current resume on save.
            </div>
          )}
        </div>

        {error && (
          <div style={{ background: '#fef2f2', color: '#b91c1c', padding: '10px 12px', borderRadius: 8, fontSize: 13, marginBottom: 12 }}>
            {error}
          </div>
        )}
        {success && (
          <div style={{ background: '#dcfce7', color: '#15803d', padding: '10px 12px', borderRadius: 8, fontSize: 13, marginBottom: 12 }}>
            ✓ Profile saved successfully.
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button type="button" onClick={handleSave} disabled={saving}
            className="btn btn-primary"
            style={{ opacity: saving ? 0.6 : 1, minWidth: 140 }}>
            {saving ? 'Saving…' : 'Save Profile'}
          </button>
        </div>
      </div>

      <PrivacySection user={user} />
    </div>
  )
}

function PrivacySection({ user }) {
  const navigate = useNavigate()
  const [busy, setBusy] = useState(null) // 'export' | 'delete' | null
  const [deleteConfirm, setDeleteConfirm] = useState('')
  const [deleteError, setDeleteError] = useState(null)

  const handleExport = async () => {
    setBusy('export')
    try {
      const bundle = await exportUserData(user.uid)
      const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `nriva-data-export-${user.uid.slice(0, 8)}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err) {
      alert('Export failed: ' + (err?.message || 'unknown error'))
    } finally {
      setBusy(null)
    }
  }

  const handleDelete = async () => {
    setDeleteError(null)
    setBusy('delete')
    try {
      await selfDeleteUser(user.uid)
      try { await deleteAllResumes(user.uid) } catch { /* best-effort */ }
      try {
        await deleteCurrentAuthUser()
      } catch (err) {
        if (err?.code === 'auth/requires-recent-login') {
          await logOut()
          navigate('/')
          alert('Your account data was removed. Please sign in once more to fully delete your sign-in record, then we will finish removing it.')
          return
        }
        throw err
      }
      navigate('/')
      alert('Your account has been deleted. Take care!')
    } catch (err) {
      setDeleteError(err?.message || 'Account deletion failed')
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="card" style={{ marginTop: 24, borderLeft: '4px solid #b91c1c' }}>
      <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 4 }}>Privacy</h2>
      <p style={{ fontSize: 13, color: 'var(--nriva-text-light)', marginBottom: 16 }}>
        You can download a copy of everything we hold about you, or delete your account entirely.
      </p>

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 18 }}>
        <button type="button" onClick={handleExport}
          disabled={busy !== null}
          className="btn btn-outline btn-sm"
          style={{ opacity: busy === 'export' ? 0.6 : 1 }}>
          {busy === 'export' ? 'Preparing…' : 'Download my data (JSON)'}
        </button>
      </div>

      <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '12px 14px' }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#b91c1c', marginBottom: 6 }}>
          Delete my account
        </div>
        <p style={{ fontSize: 12, color: '#7f1d1d', lineHeight: 1.5, marginBottom: 10 }}>
          This removes your profile, applications, messages, and resume file. Audit-log entries
          may be kept for up to 12 months. This cannot be undone. Type <code>DELETE</code> below
          to confirm.
        </p>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <input type="text" value={deleteConfirm} onChange={(e) => setDeleteConfirm(e.target.value)}
            placeholder="Type DELETE"
            style={{ flex: '1 1 180px', padding: '8px 12px', borderRadius: 6, border: '1px solid #fca5a5', fontSize: 13 }} />
          <button type="button" onClick={handleDelete}
            disabled={deleteConfirm !== 'DELETE' || busy !== null}
            style={{
              padding: '8px 14px', borderRadius: 6, border: 'none',
              background: '#b91c1c', color: 'white', fontSize: 13, fontWeight: 600,
              cursor: deleteConfirm === 'DELETE' && busy === null ? 'pointer' : 'not-allowed',
              opacity: (deleteConfirm === 'DELETE' && busy === null) ? 1 : 0.5,
            }}>
            {busy === 'delete' ? 'Deleting…' : 'Delete account permanently'}
          </button>
        </div>
        {deleteError && (
          <div style={{ marginTop: 8, fontSize: 12, color: '#b91c1c' }}>{deleteError}</div>
        )}
      </div>
    </div>
  )
}
