import React, { useEffect, useState } from 'react';
import { useNetwork } from 'wagmi';
import { AlertCircle } from 'lucide-react';

interface BaseNetworkCheckerProps {
  children: React.ReactNode;
  networkType?: 'mainnet' | 'sepolia';
}

const BaseNetworkChecker: React.FC<BaseNetworkCheckerProps> = ({ 
  children, 
  networkType = 'mainnet' 
}) => {
  const { chain } = useNetwork();
  const [isWrongNetwork, setIsWrongNetwork] = useState(false);
  
  // Base chainIds
  const baseMainnetChainId = 8453;
  const baseSepoliaChainId = 84532;
  
  // Use the appropriate chainId based on networkType
  const targetChainId = networkType === 'mainnet' ? baseMainnetChainId : baseSepoliaChainId;
  const chainHex = networkType === 'mainnet' ? '0x2105' : '0x14a34'; // Hex values for chainIds
  const networkName = networkType === 'mainnet' ? 'Base Mainnet' : 'Base Sepolia';
  const rpcUrl = networkType === 'mainnet' ? 'https://mainnet.base.org' : 'https://sepolia.base.org';
  const explorerUrl = networkType === 'mainnet' ? 'https://basescan.org/' : 'https://sepolia.basescan.org/';
  
  useEffect(() => {
    if (chain && chain.id !== targetChainId) {
      setIsWrongNetwork(true);
    } else {
      setIsWrongNetwork(false);
    }
  }, [chain, targetChainId]);
  
  const switchToBase = async () => {
    if (!window.ethereum) return;
    
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: chainHex }],
      });
    } catch (error: any) {
      console.error("Failed to switch network:", error);
      
      // If chain hasn't been added, try to add it
      if (error.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: chainHex,
                chainName: networkName,
                nativeCurrency: {
                  name: 'ETH',
                  symbol: 'ETH',
                  decimals: 18,
                },
                rpcUrls: [rpcUrl],
                blockExplorerUrls: [explorerUrl],
              },
            ],
          });
        } catch (addError) {
          console.error("Failed to add Base network:", addError);
        }
      }
    }
  };
  
  if (!isWrongNetwork) return <>{children}</>;
  
  return (
    <>
      <div className="bg-yellow-900/30 border border-yellow-600 text-yellow-200 px-4 py-3 rounded-lg mb-6 flex items-center justify-between">
        <div className="flex items-center">
          <AlertCircle className="w-5 h-5 mr-2 text-yellow-400" />
          <span>Please connect to {networkName} to use CarryChain</span>
        </div>
        <button
          onClick={switchToBase}
          className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-md text-sm"
        >
          Switch Network
        </button>
      </div>
      {children}
    </>
  );
};

export default BaseNetworkChecker;