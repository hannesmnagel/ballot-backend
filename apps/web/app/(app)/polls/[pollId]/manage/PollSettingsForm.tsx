"use client";

import { useState } from "react";

type Props = {
  pollId: string;
  title: string;
  description: string;
  maxVoters: number;
  requireVoterName: boolean;
  showVoterNamesInResults: boolean;
  showNameToBallotMapping: boolean;
};

export default function PollSettingsForm(props: Props) {
  const [status, setStatus] = useState("");

  async function save(formData: FormData) {
    const showVoterNamesInResults = formData.get("showVoterNamesInResults") === "on";
    const showNameToBallotMapping = formData.get("showNameToBallotMapping") === "on";

    const payload = {
      title: String(formData.get("title") ?? ""),
      description: String(formData.get("description") ?? ""),
      maxVoters: Number(formData.get("maxVoters") ?? props.maxVoters),
      requireVoterName: formData.get("requireVoterName") === "on",
      showVoterNamesInResults,
      showNameToBallotMapping: showVoterNamesInResults ? showNameToBallotMapping : false
    };

    const response = await fetch(`/api/polls/${props.pollId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    setStatus(response.ok ? "Saved" : data.error ?? "Failed to save");
  }

  return (
    <form className="card grid-gap" action={(fd) => void save(fd)}>
      <h2 className="font-semibold">Edit poll settings</h2>

      <div>
        <label>Title</label>
        <input className="input" name="title" defaultValue={props.title} required minLength={3} />
      </div>

      <div>
        <label>Description</label>
        <textarea className="input" name="description" rows={3} defaultValue={props.description} />
      </div>

      <div>
        <label>Max voters</label>
        <input className="input" name="maxVoters" type="number" min={1} defaultValue={props.maxVoters} />
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="requireVoterName" defaultChecked={props.requireVoterName} />
        Require voter names
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="showVoterNamesInResults" defaultChecked={props.showVoterNamesInResults} />
        Show voter names in results
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="showNameToBallotMapping" defaultChecked={props.showNameToBallotMapping} />
        Show exact choices per voter
      </label>

      <button className="btn btn-primary" type="submit">Save settings</button>
      <p className="text-sm text-slate-600">{status}</p>
    </form>
  );
}
