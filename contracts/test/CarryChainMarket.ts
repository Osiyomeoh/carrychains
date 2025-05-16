import {
  time,
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";

describe("CarryChainMarketplace", function () {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.
  async function deployCarryChainFixture() {
    // Contracts are deployed using the first signer/account by default
    const [owner, alice, bob, charlie] = await ethers.getSigners();

    // Deploy MockERC20 for testing
    const MockERC20 = await ethers.getContractFactory("MockERC20");
    const mockUsdc = await MockERC20.deploy("Mock USDC", "USDC", 6);
    await mockUsdc.waitForDeployment();

    // Deploy CarryChainMarketplace with stablecoin address
    const CarryChainMarketplace = await ethers.getContractFactory("CarryChainMarketplace");
    const marketplace = await CarryChainMarketplace.deploy(await mockUsdc.getAddress());
    await marketplace.waitForDeployment();

    // Mint tokens for testing
    const amount = 10000n * 10n ** 6n; // 10,000 USDC
    await mockUsdc.mint(alice.address, amount);
    await mockUsdc.mint(bob.address, amount);
    await mockUsdc.mint(charlie.address, amount);

    return { marketplace, mockUsdc, owner, alice, bob, charlie };
  }

  describe("Deployment", function () {
    it("Should set the right stablecoin", async function () {
      const { marketplace, mockUsdc } = await loadFixture(deployCarryChainFixture);
      
      expect(await marketplace.stablecoin()).to.equal(await mockUsdc.getAddress());
    });

    it("Should deploy with correct initial state", async function () {
      const { marketplace } = await loadFixture(deployCarryChainFixture);
      
      expect(await marketplace.platformFeePercent()).to.equal(5);
      expect(await marketplace.owner()).to.equal((await ethers.getSigners())[0].address);
    });
  });

  describe("Route Management", function () {
    describe("Route Creation", function () {
      it("Should create a new route correctly", async function () {
        const { marketplace, alice } = await loadFixture(deployCarryChainFixture);
        
        const departureLocation = "New York";
        const destinationLocation = "Los Angeles";
        const departureTime = (await time.latest()) + 86400; // Tomorrow
        const arrivalTime = departureTime + 7200; // 2 hours later
        const availableSpace = 5000; // 5kg in grams
        const pricePerKg = 10n * 10n ** 6n; // $10 USDC

        await expect(marketplace.connect(alice).createRoute(
          departureLocation,
          destinationLocation,
          departureTime,
          arrivalTime,
          availableSpace,
          pricePerKg
        )).to.emit(marketplace, "RouteCreated");

        const route = await marketplace.routes(1);
        expect(route.traveler).to.equal(alice.address);
        expect(route.departureLocation).to.equal(departureLocation);
        expect(route.destinationLocation).to.equal(destinationLocation);
        expect(route.availableSpace).to.equal(availableSpace);
        expect(route.isActive).to.be.true;
      });

      it("Should not create route with invalid times", async function () {
        const { marketplace, alice } = await loadFixture(deployCarryChainFixture);
        
        const currentTime = await time.latest();
        const pastTime = currentTime - 3600;

        await expect(marketplace.connect(alice).createRoute(
          "New York",
          "Los Angeles",
          pastTime,
          currentTime,
          5000,
          10n * 10n ** 6n
        )).to.be.revertedWith("Departure time must be in the future");
      });
    });

    describe("Route Cancellation", function () {
      it("Should cancel route correctly", async function () {
        const { marketplace, alice } = await loadFixture(deployCarryChainFixture);
        
        const departureTime = (await time.latest()) + 86400;
        await marketplace.connect(alice).createRoute(
          "New York",
          "Los Angeles",
          departureTime,
          departureTime + 7200,
          5000,
          10n * 10n ** 6n
        );

        await marketplace.connect(alice).deactivateRoute(1);
        
        const route = await marketplace.routes(1);
        expect(route.isActive).to.be.false;
      });

      it("Should only allow carrier to cancel their route", async function () {
        const { marketplace, alice, bob } = await loadFixture(deployCarryChainFixture);
        
        const departureTime = (await time.latest()) + 86400;
        await marketplace.connect(alice).createRoute(
          "New York",
          "Los Angeles",
          departureTime,
          departureTime + 7200,
          5000,
          10n * 10n ** 6n
        );

        await expect(marketplace.connect(bob).deactivateRoute(1))
          .to.be.revertedWith("Not the route owner");
      });
    });
  });

  describe("Delivery Requests", function () {
    // Additional fixture for routes
    async function createRouteFixture() {
      const base = await deployCarryChainFixture();
      const { marketplace, alice } = base;
      
      const departureTime = (await time.latest()) + 86400;
      await marketplace.connect(alice).createRoute(
        "New York",
        "Los Angeles",
        departureTime,
        departureTime + 7200,
        5000,
        10n * 10n ** 6n
      );
      
      return base;
    }

    describe("Request Creation", function () {
      it("Should create delivery request correctly", async function () {
        const { marketplace, mockUsdc, alice, bob } = await loadFixture(createRouteFixture);
        
        const packageWeight = 1000; // 1kg
        const pricePerKg = 10n * 10n ** 6n;
        const basePrice = (BigInt(packageWeight) * pricePerKg) / 1000n;
        const platformFee = (basePrice * 5n) / 100n;
        const totalPrice = basePrice + platformFee;
        
        // Approve USDC spending to marketplace
        await mockUsdc.connect(bob).approve(await marketplace.getAddress(), totalPrice);
        
        await expect(marketplace.connect(bob).createDelivery(
          1,
          "Laptop",
          packageWeight
        )).to.emit(marketplace, "DeliveryCreated");

        const delivery = await marketplace.deliveries(1);
        expect(delivery.shipper).to.equal(bob.address);
        expect(delivery.routeId).to.equal(1);
        expect(delivery.packageDescription).to.equal("Laptop");
        expect(delivery.status).to.equal(0); // Created
      });

      it("Should not create request for inactive route", async function () {
        const { marketplace, mockUsdc, alice, bob } = await loadFixture(createRouteFixture);
        
        // Cancel the route
        await marketplace.connect(alice).deactivateRoute(1);
        
        await mockUsdc.connect(bob).approve(await marketplace.getAddress(), 10n * 10n ** 6n);
        
        await expect(marketplace.connect(bob).createDelivery(
          1,
          "Laptop",
          1000
        )).to.be.revertedWith("Route is not active");
      });
    });

    describe("Request Processing", function () {
      it("Should accept delivery request", async function () {
        const { marketplace, mockUsdc, alice, bob } = await loadFixture(createRouteFixture);
        
        const packageWeight = 1000;
        const pricePerKg = 10n * 10n ** 6n;
        const basePrice = (BigInt(packageWeight) * pricePerKg) / 1000n;
        const platformFee = (basePrice * 5n) / 100n;
        const totalPrice = basePrice + platformFee;
        
        await mockUsdc.connect(bob).approve(await marketplace.getAddress(), totalPrice);
        
        await marketplace.connect(bob).createDelivery(
          1,
          "Laptop",
          packageWeight
        );

        await expect(marketplace.connect(alice).acceptDelivery(1))
          .to.emit(marketplace, "DeliveryStatusChanged");

        const delivery = await marketplace.deliveries(1);
        expect(delivery.status).to.equal(1); // Accepted
      });

      it("Should pickup item correctly", async function () {
        const { marketplace, mockUsdc, alice, bob } = await loadFixture(createRouteFixture);
        
        const packageWeight = 1000;
        const pricePerKg = 10n * 10n ** 6n;
        const basePrice = (BigInt(packageWeight) * pricePerKg) / 1000n;
        const platformFee = (basePrice * 5n) / 100n;
        const totalPrice = basePrice + platformFee;
        
        await mockUsdc.connect(bob).approve(await marketplace.getAddress(), totalPrice);
        
        await marketplace.connect(bob).createDelivery(
          1,
          "Laptop",
          packageWeight
        );

        await marketplace.connect(alice).acceptDelivery(1);
        
        await expect(marketplace.connect(alice).markAsPickedUp(1))
          .to.emit(marketplace, "DeliveryStatusChanged");

        const delivery = await marketplace.deliveries(1);
        expect(delivery.status).to.equal(2); // PickedUp
      });

      it("Should complete delivery with payment", async function () {
        const { marketplace, mockUsdc, alice, bob, owner } = await loadFixture(createRouteFixture);
        
        const packageWeight = 1000;
        const pricePerKg = 10n * 10n ** 6n;
        const basePrice = (BigInt(packageWeight) * pricePerKg) / 1000n;
        const platformFee = (basePrice * 5n) / 100n;
        const totalPrice = basePrice + platformFee;
        
        await mockUsdc.connect(bob).approve(await marketplace.getAddress(), totalPrice);
        
        await marketplace.connect(bob).createDelivery(
          1,
          "Laptop",
          packageWeight
        );

        await marketplace.connect(alice).acceptDelivery(1);
        await marketplace.connect(alice).markAsPickedUp(1);
        await marketplace.connect(alice).markAsDelivered(1);
        
        const aliceBalanceBefore = await mockUsdc.balanceOf(alice.address);
        
        await expect(marketplace.connect(bob).confirmDelivery(1))
          .to.emit(marketplace, "DeliveryStatusChanged");

        const aliceBalanceAfter = await mockUsdc.balanceOf(alice.address);
        
        // Platform fee is 5% of the TOTAL price
        const expectedPlatformFee = (totalPrice * 5n) / 100n;
        const expectedCarrierPayment = totalPrice - expectedPlatformFee;
        
        expect(aliceBalanceAfter - aliceBalanceBefore).to.equal(expectedCarrierPayment);

        const delivery = await marketplace.deliveries(1);
        expect(delivery.status).to.equal(4); // Completed
      });
    });

    describe("Disputes", function () {
      it("Should handle disputes correctly", async function () {
        const { marketplace, mockUsdc, alice, bob } = await loadFixture(createRouteFixture);
        
        const packageWeight = 1000;
        const pricePerKg = 10n * 10n ** 6n;
        const basePrice = (BigInt(packageWeight) * pricePerKg) / 1000n;
        const platformFee = (basePrice * 5n) / 100n;
        const totalPrice = basePrice + platformFee;
        
        await mockUsdc.connect(bob).approve(await marketplace.getAddress(), totalPrice);
        
        await marketplace.connect(bob).createDelivery(
          1,
          "Laptop",
          packageWeight
        );

        await marketplace.connect(alice).acceptDelivery(1);
        await marketplace.connect(alice).markAsPickedUp(1);
        
        await expect(marketplace.connect(bob).disputeDelivery(1))
          .to.emit(marketplace, "DeliveryDisputed");

        const delivery = await marketplace.deliveries(1);
        expect(delivery.status).to.equal(6); // Disputed
      });
    });
  });

  describe("User Statistics and Reputation", function () {
    it("Should track user stats correctly", async function () {
      const { marketplace, mockUsdc, alice, bob } = await loadFixture(deployCarryChainFixture);
      
      // Create route
      const departureTime = (await time.latest()) + 86400;
      await marketplace.connect(alice).createRoute(
        "New York",
        "Los Angeles",
        departureTime,
        departureTime + 7200,
        5000,
        10n * 10n ** 6n
      );

      // Create and complete delivery
      const packageWeight = 1000;
      const pricePerKg = 10n * 10n ** 6n;
      const basePrice = (BigInt(packageWeight) * pricePerKg) / 1000n;
      const platformFee = (basePrice * 5n) / 100n;
      const totalPrice = basePrice + platformFee;
      
      await mockUsdc.connect(bob).approve(await marketplace.getAddress(), totalPrice);
      
      await marketplace.connect(bob).createDelivery(
        1,
        "Laptop",
        packageWeight
      );

      await marketplace.connect(alice).acceptDelivery(1);
      await marketplace.connect(alice).markAsPickedUp(1);
      await marketplace.connect(alice).markAsDelivered(1);
      await marketplace.connect(bob).confirmDelivery(1);

      // Check reputation
      await marketplace.connect(bob).submitReview(alice.address, true);
      expect(await marketplace.getReputationScore(alice.address)).to.equal(100);
    });

    it("Should update reputation correctly", async function () {
      const { marketplace, mockUsdc, alice, bob } = await loadFixture(deployCarryChainFixture);
      
      // Create and complete delivery first
      const departureTime = (await time.latest()) + 86400;
      await marketplace.connect(alice).createRoute(
        "New York",
        "Los Angeles",
        departureTime,
        departureTime + 7200,
        5000,
        10n * 10n ** 6n
      );

      const packageWeight = 1000;
      const pricePerKg = 10n * 10n ** 6n;
      const basePrice = (BigInt(packageWeight) * pricePerKg) / 1000n;
      const platformFee = (basePrice * 5n) / 100n;
      const totalPrice = basePrice + platformFee;
      
      await mockUsdc.connect(bob).approve(await marketplace.getAddress(), totalPrice);
      await marketplace.connect(bob).createDelivery(1, "Laptop", packageWeight);
      await marketplace.connect(alice).acceptDelivery(1);
      await marketplace.connect(alice).markAsPickedUp(1);
      await marketplace.connect(alice).markAsDelivered(1);
      await marketplace.connect(bob).confirmDelivery(1);
      
      await marketplace.connect(bob).submitReview(alice.address, true);

      expect(await marketplace.totalReviews(alice.address)).to.equal(1);
      expect(await marketplace.getReputationScore(alice.address)).to.equal(100);
    });
  });

  describe("Fee Management", function () {
    it("Should update platform fee", async function () {
      const { marketplace, owner } = await loadFixture(deployCarryChainFixture);
      
      const newFee = 10; // 10%
      await marketplace.connect(owner).updatePlatformFee(newFee);
      
      expect(await marketplace.platformFeePercent()).to.equal(newFee);
    });

    it("Should not allow non-owner to update fee", async function () {
      const { marketplace, alice } = await loadFixture(deployCarryChainFixture);
      
      await expect(marketplace.connect(alice).updatePlatformFee(10))
        .to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("Should collect platform fees on delivery completion", async function () {
      const { marketplace, mockUsdc, alice, bob, owner } = await loadFixture(deployCarryChainFixture);
      
      // Create route
      const departureTime = (await time.latest()) + 86400;
      await marketplace.connect(alice).createRoute(
        "New York",
        "Los Angeles",
        departureTime,
        departureTime + 7200,
        5000,
        100n * 10n ** 6n
      );

      // Create delivery
      const packageWeight = 1000;
      const pricePerKg = 100n * 10n ** 6n;
      const basePrice = (BigInt(packageWeight) * pricePerKg) / 1000n;
      const platformFee = (basePrice * 5n) / 100n;
      const totalPrice = basePrice + platformFee;
      
      await mockUsdc.connect(bob).approve(await marketplace.getAddress(), totalPrice);
      
      await marketplace.connect(bob).createDelivery(
        1,
        "Laptop",
        packageWeight
      );

      await marketplace.connect(alice).acceptDelivery(1);
      await marketplace.connect(alice).markAsPickedUp(1);
      await marketplace.connect(alice).markAsDelivered(1);
      
      const ownerBalanceBefore = await mockUsdc.balanceOf(owner.address);
      const aliceBalanceBefore = await mockUsdc.balanceOf(alice.address);
      
      await marketplace.connect(bob).confirmDelivery(1);
      
      const ownerBalanceAfter = await mockUsdc.balanceOf(owner.address);
      const aliceBalanceAfter = await mockUsdc.balanceOf(alice.address);
      
      // Platform fee is 5% of the TOTAL price
      const expectedPlatformFee = (totalPrice * 5n) / 100n;
      const expectedCarrierPayment = totalPrice - expectedPlatformFee;
      
      expect(ownerBalanceAfter - ownerBalanceBefore).to.equal(expectedPlatformFee);
      expect(aliceBalanceAfter - aliceBalanceBefore).to.equal(expectedCarrierPayment);
    });
  });

  describe("Edge Cases and Security", function () {
    it("Should handle route capacity correctly", async function () {
      const { marketplace, mockUsdc, alice, bob, charlie } = await loadFixture(deployCarryChainFixture);
      
      // Create route with capacity 2000 grams (2kg)
      const departureTime = (await time.latest()) + 86400;
      await marketplace.connect(alice).createRoute(
        "New York",
        "Los Angeles",
        departureTime,
        departureTime + 7200,
        2000,
        10n * 10n ** 6n
      );

      const packageWeight = 1000;
      const pricePerKg = 10n * 10n ** 6n;
      const basePrice = (BigInt(packageWeight) * pricePerKg) / 1000n;
      const platformFee = (basePrice * 5n) / 100n;
      const totalPrice = basePrice + platformFee;
      
      // First request
      await mockUsdc.connect(bob).approve(await marketplace.getAddress(), totalPrice);
      await marketplace.connect(bob).createDelivery(
        1,
        "Item1",
        packageWeight
      );
      await marketplace.connect(alice).acceptDelivery(1);

      // Second request
      await mockUsdc.connect(charlie).approve(await marketplace.getAddress(), totalPrice);
      await marketplace.connect(charlie).createDelivery(
        1,
        "Item2",
        packageWeight
      );
      await marketplace.connect(alice).acceptDelivery(2);

      // Third request should fail - exceeds capacity
      await mockUsdc.connect(bob).approve(await marketplace.getAddress(), totalPrice);
      await expect(marketplace.connect(bob).createDelivery(
        1,
        "Item3", 
        packageWeight
      )).to.be.revertedWith("Not enough space available");
    });

    it("Should prevent double pickup", async function () {
      const { marketplace, mockUsdc, alice, bob } = await loadFixture(deployCarryChainFixture);
      
      const departureTime = (await time.latest()) + 86400;
      await marketplace.connect(alice).createRoute(
        "New York",
        "Los Angeles",
        departureTime,
        departureTime + 7200,
        5000,
        10n * 10n ** 6n
      );

      const packageWeight = 1000;
      const pricePerKg = 10n * 10n ** 6n;
      const basePrice = (BigInt(packageWeight) * pricePerKg) / 1000n;
      const platformFee = (basePrice * 5n) / 100n;
      const totalPrice = basePrice + platformFee;
      
      await mockUsdc.connect(bob).approve(await marketplace.getAddress(), totalPrice);
      
      await marketplace.connect(bob).createDelivery(
        1,
        "Laptop",
        packageWeight
      );

      await marketplace.connect(alice).acceptDelivery(1);
      await marketplace.connect(alice).markAsPickedUp(1);
      
      // Try to pickup again
      await expect(marketplace.connect(alice).markAsPickedUp(1))
        .to.be.revertedWith("Invalid status");
    });

    it("Should prevent unauthorized actions", async function () {
      const { marketplace, mockUsdc, alice, bob, charlie } = await loadFixture(deployCarryChainFixture);
      
      const departureTime = (await time.latest()) + 86400;
      await marketplace.connect(alice).createRoute(
        "New York",
        "Los Angeles",
        departureTime,
        departureTime + 7200,
        5000,
        10n * 10n ** 6n
      );

      const packageWeight = 1000;
      const pricePerKg = 10n * 10n ** 6n;
      const basePrice = (BigInt(packageWeight) * pricePerKg) / 1000n;
      const platformFee = (basePrice * 5n) / 100n;
      const totalPrice = basePrice + platformFee;
      
      await mockUsdc.connect(bob).approve(await marketplace.getAddress(), totalPrice);
      
      await marketplace.connect(bob).createDelivery(
        1,
        "Laptop",
        packageWeight
      );

      // Charlie (not the traveler) tries to accept
      await expect(marketplace.connect(charlie).acceptDelivery(1))
        .to.be.revertedWith("Not the traveler");
    });
  });
});