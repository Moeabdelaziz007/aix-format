import { NextResponse } from "next/server";
// In a real implementation we would import the PiKycAdapter from core,
// but since the studio app may not resolve the 'core' workspace smoothly in Next.js
// out-of-the-box without config changes, and tweetnacl might need polyfills in Edge,
// we'll implement the route properly.
import { PiKycAdapter } from "../../../../../../../core/pi_kyc_adapter";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // The PiKycAdapter expects: { user: { uid }, accessToken, signature, publicKey }
    const result = PiKycAdapter.generateIdentity(body);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("KYC Verification Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to verify KYC signature" },
      { status: 400 }
    );
  }
}
