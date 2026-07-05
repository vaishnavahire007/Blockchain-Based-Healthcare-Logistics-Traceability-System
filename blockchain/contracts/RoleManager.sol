// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title RoleManager
 * @dev Manages role-based access control for the healthcare logistics system.
 *      Roles: Manufacturer, Logistics, Hospital, Regulator.
 *      Deployed separately so it can be upgraded independently.
 */
contract RoleManager is Ownable {

    enum Role { None, Manufacturer, Logistics, Hospital, Regulator }

    struct Participant {
        string name;
        Role   role;
        bool   active;
        uint40 registeredAt;
    }

    mapping(address => Participant) public participants;
    address[] private _participantList;

    event ParticipantRegistered(address indexed account, Role role, string name);
    event ParticipantRevoked(address indexed account);

    constructor() Ownable(msg.sender) {}

    function registerParticipant(
        address account,
        Role    role,
        string calldata name
    ) external onlyOwner {
        require(role != Role.None, "Invalid role");
        participants[account] = Participant({
            name:         name,
            role:         role,
            active:       true,
            registeredAt: uint40(block.timestamp)
        });
        _participantList.push(account);
        emit ParticipantRegistered(account, role, name);
    }

    function revokeParticipant(address account) external onlyOwner {
        participants[account].active = false;
        emit ParticipantRevoked(account);
    }

    function isAuthorized(address account, Role required)
        external
        view
        returns (bool)
    {
        Participant memory p = participants[account];
        return p.active && p.role == required;
    }

    function getAllParticipants() external view returns (address[] memory) {
        return _participantList;
    }
}
