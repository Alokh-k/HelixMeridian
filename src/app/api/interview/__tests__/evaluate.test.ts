import { describe, it, expect, vi } from 'vitest';
import { POST as evaluatePost } from '../evaluate/route';
import { prisma } from '@/lib/db';
import { sendEvaluationEmail } from '@/lib/email';

vi.mock('@/lib/db', () => ({
  prisma: {
    candidate: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}));

vi.mock('@/lib/email', () => ({
  sendEvaluationEmail: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/lib/gemini', () => {
  const generateContentMock = vi.fn().mockResolvedValue({
    response: {
      text: () => JSON.stringify({
        score: 90,
        summary: 'Excellent candidate.',
        strengths: ['Analytical skill'],
        weaknesses: ['None'],
        recommendation: 'Shortlist'
      }),
    },
  });
  return {
    getGeminiModel: vi.fn().mockResolvedValue({
      generateContent: generateContentMock,
    }),
  };
});

describe('Evaluation API Route', () => {
  it('analyzes candidate profile and updates scores', async () => {
    const mockCandidate = {
      id: 'uuid-eval',
      email: 'john@example.com',
      fullName: 'John Doe',
      resumeText: 'Test Resume',
      personalTranscript: [],
      technicalTranscript: [],
      codingQuestion: {},
      codingSolution: 'const a = 1;',
      codingPassed: true,
    };

    vi.mocked(prisma.candidate.findUnique).mockResolvedValue(mockCandidate as any);
    vi.mocked(prisma.candidate.update).mockResolvedValue(mockCandidate as any);

    const req = new Request('http://localhost:3000/api/interview/evaluate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ candidateId: 'uuid-eval' }),
    });

    const response = await evaluatePost(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(sendEvaluationEmail).toHaveBeenCalledWith('john@example.com', 'John Doe', 90, expect.objectContaining({ score: 90 }));
  });
});
