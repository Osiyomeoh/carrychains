// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const CarryChainMarketplaceModule = buildModule("CarryChainMarketplaceModule", (m) => {
  // Deploy a mock USDC for testing on testnet
  // In production, you would use the actual USDC address
  const mockUsdc = m.contract("MockERC20", ["Mock USDC", "USDC", 6]);
  
  // Deploy the CarryChainMarketplace with the stablecoin address
  const marketplace = m.contract("CarryChainMarketplace", [mockUsdc]);

  return { marketplace, mockUsdc };
});

export default CarryChainMarketplaceModule;