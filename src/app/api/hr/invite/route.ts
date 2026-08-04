import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { sendInvitationEmail } from '@/lib/email';

async function sendInviteToCandidate(candidate: { id: string; email: string }) {
  await sendInvitationEmail(candidate.email, candidate.id);
  await prisma.candidate.update({
    where: { id: candidate.id },
    data: { status: 'INVITED' },
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, ids } = body;

    if (Array.isArray(ids) && ids.length > 0) {
      const sent: string[] = [];
      const failed: { id: string; error: string }[] = [];

      for (const id of ids) {
        const candidate = await prisma.candidate.findUnique({ where: { id } });
        if (!candidate) {
          failed.push({ id, error: 'Candidate not found' });
          continue;
        }

        try {
          await sendInviteToCandidate(candidate);
          sent.push(id);
        } catch (err: any) {
          failed.push({ id, error: err.message || 'Failed to send email' });
        }
      }

      return NextResponse.json({
        success: sent.length > 0,
        sentCount: sent.length,
        sent,
        failed,
      });
    }

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
    }

    let candidate = await prisma.candidate.findUnique({ where: { email } });

    if (!candidate) {
      candidate = await prisma.candidate.create({
        data: { email, status: 'IMPORTED' },
      });
    }

    await sendInviteToCandidate(candidate);

    return NextResponse.json({ success: true, candidateId: candidate.id });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
