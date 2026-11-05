"use client";

import { useEffect, useState } from "react";
import { RefreshIcon } from "./icons";

const CURRENT = process.env.NEXT_PUBLIC_APP_VERSION ?? "dev";
const CHECK_EVERY_MS = 60_000;
const TRIED_KEY = "bible.updateTried";

/** True while the person is typing, so a reload would lose their text. */
function isEditing(): boolean {
  const el = document.activeElement as HTMLElement | null;
  if (!el) return false;
  return el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable;
}

/**
 * Picks up a new deployment as soon as it's live: compares the build this page
 * was served from with the one the server is running, and reloads onto the new
 * one (or offers a Refresh button while the person is typing).
 */
export default function UpdateWatcher() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let stopped = false;

    const apply = (version: string) => {
      let tried: string | null = null;
      try {
        tried = sessionStorage.getItem(TRIED_KEY);
      } catch {
        /* ignore */
      }
      // Already reloaded once for this version and still behind: don't loop.
      if (tried === version || isEditing()) {
        setReady(true);
        return;
      }
      try {
        sessionStorage.setItem(TRIED_KEY, version);
      } catch {
        /* ignore */
      }
      window.location.reload();
    };

    const check = async () => {
      if (stopped || !navigator.onLine || document.visibilityState === "hidden") return;
      try {
        const res = await fetch("/api/version", { cache: "no-store" });
        if (!res.ok) return;
        const { version } = (await res.json()) as { version?: string };
        if (version && version !== "dev" && version !== CURRENT) apply(version);
      } catch {
        /* offline or server unreachable: try again later */
      }
    };

    const onVisible = () => {
      if (document.visibilityState === "visible") void check();
    };
    const first = window.setTimeout(check, 2000);
    const timer = window.setInterval(check, CHECK_EVERY_MS);
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("online", check);
    window.addEventListener("focus", check);
    return () => {
      stopped = true;
      window.clearTimeout(first);
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("online", check);
      window.removeEventListener("focus", check);
    };
  }, []);

  if (!ready) return null;
  return (
    <div className="safe-top pointer-events-none fixed inset-x-0 top-0 z-[60] flex justify-center px-4 pt-3">
      <div
        role="status"
        className="animate-pop pointer-events-auto flex items-center gap-3 rounded-full bg-navy py-2 pl-4 pr-2 text-sm text-white shadow-float"
      >
        <span>A new version of Lumina Bible is ready</span>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="flex items-center gap-1.5 rounded-full bg-accent px-3 py-1.5 text-[13px] font-semibold"
        >
          <RefreshIcon className="h-4 w-4" />
          Refresh
        </button>
      </div>
    </div>
  );
}
