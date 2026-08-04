import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import vm from 'vm';

export async function POST(req: Request) {
  try {
    const { candidateId, code } = await req.json();
    if (!candidateId || !code) {
      return NextResponse.json({ error: 'Missing parameter' }, { status: 400 });
    }

    const candidate = await prisma.candidate.findUnique({
      where: { id: candidateId },
    });

    if (!candidate || !candidate.codingQuestion) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 });
    }

    const questionObj = candidate.codingQuestion as any;
    const testCases = questionObj.testCases || [];
    const results = [];
    let allPassed = true;

    for (let i = 0; i < testCases.length; i++) {
      const tc = testCases[i];
      const sandbox: any = { console: { log: () => {} } };
      vm.createContext(sandbox);

      try {
        // Construct execution script: append candidate code, then invoke solve
        const scriptCode = `
          ${code}
          const runResult = solve(${tc.input});
          runResult;
        `;
        const script = new vm.Script(scriptCode);
        const outcome = script.runInContext(sandbox, { timeout: 2000 });

        // Parse expected output if it's a string representing JSON
        let parsedExpected = tc.expected;
        try {
          if (typeof tc.expected === 'string') {
            parsedExpected = JSON.parse(tc.expected);
          }
        } catch {}

        const passed = JSON.stringify(outcome) === JSON.stringify(parsedExpected) || outcome === parsedExpected;
        if (!passed) allPassed = false;

        results.push({
          input: tc.input,
          expected: tc.expected,
          got: outcome,
          passed,
        });
      } catch (e: any) {
        allPassed = false;
        results.push({
          input: tc.input,
          expected: tc.expected,
          got: `Error: ${e.message}`,
          passed: false,
        });
      }
    }

    await prisma.candidate.update({
      where: { id: candidateId },
      data: {
        codingSolution: code,
        codingPassed: allPassed,
      },
    });

    return NextResponse.json({ results, allPassed });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
