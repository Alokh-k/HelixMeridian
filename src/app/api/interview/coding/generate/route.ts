import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getGeminiModel } from '@/lib/gemini';

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

    // If candidate already has a coding question generated, return it
    if (candidate.codingQuestion) {
      return NextResponse.json({ question: candidate.codingQuestion });
    }

    const model = await getGeminiModel();
    const prompt = `
      Generate a single coding problem appropriate for a software engineer candidate.
      Target Tech Stack: ${candidate.techStack}
      Resume highlights: ${candidate.resumeText}
      
      The question must be returned as a JSON object with this exact structure:
      {
        "title": "Problem Title",
        "description": "Problem Description here...",
        "starterCode": "function solve(...) { \\n // Write code \\n }",
        "testCases": [
          { "input": "argument1, argument2", "expected": "expectedOutputValue" }
        ]
      }
      
      Respond with ONLY the raw JSON block. No markdown, no triple backticks, no text before or after the JSON.
    `;

    const result = await model.generateContent(prompt);
    let text = result.response.text().trim();
    
    // Clean markdown code blocks if Gemini returns them
    if (text.startsWith('```')) {
      text = text.replace(/^```json\s*/, '').replace(/```$/, '').trim();
    }

    const question = JSON.parse(text);

    await prisma.candidate.update({
      where: { id: candidateId },
      data: { codingQuestion: question },
    });

    return NextResponse.json({ question });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
