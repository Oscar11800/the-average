import { useRef, useCallback, useEffect } from 'react'

interface Props {
  value: number
  max: number
  onChange: (v: number) => void
}

export default function ScrubBar({ value, max, onChange }: Props) {
  const trackRef = useRef<HTMLDivElement>(null)
  const dragging = useRef(false)

  const posToValue = useCallback(
    (clientX: number) => {
      const rect = trackRef.current?.getBoundingClientRect()
      if (!rect) return 0
      const frac = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))
      return Math.round(frac * max)
    },
    [max]
  )

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      dragging.current = true
      ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
      onChange(posToValue(e.clientX))
    },
    [onChange, posToValue]
  )

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!dragging.current) return
      onChange(posToValue(e.clientX))
    },
    [onChange, posToValue]
  )

  const onPointerUp = useCallback(() => {
    dragging.current = false
  }, [])

  // Keyboard support
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target !== document.body && (e.target as HTMLElement).tagName !== 'DIV') return
      if (e.code === 'ArrowRight') onChange(Math.min(max, value + (e.shiftKey ? 1000 : 100)))
      if (e.code === 'ArrowLeft') onChange(Math.max(0, value - (e.shiftKey ? 1000 : 100)))
      if (e.code === 'Home') onChange(0)
      if (e.code === 'End') onChange(max)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [value, max, onChange])

  const pct = (value / max) * 100

  return (
    <div
      ref={trackRef}
      role="slider"
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={value}
      aria-label="Population size"
      tabIndex={0}
      className="relative w-full h-8 cursor-pointer select-none focus:outline-none"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
    >
      {/* Track */}
      <div
        className="absolute top-1/2 left-0 right-0 h-px -translate-y-1/2"
        style={{ background: 'var(--ink-faded)', opacity: 0.6 }}
      />
      {/* Filled portion */}
      <div
        className="absolute top-1/2 left-0 h-px -translate-y-1/2"
        style={{
          width: `${pct}%`,
          background: 'var(--ink-primary)',
          opacity: 0.8,
        }}
      />
      {/* Playhead — ink-blot style */}
      <div
        className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2"
        style={{
          left: `${pct}%`,
          width: 14,
          height: 14,
          borderRadius: '50% 50% 50% 0',
          transform: `translate(-50%, -50%) rotate(-45deg)`,
          background: 'var(--ink-primary)',
          boxShadow: '0 1px 3px rgba(59,42,26,0.35)',
        }}
      />
    </div>
  )
}
