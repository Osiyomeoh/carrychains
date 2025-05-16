import React, { useState } from 'react';
import { useWeb3 } from '../contexts/Web3Context';

const BasenameRegistration: React.FC = () => {
  const { account, chainId, connectWallet } = useWeb3();
  const [desiredName, setDesiredName] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [availability, setAvailability] = useState<boolean | null>(null);

  // Check if user is on Base network
  const isOnBase = chainId === 8453 || chainId === 84531;

  const checkAvailability = async () => {
    if (!desiredName.trim() || !isOnBase) return;
    
    setIsChecking(true);
    setError(null);
    setAvailability(null);
    
    try {
      // Validate basename format
      if (!/^[a-zA-Z0-9-]+$/.test(desiredName)) {
        setError('Basename can only contain letters, numbers, and hyphens');
        setAvailability(false);
        setIsChecking(false);
        return;
      }
      
      if (desiredName.length < 3) {
        setError('Basename must be at least 3 characters long');
        setAvailability(false);
        setIsChecking(false);
        return;
      }
      
      // Simulate API call to check availability
      // In a real implementation, you would call the Basename service API
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // For demo purposes, names starting with 'test' are available
      const isAvailable = desiredName.toLowerCase().startsWith('test');
      setAvailability(isAvailable);
      
      if (!isAvailable) {
        setError('This name is already taken');
      }
    } catch (err: any) {
      console.error('Error checking name availability:', err);
      setError(err.message || 'Error checking name availability');
    } finally {
      setIsChecking(false);
    }
  };

  const registerBasename = async () => {
    if (!account || !desiredName || !isOnBase || !availability) return;
    
    setIsRegistering(true);
    setError(null);
    setSuccess(false);
    
    try {
      // In a real implementation, this would:
      // 1. Call the Basename registration contract
      // 2. Handle the transaction
      // 3. Wait for confirmation
      
      // Simulate registration process
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // For demo, registration succeeds
      setSuccess(true);
      
      // Clear form after successful registration
      setTimeout(() => {
        setDesiredName('');
        setAvailability(null);
        setSuccess(false);
      }, 5000);
      
    } catch (err: any) {
      console.error('Error registering name:', err);
      setError(err.message || 'Error registering Basename');
    } finally {
      setIsRegistering(false);
    }
  };

  // Estimate cost (placeholder)
  const estimatedCost = '0.001';

  if (!account) {
    return (
      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Register Your Basename</h2>
        <p className="text-gray-600 mb-4">
          A Basename is your unique, human-readable identity on Base. Use it instead of your long wallet address.
        </p>
        <div className="bg-indigo-50 rounded-lg p-4 text-center">
          <p className="text-indigo-700 mb-4">Connect your wallet to register a Basename</p>
          <button
            onClick={connectWallet}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg transition-colors"
          >
            Connect Wallet
          </button>
        </div>
      </div>
    );
  }

  if (!isOnBase) {
    return (
      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Register Your Basename</h2>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800">
            Basenames are only available on Base network. Please switch to Base to register your Basename.
          </p>
          <button
            onClick={connectWallet}
            className="mt-3 bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg transition-colors text-sm"
          >
            Switch to Base
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <h2 className="text-xl font-bold text-gray-800 mb-4">Register Your Basename</h2>
      <p className="text-gray-600 mb-4">
        A Basename is your unique, human-readable identity on Base.
      </p>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Desired Basename
          </label>
          <div className="flex">
            <input
              type="text"
              value={desiredName}
              onChange={(e) => {
                setDesiredName(e.target.value.toLowerCase());
                setAvailability(null);
                setError(null);
              }}
              placeholder="your-name"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              disabled={isChecking || isRegistering}
            />
            <button
              onClick={checkAvailability}
              disabled={!desiredName.trim() || isChecking || isRegistering}
              className="bg-indigo-100 text-indigo-600 hover:bg-indigo-200 px-4 py-2 rounded-r-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {isChecking ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Checking...
                </>
              ) : (
                'Check'
              )}
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Must be at least 3 characters. Only letters, numbers, and hyphens allowed.
          </p>
        </div>
        
        {availability === true && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-green-700 font-medium">
                {desiredName} is available!
              </p>
            </div>
            <div className="mt-3 text-sm text-green-600">
              <p>Estimated cost: {estimatedCost} ETH + gas fees</p>
            </div>
          </div>
        )}
        
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-red-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-red-700">{error}</p>
            </div>
          </div>
        )}
        
        {success && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-green-700 font-medium">
                Successfully registered {desiredName}!
              </p>
            </div>
          </div>
        )}
        
        <button
          onClick={registerBasename}
          disabled={!availability || isRegistering}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
        >
          {isRegistering ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Registering...
            </>
          ) : (
            'Register Basename'
          )}
        </button>
      </div>
      
      <div className="mt-6 pt-4 border-t border-gray-200">
        <h3 className="text-sm font-medium text-gray-700 mb-2">What you get with a Basename:</h3>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• Easy-to-remember identity (instead of 0x...)</li>
          <li>• Use it for receiving payments and NFTs</li>
          <li>• Display it on your profile and in messaging</li>
          <li>• Owned by you, transferable like an NFT</li>
        </ul>
      </div>
    </div>
  );
};

export default BasenameRegistration;