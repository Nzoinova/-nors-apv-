import { AlertTriangle, Clock, Info, X } from 'lucide-react'
import type { Alerta } from '@/types'

const PRIORIDADE_CONFIG = {
  ALTA: {
    borderColor: '#fca5a5',
    backgroundColor: '#fef2f2',
    icon: AlertTriangle,
    iconClass: 'text-red-500',
    label: 'Alta Prioridade',
  },
  MEDIA: {
    borderColor: '#fed7aa',
    backgroundColor: '#fff7ed',
    icon: Clock,
    iconClass: 'text-orange-400',
    label: 'Média Prioridade',
  },
  INFO: {
    borderColor: '#bfdbfe',
    backgroundColor: '#eff6ff',
    icon: Info,
    iconClass: 'text-blue-400',
    label: 'Informativo',
  },
} as const

interface AlertasPanelProps {
  open: boolean
  onClose: () => void
  groupedAlertas: Record<string, Alerta[]>
  totalAlertas: number
}

export function AlertasPanel({ open, onClose, groupedAlertas, totalAlertas }: AlertasPanelProps) {
  return (
    <>
      {/* Overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/30 z-40"
          onClick={onClose}
        />
      )}

      {/* Panel */}
      <div className={`
        fixed top-0 right-0 h-full w-96 bg-white shadow-2xl z-50
        transform transition-transform duration-300 ease-in-out
        ${open ? 'translate-x-0' : 'translate-x-full'}
      `}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
          <div>
            <h2 className="text-sm font-semibold text-gray-900">Alertas Activos</h2>
            <p className="text-xs text-gray-500 mt-0.5">{totalAlertas} alertas</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
          >
            <X size={16} />
          </button>
        </div>

        {/* Alerts list */}
        <div className="overflow-y-auto h-full pb-20 px-4 py-3 space-y-4">
          {(['ALTA', 'MEDIA', 'INFO'] as const).map(prioridade => {
            const items = groupedAlertas[prioridade]
            if (!items || items.length === 0) return null
            const config = PRIORIDADE_CONFIG[prioridade]

            return (
              <div key={prioridade}>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-2">
                  {config.label} ({items.length})
                </p>
                <div className="space-y-2">
                  {items.map((alerta, idx) => {
                    const Icon = config.icon
                    return (
                      <div
                        key={`${alerta.tipo_alerta}-${alerta.referencia_id}-${idx}`}
                        className="rounded-lg border px-3 py-2.5 text-xs"
                        style={{ borderColor: config.borderColor, backgroundColor: config.backgroundColor }}
                      >
                        <div className="flex items-start gap-2">
                          <Icon size={14} className={`${config.iconClass} mt-0.5 flex-shrink-0`} />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900">{alerta.descricao}</p>
                            <p className="text-gray-500 mt-0.5">{alerta.detalhe}</p>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}

          {totalAlertas === 0 && (
            <div className="text-center text-gray-400 text-sm py-12">
              Sem alertas activos
            </div>
          )}
        </div>
      </div>
    </>
  )
}
