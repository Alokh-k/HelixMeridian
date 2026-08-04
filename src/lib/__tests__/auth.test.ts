import { describe, it, expect } from 'vitest';
import { signSession, verifySession } from '../auth';

describe('Auth session utilities', () => {
  it('signs and verifies a valid session', async () => {
    process.env.SESSION_SECRET = 'supersecretkeythatisverylongforhmac';
    const token = await signSession();
    expect(token).toContain('.');
    const isValid = await verifySession(token);
    expect(isValid).toBe(true);
  });

  it('rejects an invalid signature token', async () => {
    process.env.SESSION_SECRET = 'supersecretkeythatisverylongforhmac';
    const isValid = await verifySession('invalid.token');
    expect(isValid).toBe(false);
  });
});
