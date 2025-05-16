import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useWeb3 } from '../contexts/Web3Context';
import { useAppData } from '../contexts/AppDataContext';

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
      <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-md overflow-hidden p-8 text-center">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">My Routes</h1>
        <p className="text-gray-600 mb-8">Connect your wallet to view your created routes.</p>
        <button
          onClick={connectWallet}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-8 rounded-lg transition-colors duration-150"
        >
          Connect Wallet
        </button>
      </div>
    );
  }
  
  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">My Routes</h1>
        <Link
          to="/create-route"
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-md flex items-center"
        >
          <svg className="w-5 h-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Create New Route
        </Link>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      ) : state.myRoutes && state.myRoutes.length > 0 ? (
        <div className="space-y-4">
          {/* Route cards */}
          {state.myRoutes.map(route => (
            <div 
              key={route.id} 
              className={`bg-white rounded-xl shadow-md p-6 transition duration-200 ${
                route.isActive ? 'border-l-4 border-green-500' : 'border-l-4 border-gray-300 opacity-75'
              }`}
            >
              <div className="flex flex-col md:flex-row md:justify-between md:items-start">
                {/* Route Info */}
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-gray-800 mb-2">
                    {route.departureLocation} to {route.destinationLocation}
                  </h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    {/* Departure & Arrival */}
                    <div className="space-y-2">
                      <div className="flex items-start">
                        <svg className="w-5 h-5 text-indigo-600 mt-0.5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <div>
                          <p className="text-sm text-gray-500">Departure</p>
                          <p className="font-medium">{formatDate(route.departureTime)}</p>
                        </div>
                      </div>
                      <div className="flex items-start">
                        <svg className="w-5 h-5 text-indigo-600 mt-0.5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <div>
                          <p className="text-sm text-gray-500">Arrival</p>
                          <p className="font-medium">{formatDate(route.arrivalTime)}</p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Space & Price */}
                    <div className="space-y-2">
                      <div className="flex items-start">
                        <svg className="w-5 h-5 text-indigo-600 mt-0.5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                        </svg>
                        <div>
                          <p className="text-sm text-gray-500">Available Space</p>
                          <p className="font-medium">{(route.availableSpace / 1000).toFixed(2)} kg</p>
                        </div>
                      </div>
                      <div className="flex items-start">
                        <svg className="w-5 h-5 text-indigo-600 mt-0.5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div>
                          <p className="text-sm text-gray-500">Price per kg</p>
                          <p className="font-medium">{(Number(route.pricePerKg) / 1000000).toFixed(2)} USDC</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Actions */}
                <div className="mt-4 md:mt-0 md:ml-6 flex flex-col items-end">
                  <div className="mb-4">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                      route.isActive 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {route.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  
                  <div className="space-y-2">
                    <Link
                      to={`/route/${route.id}`}
                      className="inline-block bg-indigo-50 text-indigo-700 hover:bg-indigo-100 px-4 py-2 rounded-md text-sm font-medium"
                    >
                      View Details
                    </Link>
                    
                    <button
                      onClick={() => handleToggleRouteStatus(route.id, route.isActive)}
                      className={`inline-block w-full px-4 py-2 rounded-md text-sm font-medium ${
                        route.isActive
                          ? 'bg-red-50 text-red-700 hover:bg-red-100'
                          : 'bg-green-50 text-green-700 hover:bg-green-100'
                      }`}
                    >
                      {route.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-md overflow-hidden p-8 text-center">
          <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
          </svg>
          <h2 className="text-xl font-bold text-gray-800 mb-2">No Routes Created Yet</h2>
          <p className="text-gray-600 mb-6">Create your first route to offer your unused luggage space to others.</p>
          <Link
            to="/create-route"
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-6 rounded-lg transition-colors duration-150"
          >
            Create Your First Route
          </Link>
        </div>
      )}
    </div>
  );
};

export default MyRoutesPage;