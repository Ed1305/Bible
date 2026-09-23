"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useStore } from "@/lib/store";
import { readHref } from "@/lib/bible/href";

export function ReadLink({
  translation,
  book,
  chapter,
  className,
  children,
  onClick,
}: {
  translation: string;
  book: string;
  chapter: number;
  className?: string;
  children: ReactNode;
  onClick?: () => void;
}) {
  const { online } = useStore();
  const href = readHref(translation, book, chapter);
  if (!online) {
    return (
      <a href={href} className={className} onClick={onClick}>
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className={className} onClick={onClick}>
      {children}
    </Link>
  );
}
