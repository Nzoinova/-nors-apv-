import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Save } from 'lucide-react'
import { getClientes } from '@/services/clients'
import { getViaturasByCliente } from '@/services/vehicles'
import { createContrato } from '@/services/contracts'

export default function ContractForm() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [clienteId, setClienteId] = useState('')
  const [viaturaId, setViaturaId] = useState('')
  const [dataInicio, setDataInicio] = useState(new Date().toISOString().split('T')[0])
  const [duracaoMeses, setDuracaoMeses] = useState(24)
  const [intervaloKm, setIntervaloKm] = useState(15000)
  const [valorMensal, setValorMensal] = useState('')
  const [kmAnuais, setKmAnuais] = useState(60000)
  const [kmTotal, setKmTotal] = useState(120000)
  const [obs, setObs] = useState('')

  const { data: clientes } = useQuery({
    queryKey: ['clientes'],
    queryFn: getClientes,
  })

  const { data: viaturas } = useQuery({
    queryKey: ['viaturas-cliente', clienteId],
    queryFn: () => getViaturasByCliente(clienteId),
    enabled: !!clienteId,
  })

  const mutation = useMutation({
    mutationFn: createContrato,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['estado-contratos'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-kpis'] })
      navigate('/contratos')
    },
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!clienteId || !viaturaId) return
    mutation.mutate({
      cliente_id: clienteId,
      viatura_id: viaturaId,
      data_inicio: dataInicio,
      duracao_meses: duracaoMeses,
      intervalo_km_revisao: intervaloKm,
      valor_mensal_usd: valorMensal ? parseFloat(valorMensal) : null,
      km_anuais_contratados: kmAnuais,
      km_total_contratados: kmTotal,
      observacoes: obs || undefined,
    })
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <Link to="/contratos" className="inline-flex items-center gap-1.5 text-sm text-nors-teal hover:underline">
        <ArrowLeft size={16} /> Voltar
      </Link>

      <h1 className="text-2xl font-extrabold tracking-tight">Novo Contrato</h1>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Cliente */}
        <div>
          <label className="block text-xs font-extrabold uppercase tracking-wide text-nors-dark-gray mb-1.5">
            Cliente
          </label>
          <select
            value={clienteId}
            onChange={(e) => { setClienteId(e.target.value); setViaturaId('') }}
            required
            className="w-full px-3 py-2 rounded-lg border border-nors-light-gray text-sm focus:outline-none focus:ring-2 focus:ring-nors-teal/30"
          >
            <option value="">Seleccionar cliente...</option>
            {(clientes || []).map(c => (
              <option key={c.id} value={c.id}>{c.nome}</option>
            ))}
          </select>
        </div>

        {/* Viatura */}
        <div>
          <label className="block text-xs font-extrabold uppercase tracking-wide text-nors-dark-gray mb-1.5">
            Viatura
          </label>
          <select
            value={viaturaId}
            onChange={(e) => setViaturaId(e.target.value)}
            required
            disabled={!clienteId}
            className="w-full px-3 py-2 rounded-lg border border-nors-light-gray text-sm focus:outline-none focus:ring-2 focus:ring-nors-teal/30 disabled:opacity-50"
          >
            <option value="">{clienteId ? 'Seleccionar viatura...' : 'Seleccione um cliente primeiro'}</option>
            {(viaturas || []).map(v => (
              <option key={v.id} value={v.id}>
                {v.matricula || 'S/Mat'} — {v.vin} ({v.marca})
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-extrabold uppercase tracking-wide text-nors-dark-gray mb-1.5">
              Data Início
            </label>
            <input
              type="date"
              value={dataInicio}
              onChange={(e) => setDataInicio(e.target.value)}
              required
              className="w-full px-3 py-2 rounded-lg border border-nors-light-gray text-sm focus:outline-none focus:ring-2 focus:ring-nors-teal/30"
            />
          </div>
          <div>
            <label className="block text-xs font-extrabold uppercase tracking-wide text-nors-dark-gray mb-1.5">
              Duração (meses)
            </label>
            <input
              type="number"
              value={duracaoMeses}
              onChange={(e) => setDuracaoMeses(parseInt(e.target.value) || 24)}
              min={1}
              className="w-full px-3 py-2 rounded-lg border border-nors-light-gray text-sm focus:outline-none focus:ring-2 focus:ring-nors-teal/30"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-extrabold uppercase tracking-wide text-nors-dark-gray mb-1.5">
              Valor Mensal (USD)
            </label>
            <input
              type="number"
              step="0.01"
              value={valorMensal}
              onChange={(e) => setValorMensal(e.target.value)}
              placeholder="Ex: 385.00"
              className="w-full px-3 py-2 rounded-lg border border-nors-light-gray text-sm focus:outline-none focus:ring-2 focus:ring-nors-teal/30"
            />
          </div>
          <div>
            <label className="block text-xs font-extrabold uppercase tracking-wide text-nors-dark-gray mb-1.5">
              Intervalo KM Revisão
            </label>
            <input
              type="number"
              value={intervaloKm}
              onChange={(e) => setIntervaloKm(parseInt(e.target.value) || 15000)}
              className="w-full px-3 py-2 rounded-lg border border-nors-light-gray text-sm focus:outline-none focus:ring-2 focus:ring-nors-teal/30"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-extrabold uppercase tracking-wide text-nors-dark-gray mb-1.5">
              KM Anuais Contratados
            </label>
            <input
              type="number"
              value={kmAnuais}
              onChange={(e) => setKmAnuais(parseInt(e.target.value) || 60000)}
              className="w-full px-3 py-2 rounded-lg border border-nors-light-gray text-sm focus:outline-none focus:ring-2 focus:ring-nors-teal/30"
            />
          </div>
          <div>
            <label className="block text-xs font-extrabold uppercase tracking-wide text-nors-dark-gray mb-1.5">
              KM Total Contratados
            </label>
            <input
              type="number"
              value={kmTotal}
              onChange={(e) => setKmTotal(parseInt(e.target.value) || 120000)}
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
            rows={3}
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
          disabled={mutation.isPending || !clienteId || !viaturaId}
          className="inline-flex items-center gap-2 bg-nors-teal text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-nors-teal/90 transition-colors disabled:opacity-50"
        >
          <Save size={16} />
          {mutation.isPending ? 'A guardar...' : 'Criar Contrato'}
        </button>
      </form>
    </div>
  )
}
