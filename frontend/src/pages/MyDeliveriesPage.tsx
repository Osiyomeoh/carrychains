import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useWeb3 } from '../contexts/Web3Context';
import { useAppData } from '../contexts/AppDataContext';
import { DeliveryStatus, Delivery, TravelRoute } from '../types';
import { 
  Package, 
  Check, 
  Clock, 
  MapPin, 
  User, 
  CalendarDays,
  DollarSign,
  ArrowRight,
  Loader,
  AlertCircle
} from 'lucide-react';

const MyDeliveriesPage: React.FC = () => {
  const { account, connectWallet } = useWeb3();
  const { state, loadMyDeliveries, acceptDelivery, isLoading, error } = useAppData();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState<'sending' | 'carrying'>('sending');
  const [isAccepting, setIsAccepting] = useState<number | null>(null);
  
  useEffect(() => {
    if (account) {
      loadMyDeliveries();
    }
  }, [account, loadMyDeliveries]);
  
  const handleAcceptDelivery = async (deliveryId: number) => {
    if (!account) return;
    
    setIsAccepting(deliveryId);
    try {
      await acceptDelivery(deliveryId);
      // Reload deliveries after accepting
      await loadMyDeliveries();
    } catch (error) {
      console.error("Error accepting delivery:", error);
    } finally {
      setIsAccepting(null);
    }
  };
  
  const getFilteredDeliveries = (): Delivery[] => {
    if (activeTab === 'sending') {
      return state.myDeliveries.asShipper || [];
    } else {
      return state.myDeliveries.asTraveler || [];
    }
  };
  
  const getStatusBadgeClass = (status: DeliveryStatus) => {
    switch (status) {
      case DeliveryStatus.Created:
        return 'bg-yellow-500/20 text-yellow-300 border-yellow-500';
      case DeliveryStatus.Accepted:
        return 'bg-blue-500/20 text-blue-300 border-blue-500';
      case DeliveryStatus.PickedUp:
        return 'bg-purple-500/20 text-purple-300 border-purple-500';
      case DeliveryStatus.Delivered:
        return 'bg-green-500/20 text-green-300 border-green-500';
      case DeliveryStatus.Completed:
        return 'bg-indigo-500/20 text-indigo-300 border-indigo-500';
      default:
        return 'bg-gray-500/20 text-gray-300 border-gray-500';
    }
  };
  
  const getStatusText = (status: DeliveryStatus) => {
    switch (status) {
      case DeliveryStatus.Created:
        return 'Pending Acceptance';
      case DeliveryStatus.Accepted:
        return 'Accepted';
      case DeliveryStatus.PickedUp:
        return 'Picked Up';
      case DeliveryStatus.Delivered:
        return 'Delivered';
      case DeliveryStatus.Completed:
        return 'Completed';
      default:
        return 'Unknown';
    }
  };
  
  // Helper to format date from timestamp
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };
  
  // Helper to format address
  const formatAddress = (address: string) => {
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };
  
  const filteredDeliveries = getFilteredDeliveries();

  // Find route info for a delivery
  const getRouteInfo = (deliveryRouteId: number) => {
    return state.routes.find((route: TravelRoute) => route.id === deliveryRouteId);
  };

  return (
    <div className="max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">
        My <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">Deliveries</span>
      </h1>
      
      {!account ? (
        <div className="bg-gray-800 rounded-xl p-8 text-center border border-gray-700">
          <Package className="w-16 h-16 text-indigo-400 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold mb-4">Connect Wallet to View Your Deliveries</h2>
          <p className="text-gray-400 mb-6 max-w-md mx-auto">
            Connect your wallet to see deliveries you're sending or carrying.
          </p>
          <button
            onClick={connectWallet}
            className="px-6 py-3 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white font-medium rounded-lg"
          >
            Connect Wallet
          </button>
        </div>
      ) : (
        <>
          {/* Tabs */}
          <div className="flex border-b border-gray-700 mb-6">
            <button
              className={`px-4 py-3 text-lg font-medium ${
                activeTab === 'sending'
                  ? 'text-indigo-400 border-b-2 border-indigo-500'
                  : 'text-gray-400 hover:text-gray-300'
              }`}
              onClick={() => setActiveTab('sending')}
            >
              Deliveries I'm Sending
            </button>
            <button
              className={`px-4 py-3 text-lg font-medium ml-8 ${
                activeTab === 'carrying'
                  ? 'text-indigo-400 border-b-2 border-indigo-500'
                  : 'text-gray-400 hover:text-gray-300'
              }`}
              onClick={() => setActiveTab('carrying')}
            >
              Deliveries I'm Carrying
            </button>
          </div>
          
          {/* Error display */}
          {error && (
            <div className="bg-red-900/30 border border-red-600 text-red-200 px-4 py-3 rounded-lg mb-6 flex items-center">
              <AlertCircle className="w-5 h-5 mr-2" />
              <span>{error}</span>
            </div>
          )}
          
          {/* Deliveries list */}
          {isLoading ? (
  <div className="flex flex-col items-center justify-center py-12">
    <Loader className="w-10 h-10 text-indigo-500 animate-spin mb-4" />
    <p className="text-gray-400">Loading your deliveries...</p>
    {state.loadingProgress && (
      <div className="mt-2 text-sm text-gray-500">
        <p>Processing batch {state.loadingProgress.current} of {state.loadingProgress.total}</p>
        <p>Found {state.loadingProgress.routesFound} routes so far</p>
        <div className="w-64 h-2 bg-gray-700 rounded-full mt-2">
          <div 
            className="h-full bg-indigo-500 rounded-full" 
            style={{ 
              width: `${(state.loadingProgress.current / state.loadingProgress.total) * 100}%` 
            }}
          ></div>
        </div>
      </div>
    )}
  </div>
) : filteredDeliveries.length === 0 ? (
            <div className="bg-gray-800 rounded-xl p-8 text-center border border-gray-700">
              <Package className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h2 className="text-2xl font-semibold mb-4">No Deliveries Found</h2>
              <p className="text-gray-400 mb-6 max-w-md mx-auto">
                {activeTab === 'sending'
                  ? "You haven't created any deliveries yet. Explore available routes to get started!"
                  : "You aren't carrying any deliveries yet. Check back later for delivery requests."}
              </p>
              {activeTab === 'sending' && (
                <Link
                  to="/find-routes"
                  className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg inline-block"
                >
                  Find Routes
                </Link>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {filteredDeliveries.map((delivery: Delivery) => {
                const route = getRouteInfo(delivery.routeId);
                return (
                <div
                  key={delivery.id}
                  className="bg-gray-800 border border-gray-700 hover:border-indigo-500 rounded-xl overflow-hidden transition-colors duration-200"
                >
                  <div className="p-6">
                    <div className="flex flex-wrap md:flex-nowrap gap-6">
                      {/* Left section - Route info */}
                      <div className="w-full md:w-1/3">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center">
                            <Package className="w-5 h-5 text-indigo-400 mr-2" />
                            <h3 className="font-medium text-white">Delivery #{delivery.id}</h3>
                          </div>
                          <div className={`px-3 py-1 text-xs font-medium rounded-full border ${getStatusBadgeClass(delivery.status)}`}>
                            {getStatusText(delivery.status)}
                          </div>
                        </div>
                        
                        <div className="flex flex-col space-y-4">
                          <div className="flex">
                            <div className="mr-3 flex flex-col items-center">
                              <div className="w-8 h-8 rounded-full bg-indigo-500/20 border border-indigo-500 flex items-center justify-center">
                                <MapPin className="w-4 h-4 text-indigo-400" />
                              </div>
                              <div className="w-0.5 h-10 bg-gray-700"></div>
                            </div>
                            <div>
                              <div className="text-sm text-gray-400">From</div>
                              <div className="font-medium text-white">{route?.departureLocation || 'Loading...'}</div>
                            </div>
                          </div>
                          
                          <div className="flex">
                            <div className="mr-3 flex flex-col items-center">
                              <div className="w-8 h-8 rounded-full bg-green-500/20 border border-green-500 flex items-center justify-center">
                                <MapPin className="w-4 h-4 text-green-400" />
                              </div>
                            </div>
                            <div>
                              <div className="text-sm text-gray-400">To</div>
                              <div className="font-medium text-white">{route?.destinationLocation || 'Loading...'}</div>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Middle section - Details */}
                      <div className="w-full md:w-1/3 md:border-l border-gray-700 md:pl-6">
                        <div className="flex flex-col space-y-3">
                          <div className="flex items-center">
                            <User className="w-5 h-5 text-indigo-400 mr-2" />
                            <div>
                              <div className="text-sm text-gray-400">
                                {activeTab === 'sending' ? 'Carrier' : 'Shipper'}
                              </div>
                              <Link
                                to={`/profile/${activeTab === 'sending' ? delivery.traveler : delivery.shipper}`}
                                className="font-medium text-indigo-400 hover:text-indigo-300 transition-colors"
                              >
                                {formatAddress(activeTab === 'sending' ? delivery.traveler : delivery.shipper)}
                              </Link>
                            </div>
                          </div>
                          
                          <div className="flex items-center">
                            <CalendarDays className="w-5 h-5 text-indigo-400 mr-2" />
                            <div>
                              <div className="text-sm text-gray-400">Departure Date</div>
                              <div className="font-medium text-white">{route ? formatDate(route.departureTime) : 'Loading...'}</div>
                            </div>
                          </div>
                          
                          <div className="flex items-center">
                            <Package className="w-5 h-5 text-indigo-400 mr-2" />
                            <div>
                              <div className="text-sm text-gray-400">Package Weight</div>
                              <div className="font-medium text-white">{(delivery.packageWeight / 1000).toFixed(1)} kg</div>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Right section - Price & Actions */}
                      <div className="w-full md:w-1/3 md:border-l border-gray-700 md:pl-6 flex flex-col justify-between">
                        <div className="flex items-center mb-4">
                          <DollarSign className="w-5 h-5 text-indigo-400 mr-2" />
                          <div>
                            <div className="text-sm text-gray-400">Total Price</div>
                            <div className="font-bold text-xl bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">
                              {(Number(delivery.totalPrice) / 1000000).toFixed(2)} USDC
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex flex-col space-y-3">
                          {/* Accept Delivery Button - Only show for carriers with CREATED status */}
                          {activeTab === 'carrying' && delivery.status === DeliveryStatus.Created && (
                            <button
                              onClick={() => handleAcceptDelivery(delivery.id)}
                              disabled={isAccepting === delivery.id}
                              className="flex items-center justify-center px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
                            >
                              {isAccepting === delivery.id ? (
                                <>
                                  <Loader className="w-4 h-4 mr-2 animate-spin" />
                                  Accepting...
                                </>
                              ) : (
                                <>
                                  <Check className="w-4 h-4 mr-2" />
                                  Accept Delivery
                                </>
                              )}
                            </button>
                          )}
                          
                          {/* View Details Button */}
                          <Link
  to={`/delivery/${delivery.id}`}
  className="flex items-center justify-center px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-lg transition-colors"
>
  <span>View Details</span>
  <ArrowRight className="w-4 h-4 ml-2" />
</Link>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )})}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default MyDeliveriesPage;