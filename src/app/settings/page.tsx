"use client";

import { useEffect, useState } from "react";
import { useStore } from "@/lib/store";
import { TRANSLATIONS } from "@/lib/bible/translations";
import { TopBar } from "@/components/ui";
import { CheckIcon, GlobeIcon, DownloadIcon } from "@/components/icons";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: string }>;
}

export default function SettingsPage() {
  const { settings, setTranslation, setTextScale, t } = useStore();
  const [installEvt, setInstallEvt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setInstallEvt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);
    const installedHandler = () => setInstalled(true);
    window.addEventListener("appinstalled", installedHandler);
    if (window.matchMedia("(display-mode: standalone)").matches) setInstalled(true);
    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      window.removeEventListener("appinstalled", installedHandler);
    };
  }, []);

  const doInstall = async () => {
    if (!installEvt) return;
    await installEvt.prompt();
    setInstallEvt(null);
  };

  return (
    <div>
      <TopBar title={t.settings} backHref="/" />

      <div className="px-4 pb-8">
        {/* Install */}
        {!installed && installEvt && (
          <button
            onClick={doInstall}
            className="mb-5 flex w-full items-center justify-between rounded-[18px] bg-gradient-to-r from-verdant to-[#559277] p-4 text-white shadow-soft"
          >
            <div className="text-left">
              <p className="font-semibold">{t.installApp}</p>
              <p className="text-[12px] text-white/80">Add Lumina Bible to your home screen</p>
            </div>
            <DownloadIcon className="h-5 w-5" />
          </button>
        )}

        <div className="mb-2 flex items-center gap-2 px-1">
          <GlobeIcon className="h-4 w-4 text-accent" />
          <h2 className="text-[13px] font-semibold uppercase tracking-wider text-muted">
            {t.chooseTranslation}
          </h2>
        </div>

        <ul className="space-y-2.5">
          {TRANSLATIONS.map((tr) => {
            const active = settings.translation === tr.code;
            return (
              <li key={tr.code}>
                <button
                  onClick={() => setTranslation(tr.code)}
                  className={
                    "flex w-full items-center justify-between rounded-[18px] border bg-surface p-4 text-left shadow-soft transition " +
                    (active ? "border-accent ring-1 ring-accent" : "border-line")
                  }
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={
                        "grid h-11 w-11 place-items-center rounded-xl text-[13px] font-bold " +
                        (active ? "bg-accent text-white" : "bg-surface-2 text-muted")
                      }
                    >
                      {tr.abbr}
                    </span>
                    <div>
                      <p className="font-semibold text-ink">{tr.name}</p>
                      <p className="text-[12px] text-muted">{tr.language}</p>
                    </div>
                  </div>
                  {active && (
                    <span className="grid h-6 w-6 place-items-center rounded-full bg-accent text-white">
                      <CheckIcon className="h-4 w-4" />
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>

        {/* Text size */}
        <div className="mt-6 rounded-[18px] border border-line bg-surface p-4 shadow-soft">
          <p className="mb-3 text-[13px] font-semibold uppercase tracking-wider text-muted">
            {t.textSize}
          </p>
          <div className="flex items-center gap-3">
            <span className="text-sm">A</span>
            <input
              type="range"
              min={0.85}
              max={1.6}
              step={0.05}
              value={settings.textScale}
              onChange={(e) => setTextScale(Number(e.target.value))}
              className="flex-1 accent-[var(--accent)]"
            />
            <span className="text-xl">A</span>
          </div>
          <p
            className="scripture mt-3 border-t border-line pt-3"
            style={{ fontSize: `${17 * settings.textScale}px` }}
          >
            <span className="verse-num">1</span>
            In the beginning God created the heavens and the earth.
          </p>
        </div>

        <p className="mt-6 px-1 text-center text-[12px] leading-relaxed text-muted">
          Lumina Bible works fully offline. Chapters you open are saved to your
          device automatically. Install the app for the best experience.
        </p>
      </div>
    </div>
  );
}
