import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import HomePage from './pages/HomePage'
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

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/intern" element={<Layout role="intern" />}>
        <Route index element={<InternDashboard />} />
        <Route path="browse" element={<InternBrowse />} />
        <Route path="apply/:id" element={<InternApply />} />
        <Route path="applications" element={<InternApplications />} />
      </Route>
      <Route path="/employer" element={<Layout role="employer" />}>
        <Route index element={<EmployerDashboard />} />
        <Route path="postings" element={<EmployerPostings />} />
        <Route path="new-posting" element={<EmployerNewPosting />} />
        <Route path="applicants" element={<EmployerApplicants />} />
      </Route>
      <Route path="/admin" element={<Layout role="admin" />}>
        <Route index element={<AdminDashboard />} />
        <Route path="internships" element={<AdminInternships />} />
        <Route path="applications" element={<AdminApplications />} />
        <Route path="reports" element={<AdminReports />} />
      </Route>
    </Routes>
  )
}
