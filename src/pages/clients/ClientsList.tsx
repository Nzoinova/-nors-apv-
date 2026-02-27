import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Plus, RefreshCw } from 'lucide-react'
import { getResumoClientes } from '@/services/clients'
import { formatUSD } from '@/utils/formatters'

export default function ClientsList() {
  const { data: clientes, isLoading } = useQuery({
    queryKey: ['resumo-clientes'],
    queryFn: getResumoClientes,
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
          <h1 className="text-2xl font-extrabold tracking-tight">Clientes</h1>
          <p className="text-sm font-light text-nors-dark-gray mt-1">
            {clientes?.length || 0} clientes activos
          </p>
        </div>
        <Link
          to="/clientes/novo"
          className="inline-flex items-center gap-2 bg-nors-teal text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-nors-teal/90 transition-colors"
        >
          <Plus size={16} /> Novo Cliente
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {(clientes || []).map((c) => (
          <div key={c.cliente_id} className="bg-white rounded-lg border border-nors-light-gray p-5">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-extrabold text-lg tracking-tight">{c.cliente_nome.split(' - ')[0]}</h3>
                <p className="text-xs text-nors-dark-gray font-light mt-0.5">{c.cliente_nome}</p>
              </div>
              <Link
                to={`/contratos?cliente=${c.cliente_id}`}
                className="text-xs text-nors-teal hover:underline font-semibold"
              >
                Ver contratos →
              </Link>
            </div>
            <div className="flex gap-8 mt-4">
              <div>
                <p className="text-[10px] font-light uppercase tracking-wide text-gray-400">Viaturas</p>
                <p className="text-lg font-extrabold">{c.total_viaturas}</p>
              </div>
              <div>
                <p className="text-[10px] font-light uppercase tracking-wide text-gray-400">Contratos</p>
                <p className="text-lg font-extrabold">{c.total_contratos}</p>
              </div>
              <div>
                <p className="text-[10px] font-light uppercase tracking-wide text-gray-400">Activos</p>
                <p className="text-lg font-extrabold text-nors-teal">{c.contratos_ativos}</p>
              </div>
              <div>
                <p className="text-[10px] font-light uppercase tracking-wide text-gray-400">Receita/Mês</p>
                <p className="text-lg font-extrabold text-nors-teal">{formatUSD(c.receita_mensal_usd)}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
