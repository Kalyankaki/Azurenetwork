import { useState, useEffect, useMemo } from 'react'
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { db, uploadResume } from '../../firebase'
import { useAuth } from '../../contexts/AuthContext'
import { useInternships } from '../../hooks/useFirestore'
import { getUser, GRADE_LEVELS, logActivity } from '../../services/firestore'

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

const emptyProfile = {
  displayName: '',
  gradeLevel: '',
  school: '',
  city: '',
  skills: [],
  interests: [],
  availability: '',
  linkedIn: '',
  portfolio: '',
  experienceSummary: '',
  aboutMe: '',
  nrivaMembership: '',
}

export default function InternProfile() {
  const { user } = useAuth()
  const { data: allInternships, loading: internshipsLoading } = useInternships()
  const [profile, setProfile] = useState(emptyProfile)
  const [originalProfile, setOriginalProfile] = useState(emptyProfile)
  const [resumeName, setResumeName] = useState(null)
  const [resumeUrl, setResumeUrl] = useState(null)
  const [resumeFile, setResumeFile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [successMsg, setSuccessMsg] = useState(null)
  const [selectedInternshipId, setSelectedInternshipId] = useState('')

  const openInternships = useMemo(
    () => allInternships.filter(i => i.status === 'open'),
    [allInternships]
  )

  const selectedInternship = useMemo(
    () => openInternships.find(i => i.id === selectedInternshipId) || null,
    [openInternships, selectedInternshipId]
  )

  useEffect(() => {
    if (!user?.uid) return
    setLoading(true)
    getUser(user.uid)
      .then(p => {
        if (!p) {
          setLoading(false)
          return
        }
        const loaded = {
          displayName: p.displayName || '',
          gradeLevel: p.gradeLevel || '',
          school: p.school || '',
          city: p.city || '',
          skills: Array.isArray(p.skills) ? p.skills : [],
          interests: Array.isArray(p.interests) ? p.interests : [],
          availability: p.availability || '',
          linkedIn: p.linkedIn || '',
          portfolio: p.portfolio || '',
          experienceSummary: p.experienceSummary || '',
          aboutMe: p.aboutMe || '',
          nrivaMembership: p.nrivaMembership || '',
        }
        setProfile(loaded)
        setOriginalProfile(loaded)
        setResumeUrl(p.resumeUrl || null)
        setResumeName(p.resumeName || null)
        setLoading(false)
      })
      .catch(err => {
        setError(err?.message || 'Failed to load profile')
        setLoading(false)
      })
  }, [user?.uid])

  const updateField = (key, value) => {
    setProfile(prev => ({ ...prev, [key]: value }))
    setSuccessMsg(null)
  }

  const toggleArrayItem = (key, item) => {
    setProfile(prev => ({
      ...prev,
      [key]: prev[key].includes(item)
        ? prev[key].filter(i => i !== item)
        : [...prev[key], item],
    }))
    setSuccessMsg(null)
  }

  const matchedSkillsForSelected = useMemo(() => {
    if (!selectedInternship) return []
    return (selectedInternship.skills || [])
  }, [selectedInternship])

  const addSkillsFromInternship = (mode) => {
    if (!selectedInternship) return
    const internshipSkills = selectedInternship.skills || []
    if (internshipSkills.length === 0) return
    setProfile(prev => {
      const next = mode === 'replace'
        ? [...internshipSkills]
        : Array.from(new Set([...(prev.skills || []), ...internshipSkills]))
      return { ...prev, skills: next }
    })
    setSuccessMsg(null)
  }

  const hasChanges = useMemo(() => {
    if (resumeFile) return true
    return JSON.stringify(profile) !== JSON.stringify(originalProfile)
  }, [profile, originalProfile, resumeFile])

  const handleSave = async () => {
    if (!user?.uid) return
    setSaving(true)
    setError(null)
    setSuccessMsg(null)
    try {
      const updates = {
        ...profile,
        displayName: profile.displayName.trim(),
        school: profile.school.trim(),
        city: profile.city.trim(),
        linkedIn: profile.linkedIn.trim(),
        portfolio: profile.portfolio.trim(),
        experienceSummary: profile.experienceSummary.trim(),
        aboutMe: profile.aboutMe.trim(),
        nrivaMembership: profile.nrivaMembership.trim(),
        updatedAt: serverTimestamp(),
      }

      if (resumeFile) {
        const resumeData = await uploadResume(resumeFile, user.uid)
        updates.resumeUrl = resumeData.url
        updates.resumeName = resumeData.name
      }

      await updateDoc(doc(db, 'users', user.uid), updates)

      if (resumeFile) {
        setResumeUrl(updates.resumeUrl)
        setResumeName(updates.resumeName)
        setResumeFile(null)
      }
      setOriginalProfile(profile)
      setSuccessMsg('Profile saved successfully.')
      logActivity('profile_updated', { userUid: user.uid })
    } catch (err) {
      setError(err?.message || 'Failed to save profile')
    } finally {
      setSaving(false)
    }
  }

  const handleReset = () => {
    setProfile(originalProfile)
    setResumeFile(null)
    setError(null)
    setSuccessMsg(null)
  }

  if (loading) {
    return (
      <div className="card">
        <p style={{ color: 'var(--nriva-text-light)' }}>Loading your profile...</p>
      </div>
    )
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>My Profile</h1>
          <p style={{ color: 'var(--nriva-text-light)', fontSize: 14, marginTop: 4 }}>
            Keep your profile up to date — better matches mean better internships.
          </p>
        </div>
      </div>

      {error && (
        <div style={errorBox}>{error}</div>
      )}
      {successMsg && (
        <div style={successBox}>{successMsg}</div>
      )}

      {/* Match skills to a specific internship */}
      <div className="card" style={{ marginBottom: 24 }}>
        <h2 style={sectionHeader}>🎯 Match Skills to an Internship</h2>
        <p style={{ fontSize: 13, color: 'var(--nriva-text-light)', marginBottom: 12 }}>
          Pick an open internship you&apos;re interested in. We&apos;ll show its required skills and let you add them to your profile in one click.
        </p>
        <div style={fieldStyle}>
          <label style={labelStyle}>Choose an internship</label>
          <select
            value={selectedInternshipId}
            onChange={(e) => setSelectedInternshipId(e.target.value)}
            style={inputStyle}
            disabled={internshipsLoading}
          >
            <option value="">{internshipsLoading ? 'Loading internships...' : '— Select an internship —'}</option>
            {openInternships.map(i => (
              <option key={i.id} value={i.id}>
                {i.title}{i.company ? ` — ${i.company}` : ''}
              </option>
            ))}
          </select>
        </div>

        {selectedInternship && (
          <div style={{
            border: '1px solid var(--nriva-border)', borderRadius: 'var(--nriva-radius)',
            padding: 16, background: '#f8fafc',
          }}>
            <div style={{ marginBottom: 8 }}>
              <strong style={{ fontSize: 14 }}>{selectedInternship.title}</strong>
              <span style={{ color: 'var(--nriva-text-light)', fontSize: 13 }}>
                {selectedInternship.company ? ` — ${selectedInternship.company}` : ''}
              </span>
            </div>
            {matchedSkillsForSelected.length === 0 ? (
              <p style={{ fontSize: 13, color: 'var(--nriva-text-light)' }}>
                This internship has no specific skills listed.
              </p>
            ) : (
              <>
                <div style={{ fontSize: 13, marginBottom: 8, color: 'var(--nriva-text-light)' }}>
                  Required skills:
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
                  {matchedSkillsForSelected.map(s => {
                    const have = profile.skills.some(us => us.toLowerCase() === s.toLowerCase())
                    return (
                      <span key={s} style={{
                        background: have ? '#dcfce7' : '#fef3c7',
                        color: have ? '#15803d' : '#92400e',
                        padding: '3px 10px', borderRadius: 12, fontSize: 12, fontWeight: 500,
                      }}>
                        {have ? '✓ ' : ''}{s}
                      </span>
                    )
                  })}
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button type="button" onClick={() => addSkillsFromInternship('add')} className="btn btn-primary btn-sm">
                    Add to my skills
                  </button>
                  <button type="button" onClick={() => addSkillsFromInternship('replace')} className="btn btn-outline btn-sm">
                    Replace my skills with these
                  </button>
                </div>
                <p style={{ fontSize: 11, color: 'var(--nriva-text-light)', marginTop: 8 }}>
                  Don&apos;t forget to click <strong>Save Changes</strong> at the bottom to keep these updates.
                </p>
              </>
            )}
          </div>
        )}
      </div>

      {/* Basic info */}
      <div className="card" style={{ marginBottom: 24 }}>
        <h2 style={sectionHeader}>Basic Information</h2>
        <div style={fieldStyle}>
          <label style={labelStyle}>Full Name</label>
          <input type="text" value={profile.displayName}
            onChange={(e) => updateField('displayName', e.target.value)}
            style={inputStyle} placeholder="Your full name" />
        </div>
        <div style={fieldStyle}>
          <label style={labelStyle}>Email</label>
          <input type="email" value={user?.email || ''} disabled
            style={{ ...inputStyle, background: '#f8fafc', color: '#94a3b8' }} />
        </div>
        <div style={fieldStyle}>
          <label style={labelStyle}>NRIVA Membership ID</label>
          <input type="text" value={profile.nrivaMembership}
            onChange={(e) => updateField('nrivaMembership', e.target.value)}
            style={inputStyle} placeholder="e.g., NRIVA-12345 (optional)" />
        </div>
      </div>

      {/* Academic info */}
      <div className="card" style={{ marginBottom: 24 }}>
        <h2 style={sectionHeader}>Academic & Location</h2>
        <div style={fieldStyle}>
          <label style={labelStyle}>Current Grade Level</label>
          <select value={profile.gradeLevel}
            onChange={(e) => updateField('gradeLevel', e.target.value)}
            style={inputStyle}>
            <option value="">Select...</option>
            {GRADE_LEVELS.map(gl => <option key={gl} value={gl}>{gl}</option>)}
          </select>
        </div>
        <div style={fieldStyle}>
          <label style={labelStyle}>School / University</label>
          <input type="text" value={profile.school}
            onChange={(e) => updateField('school', e.target.value)}
            style={inputStyle} placeholder="e.g., Lincoln High School or UT Austin" />
        </div>
        <div style={fieldStyle}>
          <label style={labelStyle}>City / Location</label>
          <input type="text" value={profile.city}
            onChange={(e) => updateField('city', e.target.value)}
            style={inputStyle} placeholder="e.g., Austin, TX" />
        </div>
        <div style={fieldStyle}>
          <label style={labelStyle}>Availability</label>
          <select value={profile.availability}
            onChange={(e) => updateField('availability', e.target.value)}
            style={inputStyle}>
            {AVAILABILITY_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Skills */}
      <div className="card" style={{ marginBottom: 24 }}>
        <h2 style={sectionHeader}>Skills</h2>
        <p style={{ fontSize: 13, color: 'var(--nriva-text-light)', marginBottom: 12 }}>
          Select all that apply. These power your internship matches.
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {Array.from(new Set([...INTERN_SKILLS, ...profile.skills])).map(s => {
            const selected = profile.skills.includes(s)
            return (
              <button key={s} type="button"
                onClick={() => toggleArrayItem('skills', s)}
                style={{
                  padding: '6px 12px', borderRadius: 20, fontSize: 12, fontWeight: 500,
                  border: selected ? 'none' : '1px solid #e2e8f0',
                  background: selected ? '#1a237e' : 'white',
                  color: selected ? 'white' : '#64748b',
                  cursor: 'pointer', transition: 'all 0.2s',
                }}>
                {s}
              </button>
            )
          })}
        </div>
      </div>

      {/* Interests */}
      <div className="card" style={{ marginBottom: 24 }}>
        <h2 style={sectionHeader}>Interests</h2>
        <p style={{ fontSize: 13, color: 'var(--nriva-text-light)', marginBottom: 12 }}>
          Pick the kinds of internships you&apos;d like to do.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 10 }}>
          {INTERNSHIP_CATEGORIES.map(cat => {
            const selected = profile.interests.includes(cat.id)
            return (
              <button key={cat.id} type="button"
                onClick={() => toggleArrayItem('interests', cat.id)}
                style={{
                  padding: '12px', borderRadius: 10, textAlign: 'left',
                  display: 'flex', alignItems: 'center', gap: 10,
                  border: selected ? '2px solid #1a237e' : '1px solid #e2e8f0',
                  background: selected ? '#eef2ff' : 'white',
                  cursor: 'pointer', transition: 'all 0.2s',
                }}>
                <span style={{ fontSize: 20 }}>{cat.icon}</span>
                <span style={{ fontSize: 13, fontWeight: selected ? 600 : 400, color: selected ? '#1a237e' : '#64748b' }}>
                  {cat.label}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Links and resume */}
      <div className="card" style={{ marginBottom: 24 }}>
        <h2 style={sectionHeader}>Links & Resume</h2>
        <div style={fieldStyle}>
          <label style={labelStyle}>LinkedIn Profile</label>
          <input type="url" value={profile.linkedIn}
            onChange={(e) => updateField('linkedIn', e.target.value)}
            style={inputStyle} placeholder="https://linkedin.com/in/..." />
        </div>
        <div style={fieldStyle}>
          <label style={labelStyle}>Portfolio / GitHub</label>
          <input type="url" value={profile.portfolio}
            onChange={(e) => updateField('portfolio', e.target.value)}
            style={inputStyle} placeholder="https://..." />
        </div>
        <div style={fieldStyle}>
          <label style={labelStyle}>Resume / CV (PDF, DOC, DOCX - max 5MB)</label>
          {resumeUrl && !resumeFile && (
            <div style={{ fontSize: 13, marginBottom: 6 }}>
              Current: <a href={resumeUrl} target="_blank" rel="noopener noreferrer"
                style={{ color: 'var(--nriva-primary)', fontWeight: 500 }}>
                {resumeName || 'View resume'}
              </a>
            </div>
          )}
          <input type="file" accept=".pdf,.doc,.docx"
            onChange={(e) => { setResumeFile(e.target.files[0] || null); setSuccessMsg(null) }}
            style={{ ...inputStyle, padding: 8 }} />
          {resumeFile && (
            <div style={{ fontSize: 12, color: '#15803d', marginTop: 4 }}>
              New file selected: {resumeFile.name} ({(resumeFile.size / 1024).toFixed(1)} KB) — will replace on save.
            </div>
          )}
        </div>
      </div>

      {/* About */}
      <div className="card" style={{ marginBottom: 24 }}>
        <h2 style={sectionHeader}>About You</h2>
        <div style={fieldStyle}>
          <label style={labelStyle}>Experience Summary</label>
          <textarea value={profile.experienceSummary}
            onChange={(e) => updateField('experienceSummary', e.target.value)}
            placeholder="School projects, clubs, volunteering, past jobs or internships, awards..."
            style={{ ...inputStyle, minHeight: 100, resize: 'vertical' }} />
        </div>
        <div style={fieldStyle}>
          <label style={labelStyle}>Anything else you&apos;d like employers to know?</label>
          <textarea value={profile.aboutMe}
            onChange={(e) => updateField('aboutMe', e.target.value)}
            placeholder="Goals, career aspirations, fun facts..."
            style={{ ...inputStyle, minHeight: 80, resize: 'vertical' }} />
        </div>
      </div>

      {/* Save bar */}
      <div style={{
        position: 'sticky', bottom: 0, background: 'white',
        borderTop: '1px solid var(--nriva-border)',
        padding: '14px 16px', display: 'flex', gap: 12, justifyContent: 'flex-end',
        marginTop: 16, borderRadius: 'var(--nriva-radius)',
        boxShadow: '0 -2px 8px rgba(0,0,0,0.04)',
      }}>
        <button type="button" onClick={handleReset} disabled={!hasChanges || saving}
          className="btn btn-outline">
          Discard Changes
        </button>
        <button type="button" onClick={handleSave} disabled={!hasChanges || saving}
          className="btn btn-primary">
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  )
}

const inputStyle = { width: '100%', padding: '11px 14px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 14, boxSizing: 'border-box' }
const labelStyle = { display: 'block', fontWeight: 500, fontSize: 14, marginBottom: 6 }
const fieldStyle = { marginBottom: 16 }
const sectionHeader = { fontSize: 18, fontWeight: 600, marginBottom: 16 }
const errorBox = { background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#dc2626', marginBottom: 16 }
const successBox = { background: '#dcfce7', border: '1px solid #86efac', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#15803d', marginBottom: 16 }
