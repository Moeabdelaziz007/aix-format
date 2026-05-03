import { NextRequest } from 'next/server';
import { requireAuth, successResponse, ERR, parseBody } from '@/lib/api-helpers';
import { getPiNetworkClient } from '@/lib/pi-network';
import { kv, KEYS } from '@/lib/redis';

/**
 * POST /api/pi/import-config
 * 
 * Imports Pi Network app configuration from Pi Developer Portal.
 * 
 * Features:
 * - Accepts Pi app credentials (appId, apiKey)
 * - Fetches configuration from Pi Developer Portal API
 * - Auto-populates pi_network section in agent configuration
 * - Returns structured Pi app metadata including scopes and network details
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
      appId: string;
      apiKey: string;
      agentId?: string;
      environment?: 'sandbox' | 'production';
    }>(req);
    
    if (parseError) return parseError;

    if (!body) {
      return ERR.VALIDATION('Request body is required');
    }

    const { appId, apiKey, agentId, environment = 'sandbox' } = body;

    // 3. Validate required fields
    if (!appId || !apiKey) {
      return ERR.VALIDATION('appId and apiKey are required');
    }

    // 4. Initialize Pi Network client
    const piClient = getPiNetworkClient({
      apiKey,
      environment,
    });

    // 5. Fetch configuration from Pi Developer Portal
    let piConfig;
    try {
      piConfig = await piClient.importConfig(appId);
    } catch (error: unknown) {
      console.error('[pi/import-config] Failed to fetch Pi config:', error);
      return ERR.NOT_CONFIGURED('Failed to fetch Pi app configuration: ' + error.message);
    }

    // 6. Structure Pi Network configuration for agent
    const piNetworkConfig = {
      enabled: true,
      app_id: piConfig.appId,
      app_name: piConfig.appName,
      scopes: piConfig.scopes,
      network_type: piConfig.networkType,
      environment,
      webhook_url: piConfig.webhookUrl,
      redirect_url: piConfig.redirectUrl,
      payment_enabled: piConfig.scopes.includes('payments'),
      kyc_required: piConfig.scopes.includes('username') || piConfig.scopes.includes('payments'),
      imported_at: new Date().toISOString(),
    };

    // 7. If agentId provided, update agent configuration
    if (agentId) {
      const agent = await kv.get<any>(KEYS.registry(agentId));
      
      if (!agent) {
        return ERR.NOT_FOUND('Agent not found');
      }

      // Verify ownership
      if (agent.identity_layer?.owner !== session.user.id) {
        return ERR.FORBIDDEN('You do not own this agent');
      }

      // Update agent with Pi Network configuration
      agent.pi_network = piNetworkConfig;
      agent.meta = agent.meta || {};
      agent.meta.updated_at = new Date().toISOString();

      // Save updated agent
      await kv.set(KEYS.registry(agentId), agent);
    }

    // 8. Store Pi credentials securely for user
    const piCredsKey = `pi:credentials:${session.user.id}:${appId}`;
    await kv.set(
      piCredsKey,
      {
        appId,
        apiKey, // In production, encrypt this
        environment,
        importedAt: new Date().toISOString(),
      },
      { ex: 2592000 } // 30 days TTL
    );

    // 9. Return configuration
    return successResponse({
      config: piNetworkConfig,
      metadata: {
        appId: piConfig.appId,
        appName: piConfig.appName,
        scopes: piConfig.scopes,
        networkType: piConfig.networkType,
        environment,
        features: {
          payments: piConfig.scopes.includes('payments'),
          kyc: piConfig.scopes.includes('username'),
          wallet: piConfig.scopes.includes('wallet_address'),
        },
      },
      agentUpdated: !!agentId,
    });

  } catch (error: unknown) {
    console.error('[pi/import-config] Import failed:', error);
    return ERR.INTERNAL('Failed to import Pi configuration: ' + error.message);
  }
}

// Made with Moe Abdelaziz