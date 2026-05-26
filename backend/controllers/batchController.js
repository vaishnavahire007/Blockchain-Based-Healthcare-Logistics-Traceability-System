const Batch = require('../models/Batch');
const QRCode = require('qrcode');
const crypto = require('crypto');

// @desc    Create new batch
// @route   POST /api/batch/create
// @access  Private/Manufacturer
exports.createBatch = async (req, res) => {
  try {
    const { medicineName, manufactureDate, expiryDate, temperatureThreshold } = req.body;

    if (!medicineName || !manufactureDate || !expiryDate || temperatureThreshold === undefined) {
      return res.status(400).json({ success: false, error: 'Please provide all required fields' });
    }

    const batchId = crypto.randomUUID();
    // BACKEND_URL is set in Render's environment variables (e.g. https://your-app.onrender.com)
    // Falls back to localhost for local development.
    const baseUrl = process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 5000}`;
    const trackerUrl = `${baseUrl}/track/${batchId}`;
    const qrCodeBase64 = await QRCode.toDataURL(trackerUrl, { width: 300, margin: 2 });

    // Cryptographically serialize immutable ledger properties into an impenetrable SHA256 string
    const hashPayload = JSON.stringify({
      batchId,
      medicineName,
      manufactureDate,
      expiryDate
    });
    const blockchainHash = crypto.createHash('sha256').update(hashPayload).digest('hex');

    const batch = await Batch.create({
      batchId,
      medicineName,
      manufactureDate,
      expiryDate,
      temperatureThreshold,
      manufacturerId: req.user.id,
      currentOwner: 'manufacturer',
      status: 'created',
      qrCode: qrCodeBase64,
      blockchainHash,
      journeyLogs: [{
        role: 'manufacturer',
        action: 'created',
        timestamp: new Date()
      }]
    });

    res.status(201).json({ success: true, data: batch });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({ success: false, error: messages.join(', ') });
    }
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Get single batch by batchId
// @route   GET /api/batch/:batchId
// @access  Private
exports.getBatchById = async (req, res) => {
  try {
    const batch = await Batch.findOne({ batchId: req.params.batchId }).populate('manufacturerId', 'name email');

    if (!batch) {
      return res.status(404).json({ success: false, error: 'Batch not found' });
    }

    res.status(200).json({ success: true, data: batch });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Get all batches for manufacturer
// @route   GET /api/batch/my-batches
// @access  Private/Manufacturer
exports.getMyBatches = async (req, res) => {
  try {
    const batches = await Batch.find({ manufacturerId: req.user.id }).sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: batches.length, data: batches });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Update batch tracking status and handovers
// @route   POST /api/batch/update-status/:batchId
// @access  Private (Distributor/Pharmacy)
exports.updateBatchStatus = async (req, res) => {
  try {
    const batch = await Batch.findOne({ batchId: req.params.batchId });

    if (!batch) {
      return res.status(404).json({ success: false, error: 'Batch not found' });
    }

    const { role } = req.user;

    // Orchestrator: If a node violates blockchain rules, physically corrupt the ledger safely.
    const flagTampering = async (batchDoc, msg) => {
      batchDoc.isValid = false;
      await batchDoc.save();
      return res.status(400).json({ success: false, error: msg });
    };

    // 0. Verify chronological origin traces exist before processing
    if (!batch.journeyLogs || batch.journeyLogs.length === 0) {
      return await flagTampering(batch, 'Corrupted ledger: Missing journey logs');
    }

    // 1. Check if this role has already recorded an 'accepted' transaction historically
    const alreadyAccepted = batch.journeyLogs.some(log => log.role === role && log.action === 'accepted');
    if (alreadyAccepted) {
      return await flagTampering(batch, 'Already accepted and recorded on blockchain (Tampering Detected)');
    }

    // 2. Prevent sequence bypass if endpoint destination (Pharmacy) has already absorbed the payload
    if (batch.currentOwner === 'pharmacy') {
      return await flagTampering(batch, 'Batch journey has already concluded (Tampering Detected)');
    }

    // 3 & 4. Enforce rigid chronological pipeline (Manufacturer -> Distributor -> Pharmacy)
    if (role === 'distributor' && batch.currentOwner !== 'manufacturer') {
      return await flagTampering(batch, 'Invalid transfer flow: Distributor must receive structurally from a Manufacturer');
    }

    if (role === 'pharmacy' && batch.currentOwner !== 'distributor') {
      return await flagTampering(batch, 'Invalid transfer flow: Pharmacy must receive structurally from a Distributor');
    }

    // 5. Automate assignment updates based dynamically on the handler role
    batch.currentOwner = role;
    batch.status = role === 'distributor' ? 'in-transit' : 'delivered';

    // 6. Seal an immutable timestamped event marker inside the database array
    batch.journeyLogs.push({
      role: role,
      action: 'accepted',
      timestamp: new Date()
    });

    await batch.save();

    res.status(200).json({ success: true, data: batch });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Get all incoming batches eligible for user to accept
// @route   GET /api/batch/incoming
// @access  Private (Distributor/Pharmacy)
exports.getIncomingBatches = async (req, res) => {
  try {
    const { role } = req.user;
    
    // Safety check matching the router permissions
    if (role !== 'distributor' && role !== 'pharmacy') {
      return res.status(403).json({ success: false, error: 'Role not authorized for incoming batches' });
    }

    const targetOwner = role === 'distributor' ? 'manufacturer' : 'distributor';

    // 1. Fetch batches matching specific supply pipeline node
    const batches = await Batch.find({ currentOwner: targetOwner })
      .select('batchId medicineName manufactureDate expiryDate currentOwner journeyLogs')
      .sort({ createdAt: -1 });

    // 2. Extensively eliminate any payloads the user array historically interacted with
    const eligibleBatches = batches.filter(batch => {
      const alreadyAccepted = batch.journeyLogs.some(log => log.role === role && log.action === 'accepted');
      return !alreadyAccepted;
    });

    // 3. Format payload exclusively to requested schema omitting internals
    const sanitizedBatches = eligibleBatches.map(batch => ({
      batchId: batch.batchId,
      medicineName: batch.medicineName,
      manufactureDate: batch.manufactureDate,
      expiryDate: batch.expiryDate,
      currentOwner: batch.currentOwner
    }));

    res.status(200).json({ success: true, count: sanitizedBatches.length, data: sanitizedBatches });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Simulate IoT temperature sensor logs natively
// @route   POST /api/batch/add-temperature/:batchId
// @access  Public (Simulating independent hardware device webhook ping)
exports.addTemperatureLog = async (req, res) => {
  try {
    const batch = await Batch.findOne({ batchId: req.params.batchId });

    if (!batch) {
      return res.status(404).json({ success: false, error: 'Batch not found' });
    }

    // Mathematically lock randomly generated float between 2.0 and 12.0
    const tempValue = parseFloat((Math.random() * 10 + 2).toFixed(1));

    batch.temperatureLogs.push({
      value: tempValue,
      timestamp: new Date()
    });

    if (tempValue > batch.temperatureThreshold) {
      batch.isSafe = false;
    }

    await batch.save();

    res.status(200).json({ success: true, data: batch });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    Verify batch data integrity dynamically comparing database objects against origin hash logic
// @route   GET /api/batch/verify/:batchId
// @access  Public
exports.verifyBatchHash = async (req, res) => {
  try {
    const batch = await Batch.findOne({ batchId: req.params.batchId });

    if (!batch) {
      return res.status(404).json({ success: false, error: 'Batch not found' });
    }

    if (!batch.blockchainHash) {
      return res.status(400).json({ success: false, message: '⚠️ No hash found on ledger (Legacy batch)' });
    }

    // Strictly recreate the exact origin string syntaxes explicitly mapped during the front-end 'type="date"' submission pipeline
    const originManufactureDate = new Date(batch.manufactureDate).toISOString().split('T')[0];
    const originExpiryDate = new Date(batch.expiryDate).toISOString().split('T')[0];

    const hashPayload = JSON.stringify({
      batchId: batch.batchId,
      medicineName: batch.medicineName,
      manufactureDate: originManufactureDate,
      expiryDate: originExpiryDate
    });

    const recreatedHash = crypto.createHash('sha256').update(hashPayload).digest('hex');

    if (recreatedHash === batch.blockchainHash) {
      return res.status(200).json({ success: true, message: 'Data Verified ✅' });
    } else {
      return res.status(400).json({ success: false, message: '⚠️ Data Tampered' });
    }

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// @desc    [DEMO ONLY] Simulate a malicious database tampering event (University Testing)
// @route   GET /api/batch/tamper/:batchId
// @access  Public
exports.tamperBatchData = async (req, res) => {
  try {
    const batch = await Batch.findOne({ batchId: req.params.batchId });
    if (!batch) {
      return res.status(404).json({ success: false, error: 'Batch not found' });
    }

    // Maliciously mutate the core ledger data physically inside MongoDB WITHOUT recalculating the original SHA-256 blockchainHash
    batch.medicineName = "COUNTERFEIT " + batch.medicineName;
    await batch.save();

    res.status(200).json({ 
      success: true, 
      message: '💀 DATABASE TAMPERED: The medicine name was illegally modified. Open the tracker UI to physically see the cryptographic hash fail.' 
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
