import { NextResponse } from "next/server";
import { getCreatorUser, destroyCreatorSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function DELETE() {
  try {
    const user = await getCreatorUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Delete user and all related data in a transaction
    await prisma.$transaction([
      // Delete all votes on user's polls
      prisma.vote.deleteMany({
        where: {
          poll: {
            creatorId: user.id
          }
        }
      }),
      // Delete all polls created by user
      prisma.poll.deleteMany({
        where: { creatorId: user.id }
      }),
      // Delete all email tokens
      prisma.emailToken.deleteMany({
        where: { userId: user.id }
      }),
      // Delete all auth challenges
      prisma.authChallenge.deleteMany({
        where: { userId: user.id }
      }),
      // Delete all auth accounts (passkeys, etc.)
      prisma.authAccount.deleteMany({
        where: { userId: user.id }
      }),
      // Delete all sessions
      prisma.session.deleteMany({
        where: { userId: user.id }
      }),
      // Finally delete the user
      prisma.user.delete({
        where: { id: user.id }
      })
    ]);

    // Destroy the current session
    await destroyCreatorSession();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete account error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete account" },
      { status: 500 }
    );
  }
}
