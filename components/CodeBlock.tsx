"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";

/** Wraps a <pre> with a copy-to-clipboard button. */
export function CodeBlock({ code, children }: { code: string; children: React.ReactNode }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable (e.g. insecure context); ignore */
    }
  }
  return (
    <div className="codeblock">
      {children}
      <button type="button" className="btn btn-sm copy-btn" onClick={copy} aria-label="Copy code">
        {copied ? <Check size={14} /> : <Copy size={14} />}
        {copied ? "Copied" : "Copy"}
      </button>
    </div>
  );
}
