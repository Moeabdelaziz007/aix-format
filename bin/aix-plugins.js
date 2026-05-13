#!/usr/bin/env node
/**
 * AIX Plugins CLI
 *
 * Manage the local .aix-plugins.json registry. Subcommands:
 *   list                    - List installed plugins.
 *   add <path>              - Add a plugin (flags: --priority N, --disabled).
 *   remove <path>           - Remove a plugin.
 *   enable <path>           - Mark a plugin enabled.
 *   disable <path>          - Mark a plugin disabled.
 *   help                    - Print this help.
 *
 * Previously used 'commander' which was never added as a dependency,
 * so the CLI threw ERR_MODULE_NOT_FOUND on every invocation. Rewritten
 * with the Node stdlib so it has zero runtime deps.
 */

import { readFile, writeFile } from 'node:fs/promises';

const CONFIG_PATH = '.aix-plugins.json';

const HELP = `aix-plugins - Manage AIX validation plugins

Usage:
  aix-plugins <command> [args] [flags]

Commands:
  list                          List installed plugins
  add <path> [--priority N] [--disabled]
                                Register a plugin
  remove <path>                 Remove a plugin
  enable <path>                 Enable a plugin
  disable <path>                Disable a plugin
  help, --help, -h              Show this help
`;

async function loadConfig() {
  try {
    return JSON.parse(await readFile(CONFIG_PATH, 'utf-8'));
  } catch {
    return { plugins: {} };
  }
}

async function saveConfig(config) {
  await writeFile(CONFIG_PATH, JSON.stringify(config, null, 2));
}

/**
 * Pull a flag value out of argv. Returns the value string, or null if
 * the flag was not provided. Supports both `--flag value` and
 * `--flag=value` styles.
 */
function flagValue(argv, name) {
  const idx = argv.indexOf(`--${name}`);
  if (idx !== -1 && argv[idx + 1] !== undefined && !argv[idx + 1].startsWith('--')) {
    return argv[idx + 1];
  }
  const eq = argv.find((a) => a.startsWith(`--${name}=`));
  if (eq) return eq.slice(name.length + 3);
  return null;
}

function hasFlag(argv, name) {
  return argv.includes(`--${name}`);
}

async function cmdList() {
  const config = await loadConfig();
  console.log('Installed plugins:');
  for (const [path, options] of Object.entries(config.plugins || {})) {
    const status = options.enabled === false ? '❌' : '✅';
    const priority = options.priority !== undefined ? ` (priority: ${options.priority})` : '';
    console.log(`${status} ${path}${priority}`);
  }
}

async function cmdAdd(argv) {
  const path = argv[0];
  if (!path) {
    console.error('❌ Error: aix-plugins add <path>');
    process.exit(1);
  }
  const priorityRaw = flagValue(argv, 'priority');
  const priority = priorityRaw !== null ? Number.parseInt(priorityRaw, 10) : undefined;
  const disabled = hasFlag(argv, 'disabled');

  const config = await loadConfig();
  config.plugins ??= {};
  config.plugins[path] = {
    enabled: !disabled,
    ...(priority !== undefined && !Number.isNaN(priority) && { priority }),
  };
  await saveConfig(config);
  console.log(`✅ Added plugin: ${path}`);
}

async function cmdRemove(argv) {
  const path = argv[0];
  if (!path) {
    console.error('❌ Error: aix-plugins remove <path>');
    process.exit(1);
  }
  const config = await loadConfig();
  delete config.plugins?.[path];
  await saveConfig(config);
  console.log(`🗑️  Removed plugin: ${path}`);
}

async function cmdSetEnabled(argv, enabled) {
  const path = argv[0];
  if (!path) {
    console.error('❌ Error: aix-plugins enable|disable <path>');
    process.exit(1);
  }
  const config = await loadConfig();
  if (config.plugins?.[path]) {
    config.plugins[path].enabled = enabled;
    await saveConfig(config);
    console.log(`${enabled ? '✅ Enabled' : '❌ Disabled'} plugin: ${path}`);
  } else {
    console.error(`❌ Plugin not found: ${path}`);
    process.exit(1);
  }
}

async function main() {
  const [, , command, ...rest] = process.argv;

  if (!command || command === 'help' || command === '--help' || command === '-h') {
    console.log(HELP);
    return;
  }

  switch (command) {
    case 'list':
      await cmdList();
      break;
    case 'add':
      await cmdAdd(rest);
      break;
    case 'remove':
      await cmdRemove(rest);
      break;
    case 'enable':
      await cmdSetEnabled(rest, true);
      break;
    case 'disable':
      await cmdSetEnabled(rest, false);
      break;
    default:
      console.error(`❌ Unknown command: ${command}\n`);
      console.log(HELP);
      process.exit(1);
  }
}

main().catch((err) => {
  console.error(`❌ Error: ${err.message}`);
  process.exit(1);
});

// Made with Moe Abdelaziz
