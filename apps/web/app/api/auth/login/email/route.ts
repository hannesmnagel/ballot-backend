import { z } from "zod";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { loginWithEmail } from "@/lib/auth-service";
import { prisma } from "@/lib/prisma";
import { randomToken, hashToken } from "@/lib/crypto";
import { addDays } from "@/lib/time";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

export async function POST(req: Request) {
  try {
    console.log("[LOGIN] Starting login process");
    const body = schema.parse(await req.json());
    console.log("[LOGIN] Email:", body.email);

    const user = await loginWithEmail(body.email.toLowerCase(), body.password);
    console.log("[LOGIN] User authenticated:", user.id);

    // Create session
    const token = randomToken(32);
    const tokenHash = hashToken(token);
    const expiresAt = addDays(new Date(), 14);

    const session = await prisma.session.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt
      }
    });
    console.log("[LOGIN] Session created in database:", session.id);

    // Set cookie using cookies() function (recommended method)
    // IMPORTANT: secure must be false for localhost/HTTP, true only for production HTTPS
    const isSecure = process.env.NODE_ENV === "production" && !process.env.PASSKEY_ORIGIN?.includes("localhost");
    const cookieStore = await cookies();
    cookieStore.set("creator_session", token, {
      httpOnly: true,
      sameSite: "lax",
      secure: isSecure,
      maxAge: 60 * 60 * 24 * 14, // 14 days in seconds
      path: "/"
    });
    console.log("[LOGIN] Cookie set (secure=" + isSecure + "), token:", token.substring(0, 10) + "...");

    // Verify cookie was set
    const verifyAfterSet = cookieStore.get("creator_session");
    console.log("[LOGIN] Cookie verified immediately after setting:", verifyAfterSet?.value?.substring(0, 10) + "...");

    return NextResponse.json({ userId: user.id, email: user.email, success: true });
  } catch (error) {
    console.error("[LOGIN] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to login" },
      { status: 401 }
    );
  }
}
