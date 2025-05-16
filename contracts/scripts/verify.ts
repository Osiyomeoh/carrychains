import hre from "hardhat";

async function main() {
  // ✅ Updated deployed contract addresses on Base Sepolia
  // const MOCK_USDC_ADDRESS = "0xa12ee69D5e36A07c25b61331Ae4bcFfA2E5f23A1";
  // const MOCK_USDT_ADDRESS = "0x0626751C2cD40BDB0655E25af082d5657bE51230";
  const ADAPTER_ADDRESS = "0xF923D57D4eBc499f3CE707e0c76Ca70490500cb9";
  const MARKETPLACE_ADDRESS = "0x00110BA2493FA9bE248D9449EAa9e027fCD59E1b";
  const VERIFICATION_ADDRESS = "0x7973aC2ad7A9ED75398D00e9964819b7Be760B9C";
  const BASE_USDC_ADDRESS = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";

  console.log("🔍 Starting verification process on Base Sepolia...");

  // Verify MockUSDC
  // try {
  //   console.log("🔍 Verifying MockUSDC...");
  //   await hre.run("verify:verify", {
  //     address: MOCK_USDC_ADDRESS,
  //     constructorArguments: ["Mock USDC", "USDC", 6],
  //   });
  //   console.log("✅ MockUSDC verified successfully");
  // } catch (error) {
  //   console.error("❌ Error verifying MockUSDC:", error);
  // }

  // Verify MockUSDT
  // try {
  //   console.log("🔍 Verifying MockUSDT...");
  //   await hre.run("verify:verify", {
  //     address: MOCK_USDT_ADDRESS,
  //     constructorArguments: ["Mock USDT", "USDT", 6],
  //   });
  //   console.log("✅ MockUSDT verified successfully");
  // } catch (error) {
  //   console.error("❌ Error verifying MockUSDT:", error);
  // }

  // Verify StablecoinAdapter
  try {
    console.log("🔍 Verifying StablecoinAdapter...");
    await hre.run("verify:verify", {
      address: ADAPTER_ADDRESS,
      constructorArguments: [],
    });
    console.log("✅ StablecoinAdapter verified successfully");
  } catch (error) {
    console.error("❌ Error verifying StablecoinAdapter:", error);
  }

  // Verify CarryChainMarketplace
  try {
    console.log("🔍 Verifying CarryChainMarketplace...");
    await hre.run("verify:verify", {
      address: MARKETPLACE_ADDRESS,
      constructorArguments: [BASE_USDC_ADDRESS],
    });
    console.log("✅ CarryChainMarketplace verified successfully");
  } catch (error) {
    console.error("❌ Error verifying CarryChainMarketplace:", error);
  }

  // Verify DeliveryVerification
  try {
    console.log("🔍 Verifying DeliveryVerification...");
    await hre.run("verify:verify", {
      address: VERIFICATION_ADDRESS,
      constructorArguments: [MARKETPLACE_ADDRESS],
    });
    console.log("✅ DeliveryVerification verified successfully");
  } catch (error) {
    console.error("❌ Error verifying DeliveryVerification:", error);
  }

  console.log("🎉 Verification process completed.");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("🚨 Unexpected error:", error);
    process.exit(1);
  });
