import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Inter, Lora } from "next/font/google";
import "./globals.css";
import Providers from "@/components/Providers";
import BottomNav from "@/components/BottomNav";
import OfflineBanner from "@/components/OfflineBanner";
import StatusBar from "@/components/StatusBar";

const inter = Inter({ subsets: ["latin"], variable: "--font-ui", display: "swap" });
const lora = Lora({ subsets: ["latin"], variable: "--font-scripture", display: "swap" });

const APP_NAME = "Lumina Bible";
const DESCRIPTION =
  "Read, listen to, and study the Holy Bible offline in English, French, Swahili, Lingala and Tshiluba. Free Bible app with reading plans, audio Bible and search.";

export const metadata: Metadata = {
  metadataBase: new URL("https://lumina-bible.app"),
  title: {
    default: `${APP_NAME} — Read & Listen to the Bible Offline`,
    template: `%s · ${APP_NAME}`,
  },
  description: DESCRIPTION,
  applicationName: APP_NAME,
  keywords: [
    "Bible", "Bible app", "offline Bible", "ESV", "audio Bible", "Bible study plan",
    "French Bible", "Swahili Bible", "Lingala Bible", "Tshiluba Bible", "Biblia", "Bible en ligne",
  ],
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: APP_NAME,
  },
  openGraph: {
    title: `${APP_NAME} — Read & Listen to the Bible Offline`,
    description: DESCRIPTION,
    type: "website",
    siteName: APP_NAME,
  },
  icons: {
    icon: "/icons/icon-192.png",
    apple: "/icons/icon-192.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#f4f7fb",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  maximumScale: 5,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${lora.variable}`}>
      <body className="bg-bg text-ink antialiased">
        <Providers>
          <OfflineBanner />
          <div className="mx-auto flex min-h-screen w-full max-w-xl flex-col bg-bg">
            <StatusBar />
            <main className="flex-1 pb-24">{children}</main>
          </div>
          <BottomNav />
        </Providers>
      </body>
    </html>
  );
}
