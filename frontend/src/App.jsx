import { Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import ManufacturerDashboard from './pages/ManufacturerDashboard';
import DistributorDashboard from './pages/DistributorDashboard';
import PharmacyDashboard from './pages/PharmacyDashboard';
import UserDashboard from './pages/UserDashboard';
import TrackBatch from './pages/TrackBatch';
import ScanQR from './pages/ScanQR';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const isAuthenticated = !!localStorage.getItem('token');
  const userRole = localStorage.getItem('userRole');

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    navigate('/login');
  };
  return (
    <div className="app-container">
      <nav className="navbar">
        <div className="logo">Healthcare Logistics Traceability</div>
        <ul className="nav-links">
          <li>
            <Link to="/">Home</Link>
          </li>
          <li>
            <Link to="/scan" style={{ color: 'var(--primary-color)', fontWeight: 'bold' }}>Scan QR</Link>
          </li>
          {isAuthenticated ? (
            <>
              <li>
                <Link to={`/${userRole}-dashboard`}>Dashboard</Link>
              </li>
              <li>
                <button className="logout-btn" onClick={handleLogout}>Logout</button>
              </li>
            </>
          ) : (
            <>
              <li>
                <Link to="/login">Login</Link>
              </li>
              <li>
                <Link to="/register">Register</Link>
              </li>
            </>
          )}
        </ul>
      </nav>
      
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/track/:batchId" element={<TrackBatch />} />
          <Route path="/scan" element={<ScanQR />} />
          
          <Route path="/manufacturer-dashboard" element={
            <ProtectedRoute allowedRole="manufacturer">
              <ManufacturerDashboard />
            </ProtectedRoute>
          } />
          
          <Route path="/distributor-dashboard" element={
            <ProtectedRoute allowedRole="distributor">
              <DistributorDashboard />
            </ProtectedRoute>
          } />
          
          <Route path="/pharmacy-dashboard" element={
            <ProtectedRoute allowedRole="pharmacy">
              <PharmacyDashboard />
            </ProtectedRoute>
          } />
          
          <Route path="/user-dashboard" element={
            <ProtectedRoute allowedRole="user">
              <UserDashboard />
            </ProtectedRoute>
          } />
        </Routes>
      </main>
    </div>
  );
}

export default App;
