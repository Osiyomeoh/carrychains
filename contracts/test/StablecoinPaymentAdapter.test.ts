import {
  time,
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";

describe("StablecoinAdapter", function () {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.
  async function deployStablecoinAdapterFixture() {
    // Contracts are deployed using the first signer/account by default
    const [owner, user1, user2, marketplace] = await ethers.getSigners();

    // Deploy StablecoinAdapter
    const StablecoinAdapter = await ethers.getContractFactory("StablecoinAdapter");
    const adapter = await StablecoinAdapter.deploy();
    await adapter.waitForDeployment();

    // Deploy mock tokens for testing
    const MockERC20 = await ethers.getContractFactory("MockERC20");
    const mockUsdc = await MockERC20.deploy("Mock USDC", "USDC", 6);
    await mockUsdc.waitForDeployment();
    
    const mockUsdt = await MockERC20.deploy("Mock USDT", "USDT", 6);
    await mockUsdt.waitForDeployment();
    
    const mockDai = await MockERC20.deploy("Mock DAI", "DAI", 18);
    await mockDai.waitForDeployment();

    // Mint tokens for testing
    const amount = ethers.parseUnits("10000", 6); // 10,000 USDC/USDT
    const daiAmount = ethers.parseUnits("10000", 18); // 10,000 DAI
    
    await mockUsdc.mint(user1.address, amount);
    await mockUsdc.mint(user2.address, amount);
    await mockUsdt.mint(user1.address, amount);
    await mockUsdt.mint(user2.address, amount);
    await mockDai.mint(user1.address, daiAmount);
    await mockDai.mint(user2.address, daiAmount);

    return { adapter, mockUsdc, mockUsdt, mockDai, owner, user1, user2, marketplace };
  }

  describe("Deployment", function () {
    it("Should deploy successfully", async function () {
      const { adapter, owner } = await loadFixture(deployStablecoinAdapterFixture);
      
      expect(await adapter.owner()).to.equal(owner.address);
    });
  });

  describe("Token Management", function () {
    describe("Adding Tokens", function () {
      it("Should add supported token", async function () {
        const { adapter, mockUsdc, owner } = await loadFixture(deployStablecoinAdapterFixture);
        
        await expect(adapter.connect(owner).addSupportedToken(await mockUsdc.getAddress()))
          .to.emit(adapter, "TokenAdded")
          .withArgs(await mockUsdc.getAddress(), 6);
        
        expect(await adapter.supportedTokens(await mockUsdc.getAddress())).to.be.true;
        expect(await adapter.tokenDecimals(await mockUsdc.getAddress())).to.equal(6);
        expect(await adapter.tokenPrices(await mockUsdc.getAddress())).to.equal(100000000); // $1.00 with 8 decimals
      });

      it("Should not allow non-owner to add tokens", async function () {
        const { adapter, mockUsdc, user1 } = await loadFixture(deployStablecoinAdapterFixture);
        
        await expect(adapter.connect(user1).addSupportedToken(await mockUsdc.getAddress()))
          .to.be.revertedWith("Ownable: caller is not the owner");
      });

      it("Should not add zero address", async function () {
        const { adapter, owner } = await loadFixture(deployStablecoinAdapterFixture);
        
        await expect(adapter.connect(owner).addSupportedToken(ethers.ZeroAddress))
          .to.be.revertedWith("Invalid token address");
      });

      it("Should not add already supported token", async function () {
        const { adapter, mockUsdc, owner } = await loadFixture(deployStablecoinAdapterFixture);
        
        await adapter.connect(owner).addSupportedToken(await mockUsdc.getAddress());
        
        await expect(adapter.connect(owner).addSupportedToken(await mockUsdc.getAddress()))
          .to.be.revertedWith("Token already supported");
      });
    });

    describe("Removing Tokens", function () {
      it("Should remove supported token", async function () {
        const { adapter, mockUsdc, owner } = await loadFixture(deployStablecoinAdapterFixture);
        
        await adapter.connect(owner).addSupportedToken(await mockUsdc.getAddress());
        
        await expect(adapter.connect(owner).removeSupportedToken(await mockUsdc.getAddress()))
          .to.emit(adapter, "TokenRemoved")
          .withArgs(await mockUsdc.getAddress());
        
        expect(await adapter.supportedTokens(await mockUsdc.getAddress())).to.be.false;
      });

      it("Should not remove non-supported token", async function () {
        const { adapter, mockUsdc, owner } = await loadFixture(deployStablecoinAdapterFixture);
        
        await expect(adapter.connect(owner).removeSupportedToken(await mockUsdc.getAddress()))
          .to.be.revertedWith("Token not supported");
      });
    });

    describe("Token List", function () {
      it("Should get list of supported tokens", async function () {
        const { adapter, mockUsdc, mockUsdt, owner } = await loadFixture(deployStablecoinAdapterFixture);
        
        await adapter.connect(owner).addSupportedToken(await mockUsdc.getAddress());
        await adapter.connect(owner).addSupportedToken(await mockUsdt.getAddress());
        
        const tokens = await adapter.getSupportedTokens();
        expect(tokens).to.include(await mockUsdc.getAddress());
        expect(tokens).to.include(await mockUsdt.getAddress());
        expect(tokens.length).to.equal(2);
      });
    });

    describe("Price Updates", function () {
      it("Should update token price", async function () {
        const { adapter, mockUsdc, owner } = await loadFixture(deployStablecoinAdapterFixture);
        
        await adapter.connect(owner).addSupportedToken(await mockUsdc.getAddress());
        
        const newPrice = 99000000; // $0.99 with 8 decimals
        await expect(adapter.connect(owner).updateTokenPrice(await mockUsdc.getAddress(), newPrice))
          .to.emit(adapter, "PriceUpdated")
          .withArgs(await mockUsdc.getAddress(), newPrice);
        
        expect(await adapter.tokenPrices(await mockUsdc.getAddress())).to.equal(newPrice);
      });

      it("Should not update price for non-supported token", async function () {
        const { adapter, mockUsdc, owner } = await loadFixture(deployStablecoinAdapterFixture);
        
        await expect(adapter.connect(owner).updateTokenPrice(await mockUsdc.getAddress(), 99000000))
          .to.be.revertedWith("Token not supported");
      });

      it("Should not update with zero price", async function () {
        const { adapter, mockUsdc, owner } = await loadFixture(deployStablecoinAdapterFixture);
        
        await adapter.connect(owner).addSupportedToken(await mockUsdc.getAddress());
        
        await expect(adapter.connect(owner).updateTokenPrice(await mockUsdc.getAddress(), 0))
          .to.be.revertedWith("Invalid price");
      });
    });
  });

  describe("Payment Processing", function () {
    it("Should process payment successfully", async function () {
      const { adapter, mockUsdc, owner, user1, user2 } = await loadFixture(deployStablecoinAdapterFixture);
      
      await adapter.connect(owner).addSupportedToken(await mockUsdc.getAddress());
      
      const amount = ethers.parseUnits("100", 6);
      await mockUsdc.connect(user1).approve(await adapter.getAddress(), amount);
      
      const user2BalanceBefore = await mockUsdc.balanceOf(user2.address);
      
      await expect(adapter.processPayment(
        await mockUsdc.getAddress(),
        user1.address,
        user2.address,
        amount
      )).to.emit(adapter, "PaymentProcessed")
        .withArgs(user1.address, user2.address, await mockUsdc.getAddress(), amount);
      
      const user2BalanceAfter = await mockUsdc.balanceOf(user2.address);
      expect(user2BalanceAfter - user2BalanceBefore).to.equal(amount);
    });

    it("Should reject unsupported token", async function () {
      const { adapter, mockUsdc, user1, user2 } = await loadFixture(deployStablecoinAdapterFixture);
      
      const amount = ethers.parseUnits("100", 6);
      
      await expect(adapter.processPayment(
        await mockUsdc.getAddress(),
        user1.address,
        user2.address,
        amount
      )).to.be.revertedWith("Token not supported");
    });

    it("Should reject zero amount", async function () {
      const { adapter, mockUsdc, owner, user1, user2 } = await loadFixture(deployStablecoinAdapterFixture);
      
      await adapter.connect(owner).addSupportedToken(await mockUsdc.getAddress());
      
      await expect(adapter.processPayment(
        await mockUsdc.getAddress(),
        user1.address,
        user2.address,
        0
      )).to.be.revertedWith("Amount must be greater than 0");
    });

    it("Should reject zero address recipient", async function () {
      const { adapter, mockUsdc, owner, user1 } = await loadFixture(deployStablecoinAdapterFixture);
      
      await adapter.connect(owner).addSupportedToken(await mockUsdc.getAddress());
      const amount = ethers.parseUnits("100", 6);
      
      await expect(adapter.processPayment(
        await mockUsdc.getAddress(),
        user1.address,
        ethers.ZeroAddress,
        amount
      )).to.be.revertedWith("Invalid recipient");
    });
  });

  describe("Exchange Rate Functions", function () {
    it("Should get exchange rate", async function () {
      const { adapter, mockUsdc, owner } = await loadFixture(deployStablecoinAdapterFixture);
      
      await adapter.connect(owner).addSupportedToken(await mockUsdc.getAddress());
      
      const rate = await adapter.getExchangeRate(await mockUsdc.getAddress());
      expect(rate).to.equal(100000000); // $1.00 with 8 decimals
    });

    it("Should revert for unsupported token", async function () {
      const { adapter, mockUsdc } = await loadFixture(deployStablecoinAdapterFixture);
      
      await expect(adapter.getExchangeRate(await mockUsdc.getAddress()))
        .to.be.revertedWith("Token not supported");
    });
  });

  describe("Token Support Checks", function () {
    it("Should check if token is supported", async function () {
      const { adapter, mockUsdc, owner } = await loadFixture(deployStablecoinAdapterFixture);
      
      expect(await adapter.isTokenSupported(await mockUsdc.getAddress())).to.be.false;
      
      await adapter.connect(owner).addSupportedToken(await mockUsdc.getAddress());
      
      expect(await adapter.isTokenSupported(await mockUsdc.getAddress())).to.be.true;
    });
  });

  describe("Amount Conversion", function () {
    it("Should convert between tokens with same decimals and price", async function () {
      const { adapter, mockUsdc, mockUsdt, owner } = await loadFixture(deployStablecoinAdapterFixture);
      
      await adapter.connect(owner).addSupportedToken(await mockUsdc.getAddress());
      await adapter.connect(owner).addSupportedToken(await mockUsdt.getAddress());
      
      const amount = ethers.parseUnits("100", 6);
      const converted = await adapter.convertAmount(
        await mockUsdc.getAddress(),
        await mockUsdt.getAddress(),
        amount
      );
      
      expect(converted).to.equal(amount); // Same decimals and both at $1.00
    });

    it("Should convert between tokens with different decimals", async function () {
      const { adapter, mockUsdc, mockDai, owner } = await loadFixture(deployStablecoinAdapterFixture);
      
      await adapter.connect(owner).addSupportedToken(await mockUsdc.getAddress());
      await adapter.connect(owner).addSupportedToken(await mockDai.getAddress());
      
      const usdcAmount = ethers.parseUnits("100", 6); // 100 USDC
      const expectedDaiAmount = ethers.parseUnits("100", 18); // 100 DAI
      
      const converted = await adapter.convertAmount(
        await mockUsdc.getAddress(),
        await mockDai.getAddress(),
        usdcAmount
      );
      
      expect(converted).to.equal(expectedDaiAmount);
    });

    it("Should convert between tokens with different prices", async function () {
      const { adapter, mockUsdc, mockUsdt, owner } = await loadFixture(deployStablecoinAdapterFixture);
      
      await adapter.connect(owner).addSupportedToken(await mockUsdc.getAddress());
      await adapter.connect(owner).addSupportedToken(await mockUsdt.getAddress());
      
      // Set USDT price to $0.99 (99000000 with 8 decimals)
      await adapter.connect(owner).updateTokenPrice(await mockUsdt.getAddress(), 99000000);
      
      const usdcAmount = ethers.parseUnits("100", 6); // $100 USDC
      const expectedUsdtAmount = ethers.parseUnits("101.0101", 6); // ~101.01 USDT
      
      const converted = await adapter.convertAmount(
        await mockUsdc.getAddress(),
        await mockUsdt.getAddress(),
        usdcAmount
      );
      
      // Allow for small rounding differences
      expect(converted).to.be.closeTo(expectedUsdtAmount, ethers.parseUnits("0.01", 6));
    });

    it("Should return same amount for same token", async function () {
      const { adapter, mockUsdc, owner } = await loadFixture(deployStablecoinAdapterFixture);
      
      await adapter.connect(owner).addSupportedToken(await mockUsdc.getAddress());
      
      const amount = ethers.parseUnits("100", 6);
      const converted = await adapter.convertAmount(
        await mockUsdc.getAddress(),
        await mockUsdc.getAddress(),
        amount
      );
      
      expect(converted).to.equal(amount);
    });

    it("Should revert for unsupported tokens", async function () {
      const { adapter, mockUsdc, mockUsdt } = await loadFixture(deployStablecoinAdapterFixture);
      
      const amount = ethers.parseUnits("100", 6);
      
      await expect(adapter.convertAmount(
        await mockUsdc.getAddress(),
        await mockUsdt.getAddress(),
        amount
      )).to.be.revertedWith("From token not supported");
    });
  });

  describe("Edge Cases", function () {
    it("Should handle multiple token additions and removals", async function () {
      const { adapter, mockUsdc, mockUsdt, mockDai, owner } = await loadFixture(deployStablecoinAdapterFixture);
      
      // Add all tokens
      await adapter.connect(owner).addSupportedToken(await mockUsdc.getAddress());
      await adapter.connect(owner).addSupportedToken(await mockUsdt.getAddress());
      await adapter.connect(owner).addSupportedToken(await mockDai.getAddress());
      
      let tokens = await adapter.getSupportedTokens();
      expect(tokens.length).to.equal(3);
      
      // Remove one token
      await adapter.connect(owner).removeSupportedToken(await mockUsdt.getAddress());
      
      tokens = await adapter.getSupportedTokens();
      expect(tokens.length).to.equal(2);
      expect(tokens).to.not.include(await mockUsdt.getAddress());
    });

    it("Should correctly remove token from middle of list", async function () {
      const { adapter, mockUsdc, mockUsdt, mockDai, owner } = await loadFixture(deployStablecoinAdapterFixture);
      
      // Add three tokens
      await adapter.connect(owner).addSupportedToken(await mockUsdc.getAddress());
      await adapter.connect(owner).addSupportedToken(await mockUsdt.getAddress());
      await adapter.connect(owner).addSupportedToken(await mockDai.getAddress());
      
      // Remove middle token
      await adapter.connect(owner).removeSupportedToken(await mockUsdt.getAddress());
      
      const tokens = await adapter.getSupportedTokens();
      expect(tokens.length).to.equal(2);
      expect(tokens).to.include(await mockUsdc.getAddress());
      expect(tokens).to.include(await mockDai.getAddress());
      expect(tokens).to.not.include(await mockUsdt.getAddress());
    });
  });
});