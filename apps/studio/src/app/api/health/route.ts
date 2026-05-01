import { NextResponse } from 'next/server';
import { kv, NS } from "@/lib/storage/redis";
import { getRegistry } from '@/lib/registry';

/**
 * GET /api/health
 * Returns system health including Redis connectivity and Pi Network status.
 * Used as Vercel pre-deployment smoke test and monitor.
 */
export async function GET() {
  const checks: Record<string, { status: "ok" | "error" | "degraded"; latencyMs?: number; message?: string }> = {};
  const startTime = Date.now();

  // 1. Redis check
  const redisStart = Date.now();
  try {
    const heartbeatKey = `${NS.HEALTH}:heartbeat`;
    await kv.set(heartbeatKey, Date.now(), { ex: 60 });
    const pong = await kv.get<number>(heartbeatKey);
    checks.redis = {
      status: pong !== null ? "ok" : "error",
      latencyMs: Date.now() - redisStart,
      message: pong !== null ? "Connected" : "Ping returned null",
    };
  } catch (err) {
    checks.redis = {
      status: "error",
      latencyMs: Date.now() - redisStart,
      message: err instanceof Error ? err.message : String(err),
    };
  }

  // 2. Pi Network Availability (3s timeout)
  const piStart = Date.now();
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);
    
    const response = await fetch("https://api.minepi.com/v2/health", {
      signal: controller.signal,
      cache: "no-store"
    });
    
    clearTimeout(timeoutId);
    checks.piNetwork = {
      status: response.ok ? "ok" : "degraded",
      latencyMs: Date.now() - piStart,
      message: response.ok ? "Operational" : `HTTP ${response.status}`,
    };
  } catch (err) {
    checks.piNetwork = {
      status: "error",
      latencyMs: Date.now() - piStart,
      message: err instanceof Error ? err.message : String(err),
    };
  }

  const allOk = Object.values(checks).every((c) => c.status === "ok");

  return NextResponse.json(
    {
      status: allOk ? "healthy" : "degraded",
      version: process.env.NEXT_PUBLIC_STUDIO_VERSION ?? "1.3.0",
      timestamp: new Date().toISOString(),
      totalLatencyMs: Date.now() - startTime,
      checks,
      system: {
        uptime: process.uptime(),
        nodeEnv: process.env.NODE_ENV,
      }
    },
    { status: allOk ? 200 : 503 }
  );
}

