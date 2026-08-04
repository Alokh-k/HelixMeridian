import { describe, it, expect, vi } from 'vitest';
import { proxy } from '../proxy';
import { NextRequest } from 'next/server';

vi.mock('@/lib/auth', () => ({
  verifySession: vi.fn().mockImplementation(async (token: string) => token === 'valid-token'),
}));

describe('Next.js Proxy checks', () => {
  it('redirects page requests to login if unauthenticated', async () => {
    const req = new NextRequest('http://localhost/hr/candidates');
    const response = await proxy(req);
    expect(response?.headers.get('location')).toBe('http://localhost/hr/login');
  });

  it('returns 401 for API requests if unauthenticated', async () => {
    const req = new NextRequest('http://localhost/api/hr/candidates');
    const response = await proxy(req);
    expect(response?.status).toBe(401);
  });

  it('allows requests through with a valid session', async () => {
    const req = new NextRequest('http://localhost/hr/candidates');
    req.cookies.set('helix_admin_session', 'valid-token');
    const response = await proxy(req);
    expect(response?.headers.get('x-middleware-next')).toBe('1');
  });
});
