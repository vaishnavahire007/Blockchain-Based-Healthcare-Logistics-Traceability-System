import { useEffect, useRef } from 'react';

export default function QRModal({ qrCode, medicineName, batchId, onClose }) {
  const overlayRef = useRef(null);

  // Close on Escape key
  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  // Prevent body scroll while modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const handleOverlayClick = (e) => {
    if (e.target === overlayRef.current) onClose();
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = qrCode;
    link.download = `QR_${medicineName || 'batch'}_${batchId ? batchId.substring(0, 8) : ''}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div
      className="qr-modal-overlay"
      ref={overlayRef}
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-label="QR Code Viewer"
    >
      <div className="qr-modal-card">
        {/* Header */}
        <div className="qr-modal-header">
          <div>
            <h3 className="qr-modal-title">QR Code</h3>
            {medicineName && (
              <p className="qr-modal-subtitle">{medicineName}</p>
            )}
          </div>
          <button className="qr-modal-close" onClick={onClose} aria-label="Close QR modal">
            ✕
          </button>
        </div>

        {/* QR Image */}
        <div className="qr-modal-image-wrap">
          <div className="qr-modal-scanner-corner tl" />
          <div className="qr-modal-scanner-corner tr" />
          <div className="qr-modal-scanner-corner bl" />
          <div className="qr-modal-scanner-corner br" />
          <img
            src={qrCode}
            alt="QR Code"
            className="qr-modal-image"
            draggable={false}
          />
        </div>

        {/* Scan hint */}
        <p className="qr-modal-hint">
          📷 Point your camera at this code to scan, or download it below
        </p>

        {/* Actions */}
        <div className="qr-modal-actions">
          <button className="qr-modal-download-btn" onClick={handleDownload}>
            ⬇ Download QR
          </button>
          <button className="qr-modal-cancel-btn" onClick={onClose}>
            Close
          </button>
        </div>

        {batchId && (
          <p className="qr-modal-batch-id">
            Batch: <span className="code-font">{batchId.substring(0, 16)}...</span>
          </p>
        )}
      </div>
    </div>
  );
}
