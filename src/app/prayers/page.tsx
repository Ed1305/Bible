"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import { HandsIcon, PlusIcon, CheckIcon, TrashIcon } from "@/components/icons";

export default function PrayersPage() {
  const { user, addPrayer, togglePrayer, deletePrayer, t } = useStore();
  const [text, setText] = useState("");

  const submit = () => {
    addPrayer(text);
    setText("");
  };

  return (
    <div className="px-4 pt-2">
      <header className="flex items-center gap-3 pt-1">
        <span className="grid h-11 w-11 place-items-center rounded-2xl bg-verdant-soft text-verdant">
          <HandsIcon className="h-6 w-6" />
        </span>
        <div>
          <h1 className="font-serif text-2xl font-semibold leading-none text-ink">
            {t.myPrayers}
          </h1>
          <p className="mt-1 text-[13px] text-muted">
            {user.prayers.length} · {user.prayers.filter((p) => p.answered).length} {t.answered.toLowerCase()}
          </p>
        </div>
      </header>

      <div className="mt-4 flex items-end gap-2 rounded-[18px] border border-line bg-surface p-3 shadow-soft">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={t.prayerPlaceholder}
          rows={2}
          className="flex-1 resize-none bg-transparent text-[15px] outline-none placeholder:text-muted"
        />
        <button
          onClick={submit}
          disabled={!text.trim()}
          className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-accent text-white disabled:opacity-40"
          aria-label={t.addPrayer}
        >
          <PlusIcon className="h-5 w-5" />
        </button>
      </div>

      <ul className="mt-4 space-y-2.5 pb-6">
        {user.prayers.length === 0 && (
          <li className="mt-14 text-center text-sm text-muted">{t.empty}</li>
        )}
        {user.prayers.map((p) => (
          <li
            key={p.id}
            className="flex items-start gap-3 rounded-[18px] border border-line bg-surface p-4 shadow-soft"
          >
            <button
              onClick={() => togglePrayer(p.id)}
              className={
                "mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full border transition " +
                (p.answered
                  ? "border-verdant bg-verdant text-white"
                  : "border-line text-transparent")
              }
              aria-label={t.answered}
            >
              <CheckIcon className="h-4 w-4" />
            </button>
            <div className="min-w-0 flex-1">
              <p className={"text-[15px] " + (p.answered ? "text-muted line-through" : "text-ink")}>
                {p.text}
              </p>
              <p className="mt-1 text-[11px] text-muted">
                {new Date(p.createdAt).toLocaleDateString()}
                {p.answered && ` · ${t.answered}`}
              </p>
            </div>
            <button
              onClick={() => deletePrayer(p.id)}
              className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-muted hover:bg-surface-2"
              aria-label="Delete"
            >
              <TrashIcon className="h-4 w-4" />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
