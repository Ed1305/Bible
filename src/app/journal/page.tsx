"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import { PenIcon, PlusIcon, TrashIcon } from "@/components/icons";

export default function JournalPage() {
  const { user, addJournal, deleteJournal, t } = useStore();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");

  const save = () => {
    addJournal(title, text);
    setTitle("");
    setText("");
    setOpen(false);
  };

  return (
    <div className="px-4 pt-2">
      <header className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-gold/20 text-gold">
            <PenIcon className="h-6 w-6" />
          </span>
          <div>
            <h1 className="font-serif text-2xl font-semibold leading-none text-ink">
              {t.myJournal}
            </h1>
            <p className="mt-1 text-[13px] text-muted">{user.journal.length}</p>
          </div>
        </div>
        <button
          onClick={() => setOpen((o) => !o)}
          className="flex items-center gap-1 rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white shadow-soft"
        >
          <PlusIcon className="h-4 w-4" /> {t.addNote}
        </button>
      </header>

      {open && (
        <div className="animate-pop mt-4 rounded-[18px] border border-line bg-surface p-4 shadow-soft">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title"
            className="w-full border-b border-line bg-transparent pb-2 text-[16px] font-semibold outline-none placeholder:text-muted"
          />
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={t.journalPlaceholder}
            rows={4}
            className="mt-3 w-full resize-none bg-transparent text-[15px] outline-none placeholder:text-muted"
          />
          <div className="mt-2 flex justify-end gap-2">
            <button
              onClick={() => setOpen(false)}
              className="rounded-full px-4 py-2 text-sm font-medium text-muted"
            >
              {t.stop}
            </button>
            <button
              onClick={save}
              className="rounded-full bg-accent px-5 py-2 text-sm font-semibold text-white"
            >
              {t.save}
            </button>
          </div>
        </div>
      )}

      <ul className="mt-4 space-y-2.5 pb-6">
        {user.journal.length === 0 && !open && (
          <li className="mt-14 text-center text-sm text-muted">{t.empty}</li>
        )}
        {user.journal.map((j) => (
          <li
            key={j.id}
            className="rounded-[18px] border border-line bg-surface p-4 shadow-soft"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-semibold text-ink">{j.title}</p>
                <p className="mt-1 whitespace-pre-wrap text-[14px] leading-relaxed text-ink/80">
                  {j.text}
                </p>
                <p className="mt-2 text-[11px] text-muted">
                  {new Date(j.createdAt).toLocaleString()}
                </p>
              </div>
              <button
                onClick={() => deleteJournal(j.id)}
                className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-muted hover:bg-surface-2"
                aria-label="Delete"
              >
                <TrashIcon className="h-4 w-4" />
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
