import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LanguageProvider } from './contexts/LanguageContext';

// Components
import Navbar from './components/Navbar';
import Footer from './components/Footer';

// Pages
import HomePage from './pages/HomePage';
import StudentLoginPage from './pages/StudentLoginPage';
import StudentRegisterPage from './pages/StudentRegisterPage';
import TeacherLoginPage from './pages/TeacherLoginPage';
import TeacherRegisterPage from './pages/TeacherRegisterPage';
import StudentDashboardPage from './pages/StudentDashboardPage';
import TeacherDashboardPage from './pages/TeacherDashboardPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import LeaderboardPage from './pages/LeaderboardPage';
import ChallengesPage from './pages/ChallengesPage';
import AchievementsPage from './pages/AchievementsPage';
import TeachersDirectoryPage from './pages/TeachersDirectoryPage';
import ReportsPage from './pages/ReportsPage';

// Route Guards
const StudentRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return null;
  if (!isAuthenticated) return <Navigate to="/student/login" replace />;
  return children;
};

const TeacherRoute = ({ children }) => {
  const { isAuthenticated, isTeacher, isAdmin, loading } = useAuth();
  if (loading) return null;
  if (!isAuthenticated) return <Navigate to="/teacher/login" replace />;
  if (!isTeacher && !isAdmin) return <Navigate to="/" replace />;
  return children;
};

const AdminRoute = ({ children }) => {
  const { isAuthenticated, isAdmin, loading } = useAuth();
  if (loading) return null;
  if (!isAuthenticated) return <Navigate to="/teacher/login" replace />;
  if (!isAdmin) return <Navigate to="/" replace />;
  return children;
};

function AppContent() {
  return (
    <div className="min-w-[320px] min-h-screen flex flex-col bg-champ-bg text-champ-text">
      <Navbar />
      <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6 flex-1">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/student/login" element={<StudentLoginPage />} />
          <Route path="/student/register" element={<StudentRegisterPage />} />
          <Route path="/teacher/login" element={<TeacherLoginPage />} />
          <Route path="/teacher/register" element={<TeacherRegisterPage />} />

          {/* Protected Portals */}
          <Route
            path="/student/dashboard"
            element={
              <StudentRoute>
                <StudentDashboardPage />
              </StudentRoute>
            }
          />
          <Route
            path="/teacher/dashboard"
            element={
              <TeacherRoute>
                <TeacherDashboardPage />
              </TeacherRoute>
            }
          />
          <Route
            path="/admin/dashboard"
            element={
              <AdminRoute>
                <AdminDashboardPage />
              </AdminRoute>
            }
          />

          {/* Public Views */}
          <Route path="/leaderboard" element={<LeaderboardPage />} />
          <Route path="/challenges" element={<ChallengesPage />} />
          <Route path="/achievements" element={<AchievementsPage />} />
          <Route path="/teachers" element={<TeachersDirectoryPage />} />
          <Route path="/reports" element={<ReportsPage />} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </AuthProvider>
    </LanguageProvider>
  );
}
