export interface ChestBin {
  chest: number
  count: number
}

export interface SoldierData {
  bins: ChestBin[]
  total: number
  mean: number
  stdDev: number
  minChest: number
  maxChest: number
}

const CSV_URL =
  'https://raw.githubusercontent.com/vincentarelbundock/Rdatasets/master/csv/HistData/ChestSizes.csv'

function parseCSV(text: string): ChestBin[] {
  const lines = text.trim().split('\n')
  // Skip header row; columns: rownames, chest, count
  return lines.slice(1).map((line) => {
    const parts = line.split(',')
    return {
      chest: parseInt(parts[1]!, 10),
      count: parseInt(parts[2]!, 10),
    }
  })
}

export async function fetchSoldierData(): Promise<SoldierData> {
  const res = await fetch(CSV_URL)
  if (!res.ok) throw new Error(`Failed to fetch dataset: ${res.status}`)
  const text = await res.text()
  const bins = parseCSV(text)

  const total = bins.reduce((s, b) => s + b.count, 0)

  // Weighted mean
  const mean = bins.reduce((s, b) => s + b.chest * b.count, 0) / total

  // Population std dev
  const variance = bins.reduce((s, b) => s + b.count * (b.chest - mean) ** 2, 0) / total
  const stdDev = Math.sqrt(variance)

  const minChest = bins[0]!.chest
  const maxChest = bins[bins.length - 1]!.chest

  return { bins, total, mean, stdDev, minChest, maxChest }
}
