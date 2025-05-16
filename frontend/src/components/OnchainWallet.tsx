import React from 'react';
import {
  Wallet,
  WalletDefault,
  WalletDropdown,
  WalletDropdownDisconnect,
  ConnectWallet
} from '@coinbase/onchainkit/wallet';

interface MinimalOnchainWalletProps {
  className?: string;
}

const MinimalOnchainWallet: React.FC<MinimalOnchainWalletProps> = ({ 
  className = "" 
}) => {
  return (
    <div className={`onchain-wallet ${className}`}>
      <Wallet>
        <ConnectWallet />
        <WalletDropdown>
          <WalletDropdownDisconnect />
        </WalletDropdown>
      </Wallet>
    </div>
  );
};

export default MinimalOnchainWallet;