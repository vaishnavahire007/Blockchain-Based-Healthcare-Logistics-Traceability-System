# ⛓️ Blockchain — Smart Contracts

This directory contains the **Hardhat project** for the Healthcare Logistics Traceability System's on-chain layer.

## Contracts

| Contract | Description |
|---|---|
| [`MedicineTracking.sol`](contracts/MedicineTracking.sol) | Core contract — batch creation, ESP32 sensor data logging, transfers |
| [`RoleManager.sol`](contracts/RoleManager.sol) | Participant registry — Manufacturer, Logistics, Hospital, Regulator roles |
| [`AlertSystem.sol`](contracts/AlertSystem.sol) | Cold-chain breach alert registry with severity levels |
| [`interfaces/IMedicineTracking.sol`](contracts/interfaces/IMedicineTracking.sol) | Shared enums and interface definitions |

## Architecture

```
ESP32 Sensor Node
      │  (HTTP POST sensor data)
      ▼
  Backend (Node.js)
      │  (ethers.js call)
      ▼
MedicineTracking.logSensorReading()
      │  (emits SensorDataLogged / AlertRaised)
      ▼
  Event Listener  ──►  AlertSystem.raiseAlert()
      │
      ▼
  Frontend Dashboard  (React + ethers.js)
```

## Quick Start

```bash
# Install dependencies
cd blockchain
npm install

# Start local node
npm run node

# In another terminal — deploy contracts
npm run deploy:local

# Seed demo data (3 batches, 15 sensor readings)
npm run seed:local

# Run test suite
npm test

# Check coverage
npm run test:coverage
```

## Testnet Deployment (Sepolia)

1. Copy `.env.example` → `.env` and fill in your keys:
   ```bash
   cp .env.example .env
   ```
2. Deploy:
   ```bash
   npm run deploy:sepolia
   ```
3. Verify on Etherscan:
   ```bash
   npm run verify:sepolia <CONTRACT_ADDRESS> <CONSTRUCTOR_ARGS>
   ```

Deployed addresses are saved to `deployments/<network>/addresses.json` and the backend reads them automatically.

## Gas Report

```
MedicineTracking
  · createBatch          │ 185,432 gas
  · logSensorReading     │  72,108 gas
  · transferBatch        │  48,761 gas

RoleManager
  · registerParticipant  │  68,234 gas
  · revokeParticipant    │  28,103 gas

AlertSystem
  · raiseAlert           │  82,519 gas
  · resolveAlert         │  31,244 gas
```

## Networks

| Network | Chain ID | Status |
|---|---|---|
| Hardhat (local) | 31337 | ✅ Active |
| Sepolia testnet | 11155111 | ✅ Deployed |
| Mumbai testnet | 80001 | 🔄 Planned |
| Polygon mainnet | 137 | 🔄 Planned |
