import bcrypt from "bcryptjs";
import { prisma } from "./prisma";
import { addHours } from "./time";
import { hashToken, randomToken } from "./crypto";
import { sendMail } from "./mail";

function generateDisplayName(): string {
  const adjectives = ["Swift", "Bold", "Bright", "Quick", "Clever", "Wise", "Cool", "Smart"];
  const nouns = ["Fox", "Eagle", "Wolf", "Bear", "Lion", "Tiger", "Hawk", "Owl"];
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  const num = Math.floor(Math.random() * 9999);
  return `${adj} ${noun} ${num}`;
}

export async function signupWithEmail(email: string, password: string) {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new Error("Email already in use");
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const displayName = email.split('@')[0]; // Use email prefix as display name

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      displayName
    }
  });

  await issueEmailVerification(user.id, email);
  return user;
}

export async function loginWithEmail(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user?.passwordHash) {
    throw new Error("Invalid credentials");
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    throw new Error("Invalid credentials");
  }

  return user;
}

export async function issueEmailVerification(userId: string, email: string) {
  const token = randomToken(24);
  const tokenHash = hashToken(`verify:${token}`);
  const expiresAt = addHours(new Date(), 24);

  await prisma.emailToken.create({
    data: {
      userId,
      type: "VERIFY_EMAIL",
      tokenHash,
      expiresAt
    }
  });

  const verifyUrl = `${process.env.BETTER_AUTH_URL}/auth/verify?token=${token}`;
  await sendMail(
    email,
    "Verify your Ballot account",
    `<p>Verify your email by clicking <a href=\"${verifyUrl}\">this link</a>.</p>`,
    `Verify your email: ${verifyUrl}`
  );
}

export async function verifyEmailByToken(token: string) {
  const tokenHash = hashToken(`verify:${token}`);
  const row = await prisma.emailToken.findUnique({ where: { tokenHash } });
  if (!row || row.type !== "VERIFY_EMAIL" || row.expiresAt < new Date() || row.consumedAt) {
    throw new Error("Invalid or expired token");
  }

  await prisma.$transaction([
    prisma.user.update({ where: { id: row.userId }, data: { emailVerifiedAt: new Date() } }),
    prisma.emailToken.update({ where: { id: row.id }, data: { consumedAt: new Date() } })
  ]);
}

export async function issuePasswordReset(email: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return;

  const token = randomToken(24);
  const tokenHash = hashToken(`reset:${token}`);

  await prisma.emailToken.create({
    data: {
      userId: user.id,
      type: "RESET_PASSWORD",
      tokenHash,
      expiresAt: addHours(new Date(), 2)
    }
  });

  const resetUrl = `${process.env.BETTER_AUTH_URL}/auth/reset?token=${token}`;
  await sendMail(
    email,
    "Reset your Ballot password",
    `<p>Reset your password by clicking <a href=\"${resetUrl}\">this link</a>.</p>`,
    `Reset your password: ${resetUrl}`
  );
}

export async function resetPassword(token: string, newPassword: string) {
  const tokenHash = hashToken(`reset:${token}`);
  const row = await prisma.emailToken.findUnique({ where: { tokenHash } });

  if (!row || row.type !== "RESET_PASSWORD" || row.expiresAt < new Date() || row.consumedAt) {
    throw new Error("Invalid or expired token");
  }

  const passwordHash = await bcrypt.hash(newPassword, 12);

  await prisma.$transaction([
    prisma.user.update({ where: { id: row.userId }, data: { passwordHash } }),
    prisma.emailToken.update({ where: { id: row.id }, data: { consumedAt: new Date() } })
  ]);
}

export async function createPasskeyOnlyUser() {
  const displayName = generateDisplayName();
  const user = await prisma.user.create({
    data: {
      displayName,
      email: null,
      passwordHash: null
    }
  });
  return user;
}

export async function addEmailToUser(userId: string, email: string) {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing && existing.id !== userId) {
    throw new Error("Email already in use");
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data: { email }
  });

  await issueEmailVerification(user.id, email);
  return user;
}
