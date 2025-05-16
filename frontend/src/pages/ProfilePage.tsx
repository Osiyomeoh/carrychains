import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAccount } from 'wagmi';
import { Identity, Name, Avatar, Address } from '@coinbase/onchainkit/identity';
import { WalletDropdownBasename } from '@coinbase/onchainkit/wallet';
import { Star, Package, MapPin, Calendar, Edit3, MessageCircle, Loader } from 'lucide-react';
import { useAppData } from '../contexts/AppDataContext';
import { UserProfile } from '../types'; // Make sure to import your types

const ProfilePage: React.FC = () => {
  // Update the type to make address optional
  const { address: paramAddress } = useParams<{ address?: string }>();
  const { address: currentUserAddress } = useAccount();
  const { state, loadUserProfile, isLoading, submitReview } = useAppData();
  const [activeTab, setActiveTab] = useState('routes');
  
  // Helper to ensure address is properly typed
  const asAddress = (addr: string | undefined): `0x${string}` | undefined => {
    if (!addr) return undefined;
    if (addr.startsWith('0x')) return addr as `0x${string}`;
    return `0x${addr}` as `0x${string}`;
  };
  
  // Get the address to display - if paramAddress is undefined, use currentUserAddress
  const userAddress = paramAddress || currentUserAddress;
  const isOwnProfile = !paramAddress || userAddress === currentUserAddress;
  
  // Load user profile data from blockchain when component mounts
  useEffect(() => {
    if (userAddress) {
      loadUserProfile(userAddress);
    }
  }, [userAddress, loadUserProfile]);
  
  // Get blockchain data for the user with proper type checking
  const userProfileFromChain: UserProfile | undefined = userAddress 
    ? (state.userProfiles[userAddress] || undefined)
    : undefined;
  
  // Get user's routes and deliveries
  const userRoutes = state.routes.filter(route => 
    route.traveler.toLowerCase() === (userAddress || '').toLowerCase() && route.isActive
  );
  
  const userDeliveriesAsTraveler = state.deliveries.filter(delivery => 
    delivery.traveler.toLowerCase() === (userAddress || '').toLowerCase()
  );
  
  const userDeliveriesAsShipper = state.deliveries.filter(delivery => 
    delivery.shipper.toLowerCase() === (userAddress || '').toLowerCase()
  );
  
  // Calculate profile metrics with proper null checks
  const rating = userProfileFromChain?.reputationScore || 0;
  const completedDeliveries = userDeliveriesAsTraveler.filter(d => d.status === 4).length + 
                              userDeliveriesAsShipper.filter(d => d.status === 4).length;
  const positiveReviews = userProfileFromChain?.positiveReviews || 0;
  const totalReviews = userProfileFromChain?.totalReviews || 0;
  const successRate = totalReviews > 0 ? Math.round((positiveReviews / totalReviews) * 100) : 0;
  
  // Combine static and blockchain data
  const profileData = {
    rating,
    completedDeliveries,
    successRate,
    joinedDate: '2024-01-15', // This could come from a database in the future
    bio: 'Experienced traveler and delivery partner. Always reliable and professional.',
    badges: [] as string[] // Explicitly type as string array to avoid 'never' type
  };
  
  // Generate badges based on blockchain data
  if (userProfileFromChain) {
    if (userProfileFromChain.reputationScore >= 90) profileData.badges.push('Top Rated');
    if (userDeliveriesAsTraveler.length + userDeliveriesAsShipper.length >= 10) profileData.badges.push('Experienced');
    if (userRoutes.length >= 5) profileData.badges.push('Frequent Traveler');
  }
  
  // Handle review submission
  const handleSubmitReview = (address: string, isPositive: boolean) => {
    if (submitReview) {
      submitReview(address, isPositive);
    }
  };
  
  // Show loading state while fetching data
  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="flex justify-center items-center py-20">
          <Loader className="h-8 w-8 animate-spin text-indigo-600" />
          <span className="ml-2 text-gray-600">Loading profile...</span>
        </div>
      </div>
    );
  }
  
  // Show prompt to connect wallet if no address
  if (!userAddress) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
          <h2 className="text-xl font-semibold mb-2">No Profile Found</h2>
          <p className="text-gray-600 mb-4">Please connect your wallet to view your profile.</p>
          <WalletDropdownBasename className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition" />
        </div>
      </div>
    );
  }
  
  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Profile Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-start justify-between">
          <Identity address={asAddress(userAddress)} className="flex items-center gap-6">
            <Avatar className="w-32 h-32 rounded-full border-4 border-white shadow-lg" />
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Name className="text-3xl font-bold" />
                {isOwnProfile && !profileData.bio && (
                  <WalletDropdownBasename className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition" />
                )}
              </div>
              <Address className="text-gray-500 text-sm mb-3" />
              
              {/* Profile Stats */}
              <div className="flex items-center gap-6 text-sm">
                <div className="flex items-center gap-1 text-yellow-500">
                  <Star className="h-4 w-4 fill-current" />
                  <span className="text-gray-900 font-medium">{profileData.rating}/100</span>
                </div>
                <div className="text-gray-600">
                  <span className="font-medium">{profileData.completedDeliveries}</span> deliveries
                </div>
                <div className="text-gray-600">
                  <span className="font-medium">{profileData.successRate}%</span> success rate
                </div>
                <div className="text-gray-500">
                  Member since {new Date(profileData.joinedDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                </div>
              </div>
            </div>
          </Identity>
          
          {/* Action Buttons */}
          <div className="flex gap-3">
            {!isOwnProfile && (
              <>
                <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition">
                  <MessageCircle className="h-4 w-4" />
                  Message
                </button>
                <button 
                  className="flex items-center gap-2 px-4 py-2 border border-green-500 text-green-600 rounded-md hover:bg-green-50 transition"
                  onClick={() => userAddress && handleSubmitReview(userAddress, true)}
                >
                  <Star className="h-4 w-4" />
                  Positive Review
                </button>
              </>
            )}
            {isOwnProfile && (
              <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition">
                <Edit3 className="h-4 w-4" />
                Edit Profile
              </button>
            )}
          </div>
        </div>
        
        {/* Bio */}
        {profileData.bio && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-gray-700">{profileData.bio}</p>
          </div>
        )}
        
        {/* Badges */}
        {profileData.badges.length > 0 && (
          <div className="mt-4 flex gap-2 flex-wrap">
            {profileData.badges.map((badge) => (
              <span key={badge} className="px-3 py-1 bg-indigo-100 text-indigo-800 text-xs rounded-full">
                {badge}
              </span>
            ))}
          </div>
        )}
      </div>
      
      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="border-b border-gray-200">
          <nav className="flex gap-6 px-6">
            <button
              onClick={() => setActiveTab('routes')}
              className={`py-4 text-sm font-medium border-b-2 transition ${
                activeTab === 'routes' 
                  ? 'border-indigo-600 text-indigo-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Active Routes
            </button>
            <button
              onClick={() => setActiveTab('deliveries')}
              className={`py-4 text-sm font-medium border-b-2 transition ${
                activeTab === 'deliveries' 
                  ? 'border-indigo-600 text-indigo-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Delivery History
            </button>
            <button
              onClick={() => setActiveTab('reviews')}
              className={`py-4 text-sm font-medium border-b-2 transition ${
                activeTab === 'reviews' 
                  ? 'border-indigo-600 text-indigo-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Reviews
            </button>
          </nav>
        </div>
        
        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'routes' && (
            <div className="space-y-4">
              {userRoutes.length > 0 ? (
                userRoutes.map(route => (
                  <div key={route.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-lg">
                          {route.departureLocation} to {route.destinationLocation}
                        </h3>
                        <div className="mt-2 text-sm text-gray-600">
                          <div className="flex items-center gap-1 mb-1">
                            <Calendar className="h-4 w-4" />
                            {new Date(route.departureTime * 1000).toLocaleString()} - 
                            {new Date(route.arrivalTime * 1000).toLocaleString()}
                          </div>
                          <div className="flex items-center gap-1">
                            <Package className="h-4 w-4" />
                            Available space: {route.availableSpace / 1000} kg
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-indigo-600">
                          {Number(route.pricePerKg) / 1000000} USDC/kg
                        </div>
                        {isOwnProfile && (
                          <button className="mt-2 text-sm text-gray-600 hover:text-indigo-600">
                            Manage Route
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-gray-500 py-12">
                  No active routes yet
                </div>
              )}
            </div>
          )}
          
          {activeTab === 'deliveries' && (
            <div className="space-y-4">
              {userDeliveriesAsTraveler.length > 0 || userDeliveriesAsShipper.length > 0 ? (
                <>
                  {userDeliveriesAsTraveler.length > 0 && (
                    <div>
                      <h3 className="font-semibold text-lg mb-3">As Traveler</h3>
                      {userDeliveriesAsTraveler.map(delivery => (
                        <div key={delivery.id} className="border border-gray-200 rounded-lg p-4 mb-3 hover:shadow-md transition">
                          <div className="flex justify-between">
                            <div>
                              <h4 className="font-medium">{delivery.packageDescription}</h4>
                              <p className="text-sm text-gray-600">Weight: {delivery.packageWeight / 1000} kg</p>
                              <p className="text-sm text-gray-600">Status: {getStatusLabel(delivery.status)}</p>
                            </div>
                            <div className="text-right">
                              <div className="font-bold text-indigo-600">{Number(delivery.totalPrice) / 1000000} USDC</div>
                              <p className="text-xs text-gray-500">{new Date(delivery.createdAt * 1000).toLocaleDateString()}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {userDeliveriesAsShipper.length > 0 && (
                    <div>
                      <h3 className="font-semibold text-lg mb-3">As Shipper</h3>
                      {userDeliveriesAsShipper.map(delivery => (
                        <div key={delivery.id} className="border border-gray-200 rounded-lg p-4 mb-3 hover:shadow-md transition">
                          <div className="flex justify-between">
                            <div>
                              <h4 className="font-medium">{delivery.packageDescription}</h4>
                              <p className="text-sm text-gray-600">Weight: {delivery.packageWeight / 1000} kg</p>
                              <p className="text-sm text-gray-600">Status: {getStatusLabel(delivery.status)}</p>
                            </div>
                            <div className="text-right">
                              <div className="font-bold text-indigo-600">{Number(delivery.totalPrice) / 1000000} USDC</div>
                              <p className="text-xs text-gray-500">{new Date(delivery.createdAt * 1000).toLocaleDateString()}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center text-gray-500 py-12">
                  No delivery history
                </div>
              )}
            </div>
          )}
          
          {activeTab === 'reviews' && (
            <div className="space-y-4">
              {userProfileFromChain ? (
                <div className="bg-gray-50 rounded-lg p-6">
                  <div className="text-center mb-4">
                    <h3 className="text-xl font-semibold mb-1">Reputation Score</h3>
                    <div className="text-4xl font-bold text-indigo-600">{userProfileFromChain.reputationScore}/100</div>
                  </div>
                  
                  <div className="flex justify-center gap-8 text-center">
                    <div>
                      <div className="text-2xl font-bold text-green-600">{userProfileFromChain.positiveReviews}</div>
                      <div className="text-sm text-gray-600">Positive Reviews</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-red-600">
                        {userProfileFromChain.totalReviews - userProfileFromChain.positiveReviews}
                      </div>
                      <div className="text-sm text-gray-600">Negative Reviews</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold">{userProfileFromChain.totalReviews}</div>
                      <div className="text-sm text-gray-600">Total Reviews</div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center text-gray-500 py-12">
                  No reviews yet
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Helper function to get status label
const getStatusLabel = (status: number) => {
  const statusLabels = [
    'Created',
    'Accepted',
    'Picked Up',
    'Delivered',
    'Completed',
    'Cancelled',
    'Disputed'
  ];
  return statusLabels[status] || 'Unknown';
};

export default ProfilePage;