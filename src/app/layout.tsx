import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import Providers from "@/components/Providers";
import AppShell from "@/components/AppShell";
import SplashScreen from "@/components/SplashScreen";

// Show the splash once per visit, and never on the OBS overlay.
const SPLASH_SCRIPT = `(function(){try{var d=document.documentElement;if(location.pathname.indexOf("/display")===0||sessionStorage.getItem("bible.splash")){d.setAttribute("data-splash","off");}else{sessionStorage.setItem("bible.splash","1");}}catch(e){}})();`;

const THEME_SCRIPT = `(function(){try{var s=JSON.parse(localStorage.getItem("bible.settings")||"{}");if(s.theme==="dark"){document.documentElement.setAttribute("data-theme","dark");}}catch(e){}})();`;


const APP_NAME = "Lumina Bible";

// iOS launch images (public/splash), one per portrait screen: [css width, css height, pixel ratio].
const APPLE_SPLASH: [number, number, number][] = [
  [430, 932, 3],
  [393, 852, 3],
  [428, 926, 3],
  [390, 844, 3],
  [375, 812, 3],
  [414, 896, 3],
  [414, 896, 2],
  [414, 736, 3],
  [375, 667, 2],
  [320, 568, 2],
  [1024, 1366, 2],
  [834, 1194, 2],
  [820, 1180, 2],
  [810, 1080, 2],
  [744, 1133, 2],
];

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
    startupImage: APPLE_SPLASH.map(([w, h, dpr]) => ({
      url: `/splash/apple-splash-${w * dpr}x${h * dpr}.png`,
      media: `(device-width: ${w}px) and (device-height: ${h}px) and (-webkit-device-pixel-ratio: ${dpr}) and (orientation: portrait)`,
    })),
  },
  openGraph: {
    title: `${APP_NAME} — Read & Listen to the Bible Offline`,
    description: DESCRIPTION,
    type: "website",
    siteName: APP_NAME,
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icons/icon.svg", type: "image/svg+xml" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#1c2140",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  maximumScale: 5,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
        <script dangerouslySetInnerHTML={{ __html: SPLASH_SCRIPT }} />
      </head>
      <body className="bg-bg text-ink antialiased">
        <div id="splash" className="splash" aria-hidden="true">
          {/* eslint-disable-next-line @next/next/no-img-element -- must paint before JS loads */}
          <img src="/icons/icon-512.png" alt="" className="splash-icon" width={132} height={132} />
          <p className="splash-name">{APP_NAME}</p>
          <p className="splash-tagline">Read · Listen · Offline</p>
          <div className="splash-dots"><span /><span /><span /></div>
        </div>
        <SplashScreen />
        <Providers>
          <AppShell>{children}</AppShell>
        </Providers>
      </body>
    </html>
  );
}
