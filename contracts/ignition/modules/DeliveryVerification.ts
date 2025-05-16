// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const DeliveryVerificationModule = buildModule("DeliveryVerificationModule", (m) => {
  // Get the marketplace address - you'll need to set this as a parameter
  // or deploy it together with the marketplace
  const marketplaceAddress = m.getParameter("marketplaceAddress", "0x0000000000000000000000000000000000000000");
  
  // Deploy the DeliveryVerification contract
  const deliveryVerification = m.contract("DeliveryVerification", [marketplaceAddress]);

  return { deliveryVerification };
});

export default DeliveryVerificationModule;