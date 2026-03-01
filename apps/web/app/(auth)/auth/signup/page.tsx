"use client";

import { useState } from "react";
import Link from "next/link";

export default function SignupPage() {
  const [state, setState] = useState<string>("");
  const [loading, setLoading] = useState(false);

  async function onEmailPasswordSignup(formData: FormData) {
    setLoading(true);
    setState("Creating account...");
    const email = formData.get("email");
    const password = formData.get("password");

    const response = await fetch("/api/auth/signup/email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });

    const payload = await response.json();
    if (!response.ok) {
      setState(payload.error ?? "Signup failed");
      setLoading(false);
      return;
    }

    setState("Account created. Verification email sent.");
    window.location.href = "/dashboard";
  }

  return (
    <main className="grid-gap">
      <div className="card grid-gap">
        <Link href="/auth" className="text-sm link">← Back to passkey signup</Link>

        <div>
          <h1 className="text-2xl font-semibold">Email & Password Signup</h1>
          <p className="text-sm text-muted">Create an account with email and password</p>
        </div>
      </div>

      <form className="card grid-gap" action={(fd) => void onEmailPasswordSignup(fd)}>
        <div>
          <label>Email</label>
          <input className="input" type="email" name="email" required disabled={loading} placeholder="your@email.com" />
        </div>
        <div>
          <label>Password (minimum 8 characters)</label>
          <input className="input" type="password" name="password" minLength={8} required disabled={loading} />
        </div>
        <button className="btn btn-primary" type="submit" disabled={loading}>
          {loading ? "Creating account..." : "Create account"}
        </button>

        {state && (
          <div className={`alert ${state.includes("created") ? "alert-success" : "alert-error"}`}>
            <span>{state}</span>
          </div>
        )}
      </form>

      <div className="card text-center">
        <p className="text-sm text-muted">
          Already have an account? <Link href="/auth/login" className="link">Log in</Link>
        </p>
      </div>
    </main>
  );
}
