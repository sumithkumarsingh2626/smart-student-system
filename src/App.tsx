import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ErrorBoundary from './components/ErrorBoundary';
import Login from './pages/Login';
import FacultyDashboard from './pages/FacultyDashboard';
import StudentDashboard from './pages/StudentDashboard';

const ProtectedRoute: React.FC<{ children: React.ReactNode; role?: string }> = ({ children, role }) => {
  const { user, profile, loading, isAuthReady } = useAuth();

  if (!isAuthReady || loading) {
    return (
      <div className="app-shell min-h-screen flex items-center justify-center px-6">
        <div className="surface-panel rounded-[20px] px-10 py-9 text-center">
          <div className="hero-badge mx-auto mb-5 w-fit">Loading Workspace</div>
          <div className="mx-auto mb-5 flex w-fit items-center gap-2">
            <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-zinc-200/70" />
            <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-zinc-500/40 [animation-delay:120ms]" />
            <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-zinc-500/30 [animation-delay:240ms]" />
          </div>
          <div className="text-xl font-semibold text-zinc-100">Loading your dashboard...</div>
          <p className="mt-2 text-sm text-zinc-400">Syncing your session and preparing the latest data.</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (role && profile?.role !== role) {
    if (profile?.role === 'admin' && role === 'faculty') return <>{children}</>; // Admin can access faculty dashboard
    return <Navigate to={profile?.role === 'faculty' ? '/faculty' : profile?.role === 'admin' ? '/admin' : '/student'} replace />;
  }

  return <>{children}</>;
};

// import { seedData } from './lib/seed';

const AppRoutes = () => {
  const { user, profile } = useAuth();

  useEffect(() => {
    // if (user?.email === 'sumithkumar2626@gmail.com' || user?.email === 'shumee@bits.com' || profile?.role === 'admin') {
    //   seedData();
    // }
  }, [user, profile]);

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/faculty/*"
        element={
          <ProtectedRoute role="faculty">
            <FacultyDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/*"
        element={
          <ProtectedRoute role="admin">
            <FacultyDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/*"
        element={
          <ProtectedRoute role="student">
            <StudentDashboard />
          </ProtectedRoute>
        }
      />
      <Route path="/" element={<Navigate to="/login" replace />} />
    </Routes>
  );
};

import { Toaster } from 'sonner';

export default function App() {
  return (
    <ErrorBoundary>
      <Toaster position="top-right" theme="dark" richColors closeButton />
      <AuthProvider>
        <Router>
          <AppRoutes />
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  );
}
