import { NextResponse } from 'next/server';
import { kv } from "@/lib/redis";
import { getRegistry } from '@/lib/registry';

export async function GET() {
  const startTime = Date.now();
  
  // 1. Check KV Status
  let kvStatus: 'connected' | 'unavailable' = 'unavailable';
  let kvLatency = 0;
  try {
    const pingStart = Date.now();
    await kv.set('aix_health_heartbeat', Date.now());
    kvStatus = 'connected';
    kvLatency = Date.now() - pingStart;
  } catch (error) {
    console.error('Health Check: KV Ping failed', error);
  }

  // 2. Get Agent Count
  let agentCount = 0;
  try {
    const registry = await getRegistry();
    agentCount = registry.length;
  } catch (error) {
    console.error('Health Check: Registry count failed', error);
  }

  // 3. Check Pi Network Availability (3s timeout)
  let piStatus: 'operational' | 'degraded' | 'unavailable' = 'unavailable';
  let piLatency = 0;
  try {
    const piStart = Date.now();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);
    
    const response = await fetch('https://api.minepi.com/v2/health', {
      signal: controller.signal,
      cache: 'no-store'
    });
    
    clearTimeout(timeoutId);
    if (response.ok) {
      piStatus = 'operational';
      piLatency = Date.now() - piStart;
    } else {
      piStatus = 'degraded';
    }
  } catch (error) {
    console.error('Health Check: Pi Network check failed', error);
  }

  // 4. Overall Status
  const isHealthy = kvStatus === 'connected' && piStatus !== 'unavailable';

  return NextResponse.json({
    status: isHealthy ? 'healthy' : 'degraded',
    kv: {
      status: kvStatus,
      latency: kvLatency
    },
    piNetwork: {
      status: piStatus,
      latency: piLatency
    },
    registry: {
      agents: agentCount
    },
    system: {
      uptime: process.uptime(),
      version: '1.0.0',
      nodeEnv: process.env.NODE_ENV,
      timestamp: new Date().toISOString(),
      totalLatency: Date.now() - startTime
    }
  });
}
