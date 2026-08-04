import { describe, it, expect, vi } from 'vitest';
import { POST as loginPost } from '../login/route';
import { POST as logoutPost } from '../logout/route';

vi.mock('@/lib/auth', () => ({
  signSession: vi.fn().mockResolvedValue('mocked.token'),
}));

describe('Auth API routes', () => {
  it('rejects incorrect passcode with 401', async () => {
    process.env.ADMIN_PASSCODE = 'correct-passcode';
    const req = new Request('http://localhost/api/hr/login', {
      method: 'POST',
      body: JSON.stringify({ passcode: 'incorrect' }),
    });
    const response = await loginPost(req);
    expect(response.status).toBe(401);
    const data = await response.json();
    expect(data.error).toBe('Incorrect passcode');
  });

  it('accepts correct passcode and sets session cookie', async () => {
    process.env.ADMIN_PASSCODE = 'correct-passcode';
    const req = new Request('http://localhost/api/hr/login', {
      method: 'POST',
      body: JSON.stringify({ passcode: 'correct-passcode' }),
    });
    const response = await loginPost(req);
    expect(response.status).toBe(200);
    expect(response.headers.get('set-cookie')).toContain('helix_admin_session');
  });

  it('logout clears the session cookie', async () => {
    const response = await logoutPost();
    expect(response.status).toBe(200);
    expect(response.headers.get('set-cookie')).toContain('helix_admin_session=;');
  });
});
