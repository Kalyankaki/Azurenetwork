import { useState, useEffect, useMemo } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useInternships } from '../../hooks/useFirestore'
import { getUser, updateInternProfile, GRADE_LEVELS } from '../../services/firestore'
import { uploadResume, uploadProfilePhoto } from '../../firebase'
import Toast from '../../components/Toast'
import { formatDate } from '../../utils/date'

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

const EMPTY = {
  displayName: '', photoURL: '',
  gradeLevel: '', school: '', city: '',
  skills: [], interests: [], availability: '',
  linkedIn: '', portfolio: '',
  experienceSummary: '', aboutMe: '',
  resumeUrl: '', resumeName: '',
}

function pickProfile(doc) {
  if (!doc) return { ...EMPTY }
  const out = { ...EMPTY }
  for (const k of Object.keys(EMPTY)) {
    if (doc[k] !== undefined && doc[k] !== null) out[k] = doc[k]
  }
  return out
}

function arraysEqual(a, b) {
  if (a.length !== b.length) return false
  const sa = [...a].sort(), sb = [...b].sort()
  return sa.every((v, i) => v === sb[i])
}

function profilesDiffer(a, b) {
  for (const k of Object.keys(EMPTY)) {
    if (Array.isArray(EMPTY[k])) {
      if (!arraysEqual(a[k] || [], b[k] || [])) return true
    } else if ((a[k] || '') !== (b[k] || '')) {
      return true
    }
  }
  return false
}

export default function InternProfile() {
  const { user } = useAuth()
  const { data: allInternships, loading: internshipsLoading } = useInternships()
  const [profile, setProfile] = useState(EMPTY)
  const [original, setOriginal] = useState(EMPTY)
  const [meta, setMeta] = useState({ email: '', nrivaMembership: '', coordinator: null, updatedAt: null })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [photoUploading, setPhotoUploading] = useState(false)
  const [resumeUploading, setResumeUploading] = useState(false)
  const [toast, setToast] = useState(null)
  const [selectedInternshipId, setSelectedInternshipId] = useState('')

  const openInternships = useMemo(
    () => (allInternships || []).filter(i => i.status === 'open'),
    [allInternships]
  )
  const selectedInternship = useMemo(
    () => openInternships.find(i => i.id === selectedInternshipId) || null,
    [openInternships, selectedInternshipId]
  )
  const matchedSkills = selectedInternship?.skills || []

  const addSkillsFromInternship = (mode) => {
    if (matchedSkills.length === 0) return
    setProfile(p => {
      const next = mode === 'replace'
        ? [...matchedSkills]
        : Array.from(new Set([...(p.skills || []), ...matchedSkills]))
      return { ...p, skills: next }
    })
  }

  useEffect(() => {
    if (!user?.uid) return
    let cancelled = false
    setLoading(true)
    getUser(user.uid)
      .then(doc => {
        if (cancelled) return
        const p = pickProfile(doc)
        // Fall back to auth display name / photo if profile is empty
        if (!p.displayName && user.displayName) p.displayName = user.displayName
        if (!p.photoURL && user.photoURL) p.photoURL = user.photoURL
        setProfile(p)
        setOriginal(p)
        setMeta({
          email: doc?.email || user.email || '',
          nrivaMembership: doc?.nrivaMembership || '',
          coordinator: doc?.coordinator || null,
          updatedAt: doc?.updatedAt || null,
        })
        setLoading(false)
      })
      .catch(err => {
        if (cancelled) return
        setToast({ type: 'error', message: 'Failed to load profile: ' + (err?.message || 'unknown error') })
        setLoading(false)
      })
    return () => { cancelled = true }
  }, [user?.uid])

  const dirty = useMemo(() => profilesDiffer(profile, original), [profile, original])

  const setField = (k, v) => setProfile(p => ({ ...p, [k]: v }))
  const toggleArrayItem = (k, item) =>
    setProfile(p => {
      const arr = p[k] || []
      return { ...p, [k]: arr.includes(item) ? arr.filter(x => x !== item) : [...arr, item] }
    })

  const handlePhotoChange = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setPhotoUploading(true)
    try {
      const { url } = await uploadProfilePhoto(file, user.uid)
      setProfile(p => ({ ...p, photoURL: url }))
      // Persist immediately so the header avatar reflects the new photo without waiting for Save.
      await updateInternProfile(user.uid, { photoURL: url })
      setOriginal(o => ({ ...o, photoURL: url }))
      setToast({ type: 'success', message: 'Profile photo updated' })
    } catch (err) {
      setToast({ type: 'error', message: err?.message || 'Photo upload failed' })
    } finally {
      setPhotoUploading(false)
    }
  }

  const handleResumeChange = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setResumeUploading(true)
    try {
      const { url, name } = await uploadResume(file, user.uid)
      setProfile(p => ({ ...p, resumeUrl: url, resumeName: name }))
      await updateInternProfile(user.uid, { resumeUrl: url, resumeName: name })
      setOriginal(o => ({ ...o, resumeUrl: url, resumeName: name }))
      setToast({ type: 'success', message: 'Resume uploaded' })
    } catch (err) {
      setToast({ type: 'error', message: err?.message || 'Resume upload failed' })
    } finally {
      setResumeUploading(false)
    }
  }

  const handleSave = async () => {
    if (!profile.displayName?.trim()) {
      setToast({ type: 'error', message: 'Name is required' })
      return
    }
    setSaving(true)
    try {
      const payload = {
        ...profile,
        displayName: profile.displayName.trim(),
        school: profile.school.trim(),
        city: profile.city.trim(),
        linkedIn: profile.linkedIn.trim(),
        portfolio: profile.portfolio.trim(),
        experienceSummary: profile.experienceSummary.trim(),
        aboutMe: profile.aboutMe.trim(),
      }
      await updateInternProfile(user.uid, payload)
      setOriginal(payload)
      setProfile(payload)
      setToast({ type: 'success', message: 'Profile saved' })
    } catch (err) {
      const msg = err?.code === 'permission-denied'
        ? 'Permission denied. Please sign out and sign back in, then try again.'
        : (err?.message || 'Failed to save profile')
      setToast({ type: 'error', message: msg })
    } finally {
      setSaving(false)
    }
  }

  const handleReset = () => setProfile(original)

  if (loading) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: 'var(--nriva-text-light)' }}>
        Loading your profile…
      </div>
    )
  }

  const initial = (profile.displayName || meta.email || 'U')[0].toUpperCase()

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>My Profile</h1>
          <p style={{ color: 'var(--nriva-text-light)', fontSize: 14, marginTop: 4 }}>
            Keep this up to date — employers see it when matching you to internships.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button type="button" className="btn btn-outline" onClick={handleReset}
            disabled={!dirty || saving}
            style={{ opacity: (!dirty || saving) ? 0.5 : 1 }}>
            Discard
          </button>
          <button type="button" className="btn btn-primary" onClick={handleSave}
            disabled={!dirty || saving}
            style={{ opacity: (!dirty || saving) ? 0.6 : 1 }}>
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </div>

      {/* Identity card: photo + name + read-only meta */}
      <div className="card" style={{ marginBottom: 16 }}>
        <h2 style={sectionTitle}>Identity</h2>
        <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            {profile.photoURL ? (
              <img src={profile.photoURL} alt="" referrerPolicy="no-referrer"
                style={{ width: 96, height: 96, borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--nriva-border)' }} />
            ) : (
              <div style={{
                width: 96, height: 96, borderRadius: '50%', background: '#1a237e', color: 'white',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36, fontWeight: 600,
              }}>{initial}</div>
            )}
            <label className="btn btn-sm btn-outline" style={{ cursor: 'pointer' }}>
              {photoUploading ? 'Uploading…' : 'Change Photo'}
              <input type="file" accept="image/jpeg,image/png,image/webp"
                onChange={handlePhotoChange} disabled={photoUploading}
                style={{ display: 'none' }} />
            </label>
            <div style={{ fontSize: 11, color: 'var(--nriva-text-light)' }}>JPG / PNG / WebP, max 2MB</div>
          </div>

          <div style={{ flex: 1, minWidth: 260, display: 'grid', gridTemplateColumns: '1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>Full Name <span style={{ color: '#c62828' }}>*</span></label>
              <input type="text" value={profile.displayName}
                onChange={(e) => setField('displayName', e.target.value)}
                placeholder="Your full name" autoComplete="name" style={inputStyle} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={labelStyle}>Email</label>
                <input type="email" value={meta.email} disabled
                  style={{ ...inputStyle, background: '#f8fafc', color: '#94a3b8' }} />
                <div style={readOnlyHint}>Managed by your sign-in account</div>
              </div>
              <div>
                <label style={labelStyle}>NRIVA Membership ID</label>
                <input type="text" value={meta.nrivaMembership || '—'} disabled
                  style={{ ...inputStyle, background: '#f8fafc', color: '#94a3b8' }} />
                <div style={readOnlyHint}>Contact an admin to update</div>
              </div>
            </div>
            {meta.coordinator && (
              <div style={{ background: '#eef2ff', border: '1px solid #c7d2fe', borderRadius: 8, padding: '10px 12px', fontSize: 12 }}>
                <div style={{ fontWeight: 600, color: '#1a237e', marginBottom: 2 }}>NRIVA Coordinator</div>
                <div>{meta.coordinator.name}{meta.coordinator.email ? ` · ${meta.coordinator.email}` : ''}</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Education */}
      <div className="card" style={{ marginBottom: 16 }}>
        <h2 style={sectionTitle}>Education & Location</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
          <div>
            <label style={labelStyle}>Current Grade Level</label>
            <select value={profile.gradeLevel} onChange={(e) => setField('gradeLevel', e.target.value)} style={inputStyle}>
              <option value="">Select…</option>
              {GRADE_LEVELS.map(gl => <option key={gl} value={gl}>{gl}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>School / University</label>
            <input type="text" value={profile.school} onChange={(e) => setField('school', e.target.value)}
              placeholder="e.g., Lincoln High School or UT Austin" style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>City / Location</label>
            <input type="text" value={profile.city} onChange={(e) => setField('city', e.target.value)}
              placeholder="e.g., Austin, TX" autoComplete="address-level2" style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Availability</label>
            <select value={profile.availability} onChange={(e) => setField('availability', e.target.value)} style={inputStyle}>
              {AVAILABILITY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Match Skills to an Internship */}
      <div className="card" style={{ marginBottom: 16 }}>
        <h2 style={sectionTitle}>🎯 Match Skills to an Internship</h2>
        <p style={{ fontSize: 13, color: 'var(--nriva-text-light)', marginBottom: 12 }}>
          Pick an open internship — we&apos;ll show its required skills and let you add them to your profile in one click.
        </p>
        <div style={{ marginBottom: selectedInternship ? 14 : 0 }}>
          <label style={labelStyle}>Choose an internship</label>
          <select value={selectedInternshipId}
            onChange={(e) => setSelectedInternshipId(e.target.value)}
            disabled={internshipsLoading}
            style={inputStyle}>
            <option value="">{internshipsLoading ? 'Loading internships…' : '— Select an internship —'}</option>
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
            padding: 14, background: '#f8fafc',
          }}>
            <div style={{ marginBottom: 8 }}>
              <strong style={{ fontSize: 14 }}>{selectedInternship.title}</strong>
              {selectedInternship.company && (
                <span style={{ color: 'var(--nriva-text-light)', fontSize: 13 }}> — {selectedInternship.company}</span>
              )}
            </div>
            {matchedSkills.length === 0 ? (
              <p style={{ fontSize: 13, color: 'var(--nriva-text-light)' }}>
                This internship has no specific skills listed.
              </p>
            ) : (
              <>
                <div style={{ fontSize: 12, marginBottom: 8, color: 'var(--nriva-text-light)' }}>
                  Required skills (✓ = you already have it):
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
                  {matchedSkills.map(s => {
                    const have = (profile.skills || []).some(us => us.toLowerCase() === s.toLowerCase())
                    return (
                      <span key={s} style={{
                        background: have ? '#dcfce7' : '#fef3c7',
                        color: have ? '#15803d' : '#92400e',
                        padding: '3px 10px', borderRadius: 12, fontSize: 12, fontWeight: 500,
                      }}>{have ? '✓ ' : ''}{s}</span>
                    )
                  })}
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button type="button" onClick={() => addSkillsFromInternship('add')} className="btn btn-sm btn-primary">
                    Add to my skills
                  </button>
                  <button type="button" onClick={() => addSkillsFromInternship('replace')} className="btn btn-sm btn-outline">
                    Replace my skills with these
                  </button>
                </div>
                <p style={{ fontSize: 11, color: 'var(--nriva-text-light)', marginTop: 8 }}>
                  Don&apos;t forget to click <strong>Save Changes</strong> to keep these updates.
                </p>
              </>
            )}
          </div>
        )}
      </div>

      {/* Skills */}
      <div className="card" style={{ marginBottom: 16 }}>
        <h2 style={sectionTitle}>Skills</h2>
        <p style={{ fontSize: 12, color: 'var(--nriva-text-light)', marginBottom: 10 }}>
          Tap to toggle. Employers use these to match you with the right internships.
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {Array.from(new Set([...INTERN_SKILLS, ...(profile.skills || [])])).map(s => {
            const active = (profile.skills || []).includes(s)
            return (
              <button key={s} type="button" onClick={() => toggleArrayItem('skills', s)}
                style={{
                  padding: '6px 12px', borderRadius: 20, fontSize: 12, fontWeight: 500,
                  border: active ? 'none' : '1px solid #e2e8f0',
                  background: active ? '#1a237e' : 'white',
                  color: active ? 'white' : '#64748b',
                  cursor: 'pointer', transition: 'all 0.2s',
                }}>
                {s}
              </button>
            )
          })}
        </div>
      </div>

      {/* Interests */}
      <div className="card" style={{ marginBottom: 16 }}>
        <h2 style={sectionTitle}>Internship Interests</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10 }}>
          {INTERNSHIP_CATEGORIES.map(cat => {
            const active = (profile.interests || []).includes(cat.id)
            return (
              <button key={cat.id} type="button" onClick={() => toggleArrayItem('interests', cat.id)}
                style={{
                  padding: '12px', borderRadius: 10, textAlign: 'left',
                  display: 'flex', alignItems: 'center', gap: 10,
                  border: active ? '2px solid #1a237e' : '1px solid #e2e8f0',
                  background: active ? '#eef2ff' : 'white',
                  cursor: 'pointer', transition: 'all 0.2s',
                }}>
                <span style={{ fontSize: 20 }}>{cat.icon}</span>
                <span style={{ fontSize: 12, fontWeight: active ? 600 : 400, color: active ? '#1a237e' : '#64748b' }}>{cat.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Links + bio */}
      <div className="card" style={{ marginBottom: 16 }}>
        <h2 style={sectionTitle}>Links & About</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
          <div>
            <label style={labelStyle}>LinkedIn Profile</label>
            <input type="url" value={profile.linkedIn} onChange={(e) => setField('linkedIn', e.target.value)}
              placeholder="https://linkedin.com/in/…" style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Portfolio / GitHub</label>
            <input type="url" value={profile.portfolio} onChange={(e) => setField('portfolio', e.target.value)}
              placeholder="https://…" style={inputStyle} />
          </div>
        </div>
        <div style={{ marginBottom: 12 }}>
          <label style={labelStyle}>Experience Summary</label>
          <textarea value={profile.experienceSummary} onChange={(e) => setField('experienceSummary', e.target.value)}
            placeholder="School projects, clubs, volunteering, past jobs or internships, awards…"
            style={{ ...inputStyle, minHeight: 90, resize: 'vertical' }} />
        </div>
        <div>
          <label style={labelStyle}>About Me</label>
          <textarea value={profile.aboutMe} onChange={(e) => setField('aboutMe', e.target.value)}
            placeholder="Goals, career aspirations, fun facts…"
            style={{ ...inputStyle, minHeight: 70, resize: 'vertical' }} />
        </div>
      </div>

      {/* Resume */}
      <div className="card" style={{ marginBottom: 16 }}>
        <h2 style={sectionTitle}>Resume</h2>
        {profile.resumeUrl ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 10 }}>
            <span style={{ fontSize: 13 }}>📄 Current resume:</span>
            <a href={profile.resumeUrl} target="_blank" rel="noopener noreferrer"
              style={{ color: 'var(--nriva-primary)', fontWeight: 500, fontSize: 13 }}>
              {profile.resumeName || 'View resume'}
            </a>
          </div>
        ) : (
          <p style={{ fontSize: 13, color: 'var(--nriva-text-light)', marginBottom: 10 }}>
            No resume on file yet.
          </p>
        )}
        <label className="btn btn-sm btn-outline" style={{ cursor: 'pointer', display: 'inline-flex' }}>
          {resumeUploading ? 'Uploading…' : (profile.resumeUrl ? 'Replace Resume' : 'Upload Resume')}
          <input type="file" accept=".pdf,.doc,.docx"
            onChange={handleResumeChange} disabled={resumeUploading}
            style={{ display: 'none' }} />
        </label>
        <div style={{ fontSize: 11, color: 'var(--nriva-text-light)', marginTop: 6 }}>
          PDF, DOC or DOCX, max 5MB. Used for all your applications.
        </div>
      </div>

      {meta.updatedAt && (
        <div style={{ fontSize: 12, color: 'var(--nriva-text-light)', textAlign: 'right', marginTop: 8 }}>
          Last updated: {formatDate(meta.updatedAt)}
        </div>
      )}

      {dirty && (
        <div style={{
          position: 'sticky', bottom: 12, marginTop: 16,
          background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 10,
          padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
        }}>
          <span style={{ fontSize: 13, color: '#92400e' }}>You have unsaved changes.</span>
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" className="btn btn-sm btn-outline" onClick={handleReset} disabled={saving}>Discard</button>
            <button type="button" className="btn btn-sm btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </div>
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}

const inputStyle = { width: '100%', padding: '11px 14px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 14, boxSizing: 'border-box' }
const labelStyle = { display: 'block', fontWeight: 500, fontSize: 13, marginBottom: 6 }
const sectionTitle = { fontSize: 16, fontWeight: 600, color: 'var(--nriva-primary, #1a237e)', marginBottom: 14 }
const readOnlyHint = { fontSize: 11, color: 'var(--nriva-text-light)', marginTop: 4 }
