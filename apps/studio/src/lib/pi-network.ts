/**
 * Pi Network Integration Client
 * 
 * Provides unified interface for Pi Network operations including:
 * - Developer Portal API communication
 * - Testnet/Mainnet environment switching
 * - Authentication token management
 * - KYC verification integration
 * - Payment processing
 * - Configuration import
 */

import { requireEnv } from './api-helpers';

export type PiEnvironment = 'sandbox' | 'production';

export interface PiAppConfig {
  appId: string;
  apiKey: string;
  environment: PiEnvironment;
  scopes: string[];
  networkType: 'testnet' | 'mainnet';
}

export interface PiUserContext {
  uid: string;
  username: string;
  walletAddress?: string;
  kycStatus: 'none' | 'pending' | 'verified';
  piBalance?: number;
}

export interface PiPaymentRequest {
  amount: number;
  memo: string;
  metadata: Record<string, any>;
}

export interface PiPaymentResponse {
  identifier: string;
  status: 'pending' | 'completed' | 'cancelled';
  txid?: string;
  amount: number;
  timestamp: string;
}

export interface PiKYCVerification {
  userId: string;
  status: 'none' | 'pending' | 'verified';
  level: number;
  verifiedAt?: string;
}

export interface PiConfigImport {
  appId: string;
  appName: string;
  scopes: string[];
  networkType: 'testnet' | 'mainnet';
  webhookUrl?: string;
  redirectUrl?: string;
}

/**
 * Pi Network Client
 * Handles all Pi Network API interactions
 */
export class PiNetworkClient {
  private apiKey: string;
  private environment: PiEnvironment;
  private baseUrl: string;

  constructor(config?: Partial<PiAppConfig>) {
    this.environment = config?.environment || 'sandbox';
    this.apiKey = config?.apiKey || requireEnv('PI_API_KEY') || '';
    this.baseUrl = this.environment === 'sandbox' 
      ? 'https://api.minepi.com/v2/sandbox'
      : 'https://api.minepi.com/v2';
  }

  /**
   * Switch between testnet and mainnet environments
   */
  switchEnvironment(env: PiEnvironment): void {
    this.environment = env;
    this.baseUrl = env === 'sandbox'
      ? 'https://api.minepi.com/v2/sandbox'
      : 'https://api.minepi.com/v2';
  }

  /**
   * Get current environment
   */
  getEnvironment(): PiEnvironment {
    return this.environment;
  }

  /**
   * Fetch app configuration from Pi Developer Portal
   */
  async importConfig(appId: string): Promise<PiConfigImport> {
    try {
      const response = await fetch(`${this.baseUrl}/apps/${appId}`, {
        headers: {
          'Authorization': `Key ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Pi API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      return {
        appId: data.app_id,
        appName: data.app_name,
        scopes: data.scopes || [],
        networkType: this.environment === 'sandbox' ? 'testnet' : 'mainnet',
        webhookUrl: data.webhook_url,
        redirectUrl: data.redirect_url,
      };
    } catch (error) {
      console.error('[PiNetworkClient] Config import failed:', error);
      throw new Error('Failed to import Pi app configuration');
    }
  }

  /**
   * Verify user authentication token
   */
  async verifyToken(accessToken: string): Promise<PiUserContext> {
    try {
      const response = await fetch(`${this.baseUrl}/me`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Pi auth verification failed: ${response.status}`);
      }

      const data = await response.json();
      
      return {
        uid: data.uid,
        username: data.username,
        walletAddress: data.wallet_address,
        kycStatus: this.mapKYCStatus(data.kyc_status),
        piBalance: data.pi_balance,
      };
    } catch (error) {
      console.error('[PiNetworkClient] Token verification failed:', error);
      throw new Error('Failed to verify Pi authentication token');
    }
  }

  /**
   * Get KYC verification status for a user
   */
  async getKYCStatus(userId: string, accessToken: string): Promise<PiKYCVerification> {
    try {
      const response = await fetch(`${this.baseUrl}/kyc/${userId}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`KYC status fetch failed: ${response.status}`);
      }

      const data = await response.json();
      
      return {
        userId,
        status: this.mapKYCStatus(data.status),
        level: data.level || 0,
        verifiedAt: data.verified_at,
      };
    } catch (error) {
      console.error('[PiNetworkClient] KYC status fetch failed:', error);
      return {
        userId,
        status: 'none',
        level: 0,
      };
    }
  }

  /**
   * Create a payment request
   */
  async createPayment(
    accessToken: string,
    payment: PiPaymentRequest
  ): Promise<PiPaymentResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/payments`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: payment.amount,
          memo: payment.memo,
          metadata: payment.metadata,
        }),
      });

      if (!response.ok) {
        throw new Error(`Payment creation failed: ${response.status}`);
      }

      const data = await response.json();
      
      return {
        identifier: data.identifier,
        status: data.status,
        txid: data.transaction?.txid,
        amount: data.amount,
        timestamp: data.created_at,
      };
    } catch (error) {
      console.error('[PiNetworkClient] Payment creation failed:', error);
      throw new Error('Failed to create Pi payment');
    }
  }

  /**
   * Get payment status
   */
  async getPaymentStatus(
    paymentId: string,
    accessToken: string
  ): Promise<PiPaymentResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/payments/${paymentId}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Payment status fetch failed: ${response.status}`);
      }

      const data = await response.json();
      
      return {
        identifier: data.identifier,
        status: data.status,
        txid: data.transaction?.txid,
        amount: data.amount,
        timestamp: data.created_at,
      };
    } catch (error) {
      console.error('[PiNetworkClient] Payment status fetch failed:', error);
      throw new Error('Failed to fetch payment status');
    }
  }

  /**
   * Complete a payment (approve transaction)
   */
  async completePayment(
    paymentId: string,
    txid: string,
    accessToken: string
  ): Promise<PiPaymentResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/payments/${paymentId}/complete`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ txid }),
      });

      if (!response.ok) {
        throw new Error(`Payment completion failed: ${response.status}`);
      }

      const data = await response.json();
      
      return {
        identifier: data.identifier,
        status: data.status,
        txid: data.transaction?.txid,
        amount: data.amount,
        timestamp: data.created_at,
      };
    } catch (error) {
      console.error('[PiNetworkClient] Payment completion failed:', error);
      throw new Error('Failed to complete Pi payment');
    }
  }

  /**
   * Calculate Pi Network fees (0.01π minimum)
   */
  calculateFees(amount: number): number {
    const feePercentage = 0.01; // 1% platform fee
    const calculatedFee = amount * feePercentage;
    const minimumFee = 0.01; // 0.01π minimum
    
    return Math.max(calculatedFee, minimumFee);
  }

  /**
   * Map Pi KYC status to internal format
   */
  private mapKYCStatus(status: string): 'none' | 'pending' | 'verified' {
    switch (status?.toLowerCase()) {
      case 'verified':
      case 'approved':
        return 'verified';
      case 'pending':
      case 'in_progress':
        return 'pending';
      default:
        return 'none';
    }
  }

  /**
   * Health check for Pi Network API
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/health`, {
        headers: {
          'Authorization': `Key ${this.apiKey}`,
        },
      });
      return response.ok;
    } catch {
      return false;
    }
  }
}

/**
 * Singleton instance for default configuration
 */
let defaultClient: PiNetworkClient | null = null;

export function getPiNetworkClient(config?: Partial<PiAppConfig>): PiNetworkClient {
  if (!config && defaultClient) {
    return defaultClient;
  }
  
  const client = new PiNetworkClient(config);
  
  if (!config) {
    defaultClient = client;
  }
  
  return client;
}

// Made with Moe Abdelaziz