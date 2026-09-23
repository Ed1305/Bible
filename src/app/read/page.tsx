"use client";

import { Suspense } from "react";
import ReaderView from "@/components/ReaderView";

export default function ReadPage() {
  return (
    <Suspense fallback={<div className="px-6 pt-8 text-sm text-muted">Loading…</div>}>
      <ReaderView />
    </Suspense>
  );
}
