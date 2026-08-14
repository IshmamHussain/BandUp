import nodemailer from 'nodemailer';
import { env } from '../config/env.js';

let transporter = null;

if (process.env.SMTP_EMAIL && process.env.SMTP_PASSWORD) {
  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.SMTP_EMAIL,
      pass: process.env.SMTP_PASSWORD,
    },
  });
}

export async function sendVerificationEmail(email, name, token) {
  if (!transporter) {
    console.warn('SMTP_EMAIL or SMTP_PASSWORD is not set. Simulating email verification.');
    console.log(`Verification link: ${env.clientOrigin}/api/auth/verify?token=${token}`);
    return;
  }

  const verificationUrl = `${env.clientOrigin}/api/auth/verify?token=${token}`;

  try {
    const info = await transporter.sendMail({
      from: `"BandUp AI" <${process.env.SMTP_EMAIL}>`,
      to: email,
      subject: 'Verify your BandUp AI account',
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 8px; padding: 20px;">
          <h2 style="color: #0ea5e9;">Welcome to BandUp AI, ${name}!</h2>
          <p>Thank you for registering. You're just one step away from starting your IELTS preparation.</p>
          <p>Please verify your email address by clicking the button below:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}" style="background-color: #0ea5e9; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Verify Email Address</a>
          </div>
          <p>Or copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #666; font-size: 0.9em;">
            <a href="${verificationUrl}">${verificationUrl}</a>
          </p>
          <p style="margin-top: 40px; font-size: 0.8em; color: #999;">
            If you did not create this account, please ignore this email.
          </p>
        </div>
      `,
    });
    return info;
  } catch (error) {
    console.error('Error sending verification email:', error);
    throw new Error('Failed to send verification email. Please try again later.');
  }
}
