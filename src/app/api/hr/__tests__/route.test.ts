import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST as invitePost } from '../invite/route';
import { POST as importPost } from '../import/route';
import { GET as candidatesGet, POST as candidatesPost } from '../candidates/route';
import { importCandidatesFromRows } from '@/lib/import-candidates';
import { prisma } from '@/lib/db';
import { sendInvitationEmail } from '@/lib/email';
import * as XLSX from 'xlsx';

vi.mock('@/lib/db', () => ({
  prisma: {
    candidate: {
      findUnique: vi.fn(),
      create: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
    },
  },
}));

vi.mock('@/lib/email', () => ({
  sendInvitationEmail: vi.fn().mockResolvedValue(undefined),
}));


describe('HR Dashboard API Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('importCandidatesFromRows creates imported candidates', async () => {
    vi.mocked(prisma.candidate.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.candidate.create).mockResolvedValue({
      id: 'uuid-123',
      email: 'jane@example.com',
      fullName: 'Jane Doe',
      phoneNumber: '9876543210',
      status: 'IMPORTED',
    } as any);

    const imported = await importCandidatesFromRows([
      { fullName: 'Jane Doe', phoneNumber: '9876543210', email: 'jane@example.com', rowNumber: 2 },
    ]);

    expect(imported).toHaveLength(1);
    expect(prisma.candidate.create).toHaveBeenCalledWith({
      data: {
        email: 'jane@example.com',
        fullName: 'Jane Doe',
        phoneNumber: '9876543210',
        status: 'IMPORTED',
      },
    });
  });

  it('POST /api/hr/import accepts uploaded Excel files', async () => {
    const sheet = XLSX.utils.json_to_sheet([
      { Name: 'Jane Doe', 'Phone Number': '9876543210', Email: 'jane@example.com' },
    ]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, sheet, 'Candidates');
    const excelBuffer = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' });

    vi.mocked(prisma.candidate.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.candidate.create).mockResolvedValue({
      id: 'uuid-123',
      email: 'jane@example.com',
      fullName: 'Jane Doe',
      phoneNumber: '9876543210',
      status: 'IMPORTED',
    } as any);

    const mockFile = {
      name: 'candidates.xlsx',
      arrayBuffer: vi.fn().mockResolvedValue(excelBuffer),
    };

    const req = {
      formData: vi.fn().mockResolvedValue({
        get: (key: string) => (key === 'file' ? mockFile : null),
      }),
    } as unknown as Request;

    const response = await importPost(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.importedCount).toBe(1);
  });

  it('POST /api/hr/invite sends bulk invitations', async () => {
    vi.mocked(prisma.candidate.findUnique).mockResolvedValue({
      id: 'uuid-123',
      email: 'test@example.com',
      status: 'IMPORTED',
    } as any);
    vi.mocked(prisma.candidate.update).mockResolvedValue({
      id: 'uuid-123',
      email: 'test@example.com',
      status: 'INVITED',
    } as any);

    const req = new Request('http://localhost:3000/api/hr/invite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: ['uuid-123'] }),
    });

    const response = await invitePost(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.sentCount).toBe(1);
    expect(sendInvitationEmail).toHaveBeenCalledWith('test@example.com', 'uuid-123');
    expect(prisma.candidate.update).toHaveBeenCalledWith({
      where: { id: 'uuid-123' },
      data: { status: 'INVITED' },
    });
  });

  it('POST /api/hr/invite creates candidate and sends invitation email', async () => {
    const mockCandidate = { id: 'uuid-123', email: 'test@example.com', status: 'IMPORTED' };
    vi.mocked(prisma.candidate.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.candidate.create).mockResolvedValue(mockCandidate as any);
    vi.mocked(prisma.candidate.update).mockResolvedValue({ ...mockCandidate, status: 'INVITED' } as any);

    const req = new Request('http://localhost:3000/api/hr/invite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'test@example.com' }),
    });

    const response = await invitePost(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.candidateId).toBe('uuid-123');
    expect(sendInvitationEmail).toHaveBeenCalledWith('test@example.com', 'uuid-123');
  });

  it('GET /api/hr/candidates returns candidate lists', async () => {
    const mockList = [{ id: 'uuid-123', email: 'test@example.com', status: 'IMPORTED' }];
    vi.mocked(prisma.candidate.findMany).mockResolvedValue(mockList as any);

    const response = await candidatesGet();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.candidates).toHaveLength(1);
    expect(data.candidates[0].email).toBe('test@example.com');
  });

  it('POST /api/hr/candidates updates status', async () => {
    const mockCandidate = { id: 'uuid-123', email: 'test@example.com', status: 'SHORTLISTED' };
    vi.mocked(prisma.candidate.update).mockResolvedValue(mockCandidate as any);

    const req = new Request('http://localhost:3000/api/hr/candidates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: 'uuid-123', status: 'SHORTLISTED' }),
    });

    const response = await candidatesPost(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.candidate.status).toBe('SHORTLISTED');
  });
});
