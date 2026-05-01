'use client';

import React from 'react';
import { Star, StarHalf } from 'lucide-react';

interface RatingStarsProps {
  rating: number;
  count?: number;
  size?: number;
}

export const RatingStars: React.FC<RatingStarsProps> = ({ rating, count, size = 14 }) => {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;

  return (
    <div className="flex items-center gap-1">
      <div className="flex items-center gap-0.5">
        {[...Array(5)].map((_, i) => {
          if (i < fullStars) {
            return <Star key={i} size={size} className="fill-amber-400 text-amber-400" />;
          }
          if (i === fullStars && hasHalfStar) {
            return <StarHalf key={i} size={size} className="fill-amber-400 text-amber-400" />;
          }
          return <Star key={i} size={size} className="text-white/20" />;
        })}
      </div>
      {count !== undefined && (
        <span className="text-xs text-white/40 ml-1">({count})</span>
      )}
    </div>
  );
};
