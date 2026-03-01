import { z } from "zod";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { verifyPasskeyLogin } from "@/lib/passkey";
import { prisma } from "@/lib/prisma";
import { randomToken, hashToken } from "@/lib/crypto";
import { addDays } from "@/lib/time";

const schema = z.object({
  response: z.any()
});

export async function POST(req: Request) {
  try {
    const body = schema.parse(await req.json());
    const result = await verifyPasskeyLogin(body.response);

    if (result.verified) {
      // Create session
      const token = randomToken(32);
      const tokenHash = hashToken(token);
      const expiresAt = addDays(new Date(), 14);

      await prisma.session.create({
        data: {
          userId: result.userId,
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
      { error: error instanceof Error ? error.message : "Failed to verify passkey login" },
      { status: 400 }
    );
  }
}
