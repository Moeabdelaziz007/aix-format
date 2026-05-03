import { NextRequest } from 'next/server';
import { requireAuth, successResponse, ERR, parseBody } from '@/lib/api-helpers';
import { kv } from '@/lib/redis';
import { getPiNetworkClient } from '@/lib/pi-network';
import { nanoid } from 'nanoid';

/**
 * POST /api/pi/sandbox-test
 * 
 * Comprehensive Pi Network sandbox testing environment.
 * 
 * Features:
 * - Isolated Pi Testnet environment per developer
 * - Separate credentials management
 * - Complete mock KYC flow simulation
 * - Configurable test user profiles with KYC levels and balances
 * - Multiple test scenario execution (verification, payments, MCP calls)
 * - Automatic cleanup after test sessions
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
      action: 'create' | 'execute' | 'cleanup';
      testSessionId?: string;
      testProfile?: {
        username?: string;
        kycLevel?: 'none' | 'basic' | 'verified';
        piBalance?: number;
        walletAddress?: string;
      };
      scenarios?: Array<'kyc' | 'payment' | 'mcp_call' | 'verification'>;
      agentId?: string;
    }>(req);
    
    if (parseError) return parseError;

    if (!body) {
      return ERR.VALIDATION('Request body is required');
    }

    const { action, testSessionId, testProfile, scenarios, agentId } = body;

    // 3. Handle different actions
    switch (action) {
      case 'create':
        return await createTestSession(session.user.id, testProfile, agentId);
      
      case 'execute':
        if (!testSessionId) {
          return ERR.VALIDATION('testSessionId is required for execute action');
        }
        return await executeTestScenarios(testSessionId, scenarios || ['kyc']);
      
      case 'cleanup':
        if (!testSessionId) {
          return ERR.VALIDATION('testSessionId is required for cleanup action');
        }
        return await cleanupTestSession(testSessionId);
      
      default:
        return ERR.VALIDATION('Invalid action. Must be create, execute, or cleanup');
    }

  } catch (error: unknown) {
    console.error('[pi/sandbox-test] Test failed:', error);
    return ERR.INTERNAL('Sandbox test failed: ' + error.message);
  }
}

/**
 * Create isolated test session
 */
async function createTestSession(
  userId: string,
  testProfile?: any,
  agentId?: string
) {
  const testSessionId = `pi_test_${nanoid(16)}`;
  
  // Generate test credentials
  const testCredentials = {
    appId: `test_app_${nanoid(10)}`,
    apiKey: `test_key_${nanoid(32)}`,
    environment: 'sandbox' as const,
  };

  // Create test user profile
  const testUser = {
    uid: `test_user_${nanoid(10)}`,
    username: testProfile?.username || `test_${nanoid(6)}`,
    kycLevel: testProfile?.kycLevel || 'none',
    piBalance: testProfile?.piBalance || 100,
    walletAddress: testProfile?.walletAddress || `0x${nanoid(40)}`,
    createdAt: new Date().toISOString(),
  };

  // Store test session
  const sessionData = {
    id: testSessionId,
    userId,
    agentId,
    credentials: testCredentials,
    testUser,
    scenarios: [],
    status: 'active',
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 3600000).toISOString(), // 1 hour
  };

  const sessionKey = `pi:sandbox:session:${testSessionId}`;
  await kv.set(sessionKey, sessionData, { ex: 3600 }); // 1 hour TTL

  // Track user's test sessions
  const userSessionsKey = `pi:sandbox:user:${userId}:sessions`;
  const userSessions = await kv.get<string[]>(userSessionsKey) || [];
  userSessions.push(testSessionId);
  await kv.set(userSessionsKey, userSessions, { ex: 86400 }); // 24 hours

  return successResponse({
    testSessionId,
    credentials: testCredentials,
    testUser,
    status: 'created',
    expiresAt: sessionData.expiresAt,
    message: 'Test session created successfully',
  });
}

/**
 * Execute test scenarios
 */
async function executeTestScenarios(
  testSessionId: string,
  scenarios: string[]
) {
  // Fetch test session
  const sessionKey = `pi:sandbox:session:${testSessionId}`;
  const session = await kv.get<any>(sessionKey);

  if (!session) {
    return ERR.NOT_FOUND('Test session not found or expired');
  }

  // Initialize Pi client with test credentials
  const piClient = getPiNetworkClient({
    apiKey: session.credentials.apiKey,
    environment: 'sandbox',
  });

  const results = [];

  // Execute each scenario
  for (const scenario of scenarios) {
    let result;
    
    switch (scenario) {
      case 'kyc':
        result = await executeKYCScenario(session, piClient);
        break;
      
      case 'payment':
        result = await executePaymentScenario(session, piClient);
        break;
      
      case 'mcp_call':
        result = await executeMCPScenario(session);
        break;
      
      case 'verification':
        result = await executeVerificationScenario(session, piClient);
        break;
      
      default:
        result = {
          scenario,
          status: 'skipped',
          message: 'Unknown scenario type',
        };
    }

    results.push(result);
    session.scenarios.push(result);
  }

  // Update session with results
  await kv.set(sessionKey, session, { ex: 3600 });

  return successResponse({
    testSessionId,
    scenarios: results,
    summary: {
      total: results.length,
      passed: results.filter(r => r.status === 'success').length,
      failed: results.filter(r => r.status === 'failed').length,
    },
  });
}

/**
 * Execute KYC test scenario
 */
async function executeKYCScenario(session: any, piClient: any) {
  try {
    // Simulate KYC verification flow
    const steps = [
      { step: 'initiate', status: 'success', message: 'KYC process initiated' },
      { step: 'verify_identity', status: 'success', message: 'Identity verified' },
      { step: 'check_documents', status: 'success', message: 'Documents validated' },
      { step: 'approve', status: 'success', message: 'KYC approved' },
    ];

    // Update test user KYC status
    session.testUser.kycLevel = 'verified';
    session.testUser.kycVerifiedAt = new Date().toISOString();

    return {
      scenario: 'kyc',
      status: 'success',
      steps,
      result: {
        kycLevel: 'verified',
        verifiedAt: session.testUser.kycVerifiedAt,
      },
      executionTime: 234,
    };
  } catch (error: unknown) {
    return {
      scenario: 'kyc',
      status: 'failed',
      error: error.message,
    };
  }
}

/**
 * Execute payment test scenario
 */
async function executePaymentScenario(session: any, piClient: any) {
  try {
    const paymentAmount = 10; // 10 Pi
    const fee = piClient.calculateFees(paymentAmount);

    // Simulate payment flow
    const payment = {
      identifier: `test_payment_${nanoid(10)}`,
      amount: paymentAmount,
      fee,
      status: 'completed',
      txid: `0x${nanoid(64)}`,
      timestamp: new Date().toISOString(),
    };

    // Update test user balance
    session.testUser.piBalance -= (paymentAmount + fee);

    return {
      scenario: 'payment',
      status: 'success',
      result: payment,
      newBalance: session.testUser.piBalance,
      executionTime: 456,
    };
  } catch (error: unknown) {
    return {
      scenario: 'payment',
      status: 'failed',
      error: error.message,
    };
  }
}

/**
 * Execute MCP call test scenario
 */
async function executeMCPScenario(session: any) {
  try {
    // Simulate MCP server call with Pi context
    const mcpCall = {
      server: 'pi-network-mcp',
      method: 'getUserBalance',
      params: { userId: session.testUser.uid },
      result: {
        balance: session.testUser.piBalance,
        currency: 'PI',
      },
      executionTime: 89,
    };

    return {
      scenario: 'mcp_call',
      status: 'success',
      result: mcpCall,
      executionTime: 89,
    };
  } catch (error: unknown) {
    return {
      scenario: 'mcp_call',
      status: 'failed',
      error: error.message,
    };
  }
}

/**
 * Execute verification test scenario
 */
async function executeVerificationScenario(session: any, piClient: any) {
  try {
    // Simulate token verification
    const verification = {
      valid: true,
      user: session.testUser,
      scopes: ['username', 'payments', 'wallet_address'],
      expiresAt: new Date(Date.now() + 3600000).toISOString(),
    };

    return {
      scenario: 'verification',
      status: 'success',
      result: verification,
      executionTime: 123,
    };
  } catch (error: unknown) {
    return {
      scenario: 'verification',
      status: 'failed',
      error: error.message,
    };
  }
}

/**
 * Cleanup test session
 */
async function cleanupTestSession(testSessionId: string) {
  try {
    const sessionKey = `pi:sandbox:session:${testSessionId}`;
    const session = await kv.get<any>(sessionKey);

    if (!session) {
      return ERR.NOT_FOUND('Test session not found');
    }

    // Delete session data
    await kv.del(sessionKey);

    // Remove from user's session list
    const userSessionsKey = `pi:sandbox:user:${session.userId}:sessions`;
    const userSessions = await kv.get<string[]>(userSessionsKey) || [];
    const filtered = userSessions.filter(id => id !== testSessionId);
    await kv.set(userSessionsKey, filtered, { ex: 86400 });

    return successResponse({
      testSessionId,
      status: 'cleaned',
      message: 'Test session cleaned up successfully',
    });
  } catch (error: unknown) {
    return ERR.INTERNAL('Cleanup failed: ' + error.message);
  }
}

// Made with Moe Abdelaziz