import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getGeminiModel } from '@/lib/gemini';
import { sendEvaluationEmail } from '@/lib/email';

export async function POST(req: Request) {
  try {
    const { candidateId } = await req.json();
    if (!candidateId) {
      return NextResponse.json({ error: 'Missing candidateId' }, { status: 400 });
    }

    const candidate = await prisma.candidate.findUnique({
      where: { id: candidateId },
    });

    if (!candidate) {
      return NextResponse.json({ error: 'Candidate not found' }, { status: 404 });
    }

    const model = await getGeminiModel();
    const prompt = `
      Provide a comprehensive final evaluation of the candidate:
      Name: ${candidate.fullName}
      Resume: ${candidate.resumeText}
      Personal Round Transcript: ${JSON.stringify(candidate.personalTranscript)}
      Technical Round Transcript: ${JSON.stringify(candidate.technicalTranscript)}
      Coding Problem: ${JSON.stringify(candidate.codingQuestion)}
      Coding Code Solution: ${candidate.codingSolution}
      Passed Code Tests: ${candidate.codingPassed}

      Provide a JSON object containing:
      {
        "score": 85, // integer 1-100
        "summary": "Short 2-3 sentence overview...",
        "strengths": ["list of positive traits"],
        "weaknesses": ["list of negative/missing traits"],
        "recommendation": "Shortlist / Hold / Reject with reason"
      }

      Respond ONLY with the JSON object. Do not include markdown code block syntax (like \`\`\`json).
    `;

    const result = await model.generateContent(prompt);
    let text = result.response.text().trim();

    // Clean markdown code blocks if Gemini returns them
    if (text.startsWith('```')) {
      text = text.replace(/^```json\s*/, '').replace(/```$/, '').trim();
    }

    const reportJson = JSON.parse(text);

    const updated = await prisma.candidate.update({
      where: { id: candidateId },
      data: {
        status: 'COMPLETED',
        evaluationScore: reportJson.score,
        evaluationReport: reportJson,
      },
    });

    // Send report email to HR
    await sendEvaluationEmail(candidate.email, candidate.fullName || 'Candidate', reportJson.score, reportJson);

    return NextResponse.json({ success: true, candidate: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
