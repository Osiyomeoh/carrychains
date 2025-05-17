// src/wagmi.ts
import { configureChains, createConfig } from 'wagmi';
import { CoinbaseWalletConnector } from 'wagmi/connectors/coinbaseWallet';
import { InjectedConnector } from 'wagmi/connectors/injected';
import { MetaMaskConnector } from 'wagmi/connectors/metaMask';
import { WalletConnectConnector } from 'wagmi/connectors/walletConnect';
import { base, baseSepolia } from 'wagmi/chains';
import { publicProvider } from 'wagmi/providers/public';
import { useMemo } from 'react';

// Export chains for use elsewhere
export const baseChain = base;
export const baseSepoliaChain = baseSepolia;

// Define project ID
const WC_PROJECT_ID = process.env.REACT_APP_WC_PROJECT_ID || '';

// Configure chains
const { chains, publicClient, webSocketPublicClient } = configureChains(
  [baseChain, baseSepoliaChain],
  [publicProvider()]
);

// Create connectors
const connectors = [
  new CoinbaseWalletConnector({
    chains,
    options: {
      appName: 'CarryChain',
      headlessMode: false,
    },
  }),
  new MetaMaskConnector({ chains }),
  new WalletConnectConnector({
    chains,
    options: {
      projectId: WC_PROJECT_ID,
    },
  }),
  new InjectedConnector({
    chains,
    options: {
      name: 'Injected',
      shimDisconnect: true,
    },
  }),
];

// Create config
export const wagmiConfig = createConfig({
  autoConnect: true,
  connectors,
  publicClient,
  webSocketPublicClient,
});