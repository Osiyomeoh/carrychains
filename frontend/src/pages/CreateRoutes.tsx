import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWeb3 } from '../contexts/Web3Context';
import { useAppData } from '../contexts/AppDataContext';
import { ConnectButton } from '@rainbow-me/rainbowkit';

const CreateRoutePage: React.FC = () => {
  const navigate = useNavigate();
  const { account, connectWallet, reconnectWallet, signer, provider, isConnecting: isWalletConnecting } = useWeb3();

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
  const [isConnecting, setIsConnecting] = useState(false);

  // Check wallet connection status
  useEffect(() => {
    // Log connection status
    console.log('Wallet connection status:');
    console.log('- Account:', account);
    console.log('- Provider:', !!provider);
    console.log('- Signer:', !!signer);
    
    // Clear error when account is connected
    if (account) {
      setLocalError(null);
    }
  }, [account, provider, signer]);

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
  //full

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

  // Handle wallet connection
  const handleConnectWallet = async () => {
    setIsConnecting(true);
    setLocalError(null);
    
    try {
      // First, check if the wallet is already connected with working signer
      if (account && signer && provider) {
        try {
          // Verify signer works by getting the address
          const signerAddress = await signer.getAddress();
          console.log("Verified existing wallet connection:", signerAddress);
          
          // If we get here, the wallet is already connected and working
          console.log("Wallet is already properly connected");
          return;
        } catch (verifyErr) {
          console.error("Existing wallet connection is broken:", verifyErr);
          // Continue to reconnection
        }
      }
      
      // Either not connected or connection is broken
      console.log("Connecting/reconnecting wallet...");
      
      // Try reconnection if we have an account but something else is wrong
      if (account) {
        console.log("Have account but connection needs refresh, reconnecting...");
        await reconnectWallet();
      } else {
        console.log("No account detected, connecting fresh...");
        await connectWallet();
      }
      
      // Verify the connection worked by checking for account, signer, and provider
      if (!account || !signer || !provider) {
        console.error("Wallet connection failed - still missing required components");
        throw new Error("Failed to establish a complete wallet connection");
      }
      
      // Verify signer works
      const newSignerAddress = await signer.getAddress();
      console.log("New connection verified with address:", newSignerAddress);
    } catch (err: any) {
      console.error("Wallet connection error:", err);
      setLocalError(`Failed to connect wallet: ${err.message}`);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log("Create Route button clicked");
    
    // Check wallet connection status first
    if (!account || !signer || !provider) {
      console.log("Incomplete wallet connection detected, reconnecting wallet first");
      setLocalError("Please connect your wallet to create a route.");
      await handleConnectWallet();
      
      // Verify connection was successful
      if (!account || !signer || !provider) {
        setLocalError("Unable to connect wallet properly. Please try again or use a different wallet.");
        return;
      }
    } else {
      // Wallet is already connected, but let's verify the signer works
      try {
        console.log("Wallet already connected:", account);
        
        // Verify signer works by getting the address
        const signerAddress = await signer.getAddress();
        console.log("Verified signer address:", signerAddress);
        
        // Compare with account to make sure they match
        if (signerAddress.toLowerCase() !== account.toLowerCase()) {
          console.warn("Signer address mismatch, attempting to fix...", {
            signerAddress,
            account
          });
          
          // Don't throw an error yet, just try to reconnect
          await reconnectWallet();
          
          // Check if the reconnection fixed the issue
          const newSignerAddress = await signer.getAddress();
          if (newSignerAddress.toLowerCase() !== account.toLowerCase()) {
            throw new Error("Wallet address mismatch even after reconnection");
          }
        }
      } catch (verifyErr) {
        console.error("Error verifying signer:", verifyErr);
        setLocalError("Wallet connection verification failed. Please reconnect your wallet.");
        await reconnectWallet();
        return;
      }
    }
    
    // Proceed with form validation only if we have a valid wallet connection
    if (!validateForm()) {
      console.log("Form validation failed");
      return;
    }
    
    // Clear error states
    setLocalError(null);
    
    try {
      console.log("Form data:", formData);
      
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
      
      console.log("Submitting transaction with parameters:", {
        departureLocation: formData.departureLocation,
        destinationLocation: formData.destinationLocation,
        departureTime: departureTimestamp,
        arrivalTime: arrivalTimestamp,
        availableSpace: availableSpaceInGrams,
        pricePerKg: pricePerKgInSmallestUnit
      });
      
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
        console.log("Route created successfully!");
        setSuccess(true);
        setTimeout(() => {
          navigate('/my-routes');
        }, 2000);
      } else {
        console.log("Route creation function returned false");
        throw new Error("Failed to create route. Please try again.");
      }
    } catch (err: any) {
      console.error("Error creating route:", err);
      setSuccess(false);
      
      // Check for specific error types
      if (err.code === 'UNSUPPORTED_OPERATION') {
        setLocalError("Wallet connection issue. Please disconnect and reconnect your wallet.");
      } else if (err.code === 'ACTION_REJECTED') {
        setLocalError("Transaction was rejected in your wallet. Please try again and approve the transaction.");
      } else {
        setLocalError(`Failed to create route: ${err.message || "Unknown error"}`);
      }
    }
  };
  // Show wallet connection UI if not connected
  if (!account) {
    return (
      <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-md overflow-hidden p-8 text-center">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Create a New Route</h1>
        <p className="text-gray-600 mb-8">Connect your wallet to create a new travel route and offer your luggage space to others.</p>
        <div className="flex justify-center">
          <ConnectButton label="Connect Wallet to Continue" />
        </div>
      </div>
    );
  }

  // Display either local error or context error
  const displayError = error || contextError;

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Create a New Route</h1>
      
      {success ? (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-md mb-6 flex items-center">
          <svg className="w-5 h-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <span className="font-semibold">Success!</span>
            <span className="ml-2">Your route has been created. Redirecting to My Routes...</span>
          </div>
        </div>
      ) : null}
      
      {displayError ? (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md mb-6 flex items-center">
          <svg className="w-5 h-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{displayError}</span>
        </div>
      ) : null}
      
      <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded-md mb-6">
        <p className="flex items-center">
          <svg className="w-5 h-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Connected as: <span className="font-mono ml-1">{account.substring(0, 6)}...{account.substring(account.length - 4)}</span>
        </p>
      </div>
      
      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-md overflow-hidden p-6">
        {/* Departure Location */}
        <div className="mb-6">
          <label className="block text-gray-700 font-semibold mb-2 flex items-center">
            <svg className="w-5 h-5 mr-2 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Departure Location
          </label>
          <input
            type="text"
            name="departureLocation"
            value={formData.departureLocation}
            onChange={handleChange}
            placeholder="City, Country (e.g. Lagos, Nigeria)"
            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
              formErrors.departureLocation ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {formErrors.departureLocation && (
            <p className="text-red-500 text-sm mt-1">{formErrors.departureLocation}</p>
          )}
        </div>
        
        {/* Destination Location */}
        <div className="mb-6">
          <label className="block text-gray-700 font-semibold mb-2 flex items-center">
            <svg className="w-5 h-5 mr-2 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Destination Location
          </label>
          <input
            type="text"
            name="destinationLocation"
            value={formData.destinationLocation}
            onChange={handleChange}
            placeholder="City, Country (e.g. Accra, Ghana)"
            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
              formErrors.destinationLocation ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {formErrors.destinationLocation && (
            <p className="text-red-500 text-sm mt-1">{formErrors.destinationLocation}</p>
          )}
        </div>
        
        {/* Time Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Departure Time */}
          <div>
            <label className="block text-gray-700 font-semibold mb-2 flex items-center">
              <svg className="w-5 h-5 mr-2 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Departure Time
            </label>
            <input
              type="datetime-local"
              name="departureTime"
              value={formData.departureTime}
              onChange={handleChange}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                formErrors.departureTime ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {formErrors.departureTime && (
              <p className="text-red-500 text-sm mt-1">{formErrors.departureTime}</p>
            )}
          </div>
          
          {/* Arrival Time */}
          <div>
            <label className="block text-gray-700 font-semibold mb-2 flex items-center">
              <svg className="w-5 h-5 mr-2 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Arrival Time
            </label>
            <input
              type="datetime-local"
              name="arrivalTime"
              value={formData.arrivalTime}
              onChange={handleChange}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                formErrors.arrivalTime ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {formErrors.arrivalTime && (
              <p className="text-red-500 text-sm mt-1">{formErrors.arrivalTime}</p>
            )}
          </div>
        </div>
        
        {/* Weight and Price Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Available Space */}
          <div>
            <label className="block text-gray-700 font-semibold mb-2 flex items-center">
              <svg className="w-5 h-5 mr-2 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
              </svg>
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
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                formErrors.availableSpace ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {formErrors.availableSpace && (
              <p className="text-red-500 text-sm mt-1">{formErrors.availableSpace}</p>
            )}
          </div>
          
          {/* Price per kg */}
          <div>
            <label className="block text-gray-700 font-semibold mb-2 flex items-center">
              <svg className="w-5 h-5 mr-2 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
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
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                formErrors.pricePerKg ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {formErrors.pricePerKg && (
              <p className="text-red-500 text-sm mt-1">{formErrors.pricePerKg}</p>
            )}
          </div>
        </div>
        
        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isLoading}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-6 rounded-lg transition-colors duration-150 flex items-center"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Creating...
              </>
            ) : (
              <>
                <svg className="w-5 h-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
                Create Route
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateRoutePage;