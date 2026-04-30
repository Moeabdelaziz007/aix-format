import React from 'react';
import { motion } from 'framer-motion';

interface TrustScoreProps {
  score: number;
  size?: number;
}

export const TrustScore: React.FC<TrustScoreProps> = ({ score, size = 40 }) => {
  const radius = (size - 4) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  const getColor = (s: number) => {
    if (s >= 90) return '#10b981'; // Success
    if (s >= 70) return '#3b82f6'; // Primary
    if (s >= 50) return '#f59e0b'; // Warning
    return '#ef4444'; // Danger
  };

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth="2"
          fill="transparent"
          className="text-white/5"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={getColor(score)}
          strokeWidth="2"
          fill="transparent"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: 'easeOut' }}
          strokeLinecap="round"
        />
      </svg>
      <span className="absolute text-[10px] font-bold text-white/90">{score}</span>
    </div>
  );
};
