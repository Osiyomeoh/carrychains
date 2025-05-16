import React from 'react';
import { Link } from 'react-router-dom';
import { Identity, Name, Avatar } from '@coinbase/onchainkit/identity';
import { MapPin, Calendar, Package as PackageIcon, ArrowRight, User } from 'lucide-react';

interface RouteCardProps {
  route: {
    id: string;
    from: string;
    to: string;
    departureDate: string;
    availableCapacity: number;
    totalCapacity: number;
    creatorAddress: string;
    price: number;
    description: string;
  };
}

const RouteCard: React.FC<RouteCardProps> = ({ route }) => {
  // Helper to ensure address is properly typed
  const asAddress = (addr: string): `0x${string}` => {
    if (addr.startsWith('0x')) return addr as `0x${string}`;
    return `0x${addr}` as `0x${string}`;
  };
  
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };
  
  return (
    <Link to={`/route/${route.id}`}>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200 p-6">
        {/* Route Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <MapPin className="h-5 w-5 text-gray-400" />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-medium text-gray-900">{route.from}</span>
                <ArrowRight className="h-4 w-4 text-gray-400" />
                <span className="font-medium text-gray-900">{route.to}</span>
              </div>
              <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>{formatDate(route.departureDate)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <PackageIcon className="h-4 w-4" />
                  <span>{route.availableCapacity}/{route.totalCapacity} slots</span>
                </div>
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-lg font-semibold text-gray-900">
              ${route.price}
            </div>
            <div className="text-xs text-gray-500">per item</div>
          </div>
        </div>
        
        {/* Route Description */}
        <p className="text-sm text-gray-600 mb-4 line-clamp-2">
          {route.description}
        </p>
        
        {/* Route Creator with Basename */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Carried by:</span>
            <Identity address={asAddress(route.creatorAddress)} className="flex items-center gap-2">
              <Avatar className="w-6 h-6" />
              <Name className="text-sm font-medium text-gray-900" />
            </Identity>
          </div>
          
          {/* Status indicator */}
          <div className="flex items-center gap-2">
            {route.availableCapacity > 0 ? (
              <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded-full">
                Available
              </span>
            ) : (
              <span className="text-xs px-2 py-1 bg-red-100 text-red-800 rounded-full">
                Full
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
};

export default RouteCard;