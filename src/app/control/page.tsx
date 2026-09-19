'use client'

/**
 * /control — what the operator drives. Pick translation, book, chapter and
 * verse(s); the text is looked up from the app's own /api/chapter endpoint
 * (same data source the reader uses, including its offline-pack fallback)
 * rather than typed by hand. Reference/body stay editable afterward in case
 * you want to trim or annotate before pushing.
 */

import { useEffect, useMemo, useState } from 'react'
import { BOOKS } from '@/lib/bible/books'
import { TRANSLATIONS, getTranslation } from '@/lib/bible/translations'

type LiveVerse = {
  id: number
  reference: string
  body: string
  translation: string
  visible: boolean
  updated_at: string
}

type ChapterVerse = { verse: number; heading: string | null; text: string }

const POLL_MS = 2000

export default function Control() {
  const [translationCode, setTranslationCode] = useState('ESV')
  const [bookSlug, setBookSlug] = useState('john')
  const [chapter, setChapter] = useState(3)
  const [chapterVerses, setChapterVerses] = useState<ChapterVerse[]>([])
  const [loadingChapter, setLoadingChapter] = useState(false)
  const [startVerse, setStartVerse] = useState(16)
  const [endVerse, setEndVerse] = useState<number | ''>('')

  const [reference, setReference] = useState('')
  const [body, setBody] = useState('')

  const [live, setLive] = useState<LiveVerse | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const book = useMemo(() => BOOKS.find(b => b.slug === bookSlug), [bookSlug])
  const lang = useMemo(() => getTranslation(translationCode).lang, [translationCode])
  const displayName = book ? book.names[lang] ?? book.names.en : bookSlug

  // Poll what's currently live, to show status + let /display stay in sync.
  useEffect(() => {
    let dead = false
    const load = async () => {
      try {
        const res = await fetch('/api/live-verse', { cache: 'no-store' })
        if (!res.ok) return
        const data = await res.json()
        if (!dead && data) setLive(data as LiveVerse)
      } catch {
        // next poll picks it up
      }
    }
    load()
    const poll = setInterval(load, POLL_MS)
    return () => {
      dead = true
      clearInterval(poll)
    }
  }, [])

  // Fetch the chapter whenever translation/book/chapter changes.
  useEffect(() => {
    let dead = false
    setLoadingChapter(true)
    fetch(`/api/chapter?translation=${translationCode}&book=${bookSlug}&chapter=${chapter}`)
      .then(res => res.json())
      .then(data => {
        if (dead) return
        const vs: ChapterVerse[] = data.verses ?? []
        setChapterVerses(vs)
        setStartVerse(v => (vs.some(x => x.verse === v) ? v : (vs[0]?.verse ?? 1)))
      })
      .catch(() => {
        if (!dead) setChapterVerses([])
      })
      .finally(() => {
        if (!dead) setLoadingChapter(false)
      })
    return () => {
      dead = true
    }
  }, [translationCode, bookSlug, chapter])

  // Recompute reference + body whenever the selection changes.
  useEffect(() => {
    if (chapterVerses.length === 0) return
    const from = startVerse
    const to = endVerse === '' ? from : Math.max(from, Number(endVerse))
    const picked = chapterVerses.filter(v => v.verse >= from && v.verse <= to)
    if (picked.length === 0) return

    const ref =
      to > from
        ? `${displayName} ${chapter}:${from}-${to}`
        : `${displayName} ${chapter}:${from}`
    setReference(ref)
    setBody(picked.map(v => v.text).join(' '))
  }, [chapterVerses, startVerse, endVerse, chapter, displayName])

  const push = async (visible: boolean) => {
    if (visible && !body.trim()) {
      setError('Pick a verse first')
      return
    }
    setError('')
    setBusy(true)
    try {
      const res = await fetch('/api/live-verse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reference: reference.trim(),
          body: body.trim(),
          translation: translationCode,
          visible,
        }),
      })
      if (!res.ok) throw new Error('Save failed')
      const data = await res.json()
      setLive(data as LiveVerse)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed')
    }
    setBusy(false)
  }

  const hide = async () => {
    setBusy(true)
    try {
      const res = await fetch('/api/live-verse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reference: live?.reference ?? '',
          body: live?.body ?? '',
          translation: live?.translation ?? translationCode,
          visible: false,
        }),
      })
      if (res.ok) setLive((await res.json()) as LiveVerse)
    } catch {
      setError('Clear failed')
    }
    setBusy(false)
  }

  return (
    <main
      style={{
        maxWidth: 760,
        margin: '0 auto',
        padding: '32px 20px 80px',
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      <h1 style={{ fontFamily: 'Georgia, serif', fontWeight: 400, fontSize: 28 }}>
        Scripture on screen
      </h1>

      <div
        style={{
          margin: '20px 0 28px',
          padding: '14px 16px',
          borderRadius: 8,
          background: live?.visible ? '#123' : '#eee',
          color: live?.visible ? '#F0E6D2' : '#555',
          fontSize: 15,
          lineHeight: 1.5,
        }}
      >
        {live?.visible ? (
          <>
            <strong>On screen now:</strong> {live.reference || '(no reference)'}
            <div style={{ opacity: 0.75, marginTop: 4 }}>
              {live.body.slice(0, 90)}
              {live.body.length > 90 ? '…' : ''}
            </div>
          </>
        ) : (
          'Nothing on screen'
        )}
      </div>

      {/* --- Pickers --- */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div>
          <label style={label}>Translation</label>
          <select
            value={translationCode}
            onChange={e => setTranslationCode(e.target.value)}
            style={input}
          >
            {TRANSLATIONS.map(t => (
              <option key={t.code} value={t.code}>
                {t.abbr} — {t.language}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label style={label}>Book</label>
          <select
            value={bookSlug}
            onChange={e => {
              setBookSlug(e.target.value)
              setChapter(1)
            }}
            style={input}
          >
            <optgroup label="Old Testament">
              {BOOKS.filter(b => b.testament === 'OT').map(b => (
                <option key={b.slug} value={b.slug}>
                  {b.names[lang] ?? b.names.en}
                </option>
              ))}
            </optgroup>
            <optgroup label="New Testament">
              {BOOKS.filter(b => b.testament === 'NT').map(b => (
                <option key={b.slug} value={b.slug}>
                  {b.names[lang] ?? b.names.en}
                </option>
              ))}
            </optgroup>
          </select>
        </div>

        <div>
          <label style={label}>Chapter</label>
          <select
            value={chapter}
            onChange={e => setChapter(Number(e.target.value))}
            style={input}
          >
            {Array.from({ length: book?.chapters ?? 1 }, (_, i) => i + 1).map(c => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <div style={{ flex: 1 }}>
            <label style={label}>Verse</label>
            <select
              value={startVerse}
              onChange={e => setStartVerse(Number(e.target.value))}
              style={input}
              disabled={loadingChapter || chapterVerses.length === 0}
            >
              {chapterVerses.map(v => (
                <option key={v.verse} value={v.verse}>
                  {v.verse}
                </option>
              ))}
            </select>
          </div>
          <div style={{ flex: 1 }}>
            <label style={label}>To (optional)</label>
            <select
              value={endVerse}
              onChange={e => setEndVerse(e.target.value === '' ? '' : Number(e.target.value))}
              style={input}
              disabled={loadingChapter || chapterVerses.length === 0}
            >
              <option value="">—</option>
              {chapterVerses
                .filter(v => v.verse >= startVerse)
                .map(v => (
                  <option key={v.verse} value={v.verse}>
                    {v.verse}
                  </option>
                ))}
            </select>
          </div>
        </div>
      </div>

      {loadingChapter && (
        <p style={{ fontSize: 13, color: '#888', marginTop: 8 }}>Loading chapter…</p>
      )}

      {/* --- Preview / manual tweak --- */}
      <label style={{ ...label, marginTop: 24 }}>Reference</label>
      <input value={reference} onChange={e => setReference(e.target.value)} style={input} />

      <label style={label}>Verse text</label>
      <textarea
        value={body}
        onChange={e => {
          setBody(e.target.value)
          if (error) setError('')
        }}
        rows={5}
        style={{ ...input, resize: 'vertical', lineHeight: 1.5 }}
      />

      {error && (
        <div style={{ color: '#b3261e', fontSize: 14, marginTop: -8, marginBottom: 12 }}>
          {error}
        </div>
      )}

      <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
        <button onClick={() => push(true)} disabled={busy} style={primary}>
          {live?.visible ? 'Replace on screen' : 'Show on screen'}
        </button>
        <button onClick={hide} disabled={busy || !live?.visible} style={secondary}>
          Clear
        </button>
      </div>

      <p style={{ fontSize: 13, color: '#777', marginTop: 28, lineHeight: 1.6 }}>
        Changes appear on the stream within about a second. Clearing fades the
        panel away without touching OBS.
      </p>
    </main>
  )
}

const label: React.CSSProperties = {
  display: 'block',
  fontSize: 13,
  letterSpacing: 1,
  textTransform: 'uppercase',
  color: '#666',
  margin: '18px 0 6px',
}

const input: React.CSSProperties = {
  width: '100%',
  padding: '12px 14px',
  fontSize: 17,
  border: '1px solid #ccc',
  borderRadius: 8,
  fontFamily: 'inherit',
  boxSizing: 'border-box',
  marginBottom: 12,
  background: '#fff',
}

const primary: React.CSSProperties = {
  flex: 1,
  padding: '16px 20px',
  fontSize: 17,
  border: 'none',
  borderRadius: 8,
  background: '#16233D',
  color: '#F0E6D2',
  cursor: 'pointer',
}

const secondary: React.CSSProperties = {
  padding: '16px 24px',
  fontSize: 17,
  border: '1px solid #ccc',
  borderRadius: 8,
  background: '#fff',
  color: '#333',
  cursor: 'pointer',
}