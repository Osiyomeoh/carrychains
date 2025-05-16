// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const StablecoinAdapterModule = buildModule("StablecoinAdapterModule", (m) => {
  // Deploy the StablecoinAdapter contract
  const stablecoinAdapter = m.contract("StablecoinAdapter", []);

  return { stablecoinAdapter };
});

export default StablecoinAdapterModule;