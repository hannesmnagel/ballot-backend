"use client";

import { startAuthentication, startRegistration } from "@simplewebauthn/browser";
import { useState, useEffect } from "react";
import Link from "next/link";

export default function AuthEntryPage() {
  const [state, setState] = useState("");
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"choose" | "login" | "signup">("choose");
  const [autoAuthAttempted, setAutoAuthAttempted] = useState(false);

  // Try automatic passkey login on page load
  useEffect(() => {
    if (autoAuthAttempted) return;
    setAutoAuthAttempted(true);

    void (async () => {
      try {
        // Check if WebAuthn is available
        if (!window.PublicKeyCredential) return;

        const loginOptionsRes = await fetch("/api/auth/passkey/login/options", { method: "POST" });
        if (!loginOptionsRes.ok) return;

        const loginData = await loginOptionsRes.json();

        // Immediately show passkey modal (no input field needed)
        const authResponse = await startAuthentication({
          optionsJSON: loginData.options
        });

        const verifyRes = await fetch("/api/auth/passkey/login/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ response: authResponse })
        });

        const verifyData = await verifyRes.json();
        if (verifyRes.ok && verifyData.verified) {
          window.location.href = "/dashboard";
        }
      } catch {
        // Silently fail - user probably doesn't have a passkey or cancelled
      }
    })();
  }, [autoAuthAttempted]);

  async function handleSignup() {
    setLoading(true);
    setMode("signup");
    setState("Creating your account...");

    try {
      const signupRes = await fetch("/api/auth/signup/passkey", { method: "POST" });
      const signupData = await signupRes.json();

      if (!signupRes.ok) {
        setState(signupData.error ?? "Failed to create account");
        setLoading(false);
        return;
      }

      setState("Creating your passkey...");
      const attResp = await startRegistration({ optionsJSON: signupData.options });

      const verifyRes = await fetch("/api/auth/passkey/register/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          response: attResp,
          userId: signupData.userId
        })
      });

      const verifyData = await verifyRes.json();
      if (!verifyRes.ok || !verifyData.verified) {
        setState(verifyData.error ?? "Passkey verification failed");
        setLoading(false);
        return;
      }

      setState("Success! Redirecting...");
      window.location.href = "/dashboard";
    } catch (error) {
      setState(error instanceof Error ? error.message : "Signup failed");
      setLoading(false);
    }
  }

  if (mode === "choose") {
    return (
      <main className="grid-gap">
        <div className="card grid-gap text-center">
          <div>
            <h1 className="text-3xl font-bold">Welcome to Ballot</h1>
            <p className="text-sm text-muted" style={{ marginTop: "8px" }}>
              Better polls with modern voting systems
            </p>
          </div>

          <div className="grid-gap" style={{ marginTop: "16px" }}>
            <button
              className="btn btn-primary"
              style={{ fontSize: "17px", padding: "16px 24px" }}
              onClick={() => void handleSignup()}
              disabled={loading}
            >
              Sign up with passkey →
            </button>
          </div>

          <div style={{ marginTop: "8px" }}>
            <Link href="/auth/login" className="text-sm link">
              Use email & password instead
            </Link>
          </div>
        </div>

        <div className="card text-center" style={{ padding: "16px" }}>
          <p className="text-xs text-muted">
            If you have a saved passkey, the login prompt appeared automatically. Otherwise, click sign up to create a new account.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="grid-gap">
      <div className="card grid-gap text-center">
        <div>
          <h1 className="text-2xl font-bold">Creating account</h1>
          <p className="text-sm text-muted" style={{ marginTop: "8px" }}>
            {state || "Completing setup..."}
          </p>
        </div>

        {state && !loading && (
          <div className="alert alert-error">
            <span>{state}</span>
          </div>
        )}

        {!loading && (
          <button
            className="btn btn-outline"
            onClick={() => {
              setMode("choose");
              setState("");
              setLoading(false);
            }}
          >
            ← Back
          </button>
        )}
      </div>
    </main>
  );
}
