import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Plus, RefreshCw } from 'lucide-react'
import { getOrdensServico } from '@/services/service-orders'
import { formatDate, formatNumber, formatKZ, formatHorasMotor } from '@/utils/formatters'
import { TIPOS_REVISAO } from '@/utils/constants'

export default function ServiceOrdersList() {
  const { data: ordensServico, isLoading } = useQuery({
    queryKey: ['ordens-servico'],
    queryFn: getOrdensServico,
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
          <h1 className="text-2xl font-bold tracking-tight">Ordens de Serviço</h1>
          <p className="text-sm text-gray-500 mt-1">
            {ordensServico?.length || 0} OS registadas
          </p>
        </div>
        <Link
          to="/os/nova"
          className="inline-flex items-center gap-2 bg-nors-teal text-white h-10 px-4 rounded-md text-sm font-medium hover:opacity-90"
        >
          <Plus size={16} /> Nova OS
        </Link>
      </div>

      <div className="rounded-lg border border-gray-200 overflow-hidden shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50/50">
              <th className="text-left px-4 py-3 text-xs font-medium uppercase tracking-wider text-gray-500">Nº OS</th>
              <th className="text-center px-4 py-3 text-xs font-medium uppercase tracking-wider text-gray-500">Data</th>
              <th className="text-left px-4 py-3 text-xs font-medium uppercase tracking-wider text-gray-500">Cliente</th>
              <th className="text-left px-4 py-3 text-xs font-medium uppercase tracking-wider text-gray-500">Matrícula</th>
              <th className="text-center px-4 py-3 text-xs font-medium uppercase tracking-wider text-gray-500">Tipo</th>
              <th className="text-left px-4 py-3 text-xs font-medium uppercase tracking-wider text-gray-500">Descrição</th>
              <th className="text-right px-4 py-3 text-xs font-medium uppercase tracking-wider text-gray-500">KM</th>
              <th className="text-right px-4 py-3 text-xs font-medium uppercase tracking-wider text-gray-500">Motor</th>
              <th className="text-center px-4 py-3 text-xs font-medium uppercase tracking-wider text-gray-500">Local</th>
              <th className="text-right px-4 py-3 text-xs font-medium uppercase tracking-wider text-gray-500">Custo KZ</th>
              <th className="text-center px-4 py-3 text-xs font-medium uppercase tracking-wider text-gray-500">Status</th>
            </tr>
          </thead>
          <tbody>
            {(ordensServico || []).map((os) => {
              const viatura = os.viatura as any
              return (
                <tr key={os.id} className="border-b border-gray-100 hover:bg-gray-50/50">
                  <td className="px-4 py-3 text-sm font-mono font-medium">
                    <Link to={`/os/${os.id}`} className="text-nors-teal hover:underline">{os.numero_os}</Link>
                  </td>
                  <td className="px-4 py-3 text-sm text-center text-gray-600">{formatDate(os.data_os)}</td>
                  <td className="px-4 py-3 text-sm text-gray-600 truncate max-w-[140px]">
                    {viatura?.cliente?.nome?.split(' - ')[0] || '—'}
                  </td>
                  <td className="px-4 py-3 text-sm font-mono text-gray-600">
                    {viatura?.matricula || viatura?.vin?.slice(-6) || '—'}
                  </td>
                  <td className="px-4 py-3 text-sm text-center font-medium text-gray-900">{os.tipo_revisao}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {os.descricao_servico || TIPOS_REVISAO[os.tipo_revisao] || '—'}
                  </td>
                  <td className="px-4 py-3 text-sm text-right text-gray-600">{formatNumber(os.km_na_revisao)}</td>
                  <td className="px-4 py-3 text-sm text-right text-gray-600">{formatHorasMotor(os.horas_motor_na_revisao)}</td>
                  <td className="px-4 py-3 text-sm text-center text-gray-600">{os.localizacao || '—'}</td>
                  <td className="px-4 py-3 text-sm text-right text-gray-600">{os.custo_kz ? formatKZ(os.custo_kz) : '—'}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold border ${
                      os.status === 'Concluída' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                      os.status === 'Em Curso' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                      os.status === 'Cancelada' ? 'bg-red-50 text-red-700 border-red-200' :
                      'bg-gray-100 text-gray-600 border-gray-200'
                    }`}>
                      {os.status}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
