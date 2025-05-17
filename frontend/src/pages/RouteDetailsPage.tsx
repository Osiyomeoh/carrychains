import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useWeb3 } from '../contexts/Web3Context';
import { useAppData } from '../contexts/AppDataContext';
import { TravelRoute } from '../types';
import { ethers } from 'ethers';
import { motion } from 'framer-motion';
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
  CircleDollarSign,
  Sparkles,
  Brain,
  ShieldCheck,
  Zap,
  Star,
  BarChart,
  CheckCircle2,
  CalendarClock,
  ArrowRight,
  Activity,
  ThumbsUp,
  LucideIcon
} from 'lucide-react';
import BaseNetworkChecker from '../components/BaseNetworkChecker';
import CustomWalletButton from '../components/CustomWalletButton';
import { FraudDetectionService, PricingOptimizationService } from '../services/ai';

// Import from local abis directory
import CarryChainMarketplaceABI from '../abis/CarryChainMarketplace.json';

// Contract addresses
const MARKETPLACE_ADDRESS = process.env.REACT_APP_MARKETPLACE_ADDRESS || '';

// Change this to 'mainnet' or 'sepolia' based on your deployment
type NetworkType = 'mainnet' | 'sepolia';
const NETWORK_TYPE: NetworkType = 'sepolia';

const isMainnet = (network: NetworkType): network is 'mainnet' => network === 'mainnet';

// Initialize AI services
const fraudDetectionService = new FraudDetectionService();
const pricingOptimizationService = new PricingOptimizationService();

// Risk level type
type RiskLevel = 'low' | 'medium' | 'high';

// Package recommendation type
interface PackageRecommendation {
  icon: LucideIcon;
  title: string;
  description: string;
  value?: string | number;
}

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
  
  // AI-related states
  const [useAI, setUseAI] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [riskAssessment, setRiskAssessment] = useState<{
    riskScore: number;
    riskLevel: RiskLevel;
    riskFactors: string[];
  } | null>(null);
  const [aiPriceRecommendation, setAiPriceRecommendation] = useState<{
    recommendedPricePerKg: number;
    confidence: number;
    marketInsights: string[];
  } | null>(null);
  const [packageRecommendations, setPackageRecommendations] = useState<PackageRecommendation[]>([]);
  const [travelerTrustScore, setTravelerTrustScore] = useState<{
    score: number;
    level: 'low' | 'medium' | 'high';
    insights: string[];
  } | null>(null);
  const [packageDimensions, setPackageDimensions] = useState({
    length: '',
    width: '',
    height: ''
  });
  const [packageValue, setPackageValue] = useState('');
  const [packageUrgency, setPackageUrgency] = useState<'low' | 'medium' | 'high'>('medium');
  
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
  
  // Get AI price recommendations when route is loaded
  useEffect(() => {
    const getAIPriceRecommendation = async () => {
      if (!route) return;
      
      try {
        const recommendation = await pricingOptimizationService.getOptimizedPricing(
          route.departureLocation,
          route.destinationLocation,
          new Date(route.departureTime * 1000),
          route.availableSpace / 1000
        );
        
        setAiPriceRecommendation(recommendation);
      } catch (error) {
        console.error("Failed to get AI price recommendation:", error);
      }
    };
    
    if (useAI && route) {
      getAIPriceRecommendation();
    }
  }, [route, useAI]);
  
  // Get traveler trust score when traveler profile is loaded
  useEffect(() => {
    const getTravelerTrustScore = () => {
      if (!travelerProfile || !route || !useAI) return;
      
      // Demo trust score calculation
      const score = travelerProfile.reputationScore || 
                   (travelerProfile.positiveReviews / Math.max(travelerProfile.totalReviews, 1)) * 100 || 
                   Math.floor(Math.random() * 100);
      
      let level: 'low' | 'medium' | 'high' = 'medium';
      if (score >= 80) level = 'high';
      else if (score < 50) level = 'low';
      
      const insights = [];
      
      if (travelerProfile.totalReviews > 10) {
        insights.push("Experienced traveler with multiple completed deliveries");
      }
      
      if (travelerProfile.positiveReviews / Math.max(travelerProfile.totalReviews, 1) > 0.9) {
        insights.push("Excellent review history with over 90% positive feedback");
      }
      
      if (travelerProfile.verifiedIdentity) {
        insights.push("Identity verified through blockchain attestation");
      }
      
      // Add default insights if none were generated
      if (insights.length === 0) {
        if (level === 'high') {
          insights.push("Trusted traveler with good delivery history");
          insights.push("Consistent record of on-time deliveries");
        } else if (level === 'medium') {
          insights.push("Moderate trust score based on available data");
          insights.push("Consider package insurance for valuable items");
        } else {
          insights.push("Limited delivery history available");
          insights.push("Recommended for non-urgent, low-value packages only");
        }
      }
      
      setTravelerTrustScore({
        score,
        level,
        insights
      });
    };
    
    getTravelerTrustScore();
  }, [travelerProfile, route, useAI]);
  
  // Generate package recommendations when route changes
  useEffect(() => {
    const generatePackageRecommendations = () => {
      if (!route || !useAI) return;
      
      const recommendations: PackageRecommendation[] = [];
      
      // Optimal weight recommendation
      const optimalWeight = Math.min(route.availableSpace / 1000, 5); // Cap at 5kg or available space
      recommendations.push({
        icon: Package,
        title: "Recommended Weight",
        description: "Optimal package weight for this route",
        value: `${optimalWeight.toFixed(1)} kg`
      });
      
      // Days until departure
      const daysToDeparture = getDaysUntilDeparture(route.departureTime, true);
      recommendations.push({
        icon: CalendarClock,
        title: "Preparation Time",
        description: "Time to prepare your package",
        value: daysToDeparture
      });
      
      // Transit Time
      const transitHours = (route.arrivalTime - route.departureTime) / 3600;
      recommendations.push({
        icon: Clock,
        title: "Transit Duration",
        description: "Estimated travel time",
        value: transitHours > 24 
          ? `${Math.floor(transitHours / 24)} days, ${Math.floor(transitHours % 24)} hours` 
          : `${Math.floor(transitHours)} hours`
      });
      
      // Package Type recommendation based on route
      let packageTypeRecommendation = {
        icon: CheckCircle2,
        title: "Suitable Package Types",
        description: "Recommended for this route",
        value: "Standard packaging"
      };
      
      // Check for international route (simplified detection)
      const isInternational = route.departureLocation.split(',').pop()?.trim() !== 
                             route.destinationLocation.split(',').pop()?.trim();
      
      if (isInternational) {
        packageTypeRecommendation.value = "Customs-ready packaging, documentation";
      }
      
      recommendations.push(packageTypeRecommendation);
      
      setPackageRecommendations(recommendations);
    };
    
    generatePackageRecommendations();
  }, [route, useAI]);
  
  // Run AI risk assessment when form fields change
  useEffect(() => {
    const runRiskAssessment = async () => {
      if (!useAI || !route || !packageWeight || !packageDescription) return;
      
      try {
        setIsAnalyzing(true);
        
        // Wait a bit to simulate AI processing
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Calculate estimated package value
        const estimatedValue = packageValue ? parseFloat(packageValue) : parseFloat(packageWeight) * 50;
        
        // Prepare user data (would come from context in a real app)
        const userData = {
          userId: account || "",
          accountAge: 30, // Days
          completedDeliveries: 2,
          ratings: [4.5, 5, 4]
        };
        
        // Prepare transaction details
        const transactionDetails = {
          packageValue: estimatedValue,
          route: {
            origin: route.departureLocation,
            destination: route.destinationLocation
          },
          paymentMethod: "USDC"
        };
        
        // Run fraud detection
        const assessment = await fraudDetectionService.analyzeRisk(
          userData,
          transactionDetails
        );
        
        // Determine risk level based on score
        let riskLevel: RiskLevel = 'medium';
        if (assessment.riskScore < 30) riskLevel = 'low';
        else if (assessment.riskScore > 70) riskLevel = 'high';
        
        setRiskAssessment({
          riskScore: assessment.riskScore,
          riskLevel,
          riskFactors: assessment.riskFactors
        });
      } catch (error) {
        console.error("Error running risk assessment:", error);
      } finally {
        setIsAnalyzing(false);
      }
    };
    
    if (useAI && packageWeight && packageDescription) {
      const timer = setTimeout(() => {
        runRiskAssessment();
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [useAI, route, packageWeight, packageDescription, packageValue, account]);
  
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
    
    // Original booking logic...
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
    
    // AI risk check
    if (useAI && riskAssessment && riskAssessment.riskLevel === 'high') {
      const proceed = window.confirm(
        "AI has identified high risk factors for this delivery. Do you want to proceed anyway?\n\n" +
        riskAssessment.riskFactors.join("\n")
      );
      
      if (!proceed) return;
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
  
  // Calculate days until departure
  const getDaysUntilDeparture = (timestamp: number, asText = false): string | number => {
    const now = Math.floor(Date.now() / 1000);
    const diffSeconds = timestamp - now;
    const diffDays = Math.floor(diffSeconds / (60 * 60 * 24));
    
    if (!asText) return diffDays;
    
    if (diffDays < 0) return 'Departed';
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    return `${diffDays} days`;
  };
  
  // Get color based on risk level
  const getRiskColor = (level: RiskLevel) => {
    switch (level) {
      case 'low': return 'text-green-400';
      case 'medium': return 'text-yellow-400';
      case 'high': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };
  
  // Get color based on trust level
  const getTrustColor = (level: 'low' | 'medium' | 'high') => {
    switch (level) {
      case 'low': return 'text-red-400';
      case 'medium': return 'text-yellow-400';
      case 'high': return 'text-green-400';
      default: return 'text-gray-400';
    }
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
        
        {/* AI Toggle Section */}
        <div className={`mb-6 p-4 rounded-xl ${useAI 
          ? 'bg-gradient-to-r from-violet-900/50 via-indigo-900/50 to-blue-900/50 border-2 border-indigo-500' 
          : 'bg-gray-800 border border-gray-700'
        } flex justify-between items-center`}>
          <div className="flex items-center">
            <div className={`mr-3 ${useAI ? 'bg-indigo-600' : 'bg-gray-700'} rounded-lg p-2 transition-colors duration-300`}>
              <Brain className={`w-5 h-5 ${useAI ? 'text-white' : 'text-gray-400'}`} />
            </div>
            <div>
              <h3 className="font-semibold text-white">AI Package Assistant</h3>
              <p className={`text-sm ${useAI ? 'text-indigo-200' : 'text-gray-400'}`}>
                {useAI 
                  ? "Get AI recommendations for your package" 
                  : "Enable AI for personalized package suggestions"}
              </p>
            </div>
          </div>
          
          <button 
            onClick={() => setUseAI(!useAI)}
            className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors duration-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 ${useAI ? 'bg-indigo-600' : 'bg-gray-700'}`}
          >
            <span
              className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform duration-300 ${useAI ? 'translate-x-6' : 'translate-x-1'}`}
            />
          </button>
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
                      
                      {/* AI Price Insight */}
                      {useAI && aiPriceRecommendation && (
                        <div className="flex items-center mt-1 text-xs">
                          {(route.pricePerKg / 1000000) <= aiPriceRecommendation.recommendedPricePerKg ? (
                            <span className="flex items-center text-green-400">
                              <ThumbsUp className="w-3 h-3 mr-1" />
                              Good value (market avg: {aiPriceRecommendation.recommendedPricePerKg.toFixed(2)} USDC)
                            </span>
                          ) : (
                            <span className="flex items-center text-yellow-400">
                              <Info className="w-3 h-3 mr-1" />
                              {((route.pricePerKg / 1000000) / aiPriceRecommendation.recommendedPricePerKg * 100 - 100).toFixed(0)}% above market average
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Traveler Info Section - Enhanced with AI Trust Score */}
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
              
              {useAI && travelerTrustScore ? (
                <div className="bg-gray-900/60 p-4 rounded-lg border border-gray-700">
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-sm text-white font-medium flex items-center">
                      <ShieldCheck className="w-4 h-4 mr-1 text-indigo-400" />
                      AI Trust Score
                    </div>
                    <div className={`flex items-center ${getTrustColor(travelerTrustScore.level)}`}>
  <span className="font-bold text-lg">{travelerTrustScore.score}%</span>
  <div className="ml-2 px-2 py-0.5 rounded text-xs bg-gray-800">
    {travelerTrustScore.level === 'high' ? 'Trusted' : 
     travelerTrustScore.level === 'medium' ? 'Moderate' : 'Caution'}
  </div>
</div>
                  </div>
                  
                  <div className="space-y-2">
                    {travelerTrustScore.insights.map((insight, index) => (
                      <div key={index} className="flex items-start text-xs">
                        <CheckCircle2 className="w-3 h-3 text-indigo-400 mt-0.5 mr-1.5 flex-shrink-0" />
                        <span className="text-gray-300">{insight}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : travelerProfile ? (
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
        
        {/* AI Package Recommendations Section - Only shown when AI is enabled */}
        {useAI && packageRecommendations.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-gradient-to-r from-violet-900/40 via-indigo-900/40 to-blue-900/40 rounded-xl p-6 mb-6 border-2 border-indigo-500 shadow-lg shadow-indigo-900/20"
          >
            <div className="flex items-center mb-4">
              <div className="bg-indigo-600 p-2 rounded-lg mr-3">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">AI Recommendations</h2>
                <p className="text-indigo-200 text-sm">Personalized suggestions for this route</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {packageRecommendations.map((rec, index) => (
                <div key={index} className="bg-indigo-950/50 p-4 rounded-lg border border-indigo-600">
                  <div className="flex items-start">
                    <div className="bg-indigo-900/60 p-2 rounded-lg mr-3">
                      <rec.icon className="w-5 h-5 text-indigo-300" />
                    </div>
                    <div>
                      <h3 className="font-medium text-white">{rec.title}</h3>
                      <p className="text-sm text-indigo-200">{rec.description}</p>
                      {rec.value && (
                        <div className="mt-1 font-bold text-indigo-100">{rec.value}</div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
        
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
                      
                      {/* Enhanced AI fields - only shown when AI is enabled */}
                      {useAI && (
                        <div className="bg-indigo-900/20 border border-indigo-700 rounded-lg p-4 space-y-4">
                          <div className="flex items-center">
                            <Sparkles className="w-5 h-5 text-indigo-400 mr-2" />
                            <h3 className="text-white font-medium">Additional Package Details for AI Analysis</h3>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                              <label className="block text-indigo-200 text-sm mb-1">Package Value (USD)</label>
                              <input
                                type="number"
                                value={packageValue}
                                onChange={(e) => setPackageValue(e.target.value)}
                                min="0"
                                placeholder="Approximate value"
                                className="w-full px-3 py-2 bg-gray-800 border border-indigo-600/50 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white text-sm"
                              />
                            </div>
                            
                            <div>
                              <label className="block text-indigo-200 text-sm mb-1">Delivery Urgency</label>
                              <select
                                value={packageUrgency}
                                onChange={(e) => setPackageUrgency(e.target.value as 'low' | 'medium' | 'high')}
                                className="w-full px-3 py-2 bg-gray-800 border border-indigo-600/50 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white text-sm"
                              >
                                <option value="low">Low - Flexible timing</option>
                                <option value="medium">Medium - Standard delivery</option>
                                <option value="high">High - Urgent delivery</option>
                              </select>
                            </div>
                            
                            <div>
                              <label className="block text-indigo-200 text-sm mb-1">Package Type</label>
                              <select
                                className="w-full px-3 py-2 bg-gray-800 border border-indigo-600/50 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white text-sm"
                              >
                                <option>Documents</option>
                                <option>Electronics</option>
                                <option>Clothing/Textiles</option>
                                <option>Gifts/Personal Items</option>
                                <option>Other</option>
                              </select>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {/* AI Risk Assessment - only shown when AI is enabled and analysis is complete */}
                      {useAI && riskAssessment && !isAnalyzing && (
                        <div className={`border rounded-lg p-4 ${
                          riskAssessment.riskLevel === 'low' 
                            ? 'bg-green-900/20 border-green-700' 
                            : riskAssessment.riskLevel === 'medium' 
                              ? 'bg-yellow-900/20 border-yellow-700' 
                              : 'bg-red-900/20 border-red-700'
                        }`}>
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center">
                              <Activity className={`w-5 h-5 mr-2 ${getRiskColor(riskAssessment.riskLevel)}`} />
                              <h3 className="text-white font-medium">AI Risk Assessment</h3>
                            </div>
                            <div className={`flex items-center ${getRiskColor(riskAssessment.riskLevel)}`}>
                              <div className="w-16 h-4 bg-gray-700 rounded-full overflow-hidden mr-2">
                                <div 
                                  className={`h-full ${
                                    riskAssessment.riskLevel === 'low' 
                                      ? 'bg-green-500' 
                                      : riskAssessment.riskLevel === 'medium' 
                                        ? 'bg-yellow-500' 
                                        : 'bg-red-500'
                                  }`}
                                  style={{ width: `${riskAssessment.riskScore}%` }}
                                ></div>
                              </div>
                              <span className="font-semibold text-sm">
                                {riskAssessment.riskLevel === 'low' ? 'Low Risk' : 
                                 riskAssessment.riskLevel === 'medium' ? 'Medium Risk' : 
                                 'High Risk'}
                              </span>
                            </div>
                          </div>
                          
                          {riskAssessment.riskFactors.length > 0 && (
                            <div className="text-sm space-y-1">
                              {riskAssessment.riskFactors.map((factor, idx) => (
                                <div key={idx} className="flex items-start">
                                  <Info className={`w-4 h-4 mr-1.5 mt-0.5 ${getRiskColor(riskAssessment.riskLevel)}`} />
                                  <span className="text-gray-300">{factor}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                      
                      {/* AI Analysis Loading Indicator */}
                      {useAI && isAnalyzing && (
                        <div className="bg-indigo-900/20 border border-indigo-700 rounded-lg p-4 text-center">
                          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500 mb-2"></div>
                          <p className="text-indigo-300">AI analyzing package details...</p>
                        </div>
                      )}
                      
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
            
            {/* AI Package Insight Section - Only shown when AI is enabled */}
            {useAI && (
              <div className="mt-6 bg-gray-800 rounded-xl shadow-lg overflow-hidden p-6 border border-gray-700">
                <h2 className="text-xl font-bold text-white mb-4 flex items-center">
                  <BarChart className="w-5 h-5 text-indigo-400 mr-2" />
                  AI Route Analysis
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Route Performance */}
                  <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-700">
                    <h3 className="font-medium text-white mb-3 flex items-center">
                      <Activity className="w-4 h-4 text-indigo-400 mr-2" />
                      Route Performance Metrics
                    </h3>
                    
                    <div className="space-y-4">
                      {/* Reliability Score */}
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-300">On-Time Delivery Rate</span>
                          <span className="text-green-400 font-medium">94%</span>
                        </div>
                        <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
                          <div className="h-full bg-green-500" style={{ width: '94%' }}></div>
                        </div>
                      </div>
                      
                      {/* Popularity Score */}
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-300">Route Popularity</span>
                          <span className="text-yellow-400 font-medium">Medium</span>
                        </div>
                        <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
                          <div className="h-full bg-yellow-500" style={{ width: '65%' }}></div>
                        </div>
                      </div>
                      
                      {/* Package Safety Score */}
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-300">Package Safety Rating</span>
                          <span className="text-green-400 font-medium">High</span>
                        </div>
                        <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
                          <div className="h-full bg-green-500" style={{ width: '88%' }}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Price Insights */}
                  <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-700">
                    <h3 className="font-medium text-white mb-3 flex items-center">
                      <DollarSign className="w-4 h-4 text-indigo-400 mr-2" />
                      Price Insights
                    </h3>
                    
                    <div className="space-y-4">
                      {aiPriceRecommendation ? (
                        <>
                          {/* Market comparison */}
                          <div>
                            <div className="flex justify-between text-sm mb-1">
                              <span className="text-gray-300">Market Avg. Price</span>
                              <span className="text-white font-medium">${aiPriceRecommendation.recommendedPricePerKg.toFixed(2)} /kg</span>
                            </div>
                            <div className="flex justify-between text-sm mb-1">
                              <span className="text-gray-300">Route Price</span>
                              <span className={`font-medium ${(route.pricePerKg / 1000000) <= aiPriceRecommendation.recommendedPricePerKg ? 'text-green-400' : 'text-yellow-400'}`}>
                                ${(route.pricePerKg / 1000000).toFixed(2)} /kg
                              </span>
                            </div>
                            <div className="flex justify-between text-sm mb-1">
                              <span className="text-gray-300">Value Rating</span>
                              <span className={`font-medium ${(route.pricePerKg / 1000000) <= aiPriceRecommendation.recommendedPricePerKg ? 'text-green-400' : 'text-yellow-400'}`}>
                                {(route.pricePerKg / 1000000) <= aiPriceRecommendation.recommendedPricePerKg ? 'Good Value' : 'Above Market Rate'}
                              </span>
                            </div>
                          </div>
                          
                          {/* Market insights */}
                          {aiPriceRecommendation.marketInsights.length > 0 && (
                            <div className="mt-3 pt-3 border-t border-gray-700">
                              <p className="text-sm text-gray-300 mb-2">Market Insights:</p>
                              <ul className="space-y-1">
                                {aiPriceRecommendation.marketInsights.map((insight, idx) => (
                                  <li key={idx} className="text-xs text-gray-400 flex items-start">
                                    <Info className="w-3 h-3 text-indigo-400 mr-1 mt-0.5 flex-shrink-0" />
                                    {insight}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="text-gray-400 text-sm italic">
                          No price insights available
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
            
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
            <div className="text-gray-300">AI Enabled: {useAI ? 'Yes' : 'No'}</div>
          </div>
        )}
      </div>
    </BaseNetworkChecker>
  );
};

export default RouteDetailsPage;