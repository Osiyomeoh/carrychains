// Web3Context.tsx
import React, { createContext, useContext, ReactNode, useEffect, useState } from 'react';
import { ethers } from 'ethers';
import {
  useAccount,
  useConnect,
  useDisconnect,
  useNetwork,
  useSwitchNetwork,
  usePublicClient,
} from 'wagmi';
import { base, baseSepolia } from 'wagmi/chains';

// Type definition for Web3Context
interface Web3ContextType {
  account: string | null;
  provider: ethers.providers.Web3Provider | null;
  signer: ethers.Signer | null;
  chainId: number | null;
  connectWallet: () => Promise<void>;
  reconnectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  isConnecting: boolean;
  error: string | null;
}

// Create context
export const Web3Context = createContext<Web3ContextType | undefined>(undefined);

// Hook to use Web3Context
export const useWeb3 = () => {
  const context = useContext(Web3Context);
  if (context === undefined) {
    throw new Error('useWeb3 must be used within a Web3ContextProvider');
  }
  return context;
};

// Provider component
export const Web3ContextProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { address, isConnected } = useAccount();
  const { connect, connectors, isLoading, reset: resetConnect } = useConnect();
  const { disconnect } = useDisconnect();
  const { chain } = useNetwork();
  const { switchNetwork } = useSwitchNetwork();
  const publicClient = usePublicClient();
  
  // State for ethers compatibility
  const [provider, setProvider] = useState<ethers.providers.Web3Provider | null>(null);
  const [signer, setSigner] = useState<ethers.Signer | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Create ethers provider wrapper when connected
  useEffect(() => {
    const createProvider = async () => {
      // Only proceed if wallet is connected
      if (!isConnected || !window.ethereum) {
        if (provider || signer) {
          console.log("Wallet disconnected, clearing provider and signer");
          setProvider(null);
          setSigner(null);
        }
        return;
      }
      
      try {
        console.log("Creating provider from window.ethereum...");
        
        // Check if ethereum is accessible
        if (typeof window.ethereum === 'undefined') {
          throw new Error("No ethereum provider found. Please install MetaMask or Coinbase Wallet.");
        }
        
        // Request accounts only if we're connected (don't auto-prompt)
        if (isConnected) {
          try {
            const accounts = await window.ethereum.request({ method: 'eth_accounts' });
            if (!accounts || accounts.length === 0) {
              console.log("No accounts available, requesting accounts...");
              await window.ethereum.request({ method: 'eth_requestAccounts' });
            }
          } catch (requestErr) {
            console.warn("Failed to request accounts:", requestErr);
            // Continue anyway, the provider might still work
          }
        }
        
        // Create provider
        const ethersProvider = new ethers.providers.Web3Provider(window.ethereum, 'any');
        
        // Create signer only if we have an active connection
        if (isConnected && address) {
          try {
            const ethersSigner = ethersProvider.getSigner();
            const signerAddress = await ethersSigner.getAddress();
            
            console.log("Signer created with address:", signerAddress);
            
            // Verify it matches wagmi account
            if (address && signerAddress.toLowerCase() !== address.toLowerCase()) {
              console.warn("Signer address doesn't match wagmi account:", {
                signerAddress,
                wagmiAccount: address
              });
            }
            
            setProvider(ethersProvider);
            setSigner(ethersSigner);
          } catch (signerErr) {
            console.error("Failed to create signer:", signerErr);
            setProvider(ethersProvider);
            setSigner(null);
          }
        } else {
          // Set provider but no signer
          setProvider(ethersProvider);
          setSigner(null);
        }
      } catch (err: any) {
        console.error('Error creating provider:', err);
        setError(`Provider error: ${err.message}`);
        
        // Reset provider and signer on error
        setProvider(null);
        setSigner(null);
      }
    };
    
    createProvider();
    setIsInitialized(true);
  }, [isConnected, address]);
  
  // Connect wallet function with error handling for "already connected"
  const connectWallet = async () => {
    setError(null);
    
    // Only log, don't return early if already connected - we might need to reconnect
    if (isConnected && address) {
      console.log("Wallet appears to be connected:", address);
      
      // Try to refresh the signer if it's missing
      if (!signer && window.ethereum) {
        try {
          console.log("Refreshing signer...");
          const ethersProvider = new ethers.providers.Web3Provider(window.ethereum);
          const ethersSigner = ethersProvider.getSigner();
          setProvider(ethersProvider);
          setSigner(ethersSigner);
          return; // If successful, exit early
        } catch (refreshErr) {
          console.error("Error refreshing signer:", refreshErr);
          // Continue to reconnection attempt
        }
      } else {
        // If we have both address and signer, we're good to go
        return;
      }
    }
    
    try {
      // Find Coinbase Wallet connector if available for Smart Wallet support
      const cbConnector = connectors.find(c => c.id === 'coinbaseWallet');
      // Otherwise use MetaMask or any available connector
      const mmConnector = connectors.find(c => c.id === 'metaMask');
      const connector = cbConnector || mmConnector || connectors[0];
      
      if (connector) {
        console.log("Connecting with connector:", connector.name);
        
        // Reset connect state to avoid "already connected" error
        resetConnect();
        
        // Connect with selected connector
        await connect({ connector });
        
        // Check if we're on Base network
        if (chain?.id !== base.id && chain?.id !== baseSepolia.id && switchNetwork) {
          try {
            console.log("Switching to Base network...");
            await switchNetwork(base.id);
          } catch (switchErr: any) {
            console.error("Network switch error:", switchErr);
            // Continue anyway, don't block the connection
          }
        }
      } else {
        setError('No wallet connector found. Please install MetaMask or Coinbase Wallet.');
      }
    } catch (error: any) {
      console.error('Error connecting wallet:', error);
      
      // Handle the "already connected" error silently
      if (error.name === 'ConnectorAlreadyConnectedError') {
        console.log("Connector already connected - this is expected");
        // No need to show this as an error to the user
      } else {
        setError(error.message || 'Failed to connect wallet');
      }
    }
  };
  // Improved reconnect function with full reset
  const reconnectWallet = async () => {
    console.log("Reconnecting wallet...");
    
    // First disconnect properly
    disconnectWallet();
    
    // Reset wagmi connect state
    resetConnect();
    
    // Short delay to ensure disconnect completes
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Try to connect again
    await connectWallet();
  };
  
  // Enhanced disconnect function
  const disconnectWallet = () => {
    console.log("Disconnecting wallet...");
    disconnect();
    setProvider(null);
    setSigner(null);
    setError(null);
  };
  
  // Log status changes for debugging
  useEffect(() => {
    if (isInitialized) {
      console.log("Web3Context status:", {
        isConnected,
        address,
        hasProvider: !!provider,
        hasSigner: !!signer,
        chainId: chain?.id
      });
    }
  }, [isInitialized, isConnected, address, provider, signer, chain?.id]);
  
  // Context value
  const value: Web3ContextType = {
    account: address || null,
    provider,
    signer,
    chainId: chain?.id || null,
    connectWallet,
    reconnectWallet,
    disconnectWallet,
    isConnecting: isLoading,
    error,
  };
  
  return (
    <Web3Context.Provider value={value}>
      {children}
    </Web3Context.Provider>
  );
};

// Add window.ethereum TypeScript declaration
declare global {
  interface Window {
    ethereum?: any;
  }
}