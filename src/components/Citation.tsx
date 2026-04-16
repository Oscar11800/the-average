import { motion } from 'framer-motion'
import { PHASE_BOUNDARIES } from '../lib/phases'

interface Props {
  n: number
}

export default function Citation({ n }: Props) {
  const visible = n >= PHASE_BOUNDARIES.TOTAL

  return (
    <motion.p
      initial={{ opacity: 0 }}
      animate={{ opacity: visible ? 1 : 0 }}
      transition={{ duration: 1.2, ease: 'easeOut' }}
      style={{
        fontFamily: "'EB Garamond', serif",
        fontStyle: 'italic',
        fontSize: 12,
        color: 'var(--ink-faded)',
        textAlign: 'center',
        lineHeight: 1.6,
        maxWidth: 680,
        margin: '0 auto',
      }}
    >
      After A. Quetelet,{' '}
      <em>Lettres sur la théorie des probabilités</em> (Brussels, 1846), pp. 400–403.{' '}
      Data: <em>Edinburgh Medical &amp; Surgical Journal</em>, 13 (1817), 260.
    </motion.p>
  )
}
