'use client';

import { useEffect, useState, useRef } from 'react';
import { Box, Text } from '@/design-system/agentic-components';

interface PulseEvent {
  type: 'bus' | 'pet' | 'meta' | 'connected' | 'error';
  data?: unknown;
  timestamp: number;
}

export default function PulsePage() {
  const [events, setEvents] = useState<PulseEvent[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef(0);

  useEffect(() => {
    connectToStream();

    return () => {
      disconnect();
    };
  }, []);

  const connectToStream = () => {
    // Clear any existing connection
    disconnect();

    try {
      const eventSource = new EventSource('/api/pulse/stream');
      eventSourceRef.current = eventSource;

      eventSource.onopen = () => {
        console.log('[Pulse] Connected to SSE stream');
        setIsConnected(true);
        setError(null);
        reconnectAttempts.current = 0;
      };

      eventSource.addEventListener('connected', (e) => {
        const data = JSON.parse(e.data);
        setEvents(prev => [...prev, { type: 'connected', data, timestamp: data.timestamp }]);
      });

      eventSource.addEventListener('bus', (e) => {
        const data = JSON.parse(e.data);
        setEvents(prev => [...prev.slice(-99), { type: 'bus', data, timestamp: Date.now() }]);
      });

      eventSource.addEventListener('pet', (e) => {
        const data = JSON.parse(e.data);
        setEvents(prev => [...prev.slice(-99), { type: 'pet', data, timestamp: Date.now() }]);
      });

      eventSource.addEventListener('meta', (e) => {
        const data = JSON.parse(e.data);
        setEvents(prev => [...prev.slice(-99), { type: 'meta', data, timestamp: Date.now() }]);
      });

      eventSource.addEventListener('error', (e) => {
        const data = JSON.parse(e.data);
        setEvents(prev => [...prev, { type: 'error', data, timestamp: Date.now() }]);
      });

      eventSource.onerror = (err) => {
        console.error('[Pulse] SSE error:', err);
        setIsConnected(false);
        setError('Connection lost');

        // Exponential backoff reconnection
        const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
        reconnectAttempts.current++;

        console.log(`[Pulse] Reconnecting in ${delay}ms (attempt ${reconnectAttempts.current})`);
        
        reconnectTimeoutRef.current = setTimeout(() => {
          connectToStream();
        }, delay);
      };
    } catch (err) {
      console.error('[Pulse] Failed to create EventSource:', err);
      setError('Failed to connect');
    }
  };

  const disconnect = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    setIsConnected(false);
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'bus': return '🚌';
      case 'pet': return '🐾';
      case 'meta': return '🧠';
      case 'connected': return '✅';
      case 'error': return '❌';
      default: return '📡';
    }
  };

  const getEventColor = (type: string) => {
    switch (type) {
      case 'bus': return 'text-blue-500';
      case 'pet': return 'text-green-500';
      case 'meta': return 'text-purple-500';
      case 'connected': return 'text-emerald-500';
      case 'error': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            🔴 Pulse Dashboard
          </h1>
          <p className="text-gray-400">
            Real-time AIX Format event stream with SSE
          </p>
        </div>

        {/* Connection Status */}
        <div className="mb-6 p-4 rounded-lg bg-gray-800 border border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
              <span className="text-white font-medium">
                {isConnected ? 'Connected' : 'Disconnected'}
              </span>
              {error && (
                <span className="text-red-400 text-sm">
                  ({error})
                </span>
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={connectToStream}
                disabled={isConnected}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Reconnect
              </button>
              <button
                onClick={disconnect}
                disabled={!isConnected}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Disconnect
              </button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="p-4 rounded-lg bg-gray-800 border border-gray-700">
            <div className="text-gray-400 text-sm mb-1">Total Events</div>
            <div className="text-2xl font-bold text-white">{events.length}</div>
          </div>
          <div className="p-4 rounded-lg bg-gray-800 border border-gray-700">
            <div className="text-gray-400 text-sm mb-1">Bus Events</div>
            <div className="text-2xl font-bold text-blue-500">
              {events.filter(e => e.type === 'bus').length}
            </div>
          </div>
          <div className="p-4 rounded-lg bg-gray-800 border border-gray-700">
            <div className="text-gray-400 text-sm mb-1">Pet Events</div>
            <div className="text-2xl font-bold text-green-500">
              {events.filter(e => e.type === 'pet').length}
            </div>
          </div>
          <div className="p-4 rounded-lg bg-gray-800 border border-gray-700">
            <div className="text-gray-400 text-sm mb-1">Meta Events</div>
            <div className="text-2xl font-bold text-purple-500">
              {events.filter(e => e.type === 'meta').length}
            </div>
          </div>
        </div>

        {/* Event Stream */}
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
          <h2 className="text-xl font-bold text-white mb-4">Event Stream</h2>
          
          <div className="space-y-2 max-h-[600px] overflow-y-auto">
            {events.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                No events yet. Waiting for stream...
              </div>
            ) : (
              events.slice().reverse().map((event, index) => (
                <div
                  key={`${event.timestamp}-${index}`}
                  className="p-3 rounded-lg bg-gray-900 border border-gray-700 hover:border-gray-600 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">{getEventIcon(event.type)}</span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`font-medium ${getEventColor(event.type)}`}>
                          {event.type.toUpperCase()}
                        </span>
                        <span className="text-gray-500 text-sm">
                          {new Date(event.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <pre className="text-gray-300 text-sm overflow-x-auto">
                        {JSON.stringify(event.data, null, 2)}
                      </pre>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Made with Moe Abdelaziz
