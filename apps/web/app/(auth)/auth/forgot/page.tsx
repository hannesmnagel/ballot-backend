"use client";

import { useState } from "react";

export default function ForgotPasswordPage() {
  const [state, setState] = useState("");

  async function onSubmit(formData: FormData) {
    setState("Sending reset email...");
    const email = formData.get("email");
    const response = await fetch("/api/auth/password/forgot", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email })
    });
    const payload = await response.json();
    setState(response.ok ? "If the email exists, reset instructions were sent." : payload.error ?? "Failed");
  }

  return (
    <main>
      <form className="card grid-gap" action={(fd) => void onSubmit(fd)}>
        <h1 className="text-2xl font-semibold">Forgot password</h1>
        <div>
          <label>Email</label>
          <input className="input" name="email" type="email" required />
        </div>
        <button className="btn btn-primary" type="submit">Send reset email</button>
        <p className="text-sm text-slate-600">{state}</p>
      </form>
    </main>
  );
}
