import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { destroyCreatorSession, getCreatorUser } from "@/lib/session";

export default async function DashboardPage() {
  const user = await getCreatorUser();
  if (!user) {
    redirect("/auth/login");
  }

  const polls = await prisma.poll.findMany({
    where: { creatorId: user.id },
    include: { _count: { select: { votes: true } } },
    orderBy: { createdAt: "desc" }
  });

  async function logout() {
    "use server";
    await destroyCreatorSession();
    redirect("/");
  }

  const displayIdentity = user.email ?? user.displayName;

  return (
    <main className="grid-gap">
      <div className="card grid-gap">
        <div>
          <h1 className="text-2xl font-semibold">Your Polls</h1>
          <p className="text-sm text-muted">Signed in as {displayIdentity}</p>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Link className="btn btn-primary" href="/polls/new">Create poll</Link>
          <Link className="btn btn-secondary" href="/settings">Settings</Link>
        </div>

        <form action={logout}>
          <button className="btn btn-outline w-full" type="submit">Log out</button>
        </form>
      </div>

      {polls.length === 0 ? (
        <div className="card text-center grid-gap">
          <div>
            <p className="text-lg font-semibold text-muted">No polls yet</p>
            <p className="text-sm text-muted">Create your first poll to get started</p>
          </div>
        </div>
      ) : null}

      {polls.map((poll) => (
        <div key={poll.id} className="card grid-gap">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">{poll.title}</h2>
            <span className={`badge badge-${poll.status.toLowerCase()}`}>{poll.status}</span>
          </div>

          <div className="text-sm text-muted">
            <span className="font-medium">{poll.method}</span>
            {" · "}
            <span>{poll._count.votes}/{poll.maxVoters} votes</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Link className="btn btn-outline" href={`/polls/${poll.id}/manage`}>Manage</Link>
            <Link className="btn btn-primary" href={`/poll/${poll.publicId}`}>View poll</Link>
          </div>
        </div>
      ))}
    </main>
  );
}
