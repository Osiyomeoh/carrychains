// src/components/CustomWalletButton.tsx
import React, { useState } from 'react';
import { useAccount, useConnect, useDisconnect } from 'wagmi';

interface WalletButtonProps {
  className?: string;
}

const CustomWalletButton: React.FC<WalletButtonProps> = ({ className }) => {
  const { address, isConnected } = useAccount();
  const { connect, connectors, isLoading } = useConnect();
  const { disconnect } = useDisconnect();
  const [showMenu, setShowMenu] = useState(false);
  
  // Format address for display
  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };
  
  // Handle connector selection
  const handleConnect = (connector: any) => {
    connect({ connector });
    setShowMenu(false);
  };

  if (!isConnected) {
    return (
      <div className="relative">
        <button
          onClick={() => setShowMenu(!showMenu)}
          className={`bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded-lg ${className} ${isLoading ? 'opacity-70' : ''}`}
          disabled={isLoading}
        >
          {isLoading ? 'Connecting...' : 'Connect Wallet'}
        </button>
        
        {showMenu && (
          <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10 border border-gray-200">
            {connectors.map((connector) => (
              <button
                key={connector.id}
                onClick={() => handleConnect(connector)}
                disabled={!connector.ready}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                {connector.name}
                {!connector.ready && ' (unsupported)'}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setShowMenu(!showMenu)}
        className={`flex items-center bg-gray-100 hover:bg-gray-200 py-2 px-4 rounded-lg ${className}`}
      >
        <span className="text-sm font-medium">{address ? formatAddress(address) : 'Connected'}</span>
      </button>
      
      {showMenu && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10 border border-gray-200">
          <div className="px-4 py-3 border-b border-gray-100">
            <p className="text-sm font-medium">Connected as</p>
            <p className="text-xs text-gray-500 truncate">{address}</p>
          </div>
          <button
            onClick={() => disconnect()}
            className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
          >
            Disconnect
          </button>
        </div>
      )}
      
      {/* Click outside to close menu */}
      {showMenu && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setShowMenu(false)}
        />
      )}
    </div>
  );
};

export default CustomWalletButton;