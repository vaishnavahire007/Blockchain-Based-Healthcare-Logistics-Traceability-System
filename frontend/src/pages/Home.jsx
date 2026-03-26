export default function Home() {
  return (
    <div className="home-container">
      <header className="hero">
        <h1>Welcome to the Healthcare Logistics Traceability System</h1>
        <p>A blockchain-based solution for tracking and verifying the healthcare supply chain securely and transparently.</p>
        <button className="primary-btn">Get Started</button>
      </header>
      
      <section className="features-section">
        <div className="feature-card">
          <h3>Secure Tracking</h3>
          <p>Trace pharmaceutical products from manufacturer to patient.</p>
        </div>
        <div className="feature-card">
          <h3>Immutable Records</h3>
          <p>Blockchain technology ensures that product histories cannot be altered.</p>
        </div>
        <div className="feature-card">
          <h3>IoT Integration</h3>
          <p>Real-time environment monitoring to ensure compliance and safety.</p>
        </div>
      </section>
    </div>
  );
}
