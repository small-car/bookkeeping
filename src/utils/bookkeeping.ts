import Taro from '@tarojs/taro'

export type BookkeepingType = 'expense' | 'income'

export interface BookkeepingRecord {
  id: string
  type: BookkeepingType
  amount: number
  category: string
  note?: string
  date: string // YYYY-MM-DD
  createdAt: number
}

const STORAGE_KEY = 'bookkeeping_records_v1'

function safeParseRecords(value: unknown): BookkeepingRecord[] {
  if (typeof value !== 'string') return []
  try {
    const parsed = JSON.parse(value) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed as BookkeepingRecord[]
  } catch {
    return []
  }
}

export function formatDate(date: Date) {
  const y = date.getFullYear()
  const m = `${date.getMonth() + 1}`.padStart(2, '0')
  const d = `${date.getDate()}`.padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function formatMonth(date: Date) {
  const y = date.getFullYear()
  const m = `${date.getMonth() + 1}`.padStart(2, '0')
  return `${y}-${m}`
}

export function parseDateString(value: string) {
  const [y, m, d] = value.split('-').map((v) => Number(v))
  if (!y || !m || !d) return new Date()
  return new Date(y, m - 1, d)
}

export function loadRecords(): BookkeepingRecord[] {
  const raw = Taro.getStorageSync(STORAGE_KEY)
  const records = safeParseRecords(raw)
  return records
    .filter((r) => r && typeof r.id === 'string')
    .sort((a, b) => (b.date === a.date ? b.createdAt - a.createdAt : b.date.localeCompare(a.date)))
}

export function saveRecords(records: BookkeepingRecord[]) {
  Taro.setStorageSync(STORAGE_KEY, JSON.stringify(records))
}

export function addRecord(record: Omit<BookkeepingRecord, 'id' | 'createdAt'>) {
  const records = loadRecords()
  const next: BookkeepingRecord = {
    ...record,
    id: `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
    createdAt: Date.now()
  }
  saveRecords([next, ...records])
  return next
}

export function removeRecord(id: string) {
  const records = loadRecords()
  const next = records.filter((r) => r.id !== id)
  saveRecords(next)
  return next
}

export function clearRecords() {
  Taro.removeStorageSync(STORAGE_KEY)
}

export function summarize(records: BookkeepingRecord[]) {
  return records.reduce(
    (acc, r) => {
      if (r.type === 'expense') acc.expense += r.amount
      else acc.income += r.amount
      return acc
    },
    { expense: 0, income: 0 }
  )
}

