import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import PatientList from './pages/PatientList.jsx';
import PatientDetail from './pages/PatientDetail.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Settings from './pages/Settings.jsx';
import About from './pages/About.jsx';

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<PatientList />} />
        <Route path="/patient/new" element={<PatientDetail mode="new" />} />
        <Route path="/patient/:id" element={<PatientDetail mode="edit" />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/about" element={<About />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}
