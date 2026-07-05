const { ethers } = require("hardhat");
const fs          = require("fs");
const path        = require("path");

/**
 * Seed script — populates the local Hardhat network with realistic demo data:
 *   - Registers participants (manufacturer, logistics, hospital, regulator)
 *   - Creates 3 medicine batches
 *   - Logs 5 sensor readings per batch (simulating ESP32 data pushes)
 *   - Triggers one cold-chain breach alert
 *
 * Run: npx hardhat run scripts/seed.js --network localhost
 */
async function main() {
  const signers = await ethers.getSigners();
  const [deployer, mfgWallet, logWallet, hospitalWallet] = signers;

  const addresses = JSON.parse(
    fs.readFileSync(
      path.join(__dirname, "..", "deployments", "localhost", "addresses.json"),
      "utf8"
    )
  );

  const MedicineTracking = await ethers.getContractAt(
    "MedicineTracking",
    addresses.MedicineTracking
  );

  const MANUFACTURER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("MANUFACTURER_ROLE"));
  const LOGISTICS_ROLE    = ethers.keccak256(ethers.toUtf8Bytes("LOGISTICS_ROLE"));

  console.log("🌱 Seeding demo data...\n");

  // Grant roles
  await MedicineTracking.grantRole(MANUFACTURER_ROLE, mfgWallet.address);
  await MedicineTracking.grantRole(LOGISTICS_ROLE,    logWallet.address);
  console.log("✅ Roles granted");

  // ── Batch 1: Paracetamol ──────────────────────────────────────────────────
  const qr1 = ethers.keccak256(ethers.toUtf8Bytes("BATCH_PARA_001"));
  await MedicineTracking.connect(mfgWallet).createBatch(
    "Paracetamol 500mg", "PharmaGen Ltd", 10_000, 1_800_000_000, qr1
  );
  console.log("💊 Batch 1 (Paracetamol) created");

  // Sensor readings – all within cold-chain (temp < 80 → 8.0 °C)
  const readings1 = [
    [40, 58, 18_520_000, 73_856_000],   // Pune warehouse
    [42, 60, 19_080_000, 72_880_000],   // Mumbai hub
    [38, 62, 19_200_000, 72_840_000],   // Mumbai port
    [45, 55, 18_600_000, 73_900_000],   // In transit
    [47, 57, 18_520_000, 73_856_000],   // Hospital arrival
  ];
  for (const [t, h, lat, lng] of readings1) {
    await MedicineTracking.connect(logWallet).logSensorReading(1, t, h, lat, lng);
  }
  console.log("📡 Batch 1 sensor readings logged");

  // Transfer: Manufacturer → Logistics (InTransit = 1)
  await MedicineTracking.connect(mfgWallet).transferBatch(1, logWallet.address, 1);
  // Transfer: Logistics → Hospital  (Delivered = 4)
  await MedicineTracking.connect(logWallet).transferBatch(1, hospitalWallet.address, 4);
  console.log("🔄 Batch 1 transferred to hospital\n");

  // ── Batch 2: COVID Vaccine (with breach!) ─────────────────────────────────
  const qr2 = ethers.keccak256(ethers.toUtf8Bytes("BATCH_VACC_002"));
  await MedicineTracking.connect(mfgWallet).createBatch(
    "CoviShield Vaccine", "BioNova India", 2_000, 1_780_000_000, qr2
  );
  console.log("💊 Batch 2 (CoviShield) created");

  // Last reading triggers a breach (temp = 120 → 12.0 °C)
  const readings2 = [
    [30, 70, 28_700_000, 77_100_000],   // Delhi cold store
    [32, 68, 28_600_000, 77_200_000],
    [35, 65, 28_500_000, 77_300_000],
    [78, 60, 28_400_000, 77_400_000],   // Near threshold
    [120, 55, 28_300_000, 77_500_000],  // ⚠️ BREACH
  ];
  for (const [t, h, lat, lng] of readings2) {
    await MedicineTracking.connect(logWallet).logSensorReading(2, t, h, lat, lng);
  }
  console.log("📡 Batch 2 sensor readings logged (breach triggered!)\n");

  // ── Batch 3: Insulin ──────────────────────────────────────────────────────
  const qr3 = ethers.keccak256(ethers.toUtf8Bytes("BATCH_INS_003"));
  await MedicineTracking.connect(mfgWallet).createBatch(
    "Insulin Glargine 100U", "DiaCare Pharma", 5_000, 1_820_000_000, qr3
  );
  console.log("💊 Batch 3 (Insulin) created");

  const readings3 = [
    [20, 50, 12_972_000, 77_594_000],   // Bangalore warehouse
    [22, 52, 12_980_000, 77_600_000],
    [21, 51, 13_000_000, 77_610_000],
    [23, 53, 13_020_000, 77_620_000],
    [24, 55, 13_040_000, 77_630_000],
  ];
  for (const [t, h, lat, lng] of readings3) {
    await MedicineTracking.connect(logWallet).logSensorReading(3, t, h, lat, lng);
  }
  console.log("📡 Batch 3 sensor readings logged");

  console.log("\n✨ Seeding complete — 3 batches, 15 sensor readings");
}

main().catch(console.error);
