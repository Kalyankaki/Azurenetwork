import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { createInternship } from '../../services/firestore'
import Toast from '../../components/Toast'

export default function EmployerNewPosting() {
  const navigate = useNavigate()
  const { user, demoMode } = useAuth()
  const [toast, setToast] = useState(null)
  const [submitted, setSubmitted] = useState(false)

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
    description: '',
    responsibilities: '',
    requirements: '',
    preferredQualifications: '',
    skills: '',
    benefits: '',
    applicationDeadline: '',
    startDate: '',
    additionalNotes: '',
  })

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (!demoMode) {
        await createInternship({
          title: form.title, company: form.company,
          employerUid: user.uid, employerName: user.displayName || form.contactName,
          location: form.locationType === 'remote' ? 'Remote' : form.location,
          type: form.type, duration: form.duration,
          stipend: form.stipendType === 'paid' ? form.stipendAmount : 'Unpaid (Volunteer)',
          skills: form.skills.split(',').map(s => s.trim()).filter(Boolean),
          description: form.description, requirements: form.requirements,
          deadline: form.applicationDeadline, status: 'open',
          positions: parseInt(form.positions) || 1,
        })
      }
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
        <div className="card" style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 20, paddingBottom: 12, borderBottom: '1px solid var(--nriva-border)' }}>
            Company / Organization Information
          </h2>
          <div className="form-group">
            <label>Company / Organization Name <span className="required">*</span></label>
            <input className="form-control" name="company" value={form.company} onChange={handleChange} required
              placeholder="e.g., TechVasavi Solutions" />
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
              <input className="form-control" type="date" name="startDate" value={form.startDate} onChange={handleChange} />
            </div>
          </div>
        </div>

        <div className="card" style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 20, paddingBottom: 12, borderBottom: '1px solid var(--nriva-border)' }}>
            Job Description & Requirements
          </h2>
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

        <div className="card" style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 20, paddingBottom: 12, borderBottom: '1px solid var(--nriva-border)' }}>
            Application Settings
          </h2>
          <div className="form-group">
            <label>Application Deadline <span className="required">*</span></label>
            <input className="form-control" type="date" name="applicationDeadline" value={form.applicationDeadline} onChange={handleChange} required />
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
          <button type="button" className="btn btn-outline" onClick={() => setToast('Draft saved!')}>
            Save as Draft
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
