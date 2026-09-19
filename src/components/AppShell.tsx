"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import BottomNav from "./BottomNav";
import OfflineBanner from "./OfflineBanner";
import StatusBar from "./StatusBar";

export default function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const overlay = pathname === "/display";

  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;
    if (!overlay) {
      root.removeAttribute("data-overlay");
      return;
    }

    root.setAttribute("data-overlay", "1");
    body.style.background = "transparent";
    return () => {
      root.removeAttribute("data-overlay");
      body.style.background = "";
    };
  }, [overlay]);

  if (overlay) return <>{children}</>;

  return (
    <>
      <OfflineBanner />
      <div className="mx-auto flex min-h-screen w-full max-w-xl flex-col bg-bg">
        <StatusBar />
        <main className="flex-1 pb-24">{children}</main>
      </div>
      <BottomNav />
    </>
  );
}
