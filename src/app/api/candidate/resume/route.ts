import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const { candidateId, fullName, techStack, resumeText } = await req.json();

    if (!candidateId || !fullName || !techStack || !resumeText) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const candidate = await prisma.candidate.update({
      where: { id: candidateId },
      data: {
        fullName,
        techStack,
        resumeText,
        status: 'RESUME_UPLOADED',
      },
    });

    return NextResponse.json({ success: true, candidate });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
