import { STATUS_CONTRATO_COLORS, PRIORIDADE_COLORS } from '@/utils/constants'

export function StatusBadge({ status }: { status: string }) {
  const colors = STATUS_CONTRATO_COLORS[status] || { bg: 'bg-gray-100', text: 'text-gray-600', border: 'border border-gray-200' }
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${colors.bg} ${colors.text} ${colors.border}`}>
      {status}
    </span>
  )
}

export function PrioridadeBadge({ prioridade }: { prioridade: string }) {
  const colors = PRIORIDADE_COLORS[prioridade] || PRIORIDADE_COLORS.INFO
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${colors.bg} ${colors.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${colors.dot}`} />
      {prioridade}
    </span>
  )
}
