import { NextResponse } from "next/server";
import { kv } from "@/lib/storage/redis";


/**
 * GET /api/health
 * Returns system health including Redis connectivity.
 * Used as Vercel pre-deployment smoke test.
 */
export async function GET() {
  const checks: Record<string, { status: "ok" | "error"; latencyMs?: number; message?: string }> = {};

  // Redis check
  const redisStart = Date.now();
  try {
    await kv.set("aix:health:ping", Date.now(), { ex: 30 });
    const pong = await kv.get<number>("aix:health:ping");
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

  const allOk = Object.values(checks).every((c) => c.status === "ok");

  return NextResponse.json(
    {
      status: allOk ? "healthy" : "degraded",
      version: process.env.NEXT_PUBLIC_STUDIO_VERSION ?? "1.3.0",
      timestamp: new Date().toISOString(),
      checks,
    },
    { status: allOk ? 200 : 503 }
  );
}
