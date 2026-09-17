"use client";

import { useEffect, type ReactNode } from "react";
import { StoreProvider } from "@/lib/store";

export default function Providers({ children }: { children: ReactNode }) {
  useEffect(() => {
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

  return <StoreProvider>{children}</StoreProvider>;
}
