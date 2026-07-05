// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title AlertSystem
 * @dev On-chain alert registry for cold-chain breaches detected by ESP32 sensors.
 *      Alerts are emitted as events AND stored in a mapping so front-ends
 *      can query historical alerts without relying on log indexing alone.
 */
contract AlertSystem is AccessControl, Pausable {

    bytes32 public constant SENSOR_ROLE = keccak256("SENSOR_ROLE");

    enum AlertSeverity { Low, Medium, High, Critical }

    struct Alert {
        uint256       alertId;
        uint256       batchId;
        AlertSeverity severity;
        string        alertType;   // "TEMP_BREACH" | "HUMIDITY_BREACH" | "LOCATION_ANOMALY"
        string        description;
        uint40        raisedAt;
        address       raisedBy;
        bool          resolved;
    }

    uint256 private _alertCounter;
    mapping(uint256 => Alert)   public alerts;
    mapping(uint256 => uint256[]) public batchAlerts; // batchId → alertIds

    event AlertCreated(
        uint256 indexed alertId,
        uint256 indexed batchId,
        AlertSeverity   severity,
        string          alertType
    );
    event AlertResolved(uint256 indexed alertId, address resolvedBy);

    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    function raiseAlert(
        uint256       batchId,
        AlertSeverity severity,
        string calldata alertType,
        string calldata description
    ) external onlyRole(SENSOR_ROLE) whenNotPaused returns (uint256 alertId) {
        _alertCounter++;
        alertId = _alertCounter;

        alerts[alertId] = Alert({
            alertId:     alertId,
            batchId:     batchId,
            severity:    severity,
            alertType:   alertType,
            description: description,
            raisedAt:    uint40(block.timestamp),
            raisedBy:    msg.sender,
            resolved:    false
        });

        batchAlerts[batchId].push(alertId);

        emit AlertCreated(alertId, batchId, severity, alertType);
    }

    function resolveAlert(uint256 alertId)
        external
        onlyRole(DEFAULT_ADMIN_ROLE)
    {
        require(!alerts[alertId].resolved, "Already resolved");
        alerts[alertId].resolved = true;
        emit AlertResolved(alertId, msg.sender);
    }

    function getAlertsForBatch(uint256 batchId)
        external
        view
        returns (uint256[] memory)
    {
        return batchAlerts[batchId];
    }

    function pause()   external onlyRole(DEFAULT_ADMIN_ROLE) { _pause(); }
    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) { _unpause(); }
}
