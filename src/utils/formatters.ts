export function formatUSD(value: number | null): string {
  if (value == null) return '—'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

export function formatKZ(value: number | null): string {
  if (value == null) return '—'
  return new Intl.NumberFormat('pt-AO', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value) + ' KZ'
}

export function formatNumber(value: number | null): string {
  if (value == null) return '—'
  return new Intl.NumberFormat('pt-AO').format(value)
}

export function formatDate(date: string | null): string {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('pt-PT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

export function formatPercent(value: number | null): string {
  if (value == null) return '—'
  return value.toFixed(1) + '%'
}
