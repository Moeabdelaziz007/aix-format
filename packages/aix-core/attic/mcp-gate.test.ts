import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mcpGate, abomScanner, securityHandlers } from './mcp-gate'
import { trustChain } from './trust-chain/index'

describe('MCP Gate', () => {
  const agentDid = 'did:aix:test-agent'
  const toolCall = { tool: 'shell', params: { cmd: 'rm -rf /' } }

  beforeEach(async () => {
    await trustChain.clear()
    vi.restoreAllMocks()
  })

  it('should auto-block if score < 5', async () => {
    vi.spyOn(abomScanner, 'getSafetyScore').mockResolvedValue(4)

    await expect(mcpGate(toolCall, agentDid)).rejects.toThrow('below minimum threshold')

    const lastEntry = trustChain.getChain().at(-1)
    expect(lastEntry?.action).toBe('mcp.auto_blocked')
    expect(lastEntry?.agentId).toBe(agentDid)
  })

  it('should throw if score 5-7 and human rejects', async () => {
    vi.spyOn(abomScanner, 'getSafetyScore').mockResolvedValue(6)
    vi.spyOn(securityHandlers, 'requestHumanApproval').mockResolvedValue(false)

    await expect(mcpGate(toolCall, agentDid)).rejects.toThrow('Human rejected this tool call')

    const lastEntry = trustChain.getChain().at(-1)
    expect(lastEntry?.action).toBe('mcp.human_rejected')
  })

  it('should succeed if score 5-7 and human approves', async () => {
    vi.spyOn(abomScanner, 'getSafetyScore').mockResolvedValue(6)
    vi.spyOn(securityHandlers, 'requestHumanApproval').mockResolvedValue(true)

    const result = await mcpGate(toolCall, agentDid)
    expect(result.success).toBe(true)

    const lastEntry = trustChain.getChain().at(-1)
    expect(lastEntry?.action).toBe('mcp.executed')
  })

  it('should succeed immediately if score >= 7', async () => {
    vi.spyOn(abomScanner, 'getSafetyScore').mockResolvedValue(8)
    const approvalSpy = vi.spyOn(securityHandlers, 'requestHumanApproval')

    const result = await mcpGate(toolCall, agentDid)
    expect(result.success).toBe(true)
    expect(approvalSpy).not.toHaveBeenCalled()

    const lastEntry = trustChain.getChain().at(-1)
    expect(lastEntry?.action).toBe('mcp.executed')
  })
})
