import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import API_BASE from '../utils/apiBase';

export default function Register() {
  const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'user' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.password || !formData.role) {
      return setError('Please fill in all fields');
    }
    
    if (formData.password.length < 6) {
      return setError('Password must be at least 6 characters');
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch(`${API_BASE}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      // Store JWT token
      localStorage.setItem('token', data.data.token);
      localStorage.setItem('userRole', data.data.role);

      // Redirect based on role
      const roles = {
        manufacturer: '/manufacturer-dashboard',
        distributor: '/distributor-dashboard',
        pharmacy: '/pharmacy-dashboard',
        user: '/user-dashboard',
      };

      navigate(roles[data.data.role] || '/user-dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Create an Account</h2>
        {error && <div className="error-message">{error}</div>}
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label>Full Name</label>
            <input 
              type="text" 
              name="name" 
              value={formData.name} 
              onChange={handleChange} 
              placeholder="John Doe"
            />
          </div>
          <div className="form-group">
            <label>Email Address</label>
            <input 
              type="email" 
              name="email" 
              value={formData.email} 
              onChange={handleChange} 
              placeholder="Enter your email"
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input 
              type="password" 
              name="password" 
              value={formData.password} 
              onChange={handleChange} 
              placeholder="Enter your password"
            />
          </div>
          <div className="form-group">
            <label>User Role</label>
            <select name="role" value={formData.role} onChange={handleChange}>
              <option value="user">General User</option>
              <option value="manufacturer">Manufacturer</option>
              <option value="distributor">Distributor</option>
              <option value="pharmacy">Pharmacy</option>
            </select>
          </div>
          <button type="submit" className="primary-btn" disabled={loading}>
            {loading ? 'Creating account...' : 'Register'}
          </button>
        </form>
        <p className="auth-link">
          Already have an account? <Link to="/login">Login here</Link>
        </p>
      </div>
    </div>
  );
}
