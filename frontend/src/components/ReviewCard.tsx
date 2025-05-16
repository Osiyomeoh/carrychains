import React from 'react';
import { Identity, Name, Avatar } from '@coinbase/onchainkit/identity';
import { Star, Clock, ThumbsUp } from 'lucide-react';

interface ReviewCardProps {
  review: {
    id: string;
    reviewerAddress: string;
    revieweeAddress: string;
    rating: number;
    comment: string;
    date: string;
    helpfulCount: number;
    deliveryType: 'route' | 'delivery';
    deliveryId: string;
  };
  currentUserAddress?: string;
}

const ReviewCard: React.FC<ReviewCardProps> = ({ review, currentUserAddress }) => {
  // Helper to ensure address is properly typed
  const asAddress = (addr: string): `0x${string}` => {
    if (addr.startsWith('0x')) return addr as `0x${string}`;
    return `0x${addr}` as `0x${string}`;
  };
  
  const reviewDate = new Date(review.date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
  
  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }).map((_, index) => (
      <Star
        key={index}
        className={`h-4 w-4 ${
          index < rating
            ? 'text-yellow-400 fill-current'
            : 'text-gray-300'
        }`}
      />
    ));
  };
  
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      {/* Review Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <Identity address={asAddress(review.reviewerAddress)} className="flex items-center gap-3">
            <Avatar className="w-10 h-10" />
            <div>
              <div className="flex items-center gap-2">
                <Name className="font-medium text-gray-900" />
                <span className="text-sm text-gray-500">reviewed</span>
                <Identity address={asAddress(review.revieweeAddress)}>
                  <Name className="font-medium text-gray-900" />
                </Identity>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <div className="flex items-center gap-1">
                  {renderStars(review.rating)}
                </div>
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <Clock className="h-3 w-3" />
                  {reviewDate}
                </div>
              </div>
            </div>
          </Identity>
        </div>
        
        {/* Review Type Badge */}
        <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full">
          {review.deliveryType === 'route' ? 'Route' : 'Delivery'}
        </span>
      </div>
      
      {/* Review Comment */}
      <p className="text-gray-700 mb-4 whitespace-pre-wrap">{review.comment}</p>
      
      {/* Review Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
        <button className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 transition">
          <ThumbsUp className="h-4 w-4" />
          <span>Helpful ({review.helpfulCount})</span>
        </button>
        
        <div className="text-xs text-gray-400">
          Review ID: {review.id.slice(0, 8)}...
        </div>
      </div>
    </div>
  );
};

export default ReviewCard;