#!/usr/bin/env node
/**
 * 🎨 AIX Studio - Terminal UI Entry Point
 * 
 * High-quality terminal dashboard for AIX meta-loop monitoring
 * Built with Ink (React for terminals)
 */

import React, { useState, useEffect } from 'react';
import { render } from 'ink';
import AIXDashboard from './components/AIXDashboard.js';
import { EventEmitter } from 'events';

// ═══════════════════════════════════════════════════════════════════════════════
// MOCK DATA GENERATOR (Replace with real meta-loop connection)
// ═══════════════════════════════════════════════════════════════════════════════

const bus = new EventEmitter();

function generateMockData() {
  const pets = [
    { id: 'chrono', name: 'Chrono', emoji: '🗓️', mood: 'happy' as const, level: 5, xp: 234, watching: 'bull' },
    { id: 'volt', name: 'Volt', emoji: '⚡', mood: 'ecstatic' as const, level: 7, xp: 456, watching: 'shade' },
    { id: 'shade', name: 'Shade', emoji: '🕵️', mood: 'neutral' as const, level: 4, xp: 189, watching: 'drop' },
    { id: 'bull', name: 'Bull', emoji: '📈', mood: 'happy' as const, level: 6, xp: 312, watching: 'volt' },
    { id: 'drop', name: 'Drop', emoji: '🪂', mood: 'tired' as const, level: 3, xp: 145, watching: 'chrono' },
  ];

  const agents = [
    {
      id: 'meta-agent-1',
      mood: 'happy' as const,
      entropy: 0.15,
      phaseWins: { observe: 45, decide: 42, act: 40, reflect: 43 },
      lastAction: 'Executed optimize module',
      timestamp: Date.now() - 5000,
    },
    {
      id: 'meta-agent-2',
      mood: 'ecstatic' as const,
      entropy: 0.08,
      phaseWins: { observe: 50, decide: 48, act: 47, reflect: 49 },
      lastAction: 'Executed compress module',
      timestamp: Date.now() - 3000,
    },
    {
      id: 'meta-agent-3',
      mood: 'neutral' as const,
      entropy: 0.22,
      phaseWins: { observe: 38, decide: 35, act: 33, reflect: 36 },
      lastAction: 'Executed evolve module',
      timestamp: Date.now() - 8000,
    },
  ];

  const busEvents = [
    { id: '1', source: 'volt', type: 'boost_applied', timestamp: Date.now() - 1000 },
    { id: '2', source: 'shade', type: 'price_alert', timestamp: Date.now() - 2000 },
    { id: '3', source: 'bull', type: 'trade_signal', timestamp: Date.now() - 3000 },
    { id: '4', source: 'drop', type: 'airdrop_found', timestamp: Date.now() - 4000 },
    { id: '5', source: 'chrono', type: 'alarm_fired', timestamp: Date.now() - 5000 },
    { id: '6', source: 'meta-agent-1', type: 'action_executed', timestamp: Date.now() - 6000 },
    { id: '7', source: 'meta-agent-2', type: 'action_executed', timestamp: Date.now() - 7000 },
    { id: '8', source: 'volt', type: 'memory_optimized', timestamp: Date.now() - 8000 },
    { id: '9', source: 'shade', type: 'web_scraped', timestamp: Date.now() - 9000 },
    { id: '10', source: 'bull', type: 'market_analyzed', timestamp: Date.now() - 10000 },
  ];

  const emergentPatterns = [
    { pattern: 'bull_learns_from_volt', strength: 0.85, count: 12 },
    { pattern: 'mood_neutral_to_happy', strength: 0.78, count: 8 },
    { pattern: 'chrono_learns_from_bull', strength: 0.82, count: 10 },
    { pattern: 'volt_learns_from_shade', strength: 0.75, count: 7 },
    { pattern: 'shade_learns_from_drop', strength: 0.70, count: 6 },
  ];

  const codeDensity = {
    metaPatterns: 45,
    petPatterns: 35,
    trustPatterns: 18,
    multiFunctionPercent: 30,
  };

  return { pets, agents, busEvents, emergentPatterns, codeDensity };
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN APP COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

const App: React.FC = () => {
  const [loopCount, setLoopCount] = useState(0);
  const [isRunning, setIsRunning] = useState(true);
  const [data, setData] = useState(generateMockData());

  // Simulate loop updates
  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      setLoopCount(prev => prev + 1);
      
      // Update data with slight variations
      setData(prev => {
        const newData = generateMockData();
        
        // Add new bus event
        const newEvent = {
          id: String(Date.now()),
          source: ['volt', 'shade', 'bull', 'drop', 'chrono'][Math.floor(Math.random() * 5)],
          type: ['boost', 'alert', 'signal', 'found', 'alarm'][Math.floor(Math.random() * 5)],
          timestamp: Date.now(),
        };
        
        return {
          ...newData,
          busEvents: [...prev.busEvents, newEvent].slice(-20),
        };
      });
    }, 2000);

    return () => clearInterval(interval);
  }, [isRunning]);

  return (
    <AIXDashboard
      pets={data.pets}
      agents={data.agents}
      busEvents={data.busEvents}
      emergentPatterns={data.emergentPatterns}
      loopCount={loopCount}
      isRunning={isRunning}
      codeDensity={data.codeDensity}
    />
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// RENDER
// ═══════════════════════════════════════════════════════════════════════════════

console.clear();
render(<App />);

// Made with Moe Abdelaziz
