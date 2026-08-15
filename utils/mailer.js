import nodemailer from "nodemailer";

/**
 * Creates a Gmail SMTP transporter.
 * EMAIL_USER  — your Gmail address
 * EMAIL_PASS  — Gmail App Password (16-char, no spaces)
 *               Generate: Google Account → Security → 2-Step Verification → App Passwords
 */
const createTransporter = () => {
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;

  if (!user || !pass) {
    throw new Error(
      "EMAIL_USER or EMAIL_PASS is missing from environment variables. " +
      "Add them in Vercel Dashboard → Settings → Environment Variables."
    );
  }

  return nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass },
  });
};

/**
 * Sends a 6-digit OTP to the given email address.
 * Throws on any SMTP error so the caller can handle it cleanly.
 */
export const sendOtpEmail = async (to, otp) => {
  const transporter = createTransporter();

  const mailOptions = {
    from: `"Job Hunt" <${process.env.EMAIL_USER}>`,
    to,
    subject: "Verify your email - Job Hunt",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto; padding: 24px; border: 1px solid #eee; border-radius: 12px;">
        <h2 style="color: #6B3AC2; margin-bottom: 4px;">Job Hunt</h2>
        <p style="color: #555;">Use the code below to verify your email address.</p>
        <div style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #111; text-align: center; padding: 16px 0;">
          ${otp}
        </div>
        <p style="color: #888; font-size: 13px;">This code will expire in 10 minutes. If you didn't request this, you can safely ignore this email.</p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};
