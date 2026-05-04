#!/usr/bin/env node
import React from 'react';
import { render } from 'ink';
import AIXApp from './AIXApp';

// Render the CLI app
const { waitUntilExit } = render(<AIXApp />);

// Wait for the app to exit
waitUntilExit().then(() => {
  console.log('\n👋 AIX Format Studio CLI closed');
  process.exit(0);
});

// Handle errors
process.on('unhandledRejection', (error) => {
  console.error('Unhandled rejection:', error);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);
  process.exit(1);
});

// Made with Moe Abdelaziz
