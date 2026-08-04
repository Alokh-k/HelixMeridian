import * as XLSX from 'xlsx';

export type ParsedCandidateRow = {
  fullName: string;
  phoneNumber: string;
  email: string;
  rowNumber: number;
};

export type ParseCandidateExcelResult = {
  candidates: ParsedCandidateRow[];
  errors: string[];
};

const NAME_KEYS = new Set(['name', 'full name', 'fullname', 'candidate name']);
const PHONE_KEYS = new Set(['phone', 'phone number', 'phonenumber', 'mobile', 'contact', 'contact number']);
const EMAIL_KEYS = new Set(['email', 'e-mail', 'email address', 'mail']);

function normalizeKey(key: string): string {
  return key.trim().toLowerCase().replace(/\s+/g, ' ');
}

function findValue(row: Record<string, unknown>, keys: Set<string>): string {
  for (const [rawKey, value] of Object.entries(row)) {
    if (keys.has(normalizeKey(rawKey))) {
      return String(value ?? '').trim();
    }
  }
  return '';
}

function isValidEmail(email: string): boolean {
  return email.includes('@') && email.includes('.');
}

export function parseCandidateExcel(buffer: Buffer): ParseCandidateExcelResult {
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];

  if (!sheetName) {
    return { candidates: [], errors: ['Excel file has no sheets.'] };
  }

  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(workbook.Sheets[sheetName], {
    defval: '',
  });

  if (rows.length === 0) {
    return { candidates: [], errors: ['Excel sheet is empty.'] };
  }

  const candidates: ParsedCandidateRow[] = [];
  const errors: string[] = [];
  const seenEmails = new Set<string>();

  rows.forEach((row, index) => {
    const rowNumber = index + 2;
    const fullName = findValue(row, NAME_KEYS);
    const phoneNumber = findValue(row, PHONE_KEYS);
    const email = findValue(row, EMAIL_KEYS).toLowerCase();

    if (!fullName && !phoneNumber && !email) {
      return;
    }

    if (!email || !isValidEmail(email)) {
      errors.push(`Row ${rowNumber}: invalid or missing email.`);
      return;
    }

    if (seenEmails.has(email)) {
      errors.push(`Row ${rowNumber}: duplicate email "${email}" in file.`);
      return;
    }

    seenEmails.add(email);
    candidates.push({ fullName, phoneNumber, email, rowNumber });
  });

  if (candidates.length === 0 && errors.length === 0) {
    errors.push('No candidate rows found. Use columns: Name, Phone Number, Email.');
  }

  return { candidates, errors };
}
