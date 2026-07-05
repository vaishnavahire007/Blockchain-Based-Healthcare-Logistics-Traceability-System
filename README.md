<h1 align="center">
  🔗 Blockchain-Based Healthcare Logistics Traceability System
</h1>

<p align="center">
  A full-stack, IoT-integrated medicine supply chain traceability platform that combines <strong>blockchain cryptography</strong>, <strong>ESP32 real-time sensor nodes</strong>, and a <strong>role-based React dashboard</strong> to ensure medicine authenticity from factory to patient.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Solidity-0.8.20-363636?logo=solidity&logoColor=white" />
  <img src="https://img.shields.io/badge/Hardhat-2.22-yellow?logo=ethereum" />
  <img src="https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black" />
  <img src="https://img.shields.io/badge/Node.js-Express-339933?logo=node.js&logoColor=white" />
  <img src="https://img.shields.io/badge/MongoDB-Atlas-47A248?logo=mongodb&logoColor=white" />
  <img src="https://img.shields.io/badge/ESP32-IoT%20Node-E7352C?logo=espressif&logoColor=white" />
  <img src="https://img.shields.io/badge/Deployed-Render%20%2B%20Vercel-000?logo=vercel" />
</p>

---

## 📋 Table of Contents

- [Overview](#overview)
- [System Architecture](#system-architecture)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Smart Contracts](#smart-contracts)
- [ESP32 IoT Sensor Node](#esp32-iot-sensor-node)
- [Role-Based Access](#role-based-access)
- [API Reference](#api-reference)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Deployment](#deployment)

---

## Overview

Counterfeit and improperly stored medicines are a critical problem in healthcare supply chains. This system solves it by:

1. **Generating a SHA-256 blockchain hash** for every medicine batch at the point of manufacture.
2. **Tracking the batch** through every stage — Manufacturer → Distributor → Pharmacy — with a tamper-evident journey log.
3. **Logging real-time temperature** from an ESP32 + DS18B20 sensor node via HTTPS to detect cold-chain breaches.
4. **Serving a public QR scan page** (no login needed) so any patient or pharmacist can instantly verify a medicine's authenticity and journey history.

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND (React + Vite)              │
│  Manufacturer  │  Distributor  │  Pharmacy  │  Public QR   │
│   Dashboard    │   Dashboard   │  Dashboard │  Scan Page   │
└───────────────────────────┬─────────────────────────────────┘
                            │  REST API (JWT Auth)
┌───────────────────────────▼─────────────────────────────────┐
│                   BACKEND (Node.js + Express)                │
│                                                              │
│  Auth Routes    │  Batch Routes  │  /track/:batchId (HTML)  │
│  JWT Middleware │  Role Middleware│  Temperature Webhook     │
└───────┬──────────────────┬──────────────────────────────────┘
        │                  │
   ┌────▼────┐        ┌────▼─────────────────────────────┐
   │ MongoDB │        │  Blockchain Layer                 │
   │  Atlas  │        │  SHA-256 Hash per Batch           │
   │  Users  │        │  Tamper Detection on /verify      │
   │  Batches│        │  Smart Contracts (Hardhat)        │
   └─────────┘        └──────────────────────────────────┘
                                   ▲
                    ┌──────────────┘
               ┌────┴─────────────┐
               │  ESP32 IoT Node  │
               │  DS18B20 Sensor  │
               │  Posts temp/10s  │
               └──────────────────┘
```

---

## Features

### 🏭 Manufacturer
- Register & log in with JWT authentication
- Create medicine batches with name, manufacture/expiry dates, temperature threshold
- **Blockchain hash** (SHA-256) auto-generated and stored for every batch
- Generate and download **QR codes** that encode the batch tracking URL
- View all created batches with live status

### 🚚 Distributor
- View incoming batches assigned to them
- Accept/reject batches and update status to `in-transit`
- Full journey timeline visible per batch

### 💊 Pharmacy
- Receive and accept batches from distributors
- Mark batches as `delivered`
- View temperature history and cold-chain safety status

### 📱 Public QR Scan (No Login Required)
- Any phone camera scans the QR → opens `/track/<batchId>`
- Shows medicine name, status, manufacturer, dates, journey timeline
- **🛡️ Blockchain Verified** or **⚠️ Tampered** badge
- **🌡️ Temperature chart** with Chart.js showing all sensor readings
- Works on any device — pure server-rendered HTML, no React bundle needed

### 🌡️ ESP32 IoT Sensor Integration
- ESP32 + DS18B20 reads temperature every **10 seconds**
- Auto-scans all GPIO pins to detect which pin the sensor is on
- Posts readings over **HTTPS** to the live backend
- Backend sets `isSafe = false` if temperature exceeds threshold
- Backend includes a **software simulator** as fallback when hardware is absent

### 🔒 Blockchain Tamper Detection
- Each batch stores a SHA-256 hash of `{batchId, medicineName, manufactureDate, expiryDate}`
- `/api/batch/verify/:batchId` re-computes the hash and compares — any data change is caught
- Demo tampering endpoint available: `/api/batch/tamper/:batchId`

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18, Vite, React Router v6, Axios, Chart.js |
| **Backend** | Node.js, Express.js, Mongoose ODM |
| **Database** | MongoDB Atlas |
| **Auth** | JWT (JSON Web Tokens) + bcryptjs |
| **Blockchain** | SHA-256 cryptographic hashing (Node.js `crypto`), Solidity smart contracts, Hardhat |
| **IoT Hardware** | ESP32 Dev Board, DS18B20 Temperature Sensor, OneWire + DallasTemperature libraries |
| **QR Codes** | `qrcode` npm package — generates base64 PNG embedded in response |
| **Deployment** | Render (backend + frontend build), Vercel (frontend) |

---

## Project Structure

```
blockchain-healthcare-logistics/
│
├── backend/                        # Node.js + Express API
│   ├── controllers/
│   │   ├── authController.js       # Register, Login, JWT issue
│   │   └── batchController.js      # Batch CRUD, QR, temp logs, verify
│   ├── middleware/
│   │   ├── authMiddleware.js       # JWT verification
│   │   └── roleMiddleware.js       # Role-based access guard
│   ├── models/
│   │   ├── User.js                 # User schema (name, email, role, password)
│   │   └── Batch.js                # Batch schema (hash, QR, journey, temp logs)
│   ├── routes/
│   │   ├── authRoutes.js           # POST /api/auth/register|login
│   │   └── batchRoutes.js          # Batch CRUD + sensor webhook
│   ├── utils/
│   │   └── simulator.js            # Software temperature simulator (fallback)
│   ├── server.js                   # Express app, static frontend, /track route
│   ├── .env.example                # Environment variable template
│   └── package.json
│
├── frontend/                       # React + Vite SPA
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Home.jsx                    # Landing page
│   │   │   ├── Login.jsx / Register.jsx    # Auth pages
│   │   │   ├── ManufacturerDashboard.jsx   # Batch creation + QR
│   │   │   ├── DistributorDashboard.jsx    # Accept / transit
│   │   │   ├── PharmacyDashboard.jsx       # Receive + deliver
│   │   │   ├── TrackBatch.jsx              # Detailed batch view
│   │   │   ├── TrackInput.jsx              # Manual batch ID entry
│   │   │   └── ScanQR.jsx                  # Camera QR scanner
│   │   ├── components/
│   │   │   ├── ProtectedRoute.jsx          # Auth guard wrapper
│   │   │   ├── QRModal.jsx                 # QR code display modal
│   │   │   └── BatchLogModal.jsx           # Journey log modal
│   │   ├── utils/
│   │   │   ├── apiBase.js                  # Axios base URL config
│   │   │   └── qrUtils.js                  # QR scan helpers
│   │   ├── App.jsx                         # Router + route definitions
│   │   └── index.css                       # Global styles
│   ├── .env.example
│   └── package.json
│
├── blockchain/                     # Hardhat smart contract project
│   ├── contracts/
│   │   ├── MedicineTracking.sol    # Core: batch creation + sensor logging
│   │   ├── RoleManager.sol         # On-chain participant registry
│   │   ├── AlertSystem.sol         # Cold-chain breach alert registry
│   │   └── interfaces/
│   │       └── IMedicineTracking.sol
│   ├── scripts/
│   │   ├── deploy.js               # Deploys all contracts, saves addresses.json
│   │   └── seed.js                 # Seeds 3 batches + 15 sensor readings
│   ├── test/
│   │   ├── MedicineTracking.test.js
│   │   └── RoleManager.test.js
│   ├── deployments/
│   │   └── sepolia/addresses.json  # Deployed contract addresses (Sepolia testnet)
│   ├── hardhat.config.js           # Local + Sepolia + Mumbai + Polygon
│   ├── .env.example
│   └── package.json
│
├── esp32-sensor/
│   └── sensor_node.ino             # Arduino sketch — ESP32 + DS18B20
│
├── .gitignore                      # Blocks all .env files globally
├── package.json                    # Root scripts (concurrently start)
└── README.md
```

---

## Smart Contracts

Three Solidity contracts deployed on the Hardhat local network and Sepolia testnet:

| Contract | Address (Sepolia) | Description |
|---|---|---|
| `MedicineTracking` | `0x617F2E2fD72FD9D5503197092aC168c91465E7f2` | Batch creation, ESP32 sensor logging, transfers |
| `RoleManager` | `0xAb8483F64d9C6d1EcF9b849Ae677dD3315835cb2` | On-chain participant registry with 4 roles |
| `AlertSystem` | `0x78731D3Ca6b7E34aC0F824c42a7cC18A495cabaB` | Cold-chain breach alerts with severity levels |

### Key Contract Functions

```solidity
// Create a new medicine batch linked to a QR hash
function createBatch(medicineName, manufacturer, quantity, expiryDate, qrHash)

// Log a sensor reading from an ESP32 node wallet (auto-alerts if temp > 8°C)
function logSensorReading(batchId, temperature, humidity, latitude, longitude)

// Transfer batch between supply chain actors
function transferBatch(batchId, to, newStatus)
```

### Run Contracts Locally

```bash
cd blockchain
npm install
npx hardhat node                          # Start local blockchain
npx hardhat run scripts/deploy.js --network localhost
npx hardhat run scripts/seed.js --network localhost
npx hardhat test
```

---

## ESP32 IoT Sensor Node

**Hardware:** ESP32 Dev Board + DS18B20 Temperature Sensor

```
DS18B20 Pin     →  ESP32 Pin
────────────────────────────
VCC (Red)       →  3.3V
DATA (Yellow)   →  GPIO 4 (auto-detected)
GND (Black)     →  GND
```

The sketch (`esp32-sensor/sensor_node.ino`) **auto-scans all GPIO pins** to find the sensor automatically — no manual pin configuration needed.

**Flow:**
1. ESP32 connects to WiFi
2. Reads temperature from DS18B20 every 10 seconds
3. POSTs `{ "temperature": 23.5 }` to `POST /api/batch/add-temperature/:batchId` over HTTPS
4. Backend stores reading and sets `isSafe = false` if threshold exceeded

**Libraries required** (Arduino IDE → Tools → Manage Libraries):
- `OneWire` by Paul Stoffregen
- `DallasTemperature` by Miles Burton

---

## Role-Based Access

| Role | Capabilities |
|---|---|
| `manufacturer` | Create batches, generate QR codes, view own batches |
| `distributor` | View incoming batches, accept/transit batches |
| `pharmacy` | Receive batches, mark as delivered |
| `user` | Public-facing, read-only access |
| _(public)_ | Scan QR → view batch details, no login required |

---

## API Reference

### Auth

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/auth/register` | Public | Register a new user |
| `POST` | `/api/auth/login` | Public | Login and receive JWT |

### Batches

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/batch/create` | Manufacturer | Create a new medicine batch |
| `GET` | `/api/batch/my-batches` | Manufacturer | Get own batches |
| `GET` | `/api/batch/incoming` | Distributor / Pharmacy | Get incoming batches |
| `GET` | `/api/batch/accepted` | Distributor / Pharmacy | Get accepted batches |
| `POST` | `/api/batch/update-status/:batchId` | Distributor / Pharmacy | Update batch status |
| `POST` | `/api/batch/add-temperature/:batchId` | Public (ESP32 webhook) | Log a temperature reading |
| `GET` | `/api/batch/verify/:batchId` | Public | Verify blockchain hash integrity |
| `GET` | `/api/batch/:batchId` | Public | Get batch details |

### Public QR Scan

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/track/:batchId` | Server-rendered HTML tracking page with Chart.js temperature graph |

---

## Getting Started

### Prerequisites

- Node.js ≥ 18
- MongoDB Atlas account (or local MongoDB)
- Git

### 1. Clone the repository

```bash
git clone https://github.com/vaishnavahire007/Blockchain-Based-Healthcare-Logistics-Traceability-System-Final-Year.git
cd blockchain-healthcare-logistics
```

### 2. Setup Backend

```bash
cd backend
cp .env.example .env      # Fill in your MongoDB URI and JWT secret
npm install
node server.js
```

### 3. Setup Frontend

```bash
cd frontend
cp .env.example .env      # Set VITE_API_URL=http://localhost:5000
npm install
npm run dev
```

### 4. Run Both Together (from root)

```bash
npm install
npm start                 # Runs backend + frontend concurrently
```

### 5. Setup Blockchain (optional)

```bash
cd blockchain
npm install
npx hardhat node
# In another terminal:
npm run deploy:local
npm run seed:local
npm test
```

---

## Environment Variables

### `backend/.env`

```env
PORT=5000
MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/<dbname>
JWT_SECRET=your_long_random_secret
BACKEND_URL=http://localhost:5000
```

### `frontend/.env`

```env
VITE_API_URL=http://localhost:5000
```

### `blockchain/.env`

```env
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY
PRIVATE_KEY=0xYOUR_DEPLOYER_PRIVATE_KEY
ETHERSCAN_API_KEY=YOUR_ETHERSCAN_KEY
```

> **Note:** All `.env` files are blocked by `.gitignore`. Use the `.env.example` files as templates.

---

## Deployment

### Backend + Frontend → Render

1. Push to GitHub
2. Create a new **Web Service** on [Render](https://render.com)
3. Set **Build Command:** `npm run build`
4. Set **Start Command:** `npm run render-start`
5. Add environment variables from `backend/.env.example`

### Frontend → Vercel

1. Import the repo on [Vercel](https://vercel.com)
2. Set **Root Directory:** `frontend`
3. Add `VITE_API_URL` = your Render backend URL in Environment Variables

### Live Demo

| Service | URL |
|---|---|
| Backend (Render) | https://blockchain-based-healthcare-logistics.onrender.com/register |

---

## License

This project was developed as a **Final Year Project** for academic purposes.

---

<p align="center">
  Built with ❤️ using Blockchain · ESP32 · React · Node.js · MongoDB
</p>
