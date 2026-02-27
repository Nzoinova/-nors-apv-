import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Plus, RefreshCw, Search } from 'lucide-react'
import { getEstadoContratos } from '@/services/dashboard'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { formatUSD, formatKZ, formatDate, formatNumber, formatPercent } from '@/utils/formatters'

export default function ContractsList() {
  const [statusFilter, setStatusFilter] = useState<string>('ALL')
  const [search, setSearch] = useState('')

  const { data: contratos, isLoading } = useQuery({
    queryKey: ['estado-contratos'],
    queryFn: getEstadoContratos,
  })

  const filtered = (contratos || []).filter(c => {
    if (statusFilter !== 'ALL' && c.status_contrato !== statusFilter) return false
    if (search) {
      const s = search.toLowerCase()
      return (
        c.cliente_nome.toLowerCase().includes(s) ||
        (c.matricula || '').toLowerCase().includes(s) ||
        c.vin.toLowerCase().includes(s) ||
        c.marca.toLowerCase().includes(s)
      )
    }
    return true
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
          <h1 className="text-2xl font-extrabold tracking-tight">Contratos</h1>
          <p className="text-sm font-light text-nors-dark-gray mt-1">
            {contratos?.length || 0} contratos registados
          </p>
        </div>
        <Link
          to="/contratos/novo"
          className="inline-flex items-center gap-2 bg-nors-teal text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-nors-teal/90 transition-colors"
        >
          <Plus size={16} /> Novo Contrato
        </Link>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-nors-light-gray-2" />
          <input
            type="text"
            placeholder="Pesquisar cliente, matrícula, VIN..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-nors-light-gray text-sm focus:outline-none focus:ring-2 focus:ring-nors-teal/30 focus:border-nors-teal"
          />
        </div>
        <div className="flex rounded-lg border border-nors-light-gray overflow-hidden">
          {['ALL', 'ATIVO', 'A RENOVAR', 'EXPIRADO'].map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-2 text-xs font-semibold transition-colors ${
                statusFilter === s
                  ? 'bg-nors-black text-white'
                  : 'bg-white text-nors-dark-gray hover:bg-nors-off-white'
              }`}
            >
              {s === 'ALL' ? 'Todos' : s}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-nors-light-gray overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-nors-black text-white text-xs font-extrabold uppercase">
              <th className="text-left px-4 py-3">Cliente</th>
              <th className="text-left px-4 py-3">Matrícula</th>
              <th className="text-left px-4 py-3">Marca</th>
              <th className="text-center px-4 py-3">Início</th>
              <th className="text-center px-4 py-3">Validade</th>
              <th className="text-right px-4 py-3">USD/Mês</th>
              <th className="text-center px-4 py-3">Última Rev.</th>
              <th className="text-center px-4 py-3">Próxima</th>
              <th className="text-right px-4 py-3">KM Actual</th>
              <th className="text-right px-4 py-3">% KM</th>
              <th className="text-center px-4 py-3">Status</th>
              <th className="text-center px-4 py-3">Dias</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-nors-light-gray">
            {filtered.map((c) => (
              <tr key={c.contrato_id} className="hover:bg-nors-off-white even:bg-nors-off-white/50">
                <td className="px-4 py-2.5 font-semibold text-xs truncate max-w-[140px]">
                  <Link to={`/contratos/${c.contrato_id}`} className="text-nors-teal hover:underline">
                    {c.cliente_nome.split(' - ')[0]}
                  </Link>
                </td>
                <td className="px-4 py-2.5 text-xs font-mono">
                  {c.matricula || <span className="text-nors-light-gray-2">—</span>}
                </td>
                <td className="px-4 py-2.5 text-xs">{c.marca}</td>
                <td className="px-4 py-2.5 text-xs text-center">{formatDate(c.data_inicio)}</td>
                <td className="px-4 py-2.5 text-xs text-center">{formatDate(c.data_validade)}</td>
                <td className="px-4 py-2.5 text-xs text-right font-semibold">
                  {c.valor_mensal_usd ? formatUSD(c.valor_mensal_usd) : '—'}
                </td>
                <td className="px-4 py-2.5 text-xs text-center">{c.tipo_ultima_revisao || '—'}</td>
                <td className="px-4 py-2.5 text-xs text-center">{c.proxima_revisao_tipo || '—'}</td>
                <td className="px-4 py-2.5 text-xs text-right">{c.km_actual ? formatNumber(c.km_actual) : '—'}</td>
                <td className="px-4 py-2.5 text-xs text-right">{formatPercent(c.pct_km_consumido)}</td>
                <td className="px-4 py-2.5 text-center">
                  <StatusBadge status={c.status_contrato} />
                </td>
                <td className="px-4 py-2.5 text-xs text-center font-semibold">{c.dias_ate_expiracao}</td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={12} className="px-4 py-8 text-center text-nors-light-gray-2 text-sm">
                  Nenhum contrato encontrado
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
