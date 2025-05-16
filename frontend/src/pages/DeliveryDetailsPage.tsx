// DeliveryDetailsPage.tsx

import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useWeb3 } from '../contexts/Web3Context';
import { useAppData } from '../contexts/AppDataContext';
import { DeliveryStatus, Delivery } from '../types';
import { 
  Package, 
  Check, 
  Clock, 
  MapPin, 
  User, 
  Image,
  CalendarDays,
  DollarSign,
  ArrowRight,
  ArrowLeft,
  Loader,
  AlertCircle,
  Camera,
  Upload,
  Truck,
  X,
  ChevronDown
} from 'lucide-react';

const DeliveryDetailsPage: React.FC = () => {
  const { deliveryId } = useParams<{ deliveryId: string }>();
  const { account } = useWeb3();
  const { 
    state, 
    loadMyDeliveries, 
    loadVerification, 
    confirmPickup,
    confirmDelivery,
    completeDelivery,
    isLoading, 
    error 
  } = useAppData();
  const navigate = useNavigate();
  
  const [delivery, setDelivery] = useState<Delivery | null>(null);
  const [verification, setVerification] = useState<any | null>(null);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofPreview, setProofPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionType, setSubmissionType] = useState<'pickup' | 'delivery'>('pickup');
  const [showStatusHistory, setShowStatusHistory] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Get the delivery ID as a number
  const deliveryIdNum = deliveryId ? parseInt(deliveryId) : 0;
  
  // Load delivery and verification data
  useEffect(() => {
    if (!deliveryIdNum || !account) return;
    
    const fetchData = async () => {
      // Make sure deliveries are loaded
      if (state.myDeliveries.asShipper.length === 0 && state.myDeliveries.asTraveler.length === 0) {
        await loadMyDeliveries();
      }
      
      // Find the delivery
      const foundDelivery = [
        ...state.myDeliveries.asShipper,
        ...state.myDeliveries.asTraveler
      ].find(d => d.id === deliveryIdNum);
      
      if (foundDelivery) {
        setDelivery(foundDelivery);
      }
      
      // Load verification data
      const verificationData = await loadVerification(deliveryIdNum);
      if (verificationData) {
        setVerification(verificationData);
      }
    };
    
    fetchData();
  }, [deliveryIdNum, account, state.myDeliveries, loadMyDeliveries, loadVerification]);
  
  // Get the route for this delivery
  const route = state.routes.find(r => delivery?.routeId === r.id);
  
  // Check if user is the traveler
  const isCarrier = delivery?.traveler.toLowerCase() === account?.toLowerCase();
  
  // Check if user is the shipper
  const isShipper = delivery?.shipper.toLowerCase() === account?.toLowerCase();
  
  // Handle file selection
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    try {
      setIsSubmitting(true);
      
      // Set the original file
      setProofFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setProofPreview(reader.result as string);
        setIsSubmitting(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error("Error processing file:", error);
      setIsSubmitting(false);
    }
  };
  
  // Handle proof submission for pickup
  const handleSubmitPickupProof = async () => {
    if (!delivery || !proofFile) return;
    
    setIsSubmitting(true);
    
    try {
      const success = await confirmPickup(delivery.id, proofFile);
      
      if (success) {
        setProofFile(null);
        setProofPreview(null);
        
        // Reload verification data
        const verificationData = await loadVerification(delivery.id);
        if (verificationData) {
          setVerification(verificationData);
        }
      }
    } catch (error) {
      console.error("Error submitting pickup proof:", error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Handle proof submission for delivery
  const handleSubmitDeliveryProof = async () => {
    if (!delivery || !proofFile) return;
    
    setIsSubmitting(true);
    
    try {
      const success = await confirmDelivery(delivery.id, proofFile);
      
      if (success) {
        setProofFile(null);
        setProofPreview(null);
        
        // Reload verification data
        const verificationData = await loadVerification(delivery.id);
        if (verificationData) {
          setVerification(verificationData);
        }
      }
    } catch (error) {
      console.error("Error submitting delivery proof:", error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Handle delivery completion and escrow release
  const handleCompleteDelivery = async () => {
    if (!delivery) return;
    
    try {
      await completeDelivery(delivery.id);
    } catch (error) {
      console.error("Error completing delivery:", error);
    }
  };
  
  // Helper to get status badge class
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
      case DeliveryStatus.Cancelled:
        return 'bg-red-500/20 text-red-300 border-red-500';
      case DeliveryStatus.Disputed:
        return 'bg-orange-500/20 text-orange-300 border-orange-500';
      default:
        return 'bg-gray-500/20 text-gray-300 border-gray-500';
    }
  };
  
  // Helper to format date from timestamp
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
  
  // Helper to format address
  const formatAddress = (address: string) => {
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };
  
  // Statuses for status timeline
  const statuses = [
    { status: DeliveryStatus.Created, label: 'Created', icon: Package },
    { status: DeliveryStatus.Accepted, label: 'Accepted', icon: Check },
    { status: DeliveryStatus.PickedUp, label: 'Picked Up', icon: Package },
    { status: DeliveryStatus.Delivered, label: 'Delivered', icon: Truck },
    { status: DeliveryStatus.Completed, label: 'Completed', icon: Check }
  ];

  if (!account) {
    navigate('/my-deliveries');
    return null;
  }

  if (isLoading && !delivery) {
    return (
      <div className="max-w-4xl mx-auto py-8">
        <div className="flex flex-col items-center justify-center py-12">
          <Loader className="w-10 h-10 text-indigo-500 animate-spin mb-4" />
          <p className="text-gray-400">Loading delivery details...</p>
        </div>
      </div>
    );
  }

  if (!delivery) {
    return (
      <div className="max-w-4xl mx-auto py-8">
        <div className="bg-gray-800 rounded-xl p-8 text-center border border-gray-700">
          <Package className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold mb-4">Delivery Not Found</h2>
          <p className="text-gray-400 mb-6">
            The delivery you're looking for doesn't exist or you don't have permission to view it.
          </p>
          <Link
            to="/my-deliveries"
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg inline-block"
          >
            Back to My Deliveries
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8">
      <div className="flex items-center mb-6">
        <Link
          to="/my-deliveries"
          className="flex items-center text-gray-400 hover:text-indigo-400 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 mr-1" />
          <span>Back to My Deliveries</span>
        </Link>
      </div>
      
      <div className="bg-gray-800 rounded-xl overflow-hidden border border-gray-700 mb-6">
        {/* Header */}
        <div className="p-6 border-b border-gray-700">
          <div className="flex flex-wrap justify-between items-center">
            <div className="flex items-center mb-4 md:mb-0">
              <Package className="w-6 h-6 text-indigo-400 mr-2" />
              <h1 className="text-2xl font-bold">
                Delivery #{delivery.id}
              </h1>
            </div>
            
            <div className={`px-4 py-2 text-sm font-medium rounded-full border ${getStatusBadgeClass(delivery.status)}`}>
              {delivery.status === DeliveryStatus.Created ? 'Pending Acceptance' :
               delivery.status === DeliveryStatus.Accepted ? 'Accepted' :
               delivery.status === DeliveryStatus.PickedUp ? 'Picked Up' :
               delivery.status === DeliveryStatus.Delivered ? 'Delivered' :
               delivery.status === DeliveryStatus.Completed ? 'Completed' :
               delivery.status === DeliveryStatus.Cancelled ? 'Cancelled' :
               delivery.status === DeliveryStatus.Disputed ? 'Disputed' : 'Unknown'}
            </div>
          </div>
        </div>
        
        {/* Status Timeline */}
        <div className="p-6 border-b border-gray-700">
          <button 
            onClick={() => setShowStatusHistory(!showStatusHistory)}
            className="flex items-center text-indigo-400 mb-4 hover:text-indigo-300 transition-colors"
          >
            <span>{showStatusHistory ? 'Hide Status History' : 'Show Status History'}</span>
            <ChevronDown className={`w-4 h-4 ml-1 transition-transform ${showStatusHistory ? 'rotate-180' : ''}`} />
          </button>
          
          {showStatusHistory && (
            <div className="relative mt-4">
              <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-700"></div>
              <div className="space-y-6">
                {statuses.map((statusItem, index) => {
                  const isActive = delivery.status >= statusItem.status;
                  const isCurrent = delivery.status === statusItem.status;
                  const StatusIcon = statusItem.icon;
                  
                  return (
                    <div key={index} className="flex items-start">
                      <div className={`relative z-10 rounded-full w-8 h-8 flex items-center justify-center mr-4 ${
                        isActive 
                          ? isCurrent 
                            ? 'bg-indigo-500 text-white' 
                            : 'bg-green-500 text-white' 
                          : 'bg-gray-700 text-gray-400'
                      }`}>
                        <StatusIcon className="w-4 h-4" />
                      </div>
                      <div className="flex-1">
                        <h3 className={`font-medium ${
                          isActive 
                            ? isCurrent 
                              ? 'text-indigo-400' 
                              : 'text-white' 
                            : 'text-gray-400'
                        }`}>
                          {statusItem.label}
                        </h3>
                        <p className="text-sm text-gray-400">
                          {isActive 
                            ? isCurrent 
                              ? 'Current status'
                              : 'Completed'
                            : 'Pending'
                          }
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
        
        {/* Route Details */}
        {route && (
          <div className="p-6 border-b border-gray-700">
            <h2 className="text-lg font-medium mb-4">Route Details</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-6">
                <div className="flex">
                  <div className="mr-3 flex flex-col items-center">
                    <div className="w-8 h-8 rounded-full bg-indigo-500/20 border border-indigo-500 flex items-center justify-center">
                      <MapPin className="w-4 h-4 text-indigo-400" />
                    </div>
                    <div className="w-0.5 h-12 bg-gray-700"></div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-400">From</div>
                    <div className="font-medium text-white">{route.departureLocation}</div>
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
                    <div className="font-medium text-white">{route.destinationLocation}</div>
                    <div className="text-sm text-gray-400 mt-1">
                      {formatDate(route.arrivalTime)}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center">
                  <User className="w-5 h-5 text-indigo-400 mr-2" />
                  <div>
                    <div className="text-sm text-gray-400">
                      {isShipper ? 'Carrier' : 'Shipper'}
                    </div>
                    <Link
                      to={`/profile/${isShipper ? delivery.traveler : delivery.shipper}`}
                      className="font-medium text-indigo-400 hover:text-indigo-300 transition-colors"
                    >
                      {formatAddress(isShipper ? delivery.traveler : delivery.shipper)}
                    </Link>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <Package className="w-5 h-5 text-indigo-400 mr-2" />
                  <div>
                    <div className="text-sm text-gray-400">Package Weight</div>
                    <div className="font-medium text-white">{(delivery.packageWeight / 1000).toFixed(1)} kg</div>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <DollarSign className="w-5 h-5 text-indigo-400 mr-2" />
                  <div>
                    <div className="text-sm text-gray-400">Total Price</div>
                    <div className="font-medium text-white">{(Number(delivery.totalPrice) / 1000000).toFixed(2)} USDC</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Package Description */}
        <div className="p-6 border-b border-gray-700">
          <h2 className="text-lg font-medium mb-3">Package Description</h2>
          <p className="text-gray-300">{delivery.packageDescription || 'No description provided'}</p>
        </div>
        
        {/* Escrow Status */}
        <div className="p-6 border-b border-gray-700">
          <h2 className="text-lg font-medium mb-3">Payment Status</h2>
          
          <div className="rounded-lg bg-gray-700/50 p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="text-white">Total Payment</div>
              <div className="font-bold text-white">{(Number(delivery.totalPrice) / 1000000).toFixed(2)} USDC</div>
            </div>
            
            <div className="h-2 bg-gray-600 rounded-full overflow-hidden">
              <div 
                className={`h-full ${
                  delivery.status === DeliveryStatus.Completed 
                    ? 'bg-green-500' 
                    : 'bg-indigo-500'
                }`}
                style={{ 
                  width: delivery.status === DeliveryStatus.Completed 
                    ? '100%' 
                    : delivery.status === DeliveryStatus.Delivered 
                      ? '75%' 
                      : delivery.status === DeliveryStatus.PickedUp 
                        ? '50%' 
                        : delivery.status === DeliveryStatus.Accepted 
                          ? '25%' 
                          : '5%' 
                }}
              ></div>
            </div>
            
            <div className="mt-2 text-sm text-gray-400">
              {delivery.status === DeliveryStatus.Completed 
                ? 'Payment has been released to the carrier.' 
                : delivery.status === DeliveryStatus.Delivered 
                  ? 'Package delivered. Waiting for confirmation to release payment.' 
                  : 'Payment is held in escrow until delivery is completed.'}
            </div>
          </div>
        </div>
        
        {/* Verification Section */}
        <div className="p-6">
          <h2 className="text-lg font-medium mb-4">Verification</h2>
          
          {/* Pickup Verification */}
          <div className="mb-6 border border-gray-700 rounded-lg p-4">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-md font-medium flex items-center">
                <Package className="w-4 h-4 mr-2 text-indigo-400" />
                Pickup Verification
              </h3>
              
              {verification?.pickupProofCID ? (
                <div className="px-3 py-1 text-xs font-medium rounded-full bg-green-500/20 text-green-300 border border-green-500">
                  Verified
                </div>
              ) : (
                <div className="px-3 py-1 text-xs font-medium rounded-full bg-gray-500/20 text-gray-300 border border-gray-500">
                  Not Verified
                </div>
              )}
            </div>
            
            {verification?.pickupProofCID ? (
              <div>
                <div className="text-sm text-gray-400 mb-2">
                  Verified on {formatDate(verification.pickupTimestamp)}
                </div>
                {verification.pickupProofURL && (
                  <a 
                    href={verification.pickupProofURL} 
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block rounded-lg overflow-hidden mb-2 w-full max-w-xs mx-auto"
                  >
                    <img 
                      src={verification.pickupProofURL} 
                      alt="Pickup Proof" 
                      className="w-full h-auto"
                    />
                  </a>
                )}
              </div>
            ) : isCarrier && delivery.status === DeliveryStatus.Accepted ? (
              <div>
                <p className="text-gray-400 mb-3">
                  <span className="font-medium text-white block mb-1">Pickup Verification Photo</span>
                  Take a clear photo of the package when picking it up from the sender. Make sure:
                </p>
                <ul className="list-disc pl-5 text-gray-400 mb-4 text-sm">
                  <li>The package is clearly visible</li>
                  <li>Any shipping labels or markings are shown if possible</li>
                  <li>The photo is well-lit and in focus</li>
                </ul>
                
                <div className="mb-4">
                  {proofPreview && submissionType === 'pickup' ? (
                    <div className="relative mb-3 w-full max-w-xs mx-auto">
                      <img 
                        src={proofPreview} 
                        alt="Proof Preview" 
                        className="w-full h-auto rounded-lg border border-gray-600"
                      />
                      <button
                        onClick={() => {
                          setProofFile(null);
                          setProofPreview(null);
                        }}
                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-4 w-full max-w-xs mx-auto">
                      <div 
                        onClick={() => {
                          setSubmissionType('pickup');
                          fileInputRef.current?.click();
                        }}
                        className="flex flex-col items-center justify-center h-32 border-2 border-dashed border-gray-600 rounded-lg cursor-pointer hover:border-indigo-500 transition-colors"
                      >
                        <Camera className="w-6 h-6 text-indigo-400 mb-2" />
                        <p className="text-gray-400 text-sm text-center">Take Photo</p>
                      </div>
                      
                      <div 
                        onClick={() => {
                          setSubmissionType('pickup');
                          fileInputRef.current?.click();
                        }}
                        className="flex flex-col items-center justify-center h-32 border-2 border-dashed border-gray-600 rounded-lg cursor-pointer hover:border-indigo-500 transition-colors"
                      >
                        <Image className="w-6 h-6 text-indigo-400 mb-2" />
                        <p className="text-gray-400 text-sm text-center">Choose Photo</p>
                      </div>
                    </div>
                  )}</div>
                
                {proofFile && submissionType === 'pickup' && (
                  <button
                    onClick={handleSubmitPickupProof}
                    disabled={isSubmitting}
                    className="w-full max-w-xs mx-auto flex items-center justify-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader className="w-4 h-4 mr-2 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4 mr-2" />
                        Verify Pickup
                      </>
                    )}
                  </button>
                )}
              </div>
            ) : (
              <p className="text-gray-400">
                {isCarrier ? (
                  delivery.status < DeliveryStatus.Accepted ? 
                    "You need to accept the delivery first." :
                    "This delivery has already been picked up."
                ) : (
                  "Waiting for the carrier to verify pickup with a photo of the package."
                )}
              </p>
            )}
          </div>
          
          {/* Delivery Verification */}
          <div className="mb-6 border border-gray-700 rounded-lg p-4">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-md font-medium flex items-center">
                <MapPin className="w-4 h-4 mr-2 text-green-400" />
                Delivery Verification
              </h3>
              
              {verification?.deliveryProofCID ? (
                <div className="px-3 py-1 text-xs font-medium rounded-full bg-green-500/20 text-green-300 border border-green-500">
                  Verified
                </div>
              ) : (
                <div className="px-3 py-1 text-xs font-medium rounded-full bg-gray-500/20 text-gray-300 border border-gray-500">
                  Not Verified
                </div>
              )}
            </div>
            
            {verification?.deliveryProofCID ? (
              <div>
                <div className="text-sm text-gray-400 mb-2">
                  Verified on {formatDate(verification.deliveryTimestamp)}
                </div>
                {verification.deliveryProofURL && (
                  <a 
                    href={verification.deliveryProofURL} 
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block rounded-lg overflow-hidden mb-2 w-full max-w-xs mx-auto"
                  >
                    <img 
                      src={verification.deliveryProofURL} 
                      alt="Delivery Proof" 
                      className="w-full h-auto"
                    />
                  </a>
                )}
              </div>
            ) : isCarrier && delivery.status === DeliveryStatus.PickedUp ? (
              <div>
                <p className="text-gray-400 mb-3">
                  <span className="font-medium text-white block mb-1">Delivery Verification Photo</span>
                  Take a clear photo of the package at the delivery location. Make sure:
                </p>
                <ul className="list-disc pl-5 text-gray-400 mb-4 text-sm">
                  <li>The package is shown at the delivery location</li>
                  <li>The photo shows evidence of successful delivery (if possible)</li>
                  <li>The photo is well-lit and in focus</li>
                </ul>
                
                <div className="mb-4">
                  {proofPreview && submissionType === 'delivery' ? (
                    <div className="relative mb-3 w-full max-w-xs mx-auto">
                      <img 
                        src={proofPreview} 
                        alt="Proof Preview" 
                        className="w-full h-auto rounded-lg border border-gray-600"
                      />
                      <button
                        onClick={() => {
                          setProofFile(null);
                          setProofPreview(null);
                        }}
                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-4 w-full max-w-xs mx-auto">
                      <div 
                        onClick={() => {
                          setSubmissionType('delivery');
                          fileInputRef.current?.click();
                        }}
                        className="flex flex-col items-center justify-center h-32 border-2 border-dashed border-gray-600 rounded-lg cursor-pointer hover:border-indigo-500 transition-colors"
                      >
                        <Camera className="w-6 h-6 text-indigo-400 mb-2" />
                        <p className="text-gray-400 text-sm text-center">Take Photo</p>
                      </div>
                      
                      <div 
                        onClick={() => {
                          setSubmissionType('delivery');
                          fileInputRef.current?.click();
                        }}
                        className="flex flex-col items-center justify-center h-32 border-2 border-dashed border-gray-600 rounded-lg cursor-pointer hover:border-indigo-500 transition-colors"
                      >
                        <Image className="w-6 h-6 text-indigo-400 mb-2" />
                        <p className="text-gray-400 text-sm text-center">Choose Photo</p>
                      </div>
                    </div>
                  )}
                </div>
                
                {proofFile && submissionType === 'delivery' && (
                  <button
                    onClick={handleSubmitDeliveryProof}
                    disabled={isSubmitting}
                    className="w-full max-w-xs mx-auto flex items-center justify-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader className="w-4 h-4 mr-2 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4 mr-2" />
                        Verify Delivery
                      </>
                    )}
                  </button>
                )}
              </div>
            ) : (
              <p className="text-gray-400">
                {isCarrier ? (
                  delivery.status < DeliveryStatus.PickedUp ? 
                    "You need to verify pickup first." :
                    "This delivery has already been delivered."
                ) : (
                  "Waiting for the carrier to verify delivery with a photo of the package at the destination."
                )}
              </p>
            )}
          </div>
          
          {/* Receipt Confirmation (only for shippers) */}
          {isShipper && (
            <div className="border border-gray-700 rounded-lg p-4">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-md font-medium flex items-center">
                  <Check className="w-4 h-4 mr-2 text-indigo-400" />
                  Receipt & Payment Release
                </h3>
                
                {delivery.status === DeliveryStatus.Completed ? (
                  <div className="px-3 py-1 text-xs font-medium rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500">
                    Confirmed
                  </div>
                ) : (
                  <div className="px-3 py-1 text-xs font-medium rounded-full bg-gray-500/20 text-gray-300 border border-gray-500">
                    Not Confirmed
                  </div>
                )}
              </div>
              
              {delivery.status === DeliveryStatus.Completed ? (
                <div>
                  <p className="text-gray-400 mb-2">
                    You've confirmed receipt of this delivery. The payment has been released to the carrier.
                  </p>
                  
                  <div className="bg-gray-700/50 rounded-lg p-3 text-sm text-green-300 flex items-start">
                    <Check className="w-4 h-4 mr-2 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium">Payment Successfully Released</p>
                      <p className="text-gray-400 mt-1">
                        {(Number(delivery.totalPrice) / 1000000).toFixed(2)} USDC has been transferred to the carrier.
                      </p>
                    </div>
                  </div>
                </div>
              ) : delivery.status === DeliveryStatus.Delivered ? (
                <div>
                  <p className="text-gray-400 mb-4">
                    The carrier has marked this delivery as delivered and provided verification. 
                    Please confirm that you've received the package to release payment.
                  </p>
                  
                  <div className="bg-gray-700/50 rounded-lg p-3 mb-4 text-sm text-yellow-300 flex items-start">
                    <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium">Payment Ready to Release</p>
                      <p className="text-gray-400 mt-1">
                        When you confirm receipt, {(Number(delivery.totalPrice) / 1000000).toFixed(2)} USDC will be transferred to the carrier.
                      </p>
                    </div>
                  </div>
                  
                  <button
                    onClick={handleCompleteDelivery}
                    disabled={isLoading}
                    className="w-full md:w-auto flex items-center justify-center px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors"
                  >
                    {isLoading ? (
                      <>
                        <Loader className="w-4 h-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4 mr-2" />
                        Confirm Receipt & Release Payment
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <p className="text-gray-400">
                  {delivery.status >= DeliveryStatus.PickedUp ? 
                    "You can confirm receipt once the carrier has marked the delivery as delivered." :
                    "The delivery process has not yet reached the delivery stage."
                  }
                </p>
              )}
            </div>
          )}
          
          {/* Carrier payment status (only for carriers) */}
          {isCarrier && (
            <div className="border border-gray-700 rounded-lg p-4">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-md font-medium flex items-center">
                  <DollarSign className="w-4 h-4 mr-2 text-indigo-400" />
                  Payment Status
                </h3>
                
                {delivery.status === DeliveryStatus.Completed ? (
                  <div className="px-3 py-1 text-xs font-medium rounded-full bg-green-500/20 text-green-300 border border-green-500">
                    Paid
                  </div>
                ) : (
                  <div className="px-3 py-1 text-xs font-medium rounded-full bg-yellow-500/20 text-yellow-300 border border-yellow-500">
                    Pending
                  </div>
                )}
              </div>
              
              {delivery.status === DeliveryStatus.Completed ? (
                <div>
                  <p className="text-gray-400 mb-2">
                    The shipper has confirmed receipt and your payment has been released.
                  </p>
                  
                  <div className="bg-gray-700/50 rounded-lg p-3 text-sm text-green-300 flex items-start">
                    <Check className="w-4 h-4 mr-2 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium">Payment Received</p>
                      <p className="text-gray-400 mt-1">
                        {(Number(delivery.totalPrice) / 1000000).toFixed(2)} USDC has been transferred to your wallet.
                      </p>
                    </div>
                  </div>
                </div>
              ) : delivery.status === DeliveryStatus.Delivered ? (
                <div>
                  <p className="text-gray-400 mb-4">
                    You've marked this delivery as delivered. Waiting for the shipper to confirm receipt and release payment.
                  </p>
                  
                  <div className="bg-gray-700/50 rounded-lg p-3 text-sm text-yellow-300 flex items-start">
                    <Clock className="w-4 h-4 mr-2 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium">Payment Pending</p>
                      <p className="text-gray-400 mt-1">
                        {(Number(delivery.totalPrice) / 1000000).toFixed(2)} USDC will be transferred to your wallet once the shipper confirms receipt.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-gray-400">
                  Complete the delivery process to receive payment. You'll be paid once the shipper confirms receipt.
                </p>
              )}
            </div>
          )}
          
          {/* Dispute section if applicable */}
          {delivery.disputed && (
            <div className="mt-6 border border-orange-500 rounded-lg p-4 bg-orange-900/20">
              <div className="flex items-center mb-3">
                <AlertCircle className="w-5 h-5 text-orange-400 mr-2" />
                <h3 className="text-lg font-medium text-orange-300">Delivery Disputed</h3>
              </div>
              
              <p className="text-gray-300 mb-4">
                This delivery has been disputed and is currently under review. Please contact support for more information.
              </p>
              
              <button
                className="text-orange-300 border border-orange-500 rounded-lg px-4 py-2 hover:bg-orange-900/30 transition-colors"
              >
                Contact Support
              </button>
            </div>
          )}
        </div>
      </div>
      
      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />
      
      {/* Loading overlay */}
      {isSubmitting && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-gray-800 p-6 rounded-lg shadow-lg max-w-sm w-full">
            <div className="flex flex-col items-center">
              <Loader className="w-12 h-12 text-indigo-500 animate-spin mb-4" />
              <h3 className="text-xl font-semibold mb-2">Processing Verification</h3>
              <p className="text-gray-400 text-center mb-2">
                Uploading proof to IPFS and recording on blockchain...
              </p>
              <div className="w-full bg-gray-700 rounded-full h-2 mb-4">
                <div className="bg-indigo-500 h-2 rounded-full animate-pulse"></div>
              </div>
              <p className="text-sm text-gray-500">
                This may take a minute. Please don't close this page.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeliveryDetailsPage;