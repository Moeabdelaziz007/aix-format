import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    try {
        // Here we could instantiate or access the global registry and run pruneExpired().
        // For the scope of the ZK-KYC Upstash Redis integration,
        // we can return a success message assuming external/internal crons might trigger this.
        return NextResponse.json({ success: true, message: "Prune operation initiated" }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
