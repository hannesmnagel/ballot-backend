"use client";

import { useEffect, useMemo, useState } from "react";

export default function VerifyPage() {
  const token = useMemo(() => {
    if (typeof window === "undefined") return "";
    return new URLSearchParams(window.location.search).get("token") ?? "";
  }, []);

  const [state, setState] = useState(token ? "Verifying..." : "Missing token");

  useEffect(() => {
    if (!token) return;

    void fetch("/api/auth/email/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token })
    }).then(async (res) => {
      const data = await res.json();
      setState(res.ok ? "Email verified." : data.error ?? "Verification failed");
    });
  }, [token]);

  return (
    <main>
      <div className="card grid-gap">
        <h1 className="text-2xl font-semibold">Email verification</h1>
        <p className="text-sm text-slate-700">{state}</p>
      </div>
    </main>
  );
}
