"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { BackIcon } from "./icons";

export function Chip({
  active,
  children,
  onClick,
}: {
  active?: boolean;
  children: ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={
        "shrink-0 rounded-full px-4 py-1.5 text-[13px] font-medium transition-colors " +
        (active
          ? "bg-accent text-white shadow-soft"
          : "bg-surface-2 text-muted hover:bg-line")
      }
    >
      {children}
    </button>
  );
}

export function Segmented<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex rounded-full bg-surface-2 p-1">
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            onClick={() => onChange(o.value)}
            className={
              "flex-1 rounded-full px-3 py-2 text-[13px] font-semibold transition-all " +
              (active ? "bg-surface text-accent shadow-soft" : "text-muted")
            }
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

export function Avatar({ label }: { label: string }) {
  return (
    <div className="grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-accent to-[#3f5f92] text-sm font-semibold text-white">
      {label}
    </div>
  );
}

export function TopBar({
  title,
  backHref,
  right,
  center,
}: {
  title?: string;
  backHref?: string;
  right?: ReactNode;
  center?: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between px-4 py-3">
      <div className="flex w-10 items-center">
        {backHref && (
          <Link
            href={backHref}
            className="grid h-9 w-9 place-items-center rounded-full text-ink hover:bg-surface-2"
            aria-label="Back"
          >
            <BackIcon className="h-5 w-5" />
          </Link>
        )}
      </div>
      <div className="flex flex-1 flex-col items-center">
        {center ?? (
          <span className="text-[13px] font-semibold uppercase tracking-[0.14em] text-muted">
            {title}
          </span>
        )}
      </div>
      <div className="flex w-10 items-center justify-end">{right}</div>
    </div>
  );
}

export function Card({
  children,
  className = "",
  onClick,
}: {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={
        "rounded-[18px] border border-line bg-surface shadow-soft " + className
      }
    >
      {children}
    </div>
  );
}
