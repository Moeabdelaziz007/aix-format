'use client';

import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Zap, 
  ShieldAlert, 
  Send, 
  Link2, 
  Settings, 
  Clock,
  Filter,
  Search,
  Activity
} from 'lucide-react';
import { AgentPet } from '@/components/shared/AgentPet';
import { FadeIn } from '@/components/animations/FadeIn';

interface PulseEvent {
  id: string;
  timestamp: number;
  type: 'INVOCATION' | 'SKILL_EXTRACTED' | 'SECURITY_ALERT' | 'MESSAGE_SENT' | 'AGENT_CALL' | 'EVOLUTION';
  agentId: string;
  agentName: string;
  message: string;
  pet?: any;
}

const TYPE_ICONS = {
  INVOCATION: { icon: Activity, color: '#3B82F6', label: 'Invocation' },
  SKILL_EXTRACTED: { icon: Zap, color: '#F59E0B', label: 'Skill' },
  SECURITY_ALERT: { icon: ShieldAlert, color: '#EF4444', label: 'Security' },
  MESSAGE_SENT: { icon: Send, color: '#10B981', label: 'Message' },
  AGENT_CALL: { icon: Link2, color: '#6366F1', label: 'A2A' },
  EVOLUTION: { icon: Settings, color: '#EC4899', label: 'Evolution' }
};

export default function PulsePage() {
  const [events, setEvents] = useState<PulseEvent[]>([]);
  const [filter, setFilter] = useState('ALL');
  const [isLive, setIsLive] = useState(true);
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    // Establish SSE connection
    const es = new EventSource('/api/pulse/stream');
    eventSourceRef.current = es;

    es.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'PULSE') {
        setEvents(prev => {
          // Merge new events, filter out duplicates, sort by timestamp
          const newEvents = data.events.filter((ne: PulseEvent) => !prev.some(pe => pe.id === ne.id));
          return [...newEvents, ...prev].slice(0, 50);
        });
      }
    };

    es.onerror = (err) => {
      console.error("Pulse SSE Error:", err);
      setIsLive(false);
    };

    return () => {
      es.close();
    };
  }, []);

  const filteredEvents = events.filter(e => {
    if (filter === 'ALL') return true;
    if (filter === 'SECURITY' && e.type === 'SECURITY_ALERT') return true;
    if (filter === 'SKILLS' && e.type === 'SKILL_EXTRACTED') return true;
    if (filter === 'PLATFORM' && (e.type === 'MESSAGE_SENT' || e.type === 'INVOCATION')) return true;
    return false;
  });

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white pt-24 pb-20 px-6 max-w-5xl mx-auto">
      {/* Header */}
      <header className="flex items-center justify-between mb-12">
        <div>
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className={`w-2 h-2 rounded-full ${isLive ? 'bg-red-500 animate-pulse' : 'bg-zinc-600'}`} />
              <span className="text-xs font-black text-white/40 uppercase tracking-[0.3em]">
                {isLive ? 'Live Heartbeat Feed' : 'Stream Disconnected'}
              </span>
            </div>
            <h1 className="text-5xl font-black tracking-tighter flex items-center gap-4">
              AIX PULSE
              <span className="text-sm px-3 py-1 bg-red-500/10 border border-red-500/20 text-red-500 rounded-full font-bold animate-pulse">
                LIVE
              </span>
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex bg-white/5 p-1 rounded-xl border border-white/10 backdrop-blur-md">
            {['ALL', 'PLATFORM', 'SECURITY', 'SKILLS'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-lg text-[10px] font-black transition-all ${
                  filter === f 
                  ? 'bg-white/10 text-white shadow-lg' 
                  : 'text-white/30 hover:text-white/60'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Pulse Feed */}
      <div className="space-y-3">
        <AnimatePresence initial={false} mode="popLayout">
          {filteredEvents.map((event) => {
            const typeInfo = TYPE_ICONS[event.type] || TYPE_ICONS.INVOCATION;
            const Icon = typeInfo.icon;

            return (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, x: -20, scale: 0.95 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                layout
                className="group flex items-center gap-6 p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] hover:border-white/10 transition-all"
              >
                {/* Timestamp */}
                <div className="flex flex-col items-center justify-center min-w-[70px]">
                  <span className="text-[10px] font-mono text-white/20">
                    {new Date(event.timestamp).toLocaleTimeString([], { hour12: false })}
                  </span>
                  <div className="w-[1px] h-4 bg-white/5 my-1" />
                  <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: typeInfo.color }} />
                </div>

                {/* Agent Identity */}
                <div className="flex items-center gap-3 min-w-[180px]">
                  <AgentPet pet={event.pet} size="sm" />
                  <div>
                    <div className="text-sm font-bold text-white/90">{event.agentName}</div>
                    <div className="text-[10px] font-black text-white/30 uppercase tracking-widest">{event.agentId.slice(0, 8)}</div>
                  </div>
                </div>

                {/* Event Message */}
                <div className="flex-grow flex items-center gap-3">
                  <div 
                    className="p-2 rounded-lg" 
                    style={{ backgroundColor: `${typeInfo.color}10`, color: typeInfo.color }}
                  >
                    <Icon size={14} />
                  </div>
                  <p className="text-sm text-white/60 font-medium">
                    {event.message}
                  </p>
                </div>

                {/* Action Tag */}
                <div className="hidden md:block">
                  <div 
                    className="px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border"
                    style={{ borderColor: `${typeInfo.color}20`, color: typeInfo.color, backgroundColor: `${typeInfo.color}05` }}
                  >
                    {typeInfo.label}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {events.length === 0 && (
          <div className="flex flex-col items-center justify-center py-40 border-2 border-dashed border-white/5 rounded-3xl">
            <Activity className="w-12 h-12 text-white/10 mb-4 animate-pulse" />
            <h3 className="text-white/40 font-bold uppercase tracking-widest text-xs">Waiting for agent activity...</h3>
          </div>
        )}
      </div>

      {/* Footer Stat */}
      <footer className="mt-12 flex items-center justify-between text-[10px] font-black text-white/20 uppercase tracking-[0.2em]">
        <div>
          Buffer: {events.length} / 50 events
        </div>
        <div className="flex items-center gap-2">
          <Clock size={12} />
          Synchronized with Sovereign Gateway
        </div>
      </footer>
    </div>
  );
}
