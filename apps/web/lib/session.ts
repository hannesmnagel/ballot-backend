import { cookies } from "next/headers";
import { addDays } from "./time";
import { hashToken, randomToken } from "./crypto";
import { prisma } from "./prisma";

const COOKIE_NAME = "creator_session";

export async function createCreatorSession(userId: string) {
  const token = randomToken(32);
  const tokenHash = hashToken(token);
  const expiresAt = addDays(new Date(), 14);

  await prisma.session.create({
    data: {
      userId,
      tokenHash,
      expiresAt
    }
  });

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    expires: expiresAt,
    path: "/"
  });
}

export async function destroyCreatorSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (token) {
    await prisma.session.deleteMany({ where: { tokenHash: hashToken(token) } });
  }
  cookieStore.delete(COOKIE_NAME);
}

export async function getCreatorUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;

  const tokenHash = hashToken(token);
  const session = await prisma.session.findUnique({
    where: { tokenHash },
    include: { user: true }
  });

  if (!session || session.expiresAt < new Date()) {
    cookieStore.delete(COOKIE_NAME);
    return null;
  }

  return session.user;
}

export async function requireCreatorUser() {
  const user = await getCreatorUser();
  if (!user) {
    throw new Error("UNAUTHORIZED");
  }
  return user;
}
