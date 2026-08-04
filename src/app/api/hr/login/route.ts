import { NextResponse } from 'next/server';
import { signSession } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const { passcode } = await req.json();
    const expectedPasscode = process.env.ADMIN_PASSCODE;

    if (!expectedPasscode || passcode !== expectedPasscode) {
      return NextResponse.json({ error: 'Incorrect passcode' }, { status: 401 });
    }

    const token = await signSession();
    const response = NextResponse.json({ success: true });

    response.cookies.set('helix_admin_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 86400, // 24 hours
    });

    return response;
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
