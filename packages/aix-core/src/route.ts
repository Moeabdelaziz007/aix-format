import { NextRequest, NextResponse } from 'next/server';
import { getGateway } from '@aix-core/index';

// FIX: Force Node.js runtime to bypass Edge crypto limitations
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json().catch(() => ({}));
        const agentId = body.agentId || 'test';
        const task = body.task || 'say hello';

        const gateway = getGateway();
        const result = await gateway.execute({ agentId, task });

        return NextResponse.json(result);
    } catch (err: any) {
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}