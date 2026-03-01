"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

type Results = {
  winnerOptionId: string | null;
  aggregate: Record<string, number>;
  voterNames?: string[];
  voterBallotMap?: Array<{ voterName: string; ballot: unknown }>;
};

type Poll = {
  options: Array<{ id: string; label: string }>;
  pollId: string;
  title: string;
};

export default function PollResultsPage() {
  const params = useParams<{ publicId: string }>();
  const publicId = params.publicId;
  const [results, setResults] = useState<Results | null>(null);
  const [poll, setPoll] = useState<Poll | null>(null);
  const [message, setMessage] = useState("Loading...");

  useEffect(() => {
    if (!publicId) return;
    void (async () => {
      const [pollRes, resultRes] = await Promise.all([
        fetch(`/api/public/polls/${publicId}`),
        fetch(`/api/public/polls/${publicId}/results`)
      ]);

      const pollData = await pollRes.json();
      const resultData = await resultRes.json();

      if (!pollRes.ok || !resultRes.ok) {
        setMessage(pollData.error ?? resultData.error ?? "Failed");
        return;
      }

      setPoll(pollData);
      setResults(resultData);
      setMessage("");
    })();
  }, [publicId]);

  if (!poll || !results) {
    return <main><div className="card">{message}</div></main>;
  }

  const optionLabel = Object.fromEntries(poll.options.map((o) => [o.id, o.label]));

  return (
    <main className="grid-gap">
      <div className="card grid-gap">
        <h1 className="text-2xl font-semibold">Results: {poll.title}</h1>
        <p className="text-sm text-slate-600">
          Winner: {results.winnerOptionId ? optionLabel[results.winnerOptionId] : "No winner yet"}
        </p>
      </div>

      <div className="card grid-gap">
        <h2 className="font-semibold">Aggregate</h2>
        {Object.entries(results.aggregate).map(([optionId, value]) => (
          <div key={optionId} className="grid-gap">
            <div className="text-sm">{optionLabel[optionId] ?? optionId}: {value}</div>
            <div className="h-2 rounded bg-slate-200">
              <div className="h-2 rounded bg-teal-700" style={{ width: `${Math.min(100, value * 5)}%` }} />
            </div>
          </div>
        ))}
      </div>

      {results.voterNames && (
        <div className="card grid-gap">
          <h2 className="font-semibold">Voters</h2>
          {results.voterNames.map((name, i) => <p className="text-sm" key={`${name}-${i}`}>{name}</p>)}
        </div>
      )}

      {results.voterBallotMap && (
        <div className="card grid-gap">
          <h2 className="font-semibold">Voter ballots</h2>
          {results.voterBallotMap.map((entry, i) => (
            <div key={`${entry.voterName}-${i}`} className="text-sm">
              <strong>{entry.voterName}</strong>: {JSON.stringify(entry.ballot)}
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
