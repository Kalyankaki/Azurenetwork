import { lazy, Suspense } from 'react'
import { Routes, Route, Link } from 'react-router-dom'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'

const HomePage = lazy(() => import('./pages/HomePage'))
const LoginPage = lazy(() => import('./pages/LoginPage'))
const RoleSelectPage = lazy(() => import('./pages/RoleSelectPage'))
const InternDashboard = lazy(() => import('./pages/intern/InternDashboard'))
const InternBrowse = lazy(() => import('./pages/intern/InternBrowse'))
const InternApplications = lazy(() => import('./pages/intern/InternApplications'))
const InternApply = lazy(() => import('./pages/intern/InternApply'))
const InternProfile = lazy(() => import('./pages/intern/InternProfile'))
const EmployerDashboard = lazy(() => import('./pages/employer/EmployerDashboard'))
const EmployerPostings = lazy(() => import('./pages/employer/EmployerPostings'))
const EmployerNewPosting = lazy(() => import('./pages/employer/EmployerNewPosting'))
const EmployerApplicants = lazy(() => import('./pages/employer/EmployerApplicants'))
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'))
const AdminInternships = lazy(() => import('./pages/admin/AdminInternships'))
const AdminApplications = lazy(() => import('./pages/admin/AdminApplications'))
const AdminReports = lazy(() => import('./pages/admin/AdminReports'))
const AdminUsers = lazy(() => import('./pages/admin/AdminUsers'))
const AdminMessages = lazy(() => import('./pages/admin/AdminMessages'))
const AdminActivity = lazy(() => import('./pages/admin/AdminActivity'))

function PageLoader() {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      minHeight: '60vh', color: '#64748b', fontSize: 14,
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{
          width: 32, height: 32, border: '3px solid #e2e8f0', borderTopColor: '#1a237e',
          borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px',
        }} />
        Loading...
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <Suspense fallback={<PageLoader />}>
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
          <Route path="profile" element={<InternProfile />} />
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
          <Route path="activity" element={<AdminActivity />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
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
