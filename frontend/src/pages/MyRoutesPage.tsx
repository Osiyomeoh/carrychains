import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useWeb3 } from '../contexts/Web3Context';
import { useAppData } from '../contexts/AppDataContext';
import { 
  Calendar, 
  MapPin, 
  DollarSign, 
  Package, 
  Plus, 
  CheckCircle,
  XCircle,
  Loader,
  ArrowRight
} from 'lucide-react';
import BaseNetworkChecker from '../components/BaseNetworkChecker';
import CustomWalletButton from '../components/CustomWalletButton';

// Change this to 'mainnet' or 'sepolia' based on your deployment
const NETWORK_TYPE = 'sepolia';

const MyRoutesPage: React.FC = () => {
  const { account, connectWallet } = useWeb3();
  const { state, loadMyRoutes, updateRouteStatus, isLoading } = useAppData();
  const [updatingRouteId, setUpdatingRouteId] = useState<number | null>(null);
  
  // Load my routes when the component mounts
  useEffect(() => {
    if (account) {
      loadMyRoutes();
    }
  }, [account]);
  
  // Format date from Unix timestamp
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };
  
  // Handle toggling a route's active status
  const handleToggleRouteStatus = async (routeId: number, currentStatus: boolean) => {
    try {
      setUpdatingRouteId(routeId);
      
      // Call the update function
      const success = await updateRouteStatus(routeId, !currentStatus);
      
      if (success) {
        // If successful, reload the routes
        await loadMyRoutes();
      } else {
        console.error("Failed to update route status");
      }
    } catch (err) {
      console.error("Error toggling route status:", err);
    } finally {
      setUpdatingRouteId(null);
    }
  };
  
  if (!account) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="bg-gray-800 rounded-xl shadow-lg overflow-hidden p-8 text-center border border-gray-700">
          <h1 className="text-2xl font-bold text-white mb-6">My Routes</h1>
          <p className="text-gray-300 mb-8">Connect your wallet to view your created routes.</p>
          <div className="flex justify-center">
            <CustomWalletButton className="px-6 py-3 text-lg" />
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <BaseNetworkChecker networkType={NETWORK_TYPE}>
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl md:text-3xl font-bold">
            My <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">Routes</span>
          </h1>
          <Link
            to="/create-route"
            className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white font-medium py-2 px-4 rounded-lg flex items-center shadow-lg shadow-purple-500/20 hover:shadow-xl transition-shadow duration-150"
          >
            <Plus className="w-5 h-5 mr-2" />
            Create New Route
          </Link>
        </div>
        
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <Loader className="w-12 h-12 text-indigo-600 animate-spin" />
          </div>
        ) : state.myRoutes && state.myRoutes.length > 0 ? (
          <div className="space-y-4">
            {/* Route cards */}
            {state.myRoutes.map(route => (
              <div 
                key={route.id} 
                className={`bg-gray-800 rounded-xl shadow-lg p-6 border transition duration-200 ${
                  route.isActive 
                    ? 'border-l-4 border-green-500 border-t border-r border-b border-gray-700' 
                    : 'border-l-4 border-gray-500 border-t border-r border-b border-gray-700 opacity-75'
                }`}
              >
                <div className="flex flex-col md:flex-row md:justify-between md:items-start">
                  {/* Route Info */}
                  <div className="flex-1">
                    <h2 className="text-xl font-bold text-white mb-2 flex items-center">
                      <MapPin className="w-5 h-5 mr-2 text-indigo-400" />
                      {route.departureLocation} 
                      <ArrowRight className="mx-2 text-gray-400" />
                      {route.destinationLocation}
                    </h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                      {/* Departure & Arrival */}
                      <div className="space-y-3">
                        <div className="flex items-start">
                          <Calendar className="w-5 h-5 text-indigo-400 mt-0.5 mr-2" />
                          <div>
                            <p className="text-sm text-gray-400">Departure</p>
                            <p className="font-medium text-white">{formatDate(route.departureTime)}</p>
                          </div>
                        </div>
                        <div className="flex items-start">
                          <Calendar className="w-5 h-5 text-green-400 mt-0.5 mr-2" />
                          <div>
                            <p className="text-sm text-gray-400">Arrival</p>
                            <p className="font-medium text-white">{formatDate(route.arrivalTime)}</p>
                          </div>
                        </div>
                      </div>
                      
                      {/* Space & Price */}
                      <div className="space-y-3">
                        <div className="flex items-start">
                          <Package className="w-5 h-5 text-indigo-400 mt-0.5 mr-2" />
                          <div>
                            <p className="text-sm text-gray-400">Available Space</p>
                            <p className="font-medium text-white">{(route.availableSpace / 1000).toFixed(2)} kg</p>
                          </div>
                        </div>
                        <div className="flex items-start">
                          <DollarSign className="w-5 h-5 text-indigo-400 mt-0.5 mr-2" />
                          <div>
                            <p className="text-sm text-gray-400">Price per kg</p>
                            <p className="font-medium text-white">{(Number(route.pricePerKg) / 1000000).toFixed(2)} USDC</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Actions */}
                  <div className="mt-6 md:mt-0 md:ml-6 flex flex-col items-end">
                    <div className="mb-4">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                        route.isActive 
                          ? 'bg-green-900/30 text-green-400 border border-green-700' 
                          : 'bg-gray-700 text-gray-400 border border-gray-600'
                      }`}>
                        {route.isActive ? (
                          <>
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Active
                          </>
                        ) : (
                          <>
                            <XCircle className="w-4 h-4 mr-1" />
                            Inactive
                          </>
                        )}
                      </span>
                    </div>
                    
                    <div className="space-y-2">
                      <Link
                        to={`/route/${route.id}`}
                        className="block bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm font-medium text-center"
                      >
                        View Details
                      </Link>
                      
                      <button
                        onClick={() => handleToggleRouteStatus(route.id, route.isActive)}
                        disabled={updatingRouteId === route.id}
                        className={`block w-full px-4 py-2 rounded-lg text-sm font-medium text-center ${
                          updatingRouteId === route.id 
                            ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                            : route.isActive
                              ? 'bg-red-900/30 text-red-400 hover:bg-red-900/50 border border-red-800'
                              : 'bg-green-900/30 text-green-400 hover:bg-green-900/50 border border-green-800'
                        }`}
                      >
                        {updatingRouteId === route.id ? (
                          <span className="flex items-center justify-center">
                            <Loader className="w-4 h-4 mr-2 animate-spin" />
                            Updating...
                          </span>
                        ) : (
                          route.isActive ? 'Deactivate' : 'Activate'
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-gray-800 rounded-xl shadow-lg overflow-hidden p-8 text-center border border-gray-700">
            <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-white mb-2">No Routes Created Yet</h2>
            <p className="text-gray-300 mb-6">Create your first route to offer your unused luggage space to others.</p>
            <Link
              to="/create-route"
              className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white font-bold py-3 px-8 rounded-lg flex items-center justify-center mx-auto w-max shadow-lg shadow-purple-500/20 hover:shadow-xl transition-shadow duration-150"
            >
              <Plus className="w-5 h-5 mr-2" />
              Create Your First Route
            </Link>
          </div>
        )}
        
        {/* Tips Section */}
        {state.myRoutes && state.myRoutes.length > 0 && (
          <div className="mt-6 bg-gray-800/50 border border-gray-700 rounded-lg p-4 text-sm">
            <h3 className="font-bold text-white mb-2">Managing Your Routes:</h3>
            <ul className="list-disc pl-5 space-y-1 text-white">
              <li>Active routes are visible to potential shippers.</li>
              <li>Deactivate a route if you no longer wish to receive delivery requests.</li>
              <li>You can view delivery requests by clicking "View Details" on a route.</li>
              <li>Once you accept a delivery, make sure to verify pickup and delivery with photos.</li>
            </ul>
          </div>
        )}
      </div>
    </BaseNetworkChecker>
  );
};

export default MyRoutesPage;