import { Routes, Route, Navigate, Link } from 'react-router-dom'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import RoleSelectPage from './pages/RoleSelectPage'
import InternDashboard from './pages/intern/InternDashboard'
import InternBrowse from './pages/intern/InternBrowse'
import InternApplications from './pages/intern/InternApplications'
import InternApply from './pages/intern/InternApply'
import EmployerDashboard from './pages/employer/EmployerDashboard'
import EmployerPostings from './pages/employer/EmployerPostings'
import EmployerNewPosting from './pages/employer/EmployerNewPosting'
import EmployerApplicants from './pages/employer/EmployerApplicants'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminInternships from './pages/admin/AdminInternships'
import AdminApplications from './pages/admin/AdminApplications'
import AdminReports from './pages/admin/AdminReports'
import AdminUsers from './pages/admin/AdminUsers'
import AdminMessages from './pages/admin/AdminMessages'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/select-role" element={<RoleSelectPage />} />

      <Route path="/intern" element={
        <ProtectedRoute allowedRole="intern"><Layout role="intern" /></ProtectedRoute>
      }>
        <Route index element={<InternDashboard />} />
        <Route path="browse" element={<InternBrowse />} />
        <Route path="apply/:id" element={<InternApply />} />
        <Route path="applications" element={<InternApplications />} />
      </Route>

      <Route path="/employer" element={
        <ProtectedRoute allowedRole="employer"><Layout role="employer" /></ProtectedRoute>
      }>
        <Route index element={<EmployerDashboard />} />
        <Route path="postings" element={<EmployerPostings />} />
        <Route path="new-posting" element={<EmployerNewPosting />} />
        <Route path="applicants" element={<EmployerApplicants />} />
      </Route>

      <Route path="/admin" element={
        <ProtectedRoute allowedRole="admin"><Layout role="admin" /></ProtectedRoute>
      }>
        <Route index element={<AdminDashboard />} />
        <Route path="internships" element={<AdminInternships />} />
        <Route path="applications" element={<AdminApplications />} />
        <Route path="messages" element={<AdminMessages />} />
        <Route path="reports" element={<AdminReports />} />
        <Route path="users" element={<AdminUsers />} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}

function NotFound() {
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(135deg, #0d1642 0%, #1a237e 50%, #283593 100%)',
      color: 'white', padding: 20, textAlign: 'center',
    }}>
      <div style={{ fontSize: 96, fontWeight: 800, marginBottom: 8 }}>404</div>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 12 }}>Page Not Found</h1>
      <p style={{ opacity: 0.7, marginBottom: 24 }}>
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <Link to="/" style={{
        background: '#ffa040', color: '#1a237e', padding: '12px 24px',
        borderRadius: 8, fontWeight: 600, textDecoration: 'none',
      }}>
        Return Home
      </Link>
    </div>
  )
}
