"use client";

import { useState } from "react";

export default function CopyLinkButton({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  async function copyToClipboard() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  }

  return (
    <button
      className="btn btn-outline"
      onClick={() => void copyToClipboard()}
      type="button"
      style={{ minHeight: "40px", padding: "8px 16px" }}
    >
      {copied ? "✓ Copied!" : "Copy link"}
    </button>
  );
}
