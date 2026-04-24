import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { onboardUser, sendAdminNotification, GRADE_LEVELS } from '../services/firestore'
import { uploadResume } from '../firebase'

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

const EMPLOYER_INDUSTRIES = [
  'Technology', 'Healthcare', 'Finance', 'Education', 'Non-Profit',
  'Media & Entertainment', 'Engineering', 'Consulting', 'Retail', 'Other',
]

const roleConfig = [
  { id: 'intern', title: 'Intern', icon: '🎓', color: '#1a237e', autoApproved: true },
  { id: 'employer', title: 'Employer', icon: '🏢', color: '#1b5e20', autoApproved: false },
  { id: 'admin', title: 'Administrator', icon: '⚙️', color: '#b71c1c', autoApproved: false },
]

export default function RoleSelectPage() {
  const { user, availableRoles, selectRole, logout, refreshRoles } = useAuth()
  const navigate = useNavigate()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  const visibleRoles = roleConfig.filter(r => availableRoles.includes(r.id))
  const isNewUser = availableRoles.length === 0

  useEffect(() => {
    if (visibleRoles.length === 1) {
      selectRole(visibleRoles[0].id)
      navigate(`/${visibleRoles[0].id}`, { replace: true })
    }
  }, [visibleRoles.length])

  if (isNewUser) {
    return <OnboardingForm user={user} logout={logout} navigate={navigate}
      selectRole={selectRole} refreshRoles={refreshRoles}
      submitting={submitting} setSubmitting={setSubmitting}
      error={error} setError={setError} />
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0d1642 0%, #1a237e 50%, #283593 100%)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ textAlign: 'center', marginBottom: 32, color: 'white' }}>
        <img src="/NRIVAYouthLogo.jpg" alt="NRIVA" style={{ width: 80, height: 80, objectFit: 'contain', marginBottom: 16, borderRadius: '50%' }} onError={(e) => { e.target.style.display = 'none' }} />
        <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Welcome, {user?.displayName || 'User'}!</h1>
        <p style={{ opacity: 0.7, fontSize: 15 }}>Select your role to continue</p>
      </div>
      <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', justifyContent: 'center', maxWidth: 800 }}>
        {visibleRoles.map((role) => (
          <button key={role.id} onClick={() => { selectRole(role.id); navigate(`/${role.id}`) }}
            style={{ background: 'white', borderRadius: 16, padding: '32px 28px', width: 220, border: '2px solid transparent', cursor: 'pointer', textAlign: 'center', transition: 'all 0.3s' }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.borderColor = role.color }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = 'transparent' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>{role.icon}</div>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: role.color, marginBottom: 8 }}>{role.title}</h3>
          </button>
        ))}
      </div>
    </div>
  )
}

function OnboardingForm({ user, logout, navigate, selectRole, refreshRoles, submitting, setSubmitting, error, setError }) {
  const [step, setStep] = useState(1)
  const [selectedRole, setSelectedRole] = useState('')
  const [displayName, setDisplayName] = useState(user?.displayName || '')
  const [membership, setMembership] = useState('')
  const [signupComplete, setSignupComplete] = useState(false)

  // Intern-specific
  const [gradeLevel, setGradeLevel] = useState('')
  const [school, setSchool] = useState('')
  const [skills, setSkills] = useState([])
  const [interests, setInterests] = useState([])
  const [availability, setAvailability] = useState('')
  const [aboutMe, setAboutMe] = useState('')
  const [linkedIn, setLinkedIn] = useState('')
  const [portfolio, setPortfolio] = useState('')
  const [resumeFile, setResumeFile] = useState(null)
  const [experienceSummary, setExperienceSummary] = useState('')

  // Employer-specific
  const [companyName, setCompanyName] = useState('')
  const [industry, setIndustry] = useState('')
  const [companySize, setCompanySize] = useState('')
  const [jobTitle, setJobTitle] = useState('')
  const [internshipTypes, setInternshipTypes] = useState([])
  const [companyWebsite, setCompanyWebsite] = useState('')

  const toggleItem = (arr, setArr, item) => {
    setArr(prev => prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item])
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    setError(null)
    try {
      const profileData = {
        requestedRole: selectedRole,
        nrivaMembership: membership.trim(),
        displayName: displayName.trim(),
      }

      if (selectedRole === 'intern') {
        // Upload resume if provided
        let resumeData = null
        if (resumeFile) {
          try {
            resumeData = await uploadResume(resumeFile, user.uid)
          } catch (err) {
            setError('Resume upload failed: ' + err.message)
            setSubmitting(false)
            return
          }
        }
        Object.assign(profileData, {
          gradeLevel, school: school.trim(), skills, interests,
          availability, aboutMe: aboutMe.trim(),
          linkedIn: linkedIn.trim(), portfolio: portfolio.trim(),
          experienceSummary: experienceSummary.trim(),
          resumeUrl: resumeData?.url || null,
          resumeName: resumeData?.name || null,
        })
      } else if (selectedRole === 'employer') {
        Object.assign(profileData, {
          companyName: companyName.trim(), industry, companySize,
          jobTitle: jobTitle.trim(), internshipTypes,
          companyWebsite: companyWebsite.trim(),
        })
      }

      await onboardUser(user.uid, profileData)

      try {
        const notifyData = { userName: displayName.trim(), userEmail: user.email, requestedRole: selectedRole, nrivaMembership: membership.trim() || 'None', userUid: user.uid }
        await sendAdminNotification({ type: 'new_signup', ...notifyData })
        fetch('/api/notify-signup', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(notifyData) }).catch(() => {})
      } catch { /* best-effort */ }

      await refreshRoles()
      if (selectedRole === 'intern') selectRole('intern')
      setSignupComplete(true)
      setSubmitting(false)
    } catch (err) {
      setError(err.message || 'Failed to save. Please try again.')
      setSubmitting(false)
    }
  }

  if (signupComplete) {
    return (
      <div style={pageStyle}>
        <div style={{ background: 'white', borderRadius: 20, padding: '40px 32px', maxWidth: 480, width: '100%', textAlign: 'center' }}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>{selectedRole === 'intern' ? '🎉' : '⏳'}</div>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: '#1a237e', marginBottom: 8 }}>
            {selectedRole === 'intern' ? 'Welcome Aboard!' : 'Request Submitted!'}
          </h2>
          <p style={{ color: '#64748b', fontSize: 14, lineHeight: 1.6, marginBottom: 24 }}>
            {selectedRole === 'intern'
              ? 'Your intern account is ready. We\'ll match you with internships based on your skills and interests.'
              : `Your ${selectedRole} role request has been submitted. An admin will review and approve your account shortly.`}
          </p>
          {selectedRole === 'intern' && (
            <div style={{ background: '#dcfce7', border: '1px solid #86efac', borderRadius: 12, padding: '16px 20px', marginBottom: 20, textAlign: 'left' }}>
              <div style={{ fontWeight: 600, fontSize: 15, color: '#15803d', marginBottom: 8 }}>Join our WhatsApp Group</div>
              <p style={{ fontSize: 13, color: '#166534', lineHeight: 1.5, marginBottom: 12 }}>Stay connected with fellow interns and get updates.</p>
              <a href="https://chat.whatsapp.com/DwpnyVgKQIyFmNvxo8mK3B" target="_blank" rel="noopener noreferrer"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#25D366', color: 'white', padding: '10px 20px', borderRadius: 8, fontSize: 14, fontWeight: 600, textDecoration: 'none' }}>
                Join WhatsApp Group
              </a>
            </div>
          )}
          <button onClick={() => { if (selectedRole === 'intern') navigate('/intern', { replace: true }); else { logout(); navigate('/') } }}
            style={{ width: '100%', padding: '12px 20px', borderRadius: 10, border: 'none', background: '#1a237e', color: 'white', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
            {selectedRole === 'intern' ? 'Go to Dashboard' : 'Return to Home'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={pageStyle}>
      <div style={{ background: 'white', borderRadius: 20, padding: '32px 28px', maxWidth: 560, width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <img src="/NRIVAYouthLogo.jpg" alt="NRIVA" style={{ width: 56, height: 56, objectFit: 'contain', marginBottom: 10, borderRadius: '50%' }} onError={(e) => { e.target.style.display = 'none' }} />
          <h2 style={{ fontSize: 20, fontWeight: 700, color: '#1a237e', marginBottom: 2 }}>Join NRIVA Internship Program</h2>
          <p style={{ color: '#64748b', fontSize: 13 }}>Step {step} of {selectedRole === 'intern' ? 3 : selectedRole === 'employer' ? 3 : 2}</p>
        </div>

        {/* Progress bar */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 24 }}>
          {[1, 2, 3].map(s => (
            <div key={s} style={{ flex: 1, height: 4, borderRadius: 2, background: s <= step ? '#1a237e' : '#e2e8f0', transition: 'all 0.3s' }} />
          ))}
        </div>

        {/* Step 1: Basic info + role */}
        {step === 1 && (
          <>
            <div style={fieldStyle}>
              <label style={labelStyle}>Full Name <span style={{ color: '#c62828' }}>*</span></label>
              <input type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Your full name" required style={inputStyle} />
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>Email</label>
              <input type="email" value={user?.email || ''} disabled style={{ ...inputStyle, background: '#f8fafc', color: '#94a3b8' }} />
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>NRIVA Membership ID</label>
              <input type="text" value={membership} onChange={(e) => setMembership(e.target.value)} placeholder="e.g., NRIVA-12345 (optional)" style={inputStyle} />
              <p style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>Don&apos;t have one? <a href="https://nriva.org/membership" target="_blank" rel="noopener noreferrer" style={{ color: '#1a237e', fontWeight: 500 }}>Sign up at nriva.org/membership</a></p>
              <p style={{ fontSize: 12, color: '#b45309', marginTop: 2, fontStyle: 'italic' }}>* Life members get priority for internship placements</p>
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>I want to join as <span style={{ color: '#c62828' }}>*</span></label>
              <div style={{ display: 'flex', gap: 12 }}>
                {roleConfig.filter(r => r.id !== 'admin').map((role) => (
                  <button key={role.id} type="button" onClick={() => setSelectedRole(role.id)}
                    style={{ flex: 1, padding: '16px 12px', borderRadius: 12, textAlign: 'center', border: `2px solid ${selectedRole === role.id ? role.color : '#e2e8f0'}`, background: selectedRole === role.id ? `${role.color}10` : 'white', cursor: 'pointer' }}>
                    <div style={{ fontSize: 28, marginBottom: 6 }}>{role.icon}</div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: role.color }}>{role.title}</div>
                    <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>{role.autoApproved ? '✓ Instant access' : 'Requires approval'}</div>
                  </button>
                ))}
              </div>
            </div>
            {error && <div style={errorStyle}>{error}</div>}
            <div style={{ display: 'flex', gap: 12 }}>
              <button type="button" onClick={() => { logout(); navigate('/') }} style={{ ...btnOutline, flex: 1 }}>Sign Out</button>
              <button type="button" disabled={!selectedRole || !displayName.trim()} onClick={() => { if (!selectedRole) { setError('Please select a role'); return } if (!displayName.trim()) { setError('Please enter your name'); return } setError(null); setStep(2) }}
                style={{ ...btnPrimary, flex: 2, opacity: (!selectedRole || !displayName.trim()) ? 0.5 : 1 }}>Continue</button>
            </div>
          </>
        )}

        {/* Step 2: Role-specific details */}
        {step === 2 && selectedRole === 'intern' && (
          <>
            <h3 style={sectionTitle}>Tell us about yourself</h3>
            <div style={fieldStyle}>
              <label style={labelStyle}>Current Grade Level <span style={{ color: '#c62828' }}>*</span></label>
              <select value={gradeLevel} onChange={(e) => setGradeLevel(e.target.value)} style={inputStyle}>
                <option value="">Select...</option>
                {GRADE_LEVELS.map(gl => <option key={gl} value={gl}>{gl}</option>)}
              </select>
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>School / University <span style={{ color: '#c62828' }}>*</span></label>
              <input type="text" value={school} onChange={(e) => setSchool(e.target.value)} placeholder="e.g., Lincoln High School or UT Austin" style={inputStyle} />
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>Your Skills (select all that apply)</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {INTERN_SKILLS.map(s => (
                  <button key={s} type="button" onClick={() => toggleItem(skills, setSkills, s)}
                    style={{ padding: '6px 12px', borderRadius: 20, fontSize: 12, fontWeight: 500, border: skills.includes(s) ? 'none' : '1px solid #e2e8f0', background: skills.includes(s) ? '#1a237e' : 'white', color: skills.includes(s) ? 'white' : '#64748b', cursor: 'pointer', transition: 'all 0.2s' }}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>Availability</label>
              <select value={availability} onChange={(e) => setAvailability(e.target.value)} style={inputStyle}>
                <option value="">Select...</option>
                <option value="summer">Summer only (Jun-Aug)</option>
                <option value="fall">Fall semester</option>
                <option value="spring">Spring semester</option>
                <option value="year-round">Year-round</option>
                <option value="flexible">Flexible</option>
              </select>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div style={fieldStyle}>
                <label style={labelStyle}>LinkedIn Profile</label>
                <input type="url" value={linkedIn} onChange={(e) => setLinkedIn(e.target.value)} placeholder="https://linkedin.com/in/..." style={inputStyle} />
              </div>
              <div style={fieldStyle}>
                <label style={labelStyle}>Portfolio / GitHub</label>
                <input type="url" value={portfolio} onChange={(e) => setPortfolio(e.target.value)} placeholder="https://..." style={inputStyle} />
              </div>
            </div>
            {error && <div style={errorStyle}>{error}</div>}
            <div style={{ display: 'flex', gap: 12 }}>
              <button type="button" onClick={() => setStep(1)} style={{ ...btnOutline, flex: 1 }}>Back</button>
              <button type="button" onClick={() => { if (!gradeLevel) { setError('Please select your grade level'); return } if (!school.trim()) { setError('Please enter your school'); return } setError(null); setStep(3) }}
                style={{ ...btnPrimary, flex: 2 }}>Continue</button>
            </div>
          </>
        )}

        {step === 2 && selectedRole === 'employer' && (
          <>
            <h3 style={sectionTitle}>About your organization</h3>
            <div style={fieldStyle}>
              <label style={labelStyle}>Company / Organization Name <span style={{ color: '#c62828' }}>*</span></label>
              <input type="text" value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="e.g., TechVasavi Solutions" style={inputStyle} />
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>Your Job Title <span style={{ color: '#c62828' }}>*</span></label>
              <input type="text" value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} placeholder="e.g., Engineering Manager" style={inputStyle} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div style={fieldStyle}>
                <label style={labelStyle}>Industry</label>
                <select value={industry} onChange={(e) => setIndustry(e.target.value)} style={inputStyle}>
                  <option value="">Select...</option>
                  {EMPLOYER_INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
                </select>
              </div>
              <div style={fieldStyle}>
                <label style={labelStyle}>Company Size</label>
                <select value={companySize} onChange={(e) => setCompanySize(e.target.value)} style={inputStyle}>
                  <option value="">Select...</option>
                  <option value="1-10">1-10 employees</option>
                  <option value="11-50">11-50</option>
                  <option value="51-200">51-200</option>
                  <option value="201-1000">201-1000</option>
                  <option value="1000+">1000+</option>
                </select>
              </div>
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>Company Website</label>
              <input type="url" value={companyWebsite} onChange={(e) => setCompanyWebsite(e.target.value)} placeholder="https://..." style={inputStyle} />
            </div>
            {error && <div style={errorStyle}>{error}</div>}
            <div style={{ display: 'flex', gap: 12 }}>
              <button type="button" onClick={() => setStep(1)} style={{ ...btnOutline, flex: 1 }}>Back</button>
              <button type="button" onClick={() => { if (!companyName.trim()) { setError('Please enter company name'); return } if (!jobTitle.trim()) { setError('Please enter your job title'); return } setError(null); setStep(3) }}
                style={{ ...btnPrimary, flex: 2 }}>Continue</button>
            </div>
          </>
        )}

        {/* Step 3: Preferences */}
        {step === 3 && selectedRole === 'intern' && (
          <>
            <h3 style={sectionTitle}>What kind of internships interest you?</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
              {INTERNSHIP_CATEGORIES.map(cat => (
                <button key={cat.id} type="button" onClick={() => toggleItem(interests, setInterests, cat.id)}
                  style={{ padding: '12px', borderRadius: 10, textAlign: 'left', display: 'flex', alignItems: 'center', gap: 10, border: interests.includes(cat.id) ? '2px solid #1a237e' : '1px solid #e2e8f0', background: interests.includes(cat.id) ? '#eef2ff' : 'white', cursor: 'pointer', transition: 'all 0.2s' }}>
                  <span style={{ fontSize: 20 }}>{cat.icon}</span>
                  <span style={{ fontSize: 12, fontWeight: interests.includes(cat.id) ? 600 : 400, color: interests.includes(cat.id) ? '#1a237e' : '#64748b' }}>{cat.label}</span>
                </button>
              ))}
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>Experience Summary</label>
              <textarea value={experienceSummary} onChange={(e) => setExperienceSummary(e.target.value)}
                placeholder="Describe your experience: school projects, clubs, volunteering, past jobs or internships, awards..."
                style={{ ...inputStyle, minHeight: 90, resize: 'vertical' }} />
              <p style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>
                This helps employers find you for the right opportunities
              </p>
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>Resume / CV (PDF, DOC, DOCX - max 5MB)</label>
              <input type="file" accept=".pdf,.doc,.docx"
                onChange={(e) => setResumeFile(e.target.files[0] || null)}
                style={{ ...inputStyle, padding: 8 }} />
              {resumeFile && (
                <div style={{ fontSize: 12, color: '#15803d', marginTop: 4 }}>
                  Selected: {resumeFile.name} ({(resumeFile.size / 1024).toFixed(1)} KB)
                </div>
              )}
              <p style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>
                Uploaded once, used for all your applications
              </p>
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>Anything else you&apos;d like us to know?</label>
              <textarea value={aboutMe} onChange={(e) => setAboutMe(e.target.value)} placeholder="Goals, career aspirations, fun facts..." style={{ ...inputStyle, minHeight: 60, resize: 'vertical' }} />
            </div>
            {error && <div style={errorStyle}>{error}</div>}
            <div style={{ display: 'flex', gap: 12 }}>
              <button type="button" onClick={() => setStep(2)} style={{ ...btnOutline, flex: 1 }}>Back</button>
              <button type="button" disabled={submitting} onClick={handleSubmit}
                style={{ ...btnPrimary, flex: 2, opacity: submitting ? 0.6 : 1 }}>
                {submitting ? 'Setting up...' : 'Get Started'}
              </button>
            </div>
          </>
        )}

        {step === 3 && selectedRole === 'employer' && (
          <>
            <h3 style={sectionTitle}>What types of interns are you looking for?</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
              {INTERNSHIP_CATEGORIES.map(cat => (
                <button key={cat.id} type="button" onClick={() => toggleItem(internshipTypes, setInternshipTypes, cat.id)}
                  style={{ padding: '12px', borderRadius: 10, textAlign: 'left', display: 'flex', alignItems: 'center', gap: 10, border: internshipTypes.includes(cat.id) ? '2px solid #1b5e20' : '1px solid #e2e8f0', background: internshipTypes.includes(cat.id) ? '#f0fdf4' : 'white', cursor: 'pointer', transition: 'all 0.2s' }}>
                  <span style={{ fontSize: 20 }}>{cat.icon}</span>
                  <span style={{ fontSize: 12, fontWeight: internshipTypes.includes(cat.id) ? 600 : 400, color: internshipTypes.includes(cat.id) ? '#1b5e20' : '#64748b' }}>{cat.label}</span>
                </button>
              ))}
            </div>
            {error && <div style={errorStyle}>{error}</div>}
            <div style={{ display: 'flex', gap: 12 }}>
              <button type="button" onClick={() => setStep(2)} style={{ ...btnOutline, flex: 1 }}>Back</button>
              <button type="button" disabled={submitting} onClick={handleSubmit}
                style={{ ...btnPrimary, flex: 2, background: '#1b5e20', opacity: submitting ? 0.6 : 1 }}>
                {submitting ? 'Submitting...' : 'Request Employer Access'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

const pageStyle = { minHeight: '100vh', background: 'linear-gradient(135deg, #0d1642 0%, #1a237e 50%, #283593 100%)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 20 }
const inputStyle = { width: '100%', padding: '11px 14px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 14, boxSizing: 'border-box' }
const labelStyle = { display: 'block', fontWeight: 500, fontSize: 14, marginBottom: 6 }
const fieldStyle = { marginBottom: 16 }
const sectionTitle = { fontSize: 16, fontWeight: 600, color: '#1a237e', marginBottom: 16 }
const errorStyle = { background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#dc2626', marginBottom: 12 }
const btnPrimary = { padding: '12px 20px', borderRadius: 10, border: 'none', background: '#1a237e', color: 'white', fontSize: 14, fontWeight: 600, cursor: 'pointer' }
const btnOutline = { padding: '12px 20px', borderRadius: 10, border: '1px solid #e2e8f0', background: 'white', color: '#64748b', fontSize: 14, cursor: 'pointer' }
