/**
 * Ink-stamp silhouette of a human figure.
 * Filled, no outline. chestScale widens the torso.
 * mix-blend-mode: multiply on the parent group creates ink accumulation.
 *
 * Coordinate space: normalized to a 10×18 unit grid, scaled by `size`.
 */

export const MIN_CHEST = 33
export const MAX_CHEST = 48

export function chestToScale(chest: number): number {
  const t = (chest - MIN_CHEST) / (MAX_CHEST - MIN_CHEST) // 0 → 1
  return 0.88 + t * 0.24 // 0.88 → 1.12  (wider range for silhouette visibility)
}

interface Props {
  x: number
  y: number       // center of figure
  size: number    // height in px
  chestScale?: number
  opacity?: number
  isIdeal?: boolean
}

// Body path in a 10×16 unit space (head is separate circle above)
// Shoulders at y=0, feet at y=16. Chest width parameterized by scale.
function bodyPath(cs: number): string {
  // Shoulder width controlled by cs, centered at x=5
  const sw = 3.5 * cs   // half-shoulder-width
  const hw = 2.2 * cs   // half-hip-width
  const ww = 1.8 * cs   // half-waist-width

  const lShoulder = 5 - sw
  const rShoulder = 5 + sw
  const lWaist = 5 - ww
  const rWaist = 5 + ww
  const lHip = 5 - hw
  const rHip = 5 + hw

  return [
    `M ${lShoulder} 0`,
    `C ${lShoulder - 1.5} 0 ${lShoulder - 1.2} 3 ${lShoulder} 4`,
    `L ${lWaist} 7`,
    `L ${lHip} 9`,
    `L ${lHip - 0.3} 16`,
    `L ${5 - 0.8} 16`,
    `L ${5 - 0.5} 10`,
    `L ${5 + 0.5} 10`,
    `L ${5 + 0.8} 16`,
    `L ${rHip + 0.3} 16`,
    `L ${rHip} 9`,
    `L ${rWaist} 7`,
    `L ${rShoulder} 4`,
    `C ${rShoulder + 1.2} 3 ${rShoulder + 1.5} 0 ${rShoulder} 0`,
    `Z`,
  ].join(' ')
}

export default function SoldierFigure({
  x,
  y,
  size,
  chestScale = 1,
  opacity = 1,
  isIdeal = false,
}: Props) {
  const scale = size / 18  // unit-to-pixel scale
  const headR = 2.2 * scale
  // Head sits above body: center of figure (y) is the vertical midpoint
  // Total height = headDiameter (4.4) + gap (1) + body (16) = ~21.4 units → scale to `size`
  const totalUnits = 21.4
  const pxPerUnit = size / totalUnits
  const headCY = y - size / 2 + headR
  const bodyTopY = headCY + headR + 1 * pxPerUnit

  const fill = isIdeal ? 'var(--ink-faded)' : 'var(--ink-primary)'

  return (
    <g opacity={opacity}>
      {/* Head */}
      <circle
        cx={x}
        cy={headCY}
        r={headR}
        fill={fill}
      />
      {/* Body */}
      <g transform={`translate(${x - 5 * scale}, ${bodyTopY}) scale(${scale})`}>
        <path d={bodyPath(chestScale)} fill={fill} />
      </g>
    </g>
  )
}
