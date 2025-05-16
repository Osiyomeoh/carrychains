// src/components/WalletButton.tsx
import React from 'react';
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { Identity, Name, Avatar } from '@coinbase/onchainkit/identity';
import { WalletDropdownBasename } from '@coinbase/onchainkit/wallet';

interface WalletButtonProps {
  className?: string;
}

export default function WalletButton({ className }: WalletButtonProps) {
  const { address, isConnected } = useAccount();
  const { connect, connectors, isLoading: isConnecting } = useConnect();
  const { disconnect } = useDisconnect();

  // Helper to ensure address is properly typed
  const asAddress = (addr: string | undefined): `0x${string}` | undefined => {
    if (!addr) return undefined;
    if (addr.startsWith('0x')) return addr as `0x${string}`;
    return `0x${addr}` as `0x${string}`;
  };

  // Format address for display
  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const [showDropdown, setShowDropdown] = React.useState(false);

  const toggleDropdown = () => {
    setShowDropdown(!showDropdown);
  };

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = () => {
      setShowDropdown(false);
    };

    if (showDropdown) {
      document.addEventListener('click', handleClickOutside);
    }

    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [showDropdown]);

  if (isConnected && address) {
    return (
      <div className="relative flex items-center">
        <button 
          className={`flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 ${className}`}
          onClick={(e) => {
            e.stopPropagation();
            toggleDropdown();
          }}
        >
          <Identity address={asAddress(address)} className="flex items-center gap-2">
            <Avatar className="w-6 h-6 rounded-full" />
            {/* Remove the fallback prop and handle differently */}
            <Name className="text-sm" />
            {/* Add the formatted address separately */}
            <span className="text-sm text-gray-600">{formatAddress(address)}</span>
          </Identity>
        </button>
        
        {/* Dropdown menu */}
        {showDropdown && (
          <div className="mt-2 absolute right-0 top-full bg-white rounded-md shadow-lg border border-gray-200 py-1 z-10 w-48">
            <div className="px-4 py-2 border-b border-gray-100">
              <WalletDropdownBasename />
            </div>
            <button
              onClick={() => {
                disconnect();
                setShowDropdown(false);
              }}
              className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
            >
              Disconnect
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <button
      onClick={() => {
        const connector = connectors[0];
        if (connector) connect({ connector });
      }}
      disabled={isConnecting}
      className={`bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-6 rounded-lg transition-colors duration-150 ${className} ${
        isConnecting ? 'opacity-70' : ''
      }`}
    >
      {isConnecting ? 'Connecting...' : 'Connect Wallet'}
    </button>
  );
}