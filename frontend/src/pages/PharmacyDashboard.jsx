import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function PharmacyDashboard() {
  const [role, setRole] = useState('Pharmacy');
  const navigate = useNavigate();

  useEffect(() => {
    const savedRole = localStorage.getItem('userRole');
    if(savedRole) setRole(savedRole.charAt(0).toUpperCase() + savedRole.slice(1));
  }, []);

  return (
    <div className="dashboard-container">
      <div className="status-badge online" style={{marginBottom: '1rem'}}>
        Logged in as: {role}
      </div>
      <h2>Pharmacy Operations</h2>
      
      <div className="dashboard-grid" style={{ gridTemplateColumns: '1fr', maxWidth: '600px', margin: '2rem auto' }}>
        <div className="dashboard-card" style={{ textAlign: 'center', padding: '3rem 2rem' }}>
          <h3 style={{ borderBottom: 'none' }}>Receive Final Shipment</h3>
          <p style={{ color: '#64748b', margin: '1.5rem 0' }}>
            To safely take ownership of a medication batch and finalize the journey as "Delivered", scan the Distributor's tracking QR Code natively.
          </p>
          <button 
            className="primary-btn" 
            style={{ fontSize: '1.25rem', padding: '1rem 2rem', marginTop: '1rem', width: 'auto' }}
            onClick={() => navigate('/scan')}
          >
            Scan Delivery QR
          </button>
        </div>
      </div>
    </div>
  );
}
