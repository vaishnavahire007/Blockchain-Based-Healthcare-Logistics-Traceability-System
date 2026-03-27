export const extractBatchIdFromQR = (decodedText) => {
  console.log("===================================");
  console.log("🔍 Scanning QR Payload...");
  console.log("RAW Scanned Data:", decodedText);
  
  if (!decodedText) {
    console.log("Result: Empty QR code payload.");
    console.log("===================================");
    return null;
  }

  try {
    // Attempt to safely establish a secure URL interface
    // Automatically accounts for http://localhost:5173/track/123 or http://192.168.X.X:5173/track/123
    const url = new URL(decodedText);
    
    if (url.pathname.includes('/track/')) {
      const parts = url.pathname.split('/track/');
      
      // Extract the precise dynamic UUID sequence succeeding /track/
      const batchId = parts[parts.length - 1].replace(/\/$/, ""); 
      
      if (batchId) {
        console.log("✅ Successfully Extracted Batch ID:", batchId);
        console.log("===================================");
        return batchId;
      }
    }
  } catch (err) {
    console.warn("⚠️ QR is not a recognizable URL object, attempting fallback parsing...");
  }

  // Graceful Fallback: Capturing relative paths or raw tracking strings
  if (decodedText.includes('/track/')) {
      const parts = decodedText.split('/track/');
      const batchId = parts[parts.length - 1].replace(/\/$/, "");
      if (batchId) {
        console.log("✅ Extracted Batch ID via Fallback:", batchId);
        console.log("===================================");
        return batchId;
      }
  }
  
  console.error("❌ Extraction Failed: Payload does not map to a standard supply-chain tracker.");
  console.log("===================================");
  return null;
};
