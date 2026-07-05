const { expect } = require("chai");
const { ethers }  = require("hardhat");

describe("MedicineTracking", function () {

  let contract, owner, manufacturer, logistics, hospital;

  const MANUFACTURER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("MANUFACTURER_ROLE"));
  const LOGISTICS_ROLE    = ethers.keccak256(ethers.toUtf8Bytes("LOGISTICS_ROLE"));

  beforeEach(async function () {
    [owner, manufacturer, logistics, hospital] = await ethers.getSigners();

    const Factory = await ethers.getContractFactory("MedicineTracking");
    contract = await Factory.deploy();
    await contract.waitForDeployment();

    // Grant roles
    await contract.grantRole(MANUFACTURER_ROLE, manufacturer.address);
    await contract.grantRole(LOGISTICS_ROLE,    logistics.address);
  });

  // ─── Batch creation ────────────────────────────────────────────────────────

  describe("createBatch()", function () {
    it("should create a batch and emit BatchCreated", async function () {
      const expiry = Math.floor(Date.now() / 1000) + 365 * 24 * 3600;

      await expect(
        contract.connect(manufacturer).createBatch(
          "Paracetamol 500mg",
          "PharmaGen Ltd",
          10_000,
          expiry,
          ethers.keccak256(ethers.toUtf8Bytes("QR_BATCH_001"))
        )
      )
        .to.emit(contract, "BatchCreated")
        .withArgs(1, "Paracetamol 500mg", manufacturer.address, 10_000);
    });

    it("should reject creation by non-manufacturer", async function () {
      await expect(
        contract.connect(hospital).createBatch(
          "Ibuprofen 400mg",
          "Generic Inc",
          5_000,
          9999999999,
          "QR_FAKE"
        )
      ).to.be.reverted;
    });

    it("should increment batch counter on each creation", async function () {
      const expiry = 9999999999;
      const qr1 = ethers.keccak256(ethers.toUtf8Bytes("QR_001"));
      const qr2 = ethers.keccak256(ethers.toUtf8Bytes("QR_002"));

      await contract.connect(manufacturer).createBatch("Med A", "Mfg A", 100, expiry, qr1);
      await contract.connect(manufacturer).createBatch("Med B", "Mfg B", 200, expiry, qr2);

      expect(await contract.totalBatches()).to.equal(2);
    });
  });

  // ─── Sensor data ───────────────────────────────────────────────────────────

  describe("logSensorReading()", function () {
    beforeEach(async function () {
      const expiry = 9999999999;
      const qr = ethers.keccak256(ethers.toUtf8Bytes("QR_SENSOR_TEST"));
      await contract.connect(manufacturer).createBatch("Vaccine X", "BioLab", 500, expiry, qr);
    });

    it("should log a normal reading without alerts", async function () {
      // temperature = 40 (4.0 °C – within cold chain)
      await expect(
        contract.connect(logistics).logSensorReading(1, 40, 60, 18520000, 73856000)
      ).to.emit(contract, "SensorDataLogged");
    });

    it("should emit AlertRaised on temperature breach", async function () {
      // temperature = 120 (12.0 °C – above 8 °C threshold)
      await expect(
        contract.connect(logistics).logSensorReading(1, 120, 65, 18520000, 73856000)
      )
        .to.emit(contract, "AlertRaised")
        .withArgs(1, "TEMP_BREACH", "Temperature exceeded cold-chain threshold of 8 C");
    });

    it("should revert for unknown batch", async function () {
      await expect(
        contract.connect(logistics).logSensorReading(999, 40, 60, 0, 0)
      ).to.be.revertedWith("Batch not found");
    });
  });

  // ─── Transfer ──────────────────────────────────────────────────────────────

  describe("transferBatch()", function () {
    it("should transfer batch and update status", async function () {
      const expiry = 9999999999;
      const qr = ethers.keccak256(ethers.toUtf8Bytes("QR_TRANSFER_TEST"));
      await contract.connect(manufacturer).createBatch("Amoxicillin", "PharmaCo", 200, expiry, qr);

      // BatchStatus.InTransit = 1
      await expect(
        contract.connect(manufacturer).transferBatch(1, logistics.address, 1)
      ).to.emit(contract, "BatchTransferred");

      const [,,,,,, status, holder] = await contract.getBatch(1);
      // holder should now be logistics
      expect(holder).to.equal(logistics.address);
    });
  });

  // ─── QR lookup ─────────────────────────────────────────────────────────────

  describe("getBatchByQR()", function () {
    it("should resolve QR hash to batch ID", async function () {
      const qrHash = ethers.keccak256(ethers.toUtf8Bytes("QR_LOOKUP_001"));
      await contract.connect(manufacturer).createBatch(
        "Metformin", "DiabCo", 300, 9999999999, qrHash
      );
      expect(await contract.getBatchByQR(qrHash)).to.equal(1);
    });
  });
});
