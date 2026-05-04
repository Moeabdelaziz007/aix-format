import { NextResponse } from 'next/server';
import { generateDNAFingerprint } from '@aix-core/security/dna';

export async function POST(req: Request) {
  try {
    const manifest = await req.json();
    const hash = generateDNAFingerprint(manifest);
    return NextResponse.json({ success: true, dna_hash: hash });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
