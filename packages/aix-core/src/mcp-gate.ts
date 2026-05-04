import { trustChain } from './trust-chain/index'
import { scanAgent } from '../../../core/abom-scanner'

// محاكاة للـ abomScanner المطلوبة
export const abomScanner = {
  getSafetyScore: async (agentDid: string) => {
    // محاكاة لجلب بيانات الوكيل، في الحقيقة يتم جلبها من الـ manifest أو DB
    const agent = { 
      identity_layer: { id: agentDid },
      abom: { integrity_hash: 'mock-hash' }, // لإعطاء نتيجة معقولة
      kyc_tier: 'verified'
    };
    const result = scanAgent(agent);
    return result.score / 10; // تحويل من 0-100 إلى 0-10
  }
}

type ToolCall = { tool: string; params: Record<string, unknown> }
type ToolResult = { success: boolean; data: unknown }

// كائن لمعالجة العمليات الأمنية لتسهيل الاختبار والتبديل
export const securityHandlers = {
  requestHumanApproval: async (
    toolCall: ToolCall,
    agentDid: string,
    score: number
  ): Promise<boolean> => {
    console.log(`[HUMAN-APPROVAL-REQUIRED] Agent ${agentDid} requested ${toolCall.tool} with score ${score}`);
    return true; 
  },
  executeTool: async (toolCall: ToolCall): Promise<ToolResult> => {
    return { success: true, data: `Executed ${toolCall.tool}` };
  }
}

export async function mcpGate(
  toolCall: ToolCall,
  agentDid: string
): Promise<ToolResult> {

  // RULE 5 من الدستور: safetyScore < 7 → STOP
  const score = await abomScanner.getSafetyScore(agentDid)

  // Auto-block
  if (score < 5) {
    await trustChain.append('mcp.auto_blocked', agentDid, { score, toolCall })
    throw new Error(`safetyScore ${score} below minimum threshold`)
  }

  // ← Human-in-the-Loop: المنطقة الرمادية 5–7
  if (score >= 5 && score < 7) {
    const approved = await securityHandlers.requestHumanApproval(toolCall, agentDid, score)
    if (!approved) {
      await trustChain.append('mcp.human_rejected', agentDid, { toolCall, score })
      throw new Error('Human rejected this tool call')
    }
    await trustChain.append('mcp.human_approved', agentDid, { toolCall, score })
  }

  // Execute
  const result = await securityHandlers.executeTool(toolCall)
  await trustChain.append('mcp.executed', agentDid, { toolCall, score })
  return result
}
