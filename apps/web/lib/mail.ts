import nodemailer from "nodemailer";
import { getEnv } from "./env";

export async function sendMail(to: string, subject: string, html: string, text: string) {
  const env = getEnv();
  const transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: false,
    auth: {
      user: env.SMTP_USER,
      pass: env.SMTP_PASS
    }
  });

  await transporter.sendMail({
    from: env.SMTP_FROM,
    to,
    subject,
    html,
    text
  });
}
