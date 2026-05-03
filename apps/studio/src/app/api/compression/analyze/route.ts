import { NextRequest, NextResponse } from 'next/server';
import { ManifestCompressionIntegration } from '@aix/core/compression/manifest-integration';

export async function POST(req: NextRequest) {
  try {
    const { manifest, taskType } = await req.json();

    if (!manifest || !taskType) {
      return NextResponse.json(
        { error: 'Missing manifest or taskType' },
        { status: 400 }
      );
    }

    const integration = new ManifestCompressionIntegration();
    const result = await integration.compressManifest(manifest, taskType);

    return NextResponse.json({
      success: true,
      analysis: {
        originalSize: result.metadata.originalSize,
        compressedSize: result.metadata.compressedSize,
        ratio: result.metadata.ratio,
        algorithm: result.metadata.algorithm,
        latency: result.metadata.latency,
        savings: ((1 - result.metadata.compressedSize / result.metadata.originalSize) * 100).toFixed(2) + '%'
      },
      compressed: result.compressed
    });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

// Made with Moe Abdelaziz
