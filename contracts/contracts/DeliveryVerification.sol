// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title DeliveryVerification
 * @dev Handles verification of deliveries through proof of pickup/delivery
 */
contract DeliveryVerification is Ownable {
    address public marketplaceContract;

    // ============ Structs ============
    
    struct Verification {
        uint256 deliveryId;
        string pickupProofCID; // IPFS CID of pickup proof
        uint256 pickupTimestamp;
        string deliveryProofCID; // IPFS CID of delivery proof
        uint256 deliveryTimestamp;
        bool isVerified;
    }

    // ============ State Variables ============
    
    mapping(uint256 => Verification) public verifications;
    
    // Events
    event PickupVerified(uint256 indexed deliveryId, string proofCID);
    event DeliveryVerified(uint256 indexed deliveryId, string proofCID);
    event VerificationCompleted(uint256 indexed deliveryId);
    event MarketplaceUpdated(address indexed newMarketplace);

    // ============ Modifiers ============
    
    modifier onlyMarketplace() {
        require(msg.sender == marketplaceContract, "Only marketplace can call");
        _;
    }

    // ============ Constructor ============
    
    constructor(address _marketplaceContract) {
        marketplaceContract = _marketplaceContract;
    }

    // ============ Verification Functions ============
    
    /**
     * @dev Record proof of pickup
     */
    function recordPickup(uint256 deliveryId, string calldata proofCID) external {
        require(bytes(proofCID).length > 0, "Proof CID cannot be empty");
        
        Verification storage verification = verifications[deliveryId];
        
        // Initialize verification if it doesn't exist
        if (verification.deliveryId == 0) {
            verification.deliveryId = deliveryId;
        }
        
        verification.pickupProofCID = proofCID;
        verification.pickupTimestamp = block.timestamp;
        
        emit PickupVerified(deliveryId, proofCID);
        
        // Check if verification is complete
        checkVerificationStatus(deliveryId);
    }

    /**
     * @dev Record proof of delivery
     */
    function recordDelivery(uint256 deliveryId, string calldata proofCID) external {
        require(bytes(proofCID).length > 0, "Proof CID cannot be empty");
        
        Verification storage verification = verifications[deliveryId];
        
        // Initialize verification if it doesn't exist
        if (verification.deliveryId == 0) {
            verification.deliveryId = deliveryId;
        }
        
        verification.deliveryProofCID = proofCID;
        verification.deliveryTimestamp = block.timestamp;
        
        emit DeliveryVerified(deliveryId, proofCID);
        
        // Check if verification is complete
        checkVerificationStatus(deliveryId);
    }

    /**
     * @dev Check if verification is complete
     */
    function checkVerificationStatus(uint256 deliveryId) internal {
        Verification storage verification = verifications[deliveryId];
        
        // If both pickup and delivery are recorded
        if (
            bytes(verification.pickupProofCID).length > 0 &&
            verification.pickupTimestamp > 0 &&
            bytes(verification.deliveryProofCID).length > 0 &&
            verification.deliveryTimestamp > 0
        ) {
            verification.isVerified = true;
            emit VerificationCompleted(deliveryId);
        }
    }

    /**
     * @dev Get verification details
     */
    function getVerification(uint256 deliveryId) external view returns (Verification memory) {
        return verifications[deliveryId];
    }

    /**
     * @dev Check if a delivery is fully verified
     */
    function isDeliveryVerified(uint256 deliveryId) external view returns (bool) {
        return verifications[deliveryId].isVerified;
    }

    // ============ Admin Functions ============
    
    /**
     * @dev Update the marketplace contract address
     */
    function updateMarketplaceContract(address _marketplaceContract) external onlyOwner {
        require(_marketplaceContract != address(0), "Invalid marketplace address");
        marketplaceContract = _marketplaceContract;
        emit MarketplaceUpdated(_marketplaceContract);
    }
}