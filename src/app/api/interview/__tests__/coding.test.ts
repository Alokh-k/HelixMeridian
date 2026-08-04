import { describe, it, expect, vi } from 'vitest';
import { POST as generatePost } from '../coding/generate/route';
import { POST as runPost } from '../coding/run/route';
import { prisma } from '@/lib/db';

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
      text: () => JSON.stringify({
        title: 'Add Two Numbers',
        description: 'Write a function solve(a, b) that returns a + b.',
        starterCode: 'function solve(a, b) {\n  return a + b;\n}',
        testCases: [
          { input: '2, 3', expected: '5' }
        ]
      }),
    },
  });
  return {
    getGeminiModel: vi.fn().mockResolvedValue({
      generateContent: generateContentMock,
    }),
  };
});

describe('Coding Round API Routes', () => {
  it('generates a new coding question using Gemini', async () => {
    const mockCandidate = {
      id: 'uuid-coding',
      techStack: 'Javascript',
      resumeText: 'Frontend Developer',
      codingQuestion: null,
    };
    vi.mocked(prisma.candidate.findUnique).mockResolvedValue(mockCandidate as any);
    vi.mocked(prisma.candidate.update).mockResolvedValue(mockCandidate as any);

    const req = new Request('http://localhost:3000/api/interview/coding/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ candidateId: 'uuid-coding' }),
    });

    const response = await generatePost(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.question.title).toBe('Add Two Numbers');
    expect(prisma.candidate.update).toHaveBeenCalled();
  });

  it('runs candidate solution in Node VM sandbox against test cases', async () => {
    const mockCandidate = {
      id: 'uuid-coding',
      codingQuestion: {
        title: 'Add Two Numbers',
        description: 'Write a function solve(a, b) that returns a + b.',
        starterCode: 'function solve(a, b) {}',
        testCases: [
          { input: '2, 3', expected: '5' }
        ]
      }
    };
    vi.mocked(prisma.candidate.findUnique).mockResolvedValue(mockCandidate as any);
    vi.mocked(prisma.candidate.update).mockResolvedValue(mockCandidate as any);

    const req = new Request('http://localhost:3000/api/interview/coding/run', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        candidateId: 'uuid-coding',
        code: 'function solve(a, b) { return a + b; }',
      }),
    });

    const response = await runPost(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.allPassed).toBe(true);
    expect(data.results[0].passed).toBe(true);
    expect(data.results[0].got).toBe(5);
  });
});
