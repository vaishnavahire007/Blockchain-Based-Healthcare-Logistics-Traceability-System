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
    const trackerUrl = `http://localhost:5173/track/${batchId}`;
    const qrCodeBase64 = await QRCode.toDataURL(trackerUrl);

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

    // Enforce logic: Handover dictates specific status mapping.
    batch.currentOwner = role;
    batch.status = role === 'distributor' ? 'in-transit' : 'delivered';

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
