// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IMedicineTracking
 * @dev Interface for the MedicineTracking contract.
 */
interface IMedicineTracking {

    enum BatchStatus {
        Manufactured,   // 0 – just created at factory
        InTransit,      // 1 – picked up by logistics
        AtWarehouse,    // 2 – stored in a distribution centre
        OutForDelivery, // 3 – last-mile delivery
        Delivered,      // 4 – received by hospital / pharmacy
        Recalled        // 5 – quality issue, recalled
    }
}
