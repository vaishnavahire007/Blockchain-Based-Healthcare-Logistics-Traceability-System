# Frontend — React + Vite

This is the React frontend for the **Blockchain-Based Healthcare Logistics Traceability System**.

## Pages

| Route | Page | Access |
|---|---|---|
| `/` | Home / Landing | Public |
| `/login` | Login | Public |
| `/register` | Register | Public |
| `/manufacturer` | Manufacturer Dashboard | Manufacturer |
| `/distributor` | Distributor Dashboard | Distributor |
| `/pharmacy` | Pharmacy Dashboard | Pharmacy |
| `/track` | Manual Batch ID Entry | Public |
| `/track/:batchId` | Batch Detail View | Public |
| `/scan` | Camera QR Scanner | Public |

## Setup

```bash
cp .env.example .env
npm install
npm run dev
```

See the root [README](../README.md) for full project documentation.
