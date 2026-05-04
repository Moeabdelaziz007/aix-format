import React, { useState, useEffect } from 'react';
import { Box, Text } from 'ink';

interface PetRowProps {
  name: string;
  status: 'active' | 'idle' | 'learning';
  xp: number;
  maxXp: number;
  energy: number;
  skills: number;
}

const WAVE_CHARS = ['▁', '▂', '▃', '▄', '▅', '▆', '▇', '█'];
const SPARKLE_CHARS = ['✦', '✧', '⋆', '✨', '⭐'];
const STATUS_ICONS = {
  active: '◉',
  idle: '○',
  learning: '◐'
};

export const PetRow: React.FC<PetRowProps> = ({
  name,
  status,
  xp,
  maxXp,
  energy,
  skills
}) => {
  const [waveOffset, setWaveOffset] = useState(0);
  const [breathIntensity, setBreathIntensity] = useState(0);
  const [sparkleIndex, setSparkleIndex] = useState(0);
  const [energyPulse, setEnergyPulse] = useState(0);

  // Wave XP bar animation (100ms)
  useEffect(() => {
    const interval = setInterval(() => {
      setWaveOffset((prev) => (prev + 1) % WAVE_CHARS.length);
    }, 100);
    return () => clearInterval(interval);
  }, []);

  // Breathing effect on name (50ms)
  useEffect(() => {
    const interval = setInterval(() => {
      setBreathIntensity((prev) => {
        const next = prev + 0.05;
        return next > 1 ? 0 : next;
      });
    }, 50);
    return () => clearInterval(interval);
  }, []);

  // Sparkle indicators (200ms)
  useEffect(() => {
    const interval = setInterval(() => {
      setSparkleIndex((prev) => (prev + 1) % SPARKLE_CHARS.length);
    }, 200);
    return () => clearInterval(interval);
  }, []);

  // Energy pulse (150ms)
  useEffect(() => {
    const interval = setInterval(() => {
      setEnergyPulse((prev) => (prev + 1) % 4);
    }, 150);
    return () => clearInterval(interval);
  }, []);

  // Calculate XP percentage
  const xpPercent = Math.min(100, Math.round((xp / maxXp) * 100));
  const barLength = 20;
  const filledLength = Math.round((xpPercent / 100) * barLength);

  // Create animated wave XP bar
  const xpBar = Array.from({ length: barLength }, (_, i) => {
    if (i < filledLength) {
      const waveIndex = (waveOffset + i) % WAVE_CHARS.length;
      return WAVE_CHARS[waveIndex];
    }
    return '░';
  }).join('');

  // Status color
  const statusColor = status === 'active' ? '#4ECDC4' : 
                      status === 'learning' ? '#F7DC6F' : 
                      '#666666';

  // Breathing effect color intensity
  const nameColor = breathIntensity > 0.5 ? '#FFFFFF' : '#CCCCCC';

  // Energy pulse indicator
  const energyIndicator = '█'.repeat(Math.min(4, Math.ceil(energy / 25)));
  const energyColor = energy > 75 ? '#4ECDC4' : 
                      energy > 50 ? '#F7DC6F' : 
                      energy > 25 ? '#FFA07A' : '#FF6B6B';

  // Sparkle for high XP
  const sparkle = xpPercent > 80 ? SPARKLE_CHARS[sparkleIndex] : '';

  return (
    <Box flexDirection="column" marginY={0}>
      {/* Pet name and status */}
      <Box>
        <Text color={statusColor} bold>
          {STATUS_ICONS[status]} 
        </Text>
        <Text color={nameColor} bold> {name}</Text>
        {sparkle && <Text color="#F7DC6F"> {sparkle}</Text>}
        <Text dimColor> ({skills} skills)</Text>
      </Box>

      {/* XP Bar */}
      <Box marginLeft={2}>
        <Text dimColor>XP: </Text>
        <Text color="#45B7D1">{xpBar}</Text>
        <Text color="#FFFFFF"> {xpPercent}%</Text>
      </Box>

      {/* Energy indicator */}
      <Box marginLeft={2}>
        <Text dimColor>Energy: </Text>
        <Text color={energyColor}>{energyIndicator}</Text>
        <Text dimColor> {energy}%</Text>
      </Box>
    </Box>
  );
};

PetRow.displayName = 'PetRow';

export default PetRow;

// Made with Moe Abdelaziz
