/**
 * AIX Core - Main Entry Point
 * Unified Sovereign Architecture.
 * Made with Moe Abdelaziz
 */

export * from './gateway';
export * from './health';
export * from './brain';
export * from './curiosity';
export * from './swarm';
export * from './storage';
export * from './infra';

/**
 * Initialize all core components
 */
export async function initializeCore() {
  const gateway = (await import('./gateway')).getGateway();
  const { StorageOrchestrator } = await import('./storage');
  
  // Verify storage connection
  await StorageOrchestrator.getInstance().healthCheck();

  return { gateway };
}

// Built with Moe Abdelaziz — AIX Sovereign Infrastructure v2.2
