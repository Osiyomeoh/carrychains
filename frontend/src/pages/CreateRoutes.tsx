import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWeb3 } from '../contexts/Web3Context';
import { useAppData } from '../contexts/AppDataContext';
import { 
  Calendar, 
  MapPin, 
  DollarSign, 
  Package, 
  AlertCircle, 
  Check, 
  Info,
  Loader,
  Wallet
} from 'lucide-react';
import BaseNetworkChecker from '../components/BaseNetworkChecker';
import CustomWalletButton from '../components/CustomWalletButton';

type NetworkType = 'mainnet' | 'sepolia';
const NETWORK_TYPE: NetworkType = 'sepolia';

const isMainnet = (network: NetworkType): network is 'mainnet' => network === 'mainnet';

const CreateRoutePage: React.FC = () => {
  const navigate = useNavigate();
  const { account, connectWallet, signer, provider, chainId, isConnecting: isWalletConnecting } = useWeb3();
  const { createRoute, isLoading, error: contextError } = useAppData();

  const [formData, setFormData] = useState({
    departureLocation: '',
    destinationLocation: '',
    departureTime: '',
    arrivalTime: '',
    availableSpace: '',
    pricePerKg: ''
  });
  
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState(false);
  const [error, setLocalError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isOnCorrectNetwork, setIsOnCorrectNetwork] = useState(false);

  // Check wallet connection and network status
  useEffect(() => {
    // Check if we're on the correct network
    const targetChainId = isMainnet(NETWORK_TYPE) ? 8453 : 84532;
    setIsOnCorrectNetwork(chainId === targetChainId);
    
    // Clear error when account is connected
    if (account) {
      setLocalError(null);
    }
  }, [account, chainId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    
    // Clear error when user starts typing
    if (formErrors[name]) {
      setFormErrors({
        ...formErrors,
        [name]: ''
      });
    }
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    
    if (!formData.departureLocation.trim()) {
      errors.departureLocation = 'Departure location is required';
    }
    
    if (!formData.destinationLocation.trim()) {
      errors.destinationLocation = 'Destination location is required';
    }
    
    if (!formData.departureTime) {
      errors.departureTime = 'Departure time is required';
    } else {
      const departureDate = new Date(formData.departureTime);
      if (departureDate.getTime() <= Date.now()) {
        errors.departureTime = 'Departure time must be in the future';
      }
    }
    
    if (!formData.arrivalTime) {
      errors.arrivalTime = 'Arrival time is required';
    } else {
      const arrivalDate = new Date(formData.arrivalTime);
      const departureDate = new Date(formData.departureTime);
      if (arrivalDate.getTime() <= departureDate.getTime()) {
        errors.arrivalTime = 'Arrival time must be after departure time';
      }
    }
    
    if (!formData.availableSpace) {
      errors.availableSpace = 'Available space is required';
    } else if (isNaN(Number(formData.availableSpace)) || Number(formData.availableSpace) <= 0) {
      errors.availableSpace = 'Available space must be a positive number';
    }
    
    if (!formData.pricePerKg) {
      errors.pricePerKg = 'Price per kg is required';
    } else if (isNaN(Number(formData.pricePerKg)) || Number(formData.pricePerKg) <= 0) {
      errors.pricePerKg = 'Price per kg must be a positive number';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Prevent multiple submissions
    if (isSubmitting || isLoading) {
      return;
    }
    
    // Reset error states
    setLocalError(null);
    setIsSubmitting(true);
    
    try {
      // Check wallet connection
      if (!account || !signer || !provider) {
        setLocalError("Please connect your wallet to create a route.");
        await connectWallet();
        
        if (!account || !signer || !provider) {
          throw new Error("Wallet connection required");
        }
      }
      
      // Check if we're on the correct network
      if (!isOnCorrectNetwork) {
        setLocalError("Please switch to Base network to create a route");
        setIsSubmitting(false);
        return;
      }
      
      // Validate form
      if (!validateForm()) {
        setIsSubmitting(false);
        return;
      }
      
      // Convert form data to the format expected by the contract
      const departureDate = new Date(formData.departureTime);
      const arrivalDate = new Date(formData.arrivalTime);
      
      // Convert to Unix timestamps (seconds)
      const departureTimestamp = Math.floor(departureDate.getTime() / 1000);
      const arrivalTimestamp = Math.floor(arrivalDate.getTime() / 1000);
      
      // Convert weight from kg to grams (multiply by 1000)
      const availableSpaceInGrams = Math.floor(Number(formData.availableSpace) * 1000);
      
      // Convert price to smallest unit for USDC (6 decimals)
      const pricePerKgInSmallestUnit = Math.floor(Number(formData.pricePerKg) * 1000000);
      
      // Call the createRoute function
      const success = await createRoute(
        formData.departureLocation,
        formData.destinationLocation,
        departureTimestamp,
        arrivalTimestamp,
        availableSpaceInGrams,
        pricePerKgInSmallestUnit
      );
      
      if (success) {
        setSuccess(true);
        setTimeout(() => {
          navigate('/my-routes');
        }, 2000);
      } else {
        throw new Error("Failed to create route. Please try again.");
      }
    } catch (err: any) {
      setSuccess(false);
      
      // Handle specific error types
      if (err.code === 4001 || err.code === 'ACTION_REJECTED') {
        setLocalError("Transaction was rejected in your wallet. Please try again and approve the transaction.");
      } else if (err.message?.includes("user rejected") || err.message?.includes("User denied")) {
        setLocalError("Transaction was rejected in your wallet. Please try again and approve the transaction.");
      } else if (err.message?.includes("insufficient funds")) {
        setLocalError("Insufficient funds for this transaction.");
      } else {
        setLocalError(`Failed to create route: ${err.message || "Unknown error"}`);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show wallet connection UI if not connected
  if (!account) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="bg-gray-800 rounded-xl shadow-lg overflow-hidden p-8 text-center border border-gray-700">
          <h1 className="text-2xl font-bold text-white mb-6">Create a New Route</h1>
          <p className="text-gray-300 mb-8">Connect your wallet to create a new travel route and offer your luggage space to others.</p>
          <div className="flex justify-center">
            <CustomWalletButton className="px-6 py-3 text-lg" />
          </div>
        </div>
      </div>
    );
  }

  // Display either local error or context error
  const displayError = error || contextError;

  return (
    <BaseNetworkChecker networkType={NETWORK_TYPE}>
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl md:text-3xl font-bold mb-6">
          Create a <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">New Route</span>
        </h1>
        
        {success && (
          <div className="bg-green-900/30 border border-green-600 text-green-200 px-4 py-3 rounded-lg mb-6 flex items-center">
            <Check className="w-5 h-5 mr-2 text-green-400" />
            <div>
              <span className="font-semibold">Success!</span>
              <span className="ml-2">Your route has been created. Redirecting to My Routes...</span>
            </div>
          </div>
        )}
        
        {displayError && (
          <div className="bg-red-900/30 border border-red-600 text-red-200 px-4 py-3 rounded-lg mb-6 flex items-center">
            <AlertCircle className="w-5 h-5 mr-2 text-red-400" />
            <span>{displayError}</span>
          </div>
        )}
        
        <div className="bg-indigo-900/20 border border-indigo-600/40 text-white px-4 py-3 rounded-lg mb-6 flex items-center">
          <Info className="w-5 h-5 mr-2 text-indigo-400" />
          <div>
            <span className="text-white">Connected as: </span>
            <span className="font-mono bg-indigo-900/50 px-2 py-1 rounded text-white ml-1">
              {account.substring(0, 6)}...{account.substring(account.length - 4)}
            </span>
            {isOnCorrectNetwork ? (
              <span className="ml-2 text-xs bg-green-800/50 text-green-300 py-1 px-2 rounded-full border border-green-700">
                {isMainnet(NETWORK_TYPE) ? 'Base Mainnet' : 'Base Sepolia'}
              </span>
            ) : (
              <span className="ml-2 text-xs bg-red-800/50 text-red-300 py-1 px-2 rounded-full border border-red-700">Wrong Network</span>
            )}
          </div>
        </div>
        
        <form 
          onSubmit={handleSubmit} 
          className="bg-gray-800 rounded-xl shadow-lg overflow-hidden p-6 border border-gray-700"
        >
          {/* Departure Location */}
          <div className="mb-6">
            <label className="block text-gray-200 font-semibold mb-2 flex items-center">
              <MapPin className="w-5 h-5 mr-2 text-indigo-400" />
              Departure Location
            </label>
            <input
              type="text"
              name="departureLocation"
              value={formData.departureLocation}
              onChange={handleChange}
              placeholder="City, Country (e.g. Lagos, Nigeria)"
              className={`w-full px-4 py-3 bg-gray-700 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white placeholder-gray-400 ${
                formErrors.departureLocation ? 'border-red-500' : 'border-gray-600'
              }`}
            />
            {formErrors.departureLocation && (
              <p className="text-red-400 text-sm mt-1">{formErrors.departureLocation}</p>
            )}
          </div>
          
          {/* Destination Location */}
          <div className="mb-6">
            <label className="block text-gray-200 font-semibold mb-2 flex items-center">
              <MapPin className="w-5 h-5 mr-2 text-green-400" />
              Destination Location
            </label>
            <input
              type="text"
              name="destinationLocation"
              value={formData.destinationLocation}
              onChange={handleChange}
              placeholder="City, Country (e.g. Accra, Ghana)"
              className={`w-full px-4 py-3 bg-gray-700 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white placeholder-gray-400 ${
                formErrors.destinationLocation ? 'border-red-500' : 'border-gray-600'
              }`}
            />
            {formErrors.destinationLocation && (
              <p className="text-red-400 text-sm mt-1">{formErrors.destinationLocation}</p>
            )}
          </div>
          
          {/* Time Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Departure Time */}
            <div>
              <label className="block text-gray-200 font-semibold mb-2 flex items-center">
                <Calendar className="w-5 h-5 mr-2 text-indigo-400" />
                Departure Time
              </label>
              <input
                type="datetime-local"
                name="departureTime"
                value={formData.departureTime}
                onChange={handleChange}
                className={`w-full px-4 py-3 bg-gray-700 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white ${
                  formErrors.departureTime ? 'border-red-500' : 'border-gray-600'
                }`}
              />
              {formErrors.departureTime && (
                <p className="text-red-400 text-sm mt-1">{formErrors.departureTime}</p>
              )}
            </div>
            
            {/* Arrival Time */}
            <div>
              <label className="block text-gray-200 font-semibold mb-2 flex items-center">
                <Calendar className="w-5 h-5 mr-2 text-green-400" />
                Arrival Time
              </label>
              <input
                type="datetime-local"
                name="arrivalTime"
                value={formData.arrivalTime}
                onChange={handleChange}
                className={`w-full px-4 py-3 bg-gray-700 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white ${
                  formErrors.arrivalTime ? 'border-red-500' : 'border-gray-600'
                }`}
              />
              {formErrors.arrivalTime && (
                <p className="text-red-400 text-sm mt-1">{formErrors.arrivalTime}</p>
              )}
            </div>
          </div>
          
          {/* Weight and Price Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Available Space */}
            <div>
              <label className="block text-gray-200 font-semibold mb-2 flex items-center">
                <Package className="w-5 h-5 mr-2 text-indigo-400" />
                Available Space (kg)
              </label>
              <input
                type="number"
                name="availableSpace"
                value={formData.availableSpace}
                onChange={handleChange}
                min="0.1"
                step="0.1"
                placeholder="10"
                className={`w-full px-4 py-3 bg-gray-700 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white placeholder-gray-400 ${
                  formErrors.availableSpace ? 'border-red-500' : 'border-gray-600'
                }`}
              />
              {formErrors.availableSpace && (
                <p className="text-red-400 text-sm mt-1">{formErrors.availableSpace}</p>
              )}
            </div>
            
            {/* Price per kg */}
            <div>
              <label className="block text-gray-200 font-semibold mb-2 flex items-center">
                <DollarSign className="w-5 h-5 mr-2 text-indigo-400" />
                Price per kg (USDC)
              </label>
              <input
                type="number"
                name="pricePerKg"
                value={formData.pricePerKg}
                onChange={handleChange}
                min="0.1"
                step="0.1"
                placeholder="5"
                className={`w-full px-4 py-3 bg-gray-700 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white placeholder-gray-400 ${
                  formErrors.pricePerKg ? 'border-red-500' : 'border-gray-600'
                }`}
              />
              {formErrors.pricePerKg && (
                <p className="text-red-400 text-sm mt-1">{formErrors.pricePerKg}</p>
              )}
            </div>
          </div>
          
          {/* Submit Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isLoading || isSubmitting || !isOnCorrectNetwork}
              className={`
                bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white font-bold py-3 px-8 rounded-lg 
                transition-shadow duration-150 flex items-center shadow-lg shadow-purple-500/20
                ${(isLoading || isSubmitting || !isOnCorrectNetwork) ? 'opacity-70 cursor-not-allowed' : 'hover:shadow-xl'}
              `}
            >
              {isLoading || isSubmitting ? (
                <>
                  <Loader className="w-5 h-5 mr-2 animate-spin" />
                  {isSubmitting ? "Processing..." : "Creating..."}
                </>
              ) : !isOnCorrectNetwork ? (
                <>
                  <AlertCircle className="w-5 h-5 mr-2" />
                  Switch Network First
                </>
              ) : (
                <>
                  <Package className="w-5 h-5 mr-2" />
                  Create Route
                </>
              )}
            </button>
          </div>
        </form>
        
        {/* Helpful tips section */}
        <div className="mt-6 bg-gray-800/50 border border-gray-700 rounded-lg p-4 text-sm">
          <h3 className="font-bold text-white mb-2">Tips for creating a route:</h3>
          <ul className="list-disc pl-5 space-y-1 text-white">
            <li>Provide accurate departure and arrival times to help shippers plan accordingly.</li>
            <li>Set a competitive price per kg to attract more delivery requests.</li>
            <li>Be realistic about your available space based on your luggage allowance.</li>
            <li>Once created, you'll receive delivery requests that you can accept or decline.</li>
          </ul>
        </div>
      </div>
    </BaseNetworkChecker>
  );
};

export default CreateRoutePage;