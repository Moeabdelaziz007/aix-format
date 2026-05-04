import React, { useState, useEffect } from 'react';
import { Box, Text } from 'ink';

interface MetaStatusProps {
  phase: 'init' | 'learning' | 'optimizing' | 'stable';
  entropy: number;
  cycleCount: number;
  lastUpdate?: string;
}

const PHASE_ICONS = {
  init: '◯',
  learning: '◐',
  optimizing: '◓',
  stable: '●'
};

const PHASE_COLORS = {
  init: '#666666',
  learning: '#4ECDC4',
  optimizing: '#F7DC6F',
  stable: '#98D8C8'
};

const PHASE_MESSAGES = {
  init: 'Initializing system...',
  learning: 'Learning patterns...',
  optimizing: 'Optimizing performance...',
  stable: 'System stable'
};

const ENTROPY_CHARS = ['▁', '▂', '▃', '▄', '▅', '▆', '▇', '█'];

export const MetaStatus: React.FC<MetaStatusProps> = ({
  phase,
  entropy,
  cycleCount,
  lastUpdate
}) => {
  const [entropyOffset, setEntropyOffset] = useState(0);
  const [breathIntensity, setBreathIntensity] = useState(0);
  const [messageIndex, setMessageIndex] = useState(0);

  // Animated entropy bar (100ms)
  useEffect(() => {
    const interval = setInterval(() => {
      setEntropyOffset((prev) => (prev + 1) % ENTROPY_CHARS.length);
    }, 100);
    return () => clearInterval(interval);
  }, []);

  // Breathing border (50ms)
  useEffect(() => {
    const interval = setInterval(() => {
      setBreathIntensity((prev) => {
        const next = prev + 0.05;
        return next > 1 ? 0 : next;
      });
    }, 50);
    return () => clearInterval(interval);
  }, []);

  // Dynamic status messages (3s rotation)
  useEffect(() => {
    const messages = [
      PHASE_MESSAGES[phase],
      `Cycle #${cycleCount}`,
      `Entropy: ${entropy.toFixed(2)}`
    ];
    
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % messages.length);
    }, 3000);
    
    return () => clearInterval(interval);
  }, [phase, cycleCount, entropy]);

  // Phase progress indicator (●✓○)
  const phases = ['init', 'learning', 'optimizing', 'stable'] as const;
  const currentPhaseIndex = phases.indexOf(phase);
  
  const phaseProgress = phases.map((p, i) => {
    if (i < currentPhaseIndex) return '✓';
    if (i === currentPhaseIndex) return '●';
    return '○';
  }).join(' ');

  // Calculate entropy bar
  const barLength = 20;
  const filledLength = Math.round((entropy / 1.0) * barLength);
  
  const entropyBar = Array.from({ length: barLength }, (_, i) => {
    if (i < filledLength) {
      const charIndex = (entropyOffset + i) % ENTROPY_CHARS.length;
      return ENTROPY_CHARS[charIndex];
    }
    return '░';
  }).join('');

  // Entropy color based on value
  const entropyColor = entropy < 0.3 ? '#4ECDC4' :
                       entropy < 0.6 ? '#F7DC6F' :
                       entropy < 0.8 ? '#FFA07A' : '#FF6B6B';

  // Breathing border character
  const borderChar = breathIntensity > 0.5 ? '═' : '─';
  const border = borderChar.repeat(50);

  // Dynamic messages
  const messages = [
    PHASE_MESSAGES[phase],
    `Cycle #${cycleCount}`,
    `Entropy: ${entropy.toFixed(2)}`
  ];
  const currentMessage = messages[messageIndex];

  return (
    <Box flexDirection="column" marginY={1}>
      {/* Top border */}
      <Box>
        <Text color={PHASE_COLORS[phase]}>{border}</Text>
      </Box>

      {/* Header */}
      <Box paddingX={2} marginY={1}>
        <Text color={PHASE_COLORS[phase]} bold>
          {PHASE_ICONS[phase]} Meta-Learning Status
        </Text>
      </Box>

      {/* Phase progress */}
      <Box paddingX={2}>
        <Text dimColor>Phase: </Text>
        <Text color="#FFFFFF">{phaseProgress}</Text>
        <Text dimColor> ({phase})</Text>
      </Box>

      {/* Entropy bar */}
      <Box paddingX={2} marginTop={1}>
        <Text dimColor>Entropy: </Text>
        <Text color={entropyColor}>{entropyBar}</Text>
        <Text color="#FFFFFF"> {(entropy * 100).toFixed(0)}%</Text>
      </Box>

      {/* Cycle count */}
      <Box paddingX={2} marginTop={1}>
        <Text dimColor>Cycles: </Text>
        <Text color="#4ECDC4" bold>{cycleCount}</Text>
        {lastUpdate && (
          <>
            <Text dimColor> | Last: </Text>
            <Text color="#98D8C8">{lastUpdate}</Text>
          </>
        )}
      </Box>

      {/* Dynamic status message */}
      <Box paddingX={2} marginTop={1}>
        <Text color={PHASE_COLORS[phase]} italic>
          → {currentMessage}
        </Text>
      </Box>

      {/* Bottom border */}
      <Box marginTop={1}>
        <Text color={PHASE_COLORS[phase]}>{border}</Text>
      </Box>
    </Box>
  );
};

MetaStatus.displayName = 'MetaStatus';

export default MetaStatus;

// Made with Moe Abdelaziz
