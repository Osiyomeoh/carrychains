import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useWeb3 } from '../contexts/Web3Context';
import { useAppData } from '../contexts/AppDataContext';
import { TravelRoute } from '../types';
import { ethers } from 'ethers';
import { 
  Calendar, 
  MapPin, 
  DollarSign, 
  Package, 
  AlertCircle, 
  CheckCircle, 
  Info,
  Loader,
  User,
  ArrowLeft,
  ChevronRight,
  BookOpen,
  FileText,
  Clock,
  CircleDollarSign
} from 'lucide-react';
import BaseNetworkChecker from '../components/BaseNetworkChecker';
import CustomWalletButton from '../components/CustomWalletButton';

// Import from local abis directory
import CarryChainMarketplaceABI from '../abis/CarryChainMarketplace.json';

// Contract addresses
const MARKETPLACE_ADDRESS = process.env.REACT_APP_MARKETPLACE_ADDRESS || '';

// Change this to 'mainnet' or 'sepolia' based on your deployment
type NetworkType = 'mainnet' | 'sepolia';
const NETWORK_TYPE: NetworkType = 'sepolia';

const isMainnet = (network: NetworkType): network is 'mainnet' => network === 'mainnet';

const RouteDetailsPage: React.FC = () => {
  const navigate = useNavigate();
  const { routeId } = useParams<{ routeId: string }>();
  const { account, provider, signer, connectWallet, chainId } = useWeb3();
  const { state, loadUserProfile, createDelivery, isLoading, error: contextError } = useAppData();
  
  const [route, setRoute] = useState<TravelRoute | null>(null);
  const [travelerProfile, setTravelerProfile] = useState<any>(null);
  const [packageDescription, setPackageDescription] = useState('');
  const [packageWeight, setPackageWeight] = useState('');
  const [formError, setFormError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [loadingRoute, setLoadingRoute] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Constants for pricing calculations
  const PLATFORM_FEE_PERCENT = 5; // 5% platform fee
  const NETWORK_FEE_USDC = 0.5; // Fixed $0.50 network fee
  
  useEffect(() => {
    const loadRouteDetails = async () => {
      if (!routeId) return;
      
      try {
        setLoadingRoute(true);
        setError(null);
        
        // Find route in state or load from API/blockchain
        const foundRoute = state.routes.find(r => r.id === parseInt(routeId));
        
        if (foundRoute) {
          setRoute(foundRoute);
          // Load traveler profile
          if (foundRoute.traveler) {
            await loadUserProfile(foundRoute.traveler);
          }
        } else if (provider) {
          // If not in state, try to fetch from blockchain
          try {
            const marketplaceContract = getMarketplaceContract();
            const routeData = await marketplaceContract.getRoute(parseInt(routeId));
            
            // Transform blockchain data to match our expected format
            const transformedRoute = {
              id: parseInt(routeId),
              traveler: routeData.traveler,
              departureLocation: routeData.departureLocation,
              destinationLocation: routeData.destinationLocation,
              departureTime: routeData.departureTime.toNumber(),
              arrivalTime: routeData.arrivalTime.toNumber(),
              availableSpace: routeData.availableSpace.toNumber(),
              pricePerKg: routeData.pricePerKg.toNumber(),
              isActive: routeData.isActive
            };
            
            setRoute(transformedRoute);
            
            // Load traveler profile
            if (routeData.traveler) {
              await loadUserProfile(routeData.traveler);
            }
          } catch (contractError) {
            console.error("Error fetching route from blockchain:", contractError);
            
            // Fallback to placeholder data for demo
            setRoute({
              id: parseInt(routeId),
              traveler: '0x123...456',
              departureLocation: 'Lagos, Nigeria',
              destinationLocation: 'Accra, Ghana',
              departureTime: Math.floor(Date.now() / 1000) + 86400, // Tomorrow
              arrivalTime: Math.floor(Date.now() / 1000) + 172800, // Day after tomorrow
              availableSpace: 5000, // 5kg in grams
              pricePerKg: 5000000, // 5 USDC in smallest unit (6 decimals)
              isActive: true
            });
          }
        }
      } catch (err) {
        console.error("Error loading route:", err);
        setError("Failed to load route details");
      } finally {
        setLoadingRoute(false);
      }
    };
    
    loadRouteDetails();
  }, [routeId, state.routes, loadUserProfile, provider]);
  
  // Get the marketplace contract instance
  const getMarketplaceContract = (withSigner = false) => {
    if (!provider) throw new Error("Provider not available");
    
    return new ethers.Contract(
      MARKETPLACE_ADDRESS,
      CarryChainMarketplaceABI.abi,
      withSigner && signer ? signer : provider
    );
  };
  
  const handleBookSpace = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!account) {
      connectWallet();
      return;
    }
    
    if (!route) {
      setFormError("Route details not available");
      return;
    }
    
    if (!signer) {
      setFormError("Wallet not properly connected");
      return;
    }
    
    // Form validation
    if (!packageDescription.trim()) {
      setFormError('Package description is required');
      return;
    }
    
    if (!packageWeight || isNaN(parseFloat(packageWeight)) || parseFloat(packageWeight) <= 0) {
      setFormError('Valid package weight is required');
      return;
    }
    
    const weightInGrams = Math.floor(parseFloat(packageWeight) * 1000);
    
    if (weightInGrams > route.availableSpace) {
      setFormError(`Maximum available space is ${route.availableSpace / 1000} kg`);
      return;
    }
    
    setFormError('');
    setIsSubmitting(true);
    
    try {
      // Calculate the total cost in USDC (smallest unit)
      const totalCostInUSDC = Math.floor(calculateTotalCost() * 1000000);
      
      console.log("Creating delivery with parameters:", {
        routeId: route.id,
        packageDescription,
        weightInGrams,
        totalCostInUSDC
      });
      
      // Pass the necessary parameters to createDelivery
      const success = await createDelivery(
        route.id,
        packageDescription,
        weightInGrams
      );
      
      if (success) {
        setSuccess(true);
        // Navigate to My Deliveries page after a short delay
        setTimeout(() => {
          navigate('/my-deliveries');
        }, 3000);
      } else {
        throw new Error("Transaction failed");
      }
    } catch (error: any) {
      console.error("Error booking space:", error);
      
      // Show a more user-friendly error message
      let errorMessage = 'Failed to book space';
      
      if (error.message) {
        if (error.message.includes('USDC balance')) {
          errorMessage = error.message; // Use the specific USDC balance error
        } else if (error.message.includes('approval')) {
          errorMessage = error.message; // Use the specific approval error
        } else if (error.message.includes('gas')) {
          errorMessage = "Not enough ETH for transaction fees. Please add more ETH to your wallet.";
        } else if (error.message.includes('rejected')) {
          errorMessage = "You rejected the transaction. Please try again and approve the transaction.";
        } else {
          errorMessage = error.message; // Use the provided error message
        }
      }
      
      setFormError(errorMessage);
      setSuccess(false);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Calculate base price (price per kg * weight)
  const calculateBasePrice = () => {
    if (!route || !packageWeight || isNaN(parseFloat(packageWeight))) return 0;
    
    const weightInKg = parseFloat(packageWeight);
    // Convert from smallest unit (with 6 decimals) to USDC
    return (weightInKg * route.pricePerKg) / 1000000;
  };
  
  // Calculate platform fee (5% of base price)
  const calculatePlatformFee = () => {
    const basePrice = calculateBasePrice();
    return basePrice * (PLATFORM_FEE_PERCENT / 100);
  };
  
  // Calculate network fee (fixed $0.50 USDC)
  const calculateNetworkFee = () => {
    return packageWeight ? NETWORK_FEE_USDC : 0;
  };
  
  // Calculate total cost (base price + platform fee + network fee)
  const calculateTotalCost = () => {
    const basePrice = calculateBasePrice();
    const platformFee = calculatePlatformFee();
    const networkFee = calculateNetworkFee();
    
    return basePrice + platformFee + networkFee;
  };
  
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  const formatAddress = (address: string) => {
    if (!address) return '';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };
  
  // Check if the wallet is on the correct network
  const isCorrectNetwork = () => {
    const targetChainId = isMainnet(NETWORK_TYPE) ? 8453 : 84532;
    return chainId === targetChainId;
  };
  
  if (loadingRoute) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader className="w-12 h-12 text-indigo-600 animate-spin" />
      </div>
    );
  }
  
  if (!route) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="bg-gray-800 rounded-xl shadow-lg overflow-hidden p-8 text-center border border-gray-700">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Route Not Found</h1>
          <p className="text-gray-300 mb-6">The route you're looking for does not exist or is no longer active.</p>
          <Link to="/find-routes" className="text-indigo-400 hover:text-indigo-300 font-medium">
            Back to Available Routes
          </Link>
        </div>
      </div>
    );
  }
  
  // Show error if there is one
  const displayError = formError || error || contextError;
  
  return (
    <BaseNetworkChecker networkType={NETWORK_TYPE}>
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Link to="/find-routes" className="text-indigo-400 hover:text-indigo-300 font-medium flex items-center">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Available Routes
          </Link>
        </div>
        
        {/* Main Route Card */}
        <div className="bg-gray-800 rounded-xl shadow-lg overflow-hidden p-6 mb-6 border border-gray-700">
          <div className="flex flex-col md:flex-row">
            <div className="md:w-2/3 md:pr-6">
              <h1 className="text-2xl font-bold text-white mb-4 flex items-center">
                <MapPin className="w-6 h-6 text-indigo-400 mr-2" />
                Route Details
              </h1>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <div className="flex items-start mb-4">
                    <div className="bg-indigo-900/40 rounded-full p-2 mr-3 border border-indigo-700">
                      <MapPin className="w-5 h-5 text-indigo-400" />
                    </div>
                    <div>
                      <div className="text-sm text-gray-400">From</div>
                      <div className="font-semibold text-lg text-white">{route.departureLocation}</div>
                      <div className="text-gray-300">
                        {formatDate(route.departureTime)}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="bg-green-900/40 rounded-full p-2 mr-3 border border-green-700">
                      <MapPin className="w-5 h-5 text-green-400" />
                    </div>
                    <div>
                      <div className="text-sm text-gray-400">To</div>
                      <div className="font-semibold text-lg text-white">{route.destinationLocation}</div>
                      <div className="text-gray-300">
                        {formatDate(route.arrivalTime)}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div>
                  <div className="flex items-center mb-4">
                    <div className="bg-indigo-900/40 rounded-full p-2 mr-3 border border-indigo-700">
                      <Package className="w-5 h-5 text-indigo-400" />
                    </div>
                    <div>
                      <div className="text-sm text-gray-400">Available Space</div>
                      <div className="font-semibold text-lg text-white">{(route.availableSpace / 1000).toFixed(1)} kg</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <div className="bg-indigo-900/40 rounded-full p-2 mr-3 border border-indigo-700">
                      <DollarSign className="w-5 h-5 text-indigo-400" />
                    </div>
                    <div>
                      <div className="text-sm text-gray-400">Price per kg</div>
                      <div className="font-semibold text-lg text-white">{(route.pricePerKg / 1000000).toFixed(2)} USDC</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Traveler Info Section */}
            <div className="md:w-1/3 mt-6 md:mt-0 md:border-l md:pl-6 border-gray-700">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center">
                <User className="w-5 h-5 text-indigo-400 mr-2" />
                Traveler
              </h2>
              
              <div className="mb-4">
                <Link to={`/profile/${route.traveler}`} className="text-indigo-400 hover:text-indigo-300 font-medium">
                  {formatAddress(route.traveler)}
                </Link>
              </div>
              
              {travelerProfile ? (
                <div className="bg-gray-900/60 p-3 rounded-lg border border-gray-700">
                  <div className="text-sm text-gray-400 mb-1">Reputation Score</div>
                  <div className="flex items-center">
                    <div 
                      className={`text-lg font-semibold ${
                        travelerProfile.reputationScore >= 70 
                          ? 'text-green-400' 
                          : travelerProfile.reputationScore >= 40 
                            ? 'text-yellow-400' 
                            : 'text-red-400'
                      }`}
                    >
                      {travelerProfile.reputationScore}%
                    </div>
                    <div className="text-gray-300 text-sm ml-2">
                      ({travelerProfile.positiveReviews}/{travelerProfile.totalReviews})
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-gray-900/60 p-3 rounded-lg border border-gray-700">
                  <div className="text-sm text-gray-400">No reputation data available</div>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Success Message */}
        {success && (
          <div className="bg-green-900/30 border border-green-600 text-green-200 px-4 py-3 rounded-lg mb-6 flex items-center">
            <CheckCircle className="w-5 h-5 mr-2 text-green-400" />
            <div>
              <span className="font-semibold">Success!</span>
              <span className="ml-2">Your delivery has been booked. Redirecting to My Deliveries...</span>
            </div>
          </div>
        )}
        
        {/* Errors and Warnings */}
        {!success && (
          <>
            {displayError && (
              <div className="bg-red-900/30 border border-red-600 text-red-200 px-4 py-3 rounded-lg mb-6 flex items-center">
                <AlertCircle className="w-5 h-5 mr-2 text-red-400" />
                <span>{displayError}</span>
              </div>
            )}
            
            {/* Booking Form Section */}
            <div className="bg-gray-800 rounded-xl shadow-lg overflow-hidden p-6 border border-gray-700">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center">
                <BookOpen className="w-5 h-5 text-indigo-400 mr-2" />
                Book Available Space
              </h2>
              
              {!showForm ? (
                <div className="text-center py-8">
                  <button
                    onClick={() => setShowForm(true)}
                    className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white font-bold py-3 px-8 rounded-lg shadow-lg shadow-purple-500/20 hover:shadow-xl transition-shadow duration-150"
                  >
                    Book Space Now
                  </button>
                </div>
              ) : (
                <>
                  {!account ? (
                    <div className="text-center py-8">
                      <p className="text-gray-300 mb-4">Connect your wallet to book space on this route</p>
                      <CustomWalletButton className="px-6 py-3 text-lg mx-auto" />
                    </div>
                  ) : (
                    <form onSubmit={handleBookSpace} className="space-y-6">
                      <div>
                        <label className="block text-gray-200 font-semibold mb-2">
                          Package Description
                        </label>
                        <textarea
                          value={packageDescription}
                          onChange={(e) => setPackageDescription(e.target.value)}
                          placeholder="Describe your package (contents, size, special handling instructions)"
                          rows={3}
                          className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white placeholder-gray-400"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-gray-200 font-semibold mb-2">
                          Package Weight (kg)
                        </label>
                        <input
                          type="number"
                          value={packageWeight}
                          onChange={(e) => setPackageWeight(e.target.value)}
                          min="0.1"
                          step="0.1"
                          max={(route.availableSpace / 1000).toString()}
                          placeholder={`Max: ${(route.availableSpace / 1000).toFixed(1)} kg`}
                          className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white placeholder-gray-400"
                        />
                      </div>
                      
                      {/* Cost Breakdown */}
                      <div className="bg-gray-900/60 p-4 rounded-lg border border-gray-700">
                        <h3 className="font-semibold text-white mb-2">Cost Breakdown</h3>
                        <div className="flex justify-between mb-1">
                          <span className="text-gray-300">Base Price:</span>
                          <span className="text-white">{calculateBasePrice().toFixed(2)} USDC</span>
                        </div>
                        <div className="flex justify-between mb-1">
                          <span className="text-gray-300">Platform Fee ({PLATFORM_FEE_PERCENT}%):</span>
                          <span className="text-white">{calculatePlatformFee().toFixed(2)} USDC</span>
                        </div>
                        <div className="flex justify-between mb-2">
                          <span className="text-gray-300">Network Fee:</span>
                          <span className="text-white">{calculateNetworkFee().toFixed(2)} USDC</span>
                        </div>
                        <div className="flex justify-between font-bold border-t border-gray-600 pt-2">
                          <span className="text-gray-200">Total:</span>
                          <span className="text-white">{calculateTotalCost().toFixed(2)} USDC</span>
                        </div>
                      </div>
                      
                      {/* Terms Notice */}
                      <div className="flex items-center p-4 bg-indigo-900/30 text-indigo-200 rounded-lg border border-indigo-700">
                        <Info className="w-5 h-5 mr-2 flex-shrink-0 text-indigo-400" />
                        <p className="text-sm">
                          By booking this space, you agree to the CarryChain terms of service. Payment will be held in escrow until the delivery is confirmed.
                        </p>
                      </div>
                      
                      {/* Action Buttons */}
                      <div className="flex justify-end space-x-4">
                        <button
                          type="button"
                          onClick={() => setShowForm(false)}
                          className="bg-gray-700 hover:bg-gray-600 text-gray-200 font-medium py-2 px-6 rounded-lg transition-colors duration-150 border border-gray-600"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={isSubmitting || !account || !isCorrectNetwork()}
                          className={`
                            ${isSubmitting || !account || !isCorrectNetwork()
                              ? 'bg-indigo-800/50 cursor-not-allowed'
                              : 'bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:shadow-lg hover:shadow-purple-500/20'
                            } text-white font-bold py-2 px-6 rounded-lg transition-all duration-150 flex items-center
                          `}
                        >
                          {isSubmitting ? (
                            <>
                              <Loader className="w-5 h-5 mr-2 animate-spin" />
                              Processing...
                            </>
                          ) : (
                            <>
                              Book Now
                              <CircleDollarSign className="w-5 h-5 ml-2" />
                            </>
                          )}
                        </button>
                      </div>
                    </form>
                  )}
                </>
              )}
            </div>
            
            {/* Transaction History section */}
            {account && route && (
              <div className="mt-6 bg-gray-800 rounded-xl shadow-lg overflow-hidden p-6 border border-gray-700">
                <h2 className="text-xl font-bold text-white mb-4 flex items-center">
                  <Clock className="w-5 h-5 text-indigo-400 mr-2" />
                  Transaction History
                </h2>
                
                {/* Transaction history would be loaded from blockchain or context */}
                <div className="text-gray-400 text-sm italic">
                  No transaction history yet for this route.
                </div>
              </div>
            )}
          </>
        )}
        
        {/* Developer debug section - only in development */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-6 bg-gray-900/60 rounded-xl p-4 text-sm font-mono border border-gray-700">
            <h3 className="font-bold mb-2 text-white">Debug Info:</h3>
            <div className="text-gray-300">Route ID: {routeId}</div>
            <div className="text-gray-300">Connected Account: {account || 'Not connected'}</div>
            <div className="text-gray-300">Network: {chainId ? `${chainId} (${isCorrectNetwork() ? isMainnet(NETWORK_TYPE) ? 'Base Mainnet' : 'Base Sepolia' : 'Unsupported'})` : 'Unknown'}</div>
            <div className="text-gray-300">Has Provider: {provider ? 'Yes' : 'No'}</div>
            <div className="text-gray-300">Has Signer: {signer ? 'Yes' : 'No'}</div>
            <div className="text-gray-300">Contract Address: {MARKETPLACE_ADDRESS}</div>
          </div>
        )}
      </div>
    </BaseNetworkChecker>
  );
};

export default RouteDetailsPage;