import { useState, useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { RefreshCw, Save, Copy, ExternalLink, Lock } from 'lucide-react'
import { getConfig, updateConfiguracoes, getCiclosRevisao, getSystemCounts, updateDongfengCycles } from '@/services/config'
import { formatNumber } from '@/utils/formatters'
import type { CicloRevisao } from '@/types'

const PORTAL_URL = 'https://nzoinova.github.io/-nors-apv-/#/recepcao'

const VOLVO_FIXED = [
  { posicao: 1, tipo_revisao: 'B1', descricao: 'Básica' },
  { posicao: 2, tipo_revisao: 'B2', descricao: 'Básica' },
  { posicao: 3, tipo_revisao: 'B3', descricao: 'Básica' },
  { posicao: 4, tipo_revisao: 'MC', descricao: 'Completa' },
]

const DONGFENG_5 = [
  { posicao: 1, tipo_revisao: 'B1', descricao: 'Básica' },
  { posicao: 2, tipo_revisao: 'B2', descricao: 'Básica' },
  { posicao: 3, tipo_revisao: 'B3', descricao: 'Básica' },
  { posicao: 4, tipo_revisao: 'B4', descricao: 'Básica' },
  { posicao: 5, tipo_revisao: 'MC', descricao: 'Completa' },
]

const DONGFENG_7 = [
  { posicao: 1, tipo_revisao: 'B1', descricao: 'Básica' },
  { posicao: 2, tipo_revisao: 'B2', descricao: 'Básica' },
  { posicao: 3, tipo_revisao: 'B3', descricao: 'Básica' },
  { posicao: 4, tipo_revisao: 'B4', descricao: 'Básica' },
  { posicao: 5, tipo_revisao: 'B5', descricao: 'Básica' },
  { posicao: 6, tipo_revisao: 'B6', descricao: 'Básica' },
  { posicao: 7, tipo_revisao: 'MC', descricao: 'Completa' },
]

function getTipoDescricao(tipo: string): string {
  if (tipo === 'MC') return 'Completa'
  return 'Básica'
}

export default function Settings() {
  const queryClient = useQueryClient()
  const [taxaCambio, setTaxaCambio] = useState<string>('')
  const [alertaRenovacao, setAlertaRenovacao] = useState<string>('')
  const [intervaloDias, setIntervaloDias] = useState<string>('')
  const [configLoaded, setConfigLoaded] = useState(false)
  const [saveMessage, setSaveMessage] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [dongfengCycleCount, setDongfengCycleCount] = useState<5 | 7>(5)
  const [dongfengSaved, setDongfengSaved] = useState(false)

  const { data: config, isLoading: configLoading } = useQuery({
    queryKey: ['config'],
    queryFn: getConfig,
  })

  const { data: ciclos } = useQuery({
    queryKey: ['ciclos-revisao'],
    queryFn: getCiclosRevisao,
  })

  const { data: counts } = useQuery({
    queryKey: ['system-counts'],
    queryFn: getSystemCounts,
  })

  // Detect current Dongfeng cycle count from DB
  useEffect(() => {
    if (ciclos && ciclos.filter((c: CicloRevisao) => c.marca === 'Dongfeng').length === 7) {
      setDongfengCycleCount(7)
    }
  }, [ciclos])

  // Initialize form values from config
  if (config && !configLoaded) {
    setTaxaCambio(String(config.taxa_cambio_usd_kz))
    setAlertaRenovacao(String(config.alerta_renovacao_dias))
    setIntervaloDias(String(config.intervalo_dias_revisao))
    setConfigLoaded(true)
  }

  const handleSave = async () => {
    const taxa = parseFloat(taxaCambio)
    const alerta = parseInt(alertaRenovacao)
    const intervalo = parseInt(intervaloDias)
    if (isNaN(taxa) || isNaN(alerta) || isNaN(intervalo)) return
    try {
      await updateConfiguracoes({
        taxa_cambio_usd_kz: taxa,
        alerta_renovacao_dias: alerta,
        intervalo_dias_revisao: intervalo,
        data_atualizacao_taxa: new Date().toISOString().split('T')[0],
      })
      queryClient.invalidateQueries({ queryKey: ['config'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard-kpis'] })
      queryClient.invalidateQueries({ queryKey: ['estado-contratos'] })
      setSaveMessage('Alterações guardadas com sucesso.')
      setTimeout(() => setSaveMessage(null), 3000)
    } catch (err) {
      console.error('Erro ao guardar configurações:', err)
    }
  }

  const handleDongfengCycleChange = async (count: 5 | 7) => {
    setDongfengCycleCount(count)
    const newCycle = count === 5 ? DONGFENG_5 : DONGFENG_7

    try {
      await updateDongfengCycles(newCycle)
      queryClient.invalidateQueries({ queryKey: ['ciclos-revisao'] })

      setDongfengSaved(true)
      setTimeout(() => setDongfengSaved(false), 2000)
    } catch (err) {
      console.error('Erro ao actualizar ciclo:', err)
    }
  }

  const handleCopy = async () => {
    await navigator.clipboard.writeText(PORTAL_URL)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (configLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="animate-spin text-nors-teal" size={24} />
      </div>
    )
  }

  const dongfengCycles = dongfengCycleCount === 5 ? DONGFENG_5 : DONGFENG_7

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">Configurações</h1>
        <p className="text-sm font-light text-gray-500 mt-1">
          Gestão de parâmetros do sistema
        </p>
      </div>

      {/* Section 1: Câmbio e Alertas */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500 pb-3 mb-4 border-b border-gray-200">
          Câmbio e Alertas
        </h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
              Taxa de câmbio USD/KZ
            </label>
            <input
              type="number"
              step="0.01"
              value={taxaCambio}
              onChange={(e) => setTaxaCambio(e.target.value)}
              className="h-10 w-48 rounded-md border border-gray-200 px-3 text-sm focus:outline-none focus:border-nors-teal focus:ring-1 focus:ring-nors-teal/20"
            />
          </div>
          <div className="flex items-center justify-between gap-4">
            <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
              Dias de antecedência para alertas de renovação
            </label>
            <input
              type="number"
              value={alertaRenovacao}
              onChange={(e) => setAlertaRenovacao(e.target.value)}
              className="h-10 w-48 rounded-md border border-gray-200 px-3 text-sm focus:outline-none focus:border-nors-teal focus:ring-1 focus:ring-nors-teal/20"
            />
          </div>
          <div className="flex items-center justify-between gap-4">
            <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
              Intervalo de dias entre revisões
            </label>
            <input
              type="number"
              value={intervaloDias}
              onChange={(e) => setIntervaloDias(e.target.value)}
              className="h-10 w-48 rounded-md border border-gray-200 px-3 text-sm focus:outline-none focus:border-nors-teal focus:ring-1 focus:ring-nors-teal/20"
            />
          </div>
          <div className="flex items-center justify-between pt-2">
            {saveMessage ? (
              <p className="text-sm text-emerald-600 font-medium">{saveMessage}</p>
            ) : (
              <div />
            )}
            <button
              onClick={handleSave}
              className="inline-flex items-center gap-2 bg-nors-teal text-white h-10 px-5 rounded-md text-sm font-medium hover:opacity-90"
            >
              <Save size={16} />
              Guardar Alterações
            </button>
          </div>
        </div>
      </div>

      {/* Section 2: Ciclos de Revisão */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500 pb-3 mb-4 border-b border-gray-200">
          Ciclos de Revisão
        </h2>

        {/* Volvo — Fixed */}
        <div className="mb-5">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-sm font-semibold text-nors-off-black">Volvo</h3>
            <div className="flex items-center gap-1 text-gray-400">
              <Lock size={12} />
              <span className="text-xs">Ciclo fixo — 4 intervenções (3B + 1C)</span>
            </div>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b border-gray-100">
                <th className="py-2 font-medium">Posição</th>
                <th className="py-2 font-medium">Tipo de Revisão</th>
                <th className="py-2 font-medium">Descrição</th>
              </tr>
            </thead>
            <tbody>
              {VOLVO_FIXED.map((c) => (
                <tr key={c.tipo_revisao} className="border-b border-gray-50 text-gray-400">
                  <td className="py-2">{c.posicao}</td>
                  <td className="py-2 font-medium">{c.tipo_revisao}</td>
                  <td className="py-2">{c.descricao}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Dongfeng — Editable */}
        <div>
          <h3 className="text-sm font-semibold text-nors-off-black mb-2">Dongfeng</h3>
          <div className="flex items-center gap-3 mb-3">
            <span className="text-xs text-gray-600">Ciclo Dongfeng:</span>
            <div className="flex rounded-lg border border-gray-200 overflow-hidden">
              <button
                onClick={() => handleDongfengCycleChange(5)}
                className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                  dongfengCycleCount === 5
                    ? 'bg-nors-teal text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                5 intervenções
              </button>
              <button
                onClick={() => handleDongfengCycleChange(7)}
                className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                  dongfengCycleCount === 7
                    ? 'bg-nors-teal text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                7 intervenções
              </button>
            </div>
            {dongfengSaved && (
              <span className="text-xs text-emerald-600 font-medium">✓ Guardado</span>
            )}
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b border-gray-100">
                <th className="py-2 font-medium">Posição</th>
                <th className="py-2 font-medium">Tipo de Revisão</th>
                <th className="py-2 font-medium">Descrição</th>
              </tr>
            </thead>
            <tbody>
              {dongfengCycles.map((c) => (
                <tr key={c.tipo_revisao} className="border-b border-gray-50">
                  <td className="py-2">{c.posicao}</td>
                  <td className="py-2 font-medium">{c.tipo_revisao}</td>
                  <td className="py-2 text-gray-600">{c.descricao}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Section 3: Portal da Recepção */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500 pb-3 mb-4 border-b border-gray-200">
          Portal da Recepção
        </h2>
        <p className="text-sm text-gray-600 mb-3">
          Link para o portal de verificação de contratos. Partilhe este link com a equipa da recepção. O portal é público e não requer autenticação.
        </p>
        <div className="flex gap-2 items-center">
          <input
            type="text"
            readOnly
            value={PORTAL_URL}
            className="flex-1 h-10 rounded-md border border-gray-200 px-3 text-sm bg-gray-50 cursor-default focus:outline-none"
          />
          <button
            onClick={handleCopy}
            className="inline-flex items-center gap-2 h-10 px-4 rounded-md border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 whitespace-nowrap"
          >
            <Copy size={14} />
            {copied ? '✓ Copiado!' : 'Copiar Link'}
          </button>
        </div>
        <a
          href={PORTAL_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 mt-3 text-sm font-medium hover:underline"
          style={{ color: '#415A67' }}
        >
          Abrir Portal <ExternalLink size={14} />
        </a>
      </div>

      {/* Section 4: Informação do Sistema */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500 pb-3 mb-4 border-b border-gray-200">
          Informação do Sistema
        </h2>
        <dl className="space-y-3 text-sm">
          <div className="flex justify-between py-1 border-b border-gray-50">
            <dt className="text-gray-500">Versão</dt>
            <dd className="font-medium text-gray-900">1.1.0</dd>
          </div>
          <div className="flex justify-between py-1 border-b border-gray-50">
            <dt className="text-gray-500">Última actualização</dt>
            <dd className="font-medium text-gray-900">13/03/2026</dd>
          </div>
          <div className="flex justify-between py-1 border-b border-gray-50">
            <dt className="text-gray-500">Total de clientes</dt>
            <dd className="font-medium text-gray-900">{counts ? formatNumber(counts.total_clientes) : '—'}</dd>
          </div>
          <div className="flex justify-between py-1 border-b border-gray-50">
            <dt className="text-gray-500">Total de contratos</dt>
            <dd className="font-medium text-gray-900">{counts ? formatNumber(counts.total_contratos) : '—'}</dd>
          </div>
          <div className="flex justify-between py-1 border-b border-gray-50">
            <dt className="text-gray-500">Contratos APV activos</dt>
            <dd className="font-medium text-gray-900">{counts ? formatNumber(counts.apv_ativos) : '—'}</dd>
          </div>
          <div className="flex justify-between py-1 border-b border-gray-50">
            <dt className="text-gray-500">Contratos CM activos</dt>
            <dd className="font-medium text-gray-900">{counts ? formatNumber(counts.cm_ativos) : '—'}</dd>
          </div>
          <div className="flex justify-between py-1 border-b border-gray-50">
            <dt className="text-gray-500">Total de viaturas</dt>
            <dd className="font-medium text-gray-900">{counts ? formatNumber(counts.total_viaturas) : '—'}</dd>
          </div>
          <div className="flex justify-between py-1">
            <dt className="text-gray-500">Portal da Recepção</dt>
            <dd className="inline-flex items-center gap-1.5 font-medium text-emerald-600">
              <ExternalLink size={14} /> Activo
            </dd>
          </div>
        </dl>
      </div>
    </div>
  )
}
