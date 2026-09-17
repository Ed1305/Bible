"use client";

import { useStore } from "@/lib/store";
import { WifiOffIcon, RefreshIcon } from "./icons";

export default function OfflineBanner() {
  const { online, t, ready } = useStore();
  if (!ready || online) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-50 flex justify-center px-3 pt-2 safe-top">
      <div className="pointer-events-auto flex w-full max-w-xl items-center justify-between rounded-xl bg-[#2b3340] px-4 py-2 text-white shadow-float">
        <div className="flex items-center gap-2">
          <WifiOffIcon className="h-4 w-4" />
          <span className="text-xs font-semibold tracking-wide">{t.offline}</span>
        </div>
        <button
          onClick={() => location.reload()}
          className="grid h-6 w-6 place-items-center rounded-full text-white/80 hover:text-white"
          aria-label="Retry"
        >
          <RefreshIcon className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
