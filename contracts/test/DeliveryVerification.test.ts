import {
  loadFixture,
  time,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";

describe("DeliveryVerification", function () {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.
  async function deployVerificationFixture() {
    // Contracts are deployed using the first signer/account by default
    const [owner, marketplace, carrier, user] = await ethers.getSigners();

    const DeliveryVerification = await ethers.getContractFactory("DeliveryVerification");
    const verification = await DeliveryVerification.deploy(marketplace.address);
    await verification.waitForDeployment();

    return { verification, owner, marketplace, carrier, user };
  }

  describe("Deployment", function () {
    it("Should deploy with correct marketplace address", async function () {
      const { verification, marketplace } = await loadFixture(deployVerificationFixture);
      
      expect(await verification.marketplaceContract()).to.equal(marketplace.address);
    });

    it("Should set the deployer as owner", async function () {
      const { verification, owner } = await loadFixture(deployVerificationFixture);
      
      expect(await verification.owner()).to.equal(owner.address);
    });
  });

  describe("Pickup Verification", function () {
    it("Should record pickup proof correctly", async function () {
      const { verification, carrier } = await loadFixture(deployVerificationFixture);
      
      const deliveryId = 1;
      const proofCID = "QmTestPickupProofCID123456789";

      await expect(verification.connect(carrier).recordPickup(deliveryId, proofCID))
        .to.emit(verification, "PickupVerified")
        .withArgs(deliveryId, proofCID);

      const verificationData = await verification.getVerification(deliveryId);
      expect(verificationData.deliveryId).to.equal(deliveryId);
      expect(verificationData.pickupProofCID).to.equal(proofCID);
      expect(verificationData.pickupTimestamp).to.be.gt(0);
    });

    it("Should not record pickup with empty proof CID", async function () {
      const { verification, carrier } = await loadFixture(deployVerificationFixture);
      
      const deliveryId = 1;
      const emptyProofCID = "";

      await expect(verification.connect(carrier).recordPickup(deliveryId, emptyProofCID))
        .to.be.revertedWith("Proof CID cannot be empty");
    });

    it("Should update existing pickup proof", async function () {
      const { verification, carrier } = await loadFixture(deployVerificationFixture);
      
      const deliveryId = 1;
      const firstProofCID = "QmFirstPickupProof";
      const secondProofCID = "QmSecondPickupProof";

      await verification.connect(carrier).recordPickup(deliveryId, firstProofCID);
      await verification.connect(carrier).recordPickup(deliveryId, secondProofCID);

      const verificationData = await verification.getVerification(deliveryId);
      expect(verificationData.pickupProofCID).to.equal(secondProofCID);
    });
  });

  describe("Delivery Verification", function () {
    it("Should record delivery proof correctly", async function () {
      const { verification, carrier } = await loadFixture(deployVerificationFixture);
      
      const deliveryId = 1;
      const proofCID = "QmTestDeliveryProofCID123456789";

      await expect(verification.connect(carrier).recordDelivery(deliveryId, proofCID))
        .to.emit(verification, "DeliveryVerified")
        .withArgs(deliveryId, proofCID);

      const verificationData = await verification.getVerification(deliveryId);
      expect(verificationData.deliveryId).to.equal(deliveryId);
      expect(verificationData.deliveryProofCID).to.equal(proofCID);
      expect(verificationData.deliveryTimestamp).to.be.gt(0);
    });

    it("Should not record delivery with empty proof CID", async function () {
      const { verification, carrier } = await loadFixture(deployVerificationFixture);
      
      const deliveryId = 1;
      const emptyProofCID = "";

      await expect(verification.connect(carrier).recordDelivery(deliveryId, emptyProofCID))
        .to.be.revertedWith("Proof CID cannot be empty");
    });
  });

  describe("Complete Verification", function () {
    it("Should complete verification when both proofs are recorded", async function () {
      const { verification, carrier } = await loadFixture(deployVerificationFixture);
      
      const deliveryId = 1;
      const pickupProofCID = "QmPickupProof123";
      const deliveryProofCID = "QmDeliveryProof123";

      // Record pickup
      await verification.connect(carrier).recordPickup(deliveryId, pickupProofCID);
      
      // Verification should not be complete yet
      expect(await verification.isDeliveryVerified(deliveryId)).to.be.false;

      // Record delivery
      await expect(verification.connect(carrier).recordDelivery(deliveryId, deliveryProofCID))
        .to.emit(verification, "VerificationCompleted")
        .withArgs(deliveryId);

      // Now verification should be complete
      expect(await verification.isDeliveryVerified(deliveryId)).to.be.true;

      const verificationData = await verification.getVerification(deliveryId);
      expect(verificationData.isVerified).to.be.true;
    });

    it("Should complete verification regardless of order", async function () {
      const { verification, carrier } = await loadFixture(deployVerificationFixture);
      
      const deliveryId = 2;
      const pickupProofCID = "QmPickupProof456";
      const deliveryProofCID = "QmDeliveryProof456";

      // Record delivery first
      await verification.connect(carrier).recordDelivery(deliveryId, deliveryProofCID);
      
      // Verification should not be complete yet
      expect(await verification.isDeliveryVerified(deliveryId)).to.be.false;

      // Record pickup
      await expect(verification.connect(carrier).recordPickup(deliveryId, pickupProofCID))
        .to.emit(verification, "VerificationCompleted")
        .withArgs(deliveryId);

      // Now verification should be complete
      expect(await verification.isDeliveryVerified(deliveryId)).to.be.true;
    });
  });

  describe("Timestamp Verification", function () {
    it("Should record correct timestamps", async function () {
      const { verification, carrier } = await loadFixture(deployVerificationFixture);
      
      const deliveryId = 1;
      const pickupProofCID = "QmPickupProof";
      const deliveryProofCID = "QmDeliveryProof";

      // Record pickup
      const pickupTime = await time.latest();
      await verification.connect(carrier).recordPickup(deliveryId, pickupProofCID);
      const pickupVerification = await verification.getVerification(deliveryId);
      
      expect(pickupVerification.pickupTimestamp).to.be.gte(pickupTime);
      expect(pickupVerification.pickupTimestamp).to.be.lte(pickupTime + 2);

      // Wait some time
      await time.increase(3600); // 1 hour

      // Record delivery
      const deliveryTime = await time.latest();
      await verification.connect(carrier).recordDelivery(deliveryId, deliveryProofCID);
      const completeVerification = await verification.getVerification(deliveryId);
      
      expect(completeVerification.deliveryTimestamp).to.be.gte(deliveryTime);
      expect(completeVerification.deliveryTimestamp).to.be.lte(deliveryTime + 2);
      
      // Delivery should be after pickup
      expect(completeVerification.deliveryTimestamp).to.be.gt(completeVerification.pickupTimestamp);
    });
  });

  describe("Admin Functions", function () {
    it("Should update marketplace contract", async function () {
      const { verification, owner, user } = await loadFixture(deployVerificationFixture);
      
      const newMarketplaceAddress = user.address;

      await expect(verification.connect(owner).updateMarketplaceContract(newMarketplaceAddress))
        .to.emit(verification, "MarketplaceUpdated")
        .withArgs(newMarketplaceAddress);

      expect(await verification.marketplaceContract()).to.equal(newMarketplaceAddress);
    });

    it("Should not allow non-owner to update marketplace", async function () {
      const { verification, user, carrier } = await loadFixture(deployVerificationFixture);
      
      await expect(verification.connect(user).updateMarketplaceContract(carrier.address))
        .to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("Should not allow zero address for marketplace", async function () {
      const { verification, owner } = await loadFixture(deployVerificationFixture);
      
      await expect(verification.connect(owner).updateMarketplaceContract(ethers.ZeroAddress))
        .to.be.revertedWith("Invalid marketplace address");
    });
  });

  describe("Query Functions", function () {
    it("Should return correct verification data", async function () {
      const { verification, carrier } = await loadFixture(deployVerificationFixture);
      
      const deliveryId = 1;
      const pickupProofCID = "QmPickupProofQuery";
      const deliveryProofCID = "QmDeliveryProofQuery";

      await verification.connect(carrier).recordPickup(deliveryId, pickupProofCID);
      await verification.connect(carrier).recordDelivery(deliveryId, deliveryProofCID);

      const verificationData = await verification.getVerification(deliveryId);
      
      expect(verificationData.deliveryId).to.equal(deliveryId);
      expect(verificationData.pickupProofCID).to.equal(pickupProofCID);
      expect(verificationData.deliveryProofCID).to.equal(deliveryProofCID);
      expect(verificationData.isVerified).to.be.true;
    });

    it("Should return empty data for non-existent delivery", async function () {
      const { verification } = await loadFixture(deployVerificationFixture);
      
      const nonExistentId = 999;
      const verificationData = await verification.getVerification(nonExistentId);
      
      expect(verificationData.deliveryId).to.equal(0);
      expect(verificationData.pickupProofCID).to.equal("");
      expect(verificationData.deliveryProofCID).to.equal("");
      expect(verificationData.pickupTimestamp).to.equal(0);
      expect(verificationData.deliveryTimestamp).to.equal(0);
      expect(verificationData.isVerified).to.be.false;
    });

    it("Should correctly indicate verification status", async function () {
      const { verification, carrier } = await loadFixture(deployVerificationFixture);
      
      const deliveryId = 1;
      const pickupProofCID = "QmPickupProofStatus";

      // Initially not verified
      expect(await verification.isDeliveryVerified(deliveryId)).to.be.false;

      // After pickup only - still not verified
      await verification.connect(carrier).recordPickup(deliveryId, pickupProofCID);
      expect(await verification.isDeliveryVerified(deliveryId)).to.be.false;

      // After delivery - now verified
      await verification.connect(carrier).recordDelivery(deliveryId, "QmDeliveryProofStatus");
      expect(await verification.isDeliveryVerified(deliveryId)).to.be.true;
    });
  });

  describe("Edge Cases", function () {
    it("Should handle multiple verifications for different deliveries", async function () {
      const { verification, carrier } = await loadFixture(deployVerificationFixture);
      
      const delivery1 = 1;
      const delivery2 = 2;
      
      // Record for delivery 1
      await verification.connect(carrier).recordPickup(delivery1, "QmPickup1");
      await verification.connect(carrier).recordDelivery(delivery1, "QmDelivery1");
      
      // Record for delivery 2
      await verification.connect(carrier).recordPickup(delivery2, "QmPickup2");
      
      // Check independent verification status
      expect(await verification.isDeliveryVerified(delivery1)).to.be.true;
      expect(await verification.isDeliveryVerified(delivery2)).to.be.false;
      
      // Complete delivery 2
      await verification.connect(carrier).recordDelivery(delivery2, "QmDelivery2");
      expect(await verification.isDeliveryVerified(delivery2)).to.be.true;
    });

    it("Should handle long IPFS CIDs", async function () {
      const { verification, carrier } = await loadFixture(deployVerificationFixture);
      
      const deliveryId = 1;
      const longCID = "QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG1234567890";
      
      await verification.connect(carrier).recordPickup(deliveryId, longCID);
      
      const verificationData = await verification.getVerification(deliveryId);
      expect(verificationData.pickupProofCID).to.equal(longCID);
    });
  });
});