import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './components/ui/Toast';
import Navbar from './components/common/Navbar';
import PrivateRoute from './components/common/PrivateRoute';
import AdminRoute from './components/common/AdminRoute';
import AssistantWidget from './components/smart/AssistantWidget';
import ErrorBoundary from './components/common/ErrorBoundary';

// ── Global Widgets ────────────────────────────────────────────────────────────
const GlobalWidgets = () => {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');
  
  if (isAdminRoute) return null;
  return <AssistantWidget />;
};

// ── Public Pages ──────────────────────────────────────────────────────────────
import Home from './pages/Home';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import VerifyCertificate from './pages/certificates/VerifyCertificate';

// ── Protected User Pages (new /user/ path) ────────────────────────────────────
import UserDashboard from './pages/user/UserDashboard';
import ApplyCertificate from './pages/user/ApplyCertificate';
import MyApplications from './pages/user/MyApplications';
import ApplicationDetail from './pages/user/ApplicationDetail';
import MyCertificates from './pages/user/MyCertificates';
import Profile from './pages/user/Profile';

// ── Protected Admin Pages ─────────────────────────────────────────────────────
import AdminDashboard from './pages/dashboard/AdminDashboard';
import AllApplications from './pages/admin/AllApplications';
import AdminApplicationDetail from './pages/admin/AdminApplicationDetail';
import ManageUsers from './pages/admin/ManageUsers';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <ErrorBoundary>
            <div className="min-h-screen bg-slate-50 flex flex-col">
              <Navbar />
              <main className="flex-1">
              <Routes>
                {/* ── Public ──────────────────────────────────────────────────── */}
                <Route path="/"                       element={<Home />} />
                <Route path="/login"                  element={<Login />} />
                <Route path="/register"               element={<Register />} />
                <Route path="/verify/:certNumber"     element={<VerifyCertificate />} />

                {/* ── Protected User ───────────────────────────────────────────── */}
                <Route element={<PrivateRoute />}>
                  <Route path="/dashboard"             element={<UserDashboard />} />
                  <Route path="/apply"                 element={<ApplyCertificate />} />
                  <Route path="/applications"          element={<MyApplications />} />
                  <Route path="/applications/:id"      element={<ApplicationDetail />} />
                  <Route path="/certificates"          element={<MyCertificates />} />
                  <Route path="/profile"               element={<Profile />} />
                </Route>

                {/* ── Protected Admin ────────────────────────────────────────────── */}
                <Route element={<AdminRoute />}>
                  <Route path="/admin"                        element={<AdminDashboard />} />
                  <Route path="/admin/applications"           element={<AllApplications />} />
                  <Route path="/admin/applications/:id"       element={<AdminApplicationDetail />} />
                  <Route path="/admin/users"                  element={<ManageUsers />} />
                  <Route path="/admin/profile"                element={<Profile />} />
                </Route>

                {/* ── 404 ─────────────────────────────────────────────────────── */}
                <Route
                  path="*"
                  element={
                    <div className="min-h-screen flex items-center justify-center bg-slate-50">
                      <div className="text-center animate-fade-in">
                        <p className="text-8xl mb-6">🇳🇵</p>
                        <h1 className="text-6xl font-extrabold text-slate-900 mb-4">404</h1>
                        <p className="text-slate-600 text-xl mb-8">Page not found</p>
                        <a href="/" className="btn-primary py-3 px-8 inline-block">
                          ← Go to Home
                        </a>
                      </div>
                    </div>
                  }
                />
              </Routes>
              </main>
              <GlobalWidgets />
            </div>
          </ErrorBoundary>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
