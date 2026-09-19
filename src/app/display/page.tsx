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
    margin: 0;
    padding: 0;
    overflow: hidden;
    width: 1920px;
    height: 1080px;
  }

  .stage {
    position: absolute;
    left: 96px;
    right: 96px;
    bottom: 96px;
    display: flex;
    justify-content: flex-start;
  }

  .panel {
    display: flex;
    align-items: stretch;
    max-width: 1560px;
    border-radius: 6px;
    background: linear-gradient(90deg,
        rgba(14,26,48,0.96) 0%,
        rgba(27,44,76,0.94) 55%,
        rgba(27,44,76,0.86) 100%);
    opacity: 0;
    transform: translateX(-40px);
    transition: opacity ${FADE_MS}ms ease,
                transform ${FADE_MS}ms cubic-bezier(.16,.84,.44,1);
    will-change: opacity, transform;
  }
  .panel.on { opacity: 1; transform: translateX(0); }

  .bar {
    width: 9px;
    flex: none;
    border-radius: 6px 0 0 6px;
    background: linear-gradient(180deg, #E4BC72, #A8792C);
  }

  .inner { padding: 34px 58px 38px 40px; }

  .reference {
    font-family: Georgia, 'Times New Roman', serif;
    font-size: 34px;
    letter-spacing: 5px;
    text-transform: uppercase;
    color: #E4BC72;
    white-space: nowrap;
  }

  .translation {
    font-family: Georgia, 'Times New Roman', serif;
    font-size: 24px;
    letter-spacing: 3px;
    color: rgba(240,230,210,0.55);
    margin-left: 18px;
  }

  .body {
    font-family: Georgia, 'Times New Roman', serif;
    font-size: 50px;
    line-height: 1.34;
    color: #F6EEE0;
    margin-top: 16px;
    max-width: 1440px;
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
