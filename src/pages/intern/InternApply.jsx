import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useInternships } from '../../hooks/useFirestore'
import { createApplication, getApplicationCount, GRADE_LEVELS, MAX_INTERN_APPLICATIONS } from '../../services/firestore'
import { uploadResume } from '../../firebase'
import Toast from '../../components/Toast'

const chapters = [
  'Alaska', 'Albany', 'Arizona', 'Atlanta', 'Austin', 'Baltimore',
  'Boston', 'Charlotte', 'Chicago', 'Cincinnati', 'Cleveland',
  'Colorado', 'Columbus', 'Connecticut', 'Dallas', 'Detroit',
  'Houston', 'Indianapolis', 'Kansas City', 'Los Angeles',
  'Michigan', 'Minnesota', 'New Jersey', 'New York', 'North Carolina',
  'Ohio', 'Oklahoma', 'Oregon', 'Philadelphia', 'Pittsburgh',
  'San Francisco', 'Seattle', 'St. Louis', 'Tampa', 'Virginia', 'Washington DC'
]

export default function InternApply() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { data: internships } = useInternships()
  const internship = internships.find(i => String(i.id) === String(id))
  const [toast, setToast] = useState(null)
  const [submitted, setSubmitted] = useState(false)
  const [resumeFile, setResumeFile] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    gender: '',
    gradeLevel: '',
    chapter: '',
    school: '',
    major: '',
    gpa: '',
    linkedIn: '',
    portfolio: '',
    skills: '',
    experience: '',
    whyInterested: '',
    availability: '',
    referral: '',
  })

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.gradeLevel) {
      setToast('Please select your current grade level')
      return
    }
    // Check application limit
    try {
      const count = await getApplicationCount(user.uid)
      if (count >= MAX_INTERN_APPLICATIONS) {
        setToast(`You have reached the maximum of ${MAX_INTERN_APPLICATIONS} applications. Please withdraw an existing application before applying to new positions.`)
        return
      }
    } catch {
      // Continue if check fails
    }
    // Validate grade level against internship requirements
    if (internship?.gradeLevelMin) {
      const minIdx = GRADE_LEVELS.indexOf(internship.gradeLevelMin)
      const maxIdx = internship.gradeLevelMax ? GRADE_LEVELS.indexOf(internship.gradeLevelMax) : GRADE_LEVELS.length - 1
      const applicantIdx = GRADE_LEVELS.indexOf(form.gradeLevel)
      if (applicantIdx < minIdx || applicantIdx > maxIdx) {
        setToast(`This position requires ${internship.gradeLevelMin}${internship.gradeLevelMax ? ' to ' + internship.gradeLevelMax : ' and above'}`)
        return
      }
    }
    setSubmitting(true)
    try {
      let resumeData = null
      if (resumeFile) {
        try {
          resumeData = await uploadResume(resumeFile, user.uid)
        } catch (err) {
          setToast('Resume upload failed: ' + err.message)
          setSubmitting(false)
          return
        }
      }
      await createApplication({
        internshipId: id,
        internshipTitle: internship.title,
        company: internship.company,
        applicantUid: user.uid,
        applicantName: `${form.firstName} ${form.lastName}`,
        email: form.email,
        phone: form.phone,
        gradeLevel: form.gradeLevel,
        school: form.school,
        major: form.major,
        gpa: form.gpa,
        skills: form.skills,
        experience: form.experience,
        whyInterested: form.whyInterested,
        availability: form.availability,
        referral: form.referral,
        chapter: form.chapter,
        resumeUrl: resumeData?.url || null,
        resumeName: resumeData?.name || null,
      })
      setSubmitted(true)
      setToast('Application submitted successfully!')
      setTimeout(() => navigate('/intern/applications'), 2500)
    } catch (err) {
      setSubmitting(false)
      setToast('Error: ' + err.message)
    }
  }

  if (!internship) {
    return <div className="card"><p>Internship not found.</p></div>
  }

  if (submitted) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 20px' }}>
        <div style={{ fontSize: 64, marginBottom: 20 }}>🎉</div>
        <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 12, color: 'var(--nriva-success)' }}>
          Application Submitted!
        </h1>
        <p style={{ color: 'var(--nriva-text-light)', fontSize: 16, marginBottom: 24 }}>
          Your application for <strong>{internship.title}</strong> at <strong>{internship.company}</strong> has been submitted.
        </p>
        {toast && <Toast message={toast} type="success" onClose={() => setToast(null)} />}
      </div>
    )
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Apply: {internship.title}</h1>
          <p style={{ color: 'var(--nriva-text-light)', fontSize: 14, marginTop: 4 }}>
            {internship.company} · {internship.location} · {internship.duration}
            {internship.gradeLevelMin && (
              <> · {internship.gradeLevelMin}{internship.gradeLevelMax ? ` - ${internship.gradeLevelMax}` : '+'}</>
            )}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Personal Information */}
        <div className="card" style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 20, paddingBottom: 12, borderBottom: '1px solid var(--nriva-border)' }}>
            Personal Information
          </h2>
          <div className="form-row">
            <div className="form-group">
              <label>First Name <span className="required">*</span></label>
              <input className="form-control" name="firstName" value={form.firstName} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label>Last Name <span className="required">*</span></label>
              <input className="form-control" name="lastName" value={form.lastName} onChange={handleChange} required />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Email Address <span className="required">*</span></label>
              <input className="form-control" type="email" name="email" value={form.email} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label>Phone Number <span className="required">*</span></label>
              <input className="form-control" type="tel" name="phone" value={form.phone} onChange={handleChange} required />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Date of Birth</label>
              <input className="form-control" type="date" name="dateOfBirth" value={form.dateOfBirth} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label>Gender</label>
              <select className="form-control" name="gender" value={form.gender} onChange={handleChange}>
                <option value="">Select...</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
                <option value="prefer_not">Prefer not to say</option>
              </select>
            </div>
          </div>
          <div className="form-group">
            <label>NRIVA Chapter</label>
            <select className="form-control" name="chapter" value={form.chapter} onChange={handleChange}>
              <option value="">Select your chapter...</option>
              {chapters.map(ch => <option key={ch} value={ch}>{ch}</option>)}
            </select>
          </div>
        </div>

        {/* Education - Updated for grade levels */}
        <div className="card" style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 20, paddingBottom: 12, borderBottom: '1px solid var(--nriva-border)' }}>
            Education
          </h2>
          <div className="form-row">
            <div className="form-group">
              <label>Current Grade Level <span className="required">*</span></label>
              <select className="form-control" name="gradeLevel" value={form.gradeLevel} onChange={handleChange} required>
                <option value="">Select...</option>
                {GRADE_LEVELS.map(gl => <option key={gl} value={gl}>{gl}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>School / University <span className="required">*</span></label>
              <input className="form-control" name="school" value={form.school} onChange={handleChange} required
                placeholder="e.g., Lincoln High School or UT Austin" />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Major / Area of Interest</label>
              <input className="form-control" name="major" value={form.major} onChange={handleChange}
                placeholder="e.g., Computer Science, Business" />
            </div>
            <div className="form-group">
              <label>GPA (if applicable)</label>
              <input className="form-control" name="gpa" value={form.gpa} onChange={handleChange} placeholder="e.g., 3.5" />
            </div>
          </div>
        </div>

        {/* Professional Details */}
        <div className="card" style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 20, paddingBottom: 12, borderBottom: '1px solid var(--nriva-border)' }}>
            Skills & Experience
          </h2>
          <div className="form-row">
            <div className="form-group">
              <label>LinkedIn Profile</label>
              <input className="form-control" name="linkedIn" value={form.linkedIn} onChange={handleChange} placeholder="https://linkedin.com/in/..." />
            </div>
            <div className="form-group">
              <label>Portfolio / GitHub</label>
              <input className="form-control" name="portfolio" value={form.portfolio} onChange={handleChange} placeholder="https://..." />
            </div>
          </div>
          <div className="form-group">
            <label>Relevant Skills <span className="required">*</span></label>
            <input className="form-control" name="skills" value={form.skills} onChange={handleChange} required placeholder="e.g., Python, React, Data Analysis" />
          </div>
          <div className="form-group">
            <label>Prior Experience</label>
            <textarea className="form-control" name="experience" value={form.experience} onChange={handleChange}
              placeholder="Describe any relevant experience, school projects, clubs, or extracurricular activities..." />
          </div>
          <div className="form-group">
            <label>Resume / CV (PDF, DOC, DOCX - max 5MB)</label>
            <input className="form-control" type="file" accept=".pdf,.doc,.docx"
              onChange={(e) => setResumeFile(e.target.files[0] || null)}
              style={{ padding: 8 }} />
            {resumeFile && (
              <div style={{ fontSize: 12, color: 'var(--nriva-success)', marginTop: 4 }}>
                ✓ Selected: {resumeFile.name} ({(resumeFile.size / 1024).toFixed(1)} KB)
              </div>
            )}
          </div>
        </div>

        {/* Additional Info */}
        <div className="card" style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 20, paddingBottom: 12, borderBottom: '1px solid var(--nriva-border)' }}>
            Additional Information
          </h2>
          <div className="form-group">
            <label>Why are you interested in this internship? <span className="required">*</span></label>
            <textarea className="form-control" name="whyInterested" value={form.whyInterested} onChange={handleChange} required
              placeholder="Tell us why you're a great fit for this position..." />
          </div>
          <div className="form-group">
            <label>Availability <span className="required">*</span></label>
            <select className="form-control" name="availability" value={form.availability} onChange={handleChange} required>
              <option value="">Select...</option>
              <option value="immediate">Immediately</option>
              <option value="2_weeks">Within 2 weeks</option>
              <option value="1_month">Within 1 month</option>
              <option value="summer_only">Summer only</option>
              <option value="specific">Specific date</option>
            </select>
          </div>
          <div className="form-group">
            <label>How did you hear about NRIVA&apos;s internship program?</label>
            <select className="form-control" name="referral" value={form.referral} onChange={handleChange}>
              <option value="">Select...</option>
              <option value="nriva_website">NRIVA Website</option>
              <option value="social_media">Social Media</option>
              <option value="member_referral">NRIVA Member Referral</option>
              <option value="school">School / Teacher</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
          <button type="button" className="btn btn-outline" onClick={() => navigate('/intern/browse')}>Cancel</button>
          <button type="submit" className="btn btn-primary btn-lg" disabled={submitting}>
            {submitting ? 'Submitting...' : 'Submit Application'}
          </button>
        </div>
      </form>

      {toast && <Toast message={toast} type="success" onClose={() => setToast(null)} />}
    </div>
  )
}
