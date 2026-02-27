import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, RefreshCw } from 'lucide-react'
import { getContrato } from '@/services/contracts'
import { getOSByViatura } from '@/services/service-orders'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { formatUSD, formatKZ, formatDate, formatNumber } from '@/utils/formatters'
import { TIPOS_REVISAO } from '@/utils/constants'
import { getConfig } from '@/services/config'

export default function ContractDetail() {
  const { id } = useParams<{ id: string }>()

  const { data: contrato, isLoading } = useQuery({
    queryKey: ['contrato', id],
    queryFn: () => getContrato(id!),
    enabled: !!id,
  })

  const { data: ordensServico } = useQuery({
    queryKey: ['os-viatura', contrato?.viatura_id],
    queryFn: () => getOSByViatura(contrato!.viatura_id),
    enabled: !!contrato?.viatura_id,
  })

  const { data: config } = useQuery({
    queryKey: ['config'],
    queryFn: getConfig,
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="animate-spin text-nors-teal" size={24} />
      </div>
    )
  }

  if (!contrato) {
    return <p className="text-nors-dark-gray">Contrato não encontrado.</p>
  }

  const taxa = config?.taxa_cambio_usd_kz || 948
  const valorKZ = contrato.valor_mensal_usd ? contrato.valor_mensal_usd * taxa : null
  const diasRestantes = Math.ceil(
    (new Date(contrato.data_validade).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  )
  const status = diasRestantes < 0 ? 'EXPIRADO' : diasRestantes <= 60 ? 'A RENOVAR' : 'ATIVO'

  return (
    <div className="space-y-6">
      <Link to="/contratos" className="inline-flex items-center gap-1.5 text-sm text-nors-teal hover:underline">
        <ArrowLeft size={16} /> Voltar a Contratos
      </Link>

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">
            {(contrato.cliente as any)?.nome?.split(' - ')[0] || 'Cliente'}
          </h1>
          <p className="text-sm font-light text-nors-dark-gray mt-1">
            {(contrato.viatura as any)?.matricula || (contrato.viatura as any)?.vin} — {(contrato.viatura as any)?.marca}
          </p>
        </div>
        <StatusBadge status={status} />
      </div>

      {/* Info Grid */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border border-nors-light-gray p-4 space-y-3">
          <h3 className="text-xs font-extrabold uppercase tracking-wide text-nors-dark-gray">Contrato</h3>
          <div className="space-y-2 text-sm">
            <Row label="Início" value={formatDate(contrato.data_inicio)} />
            <Row label="Duração" value={`${contrato.duracao_meses} meses`} />
            <Row label="Validade" value={formatDate(contrato.data_validade)} />
            <Row label="Dias restantes" value={`${diasRestantes}`} bold />
          </div>
        </div>

        <div className="bg-white rounded-lg border border-nors-light-gray p-4 space-y-3">
          <h3 className="text-xs font-extrabold uppercase tracking-wide text-nors-dark-gray">Financeiro</h3>
          <div className="space-y-2 text-sm">
            <Row label="Mensal USD" value={formatUSD(contrato.valor_mensal_usd)} bold />
            <Row label="Mensal KZ" value={formatKZ(valorKZ)} />
            <Row label="Anual USD" value={contrato.valor_mensal_usd ? formatUSD(contrato.valor_mensal_usd * 12) : '—'} />
            <Row label="Total contrato" value={contrato.valor_mensal_usd ? formatUSD(contrato.valor_mensal_usd * contrato.duracao_meses) : '—'} />
          </div>
        </div>

        <div className="bg-white rounded-lg border border-nors-light-gray p-4 space-y-3">
          <h3 className="text-xs font-extrabold uppercase tracking-wide text-nors-dark-gray">Quilometragem</h3>
          <div className="space-y-2 text-sm">
            <Row label="KM Inicial" value={formatNumber((contrato.viatura as any)?.km_inicial)} />
            <Row label="Intervalo revisão" value={formatNumber(contrato.intervalo_km_revisao) + ' km'} />
            <Row label="KM/Ano contratados" value={formatNumber(contrato.km_anuais_contratados)} />
            <Row label="KM total contratados" value={formatNumber(contrato.km_total_contratados)} />
          </div>
        </div>
      </div>

      {/* Histórico de OS */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-extrabold uppercase tracking-wide text-nors-dark-gray">
            Histórico de Serviço ({ordensServico?.length || 0} OS)
          </h2>
          <Link
            to="/os/nova"
            className="text-xs text-nors-teal hover:underline font-semibold"
          >
            + Nova OS
          </Link>
        </div>

        <div className="bg-white rounded-lg border border-nors-light-gray overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-nors-black text-white text-xs font-extrabold uppercase">
                <th className="text-left px-4 py-3">Nº OS</th>
                <th className="text-center px-4 py-3">Data</th>
                <th className="text-center px-4 py-3">Tipo</th>
                <th className="text-right px-4 py-3">KM</th>
                <th className="text-left px-4 py-3">Descrição</th>
                <th className="text-right px-4 py-3">Custo KZ</th>
                <th className="text-center px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-nors-light-gray">
              {(ordensServico || []).map((os) => (
                <tr key={os.id} className="hover:bg-nors-off-white even:bg-nors-off-white/50">
                  <td className="px-4 py-2.5 text-xs font-mono">{os.numero_os}</td>
                  <td className="px-4 py-2.5 text-xs text-center">{formatDate(os.data_os)}</td>
                  <td className="px-4 py-2.5 text-xs text-center font-semibold">{os.tipo_revisao}</td>
                  <td className="px-4 py-2.5 text-xs text-right">{formatNumber(os.km_na_revisao)}</td>
                  <td className="px-4 py-2.5 text-xs">{os.descricao_servico || TIPOS_REVISAO[os.tipo_revisao] || '—'}</td>
                  <td className="px-4 py-2.5 text-xs text-right">{os.custo_kz ? formatKZ(os.custo_kz) : '—'}</td>
                  <td className="px-4 py-2.5 text-xs text-center">
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
              ))}
              {(!ordensServico || ordensServico.length === 0) && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-nors-light-gray-2 text-sm">
                    Sem ordens de serviço registadas
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex justify-between">
      <span className="text-nors-dark-gray font-light">{label}</span>
      <span className={bold ? 'font-semibold' : ''}>{value}</span>
    </div>
  )
}
