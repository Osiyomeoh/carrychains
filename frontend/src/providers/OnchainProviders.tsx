// src/components/OnchainProviders.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { OnchainKitProvider } from '@coinbase/onchainkit';
import { WagmiConfig } from 'wagmi';
import { ReactNode } from 'react';
import { wagmiConfig, baseChain } from '../wagmi';

// Create a query client
const queryClient = new QueryClient();

// Define the chain for OnchainKit
const onchainKitChain = {
  id: baseChain.id,
  name: baseChain.name,
  network: baseChain.network,
  nativeCurrency: {
    name: baseChain.nativeCurrency.name,
    symbol: baseChain.nativeCurrency.symbol,
    decimals: baseChain.nativeCurrency.decimals,
  },
  rpcUrls: {
    default: {
      http: ['https://mainnet.base.org'],
    },
    public: {
      http: ['https://mainnet.base.org'],
    },
  },
  blockExplorers: {
    default: {
      name: 'BaseScan',
      url: 'https://basescan.org',
    },
  },
  testnet: false,
};

// CDP API Key from Coinbase Developer Platform
const CDP_API_KEY = process.env.REACT_APP_CDP_API_KEY || "";

interface OnchainProvidersProps {
  children: ReactNode;
}

export default function OnchainProviders({ children }: OnchainProvidersProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <WagmiConfig config={wagmiConfig}>
        <OnchainKitProvider
          apiKey={CDP_API_KEY}
          chain={onchainKitChain as any}
        >
          {children}
        </OnchainKitProvider>
      </WagmiConfig>
    </QueryClientProvider>
  );
}