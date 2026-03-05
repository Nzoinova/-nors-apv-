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
          <h1 className="text-2xl font-bold tracking-tight">Viaturas</h1>
          <p className="text-sm text-gray-500 mt-1">
            {viaturas?.length || 0} viaturas registadas
          </p>
        </div>
        <Link to="/viaturas/nova" className="inline-flex items-center gap-2 bg-nors-teal text-white h-10 px-4 rounded-md text-sm font-medium hover:opacity-90">
          <Plus size={16} /> Nova Viatura
        </Link>
      </div>

      <div className="rounded-lg border border-gray-200 overflow-hidden shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50/50">
              <th className="text-left px-4 py-3 text-xs font-medium uppercase tracking-wider text-gray-500">Matrícula</th>
              <th className="text-left px-4 py-3 text-xs font-medium uppercase tracking-wider text-gray-500">VIN</th>
              <th className="text-left px-4 py-3 text-xs font-medium uppercase tracking-wider text-gray-500">Marca</th>
              <th className="text-left px-4 py-3 text-xs font-medium uppercase tracking-wider text-gray-500">Modelo</th>
              <th className="text-left px-4 py-3 text-xs font-medium uppercase tracking-wider text-gray-500">Cliente</th>
              <th className="text-right px-4 py-3 text-xs font-medium uppercase tracking-wider text-gray-500">KM Inicial</th>
              <th className="text-right px-4 py-3 text-xs font-medium uppercase tracking-wider text-gray-500">Horas Motor</th>
            </tr>
          </thead>
          <tbody>
            {(viaturas || []).map((v) => (
              <tr key={v.id} className="border-b border-gray-100 hover:bg-gray-50/50">
                <td className="px-4 py-3 text-sm font-mono font-medium">
                  <Link to={`/viaturas/${v.id}`} className="text-nors-teal hover:underline">
                    {v.matricula || 'Sem matrícula'}
                  </Link>
                </td>
                <td className="px-4 py-3 text-sm font-mono text-gray-400">{v.vin}</td>
                <td className="px-4 py-3 text-sm text-gray-900">{v.marca}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{v.modelo || '—'}</td>
                <td className="px-4 py-3 text-sm text-gray-600 truncate max-w-[180px]">
                  {(v.cliente as any)?.nome?.split(' - ')[0] || '—'}
                </td>
                <td className="px-4 py-3 text-sm text-right text-gray-600">
                  {v.km_inicial ? formatNumber(v.km_inicial) : '—'}
                </td>
                <td className="px-4 py-3 text-sm text-right text-gray-600">
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
