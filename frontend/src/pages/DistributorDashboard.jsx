import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Html5Qrcode } from 'html5-qrcode';

export default function DistributorDashboard() {
  const [role, setRole] = useState('Distributor');
  const [message, setMessage] = useState({ type: '', text: '' });
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  useEffect(() => {
    const savedRole = localStorage.getItem('userRole');
    if(savedRole) setRole(savedRole.charAt(0).toUpperCase() + savedRole.slice(1));
  }, []);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setMessage({ type: '', text: '' });
    
    try {
      const html5QrCode = new Html5Qrcode("distributor-qr-reader");
      const decodedText = await html5QrCode.scanFile(file, true);
      
      const url = new URL(decodedText);
      if (url.pathname.startsWith('/track/')) {
        const batchId = url.pathname.replace('/track/', '');
        if (batchId) {
          processBatchAcceptance(batchId);
        }
      } else {
        setMessage({ type: 'error', text: "Invalid QR Image: Not a valid tracking code." });
      }
    } catch (err) {
      setMessage({ type: 'error', text: "Invalid or unreadable QR image." });
    }
  };

  const processBatchAcceptance = async (batchId) => {
    try {
      const res = await fetch(`/api/batch/update-status/${batchId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await res.json();
      
      if (res.ok) {
        setMessage({ type: 'success', text: "Batch accepted successfully!" });
        // Automatically cascade them to the tracker page after a brief success delay
        setTimeout(() => navigate(`/track/${batchId}`), 2000);
      } else {
        setMessage({ type: 'error', text: data.error || "Batch already accepted or request failed." });
      }
    } catch (err) {
      setMessage({ type: 'error', text: "Network error connecting to blockchain logistics." });
    }
  };

  return (
    <div className="dashboard-container">
      <div className="status-badge online" style={{marginBottom: '1rem'}}>
        Logged in as: {role}
      </div>
      <h2>Distributor Operations</h2>
      
      <div className="dashboard-grid" style={{ gridTemplateColumns: '1fr', maxWidth: '600px', margin: '2rem auto' }}>
        <div className="dashboard-card" style={{ textAlign: 'center', padding: '3rem 2rem' }}>
          <h3 style={{ borderBottom: 'none' }}>Incoming Medicine Batches</h3>
          <p style={{ color: '#64748b', margin: '1.5rem 0' }}>
            To securely take ownership of an incoming batch and automatically update its journey to "In-Transit", scan or upload the Manufacturer's physical QR Code payload.
          </p>
          
          {message.text && (
            <div className={`message-alert ${message.type}`} style={{ marginBottom: '1.5rem', textAlign: 'left' }}>
              {message.text}
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', marginTop: '1rem' }}>
            <button 
              className="primary-btn" 
              style={{ fontSize: '1.1rem', padding: '1rem 2rem', width: '100%', maxWidth: '300px' }}
              onClick={() => navigate('/scan')}
            >
              Scan Shipping QR
            </button>

            <div style={{ color: '#94a3b8', fontWeight: 'bold', margin: '0.25rem 0' }}>OR</div>

            <button 
              className="primary-btn" 
              style={{ fontSize: '1.1rem', padding: '1rem 2rem', width: '100%', maxWidth: '300px', backgroundColor: '#64748b' }}
              onClick={() => fileInputRef.current.click()}
            >
              Upload QR Image
            </button>
            <input 
              type="file" 
              ref={fileInputRef}
              accept="image/png, image/jpeg, image/jpg" 
              style={{ display: 'none' }}
              onChange={handleFileUpload}
            />
            {/* Hidden div required for Html5Qrcode strictly to process files locally without rendering camera UI */}
            <div id="distributor-qr-reader" style={{ position: 'absolute', top: '-9999px', visibility: 'hidden' }}></div>
          </div>
        </div>
      </div>
    </div>
  );
}
