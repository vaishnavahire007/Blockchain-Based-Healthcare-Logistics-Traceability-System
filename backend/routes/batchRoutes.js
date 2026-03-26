const express = require('express');
const { createBatch, getBatchById, getMyBatches, updateBatchStatus } = require('../controllers/batchController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

const router = express.Router();

// Routes specific to manufacturers
router.post('/create', protect, authorize('manufacturer'), createBatch);
router.get('/my-batches', protect, authorize('manufacturer'), getMyBatches);

// Supply Chain Routes
router.post('/update-status/:batchId', protect, authorize('distributor', 'pharmacy'), updateBatchStatus);

// Track a batch dynamically without auth constraints
router.get('/:batchId', getBatchById);

module.exports = router;
