import { NextRequest, NextResponse } from 'next/server';
import { ManifestCompressionIntegration } from '@aix/core/compression/manifest-integration';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const taskType = searchParams.get('taskType');

    const integration = new ManifestCompressionIntegration();

    if (taskType) {
      const profile = await integration.getProfile(taskType);
      return NextResponse.json({ success: true, profile });
    }

    const profiles = await integration.getAllProfiles();
    return NextResponse.json({ success: true, profiles });
  } catch (error: unknown) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Made with Moe Abdelaziz
