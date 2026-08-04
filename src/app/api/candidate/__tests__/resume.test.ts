import { describe, it, expect, vi } from 'vitest';
import { POST as resumePost } from '../resume/route';
import { prisma } from '@/lib/db';

vi.mock('@/lib/db', () => ({
  prisma: {
    candidate: {
      update: vi.fn(),
    },
  },
}));

describe('Candidate Onboarding & Resume API', () => {
  it('updates candidate record with name, tech stack, and resume text', async () => {
    const mockCandidate = {
      id: 'uuid-456',
      fullName: 'Jane Doe',
      techStack: 'Python Developer',
      resumeText: 'Experience: 5 years Python coding...',
      status: 'RESUME_UPLOADED',
    };
    vi.mocked(prisma.candidate.update).mockResolvedValue(mockCandidate as any);

    const req = new Request('http://localhost:3000/api/candidate/resume', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        candidateId: 'uuid-456',
        fullName: 'Jane Doe',
        techStack: 'Python Developer',
        resumeText: 'Experience: 5 years Python coding...',
      }),
    });

    const response = await resumePost(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.candidate.status).toBe('RESUME_UPLOADED');
    expect(prisma.candidate.update).toHaveBeenCalledWith({
      where: { id: 'uuid-456' },
      data: {
        fullName: 'Jane Doe',
        techStack: 'Python Developer',
        resumeText: 'Experience: 5 years Python coding...',
        status: 'RESUME_UPLOADED',
      },
    });
  });
});
