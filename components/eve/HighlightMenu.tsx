"use client";

import { Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useEve } from "./EveProvider";

/**
 * Shows a floating "Ask Eve" pill above any text selection inside the element
 * with the given id. Clicking it opens Eve with the selection attached.
 */
export function HighlightMenu({ containerId }: { containerId: string }) {
  const { askAbout } = useEve();
  const [pos, setPos] = useState<{ x: number; y: number; text: string } | null>(null);

  useEffect(() => {
    const container = document.getElementById(containerId);
    if (!container) return;

    function compute() {
      const sel = window.getSelection();
      if (!sel || sel.isCollapsed || sel.rangeCount === 0) return setPos(null);
      const text = sel.toString().trim();
      if (text.length < 3 || text.length > 2000) return setPos(null);
      const range = sel.getRangeAt(0);
      if (!container!.contains(range.commonAncestorContainer)) return setPos(null);
      const rect = range.getBoundingClientRect();
      if (!rect.width && !rect.height) return setPos(null);
      setPos({ x: Math.max(60, Math.min(window.innerWidth - 60, rect.left + rect.width / 2)), y: Math.max(48, rect.top - 8), text });
    }

    const later = () => window.setTimeout(compute, 10);
    const hide = () => setPos(null);
    const onSelectionChange = () => {
      const sel = window.getSelection();
      if (!sel || sel.isCollapsed) setPos(null);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") hide();
      else if (e.shiftKey && e.key.startsWith("Arrow")) later();
    };

    document.addEventListener("mouseup", later);
    document.addEventListener("touchend", later);
    document.addEventListener("selectionchange", onSelectionChange);
    document.addEventListener("keydown", onKey);
    window.addEventListener("scroll", hide, { passive: true });
    window.addEventListener("resize", hide);
    return () => {
      document.removeEventListener("mouseup", later);
      document.removeEventListener("touchend", later);
      document.removeEventListener("selectionchange", onSelectionChange);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", hide);
      window.removeEventListener("resize", hide);
    };
  }, [containerId]);

  if (!pos) return null;
  return createPortal(
    <button
      type="button"
      className="ask-pill"
      style={{ left: pos.x, top: pos.y }}
      onMouseDown={(e) => e.preventDefault()}
      onClick={() => {
        askAbout(pos.text);
        setPos(null);
        window.getSelection()?.removeAllRanges();
      }}
    >
      <Sparkles size={14} /> Ask Eve
    </button>,
    document.body,
  );
}
