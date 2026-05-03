#!/usr/bin/env node
import { Command } from 'commander';
import { readFile, writeFile } from 'fs/promises';

const program = new Command();
const CONFIG_PATH = '.aix-plugins.json';

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

program.name('aix-plugins').description('Manage AIX validation plugins').version('1.0.0');

program.command('list').description('List installed plugins').action(async () => {
  const config = await loadConfig();
  console.log('Installed plugins:');
  for (const [path, options] of Object.entries(config.plugins || {})) {
    const status = options.enabled === false ? '❌' : '✅';
    const priority = options.priority !== undefined ? ` (priority: ${options.priority})` : '';
    console.log(`${status} ${path}${priority}`);
  }
});

program.command('add <path>').description('Add a plugin')
  .option('-p, --priority <number>', 'Plugin priority', parseInt)
  .option('--disabled', 'Add but keep disabled')
  .action(async (path, options) => {
    const config = await loadConfig();
    config.plugins[path] = {
      enabled: !options.disabled,
      ...(options.priority !== undefined && { priority: options.priority })
    };
    await saveConfig(config);
    console.log(`✅ Added plugin: ${path}`);
  });

program.command('remove <path>').description('Remove a plugin').action(async (path) => {
  const config = await loadConfig();
  delete config.plugins[path];
  await saveConfig(config);
  console.log(`🗑️  Removed plugin: ${path}`);
});

program.command('enable <path>').description('Enable a plugin').action(async (path) => {
  const config = await loadConfig();
  if (config.plugins[path]) {
    config.plugins[path].enabled = true;
    await saveConfig(config);
    console.log(`✅ Enabled plugin: ${path}`);
  } else {
    console.error(`❌ Plugin not found: ${path}`);
  }
});

program.command('disable <path>').description('Disable a plugin').action(async (path) => {
  const config = await loadConfig();
  if (config.plugins[path]) {
    config.plugins[path].enabled = false;
    await saveConfig(config);
    console.log(`❌ Disabled plugin: ${path}`);
  } else {
    console.error(`❌ Plugin not found: ${path}`);
  }
});

program.parse();

// Made with Moe Abdelaziz
