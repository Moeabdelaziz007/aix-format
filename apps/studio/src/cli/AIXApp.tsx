import React, { useState, useEffect } from 'react';
import { Box, Text } from 'ink';
import Header from './components/Header';
import PetRow from './components/PetRow';
import BusLog from './components/BusLog';
import MetaStatus from './components/MetaStatus';

interface Pet {
  id: string;
  name: string;
  status: 'active' | 'idle' | 'learning';
  xp: number;
  maxXp: number;
  energy: number;
  skills: number;
}

interface BusEvent {
  id: string;
  type: 'skill' | 'trust' | 'swarm' | 'gateway';
  message: string;
  timestamp: number;
}

export const AIXApp: React.FC = () => {
  const [pets, setPets] = useState<Pet[]>([
    {
      id: '1',
      name: 'CodeWeaver',
      status: 'active',
      xp: 750,
      maxXp: 1000,
      energy: 85,
      skills: 12
    },
    {
      id: '2',
      name: 'DataMiner',
      status: 'learning',
      xp: 450,
      maxXp: 1000,
      energy: 60,
      skills: 8
    },
    {
      id: '3',
      name: 'SwarmCoordinator',
      status: 'idle',
      xp: 200,
      maxXp: 1000,
      energy: 40,
      skills: 5
    }
  ]);

  const [events, setEvents] = useState<BusEvent[]>([
    {
      id: '1',
      type: 'gateway',
      message: 'System initialized',
      timestamp: Date.now() - 5000
    },
    {
      id: '2',
      type: 'skill',
      message: 'CodeWeaver learned new pattern',
      timestamp: Date.now() - 3000
    },
    {
      id: '3',
      type: 'trust',
      message: 'Trust chain validated',
      timestamp: Date.now() - 1000
    }
  ]);

  const [metaStatus, setMetaStatus] = useState({
    phase: 'learning' as const,
    entropy: 0.45,
    cycleCount: 127,
    lastUpdate: '2s ago'
  });

  // Simulate pet XP gain
  useEffect(() => {
    const interval = setInterval(() => {
      setPets(prev => prev.map(pet => {
        if (pet.status === 'active' || pet.status === 'learning') {
          const newXp = Math.min(pet.maxXp, pet.xp + Math.random() * 10);
          return { ...pet, xp: newXp };
        }
        return pet;
      }));
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  // Simulate new bus events
  useEffect(() => {
    const interval = setInterval(() => {
      const eventTypes: Array<'skill' | 'trust' | 'swarm' | 'gateway'> = 
        ['skill', 'trust', 'swarm', 'gateway'];
      const randomType = eventTypes[Math.floor(Math.random() * eventTypes.length)];
      
      const messages = {
        skill: ['New skill acquired', 'Pattern recognized', 'Learning complete'],
        trust: ['Trust verified', 'Chain updated', 'Validation passed'],
        swarm: ['Swarm coordinated', 'Task distributed', 'Consensus reached'],
        gateway: ['Request processed', 'Connection established', 'Data synced']
      };

      const randomMessage = messages[randomType][
        Math.floor(Math.random() * messages[randomType].length)
      ];

      const newEvent: BusEvent = {
        id: Date.now().toString(),
        type: randomType,
        message: randomMessage,
        timestamp: Date.now()
      };

      setEvents(prev => [...prev, newEvent]);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // Update meta status
  useEffect(() => {
    const interval = setInterval(() => {
      setMetaStatus(prev => ({
        ...prev,
        entropy: Math.max(0, Math.min(1, prev.entropy + (Math.random() - 0.5) * 0.1)),
        cycleCount: prev.cycleCount + 1,
        lastUpdate: 'just now'
      }));
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  return (
    <Box flexDirection="column" padding={1}>
      {/* Header */}
      <Header title="AIX Format Studio" version="1.0.0" />

      {/* Main content area */}
      <Box flexDirection="row" marginTop={1}>
        {/* Left column - Pets */}
        <Box flexDirection="column" width="50%" paddingRight={2}>
          <Text color="#45B7D1" bold underline>Active Pets</Text>
          <Box flexDirection="column" marginTop={1}>
            {pets.map(pet => (
              <PetRow key={pet.id} {...pet} />
            ))}
          </Box>
        </Box>

        {/* Right column - Bus Log */}
        <Box flexDirection="column" width="50%" paddingLeft={2}>
          <BusLog events={events} maxEvents={8} />
        </Box>
      </Box>

      {/* Bottom - Meta Status */}
      <Box marginTop={1}>
        <MetaStatus {...metaStatus} />
      </Box>

      {/* Footer */}
      <Box marginTop={1} justifyContent="center">
        <Text dimColor>Press Ctrl+C to exit</Text>
      </Box>
    </Box>
  );
};

AIXApp.displayName = 'AIXApp';

export default AIXApp;

// Made with Moe Abdelaziz
