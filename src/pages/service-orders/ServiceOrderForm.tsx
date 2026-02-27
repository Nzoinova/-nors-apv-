import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Save } from 'lucide-react'
import { getViaturas } from '@/services/vehicles'
import { createOS } from '@/services/service-orders'
import { CICLO_DONGFENG, TIPOS_REVISAO, STATUS_OS } from '@/utils/constants'

export default function ServiceOrderForm() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [viaturaId, setViaturaId] = useState('')
  const [dataOS, setDataOS] = useState(new Date().toISOString().split('T')[0])
  const [tipoRevisao, setTipoRevisao] = useState('')
  const [kmRevisao, setKmRevisao] = useState('')
  const [descricao, setDescricao] = useState('')
  const [custoKz, setCustoKz] = useState('')
  const [tecnico, setTecnico] = useState('')
  const [status, setStatus] = useState('Aberta')
  const [obs, setObs] = useState('')

  const { data: viaturas } = useQuery({
    queryKey: ['viaturas'],
    queryFn: getViaturas,
  })

  const mutation = useMutation({
    mutationFn: createOS,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ordens-servico'] })
      queryClient.invalidateQueries({ queryKey: ['estado-contratos'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-kpis'] })
      queryClient.invalidateQueries({ queryKey: ['alertas'] })
      navigate('/os')
    },
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!viaturaId || !tipoRevisao || !kmRevisao) return
    mutation.mutate({
      viatura_id: viaturaId,
      data_os: dataOS,
      tipo_revisao: tipoRevisao,
      km_na_revisao: parseInt(kmRevisao),
      descricao_servico: descricao || undefined,
      custo_kz: custoKz ? parseFloat(custoKz) : undefined,
      tecnico: tecnico || undefined,
      status,
      observacoes: obs || undefined,
    })
  }

  const selectedViatura = viaturas?.find(v => v.id === viaturaId)

  return (
    <div className="space-y-6 max-w-2xl">
      <Link to="/os" className="inline-flex items-center gap-1.5 text-sm text-nors-teal hover:underline">
        <ArrowLeft size={16} /> Voltar
      </Link>

      <h1 className="text-2xl font-extrabold tracking-tight">Nova Ordem de Serviço</h1>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-xs font-extrabold uppercase tracking-wide text-nors-dark-gray mb-1.5">
            Viatura
          </label>
          <select
            value={viaturaId}
            onChange={(e) => setViaturaId(e.target.value)}
            required
            className="w-full px-3 py-2 rounded-lg border border-nors-light-gray text-sm focus:outline-none focus:ring-2 focus:ring-nors-teal/30"
          >
            <option value="">Seleccionar viatura...</option>
            {(viaturas || []).map(v => (
              <option key={v.id} value={v.id}>
                {v.matricula || 'S/Mat'} — {v.marca} — {(v.cliente as any)?.nome?.split(' - ')[0] || ''}
              </option>
            ))}
          </select>
          {selectedViatura && (
            <p className="text-xs text-nors-light-gray-2 mt-1">
              VIN: {selectedViatura.vin}
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-extrabold uppercase tracking-wide text-nors-dark-gray mb-1.5">
              Data
            </label>
            <input
              type="date"
              value={dataOS}
              onChange={(e) => setDataOS(e.target.value)}
              required
              className="w-full px-3 py-2 rounded-lg border border-nors-light-gray text-sm focus:outline-none focus:ring-2 focus:ring-nors-teal/30"
            />
          </div>
          <div>
            <label className="block text-xs font-extrabold uppercase tracking-wide text-nors-dark-gray mb-1.5">
              Tipo de Revisão
            </label>
            <select
              value={tipoRevisao}
              onChange={(e) => { setTipoRevisao(e.target.value); setDescricao(TIPOS_REVISAO[e.target.value] || '') }}
              required
              className="w-full px-3 py-2 rounded-lg border border-nors-light-gray text-sm focus:outline-none focus:ring-2 focus:ring-nors-teal/30"
            >
              <option value="">Seleccionar...</option>
              {CICLO_DONGFENG.map(t => (
                <option key={t} value={t}>{t} — {TIPOS_REVISAO[t]}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-extrabold uppercase tracking-wide text-nors-dark-gray mb-1.5">
              KM na Revisão
            </label>
            <input
              type="number"
              value={kmRevisao}
              onChange={(e) => setKmRevisao(e.target.value)}
              placeholder="Ex: 45000"
              required
              className="w-full px-3 py-2 rounded-lg border border-nors-light-gray text-sm focus:outline-none focus:ring-2 focus:ring-nors-teal/30"
            />
          </div>
          <div>
            <label className="block text-xs font-extrabold uppercase tracking-wide text-nors-dark-gray mb-1.5">
              Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-nors-light-gray text-sm focus:outline-none focus:ring-2 focus:ring-nors-teal/30"
            >
              {STATUS_OS.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-extrabold uppercase tracking-wide text-nors-dark-gray mb-1.5">
            Descrição do Serviço
          </label>
          <input
            type="text"
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-nors-light-gray text-sm focus:outline-none focus:ring-2 focus:ring-nors-teal/30"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-extrabold uppercase tracking-wide text-nors-dark-gray mb-1.5">
              Custo (KZ)
            </label>
            <input
              type="number"
              step="0.01"
              value={custoKz}
              onChange={(e) => setCustoKz(e.target.value)}
              placeholder="Opcional"
              className="w-full px-3 py-2 rounded-lg border border-nors-light-gray text-sm focus:outline-none focus:ring-2 focus:ring-nors-teal/30"
            />
          </div>
          <div>
            <label className="block text-xs font-extrabold uppercase tracking-wide text-nors-dark-gray mb-1.5">
              Técnico
            </label>
            <input
              type="text"
              value={tecnico}
              onChange={(e) => setTecnico(e.target.value)}
              placeholder="Opcional"
              className="w-full px-3 py-2 rounded-lg border border-nors-light-gray text-sm focus:outline-none focus:ring-2 focus:ring-nors-teal/30"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-extrabold uppercase tracking-wide text-nors-dark-gray mb-1.5">
            Observações
          </label>
          <textarea
            value={obs}
            onChange={(e) => setObs(e.target.value)}
            rows={2}
            className="w-full px-3 py-2 rounded-lg border border-nors-light-gray text-sm focus:outline-none focus:ring-2 focus:ring-nors-teal/30"
          />
        </div>

        {mutation.error && (
          <div className="bg-red-50 text-red-700 px-4 py-2 rounded-lg text-sm">
            Erro: {(mutation.error as Error).message}
          </div>
        )}

        <button
          type="submit"
          disabled={mutation.isPending || !viaturaId || !tipoRevisao || !kmRevisao}
          className="inline-flex items-center gap-2 bg-nors-teal text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-nors-teal/90 transition-colors disabled:opacity-50"
        >
          <Save size={16} />
          {mutation.isPending ? 'A guardar...' : 'Registar OS'}
        </button>
      </form>
    </div>
  )
}
