import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

export default function TrackBatch() {
  const { batchId } = useParams();
  const [batchData, setBatchData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchBatch = async () => {
      try {
        const res = await fetch(`/api/batch/${batchId}`);
        const data = await res.json();
        
        if (data.success) {
          setBatchData(data.data);
        } else {
          setError(data.error || 'Batch not found.');
        }
      } catch (err) {
        setError('Error connecting to tracking service.');
      } finally {
        setLoading(false);
      }
    };

    fetchBatch();
  }, [batchId]);

  return (
    <div className="dashboard-container" style={{ maxWidth: '800px', margin: '4rem auto' }}>
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '2rem', color: 'var(--primary-color)' }}>Public Tracking Portal</h2>
        <p style={{ color: '#64748b' }}>Verifying blockchain batch lifecycle and origins.</p>
      </div>

      <div className="dashboard-card">
        {loading ? (
          <p style={{ textAlign: 'center', padding: '2rem' }}>Decrypting tracking record...</p>
        ) : error ? (
          <div className="message-alert error">
            {error}
          </div>
        ) : (
          <div>
            <div style={{ padding: '0 0 1rem 0', borderBottom: '1px solid #e2e8f0', marginBottom: '1.5rem' }}>
              <h3 style={{ borderBottom: 'none', paddingBottom: 0, marginBottom: '0.25rem' }}>
                Batch ID: <span className="code-font" style={{ fontSize: '1rem' }}>{batchData.batchId}</span>
              </h3>
            </div>
            
            <table className="data-table">
              <tbody>
                <tr>
                  <td style={{ fontWeight: '600', width: '30%' }}>Medicine Name</td>
                  <td>{batchData.medicineName}</td>
                </tr>
                <tr>
                  <td style={{ fontWeight: '600' }}>Lifecycle Status</td>
                  <td>
                    <span className="status-badge online" style={{ margin: 0, textTransform: 'capitalize' }}>
                      {batchData.status}
                    </span>
                  </td>
                </tr>
                <tr>
                  <td style={{ fontWeight: '600' }}>Current Owner</td>
                  <td style={{ textTransform: 'capitalize' }}>{batchData.currentOwner}</td>
                </tr>
                <tr>
                  <td style={{ fontWeight: '600' }}>Manufacture Date</td>
                  <td>{new Date(batchData.manufactureDate).toLocaleDateString()}</td>
                </tr>
                <tr>
                  <td style={{ fontWeight: '600' }}>Expiry Date</td>
                  <td>{new Date(batchData.expiryDate).toLocaleDateString()}</td>
                </tr>
                <tr>
                  <td style={{ fontWeight: '600' }}>Temp. Threshold</td>
                  <td>Below {batchData.temperatureThreshold}°C</td>
                </tr>
                <tr>
                  <td style={{ fontWeight: '600' }}>Manufacturer Origin</td>
                  <td>{batchData.manufacturerId?.name || 'Unknown Manufacturer'}</td>
                </tr>
              </tbody>
            </table>

            {batchData.journeyLogs && batchData.journeyLogs.length > 0 && (
              <div style={{ marginTop: '2.5rem', paddingTop: '1.5rem', borderTop: '1px solid #e2e8f0' }}>
                <h3 style={{ marginBottom: '1.5rem', color: '#0f172a' }}>Journey Timeline</h3>
                <div className="timeline">
                  {batchData.journeyLogs.map((log, idx) => (
                    <div className="timeline-item" key={idx}>
                      <div style={{ fontWeight: '600', color: '#0f172a', textTransform: 'capitalize', fontSize: '1.1rem' }}>
                        {log.role} <span style={{ color: '#94a3b8', margin: '0 0.5rem' }}>&rarr;</span> <span style={{ color: 'var(--primary-color)' }}>{log.action}</span>
                      </div>
                      <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '0.35rem' }}>
                        {new Date(log.timestamp).toLocaleString(undefined, {
                          year: 'numeric', month: 'short', day: 'numeric', 
                          hour: '2-digit', minute: '2-digit'
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
