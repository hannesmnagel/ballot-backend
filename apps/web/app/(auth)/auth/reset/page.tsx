"use client";

import { useMemo, useState } from "react";

export default function ResetPasswordPage() {
  const token = useMemo(() => {
    if (typeof window === "undefined") return "";
    return new URLSearchParams(window.location.search).get("token") ?? "";
  }, []);
  const [state, setState] = useState("");

  async function onSubmit(formData: FormData) {
    const password = formData.get("password");
    const response = await fetch("/api/auth/password/reset", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password })
    });
    const payload = await response.json();
    setState(response.ok ? "Password reset completed." : payload.error ?? "Failed");
  }

  return (
    <main>
      <form className="card grid-gap" action={(fd) => void onSubmit(fd)}>
        <h1 className="text-2xl font-semibold">Reset password</h1>
        <div>
          <label>New password</label>
          <input className="input" name="password" minLength={8} type="password" required />
        </div>
        <button className="btn btn-primary" type="submit">Update password</button>
        <p className="text-sm text-slate-600">{state}</p>
      </form>
    </main>
  );
}
