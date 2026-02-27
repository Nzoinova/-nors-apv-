import { useQuery } from '@tanstack/react-query'
import { RefreshCw } from 'lucide-react'
import { getViaturas } from '@/services/vehicles'
import { formatNumber } from '@/utils/formatters'

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
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">Viaturas</h1>
        <p className="text-sm font-light text-nors-dark-gray mt-1">
          {viaturas?.length || 0} viaturas registadas
        </p>
      </div>

      <div className="bg-white rounded-lg border border-nors-light-gray overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-nors-black text-white text-xs font-extrabold uppercase">
              <th className="text-left px-4 py-3">Matrícula</th>
              <th className="text-left px-4 py-3">VIN</th>
              <th className="text-left px-4 py-3">Marca</th>
              <th className="text-left px-4 py-3">Cliente</th>
              <th className="text-right px-4 py-3">KM Inicial</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-nors-light-gray">
            {(viaturas || []).map((v) => (
              <tr key={v.id} className="hover:bg-nors-off-white even:bg-nors-off-white/50">
                <td className="px-4 py-2.5 text-xs font-mono font-semibold">
                  {v.matricula || <span className="text-nors-light-gray-2">Sem matrícula</span>}
                </td>
                <td className="px-4 py-2.5 text-xs font-mono text-nors-dark-gray">{v.vin}</td>
                <td className="px-4 py-2.5 text-xs">{v.marca}</td>
                <td className="px-4 py-2.5 text-xs truncate max-w-[180px]">
                  {(v.cliente as any)?.nome?.split(' - ')[0] || '—'}
                </td>
                <td className="px-4 py-2.5 text-xs text-right">
                  {v.km_inicial ? formatNumber(v.km_inicial) : <span className="text-nors-light-gray-2">—</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
