import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getGeminiModel } from '@/lib/gemini';

export async function POST(req: Request) {
  try {
    const { candidateId, round, message } = await req.json();
    if (!candidateId || !round || !message) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    const candidate = await prisma.candidate.findUnique({
      where: { id: candidateId },
    });

    if (!candidate) {
      return NextResponse.json({ error: 'Candidate not found' }, { status: 404 });
    }

    let history: any[] = [];
    if (round === 'personal') {
      history = (candidate.personalTranscript as any[]) || [];
    } else {
      history = (candidate.technicalTranscript as any[]) || [];
    }

    // Append candidate's response
    history.push({ role: 'candidate', text: message, timestamp: new Date().toISOString() });

    // Count how many questions the interviewer has asked so far
    const interviewerQuestions = history.filter((h) => h.role === 'interviewer');

    let textResponse = '';
    
    // If the candidate has completed their questions, end the round
    if (interviewerQuestions.length >= 4) {
      textResponse = '[ROUND_COMPLETED]';
    } else {
      // Call Gemini for the next question/dialogue
      const model = await getGeminiModel();
      const chatPrompt = `
        You are conducting a screening interview with a candidate for a developer role.
        Round: ${round.toUpperCase()}
        Candidate Name: ${candidate.fullName}
        Resume Text: ${candidate.resumeText}
        Preferred Tech Stack: ${candidate.techStack}

        Current Interview Dialogue History:
        ${history.map((h) => `${h.role}: ${h.text}`).join('\n')}

        Instruction:
        - If this is the start of the interview (history has only 1 candidate message), greet the candidate and ask your first question.
        - Act as a professional HR manager (for personal round) or a Senior Tech Lead (for technical round).
        - Keep your questions concise, clear, and relevant. Ask only ONE question at a time.
        - Respond naturally to their answer before asking the next question.
        - Since this is a voice-based interview, keep responses under 2-3 sentences.
        - Do not output markdown, asterisks, formatting, or annotations. Just speak plain text.

        Response format: Return only the text response you want to speak.
      `;

      const result = await model.generateContent(chatPrompt);
      textResponse = result.response.text().trim();
    }

    // Append AI response
    history.push({ role: 'interviewer', text: textResponse, timestamp: new Date().toISOString() });

    // Update database and progress status
    if (round === 'personal') {
      const nextStatus = textResponse.includes('[ROUND_COMPLETED]') ? 'TECHNICAL_ROUND' : 'PERSONAL_ROUND';
      await prisma.candidate.update({
        where: { id: candidateId },
        data: {
          personalTranscript: history,
          status: nextStatus as any,
        },
      });
    } else {
      const nextStatus = textResponse.includes('[ROUND_COMPLETED]') ? 'CODING_ROUND' : 'TECHNICAL_ROUND';
      await prisma.candidate.update({
        where: { id: candidateId },
        data: {
          technicalTranscript: history,
          status: nextStatus as any,
        },
      });
    }

    return NextResponse.json({ response: textResponse });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
