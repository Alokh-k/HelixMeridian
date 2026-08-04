import { NextResponse } from 'next/server';
import { parseCandidateExcel } from '@/lib/parse-candidate-excel';
import { importCandidatesFromRows } from '@/lib/import-candidates';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file');

    if (!file || typeof file === 'string') {
      return NextResponse.json({ error: 'Excel file is required.' }, { status: 400 });
    }

    const fileName =
      file instanceof File
        ? file.name.toLowerCase()
        : typeof (file as File).name === 'string'
          ? (file as File).name.toLowerCase()
          : 'upload.xlsx';
    if (!fileName.endsWith('.xlsx') && !fileName.endsWith('.xls') && !fileName.endsWith('.csv')) {
      return NextResponse.json(
        { error: 'Upload a valid Excel file (.xlsx, .xls, or .csv).' },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const { candidates, errors } = parseCandidateExcel(buffer);

    if (candidates.length === 0) {
      return NextResponse.json({ error: errors[0] || 'No valid candidates found.', errors }, { status: 400 });
    }

    const imported = await importCandidatesFromRows(candidates);

    return NextResponse.json({
      success: true,
      importedCount: imported.length,
      candidates: imported,
      errors,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
