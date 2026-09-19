'use client'

/**
 * /control — what the operator drives. Open it in any browser tab, or on a
 * phone. Nothing here touches OBS directly; it POSTs to /api/live-verse and
 * the /display page (polling every second) picks it up.
 *
 * No login is required here — anyone with this URL can change what's on
 * screen. That's the simplest option for launch; if you want to lock it
 * down later, put the /api/live-verse POST behind a check.
 */

import { useEffect, useState } from 'react'

type LiveVerse = {
  id: number
  reference: string
  body: string
  translation: string
  visible: boolean
  updated_at: string
}

const POLL_MS = 2000

export default function Control() {
  const [reference, setReference] = useState('')
  const [body, setBody] = useState('')
  const [translation, setTranslation] = useState('KJV')
  const [live, setLive] = useState<LiveVerse | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

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

  const push = async (visible: boolean) => {
    if (visible && !body.trim()) {
      setError('Enter the verse text first')
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
          translation: translation.trim(),
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
          translation: live?.translation ?? translation,
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
        maxWidth: 720,
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

      <label style={label}>Reference</label>
      <input
        value={reference}
        onChange={e => setReference(e.target.value)}
        placeholder="1 Kings 7:46"
        style={input}
      />

      <label style={label}>Translation</label>
      <input
        value={translation}
        onChange={e => setTranslation(e.target.value)}
        placeholder="KJV"
        style={input}
      />

      <label style={label}>Verse</label>
      <textarea
        value={body}
        onChange={e => {
          setBody(e.target.value)
          if (error) setError('')
        }}
        rows={5}
        placeholder="In the plain of Jordan did the king cast them…"
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
