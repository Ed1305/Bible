"use client";

import { useEffect, type ReactNode } from "react";
import { StoreProvider, useStore } from "@/lib/store";

function ThemeSync() {
  const { settings } = useStore();

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute("data-theme", settings.theme);
    const meta = document.querySelector('meta[name="theme-color"]');
    if (window.location.pathname.startsWith("/display")) {
      if (meta) meta.setAttribute("content", "transparent");
      return;
    }
    if (meta) {
      meta.setAttribute("content", settings.theme === "dark" ? "#11151c" : "#f4f7fb");
    }
  }, [settings.theme]);

  return null;
}

export default function Providers({ children }: { children: ReactNode }) {
  useEffect(() => {
    if (window.location.pathname.startsWith("/display")) return;
    if ("serviceWorker" in navigator) {
      const onLoad = () => {
        navigator.serviceWorker.register("/sw.js").catch(() => {
          /* ignore */
        });
      };
      if (document.readyState === "complete") onLoad();
      else window.addEventListener("load", onLoad);
      return () => window.removeEventListener("load", onLoad);
    }
  }, []);

  return (
    <StoreProvider>
      <ThemeSync />
      {children}
    </StoreProvider>
  );
}
