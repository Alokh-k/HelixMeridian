import { prisma } from '../lib/db';
import { describe, it, expect, vi } from 'vitest';

vi.mock('../lib/db', () => {
  const mockCandidate = {
    id: 'test-uuid',
    email: 'test@example.com',
    fullName: 'Test Candidate',
    status: 'INVITED',
  };
  return {
    prisma: {
      candidate: {
        create: vi.fn().mockResolvedValue(mockCandidate),
        findUnique: vi.fn().mockResolvedValue(mockCandidate),
        delete: vi.fn().mockResolvedValue(mockCandidate),
      },
    },
  };
});

describe('Database client checks', () => {
  it('can call prisma create and return a candidate object', async () => {
    const candidate = await prisma.candidate.create({
      data: {
        email: 'test@example.com',
        fullName: 'Test Candidate',
      },
    });
    expect(candidate.id).toBe('test-uuid');
    expect(candidate.email).toBe('test@example.com');
    expect(prisma.candidate.create).toHaveBeenCalled();
  });
});
