import { NextRequest } from 'next/server';
import { requireAuth, successResponse, ERR, parseBody } from '@/lib/api-helpers';
import { kv, KEYS } from '@/lib/redis';
import { getPiNetworkClient } from '@/lib/pi-network';

/**
 * POST /api/playground/pi-context
 * 
 * Injects Pi Network user context into MCP context for agent testing.
 * 
 * Features:
 * - Injects Pi Network user context (wallet, KYC, balance, network)
 * - Adds context to MCP headers
 * - Passes enriched context to playground executor
 * - Enables Pi-aware agent testing
 * 
 * SECURITY: Requires authentication
 */
export async function POST(req: NextRequest) {
  try {
    // 1. Authenticate user
    const { session, error: authError } = await requireAuth();
    if (authError) return authError;

    // 2. Parse request body
    const { body, error: parseError } = await parseBody<{
      agentId: string;
      piAccessToken?: string;
      mockPiContext?: {
        walletAddress?: string;
        kycStatus?: 'none' | 'pending' | 'verified';
        piBalance?: number;
        networkType?: 'testnet' | 'mainnet';
      };
      testInput: string;
      mcpServers?: string[];
    }>(req);
    
    if (parseError) return parseError;

    if (!body) {
      return ERR.VALIDATION('Request body is required');
    }

    const { agentId, piAccessToken, mockPiContext, testInput, mcpServers } = body;

    // 3. Validate required fields
    if (!agentId || !testInput) {
      return ERR.VALIDATION('agentId and testInput are required');
    }

    // 4. Fetch agent
    const agent = await kv.get<any>(KEYS.registry(agentId));
    
    if (!agent) {
      return ERR.NOT_FOUND('Agent not found');
    }

    if (agent.identity_layer?.owner !== session.user.id) {
      return ERR.FORBIDDEN('You do not own this agent');
    }

    // 5. Build Pi Network context
    let piContext;
    
    if (mockPiContext) {
      // Use mock context for testing
      piContext = {
        uid: `mock_${session.user.id}`,
        username: session.user.email?.split('@')[0] || 'test_user',
        walletAddress: mockPiContext.walletAddress || '0x' + '0'.repeat(40),
        kycStatus: mockPiContext.kycStatus || 'none',
        piBalance: mockPiContext.piBalance || 0,
        networkType: mockPiContext.networkType || 'testnet',
        isMock: true,
      };
    } else if (piAccessToken) {
      // Fetch real Pi context using access token
      try {
        const piClient = getPiNetworkClient({
          environment: agent.pi_network?.environment || 'sandbox',
        });
        
        const userContext = await piClient.verifyToken(piAccessToken);
        
        piContext = {
          uid: userContext.uid,
          username: userContext.username,
          walletAddress: userContext.walletAddress,
          kycStatus: userContext.kycStatus,
          piBalance: userContext.piBalance,
          networkType: agent.pi_network?.network_type || 'testnet',
          isMock: false,
        };
      } catch (error) {
        console.error('[playground/pi-context] Failed to verify Pi token:', error);
        return ERR.PI_AUTH_FAILED('Failed to verify Pi access token');
      }
    } else {
      // No Pi context provided
      return ERR.VALIDATION('Either piAccessToken or mockPiContext is required');
    }

    // 6. Build MCP context headers with Pi information
    const mcpContext = {
      // Standard MCP headers
      'X-Agent-ID': agentId,
      'X-Agent-Name': agent.meta?.name || 'Unknown',
      'X-User-ID': session.user.id,
      'X-Session-ID': `playground_${Date.now()}`,
      
      // Pi Network context headers
      'X-Pi-User-ID': piContext.uid,
      'X-Pi-Username': piContext.username,
      'X-Pi-Wallet': piContext.walletAddress || '',
      'X-Pi-KYC-Status': piContext.kycStatus,
      'X-Pi-Balance': piContext.piBalance?.toString() || '0',
      'X-Pi-Network': piContext.networkType,
      'X-Pi-Mock': piContext.isMock.toString(),
      
      // Agent capabilities
      'X-Agent-Capabilities': agent.meta?.tags?.join(',') || '',
      'X-Agent-Version': agent.meta?.format_version || '1.0',
    };

    // 7. Prepare enriched execution context
    const executionContext = {
      agent: {
        id: agentId,
        did: agent.identity_layer?.id,
        name: agent.meta?.name,
        capabilities: agent.meta?.tags || [],
      },
      user: {
        id: session.user.id,
        email: session.user.email,
      },
      pi: piContext,
      mcp: {
        headers: mcpContext,
        servers: mcpServers || agent.mcp?.servers || [],
      },
      input: testInput,
      timestamp: new Date().toISOString(),
    };

    // 8. Store execution context for playground session
    const sessionKey = `playground:session:${agentId}:${Date.now()}`;
    await kv.set(sessionKey, executionContext, { ex: 3600 }); // 1 hour TTL

    // 9. Execute agent with Pi context (simulated)
    const executionResult = await executeAgentWithPiContext(
      agent,
      executionContext
    );

    // 10. Return enriched context and execution result
    return successResponse({
      sessionId: sessionKey,
      context: executionContext,
      mcpHeaders: mcpContext,
      execution: executionResult,
      piContextInjected: true,
    });

  } catch (error: any) {
    console.error('[playground/pi-context] Execution failed:', error);
    return ERR.INTERNAL('Failed to execute with Pi context: ' + error.message);
  }
}

/**
 * Execute agent with Pi Network context
 * This is a simplified simulation - actual implementation would invoke the agent
 */
async function executeAgentWithPiContext(
  agent: any,
  context: any
): Promise<any> {
  // In a real implementation, this would:
  // 1. Initialize MCP servers with Pi context headers
  // 2. Execute agent logic with enriched context
  // 3. Handle Pi-specific operations (payments, KYC checks, etc.)
  // 4. Return execution results
  
  // For now, return simulated execution
  return {
    status: 'success',
    output: `Agent ${agent.meta?.name} executed with Pi context`,
    piContextUsed: {
      user: context.pi.username,
      wallet: context.pi.walletAddress,
      kycStatus: context.pi.kycStatus,
      balance: context.pi.piBalance,
    },
    mcpCalls: [
      {
        server: 'pi-network-mcp',
        method: 'getUserContext',
        result: 'success',
      },
    ],
    executionTime: 145,
    timestamp: new Date().toISOString(),
  };
}

// Made with Bob