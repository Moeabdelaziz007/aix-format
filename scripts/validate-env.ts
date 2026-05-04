#!/usr/bin/env node
/**
 * Environment Variable Validation Script
 * Run this to validate your .env configuration
 * 
 * Usage:
 *   npm run validate-env
 *   node scripts/validate-env.ts
 */

import { validateEnv, env } from '../apps/studio/src/lib/env';

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
};

function log(message: string, color: string = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function header(title: string) {
  console.log('\n' + '='.repeat(60));
  log(title, colors.bold + colors.cyan);
  console.log('='.repeat(60));
}

function checkmark() {
  return `${colors.green}✓${colors.reset}`;
}

function crossmark() {
  return `${colors.red}✗${colors.reset}`;
}

function warning() {
  return `${colors.yellow}⚠${colors.reset}`;
}

async function main() {
  header('🔧 AIX Environment Validation');
  
  log(`\nEnvironment: ${colors.bold}${env.NODE_ENV}${colors.reset}`);
  log(`App URL: ${colors.bold}${env.NEXT_PUBLIC_APP_URL}${colors.reset}`);
  log(`Studio Version: ${colors.bold}${env.NEXT_PUBLIC_STUDIO_VERSION}${colors.reset}\n`);

  // Run validation
  const validation = validateEnv();

  // Critical Variables
  header('🔴 Critical Variables');
  
  const criticalVars = [
    { key: 'UPSTASH_REDIS_REST_URL', value: env.UPSTASH_REDIS_REST_URL, required: env.NODE_ENV === 'production' },
    { key: 'UPSTASH_REDIS_REST_TOKEN', value: env.UPSTASH_REDIS_REST_TOKEN, required: env.NODE_ENV === 'production' },
    { key: 'AIX_UID_HASH_SALT', value: env.AIX_UID_HASH_SALT, required: false },
    { key: 'JWT_SECRET', value: env.JWT_SECRET, required: false },
  ];

  criticalVars.forEach(({ key, value, required }) => {
    const isSet = value && value !== '';
    const isDefault = value === 'default-secure-salt-change-in-production' || 
                      value === 'dev-jwt-secret-change-in-production';
    
    if (!isSet && required) {
      log(`  ${crossmark()} ${key}: ${colors.red}MISSING (REQUIRED)${colors.reset}`);
    } else if (!isSet) {
      log(`  ${warning()} ${key}: ${colors.yellow}Not set${colors.reset}`);
    } else if (isDefault && env.NODE_ENV === 'production') {
      log(`  ${warning()} ${key}: ${colors.yellow}Using default value (CHANGE IN PRODUCTION!)${colors.reset}`);
    } else {
      log(`  ${checkmark()} ${key}: Set`);
    }
  });

  // Voice Services
  header('🎤 Voice Services');
  
  const voiceVars = [
    { key: 'GROQ_API_KEY', value: env.GROQ_API_KEY, feature: 'Voice transcription (Whisper)' },
    { key: 'GOOGLE_GENERATIVE_AI_API_KEY', value: env.GOOGLE_GENERATIVE_AI_API_KEY, feature: 'Voice wizard (Gemini)' },
    { key: 'XAI_API_KEY', value: env.XAI_API_KEY, feature: 'Voice commands (Grok)' },
  ];

  voiceVars.forEach(({ key, value, feature }) => {
    const isSet = value && value !== '';
    if (isSet) {
      log(`  ${checkmark()} ${key}: Set → ${feature} enabled`);
    } else {
      log(`  ${warning()} ${key}: Not set → ${feature} disabled`);
    }
  });

  // Pi Network
  header('🥧 Pi Network');
  
  const piVars = [
    { key: 'PI_API_KEY', value: env.PI_API_KEY },
    { key: 'PI_APP_ID', value: env.PI_APP_ID },
    { key: 'NEXT_PUBLIC_PI_APP_ID', value: env.NEXT_PUBLIC_PI_APP_ID },
    { key: 'PI_ENVIRONMENT', value: env.PI_ENVIRONMENT },
  ];

  const piEnabled = piVars.every(v => v.value && v.value !== '');
  
  if (piEnabled) {
    log(`  ${checkmark()} Pi Network: ${colors.green}ENABLED${colors.reset}`);
    log(`  ${colors.blue}  Environment: ${env.PI_ENVIRONMENT}${colors.reset}`);
    piVars.forEach(({ key, value }) => {
      log(`  ${checkmark()} ${key}: Set`);
    });
  } else {
    log(`  ${warning()} Pi Network: ${colors.yellow}DISABLED${colors.reset}`);
    piVars.forEach(({ key, value }) => {
      const isSet = value && value !== '';
      if (!isSet) {
        log(`  ${crossmark()} ${key}: Not set`);
      } else {
        log(`  ${checkmark()} ${key}: Set`);
      }
    });
  }

  // Payment Services
  header('💳 Payment Services');
  
  const stripeEnabled = env.STRIPE_SECRET_KEY && env.STRIPE_SECRET_KEY !== '';
  const cryptoEnabled = env.NEXT_PUBLIC_CRYPTO_ENABLED === 'true';
  
  log(`  ${stripeEnabled ? checkmark() : warning()} Stripe: ${stripeEnabled ? colors.green + 'ENABLED' : colors.yellow + 'DISABLED'}${colors.reset}`);
  log(`  ${cryptoEnabled ? checkmark() : warning()} Crypto: ${cryptoEnabled ? colors.green + 'ENABLED' : colors.yellow + 'DISABLED'}${colors.reset}`);
  
  if (cryptoEnabled) {
    log(`  ${colors.blue}  Treasury: ${env.PROTOCOL_TREASURY_ADDRESS}${colors.reset}`);
  }

  // AI Services
  header('🤖 AI Services');
  
  const aiServices = [
    { key: 'OPENAI_API_KEY', value: env.OPENAI_API_KEY, name: 'OpenAI' },
    { key: 'ANTHROPIC_API_KEY', value: env.ANTHROPIC_API_KEY, name: 'Anthropic Claude' },
    { key: 'GOOGLE_AI_API_KEY', value: env.GOOGLE_AI_API_KEY, name: 'Google AI' },
  ];

  aiServices.forEach(({ key, value, name }) => {
    const isSet = value && value !== '';
    log(`  ${isSet ? checkmark() : warning()} ${name}: ${isSet ? 'Enabled' : 'Disabled'}`);
  });

  // Integrations
  header('🔗 Integrations');
  
  const integrations = [
    { key: 'TELEGRAM_BOT_TOKEN', value: env.TELEGRAM_BOT_TOKEN, name: 'Telegram Bot' },
    { key: 'NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID', value: env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID, name: 'WalletConnect' },
    { key: 'AXIOM_API_KEY', value: env.AXIOM_API_KEY, name: 'AxiomID' },
  ];

  integrations.forEach(({ key, value, name }) => {
    const isSet = value && value !== '';
    log(`  ${isSet ? checkmark() : warning()} ${name}: ${isSet ? 'Enabled' : 'Disabled'}`);
  });

  // Monitoring
  header('📊 Monitoring & Debugging');
  
  log(`  ${env.SENTRY_DSN ? checkmark() : warning()} Sentry: ${env.SENTRY_DSN ? 'Enabled' : 'Disabled'}`);
  log(`  ${env.DEBUG ? warning() : checkmark()} Debug Mode: ${env.DEBUG ? colors.yellow + 'ON' : colors.green + 'OFF'}${colors.reset}`);
  log(`  ${env.SKIP_SIGNATURE_VERIFICATION ? crossmark() : checkmark()} Signature Verification: ${env.SKIP_SIGNATURE_VERIFICATION ? colors.red + 'SKIPPED (DANGEROUS!)' : colors.green + 'ENABLED'}${colors.reset}`);
  log(`  Log Level: ${colors.blue}${env.NEXT_PUBLIC_LOG_LEVEL}${colors.reset}`);

  // Summary
  header('📋 Validation Summary');
  
  if (!validation.valid) {
    log(`\n${crossmark()} ${colors.red}${colors.bold}VALIDATION FAILED${colors.reset}`, colors.red);
    log(`\nMissing required variables:`, colors.red);
    validation.missing.forEach(key => {
      log(`  • ${key}`, colors.red);
    });
  } else {
    log(`\n${checkmark()} ${colors.green}${colors.bold}VALIDATION PASSED${colors.reset}`, colors.green);
  }

  if (validation.warnings.length > 0) {
    log(`\n${warning()} ${colors.yellow}Warnings:${colors.reset}`, colors.yellow);
    validation.warnings.forEach(msg => {
      log(`  • ${msg}`, colors.yellow);
    });
  }

  // Recommendations
  if (!validation.valid || validation.warnings.length > 0) {
    header('💡 Recommendations');
    
    if (!validation.valid) {
      log(`\n1. Copy the example file:`);
      log(`   ${colors.cyan}cp .env.example .env${colors.reset}`);
      log(`   ${colors.cyan}cp apps/studio/.env.example apps/studio/.env.local${colors.reset}`);
      log(`\n2. Fill in the missing variables`);
      log(`\n3. See docs/ENVIRONMENT_SETUP.md for detailed instructions`);
    }

    if (validation.warnings.length > 0 && env.NODE_ENV === 'production') {
      log(`\n${colors.red}${colors.bold}⚠️  PRODUCTION SECURITY WARNINGS${colors.reset}`);
      log(`\nYou MUST address these warnings before deploying to production:`);
      validation.warnings.forEach(msg => {
        log(`  • ${msg}`, colors.red);
      });
    }
  }

  console.log('\n' + '='.repeat(60) + '\n');

  // Exit with appropriate code
  if (!validation.valid && env.NODE_ENV === 'production') {
    process.exit(1);
  }
}

main().catch(error => {
  log(`\n${crossmark()} ${colors.red}${colors.bold}ERROR:${colors.reset} ${error.message}`, colors.red);
  console.error(error);
  process.exit(1);
});

// Made with Moe Abdelaziz
