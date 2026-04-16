import seedrandom from 'seedrandom'
import type { ChestBin } from './data'

const SEED = 'quetelet-1846'

/**
 * Expands the frequency table into a flat array of chest values,
 * then Fisher-Yates shuffles it with a seeded PRNG.
 * Result is deterministic: same output every time for every visitor.
 */
export function buildSoldierSequence(bins: ChestBin[]): number[] {
  // Expand: 3 copies of 33, 18 copies of 34, etc.
  const flat: number[] = []
  for (const bin of bins) {
    for (let i = 0; i < bin.count; i++) {
      flat.push(bin.chest)
    }
  }

  // Fisher-Yates with seeded PRNG
  const rng = seedrandom(SEED)
  for (let i = flat.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    const tmp = flat[i]!
    flat[i] = flat[j]!
    flat[j] = tmp
  }

  return flat
}
