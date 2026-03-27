import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

export default function TrackBatch() {
  const { batchId } = useParams();
  const [batchData, setBatchData] = useState(null);
  const [verificationStatus, setVerificationStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Auto-map temporal metrics to distinct graph nodes natively decoupling from UI rendering locks
  const chartData = batchData?.temperatureLogs?.map(log => ({
    time: new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    temperature: log.value
  })) || [];

  useEffect(() => {
    const fetchBatch = async () => {
      try {
        const res = await fetch(`/api/batch/${batchId}`);
        const data = await res.json();
        
        if (data.success) {
          setBatchData(data.data);
          
          // Trigger Cryptographic Hash Verification dynamically
          try {
            const vRes = await fetch(`/api/batch/verify/${batchId}`);
            const vData = await vRes.json();
            setVerificationStatus(vData);
          } catch (vErr) {
            console.error("Hash verification failed:", vErr);
          }
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
            
            {verificationStatus && (
              <div style={{ backgroundColor: verificationStatus.success ? '#f0fdf4' : '#fef2f2', border: `1px solid ${verificationStatus.success ? '#4ade80' : '#f87171'}`, color: verificationStatus.success ? '#166534' : '#b91c1c', padding: '1.25rem', borderRadius: '8px', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <span style={{ fontSize: '2rem' }}>{verificationStatus.success ? '🛡️' : '❌'}</span>
                <div>
                  <h4 style={{ margin: 0, marginBottom: '0.25rem', color: verificationStatus.success ? '#166534' : '#b91c1c', borderBottom: 'none', paddingBottom: 0 }}>Blockchain Cryptographic Signature</h4>
                  <strong style={{ fontSize: '1.1rem' }}>{verificationStatus.message}</strong>
                </div>
              </div>
            )}

            {batchData.isValid === false && (
              <div style={{ backgroundColor: '#fef2f2', border: '1px solid #f87171', color: '#b91c1c', padding: '1.25rem', borderRadius: '8px', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span style={{ fontSize: '1.5rem' }}>⚠️</span>
                <strong>Warning: This batch may be invalid or tampered</strong>
              </div>
            )}

            {batchData.isSafe === false && (
              <div style={{ backgroundColor: '#fffbeb', border: '1px solid #fcd34d', color: '#b45309', padding: '1.25rem', borderRadius: '8px', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span style={{ fontSize: '1.5rem' }}>⚠️</span>
                <strong>Temperature exceeded safe limit. Medicine may be unsafe.</strong>
              </div>
            )}

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

            {batchData.temperatureLogs && batchData.temperatureLogs.length > 0 && (
              <div style={{ marginTop: '2.5rem', paddingTop: '1.5rem', borderTop: '1px solid #e2e8f0' }}>
                <h3 style={{ marginBottom: '1.5rem', color: '#0f172a' }}>Temperature History</h3>
                
                {/* Visual Chart rendered physically above the explicit tabular data matrix */}
                <div style={{ width: '100%', height: 320, marginBottom: '2.5rem', padding: '1rem', background: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <ResponsiveContainer>
                    <LineChart data={chartData} margin={{ top: 20, right: 20, bottom: 5, left: -20 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                      <YAxis domain={['auto', 'auto']} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dx={-10} />
                      <Tooltip 
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} 
                        formatter={(value) => [`${value}°C`, 'Temperature']} 
                      />
                      <ReferenceLine 
                        y={batchData.temperatureThreshold} 
                        label={{ position: 'top', value: `Safe Limit (${batchData.temperatureThreshold}°C)`, fill: '#ef4444', fontSize: 12 }} 
                        stroke="#ef4444" 
                        strokeDasharray="3 3" 
                      />
                      <Line type="monotone" dataKey="temperature" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                <div style={{ overflowX: 'auto', maxHeight: '400px' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '400px' }}>
                    <thead style={{ position: 'sticky', top: 0, backgroundColor: '#f1f5f9', zIndex: 1 }}>
                      <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                        <th style={{ padding: '0.75rem 1rem' }}>Recorded Temperature</th>
                        <th style={{ padding: '0.75rem 1rem' }}>Timestamp</th>
                      </tr>
                    </thead>
                    <tbody>
                      {batchData.temperatureLogs.slice().reverse().map((log, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0' }}>
                          <td style={{ padding: '0.75rem 1rem', fontWeight: 'bold', color: log.value > batchData.temperatureThreshold ? '#ef4444' : '#10b981' }}>
                            {log.value}°C 
                            {log.value > batchData.temperatureThreshold && ' (Exceeded limit)'}
                          </td>
                          <td style={{ padding: '0.75rem 1rem', color: '#64748b', fontSize: '0.9rem' }}>
                            {new Date(log.timestamp).toLocaleString(undefined, {
                              year: 'numeric', month: 'short', day: 'numeric',
                              hour: '2-digit', minute: '2-digit', second: '2-digit'
                            })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
