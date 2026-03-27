import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Html5QrcodeScanner, Html5Qrcode, Html5QrcodeScanType } from 'html5-qrcode';
import { extractBatchIdFromQR } from '../utils/qrUtils';

export default function ScanQR() {
  const [scanResult, setScanResult] = useState(null);
  const [scanError, setScanError] = useState(null);
  
  // Controls the active UI view
  const [mode, setMode] = useState('selection'); // 'selection' | 'camera' | 'upload'
  const navigate = useNavigate();

  const handleScanSuccess = (decodedText, scannerInstance = null) => {
    setScanResult(decodedText);
    
    // Leverage the new centralized extraction module
    const batchId = extractBatchIdFromQR(decodedText);
    
    if (batchId) {
      if (scannerInstance) {
         scannerInstance.clear().catch(e => console.error("Failed to halt camera.", e));
      }
      navigate(`/track/${batchId}`);
    } else {
      setScanError("Invalid QR Code: Payload does not contain a verifiable tracking ID.");
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setScanError(null);
    try {
      const html5QrCode = new Html5Qrcode("file-qr-reader");
      // true specifies we want to execute a robust rescan fallback algorithm if it fails initially
      const decodedText = await html5QrCode.scanFile(file, true);
      handleScanSuccess(decodedText, null);
    } catch (err) {
      console.error(err);
      setScanError("Invalid or unreadable QR image");
    }
  };

  useEffect(() => {
    let scanner = null;
    if (mode === 'camera') {
      scanner = new Html5QrcodeScanner(
        "camera-qr-reader",
        { 
          fps: 10, 
          qrbox: { width: 280, height: 280 },
          supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA]
        },
        false
      );
      
      scanner.render(
        (text) => handleScanSuccess(text, scanner), 
        () => {} // explicitly bury camera query loop logs
      );
    }

    // Full system hardware unload
    return () => {
      if (scanner) {
        scanner.clear().catch(e => console.error("Failed closing hardware scanner.", e));
      }
    };
  }, [mode]);

  return (
    <div className="dashboard-container" style={{ maxWidth: '650px', margin: '4rem auto' }}>
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '2.5rem', color: 'var(--primary-color)' }}>Batch Tracker</h2>
        <p style={{ color: '#64748b', fontSize: '1.1rem' }}>Upload or scan a logistics payload to decrypt its blockchain origins.</p>
      </div>

      <div className="dashboard-card" style={{ padding: '2rem', display: 'flex', flexDirection: 'column' }}>
        {scanError && (
          <div className="message-alert error" style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
            {scanError}
            <button 
              onClick={() => { setScanError(null); setScanResult(null); }} 
              style={{ background: 'none', color: 'inherit', marginLeft: '10px', cursor: 'pointer', outline: 'none', border: 'none', textDecoration: 'underline' }}
            >
              Try Again
            </button>
          </div>
        )}
        
        {scanResult && !scanError ? (
          <div style={{ textAlign: 'center', margin: '2rem 0' }}>
            <p style={{ color: '#10b981', fontWeight: 'bold', fontSize: '1.25rem' }}>Match Successful! Intercepting origin tracker...</p>
          </div>
        ) : mode === 'selection' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', alignItems: 'center', marginTop: '1rem', padding: '1rem 0' }}>
            <button className="primary-btn" onClick={() => setMode('camera')} style={{ width: '100%', maxWidth: '300px', fontSize: '1.1rem', padding: '1rem' }}>
              Scan with Camera
            </button>
            <button className="primary-btn" onClick={() => setMode('upload')} style={{ width: '100%', maxWidth: '300px', fontSize: '1.1rem', backgroundColor: '#64748b', padding: '1rem' }}>
              Upload QR Image
            </button>
          </div>
        ) : mode === 'upload' ? (
          <div style={{ textAlign: 'center', padding: '1rem 0' }}>
            <h3>Digital Scan Dropzone</h3>
            <p style={{ color: '#64748b', marginBottom: '2rem' }}>Select a .png, .jpg, or .jpeg file containing a valid payload image securely.</p>
            <input 
              type="file" 
              accept="image/png, image/jpeg, image/jpg" 
              onChange={handleFileUpload}
              style={{ padding: '1.5rem', border: '2px dashed #cbd5e1', borderRadius: '8px', width: '100%', cursor: 'pointer', background: '#f8fafc' }}
            />
             {/* Invisible hardware mount point required for class mapping file parser logic */}
             <div id="file-qr-reader" style={{ position: 'absolute', top: '-9999px', visibility: 'hidden' }}></div>
             
             <button onClick={() => setMode('selection')} style={{ marginTop: '2.5rem', color: '#64748b', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>
               Back to Scan Options
             </button>
          </div>
        ) : mode === 'camera' ? (
          <div>
            <div id="camera-qr-reader" style={{ width: '100%', border: 'none' }}></div>
            <div style={{ textAlign: 'center' }}>
              <button onClick={() => setMode('selection')} style={{ marginTop: '2.5rem', color: '#64748b', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>
                Back to Scan Options
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
