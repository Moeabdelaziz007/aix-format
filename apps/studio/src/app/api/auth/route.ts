import { NextRequest, NextResponse } from "next/server";
import { kv, NS, TTL } from "../../../../core/storage/redis.ts";
import { AuthResult, PiUser } from "@/lib/types";

const SESSION_TTL = TTL.SESSION;


/**
 * POST /api/auth
 * Verifies a Pi Network accessToken and creates a session.
 */
export async function POST(req: NextRequest) {
  try {
    const { accessToken } = await req.json();

    if (!accessToken) {
      return NextResponse.json({ error: "Missing accessToken" }, { status: 400 });
    }

    // 1. Verify with Pi Platform
    const piRes = await fetch('https://api.minepi.com/v2/me', {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    if (!piRes.ok) {
      return NextResponse.json({ error: "Invalid Pi accessToken" }, { status: 401 });
    }

    const userData = await piRes.json() as PiUser;
    
    // 2. Store session in KV
    // Pattern: aix:session:{uid}
    const sessionKey = `${NS.SESSION}:${userData.uid}`;
    await kv.set(sessionKey, { user: userData, accessToken }, { ex: SESSION_TTL });

    const result: AuthResult = {
      user: userData,
      accessToken
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error("Auth Error:", error);
    return NextResponse.json({ error: "Authentication failed" }, { status: 500 });
  }
}

/**
 * GET /api/auth
 * Checks if a session exists for a given UID.
 */
export async function GET(req: NextRequest) {
  const uid = req.nextUrl.searchParams.get("uid");
  if (!uid) {
    return NextResponse.json({ error: "Missing uid" }, { status: 400 });
  }

  const session = await kv.get<AuthResult>(`${NS.SESSION}:${uid}`);
  if (!session) {
    return NextResponse.json({ authenticated: false }, { status: 404 });
  }

  return NextResponse.json({ authenticated: true, user: session.user });
}

/**
 * DELETE /api/auth
 * Logs out the user by deleting the session from KV.
 */
export async function DELETE(req: NextRequest) {
  const uid = req.nextUrl.searchParams.get("uid");
  if (!uid) {
    return NextResponse.json({ error: "Missing uid" }, { status: 400 });
  }

  await kv.del(`${NS.SESSION}:${uid}`);
  return NextResponse.json({ success: true });
}
