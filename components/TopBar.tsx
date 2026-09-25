"use client";

import { Leaf } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { COURSE_TITLE } from "@/lib/course";
import { EveToggle } from "./eve/EveToggle";

const LINKS = [
  { href: "/course", label: "Course" },
  { href: "/glossary", label: "Glossary" },
  { href: "/how-it-works", label: "How it works" },
  { href: "/progress", label: "Progress" },
];

export function TopBar() {
  const pathname = usePathname();
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-bg/85 backdrop-blur">
      <div className="mx-auto flex max-w-[1400px] items-center gap-4 px-4 py-2.5 sm:px-6">
        <Link href="/" className="flex items-center gap-2 font-bold">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-accent text-accent-ink">
            <Leaf size={18} />
          </span>
          <span className="hidden sm:inline">{COURSE_TITLE}</span>
          <span className="sm:hidden">SDAE</span>
        </Link>
        <nav className="ml-2 flex items-center gap-1 overflow-x-auto text-sm" aria-label="Main">
          {LINKS.map((l) => {
            const active = pathname === l.href || pathname.startsWith(l.href + "/");
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`whitespace-nowrap rounded-md px-2.5 py-1.5 ${active ? "bg-accent-soft font-semibold text-accent" : "text-muted hover:bg-surface-2 hover:text-ink"}`}
                aria-current={active ? "page" : undefined}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>
        <div className="ml-auto">
          <EveToggle />
        </div>
      </div>
    </header>
  );
}
