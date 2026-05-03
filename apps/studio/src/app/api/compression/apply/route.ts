import { NextRequest, NextResponse } from 'next/server';
import { ManifestCompressionIntegration } from '@aix/core/compression/manifest-integration';

export async function POST(req: NextRequest) {
  try {
    const { manifest, taskType, recordOutcome } = await req.json();

    const integration = new ManifestCompressionIntegration();
    const result = await integration.compressManifest(manifest, taskType);

    if (recordOutcome) {
      await integration.recordOutcome({
        taskId: `task_${Date.now()}`,
        taskType,
        compressionUsed: recordOutcome.action,
        originalSize: result.metadata.originalSize,
        compressedSize: result.metadata.compressedSize,
        quality: recordOutcome.quality || 0.9,
        latency: result.metadata.latency,
        success: true,
        userFeedback: recordOutcome.userFeedback
      });
    }

    return NextResponse.json({
      success: true,
      compressed: result.compressed,
      metadata: result.metadata
    });
  } catch (error: unknown) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Made with Moe Abdelaziz
