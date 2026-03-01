"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";

type Poll = {
  pollId: string;
  title: string;
  description: string;
  method: "RCV" | "CONDORCET" | "STAR";
  status: "DRAFT" | "OPEN" | "CLOSED";
  options: Array<{ id: string; label: string }>;
  requireVoterName: boolean;
  maxVoters: number;
  votesCast: number;
  hasVoted: boolean;
};

export default function PublicPollPage() {
  const params = useParams<{ publicId: string }>();
  const publicId = params.publicId;
  const [poll, setPoll] = useState<Poll | null>(null);
  const [message, setMessage] = useState("Loading...");
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState<string[]>([]);
  const [scores, setScores] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!publicId) return;
    void (async () => {
      const res = await fetch(`/api/public/polls/${publicId}`);
      const data = await res.json();
      if (!res.ok) {
        setMessage(data.error ?? "Failed to load poll");
        return;
      }

      // If device already voted, redirect to results
      if (data.hasVoted) {
        window.location.href = `/poll/${publicId}/results`;
        return;
      }

      setPoll(data);
      setOrder(data.options.map((o: { id: string }) => o.id));
      setScores(Object.fromEntries(data.options.map((o: { id: string }) => [o.id, 0])));
      setMessage("");
    })();
  }, [publicId]);

  const optionById = useMemo(() => new Map((poll?.options ?? []).map((o) => [o.id, o.label])), [poll]);

  function move(id: string, dir: -1 | 1) {
    setOrder((prev) => {
      const index = prev.indexOf(id);
      const next = index + dir;
      if (index < 0 || next < 0 || next >= prev.length) return prev;
      const clone = [...prev];
      [clone[index], clone[next]] = [clone[next], clone[index]];
      return clone;
    });
  }

  async function submitVote(formData: FormData) {
    if (!poll) return;

    if (poll.status !== "OPEN") {
      setMessage("This poll is not currently open for voting.");
      return;
    }

    if (poll.votesCast >= poll.maxVoters) {
      setMessage("This poll reached the maximum number of voters.");
      return;
    }

    setLoading(true);
    setMessage("Submitting your vote...");
    const voterName = String(formData.get("voterName") ?? "");

    const payload =
      poll.method === "STAR"
        ? {
            voterName,
            scores: poll.options.map((o) => ({ optionId: o.id, score: Number(scores[o.id] ?? 0) }))
          }
        : {
            voterName,
            rankings: order.map((optionId, i) => ({ optionId, rank: i + 1 }))
          };

    const res = await fetch(`/api/public/polls/${poll.pollId}/vote`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    if (!res.ok) {
      setMessage(data.error ?? "Vote failed");
      setLoading(false);
      return;
    }

    window.location.href = `/poll/${poll.pollId}/thanks`;
  }

  if (!poll) {
    return (
      <main>
        <div className="card text-center">
          <p className="text-muted">{message}</p>
        </div>
      </main>
    );
  }

  const canVote = poll.status === "OPEN" && poll.votesCast < poll.maxVoters;

  return (
    <main className="grid-gap">
      <div className="card grid-gap">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-semibold">{poll.title}</h1>
          <span className={`badge badge-${poll.status.toLowerCase()}`}>{poll.status}</span>
        </div>

        {poll.description && <p className="text-sm text-muted">{poll.description}</p>}

        <div className="flex items-center gap-2 text-sm text-muted">
          <span className="font-medium">{poll.method}</span>
          <span>·</span>
          <span>{poll.votesCast}/{poll.maxVoters} votes</span>
        </div>

        {poll.status === "DRAFT" && (
          <div className="alert alert-warning">
            <span>⚠️</span>
            <span>This poll is in draft mode and not accepting votes.</span>
          </div>
        )}

        {poll.status === "CLOSED" && (
          <div className="alert alert-error">
            <span>🔒</span>
            <span>This poll is closed and no longer accepting votes.</span>
          </div>
        )}

        {poll.votesCast >= poll.maxVoters && (
          <div className="alert alert-error">
            <span>👥</span>
            <span>This poll has reached its maximum number of voters.</span>
          </div>
        )}
      </div>

      <form className="card grid-gap" action={(fd) => void submitVote(fd)}>
        <div>
          <label>{poll.requireVoterName ? "Your name (required)" : "Your name (optional)"}</label>
          <input
            className="input"
            name="voterName"
            placeholder="Enter your name"
            required={poll.requireVoterName}
            disabled={!canVote}
          />
        </div>

        {poll.method === "STAR" ? (
          <div className="grid-gap">
            <p className="text-sm font-medium">Rate each option from 0 to 5</p>
            {poll.options.map((option) => (
              <div key={option.id} className="grid-gap" style={{ gap: "8px" }}>
                <div className="flex justify-between items-center">
                  <label className="font-medium" style={{ marginBottom: 0 }}>{option.label}</label>
                  <span className="text-lg font-bold" style={{ color: "var(--primary)" }}>
                    {scores[option.id] ?? 0}
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={5}
                  value={scores[option.id] ?? 0}
                  disabled={!canVote}
                  onChange={(e) => setScores((prev) => ({ ...prev, [option.id]: Number(e.target.value) }))}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid-gap">
            <p className="text-sm font-medium">Rank options from most to least preferred</p>
            {order.map((id, i) => (
              <div
                className="flex items-center justify-between"
                key={id}
                style={{
                  padding: "12px 16px",
                  border: "1.5px solid var(--border)",
                  borderRadius: "var(--radius-md)",
                  background: "var(--surface)"
                }}
              >
                <div>
                  <p className="text-xs text-muted">Rank {i + 1}</p>
                  <p className="font-medium">{optionById.get(id)}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    className="btn btn-outline"
                    type="button"
                    disabled={!canVote || i === 0}
                    onClick={() => move(id, -1)}
                    style={{ minHeight: "40px", padding: "8px 12px" }}
                  >
                    ↑
                  </button>
                  <button
                    className="btn btn-outline"
                    type="button"
                    disabled={!canVote || i === order.length - 1}
                    onClick={() => move(id, 1)}
                    style={{ minHeight: "40px", padding: "8px 12px" }}
                  >
                    ↓
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <button type="submit" className="btn btn-primary" disabled={!canVote || loading}>
          {loading ? "Submitting..." : "Submit vote"}
        </button>

        {message && (
          <p className="text-sm text-center text-muted">{message}</p>
        )}
      </form>
    </main>
  );
}
