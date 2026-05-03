import { vi } from 'vitest';

// Setup global test environment
global.fetch = vi.fn();

// Mock Next.js environment
process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000';
process.env.NODE_ENV = 'test';

// Made with Moe Abdelaziz
