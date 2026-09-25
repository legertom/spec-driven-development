"use client";

import { Sparkles } from "lucide-react";
import { useEve } from "./EveProvider";

export function EveToggle() {
  const { open, setOpen } = useEve();
  return (
    <button
      type="button"
      className="btn btn-eve btn-sm whitespace-nowrap"
      onClick={() => setOpen(!open)}
      aria-pressed={open}
      aria-label={open ? "Close Eve" : "Ask Eve"}
    >
      <Sparkles size={15} />
      <span>Ask Eve</span>
    </button>
  );
}
