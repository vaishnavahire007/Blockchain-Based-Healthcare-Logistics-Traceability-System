import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import BatchLogModal from '../components/BatchLogModal';
import API_BASE from '../utils/apiBase';

export default function PharmacyDashboard() {
  const [role, setRole] = useState('Pharmacy');
  const [message, setMessage] = useState({ type: '', text: '' });
  const [incoming, setIncoming] = useState([]);
  const [accepted, setAccepted] = useState([]);
  const [selectedLog, setSelectedLog] = useState(null);
  const navigate = useNavigate();

  const fetchIncomingBatches = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/batch/incoming`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await res.json();
      if (res.ok) setIncoming(data.data);
    } catch (err) {
      console.error("Failed to fetch incoming batches", err);
    }
  };

  const fetchAcceptedBatches = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/batch/accepted`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await res.json();
      if (res.ok) setAccepted(data.data);
    } catch (err) {
      console.error("Failed to fetch accepted batches", err);
    }
  };

  useEffect(() => {
    const savedRole = localStorage.getItem('userRole');
    if(savedRole) setRole(savedRole.charAt(0).toUpperCase() + savedRole.slice(1));
    fetchIncomingBatches();
    fetchAcceptedBatches();
  }, []);

  const processBatchAcceptance = async (batchId) => {
    try {
      const res = await fetch(`${API_BASE}/api/batch/update-status/${batchId}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await res.json();

      if (res.ok) {
        setMessage({ type: 'success', text: "Batch accepted successfully!" });
        fetchIncomingBatches();
        fetchAcceptedBatches();
        setTimeout(() => setMessage({ type: '', text: '' }), 4000);
      } else {
        setMessage({ type: 'error', text: data.error || "Batch already accepted or request failed." });
      }
    } catch (err) {
      setMessage({ type: 'error', text: "Network error connecting to blockchain logistics." });
    }
  };

  return (
    <div className="dashboard-container" style={{ maxWidth: '1000px' }}>
      <div className="status-badge online" style={{marginBottom: '1rem'}}>
        Logged in as: {role}
      </div>
      <h2>Pharmacy Operations</h2>

      {message.text && (
        <div className={`message-alert ${message.type}`} style={{ margin: '1rem 0', textAlign: 'left' }}>
          {message.text}
        </div>
      )}

      <div className="dashboard-grid" style={{ gridTemplateColumns: '1fr', margin: '2rem 0', gap: '2rem' }}>

        {/* ── Incoming Manifests ─────────────────────────────────────── */}
        <div className="dashboard-card" style={{ padding: '2rem' }}>
          <h3 style={{ borderBottom: 'none' }}>Incoming Network Manifests</h3>
          <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>
            The following payloads shipped from a Distributor have arrived in your region. Cross verify stock visually and accept payload.
          </p>

          {incoming.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', background: '#f8fafc', borderRadius: '8px', border: '1px dashed #cbd5e1' }}>
              <p style={{ color: '#94a3b8', margin: 0, fontSize: '1.1rem' }}>No manifests awaiting transfer at your location.</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '600px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f1f5f9', borderBottom: '2px solid #e2e8f0' }}>
                    <th style={{ padding: '1rem' }}>Batch UUID</th>
                    <th style={{ padding: '1rem' }}>Medicine</th>
                    <th style={{ padding: '1rem' }}>Expiry Date</th>
                    <th style={{ padding: '1rem', textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {incoming.map(batch => (
                    <tr key={batch.batchId} style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '1rem', fontFamily: 'monospace', fontSize: '0.95rem', color: '#64748b' }}>
                        {batch.batchId.split('-')[0]}...
                      </td>
                      <td style={{ padding: '1rem', fontWeight: 'bold' }}>{batch.medicineName}</td>
                      <td style={{ padding: '1rem' }}>{new Date(batch.expiryDate).toLocaleDateString()}</td>
                      <td style={{ padding: '1rem', textAlign: 'right' }}>
                        <button
                          className="primary-btn"
                          style={{ padding: '0.6rem 1.25rem', fontSize: '0.95rem', width: 'auto' }}
                          onClick={() => processBatchAcceptance(batch.batchId)}
                        >
                          Accept Batch
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ── Accepted Batches ───────────────────────────────────────── */}
        <div className="dashboard-card" style={{ padding: '2rem' }}>
          <h3 style={{ borderBottom: 'none' }}>My Accepted Batches</h3>
          <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>
            Medicines delivered to your pharmacy. Click <strong>View Log</strong> to trace the full blockchain-verified supply chain journey.
          </p>

          {accepted.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', background: '#f8fafc', borderRadius: '8px', border: '1px dashed #cbd5e1' }}>
              <p style={{ color: '#94a3b8', margin: 0, fontSize: '1.1rem' }}>No accepted batches yet.</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '600px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f1f5f9', borderBottom: '2px solid #e2e8f0' }}>
                    <th style={{ padding: '1rem' }}>Batch UUID</th>
                    <th style={{ padding: '1rem' }}>Medicine</th>
                    <th style={{ padding: '1rem' }}>Status</th>
                    <th style={{ padding: '1rem' }}>Expiry Date</th>
                    <th style={{ padding: '1rem', textAlign: 'center' }}>Log</th>
                  </tr>
                </thead>
                <tbody>
                  {accepted.map(batch => (
                    <tr key={batch.batchId} style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '1rem', fontFamily: 'monospace', fontSize: '0.9rem', color: '#64748b' }}>
                        {batch.batchId.split('-')[0]}...
                      </td>
                      <td style={{ padding: '1rem', fontWeight: 'bold' }}>{batch.medicineName}</td>
                      <td style={{ padding: '1rem' }}>
                        <span style={{
                          display: 'inline-block', padding: '2px 10px', borderRadius: '20px',
                          fontSize: '0.78rem', fontWeight: 700, textTransform: 'capitalize',
                          background: '#f0fdf4', color: '#15803d',
                        }}>
                          ✅ {batch.status}
                        </span>
                      </td>
                      <td style={{ padding: '1rem' }}>{new Date(batch.expiryDate).toLocaleDateString()}</td>
                      <td style={{ padding: '1rem', textAlign: 'center' }}>
                        <button
                          onClick={() => setSelectedLog(batch)}
                          style={{
                            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                            color: '#fff', border: 'none', borderRadius: '8px',
                            padding: '0.4rem 0.85rem', fontSize: '0.78rem',
                            fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap',
                            transition: 'opacity 0.15s',
                          }}
                          onMouseOver={e => e.currentTarget.style.opacity = '0.85'}
                          onMouseOut={e => e.currentTarget.style.opacity = '1'}
                        >
                          📋 View Log
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {selectedLog && (
        <BatchLogModal batch={selectedLog} onClose={() => setSelectedLog(null)} />
      )}
    </div>
  );
}
