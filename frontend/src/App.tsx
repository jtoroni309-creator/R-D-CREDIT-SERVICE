import { Routes, Route, Navigate } from 'react-router-dom';
import { Box } from '@mui/material';
import { useAuth } from './contexts/AuthContext';
import Layout from './components/common/Layout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import EngagementListPage from './pages/EngagementListPage';
import EngagementDetailPage from './pages/EngagementDetailPage';
import ProjectDetailPage from './pages/ProjectDetailPage';
import QREPage from './pages/QREPage';
import CalculationsPage from './pages/CalculationsPage';
import ReportsPage from './pages/ReportsPage';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <Box>Loading...</Box>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="engagements" element={<EngagementListPage />} />
        <Route path="engagements/:id" element={<EngagementDetailPage />} />
        <Route path="projects/:id" element={<ProjectDetailPage />} />
        <Route path="engagements/:id/qre" element={<QREPage />} />
        <Route path="engagements/:id/calculations" element={<CalculationsPage />} />
        <Route path="engagements/:id/reports" element={<ReportsPage />} />
      </Route>
    </Routes>
  );
}

export default App;
