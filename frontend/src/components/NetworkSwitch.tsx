import React, { useState } from 'react';
import { AlertCircle, Loader2, CheckCircle } from 'lucide-react';
import { useNetwork } from 'wagmi';
import { base, baseSepolia } from 'wagmi/chains';

interface NetworkSwitchProps {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
  className?: string;
}

const NetworkSwitch: React.FC<NetworkSwitchProps> = ({ onSuccess, onError, className = "" }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const { chain } = useNetwork();
  
  const isOnBase = chain?.id === base.id || chain?.id === baseSepolia.id;
  
  const switchToBase = async () => {
    if (!window.ethereum) {
      const error = new Error('No wallet found');
      onError?.(error);
      return;
    }

    setIsLoading(true);
    setStatus('idle');

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
      
      setStatus('success');
      onSuccess?.();
      
      // Reset status after 2 seconds
      setTimeout(() => setStatus('idle'), 2000);
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
          
          setStatus('success');
          onSuccess?.();
          
          // Reset status after 2 seconds
          setTimeout(() => setStatus('idle'), 2000);
        } catch (addError: any) {
          console.error('Error adding network:', addError);
          setStatus('error');
          onError?.(addError);
          
          // Reset status after 3 seconds
          setTimeout(() => setStatus('idle'), 3000);
        }
      } else {
        console.error('Error switching network:', switchError);
        setStatus('error');
        onError?.(switchError);
        
        // Reset status after 3 seconds
        setTimeout(() => setStatus('idle'), 3000);
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  if (isOnBase) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <div className="w-2 h-2 rounded-full bg-green-500" />
        <span className="text-sm text-green-600">Base Network</span>
      </div>
    );
  }
  
  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <div className="w-2 h-2 rounded-full bg-red-500" />
      <span className="text-sm text-gray-600">Wrong Network</span>
      
      <button
        onClick={switchToBase}
        disabled={isLoading}
        className={`
          px-3 py-1 text-xs rounded border flex items-center space-x-1
          ${isLoading || status === 'success' || status === 'error'
            ? 'border-gray-300 bg-gray-50'
            : 'border-blue-200 bg-blue-50 text-blue-600 hover:bg-blue-100'
          }
          disabled:opacity-50 disabled:cursor-not-allowed
        `}
      >
        {isLoading && <Loader2 className="h-3 w-3 animate-spin" />}
        {status === 'success' && <CheckCircle className="h-3 w-3 text-green-600" />}
        {status === 'error' && <AlertCircle className="h-3 w-3 text-red-600" />}
        <span>
          {isLoading ? 'Switching...' : 
           status === 'success' ? 'Switched!' :
           status === 'error' ? 'Failed' :
           'Switch to Base'}
        </span>
      </button>
    </div>
  );
};

export default NetworkSwitch;