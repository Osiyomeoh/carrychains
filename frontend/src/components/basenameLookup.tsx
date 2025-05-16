import React, { useState, useEffect } from 'react';
import { useWeb3 } from '../contexts/Web3Context';

interface BasenameLookupProps {
  address: string;
  showFull?: boolean;
}

const BasenameLookup: React.FC<BasenameLookupProps> = ({ address, showFull = false }) => {
  const [basename, setBasename] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { provider, chainId } = useWeb3();
  
  useEffect(() => {
    const fetchBasename = async () => {
      if (!address || !provider) {
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        setError(null);
        
        // Check if we're on Base network
        if (chainId !== 8453 && chainId !== 84531) {
          // Not on Base network, skip basename lookup
          setBasename(null);
          setLoading(false);
          return;
        }
        
        // Placeholder for actual basename lookup
        // In a real implementation, you would use:
        // 1. Coinbase's Basename resolution API
        // 2. Or OnchainKit's Identity component
        // 3. Or direct contract calls
        
        // For now, we'll check if the address has a contract
        const code = await provider.getCode(address);
        
        // Simulate a basename lookup delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // If it's a contract (has code), we might lookup a basename differently
        if (code !== '0x') {
          // This is a placeholder - in a real app, you'd make an API call or contract call
          setBasename(null);
        } else {
          // For regular addresses, try to resolve basename
          // This is where you'd integrate with actual basename service
          setBasename(null);
        }
        
      } catch (err) {
        console.error('Error fetching basename:', err);
        setError('Failed to resolve basename');
      } finally {
        setLoading(false);
      }
    };
    
    fetchBasename();
  }, [address, provider, chainId]);
  
  // Format address for display when no basename is found
  const formatAddress = (addr: string) => {
    if (!addr) return '';
    if (showFull) return addr;
    return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
  };
  
  // Show loading state
  if (loading) {
    return (
      <span className="inline-flex items-center text-gray-400">
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        Loading...
      </span>
    );
  }
  
  // Show error state
  if (error) {
    return <span className="text-red-500" title={address}>{formatAddress(address)}</span>;
  }
  
  // Show basename if found, otherwise show formatted address
  return (
    <span 
      title={basename ? `${basename} (${address})` : address}
      className="inline-flex items-center"
    >
      {basename ? (
        <span className="font-medium text-indigo-600">
          {basename}
        </span>
      ) : (
        <span className="font-mono text-gray-700">
          {formatAddress(address)}
        </span>
      )}
      {basename && !showFull && (
        <span className="ml-1 text-xs text-gray-400">
          ({formatAddress(address)})
        </span>
      )}
    </span>
  );
};

export default BasenameLookup;