import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.mailtrap.io',
  port: parseInt(process.env.SMTP_PORT || '2525'),
  auth: {
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASSWORD || '',
  },
});

export async function sendInvitationEmail(email: string, candidateId: string): Promise<void> {
  const url = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/interview/${candidateId}`;
  await transporter.sendMail({
    from: process.env.SMTP_FROM || 'hr-agent@example.com',
    to: email,
    subject: 'Interview Invitation - AI HR Interviewing Agent',
    html: `
      <div style="font-family: sans-serif; padding: 20px; max-width: 600px; margin: auto; border: 1px solid #eaeaea; border-radius: 8px;">
        <h2>HR Screening Interview</h2>
        <p>You have been invited to participate in an AI-guided initial screening round.</p>
        <p>This interview will include a personal fit round, a technical round, and a coding round.</p>
        <p style="margin: 30px 0;">
          <a href="${url}" style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
            Start Interview Now
          </a>
        </p>
        <p style="font-size: 12px; color: #666;">If the button doesn't work, click this link: <a href="${url}">${url}</a></p>
      </div>
    `,
  });
}

export async function sendEvaluationEmail(candidateEmail: string, candidateName: string, score: number, report: any): Promise<void> {
  const dashboardUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/hr`;
  await transporter.sendMail({
    from: process.env.SMTP_FROM || 'hr-agent@example.com',
    to: process.env.SMTP_FROM || 'hr-agent@example.com', // Sends report back to HR
    subject: `Interview Scorecard: ${candidateName} (${score}/100)`,
    html: `
      <div style="font-family: sans-serif; padding: 20px; max-width: 600px; margin: auto; border: 1px solid #eaeaea; border-radius: 8px;">
        <h2>Candidate Evaluation Summary</h2>
        <p><strong>Candidate Name:</strong> ${candidateName}</p>
        <p><strong>Email:</strong> ${candidateEmail}</p>
        <p><strong>Overall AI Score:</strong> <span style="font-size: 18px; color: #4F46E5; font-weight: bold;">${score} / 100</span></p>
        <hr/>
        <h3>Recommendation</h3>
        <p>${report.recommendation || 'No recommendation provided.'}</p>
        <h3>Strengths</h3>
        <ul>
          ${(report.strengths || []).map((s: string) => `<li>${s}</li>`).join('')}
        </ul>
        <h3>Weaknesses</h3>
        <ul>
          ${(report.weaknesses || []).map((w: string) => `<li>${w}</li>`).join('')}
        </ul>
        <p style="margin-top: 30px;">
          <a href="${dashboardUrl}" style="background-color: #10B981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
            Open HR Dashboard
          </a>
        </p>
      </div>
    `,
  });
}
