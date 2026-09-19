'use client'

/**
 * /display — the OBS Browser Source.
 *
 * Nothing but the verse. Transparent background so it overlays the camera.
 * Polls /api/live-verse every second — no websockets needed for a single
 * row. An empty screen is the correct state when nothing is live.
 *
 * OBS source settings:
 *   Width  1920   Height 1080
 *   Shutdown source when not visible           UNCHECKED
 *   Refresh browser when scene becomes active  UNCHECKED
 */

import { useEffect, useRef, useState } from 'react'

type LiveVerse = {
  id: number
  reference: string
  body: string
  translation: string
  visible: boolean
  updated_at: string
}

const FADE_MS = 450
const POLL_MS = 1000

const css = `
  html, body {
    background: transparent !important;
    background-color: rgba(0,0,0,0) !important;
    margin: 0 !important;
    padding: 0 !important;
    overflow: hidden !important;
    width: 100% !important;
    height: 100% !important;
  }

  .stage {
    position: fixed;
    inset: 0;
    pointer-events: none;
    background: transparent;
  }

  .panel {
    position: absolute;
    left: 4.5%;
    right: 4.5%;
    bottom: 6.5%;
    display: flex;
    align-items: stretch;
    border-radius: 8px;
    background: linear-gradient(90deg,
        rgba(14,26,48,0.96) 0%,
        rgba(27,44,76,0.94) 55%,
        rgba(27,44,76,0.86) 100%);
    opacity: 0;
    transform: translateY(24px);
    transition: opacity ${FADE_MS}ms ease,
                transform ${FADE_MS}ms cubic-bezier(.16,.84,.44,1);
    will-change: opacity, transform;
    box-shadow: 0 18px 40px rgba(0,0,0,0.28);
  }
  .panel.on { opacity: 1; transform: translateY(0); }

  .bar {
    width: 9px;
    flex: none;
    border-radius: 8px 0 0 8px;
    background: linear-gradient(180deg, #E4BC72, #A8792C);
  }

  .inner { padding: 28px 48px 32px 36px; }

  .reference {
    font-family: Georgia, 'Times New Roman', serif;
    font-size: 28px;
    letter-spacing: 4px;
    text-transform: uppercase;
    color: #E4BC72;
    white-space: nowrap;
  }

  .translation {
    font-family: Georgia, 'Times New Roman', serif;
    font-size: 20px;
    letter-spacing: 2px;
    color: rgba(240,230,210,0.55);
    margin-left: 16px;
  }

  .body {
    font-family: Georgia, 'Times New Roman', serif;
    font-size: 42px;
    line-height: 1.35;
    color: #F6EEE0;
    margin-top: 12px;
    white-space: pre-wrap;
    word-spacing: 0.06em;
  }
`

export default function Display() {
  const [shown, setShown] = useState<LiveVerse | null>(null)
  const [on, setOn] = useState(false)

  const shownRef = useRef<LiveVerse | null>(null)
  const latestRef = useRef<LiveVerse | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    let dead = false

    const show = (row: LiveVerse | null) => {
      shownRef.current = row
      setShown(row)
    }

    // Two frames, so the browser paints the faded-out state before the
    // class flips. One frame is not reliably enough in CEF (OBS's browser).
    const fadeIn = () =>
      requestAnimationFrame(() =>
        requestAnimationFrame(() => {
          if (!dead) setOn(true)
        })
      )

    const apply = (row: LiveVerse) => {
      if (dead) return

      const prev = latestRef.current
      if (prev && prev.updated_at === row.updated_at) return
      latestRef.current = row

      if (timerRef.current) clearTimeout(timerRef.current)

      // Hide.
      if (!row.visible || !row.body.trim()) {
        setOn(false)
        timerRef.current = setTimeout(() => show(null), FADE_MS)
        return
      }

      // Nothing on screen — fade the new verse straight in.
      if (!shownRef.current) {
        show(row)
        fadeIn()
        return
      }

      // Same words, just a metadata touch — leave it alone.
      if (
        shownRef.current.body === row.body &&
        shownRef.current.reference === row.reference
      ) {
        return
      }

      // Swap: fade out, change the words, fade back in.
      setOn(false)
      timerRef.current = setTimeout(() => {
        show(row)
        fadeIn()
      }, FADE_MS)
    }

    const load = async () => {
      try {
        const res = await fetch('/api/live-verse', { cache: 'no-store' })
        if (!res.ok) return
        const data = await res.json()
        if (data) apply(data as LiveVerse)
      } catch {
        // Network hiccup — next poll picks it up.
      }
    }

    load()
    const poll = setInterval(load, POLL_MS)

    return () => {
      dead = true
      clearInterval(poll)
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <div className="stage">
        {shown && (
          <div className={`panel${on ? ' on' : ''}`}>
            <div className="bar" />
            <div className="inner">
              <div>
                <span className="reference">{shown.reference}</span>
                {shown.translation && (
                  <span className="translation">{shown.translation}</span>
                )}
              </div>
              <div className="body">{shown.body}</div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
