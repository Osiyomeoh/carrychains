import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useWeb3 } from '../contexts/Web3Context';
import { useAppData } from '../contexts/AppDataContext';
import { TravelRoute } from '../types';
import { ethers } from 'ethers';

// Import from local abis directory instead of artifacts
import CarryChainMarketplaceABI from '../abis/CarryChainMarketplace.json';

// Contract addresses
const MARKETPLACE_ADDRESS = process.env.REACT_APP_MARKETPLACE_ADDRESS || '';

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
      
      // Pass either 3 or 4 params based on your function signature
      // If your createDelivery accepts 4 params:
      const success = await createDelivery(
        route.id,
        packageDescription,
        weightInGrams,

      );
      
      /* If your createDelivery only accepts 3 params:
      const success = await createDelivery(
        route.id,
        packageDescription,
        weightInGrams
      );
      */
      
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
    return chainId === 8453 || chainId === 84532; // Base Mainnet or Base Sepolia
  };
  
  if (loadingRoute) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }
  
  if (!route) {
    return (
      <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-md overflow-hidden p-8 text-center">
        <svg className="w-12 h-12 text-red-500 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Route Not Found</h1>
        <p className="text-gray-600 mb-6">The route you're looking for does not exist or is no longer active.</p>
        <Link to="/find-routes" className="text-indigo-600 hover:text-indigo-800 font-medium">
          Back to Available Routes
        </Link>
      </div>
    );
  }
  
  // Show error if there is one
  const displayError = formError || error || contextError;
  
  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <Link to="/find-routes" className="text-indigo-600 hover:text-indigo-800 font-medium flex items-center">
          <svg className="w-4 h-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Available Routes
        </Link>
      </div>
      
      <div className="bg-white rounded-xl shadow-md overflow-hidden p-6 mb-6">
        <div className="flex flex-col md:flex-row">
          <div className="md:w-2/3 md:pr-6">
            <h1 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
              <svg className="w-6 h-6 text-indigo-600 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
              Route Details
            </h1>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <div className="flex items-start mb-4">
                  <div className="bg-indigo-100 rounded-full p-2 mr-3">
                    <svg className="w-5 h-5 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">From</div>
                    <div className="font-semibold text-lg">{route.departureLocation}</div>
                    <div className="text-gray-600">
                      {formatDate(route.departureTime)}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="bg-green-100 rounded-full p-2 mr-3">
                    <svg className="w-5 h-5 text-green-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">To</div>
                    <div className="font-semibold text-lg">{route.destinationLocation}</div>
                    <div className="text-gray-600">
                      {formatDate(route.arrivalTime)}
                    </div>
                  </div>
                </div>
              </div>
              
              <div>
                <div className="flex items-center mb-4">
                  <div className="bg-indigo-100 rounded-full p-2 mr-3">
                    <svg className="w-5 h-5 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Available Space</div>
                    <div className="font-semibold text-lg">{(route.availableSpace / 1000).toFixed(1)} kg</div>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <div className="bg-indigo-100 rounded-full p-2 mr-3">
                    <svg className="w-5 h-5 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Price per kg</div>
                    <div className="font-semibold text-lg">{(route.pricePerKg / 1000000).toFixed(2)} USDC</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="md:w-1/3 mt-6 md:mt-0 md:border-l md:pl-6 border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <svg className="w-5 h-5 text-indigo-600 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Traveler
            </h2>
            
            <div className="mb-4">
              <Link to={`/profile/${route.traveler}`} className="text-indigo-600 hover:text-indigo-800 font-medium">
                {formatAddress(route.traveler)}
              </Link>
            </div>
            
            {travelerProfile ? (
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="text-sm text-gray-500 mb-1">Reputation Score</div>
                <div className="flex items-center">
                  <div 
                    className={`text-lg font-semibold ${
                      travelerProfile.reputationScore >= 70 
                        ? 'text-green-600' 
                        : travelerProfile.reputationScore >= 40 
                          ? 'text-yellow-600' 
                          : 'text-red-600'
                    }`}
                  >
                    {travelerProfile.reputationScore}%
                  </div>
                  <div className="text-gray-500 text-sm ml-2">
                    ({travelerProfile.positiveReviews}/{travelerProfile.totalReviews})
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="text-sm text-gray-500">No reputation data available</div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {success ? (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-md mb-6 flex items-center">
          <svg className="w-5 h-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <span className="font-semibold">Success!</span>
            <span className="ml-2">Your delivery has been booked. Redirecting to My Deliveries...</span>
          </div>
        </div>
      ) : (
        <>
          {displayError && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md mb-6 flex items-center">
              <svg className="w-5 h-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{displayError}</span>
            </div>
          )}
          
          {/* Network warning if not on Base */}
          {account && !isCorrectNetwork() && (
            <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded-md mb-6 flex items-center">
              <svg className="w-5 h-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span>Please switch to Base network to book this route</span>
            </div>
          )}
          
          <div className="bg-white rounded-xl shadow-md overflow-hidden p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
              <svg className="w-5 h-5 text-indigo-600 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
              Book Available Space
            </h2>
            
            {!showForm ? (
              <div className="text-center py-8">
                <button
                  onClick={() => setShowForm(true)}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-8 rounded-lg shadow-md transition-colors duration-150"
                >
                  Book Space Now
                </button>
              </div>
            ) : (
              <>
                {!account ? (
                  <div className="text-center py-8">
                    <p className="text-gray-600 mb-4">Connect your wallet to book space on this route</p>
                    <button
                      onClick={connectWallet}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-8 rounded-lg shadow-md transition-colors duration-150"
                    >
                      Connect Wallet
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleBookSpace} className="space-y-6">
                    <div>
                      <label className="block text-gray-700 font-semibold mb-2">
                        Package Description
                      </label>
                      <textarea
                        value={packageDescription}
                        onChange={(e) => setPackageDescription(e.target.value)}
                        placeholder="Describe your package (contents, size, special handling instructions)"
                        rows={3}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-gray-700 font-semibold mb-2">
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
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="font-semibold text-gray-800 mb-2">Cost Breakdown</h3>
                      <div className="flex justify-between mb-1">
                        <span>Base Price:</span>
                        <span>{calculateBasePrice().toFixed(2)} USDC</span>
                      </div>
                      <div className="flex justify-between mb-1">
                        <span>Platform Fee ({PLATFORM_FEE_PERCENT}%):</span>
                        <span>{calculatePlatformFee().toFixed(2)} USDC</span>
                      </div>
                      <div className="flex justify-between mb-2">
                        <span>Network Fee:</span>
                        <span>{calculateNetworkFee().toFixed(2)} USDC</span>
                      </div>
                      <div className="flex justify-between font-bold border-t border-gray-300 pt-2">
                        <span>Total:</span>
                        <span>{calculateTotalCost().toFixed(2)} USDC</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center p-4 bg-blue-50 text-blue-700 rounded-lg">
                      <svg className="w-5 h-5 mr-2 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p className="text-sm">
                        By booking this space, you agree to the CarryChain terms of service. Payment will be held in escrow until the delivery is confirmed.
                      </p>
                    </div>
                    
                    <div className="flex justify-end space-x-4">
                      <button
                        type="button"
                        onClick={() => setShowForm(false)}
                        className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium py-2 px-6 rounded-lg transition-colors duration-150"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmitting || !account || !isCorrectNetwork()}
                        className={`${
                          isSubmitting || !account || !isCorrectNetwork()
                            ? 'bg-indigo-400 cursor-not-allowed'
                            : 'bg-indigo-600 hover:bg-indigo-700'
                        } text-white font-bold py-2 px-6 rounded-lg transition-colors duration-150 flex items-center`}
                      >
                        {isSubmitting ? (
                          <>
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Processing...
                          </>
                        ) : (
                          <>
                            Book Now
                            <svg className="w-5 h-5 ml-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
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
            <div className="mt-6 bg-white rounded-xl shadow-md overflow-hidden p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                <svg className="w-5 h-5 text-indigo-600 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                Transaction History
              </h2>
              
              {/* Transaction history would be loaded from blockchain or context */}
              <div className="text-gray-600 text-sm italic">
                No transaction history yet for this route.
              </div>
            </div>
          )}
        </>
      )}
      
      {/* Developer debug section - only in development */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-6 bg-gray-100 rounded-xl p-4 text-sm font-mono">
          <h3 className="font-bold mb-2">Debug Info:</h3>
          <div>Route ID: {routeId}</div>
          <div>Connected Account: {account || 'Not connected'}</div>
          <div>Network: {chainId ? `${chainId} (${isCorrectNetwork() ? 'Base' : 'Unsupported'})` : 'Unknown'}</div>
          <div>Has Provider: {provider ? 'Yes' : 'No'}</div>
          <div>Has Signer: {signer ? 'Yes' : 'No'}</div>
          <div>Contract Address: {MARKETPLACE_ADDRESS}</div>
        </div>
      )}
    </div>
  );
};

export default RouteDetailsPage;