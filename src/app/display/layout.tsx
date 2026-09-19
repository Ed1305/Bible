import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Scripture overlay",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "transparent",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function DisplayLayout({ children }: { children: ReactNode }) {
  return children;
}
