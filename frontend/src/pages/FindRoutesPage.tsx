import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAppData } from '../contexts/AppDataContext';
import { useWeb3 } from '../contexts/Web3Context';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  MapPin, 
  Calendar, 
  User, 
  Package, 
  Clock, 
  DollarSign, 
  ArrowRight, 
  Loader, 
  AlertCircle,
  Filter,
  X,
  RefreshCw,
  Info,
  Sparkles,
  Zap,
  Star,
  CheckCircle2
} from 'lucide-react';
import { TravelRoute } from '../types';
import { RouteMatchingService } from '../services/ai';

// Initialize AI service
const routeMatchingService = new RouteMatchingService();

const FindRoutesPage: React.FC = () => {
  const { state, loadRoutes, isLoading, error } = useAppData();
  const { account, provider, chainId, connectWallet } = useWeb3();
  
  const [filters, setFilters] = useState({
    departureLocation: '',
    destinationLocation: '',
    fromDate: '',
    toDate: '',
    minSpace: '',
    maxPrice: ''
  });
  
  const [filteredRoutes, setFilteredRoutes] = useState<TravelRoute[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [sortOption, setSortOption] = useState('departureTime');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [blockchainError, setBlockchainError] = useState<string | null>(null);
  
  // AI matching state
  const [useAIMatching, setUseAIMatching] = useState(true);
  const [isAIMatching, setIsAIMatching] = useState(false);
  const [aiMatchedRoutes, setAIMatchedRoutes] = useState<TravelRoute[]>([]);
  const [bestMatch, setBestMatch] = useState<TravelRoute | undefined>();
  const [matchExplanation, setMatchExplanation] = useState<string[]>([]);
  const [packageDetails, setPackageDetails] = useState({
    weight: 1,
    urgency: 'medium' as 'low' | 'medium' | 'high'
  });
  
  // Load routes from blockchain
  const fetchRoutesFromBlockchain = useCallback(async () => {
    setIsRefreshing(true);
    setBlockchainError(null);
    
    try {
      await loadRoutes();
    } catch (err: any) {
      console.error("Error fetching routes:", err);
      setBlockchainError(err.message || "Failed to load routes from blockchain");
    } finally {
      setIsRefreshing(false);
    }
  }, [loadRoutes]);
  
  // Initial load
  useEffect(() => {
    fetchRoutesFromBlockchain();
  }, [fetchRoutesFromBlockchain]);
  
  // Apply filters when routes change
  useEffect(() => {
    applyFilters();
  }, [state.routes, filters, sortOption]);
  
  // Apply AI matching when filtered routes change
  useEffect(() => {
    if (useAIMatching && filteredRoutes.length > 0) {
      applyAIMatching();
    }
  }, [filteredRoutes, useAIMatching, packageDetails]);
  
  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFilters({
      ...filters,
      [name]: value
    });
  };
  
  const handlePackageDetailChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setPackageDetails({
      ...packageDetails,
      [name]: name === 'weight' ? Number(value) : value
    });
  };
  
  const clearFilters = () => {
    setFilters({
      departureLocation: '',
      destinationLocation: '',
      fromDate: '',
      toDate: '',
      minSpace: '',
      maxPrice: ''
    });
  };
  
  const applyFilters = () => {
    // Start with all routes
    let filtered = [...state.routes];
    
    // Apply filters
    if (filters.departureLocation) {
      filtered = filtered.filter(route => 
        route.departureLocation.toLowerCase().includes(filters.departureLocation.toLowerCase())
      );
    }
    
    if (filters.destinationLocation) {
      filtered = filtered.filter(route => 
        route.destinationLocation.toLowerCase().includes(filters.destinationLocation.toLowerCase())
      );
    }
    
    if (filters.fromDate) {
      const fromTimestamp = new Date(filters.fromDate).getTime() / 1000;
      filtered = filtered.filter(route => route.departureTime >= fromTimestamp);
    }
    
    if (filters.toDate) {
      const toTimestamp = new Date(filters.toDate).getTime() / 1000;
      filtered = filtered.filter(route => route.departureTime <= toTimestamp);
    }
    
    if (filters.minSpace) {
      const minSpace = parseFloat(filters.minSpace) * 1000; // Convert to grams
      filtered = filtered.filter(route => route.availableSpace >= minSpace);
    }
    
    if (filters.maxPrice) {
      const maxPrice = parseFloat(filters.maxPrice) * 1000000; // Convert to smallest unit
      filtered = filtered.filter(route => {
        const price = Number(typeof route.pricePerKg === 'string' ? route.pricePerKg : route.pricePerKg.toString());
        return price <= maxPrice;
      });
    }
    
    // Sort routes by the selected option
    switch (sortOption) {
      case 'departureTime':
        filtered.sort((a, b) => a.departureTime - b.departureTime);
        break;
      case 'price':
        filtered.sort((a, b) => {
          try {
            const priceA = Number(typeof a.pricePerKg === 'string' ? a.pricePerKg : a.pricePerKg.toString());
            const priceB = Number(typeof b.pricePerKg === 'string' ? b.pricePerKg : b.pricePerKg.toString());
            return priceA - priceB;
          } catch (err) {
            return 0;
          }
        });
        break;
      case 'space':
        filtered.sort((a, b) => b.availableSpace - a.availableSpace);
        break;
      default:
        filtered.sort((a, b) => a.departureTime - b.departureTime);
    }
    
    setFilteredRoutes(filtered);
  };
  
  const applyAIMatching = async () => {
    setIsAIMatching(true);
    
    try {
      // Create user preferences from filters
      const userPreferences = {
        maxPrice: filters.maxPrice ? parseFloat(filters.maxPrice) : undefined,
        earliestDeparture: filters.fromDate ? new Date(filters.fromDate) : undefined,
        latestArrival: filters.toDate ? new Date(filters.toDate) : undefined,
      };
      
      // Get AI matched routes
      const result = await routeMatchingService.findOptimalRoutes(
        filters.departureLocation || '',
        filters.destinationLocation || '',
        packageDetails,
        userPreferences,
        filteredRoutes
      );
      
      setAIMatchedRoutes(result.routes);
      setBestMatch(result.bestMatch);
      setMatchExplanation(result.matchExplanation);
    } catch (error) {
      console.error("AI matching failed:", error);
      // Fallback to normal filtered routes
      setAIMatchedRoutes(filteredRoutes);
      setBestMatch(undefined);
      setMatchExplanation(["AI matching encountered an error. Showing standard results instead."]);
    } finally {
      setIsAIMatching(false);
    }
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
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };
  
  // Format price from the smallest unit (6 decimals for USDC)
  const formatPrice = (price: string | number) => {
    try {
      const priceValue = typeof price === 'string' ? price : price.toString();
      return (Number(priceValue) / 1000000).toFixed(2);
    } catch (err) {
      console.error("Error formatting price:", err);
      return "0.00";
    }
  };
  
  // Calculate days until departure
  const getDaysUntilDeparture = (timestamp: number) => {
    const now = Math.floor(Date.now() / 1000);
    const diffSeconds = timestamp - now;
    const diffDays = Math.floor(diffSeconds / (60 * 60 * 24));
    
    if (diffDays < 0) return 'Departed';
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    return `${diffDays} days`;
  };

  // Get the routes to display based on AI matching setting
  const displayedRoutes = useAIMatching ? aiMatchedRoutes : filteredRoutes;

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header section with animated gradient text */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 gap-4"
      >
        <h1 className="text-3xl md:text-4xl font-bold">
          Find <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">Available Routes</span>
        </h1>
        
        <div className="flex items-center gap-2">
          <button 
            onClick={fetchRoutesFromBlockchain} 
            disabled={isRefreshing || isLoading}
            className="flex items-center justify-center p-2 bg-gray-800 rounded-full hover:bg-gray-700 text-gray-200 transition-colors"
            title="Refresh routes from blockchain"
          >
            <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
          
          <button 
            onClick={() => setShowFilters(!showFilters)} 
            className="md:hidden flex items-center justify-center p-2 bg-gray-800 rounded-full hover:bg-gray-700 text-gray-200 transition-colors"
            title="Toggle filters"
          >
            {showFilters ? <X className="w-5 h-5" /> : <Filter className="w-5 h-5" />}
          </button>
        </div>
      </motion.div>
      
      {/* Error displays */}
      <AnimatePresence>
        {(error || blockchainError) && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-red-900/30 border border-red-600 text-red-200 px-4 py-3 rounded-lg mb-6 flex items-center"
          >
            <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
            <span>{error || blockchainError}</span>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* AI Matching Toggle */}
      <div className="bg-indigo-950 border-2 border-indigo-500 rounded-lg p-4 mb-6 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="bg-indigo-600 p-2 rounded-lg mr-3">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">AI Route Matching</h3>
              <p className="text-sm text-indigo-200">Let AI find the best route for your package</p>
            </div>
          </div>
          <button
            onClick={() => setUseAIMatching(!useAIMatching)}
            className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
              useAIMatching ? 'bg-indigo-600' : 'bg-gray-700'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-300 ${
                useAIMatching ? 'translate-x-7' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>
      
      {/* AI Package Details */}
      {useAIMatching && (
        <div className="bg-indigo-950 border-2 border-indigo-500 rounded-lg p-6 mb-6 shadow-lg">
          <h4 className="text-lg font-bold text-white mb-4 flex items-center">
            <div className="bg-indigo-600 p-2 rounded-lg mr-3">
              <Zap className="w-5 h-5 text-white" />
            </div>
            Package Details for AI Matching
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-indigo-200 mb-2">Package Weight (kg)</label>
              <input
                type="number"
                name="weight"
                value={packageDetails.weight}
                onChange={handlePackageDetailChange}
                min="0.1"
                step="0.1"
                className="w-full bg-gray-900 border-2 border-indigo-500/50 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Enter package weight"
              />
            </div>
            
            <div>
              <label className="block text-sm font-bold text-indigo-200 mb-2">Delivery Urgency</label>
              <select
                name="urgency"
                value={packageDetails.urgency}
                onChange={handlePackageDetailChange}
                className="w-full bg-gray-900 border-2 border-indigo-500/50 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="low">Low - I'm flexible</option>
                <option value="medium">Medium - Normal delivery</option>
                <option value="high">High - Need it ASAP</option>
              </select>
            </div>
          </div>
        </div>
      )}
      
      {/* Search section */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="bg-gray-800 rounded-xl shadow-lg overflow-hidden p-4 mb-6 border border-gray-700"
      >
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <MapPin className="absolute left-3 top-3 w-5 h-5 text-indigo-400" />
            <input
              type="text"
              name="departureLocation"
              value={filters.departureLocation}
              onChange={handleFilterChange}
              placeholder="Departure City"
              className="w-full bg-gray-700 pl-10 pr-3 py-3 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white placeholder-gray-400"
            />
          </div>
          
          <div className="relative flex-1">
            <MapPin className="absolute left-3 top-3 w-5 h-5 text-green-400" />
            <input
              type="text"
              name="destinationLocation"
              value={filters.destinationLocation}
              onChange={handleFilterChange}
              placeholder="Destination City"
              className="w-full bg-gray-700 pl-10 pr-3 py-3 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white placeholder-gray-400"
            />
          </div>
          
          <div className="relative md:w-48">
            <Calendar className="absolute left-3 top-3 w-5 h-5 text-indigo-400" />
            <input
              type="date"
              name="fromDate"
              value={filters.fromDate}
              onChange={handleFilterChange}
              className="w-full bg-gray-700 pl-10 pr-3 py-3 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white"
            />
          </div>
          
          <button
            onClick={applyFilters}
            className="flex items-center justify-center px-6 py-3 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white font-medium rounded-lg hover:opacity-90 transition-all duration-300 shadow-md"
          >
            <Search className="w-5 h-5 md:mr-2" />
            <span className="hidden md:inline">Search Routes</span>
          </button>
        </div>
        
        {/* Advanced filters (mobile: toggle, desktop: always visible) */}
        <div className={`${showFilters || 'hidden md:block'} mt-4 pt-4 border-t border-gray-700`}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="relative">
              <Calendar className="absolute left-3 top-3 w-5 h-5 text-green-400" />
              <input
                type="date"
                name="toDate"
                value={filters.toDate}
                onChange={handleFilterChange}
                placeholder="To Date"
                className="w-full bg-gray-700 pl-10 pr-3 py-3 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white placeholder-gray-400"
              />
            </div>
            
            <div className="relative">
              <Package className="absolute left-3 top-3 w-5 h-5 text-indigo-400" />
              <input
                type="number"
                name="minSpace"
                value={filters.minSpace}
                onChange={handleFilterChange}
                min="0"
                step="0.1"
                placeholder="Min Space (kg)"
                className="w-full bg-gray-700 pl-10 pr-3 py-3 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white placeholder-gray-400"
              />
            </div>
            
            <div className="relative">
              <DollarSign className="absolute left-3 top-3 w-5 h-5 text-indigo-400" />
              <input
                type="number"
                name="maxPrice"
                value={filters.maxPrice}
                onChange={handleFilterChange}
                min="0"
                step="0.1"
                placeholder="Max Price per kg (USDC)"
                className="w-full bg-gray-700 pl-10 pr-3 py-3 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white placeholder-gray-400"
              />
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row justify-between mt-3 gap-3">
            <div className="flex items-center space-x-2">
              <label className="text-sm text-gray-400">Sort by:</label>
              <select
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value)}
                className="bg-gray-700 text-white text-sm rounded-lg border border-gray-600 focus:ring-indigo-500 focus:border-indigo-500 p-2"
              >
                <option value="departureTime">Soonest Departure</option>
                <option value="price">Lowest Price</option>
                <option value="space">Most Space</option>
              </select>
            </div>
            
            <button
              onClick={clearFilters}
              className="text-indigo-400 hover:text-indigo-300 font-medium text-sm"
            >
              Clear All Filters
            </button>
          </div>
        </div>
      </motion.div>
      
      {/* Blockchain note for users */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="bg-indigo-900/20 border border-indigo-600/30 rounded-lg p-4 mb-6 flex items-start sm:items-center"
      >
        <Info className="w-5 h-5 text-indigo-400 mr-2 flex-shrink-0 mt-0.5 sm:mt-0" />
        <div className="text-sm text-gray-300">
          <span className="font-medium text-indigo-300">Blockchain-powered deliveries.</span> All routes are stored on the Base blockchain, ensuring security and transparency for your deliveries.
          {!account && <span className="ml-1 text-indigo-400 font-medium hover:text-indigo-300 cursor-pointer" onClick={connectWallet}>Connect your wallet</span>} to book a delivery.
        </div>
      </motion.div>
      
      {/* AI Matching Results */}
      {useAIMatching && (
        <AnimatePresence>
          {isAIMatching ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.5 }}
              className="bg-indigo-950 border-2 border-indigo-500 rounded-lg p-8 mb-6 shadow-lg flex justify-center items-center"
            >
              <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-indigo-500 border-t-white mb-4"></div>
                <p className="text-xl font-bold text-white">AI is analyzing routes for your package...</p>
                <p className="text-indigo-200 mt-2">Finding the perfect match based on your preferences</p>
              </div>
            </motion.div>
          ) : (bestMatch && matchExplanation.length > 0) && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.5 }}
              className="bg-indigo-950 border-2 border-indigo-500 rounded-lg p-6 mb-6 shadow-lg"
            >
              <div className="flex items-center mb-4">
                <div className="bg-yellow-500 p-2 rounded-lg mr-3">
                  <Star className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white">AI Recommended Route</h3>
              </div>
              
              <div className="bg-gray-900 border-2 border-indigo-500 rounded-lg overflow-hidden relative">
                <div className="absolute top-3 right-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-bold px-4 py-1.5 rounded-full flex items-center shadow-lg">
                  <Sparkles className="w-4 h-4 mr-1.5" />
                  AI Recommended
                </div>
                <RouteCard 
                  route={bestMatch} 
                  formatDate={formatDate} 
                  formatAddress={formatAddress}
                  formatPrice={formatPrice}
                  getDaysUntilDeparture={getDaysUntilDeparture}
                  isBestMatch={true}
                />
              </div>
              
              <div className="mt-6 space-y-3">
                {matchExplanation.map((explanation, index) => (
                  <div key={index} className="flex items-start bg-gray-900/50 p-3 rounded-lg border border-gray-700">
                    {explanation.startsWith('✓') ? (
                      <div className="bg-green-600 p-1.5 rounded-lg mr-3">
                        <CheckCircle2 className="w-5 h-5 text-white" />
                      </div>
                    ) : explanation.startsWith('!') ? (
                      <div className="bg-yellow-600 p-1.5 rounded-lg mr-3">
                        <AlertCircle className="w-5 h-5 text-white" />
                      </div>
                    ) : (
                      <div className="bg-indigo-600 p-1.5 rounded-lg mr-3">
                        <Info className="w-5 h-5 text-white" />
                      </div>
                    )}
                    <p className="text-white font-medium">{explanation.replace(/^[✓!] /, '')}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      )}
      
      {/* Results section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="bg-gray-800 rounded-xl shadow-lg overflow-hidden p-6 border border-gray-700"
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-white flex items-center">
            {displayedRoutes.length} {displayedRoutes.length === 1 ? 'Route' : 'Routes'} Found
            {useAIMatching && <span className="ml-2 text-xs bg-indigo-600/60 text-white px-2 py-0.5 rounded-full">AI Matched</span>}
          </h2>
          
          {/* Display total routes count */}
          <span className="text-sm text-gray-400">
            Total routes in blockchain: {state.routes.length}
          </span>
        </div>
        
        {isLoading || isRefreshing ? (
          <div className="flex flex-col justify-center items-center py-12">
            <Loader className="w-10 h-10 text-indigo-500 animate-spin mb-4" />
            <p className="text-gray-400">Loading routes from blockchain...</p>
            <p className="text-gray-500 text-sm mt-2">This may take a moment</p>
          </div>
        ) : displayedRoutes.length === 0 ? (
          <div className="text-center py-12">
            <div className="bg-gray-700/50 rounded-full w-20 h-20 mx-auto flex items-center justify-center mb-4">
              <Package className="w-10 h-10 text-gray-400" />
            </div>
            <p className="text-xl font-semibold text-gray-300 mb-2">No routes found</p>
            <p className="text-gray-400 max-w-md mx-auto mb-6">
              {state.routes.length > 0 
                ? "Try adjusting your filters to see available routes."
                : "There are no routes available on the blockchain at the moment."}
            </p>
            {state.routes.length > 0 && (
              <button
                onClick={clearFilters}
                className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-lg transition-colors"
              >
                Clear All Filters
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {displayedRoutes.map(route => (
              <RouteCard 
                key={route.id} 
                route={route} 
                formatDate={formatDate} 
                formatAddress={formatAddress}
                formatPrice={formatPrice}
                getDaysUntilDeparture={getDaysUntilDeparture}
                isBestMatch={bestMatch?.id === route.id}
              />
            ))}
          </div>
        )}
      </motion.div>
      
     {/* Display all routes directly if no filtered routes are visible */}
     {displayedRoutes.length === 0 && state.routes.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="bg-gray-800 rounded-xl shadow-lg overflow-hidden p-6 border border-indigo-700 mt-6"
        >
          <h2 className="text-xl font-semibold text-indigo-300 mb-4">All Available Routes</h2>
          <p className="text-gray-400 mb-4">
            Showing all routes from the blockchain, bypassing filters to ensure visibility:
          </p>
          
          <div className="space-y-4">
            {state.routes.map(route => (
              <RouteCard 
                key={route.id} 
                route={route} 
                formatDate={formatDate} 
                formatAddress={formatAddress}
                formatPrice={formatPrice}
                getDaysUntilDeparture={getDaysUntilDeparture}
                isBestMatch={false}
              />
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
};

// Route Card Component
interface RouteCardProps {
  route: TravelRoute;
  formatDate: (timestamp: number) => string;
  formatAddress: (address: string) => string;
  formatPrice: (price: string | number) => string;
  getDaysUntilDeparture: (timestamp: number) => string;
  isBestMatch?: boolean;
}

const RouteCard: React.FC<RouteCardProps> = ({ 
  route, 
  formatDate, 
  formatAddress,
  formatPrice,
  getDaysUntilDeparture,
  isBestMatch = false
}) => {
  return (
    <motion.div 
      whileHover={{ scale: 1.01 }}
      transition={{ duration: 0.2 }}
      className={`border ${isBestMatch ? 'border-indigo-500 bg-indigo-900/20' : 'border-gray-700 hover:border-indigo-500 bg-gray-800/50'} rounded-xl overflow-hidden transition-colors duration-200 relative`}
    >
      {isBestMatch && (
        <div className="absolute top-2 right-2 flex items-center bg-indigo-600 text-white text-xs font-medium px-2 py-1 rounded-full">
          <Star className="w-3 h-3 mr-1" />
          Best Match
        </div>
      )}
      
      <div className="p-5">
        <div className="flex flex-wrap md:flex-nowrap gap-6">
          {/* Left section - From/To */}
          <div className="w-full md:w-1/3">
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
                  <div className="font-semibold text-white">{route.departureLocation}</div>
                  <div className="text-sm text-gray-400 mt-1">
                    {formatDate(route.departureTime)}
                  </div>
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
                  <div className="font-semibold text-white">{route.destinationLocation}</div>
                  <div className="text-sm text-gray-400 mt-1">
                    {formatDate(route.arrivalTime)}
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Middle section - Traveler, Space & Time */}
          <div className="w-full md:w-1/3 md:border-l border-gray-700 md:pl-6">
            <div className="flex flex-col space-y-3">
              <div className="flex items-center">
                <User className="w-5 h-5 text-indigo-400 mr-2 flex-shrink-0" />
                <div>
                  <div className="text-sm text-gray-400">Traveler</div>
                  <Link 
                    to={`/profile/${route.traveler}`} 
                    className="font-medium text-indigo-400 hover:text-indigo-300 transition-colors"
                  >
                    {formatAddress(route.traveler)}
                  </Link>
                </div>
              </div>
              
              <div className="flex items-center">
                <Package className="w-5 h-5 text-indigo-400 mr-2 flex-shrink-0" />
                <div>
                  <div className="text-sm text-gray-400">Available Space</div>
                  <div className="font-medium text-white">{(route.availableSpace / 1000).toFixed(1)} kg</div>
                </div>
              </div>
              
              <div className="flex items-center">
                <Clock className="w-5 h-5 text-indigo-400 mr-2 flex-shrink-0" />
                <div>
                  <div className="text-sm text-gray-400">Departs in</div>
                  <div className="font-medium text-white">{getDaysUntilDeparture(route.departureTime)}</div>
                </div>
              </div>
              
              {/* Add AI match score indicator for matched routes */}
              {isBestMatch && (
                <div className="flex items-center">
                  <CheckCircle2 className="w-5 h-5 text-green-400 mr-2 flex-shrink-0" />
                  <div>
                    <div className="text-sm text-gray-400">AI Match</div>
                    <div className="font-medium text-green-400">Perfect for your package</div>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Right section - Price & Action */}
          <div className="w-full md:w-1/3 md:border-l border-gray-700 md:pl-6 flex flex-col justify-between">
            <div className="flex items-center mb-4">
              <DollarSign className="w-5 h-5 text-indigo-400 mr-2 flex-shrink-0" />
              <div>
                <div className="text-sm text-gray-400">Price per kg</div>
                <div className={`font-bold text-xl ${isBestMatch ? 'text-green-400' : 'bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400'}`}>
                  {formatPrice(route.pricePerKg)} USDC
                </div>
              </div>
            </div>
            
            <Link
              to={`/route/${route.id}`}
              className={`${isBestMatch 
                ? 'bg-green-600 hover:bg-green-700' 
                : 'bg-indigo-500 hover:bg-indigo-600'} 
              text-white text-center font-medium py-3 px-4 rounded-lg flex items-center justify-center transition-colors`}
            >
              <span>View Details</span>
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default FindRoutesPage;