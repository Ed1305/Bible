"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useStore } from "@/lib/store";
import {
  HeadphonesIcon,
  BookIcon,
  SunIcon,
  HandsIcon,
  PenIcon,
} from "./icons";
import type { ComponentType, SVGProps } from "react";

type Item = {
  href: string;
  label: keyof ReturnType<typeof useLabels>;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  match: (p: string) => boolean;
};

function useLabels() {
  const { t } = useStore();
  return {
    listen: t.listen,
    bible: t.bible,
    today: t.today,
    prayers: t.prayers,
    journal: t.journal,
  };
}

const items: Item[] = [
  { href: "/listen", label: "listen", icon: HeadphonesIcon, match: (p) => p.startsWith("/listen") },
  { href: "/", label: "bible", icon: BookIcon, match: (p) => p === "/" || p.startsWith("/read") || p.startsWith("/search") || p.startsWith("/settings") },
  { href: "/today", label: "today", icon: SunIcon, match: (p) => p.startsWith("/today") },
  { href: "/prayers", label: "prayers", icon: HandsIcon, match: (p) => p.startsWith("/prayers") },
  { href: "/journal", label: "journal", icon: PenIcon, match: (p) => p.startsWith("/journal") },
];

export default function BottomNav() {
  const pathname = usePathname();
  const labels = useLabels();

  return (
    <nav className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center">
      <div className="pointer-events-auto safe-bottom w-full max-w-xl border-t border-line bg-surface/90 px-2 pb-1 pt-2 backdrop-blur-lg">
        <ul className="flex items-stretch justify-between">
          {items.map((it) => {
            const active = it.match(pathname);
            const Icon = it.icon;
            return (
              <li key={it.href} className="flex-1">
                <Link
                  href={it.href}
                  className="flex flex-col items-center gap-1 rounded-2xl px-1 py-1.5 transition-colors"
                >
                  <span
                    className={
                      active
                        ? "grid h-9 w-9 place-items-center rounded-xl bg-accent-soft text-accent"
                        : "grid h-9 w-9 place-items-center rounded-xl text-muted"
                    }
                  >
                    <Icon className="h-[22px] w-[22px]" />
                  </span>
                  <span
                    className={
                      active
                        ? "text-[11px] font-semibold text-accent"
                        : "text-[11px] text-muted"
                    }
                  >
                    {labels[it.label]}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
