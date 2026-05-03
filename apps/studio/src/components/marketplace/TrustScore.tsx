'use client';

import React from 'react';
import { Shield, ShieldCheck, ShieldAlert, ShieldX } from 'lucide-react';

interface TrustScoreProps {
  score: number; // 0-100
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

export function TrustScore({
  score,
  size = 'md',
  showLabel = true,
  className = ''
}: TrustScoreProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  const iconSize = sizeClasses[size];

  // Determine trust level and styling
  const getTrustLevel = () => {
    if (score >= 90) {
      return {
        label: 'Excellent',
        icon: ShieldCheck,
        color: 'text-green-500',
        bgColor: 'bg-green-500/10',
        borderColor: 'border-green-500/20'
      };
    } else if (score >= 70) {
      return {
        label: 'Good',
        icon: Shield,
        color: 'text-blue-500',
        bgColor: 'bg-blue-500/10',
        borderColor: 'border-blue-500/20'
      };
    } else if (score >= 50) {
      return {
        label: 'Fair',
        icon: ShieldAlert,
        color: 'text-yellow-500',
        bgColor: 'bg-yellow-500/10',
        borderColor: 'border-yellow-500/20'
      };
    } else {
      return {
        label: 'Low',
        icon: ShieldX,
        color: 'text-red-500',
        bgColor: 'bg-red-500/10',
        borderColor: 'border-red-500/20'
      };
    }
  };

  const trustLevel = getTrustLevel();
  const Icon = trustLevel.icon;

  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      <div
        className={`
          flex items-center gap-1.5 px-2 py-1 rounded-lg border
          ${trustLevel.bgColor} ${trustLevel.borderColor}
        `}
      >
        <Icon className={`${iconSize} ${trustLevel.color}`} />
        <span className={`text-sm font-medium ${trustLevel.color}`}>
          {score}
        </span>
      </div>
      
      {showLabel && (
        <span className="text-xs text-gray-500">
          {trustLevel.label} Trust
        </span>
      )}
    </div>
  );
}

// Made with Moe Abdelaziz
