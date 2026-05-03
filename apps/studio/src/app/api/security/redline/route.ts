import { NextRequest, NextResponse } from 'next/server';

const PII_PATTERNS = [
  /\b\d{3}-\d{2}-\d{4}\b/g,
  /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi,
  /\b\d{16}\b/g,
  /\b(?:\+?1[-.]?)?\(?([0-9]{3})\)?[-.]?([0-9]{3})[-.]?([0-9]{4})\b/g,
  /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g
];

const PII_LABELS = [
  'SSN',
  'Email',
  'Credit Card',
  'Phone Number',
  'IP Address'
];

interface RedlineRequest {
  content: string;
  agentId: string;
  taskType: string;
  compressionRequested: boolean;
}

export async function POST(req: NextRequest) {
  try {
    const body: RedlineRequest = await req.json();
    const { content, agentId, taskType, compressionRequested } = body;

    if (!content) {
      return NextResponse.json({ error: 'content required' }, { status: 400 });
    }

    const detectedPII = detectPII(content);
    const shouldVeto = detectedPII.length > 0 && compressionRequested;

    const redactedContent = redactPII(content);
    
    const auditEntry = {
      timestamp: new Date().toISOString(),
      agentId,
      taskType,
      piiDetected: detectedPII,
      compressionVetoed: shouldVeto,
      redactionApplied: detectedPII.length > 0
    };

    return NextResponse.json({
      success: true,
      security: {
        piiDetected: detectedPII.length > 0,
        piiTypes: detectedPII,
        compressionAllowed: !shouldVeto,
        vetoReason: shouldVeto ? 'PII detected in content' : null,
        redactedContent: detectedPII.length > 0 ? redactedContent : content
      },
      audit: auditEntry,
      recommendation: getSecurityRecommendation(detectedPII, compressionRequested)
    });
  } catch (error: unknown) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

function detectPII(content: string): string[] {
  const detected: string[] = [];
  
  PII_PATTERNS.forEach((pattern, index) => {
    if (pattern.test(content)) {
      detected.push(PII_LABELS[index]);
    }
  });
  
  return detected;
}

function redactPII(content: string): string {
  let redacted = content;
  
  PII_PATTERNS.forEach((pattern) => {
    redacted = redacted.replace(pattern, '[REDACTED]');
  });
  
  return redacted;
}

function getSecurityRecommendation(piiTypes: string[], compressionRequested: boolean): string {
  if (piiTypes.length === 0) {
    return 'No PII detected. Safe to proceed with compression.';
  }
  
  if (compressionRequested) {
    return `PII detected (${piiTypes.join(', ')}). Compression vetoed. Use redacted content or remove PII.`;
  }
  
  return `PII detected (${piiTypes.join(', ')}). Consider redaction before processing.`;
}

// Made with Moe Abdelaziz
