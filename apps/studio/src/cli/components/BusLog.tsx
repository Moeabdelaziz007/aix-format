import React, { useState, useEffect } from 'react';
import { Box, Text } from 'ink';

interface BusEvent {
  id: string;
  type: 'skill' | 'trust' | 'swarm' | 'gateway';
  message: string;
  timestamp: number;
}

interface BusLogProps {
  events: BusEvent[];
  maxEvents?: number;
}

const EVENT_ICONS = {
  skill: '⚡',
  trust: '🔒',
  swarm: '🐝',
  gateway: '🌐'
};

const EVENT_COLORS = {
  skill: '#4ECDC4',
  trust: '#F7DC6F',
  swarm: '#98D8C8',
  gateway: '#45B7D1'
};

const WAVE_CHARS = ['▁', '▂', '▃', '▄', '▅', '▆', '▇', '█'];

export const BusLog: React.FC<BusLogProps> = ({ 
  events, 
  maxEvents = 10 
}) => {
  const [highlightedEvent, setHighlightedEvent] = useState<string | null>(null);
  const [waveOffset, setWaveOffset] = useState(0);

  // Activity wave indicator (100ms)
  useEffect(() => {
    const interval = setInterval(() => {
      setWaveOffset((prev) => (prev + 1) % WAVE_CHARS.length);
    }, 100);
    return () => clearInterval(interval);
  }, []);

  // Highlight new events (1s flash)
  useEffect(() => {
    if (events.length > 0) {
      const latestEvent = events[events.length - 1];
      setHighlightedEvent(latestEvent.id);
      
      const timeout = setTimeout(() => {
        setHighlightedEvent(null);
      }, 1000);

      return () => clearTimeout(timeout);
    }
  }, [events]);

  // Get recent events
  const recentEvents = events.slice(-maxEvents);

  // Calculate age-based opacity
  const getOpacity = (index: number): boolean | undefined => {
    const age = recentEvents.length - index - 1;
    return age > 5 ? true : undefined;
  };

  // Activity indicator
  const activityWave = Array.from({ length: 10 }, (_, i) => {
    const waveIndex = (waveOffset + i) % WAVE_CHARS.length;
    return WAVE_CHARS[waveIndex];
  }).join('');

  return (
    <Box flexDirection="column" marginY={1}>
      {/* Header */}
      <Box marginBottom={1}>
        <Text color="#45B7D1" bold>Bus Activity</Text>
        <Text dimColor> | </Text>
        <Text color="#4ECDC4">{activityWave}</Text>
      </Box>

      {/* Event list */}
      {recentEvents.length === 0 ? (
        <Box marginLeft={2}>
          <Text dimColor>No events yet...</Text>
        </Box>
      ) : (
        recentEvents.map((event, index) => {
          const isHighlighted = event.id === highlightedEvent;
          const opacity = getOpacity(index);
          const icon = EVENT_ICONS[event.type];
          const color = EVENT_COLORS[event.type];
          
          // Calculate time ago
          const now = Date.now();
          const secondsAgo = Math.floor((now - event.timestamp) / 1000);
          const timeAgo = secondsAgo < 60 
            ? `${secondsAgo}s ago`
            : `${Math.floor(secondsAgo / 60)}m ago`;

          return (
            <Box key={event.id} marginLeft={2} marginY={0}>
              <Text 
                color={color} 
                bold={isHighlighted}
                dimColor={opacity}
              >
                {icon} 
              </Text>
              <Text 
                color={isHighlighted ? '#FFFFFF' : color}
                dimColor={opacity}
              >
                {' '}{event.message}
              </Text>
              <Text dimColor> ({timeAgo})</Text>
            </Box>
          );
        })
      )}

      {/* Footer stats */}
      <Box marginTop={1} marginLeft={2}>
        <Text dimColor>Total: {events.length} events</Text>
        {events.length > maxEvents && (
          <Text dimColor> (showing last {maxEvents})</Text>
        )}
      </Box>
    </Box>
  );
};

BusLog.displayName = 'BusLog';

export default BusLog;

// Made with Moe Abdelaziz
