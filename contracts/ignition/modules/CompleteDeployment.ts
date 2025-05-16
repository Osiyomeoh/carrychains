import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

// Replace with Base Mainnet USDC address
const BASE_USDC_ADDRESS = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";

const CompleteDeploymentModule = buildModule("CompleteDeploymentModule", (m) => {
  // Skip mock tokens for mainnet
  // const mockUsdc = m.contract("MockERC20", ["Mock USDC", "USDC", 6]);
  // const mockUsdt = m.contract("MockERC20", ["Mock USDT", "USDT", 6]);

  const stablecoinAdapter = m.contract("StablecoinAdapter", []);

  // Use real USDC address on Base mainnet
  const marketplace = m.contract("CarryChainMarketplace", [BASE_USDC_ADDRESS]);

  const deliveryVerification = m.contract("DeliveryVerification", [marketplace]);

  return {
    marketplace,
    deliveryVerification,
    stablecoinAdapter,
    // mockUsdc,
    // mockUsdt
  };
});

export default CompleteDeploymentModule;
