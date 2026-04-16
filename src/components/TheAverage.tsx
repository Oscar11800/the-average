import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { fetchSoldierData } from '../lib/data'
import { buildSoldierSequence } from '../lib/sampling'
import { mean, stdDev } from '../lib/stats'
import { PHASE_BOUNDARIES } from '../lib/phases'
import SoldierCanvas from './SoldierCanvas'
import ScrubBar from './ScrubBar'
import Counters from './Counters'
import Citation from './Citation'
import type { SoldierData } from '../lib/data'

const TOTAL = PHASE_BOUNDARIES.TOTAL
const PLAY_DURATION_S = 45

// Speed options: multiplier on real-time playback
const SPEEDS = [0.5, 1, 2, 5] as const
type Speed = typeof SPEEDS[number]

export default function TheAverage() {
  const [data, setData] = useState<SoldierData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [scrubPosition, setScrubPosition] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [speed, setSpeed] = useState<Speed>(1)

  // Load data on mount
  useEffect(() => {
    fetchSoldierData()
      .then(setData)
      .catch((e: unknown) => setError(e instanceof Error ? e.message : 'Failed to load data'))
  }, [])

  // Pre-shuffled deterministic sequence
  const soldierSequence = useMemo(
    () => (data ? buildSoldierSequence(data.bins) : []),
    [data]
  )

  // Visible soldiers
  const visibleSoldiers = useMemo(
    () => soldierSequence.slice(0, scrubPosition),
    [soldierSequence, scrubPosition]
  )

  // Running stats
  const runningMean = useMemo(() => mean(visibleSoldiers), [visibleSoldiers])
  const runningSD = useMemo(() => stdDev(visibleSoldiers, runningMean), [visibleSoldiers, runningMean])

  // Playback via rAF
  const rafRef = useRef<number | null>(null)
  const lastTsRef = useRef<number | null>(null)
  const soldiersPerSecond = (TOTAL / PLAY_DURATION_S)

  const tick = useCallback(
    (ts: number) => {
      if (lastTsRef.current === null) lastTsRef.current = ts
      const dt = (ts - lastTsRef.current) / 1000
      lastTsRef.current = ts
      setScrubPosition((prev) => {
        const next = Math.min(TOTAL, prev + soldiersPerSecond * speed * dt)
        if (next >= TOTAL) {
          setPlaying(false)
          return TOTAL
        }
        return Math.round(next)
      })
      rafRef.current = requestAnimationFrame(tick)
    },
    [speed, soldiersPerSecond]
  )

  useEffect(() => {
    if (playing) {
      lastTsRef.current = null
      rafRef.current = requestAnimationFrame(tick)
    } else {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [playing, tick])

  // Spacebar toggle
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.code === 'Space' && e.target === document.body) {
        e.preventDefault()
        setPlaying((p) => !p)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  // Canvas dimensions (responsive)
  const [dims, setDims] = useState({ w: Math.min(960, window.innerWidth - 32), h: Math.min(580, window.innerHeight * 0.62) })
  useEffect(() => {
    const observer = new ResizeObserver(() => {
      setDims({
        w: Math.min(960, window.innerWidth - 32),
        h: Math.min(580, window.innerHeight * 0.62),
      })
    })
    observer.observe(document.body)
    return () => observer.disconnect()
  }, [])

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p style={{ fontFamily: "'EB Garamond', serif", fontStyle: 'italic', color: 'var(--ink-faded)', fontSize: 16 }}>
          Could not load dataset: {error}
        </p>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <motion.p
          animate={{ opacity: [0.3, 0.8, 0.3] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          style={{ fontFamily: "'EB Garamond', serif", fontStyle: 'italic', color: 'var(--ink-faded)', fontSize: 16 }}
        >
          loading data…
        </motion.p>
      </div>
    )
  }

  return (
    <div
      className="flex flex-col items-center justify-start min-h-screen py-10 px-6"
      style={{ gap: 20 }}
    >
      {/* Header caption */}
      <AnimatePresence>
        {scrubPosition === 0 && (
          <motion.div
            key="caption"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="text-center"
            style={{ marginBottom: 8 }}
          >
            <p
              style={{
                fontFamily: "'EB Garamond', serif",
                fontStyle: 'italic',
                fontSize: 20,
                color: 'var(--ink-faded)',
                letterSpacing: '0.01em',
              }}
            >
              l'homme type
            </p>
            <p
              style={{
                fontFamily: "'EB Garamond', serif",
                fontStyle: 'italic',
                fontSize: 14,
                color: 'var(--ink-faded)',
                marginTop: 4,
              }}
            >
              Of the Scottish soldier, 1817.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Canvas */}
      <SoldierCanvas
        soldiers={visibleSoldiers}
        data={data}
        width={dims.w}
        height={dims.h}
      />

      {/* Scrub bar */}
      <div style={{ width: dims.w, paddingTop: 4 }}>
        <ScrubBar
          value={scrubPosition}
          max={TOTAL}
          onChange={(v) => {
            setPlaying(false)
            setScrubPosition(v)
          }}
        />
      </div>

      {/* Counters */}
      <Counters
        n={scrubPosition}
        total={TOTAL}
        runningMean={runningMean}
        runningStdDev={runningSD}
      />

      {/* Playback controls */}
      <div className="flex items-center gap-4" style={{ marginTop: 2 }}>
        <button
          onClick={() => setPlaying((p) => !p)}
          style={{
            fontFamily: "'EB Garamond', serif",
            fontSize: 14,
            color: 'var(--ink-primary)',
            background: 'none',
            border: '1px solid var(--ink-faded)',
            borderRadius: 2,
            padding: '3px 14px',
            cursor: 'pointer',
            letterSpacing: '0.04em',
          }}
        >
          {playing ? 'pause' : 'play'}
        </button>

        <div className="flex items-center gap-1">
          {SPEEDS.map((s) => (
            <button
              key={s}
              onClick={() => setSpeed(s)}
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 11,
                color: speed === s ? 'var(--ink-primary)' : 'var(--ink-faded)',
                background: 'none',
                border: speed === s ? '1px solid var(--ink-secondary)' : '1px solid transparent',
                borderRadius: 2,
                padding: '2px 8px',
                cursor: 'pointer',
              }}
            >
              {s}×
            </button>
          ))}
        </div>

        <button
          onClick={() => { setScrubPosition(TOTAL); setPlaying(false) }}
          style={{
            fontFamily: "'EB Garamond', serif",
            fontSize: 12,
            fontStyle: 'italic',
            color: 'var(--ink-faded)',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            textDecoration: 'underline',
            textUnderlineOffset: 3,
          }}
          aria-label="Skip to end"
        >
          skip to end
        </button>
      </div>

      {/* Citation */}
      <div style={{ marginTop: 16 }}>
        <Citation n={scrubPosition} />
      </div>
    </div>
  )
}
