// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "./interfaces/IMedicineTracking.sol";

/**
 * @title MedicineTracking
 * @dev Blockchain-based medicine supply chain traceability smart contract.
 *      Records sensor data (temperature, humidity, GPS) from ESP32 nodes
 *      at each logistics checkpoint and stores them immutably on-chain.
 */
contract MedicineTracking is AccessControl, IMedicineTracking {
    using Counters for Counters.Counter;

    // ─── Roles ────────────────────────────────────────────────────────────────
    bytes32 public constant MANUFACTURER_ROLE = keccak256("MANUFACTURER_ROLE");
    bytes32 public constant LOGISTICS_ROLE    = keccak256("LOGISTICS_ROLE");
    bytes32 public constant REGULATOR_ROLE    = keccak256("REGULATOR_ROLE");
    bytes32 public constant HOSPITAL_ROLE     = keccak256("HOSPITAL_ROLE");

    // ─── State ────────────────────────────────────────────────────────────────
    Counters.Counter private _batchIdCounter;

    struct SensorReading {
        int16  temperature;   // °C × 10  (e.g. 235 = 23.5 °C)
        uint8  humidity;      // %
        int32  latitude;      // decimal-degrees × 1 000 000
        int32  longitude;     // decimal-degrees × 1 000 000
        uint40 timestamp;
        address reporter;
    }

    struct MedicineBatch {
        uint256        batchId;
        string         medicineName;
        string         manufacturer;
        uint256        quantity;
        uint40         manufacturedAt;
        uint40         expiryDate;
        BatchStatus    status;
        address        currentHolder;
        SensorReading[] readings;
    }

    mapping(uint256 => MedicineBatch) private _batches;
    mapping(string  => uint256)       private _qrToBatch;   // QR hash → batchId

    // ─── Events ───────────────────────────────────────────────────────────────
    event BatchCreated(
        uint256 indexed batchId,
        string  medicineName,
        address indexed manufacturer,
        uint256 quantity
    );
    event SensorDataLogged(
        uint256 indexed batchId,
        int16   temperature,
        uint8   humidity,
        int32   latitude,
        int32   longitude,
        uint40  timestamp
    );
    event BatchTransferred(
        uint256 indexed batchId,
        address indexed from,
        address indexed to,
        BatchStatus newStatus
    );
    event AlertRaised(
        uint256 indexed batchId,
        string  alertType,
        string  description
    );

    // ─── Constructor ──────────────────────────────────────────────────────────
    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MANUFACTURER_ROLE,  msg.sender);
    }

    // ─── Manufacturer functions ───────────────────────────────────────────────

    /**
     * @notice Create a new medicine batch and bind it to a QR code.
     */
    function createBatch(
        string calldata medicineName,
        string calldata manufacturerName,
        uint256         quantity,
        uint40          expiryDate,
        string calldata qrHash
    ) external onlyRole(MANUFACTURER_ROLE) returns (uint256 batchId) {
        _batchIdCounter.increment();
        batchId = _batchIdCounter.current();

        MedicineBatch storage b = _batches[batchId];
        b.batchId        = batchId;
        b.medicineName   = medicineName;
        b.manufacturer   = manufacturerName;
        b.quantity       = quantity;
        b.manufacturedAt = uint40(block.timestamp);
        b.expiryDate     = expiryDate;
        b.status         = BatchStatus.Manufactured;
        b.currentHolder  = msg.sender;

        _qrToBatch[qrHash] = batchId;

        emit BatchCreated(batchId, medicineName, msg.sender, quantity);
    }

    // ─── ESP32 / Sensor functions ─────────────────────────────────────────────

    /**
     * @notice Log a sensor reading for a batch (called by an IoT node wallet).
     */
    function logSensorReading(
        uint256 batchId,
        int16   temperature,
        uint8   humidity,
        int32   latitude,
        int32   longitude
    ) external onlyRole(LOGISTICS_ROLE) {
        require(_batches[batchId].batchId != 0, "Batch not found");

        SensorReading memory r = SensorReading({
            temperature: temperature,
            humidity:    humidity,
            latitude:    latitude,
            longitude:   longitude,
            timestamp:   uint40(block.timestamp),
            reporter:    msg.sender
        });

        _batches[batchId].readings.push(r);

        // Auto-alert on cold-chain breach (threshold: 8 °C = 80 in ×10 repr)
        if (temperature > 80) {
            emit AlertRaised(batchId, "TEMP_BREACH",
                "Temperature exceeded cold-chain threshold of 8 C");
        }

        emit SensorDataLogged(batchId, temperature, humidity, latitude, longitude, uint40(block.timestamp));
    }

    // ─── Transfer / status functions ──────────────────────────────────────────

    function transferBatch(
        uint256     batchId,
        address     to,
        BatchStatus newStatus
    ) external {
        MedicineBatch storage b = _batches[batchId];
        require(b.currentHolder == msg.sender, "Not current holder");

        address from = b.currentHolder;
        b.currentHolder = to;
        b.status        = newStatus;

        emit BatchTransferred(batchId, from, to, newStatus);
    }

    // ─── View functions ───────────────────────────────────────────────────────

    function getBatch(uint256 batchId)
        external
        view
        returns (
            string  memory medicineName,
            string  memory manufacturer,
            uint256        quantity,
            uint40         manufacturedAt,
            uint40         expiryDate,
            BatchStatus    status,
            address        currentHolder,
            uint256        readingCount
        )
    {
        MedicineBatch storage b = _batches[batchId];
        return (
            b.medicineName,
            b.manufacturer,
            b.quantity,
            b.manufacturedAt,
            b.expiryDate,
            b.status,
            b.currentHolder,
            b.readings.length
        );
    }

    function getSensorReading(uint256 batchId, uint256 index)
        external
        view
        returns (SensorReading memory)
    {
        return _batches[batchId].readings[index];
    }

    function getBatchByQR(string calldata qrHash)
        external
        view
        returns (uint256)
    {
        return _qrToBatch[qrHash];
    }

    function totalBatches() external view returns (uint256) {
        return _batchIdCounter.current();
    }
}
