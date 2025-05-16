import React, { createContext, useContext, ReactNode, useEffect, useState } from 'react';
import { ethers } from 'ethers';
import { 
  useAccount, 
  useConnect, 
  useDisconnect, 
  useSendTransaction, 
  useNetwork,
} from 'wagmi';
import { base, baseSepolia } from 'wagmi/chains';

interface SmartWalletContextType {
  isConnected: boolean;
  address: string | undefined;
  isConnecting: boolean;
  connect: () => void;
  disconnect: () => void;
  sendTransaction: any;
  isLoading: boolean;
  hash?: string;
  error: Error | null;
  isSmartWallet: boolean;
  isCheckingWalletType: boolean;
  chainId: number | undefined;
  switchToBase: () => Promise<void>;
}

const SmartWalletContext = createContext<SmartWalletContextType | undefined>(undefined);

export const SmartWalletProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { address, isConnected, connector } = useAccount();
  const { connect, connectors, isLoading: isConnecting } = useConnect();
  const { disconnect } = useDisconnect();
  const { sendTransaction, data: hash, isLoading, error } = useSendTransaction();
  const { chain } = useNetwork();
  
  // State for Smart Wallet detection
  const [isSmartWallet, setIsSmartWallet] = useState(false);
  const [isCheckingWalletType, setIsCheckingWalletType] = useState(false);
  
  // Check if connected wallet is a Smart Wallet
  useEffect(() => {
    const checkWalletType = async () => {
      if (address && isConnected) {
        setIsCheckingWalletType(true);
        try {
          // Method 1: Check if address is a contract
          if (window.ethereum) {
            const provider = new ethers.providers.Web3Provider(window.ethereum);
            const code = await provider.getCode(address);
            
            // Method 2: Check connector type
            const isCoinbase = connector?.id === 'coinbaseWalletSDK' || connector?.name === 'Coinbase Wallet';
            
            // If address has contract code OR it's Coinbase Wallet, it might be Smart Wallet
            setIsSmartWallet(code !== '0x' || isCoinbase);
          }
        } catch (error) {
          console.error('Error checking wallet type:', error);
        } finally {
          setIsCheckingWalletType(false);
        }
      } else {
        setIsSmartWallet(false);
      }
    };

    checkWalletType();
  }, [address, isConnected, connector]);
  
  // Enhanced switch to Base network function
  const switchToBase = async () => {
    if (!window.ethereum) {
      console.error('No wallet found');
      return;
    }

    const baseConfig = {
      chainId: '0x2105', // Base mainnet in hex
      chainName: 'Base',
      nativeCurrency: {
        name: 'Ether',
        symbol: 'ETH',
        decimals: 18,
      },
      rpcUrls: ['https://mainnet.base.org'],
      blockExplorerUrls: ['https://basescan.org'],
    };

    try {
      // First try to switch to the network
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: baseConfig.chainId }],
      });
    } catch (switchError: any) {
      // This error code indicates that the chain has not been added to the wallet
      if (switchError.code === 4902) {
        try {
          // Add the Base network to the wallet
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [baseConfig],
          });
          
          // Try switching again after adding
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: baseConfig.chainId }],
          });
        } catch (addError) {
          console.error('Error adding network:', addError);
        }
      } else {
        console.error('Error switching network:', switchError);
      }
    }
  };
  
  // Connect to Coinbase Wallet (which may be Smart Wallet)
  const connectWallet = async () => {
    // Find Coinbase connector
    const coinbaseConnector = connectors.find(
      (c) => c.name === 'Coinbase Wallet' || c.id === 'coinbaseWallet'
    );
    
    if (coinbaseConnector) {
      try {
        await connect({ connector: coinbaseConnector });
        
        // After connecting, check if we need to switch to Base
        if (chain?.id !== base.id && chain?.id !== baseSepolia.id) {
          await switchToBase();
        }
      } catch (error) {
        console.error('Error connecting wallet:', error);
      }
    } else {
      console.error('Coinbase Wallet connector not found');
    }
  };
  
  return (
    <SmartWalletContext.Provider
      value={{
        isConnected,
        address,
        isConnecting,
        connect: connectWallet,
        disconnect,
        sendTransaction,
        isLoading,
        hash: hash as string | undefined,
        error,
        isSmartWallet,
        isCheckingWalletType,
        chainId: chain?.id,
        switchToBase,
      }}
    >
      {children}
    </SmartWalletContext.Provider>
  );
};

export const useSmartWallet = () => {
  const context = useContext(SmartWalletContext);
  if (context === undefined) {
    throw new Error('useSmartWallet must be used within a SmartWalletProvider');
  }
  return context;
};