import { useState, useEffect } from 'react';
import QRModal from '../components/QRModal';
import BatchLogModal from '../components/BatchLogModal';
import API_BASE from '../utils/apiBase';

export default function ManufacturerDashboard() {
  const [role, setRole] = useState('Manufacturer');
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [selectedQR, setSelectedQR] = useState(null);
  const [selectedLog, setSelectedLog] = useState(null); // batch object for log modal

  const [formData, setFormData] = useState({
    medicineName: '',
    manufactureDate: '',
    expiryDate: '',
    temperatureThreshold: ''
  });

  useEffect(() => {
    const savedRole = localStorage.getItem('userRole');
    if(savedRole) setRole(savedRole.charAt(0).toUpperCase() + savedRole.slice(1));
    fetchBatches();
  }, []);

  const fetchBatches = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/batch/my-batches`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await res.json();
      if (data.success) {
        setBatches(data.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const res = await fetch(`${API_BASE}/api/batch/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          ...formData,
          temperatureThreshold: Number(formData.temperatureThreshold)
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create batch');

      setMessage({ type: 'success', text: 'Batch created successfully!' });
      setFormData({ medicineName: '', manufactureDate: '', expiryDate: '', temperatureThreshold: '' });
      fetchBatches();
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard-container">
      <div className="status-badge online" style={{marginBottom: '1rem'}}>
        Logged in as: {role}
      </div>
      <h2>Manufacturer Dashboard</h2>

      <div className="dashboard-grid">
        <div className="dashboard-card">
          <h3>Create New Medicine Batch</h3>
          {message.text && (
            <div className={`message-alert ${message.type}`}>
              {message.text}
            </div>
          )}
          <form onSubmit={handleSubmit} className="auth-form" style={{ marginTop: '1.5rem' }}>
            <div className="form-group">
              <label>Medicine Name</label>
              <input type="text" name="medicineName" value={formData.medicineName} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label>Manufacture Date</label>
              <input type="date" name="manufactureDate" value={formData.manufactureDate} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label>Expiry Date</label>
              <input type="date" name="expiryDate" value={formData.expiryDate} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label>Temperature Threshold (°C)</label>
              <input type="number" name="temperatureThreshold" value={formData.temperatureThreshold} onChange={handleChange} step="0.1" required />
            </div>
            <button type="submit" className="primary-btn" disabled={loading}>
              {loading ? 'Creating...' : 'Create Batch'}
            </button>
          </form>
        </div>

        <div className="dashboard-card" style={{ overflowX: 'auto' }}>
          <h3>My Created Batches</h3>
          {batches.length === 0 ? (
            <p style={{ marginTop: '1rem', color: '#64748b' }}>No batches created yet.</p>
          ) : (
            <table className="data-table" style={{ marginTop: '1.5rem' }}>
              <thead>
                <tr>
                  <th>Batch ID</th>
                  <th>Medicine Name</th>
                  <th>Expiry Date</th>
                  <th>Status</th>
                  <th>QR Code</th>
                  <th>Log</th>
                </tr>
              </thead>
              <tbody>
                {batches.map(batch => (
                  <tr key={batch._id}>
                    <td className="code-font">{batch.batchId.substring(0, 8)}...</td>
                    <td><strong>{batch.medicineName}</strong></td>
                    <td>{new Date(batch.expiryDate).toLocaleDateString()}</td>
                    <td>
                      <span style={{
                        display: 'inline-block',
                        padding: '2px 10px',
                        borderRadius: '20px',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        textTransform: 'capitalize',
                        background: batch.status === 'created' ? '#eff6ff' : batch.status === 'in-transit' ? '#fffbeb' : '#f0fdf4',
                        color: batch.status === 'created' ? '#1d4ed8' : batch.status === 'in-transit' ? '#b45309' : '#15803d',
                      }}>
                        {batch.status === 'created' ? '🏭' : batch.status === 'in-transit' ? '🚚' : '✅'} {batch.status}
                      </span>
                    </td>
                    <td>
                      {batch.qrCode ? (
                        <img
                          src={batch.qrCode}
                          alt="QR Code"
                          width="64"
                          height="64"
                          className="qr-thumbnail"
                          title="Click to enlarge"
                          onClick={() => setSelectedQR({ qrCode: batch.qrCode, medicineName: batch.medicineName, batchId: batch.batchId })}
                        />
                      ) : 'N/A'}
                    </td>
                    <td>
                      <button
                        onClick={() => setSelectedLog(batch)}
                        style={{
                          background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '8px',
                          padding: '0.4rem 0.85rem',
                          fontSize: '0.78rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          whiteSpace: 'nowrap',
                          transition: 'opacity 0.15s',
                        }}
                        onMouseOver={e => e.currentTarget.style.opacity = '0.85'}
                        onMouseOut={e => e.currentTarget.style.opacity = '1'}
                        title="View journey log"
                      >
                        📋 View Log
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {selectedQR && (
        <QRModal
          qrCode={selectedQR.qrCode}
          medicineName={selectedQR.medicineName}
          batchId={selectedQR.batchId}
          onClose={() => setSelectedQR(null)}
        />
      )}

      {selectedLog && (
        <BatchLogModal
          batch={selectedLog}
          onClose={() => setSelectedLog(null)}
        />
      )}
    </div>
  );
}
