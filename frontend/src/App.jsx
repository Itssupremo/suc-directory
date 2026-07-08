import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Header from './components/Header';
import Footer from './components/Footer';
import Login from './pages/Login';
import SuperadminDashboard from './pages/SuperadminDashboard';
import CommissionerDashboard from './pages/CommissionerDashboard';
import SucDashboard from './pages/SucDashboard';
import UserManagement from './pages/UserManagement';
import PublicDirectory from './pages/PublicDirectory';
import { getMe } from './services/api';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      getMe()
        .then((res) => setUser(res.data.user))
        .catch(() => {
          localStorage.removeItem('token');
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const handleLogin = (userData, token) => {
    localStorage.setItem('token', token);
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <div className="d-flex flex-column min-vh-100">
        <Header user={user} onLogout={handleLogout} />
        <main className="container-fluid px-4 my-4 flex-grow-1">
          <Routes>
            <Route path="/" element={<PublicDirectory />} />
            <Route
              path="/login"
              element={
                user ? (
                  <Navigate to={user.role === 'superadmin' ? '/directory' : '/my-suc'} />
                ) : (
                  <Login onLogin={handleLogin} />
                )
              }
            />
            <Route
              path="/directory"
              element={
                user ? (
                  user.role === 'superadmin' ? (
                    <SuperadminDashboard user={user} />
                  ) : user.role === 'admin' ? (
                    <CommissionerDashboard user={user} initialTab="directory" />
                  ) : (
                    <SucDashboard user={user} initialTab="directory" />
                  )
                ) : (
                  <Navigate to="/login" />
                )
              }
            />
            <Route
              path="/admin/users"
              element={
                user && user.role === 'superadmin' ? (
                  <UserManagement />
                ) : (
                  <Navigate to="/login" />
                )
              }
            />
            <Route
              path="/my-suc"
              element={
                user ? (
                  user.role === 'admin' ? (
                    <CommissionerDashboard user={user} initialTab="my-charge" />
                  ) : user.role === 'user' ? (
                    <SucDashboard user={user} initialTab="my-institution" />
                  ) : (
                    <Navigate to="/directory" />
                  )
                ) : (
                  <Navigate to="/login" />
                )
              }
            />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}

export default App;
