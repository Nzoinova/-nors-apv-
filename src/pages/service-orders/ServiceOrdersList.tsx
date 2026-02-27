import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Plus, RefreshCw } from 'lucide-react'
import { getOrdensServico } from '@/services/service-orders'
import { formatDate, formatNumber, formatKZ } from '@/utils/formatters'
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
          <h1 className="text-2xl font-extrabold tracking-tight">Ordens de Serviço</h1>
          <p className="text-sm font-light text-nors-dark-gray mt-1">
            {ordensServico?.length || 0} OS registadas
          </p>
        </div>
        <Link
          to="/os/nova"
          className="inline-flex items-center gap-2 bg-nors-teal text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-nors-teal/90 transition-colors"
        >
          <Plus size={16} /> Nova OS
        </Link>
      </div>

      <div className="bg-white rounded-lg border border-nors-light-gray overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-nors-black text-white text-xs font-extrabold uppercase">
              <th className="text-left px-4 py-3">Nº</th>
              <th className="text-center px-4 py-3">Data</th>
              <th className="text-left px-4 py-3">Cliente</th>
              <th className="text-left px-4 py-3">Matrícula</th>
              <th className="text-center px-4 py-3">Tipo</th>
              <th className="text-left px-4 py-3">Descrição</th>
              <th className="text-right px-4 py-3">KM</th>
              <th className="text-right px-4 py-3">Custo KZ</th>
              <th className="text-center px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-nors-light-gray">
            {(ordensServico || []).map((os) => {
              const viatura = os.viatura as any
              return (
                <tr key={os.id} className="hover:bg-nors-off-white even:bg-nors-off-white/50">
                  <td className="px-4 py-2.5 text-xs font-mono font-semibold">{os.numero_os}</td>
                  <td className="px-4 py-2.5 text-xs text-center">{formatDate(os.data_os)}</td>
                  <td className="px-4 py-2.5 text-xs truncate max-w-[140px]">
                    {viatura?.cliente?.nome?.split(' - ')[0] || '—'}
                  </td>
                  <td className="px-4 py-2.5 text-xs font-mono">
                    {viatura?.matricula || viatura?.vin?.slice(-6) || '—'}
                  </td>
                  <td className="px-4 py-2.5 text-xs text-center font-semibold">{os.tipo_revisao}</td>
                  <td className="px-4 py-2.5 text-xs">
                    {os.descricao_servico || TIPOS_REVISAO[os.tipo_revisao] || '—'}
                  </td>
                  <td className="px-4 py-2.5 text-xs text-right">{formatNumber(os.km_na_revisao)}</td>
                  <td className="px-4 py-2.5 text-xs text-right">{os.custo_kz ? formatKZ(os.custo_kz) : '—'}</td>
                  <td className="px-4 py-2.5 text-center">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                      os.status === 'Concluída' ? 'bg-emerald-50 text-emerald-700' :
                      os.status === 'Em Curso' ? 'bg-blue-50 text-blue-700' :
                      os.status === 'Cancelada' ? 'bg-red-50 text-red-700' :
                      'bg-gray-100 text-gray-600'
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
