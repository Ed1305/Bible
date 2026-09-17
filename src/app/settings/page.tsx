"use client";

import { useCallback, useEffect, useState } from "react";
import { useStore } from "@/lib/store";
import { TRANSLATIONS } from "@/lib/bible/translations";
import { TopBar } from "@/components/ui";
import { CheckIcon, GlobeIcon, DownloadIcon, TrashIcon } from "@/components/icons";
import {
  loadManifest,
  downloadPack,
  removePack,
  getPackState,
  isPackDownloaded,
  type BibleManifest,
  type OfflineIndex,
} from "@/lib/offline";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: string }>;
}

function formatMb(bytes: number): string {
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export default function SettingsPage() {
  const { settings, setTranslation, setTextScale, t } = useStore();
  const [installEvt, setInstallEvt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  const [manifest, setManifest] = useState<BibleManifest | null>(null);
  const [index, setIndex] = useState<OfflineIndex>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [progress, setProgress] = useState<{ code: string; done: number; total: number } | null>(
    null,
  );

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setInstallEvt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);
    const installedHandler = () => setInstalled(true);
    window.addEventListener("appinstalled", installedHandler);
    if (window.matchMedia("(display-mode: standalone)").matches) setInstalled(true);
    setIsIOS(/iphone|ipad|ipod/i.test(navigator.userAgent));
    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      window.removeEventListener("appinstalled", installedHandler);
    };
  }, []);

  const refreshOfflineState = useCallback(async () => {
    const m = await loadManifest();
    setManifest(m);
    const idx: OfflineIndex = {};
    if (m) {
      for (const pack of m.packs) {
        const state = await getPackState(pack.code);
        if (state) idx[pack.code] = state;
      }
    }
    setIndex(idx);
  }, []);

  useEffect(() => {
    void refreshOfflineState();
  }, [refreshOfflineState]);

  const doInstall = async () => {
    if (!installEvt) return;
    await installEvt.prompt();
    setInstallEvt(null);
    if (window.matchMedia("(display-mode: standalone)").matches) setInstalled(true);
  };

  const onDownload = async (code: string) => {
    setBusy(code);
    setProgress({ code, done: 0, total: 1 });
    try {
      await downloadPack(code, (p) => setProgress({ code, done: p.done, total: p.total }));
    } finally {
      setBusy(null);
      setProgress(null);
      void refreshOfflineState();
    }
  };

  const onRemove = async (code: string) => {
    setBusy(code);
    try {
      await removePack(code);
    } finally {
      setBusy(null);
      void refreshOfflineState();
    }
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
              <p className="text-[12px] text-white/80">
                Android, iPhone &amp; PC — works like a native app
              </p>
            </div>
            <DownloadIcon className="h-5 w-5" />
          </button>
        )}
        {!installed && !installEvt && isIOS && (
          <div className="mb-5 rounded-[18px] border border-line bg-surface p-4 shadow-soft">
            <p className="font-semibold">{t.installApp} — iPhone / iPad</p>
            <p className="mt-1 text-[12px] leading-relaxed text-muted">
              Tap the <strong>Share</strong> button in Safari, then{" "}
              <strong>Add to Home Screen</strong>. Lumina Bible will open full-screen like a
              native app.
            </p>
          </div>
        )}
        {!installed && !installEvt && !isIOS && (
          <div className="mb-5 rounded-[18px] border border-line bg-surface p-4 shadow-soft">
            <p className="font-semibold">{t.installApp}</p>
            <p className="mt-1 text-[12px] leading-relaxed text-muted">
              Chrome / Edge: open the browser menu → “Install Lumina Bible” (or the install icon
              in the address bar). Android: same, then “Add to Home screen”.
            </p>
          </div>
        )}

        {/* Offline Bibles */}
        <div className="mb-2 flex items-center gap-2 px-1">
          <DownloadIcon className="h-4 w-4 text-verdant" />
          <h2 className="text-[13px] font-semibold uppercase tracking-wider text-muted">
            {t.offlinePacks}
          </h2>
        </div>
        <p className="mb-3 px-1 text-[12px] leading-relaxed text-muted">{t.offlinePacksHint}</p>

        <ul className="mb-6 space-y-2.5">
          {(manifest?.packs ?? []).map((pack) => {
            const state = index[pack.code];
            const done = state?.books.length ?? 0;
            const isBusy = busy === pack.code;
            const pct = progress?.code === pack.code && progress.total > 0
              ? Math.round((progress.done / progress.total) * 100)
              : Math.round((done / pack.files.length) * 100);

            return (
              <li
                key={pack.code}
                className="rounded-[18px] border border-line bg-surface p-4 shadow-soft"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-ink">{pack.label}</p>
                    <p className="text-[12px] text-muted">
                      {pack.books} {t.booksWord} · {formatMb(pack.bytes)} · {pack.licence}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {state && done < pack.files.length && !isBusy && (
                      <button
                        onClick={() => onDownload(pack.code)}
                        className="rounded-full bg-accent px-3 py-1.5 text-[12px] font-semibold text-white"
                      >
                        {t.continuePlan}
                      </button>
                    )}
                    {!state && !isBusy && (
                      <button
                        onClick={() => onDownload(pack.code)}
                        className="rounded-full bg-accent px-3 py-1.5 text-[12px] font-semibold text-white"
                      >
                        {t.downloadOffline}
                      </button>
                    )}
                    {isBusy && (
                      <span className="text-[12px] font-semibold text-accent">
                        {t.downloading}
                      </span>
                    )}
                    {state && done >= pack.files.length && !isBusy && (
                      <span className="flex items-center gap-1 rounded-full bg-verdant-soft px-2.5 py-1 text-[12px] font-semibold text-verdant">
                        <CheckIcon className="h-3.5 w-3.5" />
                        {t.downloaded}
                      </span>
                    )}
                    {state && !isBusy && (
                      <button
                        onClick={() => onRemove(pack.code)}
                        className="grid h-8 w-8 place-items-center rounded-full text-muted hover:bg-surface-2"
                        aria-label={t.remove}
                        title={t.remove}
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
                {(isBusy || (state && done > 0 && done < pack.files.length)) && (
                  <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-surface-2">
                    <div
                      className="h-full rounded-full bg-accent transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                )}
              </li>
            );
          })}
          {!manifest && (
            <li className="rounded-[18px] border border-line bg-surface p-4 text-[12px] text-muted shadow-soft">
              …
            </li>
          )}
        </ul>

        {/* Translation picker */}
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
          Lumina Bible works fully offline. Chapters you open are saved to your device
          automatically, and you can download whole translations above. Install the app for the
          best experience.
        </p>
      </div>
    </div>
  );
}
