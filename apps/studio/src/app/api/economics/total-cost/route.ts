import { NextRequest, NextResponse } from 'next/server';

interface CostRequest {
  apiCalls: number;
  tokensPerCall: number;
  latencyMs: number;
  qualityScore: number;
  compressionRatio: number;
  reuseRate: number;
}

export async function POST(req: NextRequest) {
  try {
    const body: CostRequest = await req.json();
    const {
      apiCalls,
      tokensPerCall,
      latencyMs,
      qualityScore,
      compressionRatio,
      reuseRate
    } = body;

    const costPerToken = 0.00002;
    const uxCostPerMs = 0.0001;
    const failureProbability = 1 - qualityScore;
    const failureCost = 5.0;
    const compressionOverhead = 0.5;
    const reuseSavings = reuseRate * apiCalls * tokensPerCall * costPerToken * 0.8;

    const apiCost = apiCalls * tokensPerCall * costPerToken;
    const latencyCost = (latencyMs / 1000) * uxCostPerMs * apiCalls;
    const qualityDegradationCost = failureProbability * failureCost * apiCalls;
    const compressionCost = compressionOverhead;

    const totalCost = apiCost + latencyCost + qualityDegradationCost + compressionCost - reuseSavings;

    const withoutCompression = {
      apiCost: apiCalls * tokensPerCall * costPerToken * compressionRatio,
      latencyCost: latencyCost * 1.5,
      qualityDegradationCost: qualityDegradationCost * 1.2,
      compressionCost: 0,
      reuseSavings: 0,
      total: 0
    };
    withoutCompression.total = 
      withoutCompression.apiCost + 
      withoutCompression.latencyCost + 
      withoutCompression.qualityDegradationCost;

    const savings = withoutCompression.total - totalCost;
    const savingsPercentage = (savings / withoutCompression.total) * 100;

    return NextResponse.json({
      success: true,
      economics: {
        withCompression: {
          apiCost: parseFloat(apiCost.toFixed(4)),
          latencyCost: parseFloat(latencyCost.toFixed(4)),
          qualityDegradationCost: parseFloat(qualityDegradationCost.toFixed(4)),
          compressionCost: parseFloat(compressionCost.toFixed(4)),
          reuseSavings: parseFloat(reuseSavings.toFixed(4)),
          total: parseFloat(totalCost.toFixed(4))
        },
        withoutCompression: {
          apiCost: parseFloat(withoutCompression.apiCost.toFixed(4)),
          latencyCost: parseFloat(withoutCompression.latencyCost.toFixed(4)),
          qualityDegradationCost: parseFloat(withoutCompression.qualityDegradationCost.toFixed(4)),
          compressionCost: 0,
          reuseSavings: 0,
          total: parseFloat(withoutCompression.total.toFixed(4))
        },
        savings: parseFloat(savings.toFixed(4)),
        savingsPercentage: parseFloat(savingsPercentage.toFixed(2)),
        roi: parseFloat((savings / compressionCost).toFixed(2))
      }
    });
  } catch (error: unknown) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Made with Moe Abdelaziz
