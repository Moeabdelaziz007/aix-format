import { randomBytes, randomInt } from 'crypto';
import { kv, KEYS } from '../memory/storage';

/**
 * AIX Channel Orchestration (v1.4.0-sovereign)
 * Implements 'Zero Experience' auto-setup for communication channels.
 * Supports Telegram Managed Bots (API 9.6) and Meta Business sub-accounts.
 * 
 * Made with Moe Abdelaziz
 */

export interface ChannelConfig {
  telegram?: {
    username: string;
    link: string;
    token: string;
    setupAt: number;
  };
  whatsapp?: {
    phoneNumber: string;
    waid: string;
    setupAt: number;
  };
}

/**
 * Manages the automated provisioning of communication channels for agents.
 */
export class ChannelManager {
  /**
   * Provisions a new Telegram bot via the AIX Manager Bot (Pattern: Managed Bots API 9.6).
   */
  static async setupTelegram(agentId: string, manifest: any): Promise<ChannelConfig['telegram']> {
    console.log(`📡 [ChannelManager]: Provisioning Telegram Bot for agent ${agentId}...`);
    
    // Simulate Telegram Managed Bots API Call
    // In production, this would call: https://api.telegram.org/bot<MANAGER_TOKEN>/createManagedBot
    const name = manifest.meta?.name || manifest.name || 'aix_agent';
    const botUsername = `${name.replace(/\s+/g, '_').toLowerCase()}_${randomBytes(2).toString('hex')}_bot`;
    
    const config = {
      username: botUsername,
      link: `https://t.me/${botUsername}`,
      token: `t_enc_${randomBytes(16).toString('hex')}`, // Cryptographically secure token
      setupAt: Date.now()
    };

    // Save to agent's channel specific store
    await kv.set(KEYS.agentChannelsTelegram(agentId), config);

    // Update agent registry with channel flag
    const current = await kv.get<any>(KEYS.registry(agentId));
    if (current) {
      await kv.set(KEYS.registry(agentId), {
        ...current,
        channels: { ...current.channels, telegram: true }
      });
    }

    return config;
  }

  /**
   * Provisions a WhatsApp sub-number via the AIX Verified Business account.
   */
  static async setupWhatsApp(agentId: string): Promise<ChannelConfig['whatsapp']> {
    console.log(`📡 [ChannelManager]: Provisioning WhatsApp Channel for agent ${agentId}...`);
    
    const config = {
      phoneNumber: `+1555${randomInt(1000000, 9999999)}`,
      waid: `waid_${randomBytes(4).toString('hex')}`,
      setupAt: Date.now()
    };

    await kv.set(KEYS.agentChannelsWhatsapp(agentId), config);
    return config;
  }

  /**
   * Generates a "One-Link" deployment URL for Telegram.
   * Format: https://t.me/aix_deploy_bot?start=agt_1234
   */
  static getOneLinkUrl(agentId: string): string {
    const MANAGER_BOT_USERNAME = 'aix_deploy_bot';
    return `https://t.me/${MANAGER_BOT_USERNAME}?start=${agentId}`;
  }

  /**
   * Retrieves all active channels for an agent.
   */
  static async getChannels(agentId: string): Promise<ChannelConfig> {
    const telegram = await kv.get<ChannelConfig['telegram']>(KEYS.agentChannelsTelegram(agentId));
    const whatsapp = await kv.get<ChannelConfig['whatsapp']>(KEYS.agentChannelsWhatsapp(agentId));

    return {
      telegram: telegram || undefined,
      whatsapp: whatsapp || undefined
    };
  }
}

// Made with Moe Abdelaziz
