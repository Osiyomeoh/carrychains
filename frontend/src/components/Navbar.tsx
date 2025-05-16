// src/components/Navbar.tsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAccount } from 'wagmi';
import { Package, Menu, X, User } from 'lucide-react';
import CustomWalletButton from './CustomWalletButton';

const Navbar: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { address } = useAccount();
  const navigate = useNavigate();
  
  const goToProfile = () => {
    if (address) {
      navigate('/profile');
      setIsMenuOpen(false);
    }
  };
  
  return (
    <nav className="bg-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <Package className="h-8 w-8 text-indigo-600" />
              <span className="text-xl font-bold text-gray-900">CarryChain</span>
            </Link>
          </div>
          
          {/* Navigation Links - Desktop */}
          <div className="hidden md:flex md:items-center md:space-x-6">
            <Link 
              to="/find-routes" 
              className="text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium transition duration-150"
            >
              Find Routes
            </Link>
            <Link 
              to="/create-route" 
              className="text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium transition duration-150"
            >
              Create Route
            </Link>
            {address && (
              <>
                <Link 
                  to="/my-routes" 
                  className="text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium transition duration-150"
                >
                  My Routes
                </Link>
                <Link 
                  to="/my-deliveries" 
                  className="text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium transition duration-150"
                >
                  My Deliveries
                </Link>
              </>
            )}
          </div>
          
          {/* Right Side - Desktop */}
          <div className="hidden md:flex md:items-center md:space-x-4">
            {address && (
              <button
                onClick={goToProfile}
                className="flex items-center gap-2 px-3 py-2 text-gray-700 hover:text-indigo-600 rounded-md text-sm"
              >
                <User size={16} />
                My Profile
              </button>
            )}
            
            {/* Custom Wallet Button instead of RainbowKit ConnectButton */}
            <CustomWalletButton />
          </div>
          
          {/* Mobile menu button */}
          <div className="flex items-center md:hidden">
            <CustomWalletButton className="mr-2" />
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
            >
              {isMenuOpen ? (
                <X className="block h-6 w-6" />
              ) : (
                <Menu className="block h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>
      
      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="md:hidden border-t border-gray-200">
          <div className="px-2 pt-2 pb-3 space-y-1">
            <Link
              to="/find-routes"
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-indigo-600 hover:bg-gray-50"
              onClick={() => setIsMenuOpen(false)}
            >
              Find Routes
            </Link>
            <Link
              to="/create-route"
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-indigo-600 hover:bg-gray-50"
              onClick={() => setIsMenuOpen(false)}
            >
              Create Route
            </Link>
            {address && (
              <>
                <Link
                  to="/my-routes"
                  className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-indigo-600 hover:bg-gray-50"
                  onClick={() => setIsMenuOpen(false)}
                >
                  My Routes
                </Link>
                <Link
                  to="/my-deliveries"
                  className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-indigo-600 hover:bg-gray-50"
                  onClick={() => setIsMenuOpen(false)}
                >
                  My Deliveries
                </Link>
                <button
                  onClick={goToProfile}
                  className="w-full text-left block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-indigo-600 hover:bg-gray-50"
                >
                  My Profile
                </button>
              </>
            )}
          </div>
          
          {/* Mobile account info */}
          {address && (
            <div className="pt-4 pb-3 border-t border-gray-200">
              <div className="flex items-center px-4">
                <div className="flex-shrink-0">
                  <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
                    {address.substring(2, 4).toUpperCase()}
                  </div>
                </div>
                <div className="ml-3">
                  <div className="text-base font-medium text-gray-800">
                    Wallet
                  </div>
                  <div className="text-sm font-medium text-gray-500 truncate">
                    {address.substring(0, 6)}...{address.substring(address.length - 4)}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;