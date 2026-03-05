import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, RefreshCw, Pencil, X, Save } from 'lucide-react'
import { getContrato, updateContrato } from '@/services/contracts'
import { getOSByViatura } from '@/services/service-orders'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { formatUSD, formatKZ, formatDate, formatNumber, formatHorasMotor } from '@/utils/formatters'
import { TIPOS_REVISAO } from '@/utils/constants'
import { getConfig } from '@/services/config'

export default function ContractDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [editing, setEditing] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

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

  const [editValorMensal, setEditValorMensal] = useState('')
  const [editDuracao, setEditDuracao] = useState('')
  const [editIntervaloKm, setEditIntervaloKm] = useState('')
  const [editKmAnuais, setEditKmAnuais] = useState('')
  const [editKmTotal, setEditKmTotal] = useState('')
  const [editObs, setEditObs] = useState('')

  function startEdit() {
    if (!contrato) return
    setEditValorMensal(contrato.valor_mensal_usd?.toString() || '')
    setEditDuracao(contrato.duracao_meses.toString())
    setEditIntervaloKm(contrato.intervalo_km_revisao.toString())
    setEditKmAnuais(contrato.km_anuais_contratados.toString())
    setEditKmTotal(contrato.km_total_contratados.toString())
    setEditObs(contrato.observacoes || '')
    setEditing(true)
  }

  const mutation = useMutation({
    mutationFn: (updates: Record<string, unknown>) => updateContrato(id!, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contrato', id] })
      queryClient.invalidateQueries({ queryKey: ['estado-contratos'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-kpis'] })
      setEditing(false)
      setShowConfirm(false)
    },
  })

  function handleSave() {
    mutation.mutate({
      valor_mensal_usd: editValorMensal ? parseFloat(editValorMensal) : null,
      duracao_meses: parseInt(editDuracao) || contrato!.duracao_meses,
      data_inicio: contrato!.data_inicio,
      intervalo_km_revisao: parseInt(editIntervaloKm) || contrato!.intervalo_km_revisao,
      km_anuais_contratados: parseInt(editKmAnuais) || contrato!.km_anuais_contratados,
      km_total_contratados: parseInt(editKmTotal) || contrato!.km_total_contratados,
      observacoes: editObs || null,
    })
  }

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
  const viatura = contrato.viatura as any

  return (
    <div className="space-y-6">
      <ConfirmDialog
        open={showConfirm}
        title="Guardar alterações?"
        message="Tem a certeza que deseja guardar as alterações ao contrato?"
        confirmLabel="Guardar"
        onConfirm={handleSave}
        onCancel={() => setShowConfirm(false)}
      />

      <button onClick={() => navigate(-1)} className="inline-flex items-center gap-1.5 text-sm text-nors-teal hover:underline">
        <ArrowLeft size={16} /> Voltar a Contratos
      </button>

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {(contrato.cliente as any)?.nome?.split(' - ')[0] || 'Cliente'}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {viatura?.matricula || viatura?.vin} — {viatura?.marca}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <StatusBadge status={status} />
          {!editing ? (
            <button onClick={startEdit} className="inline-flex items-center gap-1.5 bg-white text-gray-700 h-10 px-4 rounded-md text-sm font-medium border border-gray-200 hover:bg-gray-50 transition-colors">
              <Pencil size={14} /> Editar
            </button>
          ) : (
            <div className="flex gap-2">
              <button onClick={() => setEditing(false)} className="inline-flex items-center gap-1.5 bg-white text-gray-700 h-10 px-4 rounded-md text-sm font-medium border border-gray-200 hover:bg-gray-50 transition-colors">
                <X size={14} /> Cancelar
              </button>
              <button onClick={() => setShowConfirm(true)} disabled={mutation.isPending} className="inline-flex items-center gap-1.5 bg-nors-teal text-white h-10 px-4 rounded-md text-sm font-medium hover:opacity-90 transition-colors disabled:opacity-50">
                <Save size={14} /> {mutation.isPending ? 'A guardar...' : 'Guardar'}
              </button>
            </div>
          )}
        </div>
      </div>

      {mutation.error && (
        <div className="bg-red-50 text-red-700 px-4 py-2 rounded-lg text-sm">Erro: {(mutation.error as Error).message}</div>
      )}

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500">Contrato</h3>
          <div className="space-y-2 text-sm">
            <Row label="Início" value={formatDate(contrato.data_inicio)} />
            {editing ? (
              <EditRow label="Duração (meses)" value={editDuracao} onChange={setEditDuracao} type="number" />
            ) : (
              <Row label="Duração" value={`${contrato.duracao_meses} meses`} />
            )}
            <Row label="Validade" value={formatDate(contrato.data_validade)} />
            <Row label="Dias restantes" value={`${diasRestantes}`} bold />
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500">Financeiro</h3>
          <div className="space-y-2 text-sm">
            {editing ? (
              <EditRow label="Mensal USD" value={editValorMensal} onChange={setEditValorMensal} type="number" step="0.01" />
            ) : (
              <Row label="Mensal USD" value={formatUSD(contrato.valor_mensal_usd)} bold />
            )}
            <Row label="Mensal KZ" value={formatKZ(valorKZ)} />
            <Row label="Anual USD" value={contrato.valor_mensal_usd ? formatUSD(contrato.valor_mensal_usd * 12) : '—'} />
            <Row label="Total contrato" value={contrato.valor_mensal_usd ? formatUSD(contrato.valor_mensal_usd * contrato.duracao_meses) : '—'} />
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500">Quilometragem & Motor</h3>
          <div className="space-y-2 text-sm">
            <Row label="KM Inicial" value={formatNumber(viatura?.km_inicial)} />
            <Row label="Horas Motor" value={formatHorasMotor(viatura?.horas_motor_segundos)} />
            {editing ? (
              <>
                <EditRow label="Intervalo revisão (km)" value={editIntervaloKm} onChange={setEditIntervaloKm} type="number" />
                <EditRow label="KM/Ano contratados" value={editKmAnuais} onChange={setEditKmAnuais} type="number" />
                <EditRow label="KM total contratados" value={editKmTotal} onChange={setEditKmTotal} type="number" />
              </>
            ) : (
              <>
                <Row label="Intervalo revisão" value={formatNumber(contrato.intervalo_km_revisao) + ' km'} />
                <Row label="KM/Ano contratados" value={formatNumber(contrato.km_anuais_contratados)} />
                <Row label="KM total contratados" value={formatNumber(contrato.km_total_contratados)} />
              </>
            )}
          </div>
        </div>
      </div>

      {editing && (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 space-y-2">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500">Observações</h3>
          <textarea value={editObs} onChange={(e) => setEditObs(e.target.value)} rows={2} className="w-full px-3 py-2 rounded-lg border border-gray-200 shadow-sm text-sm focus:outline-none focus:border-nors-teal focus:ring-1 focus:ring-nors-teal/20" />
        </div>
      )}

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500">
            Histórico de Serviço ({ordensServico?.length || 0} OS)
          </h2>
          <Link to="/os/nova" className="text-xs text-nors-teal hover:underline font-semibold">+ Nova OS</Link>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50/50 text-xs font-medium uppercase tracking-wider text-gray-500">
                <th className="text-left px-4 py-3">Nº OS</th>
                <th className="text-center px-4 py-3">Data</th>
                <th className="text-center px-4 py-3">Tipo</th>
                <th className="text-right px-4 py-3">KM</th>
                <th className="text-right px-4 py-3">Motor</th>
                <th className="text-left px-4 py-3">Descrição</th>
                <th className="text-right px-4 py-3">Custo KZ</th>
                <th className="text-center px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {(ordensServico || []).map((os) => (
                <tr key={os.id} className="border-b border-gray-100 hover:bg-gray-50/50">
                  <td className="px-4 py-2.5 text-xs font-mono">{os.numero_os}</td>
                  <td className="px-4 py-2.5 text-xs text-center">{formatDate(os.data_os)}</td>
                  <td className="px-4 py-2.5 text-xs text-center font-semibold">{os.tipo_revisao}</td>
                  <td className="px-4 py-2.5 text-xs text-right">{formatNumber(os.km_na_revisao)}</td>
                  <td className="px-4 py-2.5 text-xs text-right">{formatHorasMotor(os.horas_motor_na_revisao)}</td>
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
                <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-400 text-sm">Sem ordens de serviço registadas</td></tr>
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
    <div className="flex justify-between items-center">
      <span className="text-gray-500">{label}</span>
      <span className={bold ? 'font-semibold' : ''}>{value}</span>
    </div>
  )
}

function EditRow({ label, value, onChange, type = 'text', step }: { label: string; value: string; onChange: (v: string) => void; type?: string; step?: string }) {
  return (
    <div className="flex justify-between items-center gap-3">
      <span className="text-gray-500 text-xs whitespace-nowrap">{label}</span>
      <input type={type} step={step} value={value} onChange={(e) => onChange(e.target.value)} className="w-28 px-2 py-1 rounded border border-gray-200 focus:border-nors-teal focus:ring-1 focus:ring-nors-teal/20 text-xs text-right focus:outline-none focus:border-nors-teal focus:ring-1 focus:ring-nors-teal/20" />
    </div>
  )
}
