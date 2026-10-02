'use client'

/**
 * /display?layout=split — full-screen "scripture reading" layout for OBS.
 *
 * Assembly of Saints banner on top, a see-through window on the left for the
 * camera (put the camera source BELOW this browser source in OBS), and a white
 * panel on the right that shows whatever verse /control sends live.
 *
 * OBS Browser Source: URL …/display?layout=split, Width 1920, Height 1080.
 * Camera: Edit Transform → Bounding Box "Scale to outer bounds", 900 × 796,
 * position 48, 196, "Crop to bounding box" ticked.
 */

import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Cinzel, Montserrat } from 'next/font/google'

const cinzel = Cinzel({ subsets: ['latin'], weight: ['700'] })
const montserrat = Montserrat({ subsets: ['latin'], weight: ['500', '600', '700', '800'] })

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
const MAX_FONT = 54
const MIN_FONT = 28

/** Camera window. The page is cut out here so the camera underneath shows through. */
const CAM = { x: 48, y: 196, w: 900, h: 796, r: 16 }
const HOLE = (() => {
  const { x, y, w, h, r } = CAM
  return `M0 0H1920V1080H0Z M${x + r} ${y} H${x + w - r} A${r} ${r} 0 0 1 ${x + w} ${y + r} V${y + h - r} A${r} ${r} 0 0 1 ${x + w - r} ${y + h} H${x + r} A${r} ${r} 0 0 1 ${x} ${y + h - r} V${y + r} A${r} ${r} 0 0 1 ${x + r} ${y} Z`
})()

const BOKEH: Array<[number, number, number, number]> = [
  [1250, 90, 26, 0.55], [1420, 40, 14, 0.7], [1560, 130, 34, 0.35], [1700, 70, 18, 0.6],
  [1800, 150, 10, 0.8], [1100, 40, 12, 0.6], [980, 140, 20, 0.4], [1340, 160, 9, 0.8],
  [1640, 30, 8, 0.9], [1880, 60, 22, 0.4], [620, 30, 10, 0.5], [760, 120, 16, 0.35],
  [300, 1040, 12, 0.5], [900, 1050, 18, 0.35], [1500, 1040, 10, 0.5], [1200, 1060, 8, 0.7],
]

const css = `
  html, body {
    background: transparent !important;
    margin: 0 !important; padding: 0 !important;
    overflow: hidden !important;
  }
  .ss-root { position: fixed; left: 0; top: 0; width: 1920px; height: 1080px; pointer-events: none;
    transform-origin: 0 0; }
  .ss-bg { position: absolute; inset: 0; clip-path: path(evenodd, "${HOLE}");
    background:
      radial-gradient(1200px 600px at 78% -10%, rgba(216,180,90,.28), transparent 60%),
      radial-gradient(900px 700px at 10% 110%, rgba(40,80,170,.45), transparent 60%),
      linear-gradient(160deg, #0d1f47 0%, #0a1733 45%, #070f24 100%); }
  .ss-rays { position: absolute; inset: 0; background: conic-gradient(from 200deg at 85% -5%,
      transparent 0deg, rgba(243,220,149,.07) 8deg, transparent 16deg, rgba(243,220,149,.05) 26deg,
      transparent 34deg, rgba(243,220,149,.06) 46deg, transparent 56deg); }
  .ss-dot { position: absolute; border-radius: 50%; filter: blur(1.5px);
    background: radial-gradient(circle, rgba(243,220,149,.9), rgba(216,180,90,.25) 45%, transparent 70%); }
  .ss-head { position: absolute; left: 60px; top: 34px; display: flex; align-items: center; gap: 26px; }
  .ss-mark { width: 96px; height: 96px; border-radius: 50%; border: 3px solid #d8b45a;
    display: grid; place-items: center; box-shadow: inset 0 0 30px rgba(216,180,90,.35);
    font-size: 40px; color: #f3dc95; letter-spacing: 2px; }
  .ss-title { font-size: 62px; line-height: 1; letter-spacing: 3px; color: #fff;
    background: linear-gradient(180deg, #fff 30%, #f3dc95 100%); -webkit-background-clip: text;
    background-clip: text; -webkit-text-fill-color: transparent; }
  .ss-sub { font-weight: 600; font-size: 22px; letter-spacing: 15px; color: #d8b45a; margin-top: 10px; padding-left: 4px; }
  .ss-pill { position: absolute; right: 48px; top: 62px; padding: 16px 34px; border-radius: 999px;
    background: linear-gradient(180deg, #f0d48a, #c99d3f); color: #0a1733; font-weight: 800;
    font-size: 26px; letter-spacing: 5px; box-shadow: 0 8px 24px rgba(0,0,0,.35); }
  .ss-camborder { position: absolute; left: ${CAM.x - 4}px; top: ${CAM.y - 4}px; width: ${CAM.w + 8}px;
    height: ${CAM.h + 8}px; border: 4px solid #d8b45a; border-radius: ${CAM.r + 4}px; box-sizing: border-box; }
  .ss-panel { position: absolute; left: 972px; top: 196px; width: 900px; height: 796px; border-radius: 16px;
    background: #fff; overflow: hidden; box-shadow: 0 10px 40px rgba(0,0,0,.45); }
  .ss-bar { height: 10px; background: linear-gradient(90deg, #c99d3f, #f3dc95, #c99d3f); }
  .ss-label { position: absolute; left: 64px; top: 52px; font-weight: 700; font-size: 20px; letter-spacing: 6px; color: #a8822c; }
  .ss-rule { position: absolute; left: 64px; top: 90px; width: 120px; height: 3px; background: #d8b45a; }
  .ss-text { position: absolute; left: 64px; right: 64px; top: 150px; bottom: 56px; display: flex;
    flex-direction: column; opacity: 0; transform: translateY(18px);
    transition: opacity ${FADE_MS}ms ease, transform ${FADE_MS}ms cubic-bezier(.16,.84,.44,1); }
  .ss-text.on { opacity: 1; transform: translateY(0); }
  .ss-verse { flex: 1; min-height: 0; overflow: hidden; font-weight: 600; line-height: 1.32;
    color: #111827; white-space: pre-wrap; word-spacing: .04em; }
  .ss-ref { flex: none; text-align: right; font-weight: 700; font-size: 34px; color: #0a1733; margin-top: 24px; }
  .ss-foot { position: absolute; left: 0; right: 0; bottom: 0; height: 70px; display: flex; align-items: center;
    justify-content: space-between; padding: 0 56px; border-top: 2px solid rgba(216,180,90,.7);
    background: linear-gradient(180deg, rgba(5,11,26,.9), #050b1a); }
  .ss-foot-l { font-weight: 600; font-size: 20px; letter-spacing: 6px; color: #d8b45a; }
  .ss-foot-r { display: flex; align-items: center; gap: 16px; font-weight: 700; font-size: 24px; letter-spacing: 4px; color: #fff; }
  .ss-foot-dot { width: 30px; height: 30px; border-radius: 50%; border: 3px solid #d8b45a; display: grid;
    place-items: center; font-size: 13px; color: #f3dc95; }
`

export default function ScriptureSplit() {
  const [shown, setShown] = useState<LiveVerse | null>(null)
  const [on, setOn] = useState(false)
  const [fontSize, setFontSize] = useState(MAX_FONT)
  const [scale, setScale] = useState(1)

  const shownRef = useRef<LiveVerse | null>(null)
  const latestRef = useRef<LiveVerse | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const verseRef = useRef<HTMLDivElement | null>(null)

  // Same polling and fade behaviour as the lower third.
  useEffect(() => {
    let dead = false
    const show = (row: LiveVerse | null) => {
      shownRef.current = row
      setShown(row)
    }
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
      if (!row.visible || !row.body.trim()) {
        setOn(false)
        timerRef.current = setTimeout(() => show(null), FADE_MS)
        return
      }
      if (!shownRef.current) {
        show(row)
        fadeIn()
        return
      }
      if (shownRef.current.body === row.body && shownRef.current.reference === row.reference) return
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

  // The layout is drawn for 1920×1080; scale it if OBS gives the source another size.
  useEffect(() => {
    const fit = () => setScale(Math.min(window.innerWidth / 1920, window.innerHeight / 1080) || 1)
    fit()
    window.addEventListener('resize', fit)
    return () => window.removeEventListener('resize', fit)
  }, [])

  // Long passages: shrink the text until it fits the panel.
  useLayoutEffect(() => {
    const el = verseRef.current
    if (!el || !shown) return
    let size = MAX_FONT
    el.style.fontSize = `${size}px`
    while (size > MIN_FONT && el.scrollHeight > el.clientHeight + 1) {
      size -= 2
      el.style.fontSize = `${size}px`
    }
    setFontSize(size)
  }, [shown])

  const reference = shown
    ? `${shown.reference}${shown.translation ? ` (${shown.translation})` : ''}`
    : ''

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <div className={`ss-root ${montserrat.className}`} style={{ transform: `scale(${scale})` }}>
        <div className="ss-bg">
          <div className="ss-rays" />
          {BOKEH.map(([x, y, r, o], i) => (
            <div key={i} className="ss-dot" style={{ left: x - r, top: y - r, width: 2 * r, height: 2 * r, opacity: o }} />
          ))}
          <div className="ss-head">
            <div className={`ss-mark ${cinzel.className}`}>AS</div>
            <div>
              <div className={`ss-title ${cinzel.className}`}>ASSEMBLY OF SAINTS</div>
              <div className="ss-sub">BELLVILLE</div>
            </div>
          </div>
          <div className="ss-pill">SCRIPTURE READING</div>
          <div className="ss-foot">
            <div className="ss-foot-l">SUNDAY SERVICE</div>
            <div className="ss-foot-r">
              <div className={`ss-foot-dot ${cinzel.className}`}>AS</div>
              ASSEMBLY OF SAINTS BELLVILLE
            </div>
          </div>
        </div>
        <div className="ss-camborder" />
        <div className="ss-panel">
          <div className="ss-bar" />
          <div className="ss-label">TODAY&apos;S SCRIPTURE</div>
          <div className="ss-rule" />
          <div className={`ss-text${on ? ' on' : ''}`}>
            <div ref={verseRef} className="ss-verse" style={{ fontSize }}>
              {shown?.body ?? ''}
            </div>
            <div className="ss-ref">{reference}</div>
          </div>
        </div>
      </div>
    </>
  )
}
