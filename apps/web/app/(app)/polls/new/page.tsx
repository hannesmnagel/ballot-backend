"use client";

import { useState } from "react";
import Link from "next/link";

export default function NewPollPage() {
  const [state, setState] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(formData: FormData) {
    setLoading(true);
    setState("Creating poll...");

    const optionsRaw = String(formData.get("options") ?? "");
    const options = optionsRaw.split("\n").map((v) => v.trim()).filter(Boolean);

    if (options.length < 2) {
      setState("Please provide at least 2 options");
      setLoading(false);
      return;
    }

    const payload = {
      title: String(formData.get("title") ?? ""),
      description: String(formData.get("description") ?? ""),
      method: String(formData.get("method") ?? "RCV"),
      options,
      requireVoterName: formData.get("requireVoterName") === "on",
      showVoterNamesInResults: formData.get("showVoterNamesInResults") === "on",
      showNameToBallotMapping: formData.get("showNameToBallotMapping") === "on",
      maxVoters: Number(formData.get("maxVoters") ?? "100")
    };

    const response = await fetch("/api/polls", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    if (!response.ok) {
      setState(data.error ?? "Failed to create poll");
      setLoading(false);
      return;
    }

    setState("Poll created! Redirecting...");
    window.location.href = `/polls/${data.id}/manage`;
  }

  return (
    <main className="grid-gap">
      <div className="card grid-gap">
        <div>
          <h1 className="text-2xl font-semibold">Create Poll</h1>
          <p className="text-sm text-muted">Set up your poll with advanced voting methods</p>
        </div>

        <Link href="/dashboard" className="btn btn-outline">
          ← Back to dashboard
        </Link>
      </div>

      <form className="card grid-gap" action={(fd) => void onSubmit(fd)}>
        <div>
          <label>Poll title</label>
          <input
            className="input"
            name="title"
            placeholder="e.g., Best programming language"
            required
            minLength={3}
            disabled={loading}
          />
        </div>

        <div>
          <label>Description (optional)</label>
          <textarea
            className="input"
            name="description"
            rows={3}
            placeholder="Add context or instructions for voters"
            disabled={loading}
          />
        </div>

        <div>
          <label>Voting method</label>
          <select name="method" defaultValue="RCV" disabled={loading}>
            <option value="RCV">Ranked Choice (RCV)</option>
            <option value="CONDORCET">Condorcet (Schulze)</option>
            <option value="STAR">STAR Voting</option>
          </select>
          <p className="text-xs text-muted" style={{ marginTop: "6px" }}>
            Advanced voting methods prevent vote splitting and ensure fair results
          </p>
        </div>

        <div>
          <label>Options (one per line, minimum 2)</label>
          <textarea
            className="input"
            name="options"
            rows={6}
            required
            placeholder={"JavaScript\nPython\nRust\nGo"}
            disabled={loading}
          />
        </div>

        <div>
          <label>Maximum voters</label>
          <input
            className="input"
            type="number"
            name="maxVoters"
            defaultValue={100}
            min={1}
            max={10000}
            disabled={loading}
          />
        </div>

        <div className="grid-gap" style={{ gap: "12px" }}>
          <p className="text-sm font-medium">Privacy settings</p>

          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" name="requireVoterName" disabled={loading} />
            <span>Require voter names</span>
          </label>

          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" name="showVoterNamesInResults" disabled={loading} />
            <span>Show voter names in results</span>
          </label>

          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" name="showNameToBallotMapping" disabled={loading} />
            <span>Show individual ballots (full transparency)</span>
          </label>
        </div>

        <button className="btn btn-primary" type="submit" disabled={loading}>
          {loading ? "Creating poll..." : "Create poll"}
        </button>

        {state && (
          <div className={`alert ${state.includes("Creating") || state.includes("Redirecting") ? "alert-success" : "alert-error"}`}>
            <span>{state}</span>
          </div>
        )}
      </form>
    </main>
  );
}
