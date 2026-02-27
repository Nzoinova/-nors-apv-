import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { RefreshCw, Save } from 'lucide-react'
import { getConfig, updateTaxaCambio } from '@/services/config'
import { formatDate, formatNumber } from '@/utils/formatters'

export default function Settings() {
  const queryClient = useQueryClient()
  const [novaTaxa, setNovaTaxa] = useState('')

  const { data: config, isLoading } = useQuery({
    queryKey: ['config'],
    queryFn: getConfig,
  })

  const mutation = useMutation({
    mutationFn: (taxa: number) => updateTaxaCambio(taxa),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['config'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-kpis'] })
      queryClient.invalidateQueries({ queryKey: ['estado-contratos'] })
      setNovaTaxa('')
    },
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="animate-spin text-nors-teal" size={24} />
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-xl">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">Configurações</h1>
        <p className="text-sm font-light text-nors-dark-gray mt-1">
          Parâmetros do sistema
        </p>
      </div>

      {/* Taxa de Câmbio */}
      <div className="bg-white rounded-lg border border-nors-light-gray p-5 space-y-4">
        <h2 className="text-sm font-extrabold uppercase tracking-wide text-nors-dark-gray">Taxa de Câmbio</h2>
        
        <div className="flex items-center justify-between">
          <div>
            <p className="text-2xl font-extrabold text-nors-teal">
              {config ? formatNumber(config.taxa_cambio_usd_kz) : '—'} <span className="text-sm font-light text-nors-dark-gray">KZ/USD</span>
            </p>
            <p className="text-xs text-nors-light-gray-2 mt-0.5">
              Última actualização: {config ? formatDate(config.data_atualizacao_taxa) : '—'}
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <input
            type="number"
            step="0.01"
            value={novaTaxa}
            onChange={(e) => setNovaTaxa(e.target.value)}
            placeholder="Nova taxa (ex: 950.00)"
            className="flex-1 px-3 py-2 rounded-lg border border-nors-light-gray text-sm focus:outline-none focus:ring-2 focus:ring-nors-teal/30"
          />
          <button
            onClick={() => novaTaxa && mutation.mutate(parseFloat(novaTaxa))}
            disabled={!novaTaxa || mutation.isPending}
            className="inline-flex items-center gap-2 bg-nors-teal text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-nors-teal/90 transition-colors disabled:opacity-50"
          >
            <Save size={16} />
            {mutation.isPending ? 'A guardar...' : 'Actualizar'}
          </button>
        </div>
      </div>

      {/* Parâmetros */}
      <div className="bg-white rounded-lg border border-nors-light-gray p-5 space-y-4">
        <h2 className="text-sm font-extrabold uppercase tracking-wide text-nors-dark-gray">Parâmetros de Alerta</h2>
        
        <div className="space-y-3 text-sm">
          <div className="flex justify-between py-2 border-b border-nors-light-gray">
            <span className="text-nors-dark-gray font-light">Intervalo entre revisões</span>
            <span className="font-semibold">{config?.intervalo_dias_revisao} dias</span>
          </div>
          <div className="flex justify-between py-2 border-b border-nors-light-gray">
            <span className="text-nors-dark-gray font-light">Alerta de renovação</span>
            <span className="font-semibold">{config?.alerta_renovacao_dias} dias antes</span>
          </div>
          <div className="flex justify-between py-2">
            <span className="text-nors-dark-gray font-light">Alerta de revisão</span>
            <span className="font-semibold">{config?.alerta_revisao_dias} dias antes</span>
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="bg-nors-off-white rounded-lg p-4">
        <p className="text-xs text-nors-dark-gray font-light">
          NORS APV v1.0 — Gestão de Contratos de Manutenção
        </p>
        <p className="text-xs text-nors-light-gray-2 font-light mt-0.5">
          NORS Trucks and Buses Angola VT
        </p>
      </div>
    </div>
  )
}
