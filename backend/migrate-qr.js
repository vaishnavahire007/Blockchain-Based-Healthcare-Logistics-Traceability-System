/**
 * Migration: Regenerate QR codes for all existing batches
 * using the correct production URL.
 *
 * Usage:
 *   node migrate-qr.js https://your-app-name.onrender.com
 */

require('dotenv').config();
const mongoose = require('mongoose');
const QRCode   = require('qrcode');
const Batch    = require('./models/Batch');

const RENDER_URL = process.argv[2];

if (!RENDER_URL || !RENDER_URL.startsWith('http')) {
  console.error('❌  Usage: node migrate-qr.js https://your-app-name.onrender.com');
  process.exit(1);
}

const run = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅  Connected to MongoDB Atlas');

  const batches = await Batch.find({});
  console.log(`🔍  Found ${batches.length} batches — regenerating QR codes...\n`);

  for (const batch of batches) {
    const trackerUrl   = `${RENDER_URL}/track/${batch.batchId}`;
    const newQrBase64  = await QRCode.toDataURL(trackerUrl, { width: 300, margin: 2 });

    batch.qrCode = newQrBase64;
    await batch.save();

    console.log(`  ✔  ${batch.medicineName.padEnd(30)} → ${trackerUrl}`);
  }

  console.log('\n🎉  All QR codes updated successfully!');
  process.exit(0);
};

run().catch(err => {
  console.error('❌  Error:', err.message);
  process.exit(1);
});
