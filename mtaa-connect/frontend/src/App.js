import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';

// Pages
import Home       from './pages/Home';
import Login      from './pages/Login';
import Register   from './pages/Register';
import Feed       from './pages/Feed';
import Jobs       from './pages/Jobs';
import Donations  from './pages/Donations';
import Skills     from './pages/Skills';
import Reports    from './pages/Reports';
import Businesses from './pages/Businesses';
import Safety     from './pages/Safety';
import MapPage    from './pages/MapPage';
import Messages   from './pages/Messages';
import Profile    from './pages/Profile';
import AdminDashboard from './pages/AdminDashboard';
import NotFound   from './pages/NotFound';

// Layout
import Layout           from './components/Layout';
import EmergencyBanner  from './components/EmergencyBanner';

// ── Route guards ──────────────────────────────────
function RequireAuth({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <div className="page-loader"><div className="spinner" /></div>;
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  return children;
}

function RequireAdmin({ children }) {
  const { user, loading, isAdmin } = useAuth();
  const location = useLocation();
  if (loading) return <div className="page-loader"><div className="spinner" /></div>;
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  if (!isAdmin) return <Navigate to="/feed" replace />;
  return children;
}

// Don't show login/register to already logged-in users
function GuestOnly({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="page-loader"><div className="spinner" /></div>;
  if (user) return <Navigate to={user.role === 'admin' || user.role === 'super_admin' ? '/admin' : '/feed'} replace />;
  return children;
}

// ── App Routes ────────────────────────────────────
function AppRoutes() {
  return (
    <>
      <EmergencyBanner />
      <Routes>
        {/* Public */}
        <Route path="/" element={<Home />} />
        <Route path="/login"    element={<GuestOnly><Login /></GuestOnly>} />
        <Route path="/register" element={<GuestOnly><Register /></GuestOnly>} />

        {/* Main layout */}
        <Route element={<Layout />}>
          <Route path="/feed"       element={<Feed />} />
          <Route path="/jobs"       element={<Jobs />} />
          <Route path="/donations"  element={<Donations />} />
          <Route path="/skills"     element={<Skills />} />
          <Route path="/reports"    element={<Reports />} />
          <Route path="/businesses" element={<Businesses />} />
          <Route path="/safety"     element={<Safety />} />
          <Route path="/map"        element={<MapPage />} />

          {/* Auth-required */}
          <Route path="/messages"     element={<RequireAuth><Messages /></RequireAuth>} />
          <Route path="/profile"      element={<RequireAuth><Profile /></RequireAuth>} />
          <Route path="/profile/:id"  element={<RequireAuth><Profile /></RequireAuth>} />

          {/* Admin-required */}
          <Route path="/admin" element={<RequireAdmin><AdminDashboard /></RequireAdmin>} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <SocketProvider>
          <AppRoutes />
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: { fontFamily: "'DM Sans', sans-serif", fontSize: '14px', borderRadius: '10px' }
            }}
          />
        </SocketProvider>
      </AuthProvider>
    </Router>
  );
}
