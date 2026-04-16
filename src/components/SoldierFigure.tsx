/**
 * Abstract human glyph — a minimal census-mark figure.
 * Circle head + vertical body + arm strokes + leg strokes.
 * chestScale (0.94–1.06) widens the torso stroke width and arm spread.
 */
interface SoldierFigureProps {
  x: number
  y: number
  height: number
  chestScale: number  // 0.94 – 1.06
  opacity?: number
  isIdeal?: boolean
}

const BASE_CHEST = 40  // reference size for scale=1.0
const MIN_CHEST = 33
const MAX_CHEST = 48

export function chestToScale(chest: number): number {
  const t = (chest - MIN_CHEST) / (MAX_CHEST - MIN_CHEST)  // 0 → 1
  return 0.94 + t * 0.12  // 0.94 → 1.06
}
void BASE_CHEST

export default function SoldierFigure({
  x,
  y,
  height,
  chestScale,
  opacity = 1,
  isIdeal = false,
}: SoldierFigureProps) {
  // Proportions relative to height
  const headR = height * 0.10
  const bodyLen = height * 0.38
  const legLen = height * 0.30
  const armSpread = height * 0.22 * chestScale
  const armY = height * 0.20
  const legSpread = height * 0.12

  const headCY = y - height * 0.5 + headR
  const shoulderY = headCY + headR + height * 0.04
  const hipY = shoulderY + bodyLen
  const footY = hipY + legLen

  const strokeColor = isIdeal ? 'var(--ink-faded)' : 'var(--ink-primary)'
  const strokeW = isIdeal ? 0.8 : 1.2

  return (
    <g opacity={opacity} style={{ transition: 'opacity 0.3s ease-out' }}>
      {/* Head */}
      <circle
        cx={x}
        cy={headCY}
        r={headR}
        fill="none"
        stroke={strokeColor}
        strokeWidth={strokeW}
      />
      {/* Body */}
      <line
        x1={x} y1={shoulderY}
        x2={x} y2={hipY}
        stroke={strokeColor}
        strokeWidth={strokeW * chestScale * 1.4}
        strokeLinecap="round"
      />
      {/* Arms */}
      <line
        x1={x - armSpread} y1={shoulderY + armY * 0.1}
        x2={x + armSpread} y2={shoulderY + armY * 0.1}
        stroke={strokeColor}
        strokeWidth={strokeW}
        strokeLinecap="round"
      />
      {/* Legs */}
      <line
        x1={x} y1={hipY}
        x2={x - legSpread} y2={footY}
        stroke={strokeColor}
        strokeWidth={strokeW}
        strokeLinecap="round"
      />
      <line
        x1={x} y1={hipY}
        x2={x + legSpread} y2={footY}
        stroke={strokeColor}
        strokeWidth={strokeW}
        strokeLinecap="round"
      />
    </g>
  )
}
