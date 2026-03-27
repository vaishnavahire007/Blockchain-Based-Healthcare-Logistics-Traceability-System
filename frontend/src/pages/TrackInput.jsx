import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function TrackInput() {
  const [batchId, setBatchId] = useState('');
  const navigate = useNavigate();

  const handleTrack = (e) => {
    e.preventDefault();
    if (batchId.trim()) {
      navigate(`/track/${batchId.trim()}`);
    }
  };

  return (
    <div className="dashboard-container" style={{ maxWidth: '600px', margin: '4rem auto', textAlign: 'center' }}>
      <h2 style={{ marginBottom: '1.5rem', color: 'var(--primary-color)', fontSize: '2.5rem' }}>Track Medicine Batch</h2>
      <p style={{ color: '#64748b', marginBottom: '2.5rem', fontSize: '1.1rem' }}>
        Enter your Batch ID below to cryptographically verify its timeline, location, and condition mathematically across the blockchain.
      </p>
      
      <div className="dashboard-card" style={{ padding: '2.5rem', textAlign: 'left' }}>
        <form onSubmit={handleTrack} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div>
            <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '0.5rem', color: '#334155' }}>Medicine Batch ID</label>
            <input 
              type="text" 
              placeholder="e.g. 123e4567-e89b-12d3..." 
              value={batchId} 
              onChange={(e) => setBatchId(e.target.value)}
              style={{ 
                padding: '1rem', 
                fontSize: '1.1rem', 
                borderRadius: '8px', 
                border: '1px solid #cbd5e1', 
                width: '100%', 
                boxSizing: 'border-box',
                fontFamily: 'monospace'
              }}
              required
            />
          </div>
          <button type="submit" className="primary-btn" style={{ fontSize: '1.1rem', padding: '1rem' }}>
            Verify & Track Pipeline
          </button>
        </form>
      </div>
    </div>
  );
}
