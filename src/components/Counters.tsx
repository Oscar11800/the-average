import { motion, AnimatePresence } from 'framer-motion'
import { PHASE_BOUNDARIES } from '../lib/phases'

interface Props {
  n: number
  total: number
  runningMean: number
  runningStdDev: number
}

const labelStyle: React.CSSProperties = {
  fontFamily: "'EB Garamond', serif",
  fontStyle: 'italic',
  fontSize: 13,
  color: 'var(--ink-faded)',
  display: 'block',
  marginBottom: 2,
  letterSpacing: '0.01em',
}

const symbolStyle: React.CSSProperties = {
  fontFamily: "'EB Garamond', serif",
  fontStyle: 'italic',
  fontSize: 15,
  color: 'var(--ink-faded)',
  marginRight: 5,
}

const valueStyle: React.CSSProperties = {
  fontFamily: "'JetBrains Mono', monospace",
  fontSize: 16,
  color: 'var(--ink-secondary)',
  letterSpacing: '0.02em',
}

export default function Counters({ n, total, runningMean, runningStdDev }: Props) {
  const showSigma = n >= PHASE_BOUNDARIES.SHRINKING_END

  return (
    <div className="flex gap-10 justify-center items-end">

      {/* n — soldiers counted */}
      <div className="flex flex-col items-center">
        <span style={labelStyle}>soldiers counted</span>
        <div style={valueStyle}>
          <span style={symbolStyle}>n</span>
          {n.toLocaleString()}
          <span style={{ color: 'var(--ink-faded)', fontSize: 13 }}> / {total.toLocaleString()}</span>
        </div>
      </div>

      {/* μ — mean chest size */}
      <div className="flex flex-col items-center">
        <span style={labelStyle}>mean chest size</span>
        <div style={valueStyle}>
          <span style={symbolStyle}>μ</span>
          {n > 0 ? `${runningMean.toFixed(2)}″` : '—'}
        </div>
      </div>

      {/* σ — spread around the mean */}
      <AnimatePresence>
        {showSigma && (
          <motion.div
            key="sigma"
            className="flex flex-col items-center"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
          >
            <span style={labelStyle}>spread (std. deviation)</span>
            <div style={valueStyle}>
              <span style={symbolStyle}>σ</span>
              {runningStdDev.toFixed(2)}″
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  )
}
