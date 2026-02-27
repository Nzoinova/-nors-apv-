import { useQuery } from '@tanstack/react-query'
import { FileText, DollarSign, AlertTriangle, Users, Truck, RefreshCw } from 'lucide-react'
import { getKPIs, getAlertas, getEstadoContratos } from '@/services/dashboard'
import { getConfig } from '@/services/config'
import { KPICard } from '@/components/shared/KPICard'
import { StatusBadge, PrioridadeBadge } from '@/components/shared/StatusBadge'
import { formatUSD, formatKZ, formatDate, formatNumber } from '@/utils/formatters'
import { Link } from 'react-router-dom'

export default function Dashboard() {
  const { data: kpis, isLoading: loadingKPIs } = useQuery({
    queryKey: ['dashboard-kpis'],
    queryFn: getKPIs,
  })

  const { data: alertas } = useQuery({
    queryKey: ['alertas'],
    queryFn: getAlertas,
  })

  const { data: contratos } = useQuery({
    queryKey: ['estado-contratos'],
    queryFn: getEstadoContratos,
  })

  const { data: config } = useQuery({
    queryKey: ['config'],
    queryFn: getConfig,
  })

  if (loadingKPIs) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="animate-spin text-nors-teal" size={24} />
      </div>
    )
  }

  const alertasAlta = alertas?.filter(a => a.prioridade === 'ALTA') || []
  const alertasMedia = alertas?.filter(a => a.prioridade === 'MEDIA') || []
  const alertasInfo = alertas?.filter(a => a.prioridade === 'INFO') || []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Dashboard</h1>
          <p className="text-sm font-light text-nors-dark-gray mt-1">
            Visão geral dos contratos de manutenção APV
          </p>
        </div>
        {config && (
          <div className="text-right text-xs font-light text-nors-light-gray-2">
            <p>Taxa câmbio: <span className="font-semibold text-nors-dark-gray">{formatNumber(config.taxa_cambio_usd_kz)} KZ/USD</span></p>
            <p>Actualizada: {formatDate(config.data_atualizacao_taxa)}</p>
          </div>
        )}
      </div>

      {/* KPI Cards */}
      {kpis && (
        <div className="grid grid-cols-4 gap-4">
          <KPICard
            title="Contratos Activos"
            value={kpis.contratos_ativos}
            subtitle={`${kpis.total_contratos} total`}
            icon={FileText}
            accent
          />
          <KPICard
            title="Receita Mensal"
            value={formatUSD(kpis.receita_mensal_usd)}
            subtitle={formatKZ(kpis.receita_mensal_kz)}
            icon={DollarSign}
            accent
          />
          <KPICard
            title="Clientes"
            value={kpis.total_clientes}
            subtitle={`${kpis.total_marcas} marca(s)`}
            icon={Users}
          />
          <KPICard
            title="Alertas"
            value={alertasAlta.length}
            subtitle={`${(alertas || []).length} total`}
            icon={AlertTriangle}
          />
        </div>
      )}

      <div className="grid grid-cols-3 gap-6">
        {/* Alertas */}
        <div className="col-span-1 space-y-4">
          <h2 className="text-sm font-extrabold uppercase tracking-wide text-nors-dark-gray">Alertas</h2>
          
          {(alertas || []).length === 0 ? (
            <div className="bg-white rounded-lg border border-nors-light-gray p-4 text-center">
              <p className="text-sm text-nors-light-gray-2">Sem alertas activos</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {[...alertasAlta, ...alertasMedia, ...alertasInfo].map((alerta, i) => (
                <div key={i} className="bg-white rounded-lg border border-nors-light-gray p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-nors-black truncate">{alerta.descricao}</p>
                      <p className="text-xs font-light text-nors-dark-gray mt-0.5">{alerta.detalhe}</p>
                    </div>
                    <PrioridadeBadge prioridade={alerta.prioridade} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Tabela de Contratos */}
        <div className="col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-extrabold uppercase tracking-wide text-nors-dark-gray">
              Contratos ({contratos?.length || 0})
            </h2>
            <Link to="/contratos" className="text-xs text-nors-teal hover:underline font-semibold">
              Ver todos →
            </Link>
          </div>

          <div className="bg-white rounded-lg border border-nors-light-gray overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-nors-black text-white text-xs font-extrabold uppercase">
                  <th className="text-left px-4 py-3">Cliente</th>
                  <th className="text-left px-4 py-3">Matrícula</th>
                  <th className="text-left px-4 py-3">Marca</th>
                  <th className="text-right px-4 py-3">USD/Mês</th>
                  <th className="text-center px-4 py-3">Última Rev.</th>
                  <th className="text-center px-4 py-3">Próxima</th>
                  <th className="text-center px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-nors-light-gray">
                {(contratos || []).slice(0, 10).map((c) => (
                  <tr key={c.contrato_id} className="hover:bg-nors-off-white even:bg-nors-off-white/50">
                    <td className="px-4 py-2.5 font-semibold text-xs truncate max-w-[160px]">
                      {c.cliente_nome.split(' - ')[0]}
                    </td>
                    <td className="px-4 py-2.5 text-xs font-mono">
                      {c.matricula || <span className="text-nors-light-gray-2">N/A</span>}
                    </td>
                    <td className="px-4 py-2.5 text-xs">{c.marca}</td>
                    <td className="px-4 py-2.5 text-xs text-right font-semibold">
                      {c.valor_mensal_usd ? formatUSD(c.valor_mensal_usd) : '—'}
                    </td>
                    <td className="px-4 py-2.5 text-xs text-center">
                      {c.tipo_ultima_revisao || '—'}
                    </td>
                    <td className="px-4 py-2.5 text-xs text-center">
                      {c.proxima_revisao_tipo || '—'}
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      <StatusBadge status={c.status_contrato} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
