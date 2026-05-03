#!/usr/bin/env tsx

/**
 * OpenMemory Protection Watcher
 * 
 * Monitors openmemory.md for changes and provides automatic protection:
 * - Auto-backup on every change with timestamp
 * - Detects compression events (>10% size decrease)
 * - Auto-reverts compressed versions via git
 * - Logs all actions to console
 */

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

const OPENMEMORY_FILE = 'openmemory.md';
const BACKUP_DIR = '.backups';
const COMPRESSION_THRESHOLD = 0.10; // 10% size decrease triggers alert

let lastSize = 0;
let isProcessing = false;

/**
 * Get current file size in bytes
 */
function getFileSize(filePath: string): number {
  try {
    const stats = fs.statSync(filePath);
    return stats.size;
  } catch (error) {
    console.error(`❌ Error reading file size: ${error}`);
    return 0;
  }
}

/**
 * Create timestamped backup of openmemory.md
 */
function createBackup(): void {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const backupPath = path.join(BACKUP_DIR, `openmemory-${timestamp}.md`);
    
    // Ensure backup directory exists
    if (!fs.existsSync(BACKUP_DIR)) {
      fs.mkdirSync(BACKUP_DIR, { recursive: true });
    }
    
    // Copy file to backup
    fs.copyFileSync(OPENMEMORY_FILE, backupPath);
    console.log(`✅ Backup created: ${backupPath}`);
  } catch (error) {
    console.error(`❌ Backup failed: ${error}`);
  }
}

/**
 * Revert openmemory.md to HEAD version via git
 */
function revertToHead(): void {
  try {
    console.log('🔄 Reverting openmemory.md to HEAD version...');
    execSync(`git checkout HEAD -- ${OPENMEMORY_FILE}`, { stdio: 'inherit' });
    console.log('✅ File reverted successfully');
  } catch (error) {
    console.error(`❌ Git revert failed: ${error}`);
    console.log('💡 Manual recovery: git checkout HEAD -- openmemory.md');
  }
}

/**
 * Check if file was compressed and handle accordingly
 */
function checkCompression(currentSize: number): void {
  if (lastSize === 0) {
    // First read, just store the size
    lastSize = currentSize;
    return;
  }
  
  const sizeDiff = lastSize - currentSize;
  const percentDecrease = sizeDiff / lastSize;
  
  if (percentDecrease > COMPRESSION_THRESHOLD) {
    console.log('');
    console.log('🚨 COMPRESSION DETECTED!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`   Previous size: ${lastSize} bytes`);
    console.log(`   Current size:  ${currentSize} bytes`);
    console.log(`   Decrease:      ${sizeDiff} bytes (${(percentDecrease * 100).toFixed(1)}%)`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');
    
    // Auto-revert
    revertToHead();
    
    // Update size after revert
    lastSize = getFileSize(OPENMEMORY_FILE);
  } else if (currentSize > lastSize) {
    // File grew, this is expected (append-only)
    const growth = currentSize - lastSize;
    console.log(`📝 File updated: +${growth} bytes (${lastSize} → ${currentSize})`);
    lastSize = currentSize;
  } else if (sizeDiff > 0 && percentDecrease <= COMPRESSION_THRESHOLD) {
    // Small decrease, might be normal editing
    console.log(`⚠️  File size decreased by ${sizeDiff} bytes (${(percentDecrease * 100).toFixed(1)}%) - within threshold`);
    lastSize = currentSize;
  }
}

/**
 * Handle file change event
 */
function handleFileChange(eventType: string, filename: string | null): void {
  if (isProcessing) {
    return; // Prevent recursive triggers
  }
  
  if (filename !== OPENMEMORY_FILE) {
    return;
  }
  
  isProcessing = true;
  
  try {
    console.log(`\n🔍 Change detected: ${eventType}`);
    
    // Get current size
    const currentSize = getFileSize(OPENMEMORY_FILE);
    
    if (currentSize === 0) {
      console.error('❌ File is empty or unreadable!');
      isProcessing = false;
      return;
    }
    
    // Create backup
    createBackup();
    
    // Check for compression
    checkCompression(currentSize);
    
  } catch (error) {
    console.error(`❌ Error handling file change: ${error}`);
  } finally {
    isProcessing = false;
  }
}

/**
 * Initialize watcher
 */
function startWatcher(): void {
  console.log('🛡️  OpenMemory Protection Watcher Started');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`   Monitoring: ${OPENMEMORY_FILE}`);
  console.log(`   Backup dir: ${BACKUP_DIR}/`);
  console.log(`   Threshold:  ${COMPRESSION_THRESHOLD * 100}% size decrease`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');
  
  // Check if file exists
  if (!fs.existsSync(OPENMEMORY_FILE)) {
    console.error(`❌ Error: ${OPENMEMORY_FILE} not found!`);
    process.exit(1);
  }
  
  // Initialize last size
  lastSize = getFileSize(OPENMEMORY_FILE);
  console.log(`📊 Initial size: ${lastSize} bytes`);
  console.log('');
  console.log('👀 Watching for changes... (Press Ctrl+C to stop)');
  console.log('');
  
  // Watch for changes
  const watcher = fs.watch(OPENMEMORY_FILE, (eventType, filename) => {
    handleFileChange(eventType, filename);
  });
  
  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n\n🛑 Stopping watcher...');
    watcher.close();
    console.log('✅ Watcher stopped');
    process.exit(0);
  });
  
  process.on('SIGTERM', () => {
    console.log('\n\n🛑 Stopping watcher...');
    watcher.close();
    console.log('✅ Watcher stopped');
    process.exit(0);
  });
}

// Start the watcher
startWatcher();

// Made with Moe Abdelaziz
