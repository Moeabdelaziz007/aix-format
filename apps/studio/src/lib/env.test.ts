import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('Environment Variable Validation', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  it('should return values for existing environment variables', async () => {
    process.env.PI_API_KEY = 'test_key';
    process.env.PI_APP_ID = 'test_id';
    process.env.OPENAI_API_KEY = 'openai_key';
    process.env.KV_REST_API_URL = 'https://example.com';
    process.env.KV_REST_API_TOKEN = 'kv_token';
    process.env.JWT_SECRET = 'jwt_secret_must_be_long_enough';
    process.env.NEXT_PUBLIC_APP_URL = 'https://example.com';

    const { env: validatedEnv } = await import('./env');
    expect(validatedEnv.PI_API_KEY).toBe('test_key');
  });

  it('should use default JWT_SECRET in development if missing', async () => {
    process.env.NODE_ENV = 'development';
    delete process.env.JWT_SECRET;
    process.env.PI_API_KEY = 'test_key';
    process.env.PI_APP_ID = 'test_id';
    process.env.OPENAI_API_KEY = 'openai_key';
    process.env.KV_REST_API_URL = 'https://example.com';
    process.env.KV_REST_API_TOKEN = 'kv_token';

    const { env: validatedEnv } = await import('./env');
    expect(validatedEnv.JWT_SECRET).toBe('dev_secret_369_change_me_to_something_long');
  });

  it('should throw error in production if critical variables are missing', async () => {
    process.env.NODE_ENV = 'production';
    process.env.JWT_SECRET = 'jwt_secret_must_be_long_enough';
    delete process.env.PI_API_KEY;

    await expect(async () => {
      await import('./env');
    }).rejects.toThrow(/CRITICAL: Missing or invalid environment variables: PI_API_KEY/);
  });
});
