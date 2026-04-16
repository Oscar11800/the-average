export function mean(values: number[]): number {
  if (values.length === 0) return 0
  return values.reduce((a, b) => a + b, 0) / values.length
}

export function stdDev(values: number[], mu: number): number {
  if (values.length === 0) return 0
  const variance = values.reduce((acc, v) => acc + (v - mu) ** 2, 0) / values.length
  return Math.sqrt(variance)
}

export function normalPDF(x: number, mu: number, sigma: number): number {
  return (
    (1 / (sigma * Math.sqrt(2 * Math.PI))) *
    Math.exp(-0.5 * ((x - mu) / sigma) ** 2)
  )
}
