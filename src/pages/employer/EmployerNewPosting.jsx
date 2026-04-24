import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { createInternship, GRADE_LEVELS } from '../../services/firestore'
import { generateJobDescription } from '../../services/ai'
import { isPastDate } from '../../utils/date'
import Toast from '../../components/Toast'

export default function EmployerNewPosting() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [toast, setToast] = useState(null)
  const [submitted, setSubmitted] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const today = new Date().toISOString().split('T')[0]

  const [form, setForm] = useState({
    title: '',
    company: '',
    contactName: '',
    contactEmail: '',
    contactPhone: '',
    location: '',
    locationType: 'remote',
    type: 'Full-time',
    duration: '',
    stipendType: 'paid',
    stipendAmount: '',
    positions: '1',
    department: '',
    gradeLevelMin: '',
    gradeLevelMax: '',
    description: '',
    responsibilities: '',
    requirements: '',
    preferredQualifications: '',
    skills: '',
    benefits: '',
    expectedHoursPerDay: '',
    applicationDeadline: '',
    startDate: '',
    additionalNotes: '',
    internshipPlan: '',
    expectations: '',
    mentorshipDetails: '',
  })

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleWriteWithAI = async () => {
    if (!form.title) {
      setToast('Please enter an internship title first')
      return
    }
    setAiLoading(true)
    try {
      const result = await generateJobDescription({
        title: form.title,
        company: form.company,
        duration: form.duration,
        type: form.type,
        skills: form.skills,
        gradeLevel: form.gradeLevelMin
          ? `${form.gradeLevelMin}${form.gradeLevelMax ? ' to ' + form.gradeLevelMax : ' and above'}`
          : null,
      })
      setForm(prev => ({
        ...prev,
        description: result.description || prev.description,
        responsibilities: result.responsibilities || prev.responsibilities,
        requirements: result.requirements || prev.requirements,
        preferredQualifications: result.preferredQualifications || prev.preferredQualifications,
        benefits: result.benefits || prev.benefits,
      }))
      setToast('AI-generated content applied! Review and edit as needed.')
    } catch (err) {
      setToast('AI Error: ' + err.message)
    } finally {
      setAiLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    // Validate grade level
    if (!form.gradeLevelMin) {
      setToast('Please select a minimum grade level')
      return
    }
    // Validate grade level range
    if (form.gradeLevelMax && GRADE_LEVELS.indexOf(form.gradeLevelMax) < GRADE_LEVELS.indexOf(form.gradeLevelMin)) {
      setToast('Maximum grade level cannot be lower than minimum grade level')
      return
    }
    // Validate deadline is not in the past
    if (form.applicationDeadline && isPastDate(form.applicationDeadline)) {
      setToast('Application deadline cannot be in the past')
      return
    }
    // Validate start date is not before deadline
    if (form.startDate && form.applicationDeadline && new Date(form.startDate) < new Date(form.applicationDeadline)) {
      setToast('Start date should be on or after the application deadline')
      return
    }
    try {
      await createInternship({
        title: form.title,
        company: form.company,
        employerUid: user.uid,
        employerName: user.displayName || form.contactName,
        location: form.locationType === 'remote' ? 'Remote' : form.location,
        type: form.type,
        duration: form.duration,
        stipend: form.stipendType === 'paid' ? form.stipendAmount : 'Unpaid (Volunteer)',
        skills: (form.skills || '').split(',').map(s => s.trim()).filter(Boolean),
        description: form.description,
        responsibilities: form.responsibilities,
        requirements: form.requirements,
        preferredQualifications: form.preferredQualifications,
        benefits: form.benefits,
        deadline: form.applicationDeadline,
        startDate: form.startDate,
        status: 'open',
        positions: parseInt(form.positions) || 1,
        gradeLevelMin: form.gradeLevelMin,
        gradeLevelMax: form.gradeLevelMax || null,
        expectedHoursPerDay: form.expectedHoursPerDay,
        internshipPlan: form.internshipPlan,
        expectations: form.expectations,
        mentorshipDetails: form.mentorshipDetails,
        contactEmail: form.contactEmail,
        contactPhone: form.contactPhone,
      })
      setSubmitted(true)
      setToast('Internship posting submitted!')
      setTimeout(() => navigate('/employer/postings'), 2500)
    } catch (err) {
      setToast('Error: ' + err.message)
    }
  }

  if (submitted) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 20px' }}>
        <div style={{ fontSize: 64, marginBottom: 20 }}>✅</div>
        <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 12, color: 'var(--nriva-success)' }}>
          Posting Submitted!
        </h1>
        <p style={{ color: 'var(--nriva-text-light)', fontSize: 16, marginBottom: 8 }}>
          Your internship posting for <strong>{form.title}</strong> has been submitted for review.
        </p>
        <p style={{ color: 'var(--nriva-text-light)', fontSize: 14 }}>
          An NRIVA administrator will review and approve your posting shortly.
        </p>
        {toast && <Toast message={toast} type="success" onClose={() => setToast(null)} />}
      </div>
    )
  }

  return (
    <div>
      <div className="page-header">
        <h1>Post New Internship</h1>
      </div>

      <form onSubmit={handleSubmit}>
        {/* NRIVA committee tip */}
        <div style={{
          background: '#eef2ff', border: '1px solid #c7d2fe', borderRadius: 10,
          padding: '14px 18px', marginBottom: 20, display: 'flex', alignItems: 'start', gap: 12,
        }}>
          <span style={{ fontSize: 18, flexShrink: 0 }}>💡</span>
          <div style={{ fontSize: 13, color: '#4338ca', lineHeight: 1.5 }}>
            <strong>NRIVA Committees:</strong> If this is an internal NRIVA committee internship,
            use <strong>NRIVA - [Committee Name]</strong> as the company name.
            For example: <em>&quot;NRIVA - Youth Committee&quot;</em>, <em>&quot;NRIVA - Media Committee&quot;</em>, <em>&quot;NRIVA - Health Committee&quot;</em>
          </div>
        </div>

        {/* Company Info */}
        <div className="card" style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 20, paddingBottom: 12, borderBottom: '1px solid var(--nriva-border)' }}>
            Company / Organization Information
          </h2>
          <div className="form-group">
            <label>Company / Organization Name <span className="required">*</span></label>
            <input className="form-control" name="company" value={form.company} onChange={handleChange} required
              placeholder="e.g., TechVasavi Solutions or NRIVA - Youth Committee" />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Contact Person Name <span className="required">*</span></label>
              <input className="form-control" name="contactName" value={form.contactName} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label>Contact Email <span className="required">*</span></label>
              <input className="form-control" type="email" name="contactEmail" value={form.contactEmail} onChange={handleChange} required />
            </div>
          </div>
          <div className="form-group">
            <label>Contact Phone</label>
            <input className="form-control" type="tel" name="contactPhone" value={form.contactPhone} onChange={handleChange} />
          </div>
        </div>

        {/* Position Details */}
        <div className="card" style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 20, paddingBottom: 12, borderBottom: '1px solid var(--nriva-border)' }}>
            Position Details
          </h2>
          <div className="form-group">
            <label>Internship Title <span className="required">*</span></label>
            <input className="form-control" name="title" value={form.title} onChange={handleChange} required
              placeholder="e.g., Software Development Intern" />
          </div>
          <div className="form-group">
            <label>Department</label>
            <input className="form-control" name="department" value={form.department} onChange={handleChange}
              placeholder="e.g., Engineering, Marketing, Finance" />
          </div>

          {/* Grade Level */}
          <div className="form-row">
            <div className="form-group">
              <label>Minimum Grade Level <span className="required">*</span></label>
              <select className="form-control" name="gradeLevelMin" value={form.gradeLevelMin} onChange={handleChange} required>
                <option value="">Select...</option>
                {GRADE_LEVELS.map(gl => <option key={gl} value={gl}>{gl}</option>)}
              </select>
              <span style={{ fontSize: 11, color: 'var(--nriva-text-light)', marginTop: 4, display: 'block' }}>
                Open to students from 10th grade through college
              </span>
            </div>
            <div className="form-group">
              <label>Maximum Grade Level</label>
              <select className="form-control" name="gradeLevelMax" value={form.gradeLevelMax} onChange={handleChange}>
                <option value="">Any (no max)</option>
                {GRADE_LEVELS.map(gl => <option key={gl} value={gl}>{gl}</option>)}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Location Type <span className="required">*</span></label>
              <select className="form-control" name="locationType" value={form.locationType} onChange={handleChange}>
                <option value="remote">Remote</option>
                <option value="onsite">On-site</option>
                <option value="hybrid">Hybrid</option>
              </select>
            </div>
            <div className="form-group">
              <label>Location {form.locationType !== 'remote' ? <span className="required">*</span> : ''}</label>
              <input className="form-control" name="location" value={form.location} onChange={handleChange}
                placeholder={form.locationType === 'remote' ? 'Optional for remote' : 'e.g., New York, NY'}
                required={form.locationType !== 'remote'} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Employment Type <span className="required">*</span></label>
              <select className="form-control" name="type" value={form.type} onChange={handleChange}>
                <option value="Full-time">Full-time</option>
                <option value="Part-time">Part-time</option>
              </select>
            </div>
            <div className="form-group">
              <label>Duration <span className="required">*</span></label>
              <select className="form-control" name="duration" value={form.duration} onChange={handleChange} required>
                <option value="">Select...</option>
                <option value="1 month">1 month</option>
                <option value="2 months">2 months</option>
                <option value="3 months">3 months</option>
                <option value="4 months">4 months</option>
                <option value="6 months">6 months</option>
                <option value="12 months">12 months</option>
              </select>
            </div>
          </div>
          <div className="form-group">
            <label>Expected Hours Per Day <span className="required">*</span></label>
            <select className="form-control" name="expectedHoursPerDay" value={form.expectedHoursPerDay} onChange={handleChange} required>
              <option value="">Select...</option>
              <option value="1-2 hours">1-2 hours</option>
              <option value="2-4 hours">2-4 hours</option>
              <option value="4-6 hours">4-6 hours</option>
              <option value="6-8 hours">6-8 hours</option>
              <option value="Flexible">Flexible</option>
            </select>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Compensation <span className="required">*</span></label>
              <select className="form-control" name="stipendType" value={form.stipendType} onChange={handleChange}>
                <option value="paid">Paid</option>
                <option value="unpaid">Unpaid / Volunteer</option>
              </select>
            </div>
            {form.stipendType === 'paid' && (
              <div className="form-group">
                <label>Stipend Amount <span className="required">*</span></label>
                <input className="form-control" name="stipendAmount" value={form.stipendAmount} onChange={handleChange}
                  placeholder="e.g., $1,500/month" required={form.stipendType === 'paid'} />
              </div>
            )}
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Number of Positions <span className="required">*</span></label>
              <input className="form-control" type="number" min="1" name="positions" value={form.positions} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label>Expected Start Date</label>
              <input className="form-control" type="date" name="startDate" min={today} value={form.startDate} onChange={handleChange} />
            </div>
          </div>
        </div>

        {/* Job Description with AI */}
        <div className="card" style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, paddingBottom: 12, borderBottom: '1px solid var(--nriva-border)' }}>
            <h2 style={{ fontSize: 18, fontWeight: 600 }}>Job Description & Requirements</h2>
            <button
              type="button"
              onClick={handleWriteWithAI}
              disabled={aiLoading}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '8px 16px', borderRadius: 8,
                border: '2px solid #7c3aed',
                background: aiLoading ? '#f3f4f6' : 'linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)',
                color: aiLoading ? '#6b7280' : 'white',
                fontSize: 13, fontWeight: 600, cursor: aiLoading ? 'wait' : 'pointer',
                transition: 'all 0.2s',
              }}
            >
              {aiLoading ? (
                <>
                  <span style={{ display: 'inline-block', animation: 'spin 1s linear infinite', fontSize: 14 }}>⟳</span>
                  Generating...
                </>
              ) : (
                <>✨ Write with AI</>
              )}
            </button>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>

          {aiLoading && (
            <div style={{
              background: '#f5f3ff', border: '1px solid #ddd6fe', borderRadius: 8,
              padding: '12px 16px', marginBottom: 16, fontSize: 13, color: '#5b21b6',
            }}>
              AI is writing your job description based on the position details above. This takes a few seconds...
            </div>
          )}

          <div className="form-group">
            <label>Description <span className="required">*</span></label>
            <textarea className="form-control" name="description" value={form.description} onChange={handleChange} required
              placeholder="Provide a detailed description of the internship role, projects, and learning opportunities..."
              style={{ minHeight: 120 }} />
          </div>
          <div className="form-group">
            <label>Key Responsibilities <span className="required">*</span></label>
            <textarea className="form-control" name="responsibilities" value={form.responsibilities} onChange={handleChange} required
              placeholder="List the key responsibilities (one per line)..." />
          </div>
          <div className="form-group">
            <label>Minimum Requirements <span className="required">*</span></label>
            <textarea className="form-control" name="requirements" value={form.requirements} onChange={handleChange} required
              placeholder="List must-have qualifications..." />
          </div>
          <div className="form-group">
            <label>Preferred Qualifications</label>
            <textarea className="form-control" name="preferredQualifications" value={form.preferredQualifications} onChange={handleChange}
              placeholder="List nice-to-have qualifications..." />
          </div>
          <div className="form-group">
            <label>Required Skills <span className="required">*</span></label>
            <input className="form-control" name="skills" value={form.skills} onChange={handleChange} required
              placeholder="e.g., Python, React, SQL (comma separated)" />
            <span style={{ fontSize: 12, color: 'var(--nriva-text-light)', marginTop: 4, display: 'block' }}>
              Separate skills with commas
            </span>
          </div>
          <div className="form-group">
            <label>Benefits & Perks</label>
            <textarea className="form-control" name="benefits" value={form.benefits} onChange={handleChange}
              placeholder="e.g., Mentorship, Certificate of completion, Networking opportunities..." />
          </div>
        </div>

        {/* Internship Plan */}
        <div className="card" style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 20, paddingBottom: 12, borderBottom: '1px solid var(--nriva-border)' }}>
            Internship Plan & Expectations
          </h2>
          <div className="form-group">
            <label>Internship Plan <span className="required">*</span></label>
            <textarea className="form-control" name="internshipPlan" value={form.internshipPlan} onChange={handleChange} required
              placeholder="Outline the plan for the internship: what projects will the intern work on, what will a typical week look like, what milestones are expected?" style={{ minHeight: 100 }} />
          </div>
          <div className="form-group">
            <label>What You Expect from Interns</label>
            <textarea className="form-control" name="expectations" value={form.expectations} onChange={handleChange}
              placeholder="Work ethic, communication style, deliverables, attendance expectations..." />
          </div>
          <div className="form-group">
            <label>Mentorship & Support</label>
            <textarea className="form-control" name="mentorshipDetails" value={form.mentorshipDetails} onChange={handleChange}
              placeholder="Who will mentor the intern? How often will they meet? What support will be provided?" />
          </div>
        </div>

        {/* Application Settings */}
        <div className="card" style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 20, paddingBottom: 12, borderBottom: '1px solid var(--nriva-border)' }}>
            Application Settings
          </h2>
          <div className="form-group">
            <label>Application Deadline <span className="required">*</span></label>
            <input className="form-control" type="date" name="applicationDeadline" min={today} value={form.applicationDeadline} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>Additional Notes for Applicants</label>
            <textarea className="form-control" name="additionalNotes" value={form.additionalNotes} onChange={handleChange}
              placeholder="Any special instructions for applicants..." />
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
          <button type="button" className="btn btn-outline" onClick={() => navigate('/employer/postings')}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary btn-lg">
            Submit for Review
          </button>
        </div>
      </form>

      {toast && <Toast message={toast} type="success" onClose={() => setToast(null)} />}
    </div>
  )
}
