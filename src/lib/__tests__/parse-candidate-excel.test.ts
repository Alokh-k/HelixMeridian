import { describe, it, expect } from 'vitest';
import * as XLSX from 'xlsx';
import { parseCandidateExcel } from '@/lib/parse-candidate-excel';

function buildExcelBuffer(rows: Record<string, string>[]): Buffer {
  const sheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, 'Candidates');
  return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }) as Buffer;
}

describe('parseCandidateExcel', () => {
  it('parses name, phone, and email columns', () => {
    const buffer = buildExcelBuffer([
      { Name: 'Jane Doe', 'Phone Number': '9876543210', Email: 'jane@example.com' },
      { Name: 'John Smith', 'Phone Number': '9123456789', Email: 'john@example.com' },
    ]);

    const result = parseCandidateExcel(buffer);

    expect(result.errors).toHaveLength(0);
    expect(result.candidates).toHaveLength(2);
    expect(result.candidates[0]).toMatchObject({
      fullName: 'Jane Doe',
      phoneNumber: '9876543210',
      email: 'jane@example.com',
    });
  });

  it('reports invalid email rows', () => {
    const buffer = buildExcelBuffer([{ Name: 'Bad Row', 'Phone Number': '123', Email: 'not-an-email' }]);
    const result = parseCandidateExcel(buffer);

    expect(result.candidates).toHaveLength(0);
    expect(result.errors[0]).toContain('invalid or missing email');
  });
});
