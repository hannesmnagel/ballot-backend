"use client";

import { useState } from "react";
import Link from "next/link";

export default function LoginPage() {
  const [state, setState] = useState("");
  const [loading, setLoading] = useState(false);

  async function onPasswordLogin(formData: FormData) {
    try {
      setLoading(true);
      setState("Logging in...");
      const email = String(formData.get("email") ?? "");
      const password = String(formData.get("password") ?? "");

      console.log("Attempting login with email:", email);

      const response = await fetch("/api/auth/login/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });

      console.log("Login response status:", response.status);

      const payload = await response.json();
      console.log("Login response payload:", payload);

      if (!response.ok) {
        setState(payload.error ?? "Login failed");
        setLoading(false);
        return;
      }

      setState("Success! Redirecting...");
      setTimeout(() => {
        window.location.href = "/dashboard";
      }, 100);
    } catch (error) {
      console.error("Login error:", error);
      setState(error instanceof Error ? error.message : "Login failed");
      setLoading(false);
    }
  }

  return (
    <main className="grid-gap">
      <div className="card grid-gap">
        <Link href="/auth" className="text-sm link">← Back to passkey login</Link>

        <div>
          <h1 className="text-2xl font-semibold">Email & Password Login</h1>
          <p className="text-sm text-muted">Sign in with your email and password</p>
        </div>
      </div>

      <form className="card grid-gap" action={(fd) => void onPasswordLogin(fd)}>
        <div>
          <label>Email</label>
          <input className="input" name="email" type="email" required disabled={loading} placeholder="your@email.com" />
        </div>
        <div>
          <label>Password</label>
          <input className="input" name="password" type="password" required minLength={8} disabled={loading} />
        </div>
        <button className="btn btn-primary" type="submit" disabled={loading}>
          {loading ? "Logging in..." : "Log in"}
        </button>

        {state && (
          <div className={`alert ${state.includes("Success") ? "alert-success" : "alert-error"}`}>
            <span>{state}</span>
          </div>
        )}
      </form>

      <div className="card text-center">
        <p className="text-sm text-muted">
          Need an account? <Link href="/auth/signup" className="link">Sign up with email</Link>
        </p>
      </div>
    </main>
  );
}
