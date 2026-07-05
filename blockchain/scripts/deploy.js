const { ethers, network } = require("hardhat");
const fs   = require("fs");
const path = require("path");

/**
 * Full deployment script for the Healthcare Logistics Blockchain system.
 *
 * Deployment order:
 *   1. RoleManager       – access control registry
 *   2. AlertSystem       – cold-chain breach alerts
 *   3. MedicineTracking  – core batch + sensor tracking
 *
 * After deployment, addresses are written to:
 *   deployments/<network>/addresses.json
 * so the backend can read them without hard-coding.
 */
async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("\n🚀 Deploying Healthcare Logistics Contracts");
  console.log("   Network  :", network.name);
  console.log("   Deployer :", deployer.address);
  console.log("   Balance  :", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "ETH\n");

  // ── 1. RoleManager ──────────────────────────────────────────────────────────
  console.log("📋 Deploying RoleManager...");
  const RoleManager = await ethers.getContractFactory("RoleManager");
  const roleManager = await RoleManager.deploy();
  await roleManager.waitForDeployment();
  const rmAddr = await roleManager.getAddress();
  console.log("   ✅ RoleManager deployed at:", rmAddr);

  // ── 2. AlertSystem ──────────────────────────────────────────────────────────
  console.log("🔔 Deploying AlertSystem...");
  const AlertSystem = await ethers.getContractFactory("AlertSystem");
  const alertSystem = await AlertSystem.deploy();
  await alertSystem.waitForDeployment();
  const asAddr = await alertSystem.getAddress();
  console.log("   ✅ AlertSystem deployed at:", asAddr);

  // ── 3. MedicineTracking ─────────────────────────────────────────────────────
  console.log("💊 Deploying MedicineTracking...");
  const MedicineTracking = await ethers.getContractFactory("MedicineTracking");
  const medicineTracking = await MedicineTracking.deploy();
  await medicineTracking.waitForDeployment();
  const mtAddr = await medicineTracking.getAddress();
  console.log("   ✅ MedicineTracking deployed at:", mtAddr);

  // ── Post-deployment role setup ──────────────────────────────────────────────
  console.log("\n⚙️  Setting up initial roles...");

  const LOGISTICS_ROLE = ethers.keccak256(ethers.toUtf8Bytes("LOGISTICS_ROLE"));
  const SENSOR_ROLE    = ethers.keccak256(ethers.toUtf8Bytes("SENSOR_ROLE"));

  // Grant the deployer LOGISTICS_ROLE on MedicineTracking (demo / dev convenience)
  await medicineTracking.grantRole(LOGISTICS_ROLE, deployer.address);
  console.log("   ✅ Granted LOGISTICS_ROLE to deployer (dev convenience)");

  // Grant SENSOR_ROLE to AlertSystem so MedicineTracking can raise alerts through it
  await alertSystem.grantRole(SENSOR_ROLE, deployer.address);
  console.log("   ✅ Granted SENSOR_ROLE to deployer (dev convenience)");

  // ── Save addresses ──────────────────────────────────────────────────────────
  const outputDir = path.join(__dirname, "..", "deployments", network.name);
  fs.mkdirSync(outputDir, { recursive: true });

  const addresses = {
    network:          network.name,
    chainId:          (await ethers.provider.getNetwork()).chainId.toString(),
    deployedAt:       new Date().toISOString(),
    deployer:         deployer.address,
    RoleManager:      rmAddr,
    AlertSystem:      asAddr,
    MedicineTracking: mtAddr,
  };

  const outPath = path.join(outputDir, "addresses.json");
  fs.writeFileSync(outPath, JSON.stringify(addresses, null, 2));
  console.log("\n💾 Addresses saved to:", outPath);

  // ── Copy ABI to backend ─────────────────────────────────────────────────────
  const abiDir = path.join(__dirname, "..", "..", "backend", "blockchain", "abis");
  fs.mkdirSync(abiDir, { recursive: true });

  const artifacts = ["MedicineTracking", "RoleManager", "AlertSystem"];
  for (const name of artifacts) {
    const artifactPath = path.join(
      __dirname, "..", "artifacts", "contracts", `${name}.sol`, `${name}.json`
    );
    if (fs.existsSync(artifactPath)) {
      const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
      fs.writeFileSync(
        path.join(abiDir, `${name}.json`),
        JSON.stringify({ abi: artifact.abi }, null, 2)
      );
      console.log(`   📄 ABI exported: ${name}.json`);
    }
  }

  console.log("\n✨ Deployment complete!\n");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
