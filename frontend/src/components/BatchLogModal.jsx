import { useEffect } from 'react';

const roleColors = {
  manufacturer: { bg: '#eff6ff', border: '#3b82f6', dot: '#2563eb', text: '#1e40af' },
  distributor:  { bg: '#f0fdf4', border: '#22c55e', dot: '#16a34a', text: '#15803d' },
  pharmacy:     { bg: '#fdf4ff', border: '#c084fc', dot: '#a855f7', text: '#7e22ce' },
};

const roleIcons = {
  manufacturer: '🏭',
  distributor:  '🚚',
  pharmacy:     '🏥',
};

const actionLabel = (action) => {
  if (action === 'created')  return 'Batch Created & Registered';
  if (action === 'accepted') return 'Accepted & Ownership Transferred';
  return action;
};

export default function BatchLogModal({ batch, onClose }) {
  // Close on Escape key
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  if (!batch) return null;

  const statusColors = { created: '#2563eb', 'in-transit': '#d97706', delivered: '#16a34a' };
  const statusLabels = { created: '🏭 Created', 'in-transit': '🚚 In Transit', delivered: '✅ Delivered' };

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(15, 23, 42, 0.55)',
        backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '1rem',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#fff',
          borderRadius: '20px',
          width: '100%',
          maxWidth: '580px',
          maxHeight: '88vh',
          overflowY: 'auto',
          boxShadow: '0 25px 60px rgba(0,0,0,0.25)',
          animation: 'modalPop 0.22s cubic-bezier(0.34,1.56,0.64,1)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, #1e40af 0%, #2563eb 100%)',
          borderRadius: '20px 20px 0 0',
          padding: '1.5rem 1.75rem',
          color: '#fff',
          display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
        }}>
          <div>
            <div style={{ fontSize: '0.78rem', opacity: 0.8, marginBottom: '0.3rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Journey Log
            </div>
            <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700 }}>{batch.medicineName}</h2>
            <p style={{ margin: '0.35rem 0 0', fontSize: '0.78rem', opacity: 0.75, fontFamily: 'monospace' }}>
              {batch.batchId}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.18)', border: 'none', borderRadius: '50%',
              width: '34px', height: '34px', cursor: 'pointer', color: '#fff',
              fontSize: '1.1rem', lineHeight: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >×</button>
        </div>

        {/* Batch Meta */}
        <div style={{ padding: '1.25rem 1.75rem 0' }}>
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr 1fr',
            gap: '0.75rem', marginBottom: '1.25rem',
          }}>
            {[
              { label: 'Status', value: statusLabels[batch.status] || batch.status, color: statusColors[batch.status] },
              { label: 'Owner', value: `${roleIcons[batch.currentOwner] || ''} ${batch.currentOwner}`, color: '#475569' },
              { label: 'Integrity', value: batch.isValid !== false ? '✅ Valid' : '❌ Tampered', color: batch.isValid !== false ? '#16a34a' : '#dc2626' },
            ].map(({ label, value, color }) => (
              <div key={label} style={{
                background: '#f8fafc', borderRadius: '10px', padding: '0.75rem',
                border: '1px solid #e2e8f0', textAlign: 'center',
              }}>
                <div style={{ fontSize: '0.72rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.3rem' }}>{label}</div>
                <div style={{ fontWeight: 700, fontSize: '0.82rem', color, textTransform: 'capitalize' }}>{value}</div>
              </div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '1.25rem' }}>
            {[
              { label: 'Manufacture Date', value: new Date(batch.manufactureDate).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' }) },
              { label: 'Expiry Date', value: new Date(batch.expiryDate).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' }) },
              { label: 'Temp. Threshold', value: `Below ${batch.temperatureThreshold}°C` },
              { label: 'Temp. Safety', value: batch.isSafe !== false ? '🌡️ Safe' : '⚠️ Exceeded', color: batch.isSafe !== false ? '#16a34a' : '#d97706' },
            ].map(({ label, value, color }) => (
              <div key={label} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '0.55rem 0.75rem', background: '#f8fafc', borderRadius: '8px',
                border: '1px solid #e2e8f0', fontSize: '0.82rem',
              }}>
                <span style={{ color: '#64748b' }}>{label}</span>
                <span style={{ fontWeight: 600, color: color || '#0f172a' }}>{value}</span>
              </div>
            ))}
          </div>

          {/* Blockchain Hash */}
          {batch.blockchainHash && (
            <div style={{
              background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '10px',
              padding: '0.75rem 1rem', marginBottom: '1.25rem',
            }}>
              <div style={{ fontSize: '0.72rem', color: '#0369a1', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.3rem' }}>
                🔗 Blockchain Hash (SHA-256)
              </div>
              <div style={{ fontFamily: 'monospace', fontSize: '0.7rem', color: '#0c4a6e', wordBreak: 'break-all' }}>
                {batch.blockchainHash}
              </div>
            </div>
          )}
        </div>

        {/* Journey Timeline */}
        <div style={{ padding: '0 1.75rem 1.75rem' }}>
          <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0f172a', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            📦 Supply Chain Timeline
          </h3>

          {batch.journeyLogs && batch.journeyLogs.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {batch.journeyLogs.map((log, idx) => {
                const colors = roleColors[log.role] || roleColors.manufacturer;
                const isLast = idx === batch.journeyLogs.length - 1;
                return (
                  <div key={idx} style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                    {/* Connector line + dot */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '24px', flexShrink: 0, paddingTop: '2px' }}>
                      <div style={{
                        width: '24px', height: '24px', borderRadius: '50%',
                        background: colors.bg, border: `2px solid ${colors.dot}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '0.75rem', flexShrink: 0,
                      }}>
                        {roleIcons[log.role] || '📦'}
                      </div>
                      {!isLast && (
                        <div style={{ width: '2px', flex: 1, background: '#e2e8f0', minHeight: '20px', marginTop: '4px' }} />
                      )}
                    </div>

                    {/* Content */}
                    <div style={{
                      flex: 1, background: colors.bg,
                      border: `1px solid ${colors.border}`,
                      borderRadius: '12px', padding: '0.75rem 1rem',
                      marginBottom: isLast ? 0 : '0.25rem',
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.25rem' }}>
                        <div>
                          <span style={{ fontWeight: 700, color: colors.text, fontSize: '0.85rem', textTransform: 'capitalize' }}>
                            {log.role}
                          </span>
                          <span style={{ color: '#64748b', fontSize: '0.8rem', marginLeft: '0.5rem' }}>
                            — {actionLabel(log.action)}
                          </span>
                        </div>
                        <span style={{ fontSize: '0.72rem', color: '#94a3b8', whiteSpace: 'nowrap' }}>
                          {new Date(log.timestamp).toLocaleString('en-IN', {
                            day: '2-digit', month: 'short', year: 'numeric',
                            hour: '2-digit', minute: '2-digit',
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p style={{ color: '#94a3b8', textAlign: 'center', padding: '1.5rem' }}>No journey logs recorded yet.</p>
          )}
        </div>
      </div>

      <style>{`
        @keyframes modalPop {
          from { transform: scale(0.88); opacity: 0; }
          to   { transform: scale(1);    opacity: 1; }
        }
      `}</style>
    </div>
  );
}
