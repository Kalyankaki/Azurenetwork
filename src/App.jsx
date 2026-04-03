import { Routes, Route, Navigate } from 'react-router-dom'
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
    </Routes>
  )
}
