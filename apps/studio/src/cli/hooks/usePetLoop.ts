import { useState, useEffect, useCallback } from 'react';
import { secureRandom } from "../../lib/security-core";
import type { Pet } from '../components/PetRow.js';

const PETS_INIT: Pet[] = [
  { id:'chrono', name:'Chrono', emoji:'⏰', mood:'happy',   level:3, xp:120, maxXp:300, energy:80, skill:'Time Warp' },
  { id:'volt',   name:'Volt',  emoji:'⚡', mood:'ecstatic', level:5, xp:194, maxXp:500, energy:95, skill:'Heap Boost' },
  { id:'shade',  name:'Shade', emoji:'🌑', mood:'neutral',  level:2, xp:45,  maxXp:200, energy:60, skill:'Stealth Fx' },
  { id:'bull',   name:'Bull',  emoji:'🐂', mood:'happy',   level:4, xp:310, maxXp:400, energy:88, skill:'Rate Guard' },
  { id:'drop',   name:'Drop',  emoji:'💧', mood:'sad',     level:1, xp:10,  maxXp:100, energy:30, skill:'DB Cache' },
];

const MOODS: Pet['mood'][] = ['dying','sad','neutral','happy','ecstatic'];

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

export function usePetLoop() {
  const [pets, setPets] = useState<Pet[]>(PETS_INIT);

  // Circular watch ring: xp trickle
  useEffect(() => {
    const RING: Record<string, string> = {
      bull:'volt', volt:'shade', shade:'drop', drop:'chrono', chrono:'bull'
    };
    const t = setInterval(() => {
      setPets(prev => prev.map(p => {
        const neighbor = prev.find(n => n.id === RING[p.id]);
        const xpGain = neighbor && neighbor.mood === 'ecstatic' ? 3 : 1;
        const newXp = p.xp + xpGain;
        const levelUp = newXp >= p.maxXp;
        return {
          ...p,
          xp: levelUp ? 0 : newXp,
          level: levelUp ? p.level + 1 : p.level,
          maxXp: levelUp ? p.maxXp + 100 : p.maxXp,
          energy: clamp(p.energy - 0.5 + secureRandom() * 1.2, 0, 100),
          mood: MOODS[clamp(
            MOODS.indexOf(p.mood) + (levelUp ? 1 : secureRandom() > 0.95 ? -1 : 0),
            0, MOODS.length - 1
          )],
        };
      }));
    }, 1500);
    return () => clearInterval(t);
  }, []);

  const feedPet = useCallback((id: string) => {
    setPets(prev => prev.map(p =>
      p.id === id
        ? { ...p, energy: 100, mood: 'ecstatic', xp: Math.min(p.xp + 20, p.maxXp) }
        : p
    ));
  }, []);

  const triggerMeta = useCallback(() => {
    setPets(prev => prev.map(p => ({
      ...p,
      xp: Math.min(p.xp + 10, p.maxXp),
    })));
  }, []);

  return { pets, feedPet, triggerMeta };
}
