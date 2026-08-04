import { describe, it, expect, vi } from 'vitest';
import { sendInvitationEmail } from '../email';
import nodemailer from 'nodemailer';

vi.mock('nodemailer', () => {
  const sendMailMock = vi.fn().mockResolvedValue({ messageId: 'mock-id' });
  return {
    default: {
      createTransport: vi.fn().mockReturnValue({
        sendMail: sendMailMock,
      }),
    },
  };
});

describe('Email Service', () => {
  it('calls nodemailer to send an invite email with correct link', async () => {
    await sendInvitationEmail('candidate@example.com', 'test-uuid-123');
    const transport = nodemailer.createTransport();
    expect(transport.sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'candidate@example.com',
        subject: expect.stringContaining('Interview Invitation'),
        html: expect.stringContaining('http://localhost:3000/interview/test-uuid-123'),
      })
    );
  });
});
