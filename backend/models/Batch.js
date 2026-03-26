const mongoose = require('mongoose');
const crypto = require('crypto');

const batchSchema = new mongoose.Schema({
  batchId: {
    type: String,
    required: true,
    unique: true,
    default: () => crypto.randomUUID()
  },
  medicineName: {
    type: String,
    required: [true, 'Please provide medicine name']
  },
  manufacturerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  manufactureDate: {
    type: Date,
    required: true
  },
  expiryDate: {
    type: Date,
    required: true
  },
  temperatureThreshold: {
    type: Number,
    required: [true, 'Please provide the critical temperature threshold (°C)']
  },
  currentOwner: {
    type: String,
    enum: ['manufacturer', 'distributor', 'pharmacy'],
    default: 'manufacturer'
  },
  status: {
    type: String,
    enum: ['created', 'in-transit', 'delivered'],
    default: 'created'
  },
  qrCode: {
    type: String
  },
  journeyLogs: [{
    role: { type: String, required: true },
    action: { type: String, required: true },
    timestamp: { type: Date, default: Date.now }
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model('Batch', batchSchema);
