"use client";

import { useEffect } from "react";

const MIN_VISIBLE_MS = 900;

/**
 * Fades out the server-rendered splash (#splash in the root layout) once the
 * app has hydrated, keeping it up briefly so it doesn't just flash.
 */
export default function SplashScreen() {
  useEffect(() => {
    const el = document.getElementById("splash");
    if (!el || document.documentElement.dataset.splash === "off") return;
    const wait = Math.max(0, MIN_VISIBLE_MS - performance.now());
    let done = 0;
    const hide = window.setTimeout(() => {
      el.classList.add("is-hidden");
      // After the fade, take it out of layout for good.
      done = window.setTimeout(() => {
        document.documentElement.dataset.splash = "off";
      }, 500);
    }, wait);
    return () => {
      window.clearTimeout(hide);
      window.clearTimeout(done);
    };
  }, []);
  return null;
}
