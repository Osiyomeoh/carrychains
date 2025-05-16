import React from 'react';
import { Identity, Name, Avatar, Address } from '@coinbase/onchainkit/identity';

// Helper function to ensure proper address typing
const asAddress = (addr: string | undefined): `0x${string}` | undefined => {
  if (!addr) return undefined;
  if (addr.startsWith('0x')) return addr as `0x${string}`;
  return `0x${addr}` as `0x${string}`;
};

// Wrapper component for easy usage
interface IdentityWrapperProps {
  address: string | undefined;
  className?: string;
  showAvatar?: boolean;
  showName?: boolean;
  showAddress?: boolean;
  avatarSize?: 'sm' | 'md' | 'lg';
}

const IdentityWrapper: React.FC<IdentityWrapperProps> = ({
  address,
  className = "",
  showAvatar = true,
  showName = true,
  showAddress = false,
  avatarSize = 'md'
}) => {
  const typedAddress = asAddress(address);
  if (!typedAddress) return null;
  
  const avatarSizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };
  
  return (
    <Identity address={typedAddress} className={className}>
      {showAvatar && <Avatar className={avatarSizeClasses[avatarSize]} />}
      <div className="flex flex-col">
        {showName && <Name className={`font-medium ${avatarSize === 'lg' ? 'text-lg' : 'text-sm'}`} />}
        {showAddress && <Address className="text-xs text-gray-500" />}
      </div>
    </Identity>
  );
};

// Simplified usage examples
export const UserDisplay: React.FC<{ address: string | undefined }> = ({ address }) => (
  <IdentityWrapper address={address} className="flex items-center gap-2" />
);

export const UserProfile: React.FC<{ address: string | undefined }> = ({ address }) => (
  <IdentityWrapper 
    address={address} 
    className="flex items-center gap-3" 
    avatarSize="lg"
    showAddress={true}
  />
);

export const CompactUserDisplay: React.FC<{ address: string | undefined }> = ({ address }) => (
  <IdentityWrapper 
    address={address} 
    className="flex items-center gap-1" 
    avatarSize="sm"
  />
);

export default IdentityWrapper;