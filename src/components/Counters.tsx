import { motion, AnimatePresence } from 'framer-motion'
import { PHASE_BOUNDARIES } from '../lib/phases'

interface Props {
  n: number
  total: number
  runningMean: number
  runningStdDev: number
}

export default function Counters({ n, total, runningMean, runningStdDev }: Props) {
  const showSigma = n >= PHASE_BOUNDARIES.SHRINKING_END

  return (
    <div
      className="flex gap-8 justify-center items-baseline"
      style={{
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 13,
        color: 'var(--ink-secondary)',
        letterSpacing: '0.02em',
      }}
    >
      <span>
        <span style={{ color: 'var(--ink-faded)', fontSize: 11 }}>n </span>
        {n.toLocaleString()} / {total.toLocaleString()}
      </span>
      <span>
        <span style={{ color: 'var(--ink-faded)', fontSize: 11 }}>μ </span>
        {n > 0 ? `${runningMean.toFixed(2)}″` : '—'}
      </span>
      <AnimatePresence>
        {showSigma && (
          <motion.span
            key="sigma"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          >
            <span style={{ color: 'var(--ink-faded)', fontSize: 11 }}>σ </span>
            {runningStdDev.toFixed(2)}″
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  )
}
