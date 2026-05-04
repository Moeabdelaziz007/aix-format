/**
 * AIX Channel Orchestration (v1.3.4)
 * Implements 'Zero Experience' auto-setup for communication channels.
 * Supports Telegram Managed Bots (API 9.6) and Meta Business sub-accounts.
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
export declare class ChannelManager {
    /**
     * Provisions a new Telegram bot via the AIX Manager Bot (Pattern: Managed Bots API 9.6).
     */
    static setupTelegram(agentId: string, manifest: any): Promise<ChannelConfig['telegram']>;
    /**
     * Provisions a WhatsApp sub-number via the AIX Verified Business account.
     */
    static setupWhatsApp(agentId: string): Promise<ChannelConfig['whatsapp']>;
    /**
     * Generates a "One-Link" deployment URL for Telegram.
     * Format: https://t.me/aix_deploy_bot?start=agt_1234
     */
    static getOneLinkUrl(agentId: string): string;
    /**
     * Retrieves all active channels for an agent.
     */
    static getChannels(agentId: string): Promise<ChannelConfig>;
}
