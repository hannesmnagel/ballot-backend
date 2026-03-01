import Link from "next/link";

export default function HomePage() {
  return (
    <main className="grid-gap">
      <section className="card grid-gap text-center">
        <div>
          <h1 className="text-4xl font-bold" style={{ marginBottom: "12px" }}>Ballot</h1>
          <p className="text-lg text-muted">Better polls with modern voting systems</p>
        </div>

        <p className="text-sm text-muted" style={{ maxWidth: "380px", margin: "0 auto" }}>
          Create polls with Ranked Choice, Condorcet, or STAR voting.
          Advanced methods that prevent vote splitting and ensure fair results.
        </p>

        <div className="grid grid-cols-1 gap-2" style={{ marginTop: "8px" }}>
          <Link href="/auth" className="btn btn-primary">Get started →</Link>
          <Link href="/dashboard" className="btn btn-outline">Open dashboard</Link>
        </div>
      </section>

      <section className="card">
        <h2 className="text-lg font-semibold" style={{ marginBottom: "12px" }}>Why these voting methods work better</h2>
        <div className="grid-gap" style={{ gap: "12px" }}>
          <div>
            <p className="text-sm font-medium">Ranked Choice (RCV)</p>
            <p className="text-xs text-muted">Rank options by preference, instant runoff eliminates spoilers</p>
          </div>
          <div>
            <p className="text-sm font-medium">Condorcet (Schulze)</p>
            <p className="text-xs text-muted">Head-to-head comparisons find consensus winners</p>
          </div>
          <div>
            <p className="text-sm font-medium">STAR Voting</p>
            <p className="text-xs text-muted">Score options 0-5, top two advance to automatic runoff</p>
          </div>
        </div>
      </section>

      <div className="card text-center" style={{ padding: "12px" }}>
        <p className="text-xs text-muted">
          No voter accounts needed • Secret link sharing • Privacy controls
        </p>
      </div>
    </main>
  );
}
