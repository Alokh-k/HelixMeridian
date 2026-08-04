import { describe, it, expect, vi } from 'vitest';
import { POST as chatPost } from '../chat/route';
import { prisma } from '@/lib/db';
import { getGeminiModel } from '@/lib/gemini';

vi.mock('@/lib/db', () => ({
  prisma: {
    candidate: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}));

vi.mock('@/lib/gemini', () => {
  const generateContentMock = vi.fn().mockResolvedValue({
    response: {
      text: () => 'Hello! Tell me about yourself.',
    },
  });
  return {
    getGeminiModel: vi.fn().mockResolvedValue({
      generateContent: generateContentMock,
    }),
  };
});

describe('Interview Dialogue Chat API', () => {
  it('adds candidate response and generates AI response', async () => {
    const mockCandidate = {
      id: 'uuid-789',
      fullName: 'John Smith',
      resumeText: 'Software Engineer',
      techStack: 'Fullstack Javascript',
      personalTranscript: [],
    };
    vi.mocked(prisma.candidate.findUnique).mockResolvedValue(mockCandidate as any);
    vi.mocked(prisma.candidate.update).mockResolvedValue(mockCandidate as any);

    const req = new Request('http://localhost:3000/api/interview/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        candidateId: 'uuid-789',
        round: 'personal',
        message: 'Hello, I am ready to start.',
      }),
    });

    const response = await chatPost(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.response).toBe('Hello! Tell me about yourself.');
    expect(prisma.candidate.update).toHaveBeenCalled();
  });
});
