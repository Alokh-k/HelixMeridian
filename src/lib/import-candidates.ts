import { prisma } from '@/lib/db';
import type { ParsedCandidateRow } from '@/lib/parse-candidate-excel';

export async function importCandidatesFromRows(rows: ParsedCandidateRow[]) {
  const imported: {
    id: string;
    email: string;
    fullName: string | null;
    phoneNumber: string | null;
    status: string;
  }[] = [];

  for (const row of rows) {
    const existing = await prisma.candidate.findUnique({ where: { email: row.email } });

    if (existing) {
      const candidate = await prisma.candidate.update({
        where: { email: row.email },
        data: {
          fullName: row.fullName || existing.fullName,
          phoneNumber: row.phoneNumber || existing.phoneNumber,
        },
      });
      imported.push(candidate);
      continue;
    }

    const candidate = await prisma.candidate.create({
      data: {
        email: row.email,
        fullName: row.fullName || null,
        phoneNumber: row.phoneNumber || null,
        status: 'IMPORTED',
      },
    });
    imported.push(candidate);
  }

  return imported;
}
