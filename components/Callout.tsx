import { BookOpen, KeyRound, Lightbulb, MessageCircle, Sparkles, TriangleAlert } from "lucide-react";
import type { CalloutType } from "@/lib/markdown-plugins";
import { AskEveButton } from "./eve/AskEveButton";

const META: Record<CalloutType, { label: string; Icon: typeof Lightbulb }> = {
  example: { label: "Example", Icon: Lightbulb },
  key: { label: "Key idea", Icon: KeyRound },
  beginner: { label: "Plain English", Icon: BookOpen },
  warning: { label: "Common mistake", Icon: TriangleAlert },
  tip: { label: "Tip", Icon: Sparkles },
  try: { label: "Try it with Eve", Icon: MessageCircle },
};

export function Callout({
  type,
  title,
  text,
  children,
}: {
  type: CalloutType;
  title?: string;
  /** Plain text of the body, used to pre-fill Eve for `try` callouts. */
  text?: string;
  children: React.ReactNode;
}) {
  const meta = META[type] ?? META.example;
  const { Icon } = meta;
  return (
    <aside className={`callout callout-${type}`} role="note" aria-label={`${meta.label}${title ? `: ${title}` : ""}`}>
      <div className="callout-head">
        <Icon size={15} aria-hidden />
        <span>{meta.label}</span>
        {title ? <span className="callout-title">{title}</span> : null}
      </div>
      <div className="callout-body">{children}</div>
      {type === "try" && text ? (
        <div className="callout-actions">
          <AskEveButton prompt={text} label="Ask Eve this" size="sm" />
        </div>
      ) : null}
    </aside>
  );
}
