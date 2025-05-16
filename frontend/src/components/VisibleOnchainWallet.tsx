import React from 'react';
import { useAccount } from 'wagmi';
import {
  Wallet,
  WalletDropdown,
  WalletDropdownDisconnect,
  ConnectWallet,
  ConnectWalletText
} from '@coinbase/onchainkit/wallet';
import { Identity, Name, Avatar } from '@coinbase/onchainkit/identity';
import { Wallet as WalletIcon } from 'lucide-react';

interface VisibleOnchainWalletProps {
  className?: string;
}

const VisibleOnchainWallet: React.FC<VisibleOnchainWalletProps> = ({ className = "" }) => {
  const { isConnected, address } = useAccount();

  // Helper to ensure address is properly typed
  const asAddress = (addr: string | undefined): `0x${string}` | undefined => {
    if (!addr) return undefined;
    if (addr.startsWith('0x')) return addr as `0x${string}`;
    return `0x${addr}` as `0x${string}`;
  };

  if (!isConnected || !address) {
    // Show connect button when not connected
    return (
      <div className={className}>
        <Wallet>
          <ConnectWallet>
            <ConnectWalletText className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium transition duration-150">
              <WalletIcon size={16} />
              Connect Wallet
            </ConnectWalletText>
          </ConnectWallet>
        </Wallet>
      </div>
    );
  }

  // Show wallet info when connected
  return (
    <div className={className}>
      <Wallet>
        <div className="flex items-center gap-2 bg-gray-100 px-3 py-2 rounded-md">
          <Identity address={asAddress(address)} className="flex items-center gap-2">
            <Avatar className="w-6 h-6" />
            <Name className="text-sm font-medium" />
          </Identity>
        </div>
        <WalletDropdown>
          <div className="p-4 space-y-3">
            <Identity address={asAddress(address)} className="flex items-center gap-3">
              <Avatar className="w-12 h-12" />
              <div>
                <Name className="font-semibold" />
                <div className="text-xs text-gray-500">{address.slice(0, 6)}...{address.slice(-4)}</div>
              </div>
            </Identity>
            <WalletDropdownDisconnect 
              className="w-full p-2 text-center text-red-600 hover:bg-red-50 rounded"
              text="Disconnect"
            />
          </div>
        </WalletDropdown>
      </Wallet>
    </div>
  );
};

export default VisibleOnchainWallet;