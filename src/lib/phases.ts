export const PHASE_BOUNDARIES = {
  INDIVIDUALS_END: 50,
  SHRINKING_END: 800,
  CURVE_APPEARS: 2000,
  TOTAL: 5738,
} as const

export type Phase = 'INDIVIDUALS' | 'SHRINKING' | 'HISTOGRAM'

export function getPhase(n: number): Phase {
  if (n <= PHASE_BOUNDARIES.INDIVIDUALS_END) return 'INDIVIDUALS'
  if (n <= PHASE_BOUNDARIES.SHRINKING_END) return 'SHRINKING'
  return 'HISTOGRAM'
}

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v))
}

function smoothstep(lo: number, hi: number, v: number) {
  const t = clamp((v - lo) / (hi - lo), 0, 1)
  return t * t * (3 - 2 * t)
}

export interface PhaseBlend {
  /** opacity of full individual glyphs (Phase 1) */
  individualsOpacity: number
  /** opacity of the column / histogram layout (Phase 2+) */
  columnsOpacity: number
  /** opacity of solid histogram bars (Phase 3) */
  histogramOpacity: number
  /** opacity of the normal curve overlay */
  curveOpacity: number
  /** 0 = full-size individuals, 1 = merged into bars */
  shrinkProgress: number
}

export function getPhaseBlend(n: number): PhaseBlend {
  const { INDIVIDUALS_END, SHRINKING_END, CURVE_APPEARS, TOTAL } = PHASE_BOUNDARIES

  // Phase 1 → 2 crossfade over the last 20 individuals
  const individualsOpacity = 1 - smoothstep(INDIVIDUALS_END - 20, INDIVIDUALS_END + 20, n)

  // Columns fade in as phase 1 fades out
  const columnsOpacity = smoothstep(INDIVIDUALS_END - 20, SHRINKING_END * 0.3, n)

  // Histogram bars replace individual marks
  const histogramOpacity = smoothstep(SHRINKING_END * 0.5, SHRINKING_END, n)

  // Normal curve appears after shape is clear
  const curveOpacity = smoothstep(CURVE_APPEARS, CURVE_APPEARS + 300, n)

  // Shrink: 0 at n=50, 1 at n=800
  const shrinkProgress = smoothstep(INDIVIDUALS_END, SHRINKING_END, n)

  // Clamp total opacity at end
  const endFade = n >= TOTAL ? 1 : smoothstep(TOTAL - 100, TOTAL, n)
  void endFade

  return {
    individualsOpacity,
    columnsOpacity,
    histogramOpacity,
    curveOpacity,
    shrinkProgress,
  }
}
