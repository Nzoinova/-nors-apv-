import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Plus, RefreshCw } from 'lucide-react'
import { getViaturas } from '@/services/vehicles'
import { formatNumber, formatHorasMotor } from '@/utils/formatters'

export default function VehiclesList() {
  const { data: viaturas, isLoading } = useQuery({
    queryKey: ['viaturas'],
    queryFn: getViaturas,
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="animate-spin text-nors-teal" size={24} />
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Viaturas</h1>
          <p className="text-sm font-light text-nors-dark-gray mt-1">
            {viaturas?.length || 0} viaturas registadas
          </p>
        </div>
        <Link
          to="/viaturas/nova"
          className="inline-flex items-center gap-2 bg-nors-teal text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-nors-teal/90 transition-colors"
        >
          <Plus size={16} /> Nova Viatura
        </Link>
      </div>

      <div className="bg-white rounded-lg border border-nors-light-gray overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-nors-black text-white text-xs font-extrabold uppercase">
              <th className="text-left px-4 py-3">Matrícula</th>
              <th className="text-left px-4 py-3">VIN</th>
              <th className="text-left px-4 py-3">Marca</th>
              <th className="text-left px-4 py-3">Modelo</th>
              <th className="text-left px-4 py-3">Cliente</th>
              <th className="text-right px-4 py-3">KM Inicial</th>
              <th className="text-right px-4 py-3">Horas Motor</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-nors-light-gray">
            {(viaturas || []).map((v) => (
              <tr key={v.id} className="hover:bg-nors-off-white even:bg-nors-off-white/50">
                <td className="px-4 py-2.5 text-xs font-mono font-semibold">
                  {v.matricula || <span className="text-gray-400">Sem matrícula</span>}
                </td>
                <td className="px-4 py-2.5 text-xs font-mono text-nors-dark-gray">{v.vin}</td>
                <td className="px-4 py-2.5 text-xs">{v.marca}</td>
                <td className="px-4 py-2.5 text-xs">{v.modelo || '—'}</td>
                <td className="px-4 py-2.5 text-xs truncate max-w-[180px]">
                  {(v.cliente as any)?.nome?.split(' - ')[0] || '—'}
                </td>
                <td className="px-4 py-2.5 text-xs text-right">
                  {v.km_inicial ? formatNumber(v.km_inicial) : '—'}
                </td>
                <td className="px-4 py-2.5 text-xs text-right">
                  {formatHorasMotor(v.horas_motor_segundos)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
