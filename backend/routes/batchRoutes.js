const express = require('express');
const { createBatch, getBatchById, getMyBatches, getAcceptedBatches, updateBatchStatus, getIncomingBatches, addTemperatureLog, verifyBatchHash, tamperBatchData } = require('../controllers/batchController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

const router = express.Router();

// Routes specific to manufacturers
router.post('/create', protect, authorize('manufacturer'), createBatch);
router.get('/my-batches', protect, authorize('manufacturer'), getMyBatches);

// Supply Chain Routes
router.post('/update-status/:batchId', protect, authorize('distributor', 'pharmacy'), updateBatchStatus);
router.get('/incoming', protect, authorize('distributor', 'pharmacy'), getIncomingBatches);
router.get('/accepted', protect, authorize('distributor', 'pharmacy'), getAcceptedBatches);

// IoT Sensor Webhook (Simulated)
router.post('/add-temperature/:batchId', addTemperatureLog);

// Cryptographic String Verification
router.get('/verify/:batchId', verifyBatchHash);

// [DEMO ONLY] Malicious Tampering Simulator
router.get('/tamper/:batchId', tamperBatchData);

// Track a batch dynamically without auth constraints
router.get('/:batchId', getBatchById);

module.exports = router;
