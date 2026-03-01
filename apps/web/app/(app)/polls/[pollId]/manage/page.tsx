import Link from "next/link";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCreatorUser } from "@/lib/session";
import PollSettingsForm from "./PollSettingsForm";
import CopyLinkButton from "./CopyLinkButton";

export default async function ManagePollPage({ params }: { params: Promise<{ pollId: string }> }) {
  const user = await getCreatorUser();
  if (!user) {
    return (
      <main><div className="card"><Link className="btn btn-primary" href="/auth/login">Login required</Link></div></main>
    );
  }

  const { pollId } = await params;
  const poll = await prisma.poll.findFirst({
    where: { id: pollId, creatorId: user.id },
    include: { options: { orderBy: { orderIndex: "asc" } }, _count: { select: { votes: true } } }
  });

  if (!poll) {
    return <main><div className="card">Poll not found.</div></main>;
  }

  const managedPollId = poll.id;
  const baseUrl = process.env.BETTER_AUTH_URL || process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  const pollUrl = `${baseUrl}/poll/${poll.publicId}`;

  async function openPoll() {
    "use server";
    await prisma.poll.update({ where: { id: managedPollId }, data: { status: "OPEN", opensAt: new Date() } });
    revalidatePath(`/polls/${managedPollId}/manage`);
  }

  async function closePoll() {
    "use server";
    await prisma.poll.update({ where: { id: managedPollId }, data: { status: "CLOSED", closesAt: new Date() } });
    revalidatePath(`/polls/${managedPollId}/manage`);
  }

  return (
    <main className="grid-gap">
      <div className="card grid-gap">
        <h1 className="text-2xl font-semibold">{poll.title}</h1>
        <p className="text-sm text-slate-600">Method: {poll.method} · Status: {poll.status}</p>
        <p className="text-sm text-slate-600">Votes: {poll._count.votes}/{poll.maxVoters}</p>

        <div className="grid-gap" style={{ gap: "8px" }}>
          <label className="text-sm font-medium">Share link:</label>
          <div className="flex gap-2 items-center">
            <input
              className="input"
              value={pollUrl}
              readOnly
              style={{ flex: 1, fontSize: "14px" }}
            />
            <CopyLinkButton url={pollUrl} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <form action={openPoll}><button className="btn btn-primary w-full" type="submit">Open poll</button></form>
          <form action={closePoll}><button className="btn btn-secondary w-full" type="submit">Close poll</button></form>
        </div>
      </div>

      <PollSettingsForm
        pollId={poll.id}
        title={poll.title}
        description={poll.description}
        maxVoters={poll.maxVoters}
        requireVoterName={poll.requireVoterName}
        showVoterNamesInResults={poll.showVoterNamesInResults}
        showNameToBallotMapping={poll.showNameToBallotMapping}
      />

      <div className="card grid-gap">
        <h2 className="font-semibold">Options</h2>
        {poll.options.map((option) => <div key={option.id} className="text-sm">{option.orderIndex + 1}. {option.label}</div>)}
      </div>

      <Link className="btn btn-secondary" href={`/poll/${poll.publicId}/results`}>View public results</Link>
    </main>
  );
}
