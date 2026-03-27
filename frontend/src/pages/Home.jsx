import { useNavigate } from 'react-router-dom';
import { useState } from 'react';

export default function Home() {
  const navigate = useNavigate();
  const [hoveredCard, setHoveredCard] = useState(null);

  const handleGetStarted = () => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('userRole');

    if (!token) {
      navigate('/login');
      return;
    }

    switch(role) {
      case 'manufacturer': navigate('/manufacturer-dashboard'); break;
      case 'distributor': navigate('/distributor-dashboard'); break;
      case 'pharmacy': navigate('/pharmacy-dashboard'); break;
      case 'user': navigate('/user-dashboard'); break;
      default: navigate('/login');
    }
  };

  const scrollToSection = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const cardStyle = (id) => ({
    padding: '2.5rem',
    backgroundColor: '#fff',
    borderRadius: '16px',
    boxShadow: hoveredCard === id ? '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' : '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    transform: hoveredCard === id ? 'translateY(-10px) scale(1.02)' : 'translateY(0) scale(1)',
    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
    cursor: 'pointer',
    border: '1px solid #e2e8f0',
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center'
  });

  return (
    <div className="home-container">
      <header className="hero" style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        padding: '40px', 
        textAlign: 'center', 
        backgroundColor: '#fff', 
        backgroundImage: 'radial-gradient(circle at center, #f8fafc 0%, #e2e8f0 100%)', 
        borderBottom: '1px solid #e2e8f0',
        minHeight: '50vh'
      }}>
        <div style={{ maxWidth: '900px', margin: 'auto' }}>
          <h1 style={{ fontSize: '3.5rem', color: '#0f172a', marginBottom: '1.5rem', fontWeight: '800', letterSpacing: '-1px' }}>
            Welcome to the Healthcare Logistics System
          </h1>
          <p style={{ fontSize: '1.25rem', color: '#64748b', margin: '0 auto 2.5rem', lineHeight: '1.8' }}>
            A blockchain-based solution strictly engineered for transparently tracking and verifying the healthcare supply chain mathematically across all geographic handovers securely.
          </p>
          
          <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button className="primary-btn" onClick={handleGetStarted} style={{ padding: '1rem 3rem', fontSize: '1.15rem' }}>
              Get Started
            </button>
            <button className="primary-btn" onClick={() => navigate('/scan')} style={{ padding: '1rem 3rem', fontSize: '1.15rem', backgroundColor: '#fff', color: '#3b82f6', border: '2px solid #3b82f6' }}>
              Scan QR Target
            </button>
            <button className="primary-btn" onClick={() => navigate('/track')} style={{ padding: '1rem 3rem', fontSize: '1.15rem', backgroundColor: '#fff', color: '#3b82f6', border: '2px solid #3b82f6' }}>
              Track Medicine
            </button>
          </div>
        </div>
      </header>
      
      <section style={{ padding: '6rem 2rem', backgroundColor: '#fff' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
          <div 
            style={cardStyle('tracking')} 
            onMouseEnter={() => setHoveredCard('tracking')} 
            onMouseLeave={() => setHoveredCard(null)}
            onClick={() => scrollToSection('info-tracking')}
          >
            <div style={{ fontSize: '3.5rem', marginBottom: '1.5rem', backgroundColor: '#eff6ff', width: '90px', height: '90px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%' }}>📍</div>
            <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#0f172a', fontWeight: '700' }}>Secure Tracking</h3>
            <p style={{ color: '#64748b', lineHeight: '1.7', fontSize: '1.05rem' }}>Trace pharmaceutical products flawlessly from manufacturer to patient.</p>
            <span style={{ color: '#3b82f6', fontWeight: 'bold', marginTop: '1.5rem', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Learn More &rarr;</span>
          </div>
          
          <div 
            style={cardStyle('blockchain')} 
            onMouseEnter={() => setHoveredCard('blockchain')} 
            onMouseLeave={() => setHoveredCard(null)}
            onClick={() => scrollToSection('info-blockchain')}
          >
            <div style={{ fontSize: '3.5rem', marginBottom: '1.5rem', backgroundColor: '#f0fdf4', width: '90px', height: '90px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%' }}>🛡️</div>
            <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#0f172a', fontWeight: '700' }}>Immutable Records</h3>
            <p style={{ color: '#64748b', lineHeight: '1.7', fontSize: '1.05rem' }}>Blockchain signatures strictly ensure product histories cannot be altered retroactively.</p>
            <span style={{ color: '#3b82f6', fontWeight: 'bold', marginTop: '1.5rem', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Learn More &rarr;</span>
          </div>
          
          <div 
            style={cardStyle('iot')} 
            onMouseEnter={() => setHoveredCard('iot')} 
            onMouseLeave={() => setHoveredCard(null)}
            onClick={() => scrollToSection('info-iot')}
          >
            <div style={{ fontSize: '3.5rem', marginBottom: '1.5rem', backgroundColor: '#fef2f2', width: '90px', height: '90px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%' }}>🌡️</div>
            <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#0f172a', fontWeight: '700' }}>IoT Integration</h3>
            <p style={{ color: '#64748b', lineHeight: '1.7', fontSize: '1.05rem' }}>Automated hardware sensors constantly stream real-time temperature logs autonomously.</p>
            <span style={{ color: '#3b82f6', fontWeight: 'bold', marginTop: '1.5rem', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Learn More &rarr;</span>
          </div>
        </div>
      </section>

      <section style={{ padding: '6rem 2rem', backgroundColor: '#f8fafc', display: 'flex', flexDirection: 'column', gap: '6rem', alignItems: 'center', borderTop: '1px solid #e2e8f0' }}>
        
        <div id="info-tracking" style={{ maxWidth: '900px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '3rem', backgroundColor: '#fff', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📍</div>
          <h2 style={{ fontSize: '2.5rem', color: '#0f172a', marginBottom: '1.5rem', fontWeight: '800' }}>End-to-End Tracking Architecture</h2>
          <p style={{ fontSize: '1.15rem', color: '#475569', lineHeight: '1.8', maxWidth: '750px' }}>
            Every medicine component logically instantiates a uniquely encoded UUID identifier Payload mapped specifically alongside a dynamic physical QR-Code payload. This explicitly secures strict geographic handovers locally between Authorized Distributers and local Pharmacies. Scan QR components effortlessly route stakeholders backwards to visually track pipeline coordinates automatically. 
          </p>
          <button className="primary-btn" onClick={() => navigate('/track')} style={{ marginTop: '2.5rem', padding: '1rem 3rem', fontSize: '1.1rem' }}>Launch Tracker Platform</button>
        </div>

        <div id="info-blockchain" style={{ maxWidth: '900px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '3rem', backgroundColor: '#fff', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🛡️</div>
          <h2 style={{ fontSize: '2.5rem', color: '#0f172a', marginBottom: '1.5rem', fontWeight: '800' }}>Cryptographic Node Tampering Failsafe</h2>
          <p style={{ fontSize: '1.15rem', color: '#475569', lineHeight: '1.8', maxWidth: '750px' }}>
            To unequivocally combat malicious digital theft visually, mapping nodes inherently calculate an invisible <strong>SHA-256 Hash</strong> digest strictly locking database arrays permanently. The public Tracking APIs continuously ping the physical controller, structurally regenerating payload strings to mathematically expose potential tampering vulnerabilities directly to patients dynamically avoiding physical counterfeits natively.
          </p>
          <button className="primary-btn" onClick={() => navigate('/register')} style={{ marginTop: '2.5rem', padding: '1rem 3rem', fontSize: '1.1rem', backgroundColor: '#10b981', borderColor: '#10b981' }}>Register Manufacturer</button>
        </div>

        <div id="info-iot" style={{ maxWidth: '900px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '3rem', backgroundColor: '#fff', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🌡️</div>
          <h2 style={{ fontSize: '2.5rem', color: '#0f172a', marginBottom: '1.5rem', fontWeight: '800' }}>Sensor Telemetry Threshold Detection</h2>
          <p style={{ fontSize: '1.15rem', color: '#475569', lineHeight: '1.8', maxWidth: '750px' }}>
            Because specific transit locations natively trigger extreme heat spikes seamlessly, real-time simulated Background Daemons automatically dispatch exact floats continuously mapped back to MongoDB instances dynamically. The <strong>Recharts Engine</strong> naturally renders dynamic temperature waves highlighting specific package deterioration natively across UI elements immediately warning stakeholders of absolute structural collapses.
          </p>
        </div>

      </section>
    </div>
  );
}
