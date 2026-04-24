import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useInternships } from '../../hooks/useFirestore'
import { createApplication, getApplicationCount, getUser, MAX_INTERN_APPLICATIONS } from '../../services/firestore'
import Toast from '../../components/Toast'

export default function InternApply() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { data: internships } = useInternships()
  const internship = internships.find(i => String(i.id) === String(id))
  const [toast, setToast] = useState(null)
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const [form, setForm] = useState({
    relevantSkills: '',
    priorExperience: '',
    whyInterested: '',
    expectations: '',
    availableFrom: '',
    availableTo: '',
    hoursPerDay: '',
    notesToEmployer: '',
  })

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const count = await getApplicationCount(user.uid)
      if (count >= MAX_INTERN_APPLICATIONS) {
        setToast(`You have reached the maximum of ${MAX_INTERN_APPLICATIONS} applications.`)
        return
      }
    } catch { /* continue */ }

    setSubmitting(true)
    try {
      // Pull profile data to include with the application (for employer's matching)
      let profile = {}
      try {
        profile = await getUser(user.uid) || {}
      } catch { /* continue */ }

      await createApplication({
        internshipId: id,
        internshipTitle: internship.title,
        company: internship.company,
        applicantUid: user.uid,
        applicantName: user.displayName || 'Unknown',
        email: user.email,
        // Profile data snapshot (for matching)
        profileSkills: profile.skills || [],
        profileInterests: profile.interests || [],
        gradeLevel: profile.gradeLevel || '',
        school: profile.school || '',
        linkedIn: profile.linkedIn || '',
        portfolio: profile.portfolio || '',
        resumeUrl: profile.resumeUrl || null,
        resumeName: profile.resumeName || null,
        nrivaMembership: profile.nrivaMembership || '',
        // Application-specific
        relevantSkills: form.relevantSkills,
        priorExperience: form.priorExperience,
        whyInterested: form.whyInterested,
        expectations: form.expectations,
        availableFrom: form.availableFrom,
        availableTo: form.availableTo,
        hoursPerDay: form.hoursPerDay,
        notesToEmployer: form.notesToEmployer,
      })
      setSubmitted(true)
      setToast('Application submitted!')
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
        <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 12, color: 'var(--nriva-success)' }}>Application Submitted!</h1>
        <p style={{ color: 'var(--nriva-text-light)', fontSize: 16 }}>
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
            {internship.gradeLevelMin && <> · {internship.gradeLevelMin}{internship.gradeLevelMax ? ` - ${internship.gradeLevelMax}` : '+'}</>}
          </p>
        </div>
      </div>

      {/* Internship summary card */}
      <div className="card" style={{ marginBottom: 24, background: '#f8fafc' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, fontSize: 13 }}>
          <div><strong>Type:</strong> {internship.type}</div>
          <div><strong>Duration:</strong> {internship.duration}</div>
          <div><strong>Stipend:</strong> {internship.stipend}</div>
          {internship.expectedHoursPerDay && <div><strong>Hours/day:</strong> {internship.expectedHoursPerDay}</div>}
          <div><strong>Positions:</strong> {internship.positions || 1}</div>
        </div>
        {internship.description && (
          <p style={{ fontSize: 13, color: 'var(--nriva-text-light)', marginTop: 12, lineHeight: 1.6 }}>
            {internship.description.substring(0, 200)}{internship.description.length > 200 ? '...' : ''}
          </p>
        )}
      </div>

      <form onSubmit={handleSubmit}>
        {/* Why this internship */}
        <div className="card" style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 20, paddingBottom: 12, borderBottom: '1px solid var(--nriva-border)' }}>
            Your Application
          </h2>
          <div className="form-group">
            <label>Why are you interested in this internship? <span className="required">*</span></label>
            <textarea className="form-control" name="whyInterested" value={form.whyInterested} onChange={handleChange} required
              placeholder="What excites you about this role? What do you hope to learn?" style={{ minHeight: 100 }} />
          </div>
          <div className="form-group">
            <label>Relevant Skills for this Position <span className="required">*</span></label>
            <textarea className="form-control" name="relevantSkills" value={form.relevantSkills} onChange={handleChange} required
              placeholder="List skills that make you a good fit for this specific internship..." />
          </div>
          <div className="form-group">
            <label>What do you expect to gain from this internship?</label>
            <textarea className="form-control" name="expectations" value={form.expectations} onChange={handleChange}
              placeholder="Skills you want to develop, experience you hope to gain..." />
          </div>
          <div className="form-group">
            <label>Prior Experience</label>
            <textarea className="form-control" name="priorExperience" value={form.priorExperience} onChange={handleChange}
              placeholder="Any relevant experience, school projects, or activities..." />
          </div>
        </div>

        {/* Availability */}
        <div className="card" style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 20, paddingBottom: 12, borderBottom: '1px solid var(--nriva-border)' }}>
            Availability
          </h2>
          <div className="form-row">
            <div className="form-group">
              <label>Available From <span className="required">*</span></label>
              <input className="form-control" type="date" name="availableFrom" value={form.availableFrom} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label>Available To <span className="required">*</span></label>
              <input className="form-control" type="date" name="availableTo" value={form.availableTo} onChange={handleChange} required />
            </div>
          </div>
          <div className="form-group">
            <label>Hours Available Per Day <span className="required">*</span></label>
            <select className="form-control" name="hoursPerDay" value={form.hoursPerDay} onChange={handleChange} required>
              <option value="">Select...</option>
              <option value="1-2 hours">1-2 hours</option>
              <option value="2-4 hours">2-4 hours</option>
              <option value="4-6 hours">4-6 hours</option>
              <option value="6-8 hours">6-8 hours</option>
              <option value="Flexible">Flexible</option>
            </select>
          </div>
        </div>

        {/* Additional */}
        <div className="card" style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 20, paddingBottom: 12, borderBottom: '1px solid var(--nriva-border)' }}>
            Additional
          </h2>
          <div className="form-group">
            <label>Notes to the Employer</label>
            <textarea className="form-control" name="notesToEmployer" value={form.notesToEmployer} onChange={handleChange}
              placeholder="Anything else you'd like the employer to know..." />
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
