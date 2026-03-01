import { z } from "zod";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getCreatorUser } from "@/lib/session";
import { verifyPasskeyRegistration } from "@/lib/passkey";
import { prisma } from "@/lib/prisma";
import { randomToken, hashToken } from "@/lib/crypto";
import { addDays } from "@/lib/time";

const schema = z.object({
  response: z.any(),
  userId: z.string().optional() // For new signups
});

export async function POST(req: Request) {
  try {
    const body = schema.parse(await req.json());

    // Get userId from either authenticated session or request body (new signup)
    const sessionUser = await getCreatorUser();
    const userId = sessionUser?.id ?? body.userId;

    if (!userId) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 });
    }

    const result = await verifyPasskeyRegistration({
      userId,
      response: body.response
    });

    if (result.verified) {
      // Create session
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

      return NextResponse.json({ verified: true });
    }

    return NextResponse.json({ verified: false });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to verify passkey" },
      { status: 400 }
    );
  }
}
