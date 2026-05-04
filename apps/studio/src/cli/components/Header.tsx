import React, { useState, useEffect } from 'react';
import { Box, Text } from 'ink';

interface HeaderProps {
  title?: string;
  version?: string;
}

const COLORS = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F'];
const SPINNER_FRAMES = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
const WAVE_FRAMES = ['▁', '▂', '▃', '▄', '▅', '▆', '▇', '█', '▇', '▆', '▅', '▄', '▃', '▂'];

export const Header: React.FC<HeaderProps> = ({ 
  title = 'AIX Format Studio', 
  version = '1.0.0' 
}) => {
  const [colorIndex, setColorIndex] = useState(0);
  const [spinnerIndex, setSpinnerIndex] = useState(0);
  const [waveIndex, setWaveIndex] = useState(0);
  const [glowIntensity, setGlowIntensity] = useState(0);

  // Rainbow gradient cycling (300ms)
  useEffect(() => {
    const interval = setInterval(() => {
      setColorIndex((prev) => (prev + 1) % COLORS.length);
    }, 300);
    return () => clearInterval(interval);
  }, []);

  // Multi-spinner system (120ms)
  useEffect(() => {
    const interval = setInterval(() => {
      setSpinnerIndex((prev) => (prev + 1) % SPINNER_FRAMES.length);
    }, 120);
    return () => clearInterval(interval);
  }, []);

  // Wave border animation (100ms)
  useEffect(() => {
    const interval = setInterval(() => {
      setWaveIndex((prev) => (prev + 1) % WAVE_FRAMES.length);
    }, 100);
    return () => clearInterval(interval);
  }, []);

  // Breathing glow effect (50ms)
  useEffect(() => {
    const interval = setInterval(() => {
      setGlowIntensity((prev) => {
        const next = prev + 0.1;
        return next > 1 ? 0 : next;
      });
    }, 50);
    return () => clearInterval(interval);
  }, []);

  const currentColor = COLORS[colorIndex];
  const nextColor = COLORS[(colorIndex + 1) % COLORS.length];
  const spinner = SPINNER_FRAMES[spinnerIndex];
  const wave = WAVE_FRAMES[waveIndex];
  const glowChar = glowIntensity > 0.5 ? '◆' : '◇';

  // Create wave border
  const borderLength = 60;
  const waveBorder = Array.from({ length: borderLength }, (_, i) => {
    const offset = (waveIndex + i) % WAVE_FRAMES.length;
    return WAVE_FRAMES[offset];
  }).join('');

  return (
    <Box flexDirection="column" marginBottom={1}>
      {/* Top wave border */}
      <Box>
        <Text color={currentColor}>{waveBorder}</Text>
      </Box>

      {/* Title with gradient effect */}
      <Box justifyContent="space-between" paddingX={2}>
        <Box>
          <Text color={currentColor} bold>
            {spinner} {title}
          </Text>
          <Text color={nextColor} dimColor> v{version}</Text>
        </Box>
        <Box>
          <Text color={currentColor}>{glowChar}</Text>
          <Text color={nextColor} dimColor> 4-Ring Bus</Text>
        </Box>
      </Box>

      {/* Status indicators */}
      <Box paddingX={2} marginTop={1}>
        <Text color="#4ECDC4">● Core</Text>
        <Text dimColor> | </Text>
        <Text color="#45B7D1">● Gateway</Text>
        <Text dimColor> | </Text>
        <Text color="#98D8C8">● Swarm</Text>
        <Text dimColor> | </Text>
        <Text color="#F7DC6F">● Trust</Text>
      </Box>

      {/* Bottom wave border */}
      <Box>
        <Text color={nextColor}>{waveBorder}</Text>
      </Box>
    </Box>
  );
};

Header.displayName = 'Header';

export default Header;

// Made with Moe Abdelaziz
