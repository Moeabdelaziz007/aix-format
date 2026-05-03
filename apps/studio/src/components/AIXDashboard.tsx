/**
 * 🎨 AIX Studio - High-Quality Terminal Dashboard
 * 
 * React components rendered in terminal using Ink
 * Shows live meta-loop execution with pets, agents, and emergent patterns
 */

import React, { useState, useEffect } from 'react';
import { Box, Text, useApp, useInput } from 'ink';
import Gradient from 'ink-gradient';
import BigText from 'ink-big-text';
import Spinner from 'ink-spinner';
import Table from 'ink-table';
import { formatDistanceToNow } from 'date-fns';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

interface Pet {
  id: string;
  name: string;
  emoji: string;
  mood: 'ecstatic' | 'happy' | 'neutral' | 'tired' | 'dying';
  level: number;
  xp: number;
  watching: string;
}

interface Agent {
  id: string;
  mood: 'ecstatic' | 'happy' | 'neutral' | 'tired' | 'dying';
  entropy: number;
  phaseWins: Record<string, number>;
  lastAction: string;
  timestamp: number;
}

interface BusEvent {
  id: string;
  source: string;
  type: string;
  timestamp: number;
  data?: any;
}

interface EmergentPattern {
  pattern: string;
  strength: number;
  count: number;
}

interface DashboardProps {
  pets: Pet[];
  agents: Agent[];
  busEvents: BusEvent[];
  emergentPatterns: EmergentPattern[];
  loopCount: number;
  isRunning: boolean;
  codeDensity: {
    metaPatterns: number;
    petPatterns: number;
    trustPatterns: number;
    multiFunctionPercent: number;
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// MOOD COLORS
// ═══════════════════════════════════════════════════════════════════════════════

const MOOD_COLORS = {
  ecstatic: 'green',
  happy: 'cyan',
  neutral: 'yellow',
  tired: 'magenta',
  dying: 'red',
} as const;

const MOOD_EMOJIS = {
  ecstatic: '🚀',
  happy: '😊',
  neutral: '😐',
  tired: '😴',
  dying: '💀',
} as const;

// ═══════════════════════════════════════════════════════════════════════════════
// HEADER COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

const Header: React.FC<{ loopCount: number; isRunning: boolean }> = ({ loopCount, isRunning }) => (
  <Box flexDirection="column" marginBottom={1}>
    <Gradient name="cristal">
      <BigText text="AIX STUDIO" font="chrome" />
    </Gradient>
    <Box justifyContent="space-between">
      <Text color="cyan" bold>
        🧬 Meta-Loop Dashboard
      </Text>
      <Box>
        {isRunning && (
          <Text color="green">
            <Spinner type="dots" /> Running
          </Text>
        )}
        {!isRunning && <Text color="red">⏸ Paused</Text>}
        <Text color="gray" dimColor> | Loop #{loopCount}</Text>
      </Box>
    </Box>
  </Box>
);

// ═══════════════════════════════════════════════════════════════════════════════
// PETS PANEL
// ═══════════════════════════════════════════════════════════════════════════════

const PetsPanel: React.FC<{ pets: Pet[] }> = ({ pets }) => (
  <Box flexDirection="column" borderStyle="round" borderColor="cyan" paddingX={1} marginBottom={1}>
    <Text color="cyan" bold>🐾 AUTONOMOUS PETS</Text>
    <Box flexDirection="row" justifyContent="space-around" marginTop={1}>
      {pets.map(pet => (
        <Box
          key={pet.id}
          flexDirection="column"
          borderStyle="single"
          borderColor={MOOD_COLORS[pet.mood]}
          paddingX={1}
          width={18}
        >
          <Text color="yellow" bold>
            {pet.emoji} {pet.name}
          </Text>
          <Text color={MOOD_COLORS[pet.mood]}>
            {MOOD_EMOJIS[pet.mood]} {pet.mood.toUpperCase()}
          </Text>
          <Text color="gray" dimColor>
            LVL {pet.level} | XP {pet.xp}
          </Text>
          <Text color="magenta" dimColor>
            👁️ → {pet.watching}
          </Text>
        </Box>
      ))}
    </Box>
  </Box>
);

// ═══════════════════════════════════════════════════════════════════════════════
// AGENTS PANEL
// ═══════════════════════════════════════════════════════════════════════════════

const AgentsPanel: React.FC<{ agents: Agent[] }> = ({ agents }) => {
  const tableData = agents.map(agent => ({
    ID: agent.id,
    Mood: `${MOOD_EMOJIS[agent.mood]} ${agent.mood}`,
    Entropy: agent.entropy.toFixed(2),
    'Phase Wins': Object.values(agent.phaseWins).reduce((sum: number, w: number) => sum + w, 0),
    'Last Action': agent.lastAction.slice(0, 20) + '...',
    Age: formatDistanceToNow(agent.timestamp, { addSuffix: true }),
  }));

  return (
    <Box flexDirection="column" borderStyle="round" borderColor="green" paddingX={1} marginBottom={1}>
      <Text color="green" bold>🤖 META AGENTS</Text>
      <Table data={tableData} />
    </Box>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// BUS EVENTS STREAM
// ═══════════════════════════════════════════════════════════════════════════════

const BusEventsStream: React.FC<{ events: BusEvent[] }> = ({ events }) => {
  const recentEvents = events.slice(-10).reverse();

  return (
    <Box flexDirection="column" borderStyle="round" borderColor="magenta" paddingX={1} marginBottom={1} height={12}>
      <Text color="magenta" bold>📡 BUS EVENT STREAM</Text>
      <Box flexDirection="column" marginTop={1}>
        {recentEvents.map(event => (
          <Box key={event.id}>
            <Text color="gray" dimColor>
              [{new Date(event.timestamp).toLocaleTimeString()}]
            </Text>
            <Text color="cyan"> {event.source}</Text>
            <Text color="yellow"> → {event.type}</Text>
          </Box>
        ))}
      </Box>
    </Box>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// EMERGENT PATTERNS
// ═══════════════════════════════════════════════════════════════════════════════

const EmergentPatternsPanel: React.FC<{ patterns: EmergentPattern[] }> = ({ patterns }) => {
  const topPatterns = patterns.slice(0, 5);

  return (
    <Box flexDirection="column" borderStyle="round" borderColor="yellow" paddingX={1} marginBottom={1}>
      <Text color="yellow" bold>✨ EMERGENT PATTERNS</Text>
      <Box flexDirection="column" marginTop={1}>
        {topPatterns.map((pattern, i) => (
          <Box key={pattern.pattern}>
            <Text color="gray" dimColor>#{i + 1}</Text>
            <Text color="cyan"> {pattern.pattern}</Text>
            <Text color="green"> strength={pattern.strength.toFixed(2)}</Text>
            <Text color="yellow"> count={pattern.count}</Text>
          </Box>
        ))}
      </Box>
    </Box>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// CODE DENSITY METRICS
// ═══════════════════════════════════════════════════════════════════════════════

const CodeDensityPanel: React.FC<{ density: DashboardProps['codeDensity'] }> = ({ density }) => (
  <Box flexDirection="column" borderStyle="round" borderColor="red" paddingX={1} marginBottom={1}>
    <Text color="red" bold>🔬 CODE DENSITY METRICS</Text>
    <Box flexDirection="row" justifyContent="space-around" marginTop={1}>
      <Box flexDirection="column">
        <Text color="green">🧬 Meta: {density.metaPatterns}</Text>
        <Text color="cyan">🐾 Pets: {density.petPatterns}</Text>
      </Box>
      <Box flexDirection="column">
        <Text color="yellow">🔗 Trust: {density.trustPatterns}</Text>
        <Text color="red">🔥 Multi-Fn: {density.multiFunctionPercent}%</Text>
      </Box>
    </Box>
  </Box>
);

// ═══════════════════════════════════════════════════════════════════════════════
// FOOTER / CONTROLS
// ═══════════════════════════════════════════════════════════════════════════════

const Footer: React.FC = () => (
  <Box borderStyle="single" borderColor="gray" paddingX={1}>
    <Text color="gray" dimColor>
      Controls: [q] Quit | [p] Pause/Resume | [r] Reset | [d] Detailed Report
    </Text>
  </Box>
);

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN DASHBOARD
// ═══════════════════════════════════════════════════════════════════════════════

export const AIXDashboard: React.FC<DashboardProps> = ({
  pets,
  agents,
  busEvents,
  emergentPatterns,
  loopCount,
  isRunning,
  codeDensity,
}) => {
  const { exit } = useApp();

  // Keyboard controls
  useInput((input, key) => {
    if (input === 'q' || key.escape) {
      exit();
    }
  });

  return (
    <Box flexDirection="column" padding={1}>
      <Header loopCount={loopCount} isRunning={isRunning} />
      
      <Box flexDirection="row">
        <Box flexDirection="column" width="60%">
          <PetsPanel pets={pets} />
          <AgentsPanel agents={agents} />
          <BusEventsStream events={busEvents} />
        </Box>
        
        <Box flexDirection="column" width="40%" marginLeft={1}>
          <EmergentPatternsPanel patterns={emergentPatterns} />
          <CodeDensityPanel density={codeDensity} />
        </Box>
      </Box>

      <Footer />
    </Box>
  );
};

export default AIXDashboard;

// Made with Bob
