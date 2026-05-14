import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { authenticateUser } from '../src/auth.js';

describe('auth', () => {
  beforeEach(() => {
    // Clear global window/Pi
    (global as any).window = undefined;
  });

  it('should authenticate via Pi SDK in browser mode', async () => {
    const mockUser = { uid: 'user123', username: 'piuser' };
    const mockAccessToken = 'access123';

    (global as any).window = {
      Pi: {
        authenticate: vi.fn().mockResolvedValue({
          user: mockUser,
          accessToken: mockAccessToken
        })
      }
    };

    const result = await authenticateUser(['username']);
    expect(result.user).toEqual(mockUser);
    expect(result.accessToken).toBe(mockAccessToken);
    expect((global as any).window.Pi.authenticate).toHaveBeenCalledWith(['username'], expect.any(Function));
  });

  it('should throw error if SDK authentication fails', async () => {
    (global as any).window = {
      Pi: {
        authenticate: vi.fn().mockRejectedValue(new Error('User rejected'))
      }
    };

    await expect(authenticateUser()).rejects.toThrow('Pi Browser Auth Failed: User rejected');
  });

  it('should throw in server mode without PI_API_KEY', async () => {
    process.env.PI_API_KEY = '';
    await expect(authenticateUser()).rejects.toThrow();
  });
});
