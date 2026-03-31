import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { sampleInternships, chapters } from '../../data'
import Toast from '../../components/Toast'

export default function InternApply() {
  const { id } = useParams()
  const navigate = useNavigate()
  const internship = sampleInternships.find(i => i.id === Number(id))
  const [toast, setToast] = useState(null)
  const [submitted, setSubmitted] = useState(false)

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    gender: '',
    chapter: '',
    university: '',
    major: '',
    graduationYear: '',
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

  const handleSubmit = (e) => {
    e.preventDefault()
    setSubmitted(true)
    setToast('Application submitted successfully! You will receive a confirmation email.')
    setTimeout(() => navigate('/intern/applications'), 2500)
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
        <p style={{ color: 'var(--nriva-text-light)', fontSize: 14 }}>
          Redirecting to your applications...
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
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
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

        <div className="card" style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 20, paddingBottom: 12, borderBottom: '1px solid var(--nriva-border)' }}>
            Education
          </h2>
          <div className="form-group">
            <label>University / College <span className="required">*</span></label>
            <input className="form-control" name="university" value={form.university} onChange={handleChange} required />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Major / Field of Study <span className="required">*</span></label>
              <input className="form-control" name="major" value={form.major} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label>Expected Graduation Year <span className="required">*</span></label>
              <select className="form-control" name="graduationYear" value={form.graduationYear} onChange={handleChange} required>
                <option value="">Select...</option>
                <option value="2026">2026</option>
                <option value="2027">2027</option>
                <option value="2028">2028</option>
                <option value="2029">2029</option>
              </select>
            </div>
          </div>
          <div className="form-group">
            <label>GPA (if applicable)</label>
            <input className="form-control" name="gpa" value={form.gpa} onChange={handleChange} placeholder="e.g., 3.5" />
          </div>
        </div>

        <div className="card" style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 20, paddingBottom: 12, borderBottom: '1px solid var(--nriva-border)' }}>
            Professional Details
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
            <label>Resume / CV <span className="required">*</span></label>
            <input className="form-control" type="file" accept=".pdf,.doc,.docx" style={{ padding: 8 }} />
          </div>
          <div className="form-group">
            <label>Prior Experience</label>
            <textarea className="form-control" name="experience" value={form.experience} onChange={handleChange}
              placeholder="Describe any relevant work experience, projects, or extracurricular activities..." />
          </div>
        </div>

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
              <option value="university">University Career Center</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
          <button type="button" className="btn btn-outline" onClick={() => navigate('/intern/browse')}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary btn-lg">
            Submit Application
          </button>
        </div>
      </form>

      {toast && <Toast message={toast} type="success" onClose={() => setToast(null)} />}
    </div>
  )
}
