import React from 'react';
import { Identity, Name, Avatar } from '@coinbase/onchainkit/identity';
import { Package, DollarSign, Calendar, Tag, Star } from 'lucide-react';

interface DeliveryRequestCardProps {
  request: {
    id: string;
    item: string;
    description: string;
    pickupLocation: string;
    deliveryLocation: string;
    price: number;
    deadline: string;
    requesterAddress: string;
    status: 'pending' | 'accepted' | 'delivered' | 'completed';
    rating?: number;
  };
  onAccept?: () => void;
  onDeliver?: () => void;
  onComplete?: () => void;
}

const DeliveryRequestCard: React.FC<DeliveryRequestCardProps> = ({ request, onAccept, onDeliver, onComplete }) => {
  // Helper to ensure address is properly typed
  const asAddress = (addr: string): `0x${string}` => {
    if (addr.startsWith('0x')) return addr as `0x${string}`;
    return `0x${addr}` as `0x${string}`;
  };
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'accepted':
        return 'bg-blue-100 text-blue-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  const getActionButton = () => {
    switch (request.status) {
      case 'pending':
        return onAccept && (
          <button
            onClick={onAccept}
            className="bg-indigo-600 text-white px-4 py-2 rounded text-sm hover:bg-indigo-700 transition"
          >
            Accept Request
          </button>
        );
      case 'accepted':
        return onDeliver && (
          <button
            onClick={onDeliver}
            className="bg-green-600 text-white px-4 py-2 rounded text-sm hover:bg-green-700 transition"
          >
            Mark as Delivered
          </button>
        );
      case 'delivered':
        return onComplete && (
          <button
            onClick={onComplete}
            className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700 transition"
          >
            Confirm Delivery
          </button>
        );
      default:
        return null;
    }
  };
  
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200 p-6">
      {/* Request Header */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <Package className="h-5 w-5 text-gray-400" />
            <h3 className="font-semibold text-lg text-gray-900">{request.item}</h3>
            <span className={`text-xs px-2 py-1 rounded-full capitalize ${getStatusColor(request.status)}`}>
              {request.status}
            </span>
          </div>
          <p className="text-sm text-gray-600 line-clamp-2">{request.description}</p>
        </div>
        <div className="text-right ml-4">
          <div className="flex items-center text-lg font-semibold text-green-600">
            <DollarSign className="h-5 w-5" />
            {request.price}
          </div>
        </div>
      </div>
      
      {/* Request Details */}
      <div className="grid grid-cols-2 gap-4 my-4 text-sm">
        <div>
          <div className="text-gray-500">Pickup</div>
          <div className="font-medium">{request.pickupLocation}</div>
        </div>
        <div>
          <div className="text-gray-500">Delivery</div>
          <div className="font-medium">{request.deliveryLocation}</div>
        </div>
      </div>
      
      {/* Deadline */}
      <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
        <Calendar className="h-4 w-4" />
        <span>Deadline: {new Date(request.deadline).toLocaleDateString()}</span>
      </div>
      
      {/* Requester Information with Basename */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">Requested by:</span>
          <Identity address={asAddress(request.requesterAddress)} className="flex items-center gap-2">
            <Avatar className="w-8 h-8" />
            <div>
              <Name className="text-sm font-medium text-gray-900" />
              {request.rating && (
                <div className="flex items-center gap-1 text-xs text-yellow-500">
                  <Star className="h-3 w-3 fill-current" />
                  <span>{request.rating}</span>
                </div>
              )}
            </div>
          </Identity>
        </div>
        
        {/* Action Button */}
        {getActionButton()}
      </div>
    </div>
  );
};

export default DeliveryRequestCard;