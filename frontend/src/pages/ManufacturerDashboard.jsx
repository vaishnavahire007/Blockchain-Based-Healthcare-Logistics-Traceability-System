import { useState, useEffect } from 'react';

export default function ManufacturerDashboard() {
  const [role, setRole] = useState('Manufacturer');
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  
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
      const res = await fetch('/api/batch/my-batches', {
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
      const res = await fetch('/api/batch/create', {
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
      fetchBatches(); // Refresh list
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
                  <th>QR Code</th>
                </tr>
              </thead>
              <tbody>
                {batches.map(batch => (
                  <tr key={batch._id}>
                    <td className="code-font">{batch.batchId.substring(0, 8)}...</td>
                    <td><strong>{batch.medicineName}</strong></td>
                    <td>{new Date(batch.expiryDate).toLocaleDateString()}</td>
                    <td>
                      {batch.qrCode ? (
                        <img src={batch.qrCode} alt="QR Code" width="64" height="64" style={{ borderRadius: '4px', border: '1px solid #e2e8f0' }} />
                      ) : 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
