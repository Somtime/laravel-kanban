import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { LoginPage } from '@/pages/LoginPage';
import { RegisterPage } from '@/pages/RegisterPage';
import { Layout } from '@/components/Layout';
import { TeamsPage } from '@/pages/TeamsPage';
import { TeamMembersPage } from '@/pages/TeamMembersPage';
import { BoardPage } from '@/pages/BoardPage';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route 
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route path="/teams" element={<TeamsPage />} />
            <Route path="/teams/:teamId/members" element={<TeamMembersPage />} />
            <Route path="/teams/:teamId/board" element={<BoardPage />} />
          </Route>
          
          {/* 기본 경로는 팀 목록(/teams)으로 리디렉트 */}
          <Route path="/" element={<Navigate to="/teams" replace />} />
          {/* 404 처리 */}
          <Route path="*" element={<Navigate to="/teams" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
