import React from 'react';
import { 
  CircleUser, 
  Zap, 
  Search, 
  Layers, 
  Lightbulb, 
  Workflow, 
  Trophy, 
  HeartHandshake, 
  ShieldAlert, 
  PenTool, 
  Database, 
  Eye 
} from 'lucide-react';
import { PetConfig } from '@/lib/types';

interface AgentPetProps {
  pet?: PetConfig;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const PET_MAP = {
  fox: { icon: Search, label: 'Research', color: '#FF6B35' },
  octopus: { icon: Layers, label: 'Multi-task', color: '#6366F1' },
  owl: { icon: Lightbulb, label: 'Advisor', color: '#FCD34D' },
  bee: { icon: Workflow, label: 'Automation', color: '#F59E0B' },
  lion: { icon: Trophy, label: 'Sales', color: '#EF4444' },
  dolphin: { icon: HeartHandshake, label: 'Support', color: '#10B981' },
  wolf: { icon: ShieldAlert, label: 'Security', color: '#71717A' },
  butterfly: { icon: PenTool, label: 'Content', color: '#EC4899' },
  elephant: { icon: Database, label: 'Memory', color: '#3B82F6' },
  eagle: { icon: Eye, label: 'Monitor', color: '#8B5CF6' },
};

const SIZE_MAP = {
  sm: 'w-5 h-5',
  md: 'w-8 h-8',
  lg: 'w-16 h-16',
  xl: 'w-24 h-24'
};

export const AgentPet: React.FC<AgentPetProps> = ({ pet, className = '', size = 'md' }) => {
  if (!pet) {
    return <CircleUser className={`${SIZE_MAP[size]} text-zinc-600 ${className}`} />;
  }

  const petInfo = PET_MAP[pet.type] || PET_MAP.fox;
  const Icon = petInfo.icon;

  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      {/* Visual representation of the Pet */}
      <div 
        className={`rounded-full flex items-center justify-center bg-zinc-900 border-2 transition-all duration-500 shadow-[0_0_20px_rgba(0,0,0,0.5)]`}
        style={{ 
          borderColor: pet.color || petInfo.color,
          backgroundColor: `${pet.color || petInfo.color}15`,
          width: size === 'xl' ? '120px' : size === 'lg' ? '80px' : size === 'md' ? '48px' : '32px',
          height: size === 'xl' ? '120px' : size === 'lg' ? '80px' : size === 'md' ? '48px' : '32px'
        }}
      >
        <Icon 
          className={`${SIZE_MAP[size]} transition-all duration-500`} 
          style={{ color: pet.color || petInfo.color }}
        />
        
        {/* Mood Indicator */}
        <div 
          className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-zinc-950 shadow-xl"
          style={{ 
            backgroundColor: pet.mood === 'busy' ? '#F59E0B' : pet.mood === 'alert' ? '#EF4444' : '#10B981' 
          }}
          title={`Mood: ${pet.mood}`}
        />
      </div>

      {/* Level Badge for LG/XL */}
      {(size === 'lg' || size === 'xl') && (
        <div className="absolute -top-2 -right-2 px-3 py-1 bg-zinc-950 border border-white/10 rounded-full">
          <span className="text-[10px] font-black text-white uppercase tracking-widest">LVL {pet.level}</span>
        </div>
      )}
    </div>
  );
};
