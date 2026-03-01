"use client";

import { startRegistration } from "@simplewebauthn/browser";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function SettingsPage() {
  const [state, setState] = useState("");
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<{ email: string | null; displayName: string } | null>(null);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    // Fetch user info
    void (async () => {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const data = await res.json();
        setUser(data);
      }
    })();
  }, []);

  async function registerPasskey() {
    setLoading(true);
    setState("Preparing passkey registration...");

    try {
      const optionsRes = await fetch("/api/auth/passkey/register/options", { method: "POST" });
      const optionsData = await optionsRes.json();

      if (!optionsRes.ok) {
        setState(optionsData.error ?? "Failed to load options");
        setLoading(false);
        return;
      }

      const attResp = await startRegistration({ optionsJSON: optionsData });
      const verifyRes = await fetch("/api/auth/passkey/register/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ response: attResp })
      });

      const verifyData = await verifyRes.json();
      if (verifyRes.ok && verifyData.verified) {
        setState("Passkey registered successfully!");
      } else {
        setState(verifyData.error ?? "Registration failed");
      }
    } catch (error) {
      setState(error instanceof Error ? error.message : "Failed to register passkey");
    } finally {
      setLoading(false);
    }
  }

  async function addEmail(formData: FormData) {
    setLoading(true);
    setState("Adding email...");

    const email = String(formData.get("email") ?? "");

    const response = await fetch("/api/auth/email/add", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email })
    });

    const data = await response.json();
    if (!response.ok) {
      setState(data.error ?? "Failed to add email");
      setLoading(false);
      return;
    }

    setState("Email added! Verification email sent.");
    setShowEmailForm(false);
    setUser(prev => prev ? { ...prev, email } : null);
    setLoading(false);
  }

  async function deleteAccount() {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }

    setLoading(true);
    setState("Deleting account...");

    try {
      const response = await fetch("/api/auth/account/delete", {
        method: "DELETE"
      });

      if (!response.ok) {
        const data = await response.json();
        setState(data.error ?? "Failed to delete account");
        setLoading(false);
        setConfirmDelete(false);
        return;
      }

      setState("Account deleted. Redirecting...");
      setTimeout(() => {
        window.location.href = "/";
      }, 1000);
    } catch (error) {
      setState(error instanceof Error ? error.message : "Failed to delete account");
      setLoading(false);
      setConfirmDelete(false);
    }
  }

  return (
    <main className="grid-gap">
      <div className="card grid-gap">
        <div>
          <h1 className="text-2xl font-semibold">Settings</h1>
          <p className="text-sm text-muted">Manage your account and security</p>
        </div>

        <Link href="/dashboard" className="btn btn-outline">
          ← Back to dashboard
        </Link>
      </div>

      <div className="card grid-gap">
        <h2 className="text-lg font-semibold">Account Information</h2>

        <div>
          <label>Display name</label>
          <input
            className="input"
            value={user?.displayName ?? "Loading..."}
            disabled
          />
        </div>

        <div>
          <label>Email {!user?.email && "(optional)"}</label>
          {user?.email ? (
            <input
              className="input"
              value={user.email}
              disabled
            />
          ) : showEmailForm ? (
            <form action={(fd) => void addEmail(fd)} className="grid-gap" style={{ gap: "8px" }}>
              <input
                className="input"
                name="email"
                type="email"
                placeholder="your@email.com"
                required
                disabled={loading}
              />
              <div className="flex gap-2">
                <button className="btn btn-primary" type="submit" disabled={loading}>
                  {loading ? "Adding..." : "Add email"}
                </button>
                <button
                  className="btn btn-outline"
                  type="button"
                  onClick={() => setShowEmailForm(false)}
                  disabled={loading}
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <button
              className="btn btn-secondary"
              onClick={() => setShowEmailForm(true)}
            >
              Add email address
            </button>
          )}
          <p className="text-xs text-muted" style={{ marginTop: "6px" }}>
            Adding an email enables password recovery and email notifications
          </p>
        </div>
      </div>

      <div className="card grid-gap">
        <h2 className="text-lg font-semibold">Passkeys</h2>
        <p className="text-sm text-muted">
          Passkeys provide secure, passwordless authentication using biometrics or your device security.
        </p>

        <button
          className="btn btn-primary"
          onClick={() => void registerPasskey()}
          disabled={loading}
        >
          {loading && state.includes("passkey") ? "Registering..." : "Add new passkey"}
        </button>

        <p className="text-xs text-muted">
          Tip: Register passkeys on multiple devices as backups
        </p>
      </div>

      {state && (
        <div className={`alert ${state.includes("success") || state.includes("registered") || state.includes("added") || state.includes("deleted") ? "alert-success" : "alert-error"}`}>
          <span>{state}</span>
        </div>
      )}

      <div className="card grid-gap" style={{ borderColor: "var(--danger, #dc2626)" }}>
        <h2 className="text-lg font-semibold" style={{ color: "var(--danger, #dc2626)" }}>Danger Zone</h2>
        <p className="text-sm text-muted">
          Once you delete your account, there is no going back. This will permanently delete your account, all your polls, and all votes on your polls.
        </p>

        {confirmDelete ? (
          <div className="grid-gap" style={{ gap: "8px" }}>
            <div className="alert alert-error">
              <span style={{ fontWeight: 600 }}>⚠️ Are you absolutely sure?</span>
              <p className="text-sm" style={{ marginTop: "4px" }}>
                This action cannot be undone. All your data will be permanently deleted.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                className="btn"
                style={{
                  backgroundColor: "var(--danger, #dc2626)",
                  color: "white",
                  flex: 1
                }}
                onClick={() => void deleteAccount()}
                disabled={loading}
              >
                {loading ? "Deleting..." : "Yes, delete my account"}
              </button>
              <button
                className="btn btn-outline"
                onClick={() => setConfirmDelete(false)}
                disabled={loading}
                style={{ flex: 1 }}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            className="btn btn-outline"
            style={{
              borderColor: "var(--danger, #dc2626)",
              color: "var(--danger, #dc2626)"
            }}
            onClick={() => void deleteAccount()}
            disabled={loading}
          >
            Delete account
          </button>
        )}
      </div>
    </main>
  );
}
