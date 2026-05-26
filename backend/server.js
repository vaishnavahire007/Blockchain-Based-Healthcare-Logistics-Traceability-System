require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const Batch = require("./models/Batch");
const crypto = require("crypto");

const app = express();
const PORT = process.env.PORT || 5000;

// Route files
const authRoutes = require("./routes/authRoutes");
const batchRoutes = require("./routes/batchRoutes");
const startTemperatureSimulation = require('./utils/simulator');

// Middleware
app.use(cors());
app.use(express.json());

// ─────────────────────────────────────────────────────────────────────────────
// Serve built React frontend as static files (production)
// Render runs: npm run build  →  cd frontend && npm install && npm run build
// Output lands in: frontend/dist/
// ─────────────────────────────────────────────────────────────────────────────
const frontendDist = path.join(__dirname, '..', 'frontend', 'dist');
app.use(express.static(frontendDist));

// ── API Routes ────────────────────────────────────────────────────────────────
app.get("/api/test", (req, res) => {
  res.json({ message: "Backend is successfully connected and running!" });
});
app.use('/api/auth', authRoutes);
app.use('/api/batch', batchRoutes);

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC QR SCAN ROUTE — self-contained HTML page served by Express.
// QR codes encode: https://your-app.onrender.com/track/<batchId>
// Works on ANY phone, no login, no React, no Vite needed.
// ─────────────────────────────────────────────────────────────────────────────
app.get('/track/:batchId', async (req, res) => {
  try {
    const batch = await Batch.findOne({ batchId: req.params.batchId })
      .populate('manufacturerId', 'name email');

    if (!batch) {
      return res.status(404).send(renderTrackPage(null, req.params.batchId));
    }

    // Re-verify blockchain hash inline
    let verified = null;
    if (batch.blockchainHash) {
      const originManufactureDate = new Date(batch.manufactureDate).toISOString().split('T')[0];
      const originExpiryDate = new Date(batch.expiryDate).toISOString().split('T')[0];
      const hashPayload = JSON.stringify({
        batchId: batch.batchId,
        medicineName: batch.medicineName,
        manufactureDate: originManufactureDate,
        expiryDate: originExpiryDate
      });
      const recreatedHash = crypto.createHash('sha256').update(hashPayload).digest('hex');
      verified = recreatedHash === batch.blockchainHash;
    }

    res.send(renderTrackPage(batch, null, verified));
  } catch (err) {
    res.status(500).send(renderTrackPage(null, req.params.batchId, null, err.message));
  }
});

function renderTrackPage(batch, batchId, verified = null, serverError = null) {
  const statusColors = { created: '#2563eb', 'in-transit': '#d97706', delivered: '#16a34a' };
  const statusIcons  = { created: '🏭', 'in-transit': '🚚', delivered: '✅' };

  const errorHtml = `
    <div class="card" style="text-align:center;padding:3rem 2rem;">
      <div style="font-size:3rem;margin-bottom:1rem;">❌</div>
      <h2 style="color:#ef4444;margin-bottom:0.5rem;">Batch Not Found</h2>
      <p style="color:#64748b;">No record found for ID: <code style="background:#f1f5f9;padding:2px 6px;border-radius:4px;">${batchId || 'unknown'}</code></p>
      ${serverError ? `<p style="color:#ef4444;margin-top:1rem;font-size:0.85rem;">${serverError}</p>` : ''}
    </div>`;

  const verifyBadge = verified === true
    ? `<div class="badge verified">🛡️ Blockchain Verified — Data Authentic</div>`
    : verified === false
    ? `<div class="badge tampered">⚠️ Warning: Data May Be Tampered</div>`
    : '';

  const safetyBadge = batch && batch.isSafe === false
    ? `<div class="badge unsafe">🌡️ Temperature Exceeded Safe Limit — May Be Unsafe</div>` : '';

  const journeyHtml = batch && batch.journeyLogs && batch.journeyLogs.length
    ? batch.journeyLogs.map(log => `
        <div class="timeline-item">
          <div class="timeline-dot"></div>
          <div class="timeline-content">
            <strong style="text-transform:capitalize;">${log.role}</strong>
            <span style="color:#2563eb;margin:0 6px;">→</span>
            <span style="text-transform:capitalize;">${log.action}</span>
            <div style="font-size:0.8rem;color:#64748b;margin-top:4px;">
              ${new Date(log.timestamp).toLocaleString(undefined, { year:'numeric',month:'short',day:'numeric',hour:'2-digit',minute:'2-digit' })}
            </div>
          </div>
        </div>`).join('')
    : '<p style="color:#64748b">No journey logs yet.</p>';

  const batchHtml = batch ? `
    <div class="card">
      <h2 style="color:#2563eb;margin-bottom:0.25rem;">${batch.medicineName}</h2>
      <p style="color:#64748b;font-size:0.85rem;margin-bottom:1.5rem;word-break:break-all;">Batch ID: ${batch.batchId}</p>
      ${verifyBadge}
      ${safetyBadge}
      <div class="info-grid">
        <div class="info-row"><span class="label">Status</span>
          <span class="status-pill" style="background:${statusColors[batch.status] || '#64748b'}">
            ${statusIcons[batch.status] || ''} ${batch.status}
          </span>
        </div>
        <div class="info-row"><span class="label">Current Owner</span><span style="text-transform:capitalize;font-weight:600;">${batch.currentOwner}</span></div>
        <div class="info-row"><span class="label">Manufacturer</span><span>${batch.manufacturerId?.name || 'Unknown'}</span></div>
        <div class="info-row"><span class="label">Manufacture Date</span><span>${new Date(batch.manufactureDate).toLocaleDateString()}</span></div>
        <div class="info-row"><span class="label">Expiry Date</span><span>${new Date(batch.expiryDate).toLocaleDateString()}</span></div>
        <div class="info-row"><span class="label">Temp. Threshold</span><span>Below ${batch.temperatureThreshold}°C</span></div>
        <div class="info-row"><span class="label">Integrity</span><span>${batch.isValid !== false ? '✅ Valid' : '❌ Compromised'}</span></div>
      </div>
    </div>
    <div class="card">
      <h3 style="margin-bottom:1.25rem;">📦 Journey Timeline</h3>
      <div class="timeline">${journeyHtml}</div>
    </div>` : errorHtml;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <meta name="theme-color" content="#2563eb"/>
  <title>${batch ? batch.medicineName + ' — Batch Tracker' : 'Batch Not Found'}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f0f4ff; color: #0f172a; min-height: 100vh; padding-bottom: 2rem; }
    header { background: linear-gradient(135deg, #1e40af 0%, #2563eb 100%); color: white; padding: 1.25rem 1.5rem; text-align: center; }
    header h1 { font-size: 1.15rem; font-weight: 700; }
    header p  { font-size: 0.8rem; opacity: 0.8; margin-top: 4px; }
    .container { max-width: 600px; margin: 0 auto; padding: 1.5rem 1rem; display: flex; flex-direction: column; gap: 1.25rem; }
    .card { background: #fff; border-radius: 16px; padding: 1.5rem; box-shadow: 0 4px 20px rgba(37,99,235,0.08); }
    .badge { border-radius: 10px; padding: 0.75rem 1rem; font-size: 0.875rem; font-weight: 600; margin-bottom: 1.25rem; display: flex; align-items: center; gap: 0.5rem; }
    .badge.verified { background:#f0fdf4; color:#166534; border:1px solid #4ade80; }
    .badge.tampered { background:#fef2f2; color:#b91c1c; border:1px solid #f87171; }
    .badge.unsafe   { background:#fffbeb; color:#b45309; border:1px solid #fcd34d; }
    .info-grid { display: flex; flex-direction: column; }
    .info-row { display: flex; justify-content: space-between; align-items: center; padding: 0.7rem 0; border-bottom: 1px solid #f1f5f9; font-size: 0.9rem; }
    .info-row:last-child { border-bottom: none; }
    .label { color: #64748b; font-weight: 500; }
    .status-pill { color: #fff; border-radius: 20px; padding: 3px 12px; font-size: 0.8rem; font-weight: 700; text-transform: capitalize; }
    h3 { color: #0f172a; font-size: 1rem; }
    .timeline { border-left: 2px solid #2563eb; padding-left: 1.25rem; display: flex; flex-direction: column; gap: 1.25rem; }
    .timeline-item { position: relative; }
    .timeline-dot { position: absolute; left: -1.5rem; top: 0.3rem; width: 10px; height: 10px; border-radius: 50%; background: #fff; border: 2px solid #2563eb; }
    .timeline-content { font-size: 0.9rem; }
    footer { text-align: center; color: #94a3b8; font-size: 0.75rem; padding: 1rem; }
  </style>
</head>
<body>
  <header>
    <h1>🔗 Healthcare Logistics Tracker</h1>
    <p>Blockchain-Verified Medicine Supply Chain</p>
  </header>
  <div class="container">${batchHtml}</div>
  <footer>Scanned via QR Code &bull; Powered by Blockchain Ledger</footer>
</body>
</html>`;
}

// ─────────────────────────────────────────────────────────────────────────────
// React Router fallback — must come AFTER /api and /track routes.
// Sends index.html for any other GET (e.g. /login, /manufacturer-dashboard).
// ─────────────────────────────────────────────────────────────────────────────
app.get('*', (req, res) => {
  res.sendFile(path.join(frontendDist, 'index.html'));
});

// Spark Native Background IoT Daemon
startTemperatureSimulation();

// Database connection
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/blockchain_logistics";

mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log("Connected to MongoDB successfully");
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running on port ${PORT}`);
      const base = process.env.BACKEND_URL || `http://localhost:${PORT}`;
      console.log(`📱 QR Scan URL: ${base}/track/<batchId>`);
    });
  })
  .catch((error) => {
    console.error("MongoDB connection error:", error);
  });
