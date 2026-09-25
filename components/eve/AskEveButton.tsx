"use client";

import { Sparkles } from "lucide-react";
import { useEve } from "./EveProvider";

/** A button that opens Eve with a pre-filled question (used by glossary terms, "try" callouts, feedback cards). */
export function AskEveButton({
  prompt,
  highlight,
  label = "Ask Eve",
  size = "md",
  className = "",
}: {
  prompt: string;
  highlight?: string;
  label?: string;
  size?: "sm" | "md";
  className?: string;
}) {
  const { askWith } = useEve();
  return (
    <button
      type="button"
      className={`btn btn-eve ${size === "sm" ? "btn-sm" : ""} ${className}`}
      onClick={() => askWith(prompt, highlight)}
    >
      <Sparkles size={size === "sm" ? 13 : 15} />
      {label}
    </button>
  );
}
