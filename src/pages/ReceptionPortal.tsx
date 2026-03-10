import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { Search, CheckCircle, CheckCircle2, AlertTriangle, XCircle, Loader2, Lightbulb } from 'lucide-react'
import { searchVehicleContract, type ReceptionSearchResult } from '@/services/reception'
import { registarEntrada, type NovaEntrada } from '@/services/entradas'
import { formatDate } from '@/utils/formatters'
import { supabase } from '@/lib/supabase'
import type { EstadoContrato } from '@/types'

const UNIDADE_OPTIONS = ['Luanda (Icolo e Bengo)', 'Lobito', 'Lubango']

function getSuggestedService(
  osHistory: { tipo_revisao: string }[],
  marca: string
): { value: string; label: string; reason: string } | null {
  const isDongfeng = marca === 'Dongfeng'
  const cycle = isDongfeng
    ? ['B1', 'B2', 'B3', 'B4', 'MC']
    : ['B1', 'B2', 'B3', 'MC']

  if (!osHistory || osHistory.length === 0) {
    return {
      value: 'B1',
      label: 'B1 — Revisão Básica 1',
      reason: 'Primeira intervenção registada',
    }
  }

  const lastService = osHistory[0].tipo_revisao
  const lastIndex = cycle.indexOf(lastService)

  if (lastIndex === -1) return null

  if (lastIndex === cycle.length - 1) {
    return {
      value: 'B1',
      label: 'B1 — Revisão Básica 1',
      reason: 'Último serviço foi MC — início de novo ciclo',
    }
  }

  const nextService = cycle[lastIndex + 1]
  const nextLabel =
    nextService === 'MC'
      ? 'MC — Manutenção Completa'
      : `${nextService} — Revisão Básica ${nextService.slice(1)}`

  return {
    value: nextService,
    label: nextLabel,
    reason: `Último serviço registado: ${lastService}`,
  }
}

export default function ReceptionPortal() {
  const [query, setQuery] = useState('')
  const [result, setResult] = useState<ReceptionSearchResult | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const [lastSearchTime, setLastSearchTime] = useState<Date | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Entry registration state
  const [showForm, setShowForm] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [successData, setSuccessData] = useState<{ matricula: string; tipo_servico: string; unidade: string } | null>(null)
  const [kmEntrada, setKmEntrada] = useState('')
  const [tipoServico, setTipoServico] = useState('')
  const [unidade, setUnidade] = useState('')
  const [observacoes, setObservacoes] = useState('')
  const [suggestion, setSuggestion] = useState<{
    value: string
    label: string
    reason: string
  } | null>(null)
  const [suggestionDismissed, setSuggestionDismissed] = useState(false)

  const resetRegistration = () => {
    setShowForm(false)
    setIsSubmitting(false)
    setSuccessData(null)
    setKmEntrada('')
    setTipoServico('')
    setUnidade('')
    setObservacoes('')
    setSuggestionDismissed(false)
  }

  const resetAll = () => {
    setQuery('')
    setResult(null)
    setHasSearched(false)
    setLastSearchTime(null)
    setSuggestion(null)
    setSuggestionDismissed(false)
    resetRegistration()
    inputRef.current?.focus()
  }

  const doSearch = useCallback(async (searchQuery: string) => {
    const trimmed = searchQuery.trim()
    if (!trimmed) {
      setResult(null)
      setHasSearched(false)
      return
    }
    setIsLoading(true)
    try {
      const data = await searchVehicleContract(trimmed)
      setResult(data)
      setHasSearched(true)
      setLastSearchTime(new Date())
    } catch {
      setResult({ contracts: [], vehicle: null })
      setHasSearched(true)
      setLastSearchTime(new Date())
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Debounced search on input change (3+ chars)
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (query.trim().length >= 3) {
      debounceRef.current = setTimeout(() => doSearch(query), 500)
    } else if (query.trim().length === 0) {
      setResult(null)
      setHasSearched(false)
    }
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [query, doSearch])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && query.trim()) {
      if (debounceRef.current) clearTimeout(debounceRef.current)
      doSearch(query)
    }
  }

  const handleSubmitEntrada = async () => {
    if (!bestContract || !kmEntrada || !tipoServico || !unidade) return
    setIsSubmitting(true)
    try {
      const entrada: NovaEntrada = {
        viatura_id: bestContract.viatura_id,
        contrato_id: bestContract.contrato_id,
        matricula: bestContract.matricula ?? '',
        cliente_nome: bestContract.cliente_nome,
        km_entrada: parseInt(kmEntrada, 10),
        tipo_servico: tipoServico,
        unidade,
        observacoes: observacoes.trim() || undefined,
        data_entrada: new Date().toISOString(),
        registado_por: 'Recepção',
      }
      await registarEntrada(entrada)
      setSuccessData({
        matricula: bestContract.matricula ?? '—',
        tipo_servico: tipoServico,
        unidade,
      })
    } catch (err) {
      console.error('Erro ao registar entrada:', err)
      alert('Erro ao registar entrada. Tente novamente.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Determine which contract to display (best status)
  const bestContract = result?.contracts?.[0] ?? null
  const vehicleFallback = result?.vehicle ?? null
  const isActivo = bestContract?.status_contrato === 'ATIVO' || bestContract?.status_contrato === 'A RENOVAR'
  const formValid = !!kmEntrada && !!tipoServico && !!unidade

  const marca = bestContract?.marca ?? vehicleFallback?.marca
  const tipoServicoOptions = useMemo(() =>
    marca === 'Dongfeng'
      ? [
          { value: 'B1', label: 'B1 — Revisão Básica 1' },
          { value: 'B2', label: 'B2 — Revisão Básica 2' },
          { value: 'B3', label: 'B3 — Revisão Básica 3' },
          { value: 'B4', label: 'B4 — Revisão Básica 4' },
          { value: 'MC', label: 'MC — Manutenção Completa' },
        ]
      : [
          { value: 'B1', label: 'B1 — Revisão Básica 1' },
          { value: 'B2', label: 'B2 — Revisão Básica 2' },
          { value: 'B3', label: 'B3 — Revisão Básica 3' },
          { value: 'MC', label: 'MC — Manutenção Completa' },
        ],
    [marca]
  )

  // Reset tipo_servico when search result changes
  useEffect(() => {
    setTipoServico('')
    setSuggestionDismissed(false)
  }, [result])

  // Fetch OS history and compute suggestion when search result changes
  useEffect(() => {
    if (!bestContract?.viatura_id) {
      setSuggestion(null)
      return
    }
    const vehicleMarca = bestContract.marca
    if (!vehicleMarca) {
      setSuggestion(null)
      return
    }
    let cancelled = false
    ;(async () => {
      try {
        const { data: osHistory } = await supabase
          .from('ordens_servico')
          .select('tipo_revisao, data, km_na_revisao')
          .eq('viatura_id', bestContract.viatura_id)
          .not('tipo_revisao', 'is', null)
          .order('data', { ascending: false })
          .limit(5)
        if (cancelled) return
        if (!osHistory) {
          setSuggestion(null)
          return
        }
        setSuggestion(getSuggestedService(osHistory as { tipo_revisao: string }[], vehicleMarca))
      } catch {
        if (!cancelled) setSuggestion(null)
      }
    })()
    return () => { cancelled = true }
  }, [bestContract?.viatura_id, bestContract?.marca])

  return (
    <div className="min-h-screen bg-nors-off-white flex flex-col items-center">
      {/* Header */}
      <header className="pt-16 pb-8 text-center flex flex-col items-center">
        <img
          src={`${import.meta.env.BASE_URL}nors-logo-dark.png`}
          alt="NORS"
          style={{ height: 40, width: 'auto' }}
        />
        <p className="text-sm font-light text-nors-medium-gray mt-1">Verificação de Contratos</p>
      </header>

      {/* Search */}
      <div className="w-full max-w-[600px] px-6">
        <div className="relative">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 text-nors-light-gray-2"
            size={20}
          />
          <input
            ref={inputRef}
            autoFocus
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Pesquisar por matrícula ou chassi (VIN)..."
            className="w-full h-14 pl-12 pr-4 text-lg rounded-xl border border-nors-light-gray bg-white font-light text-nors-black placeholder:text-nors-light-gray-2 focus:outline-none focus:border-nors-teal transition-colors"
          />
        </div>
        <p className="text-xs text-nors-light-gray-2 mt-2 text-center">
          Ex: LD8421HZ ou YV2XSW0D5SA360437
        </p>
      </div>

      {/* Results */}
      <div className="w-full max-w-[600px] px-6 mt-6 flex-1">
        {isLoading && <LoadingState />}

        {!isLoading && hasSearched && bestContract && !successData && (
          <ContractCard contract={bestContract} />
        )}

        {/* Action buttons for ACTIVO contracts */}
        {!isLoading && hasSearched && bestContract && isActivo && !showForm && !successData && (
          <div className="flex gap-3 mt-4">
            <button
              onClick={resetAll}
              className="flex-1 border border-gray-300 text-gray-600 rounded-md px-4 py-2 hover:bg-gray-50 transition-colors"
            >
              Apenas Verificação
            </button>
            <button
              onClick={() => setShowForm(true)}
              className="flex-1 rounded-md px-4 py-2 text-white hover:opacity-90 transition-opacity"
              style={{ backgroundColor: '#415A67' }}
            >
              Registar Entrada para Serviço →
            </button>
          </div>
        )}

        {/* Registration form */}
        {!isLoading && showForm && !successData && (
          <div className="mt-6 bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-nors-off-black mb-6">Registo de Entrada</h3>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">KM Actual</label>
              <input
                type="number"
                value={kmEntrada}
                onChange={(e) => setKmEntrada(e.target.value)}
                placeholder="Ex: 167119"
                className="border border-gray-300 rounded-md px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-nors-teal"
              />
              <p className="text-xs text-gray-500 mt-1">Quilometragem no painel da viatura neste momento</p>
            </div>

            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Serviço</label>

              {suggestion && !suggestionDismissed && (
                <div className="bg-blue-50 border border-blue-100 rounded-lg px-3 py-2 mb-2 flex items-start gap-2">
                  <Lightbulb size={13} className="text-blue-500 mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <span className="text-xs text-blue-700 font-medium">Sugestão: {suggestion.label}</span>
                    <span className="text-xs text-blue-500 ml-1">{suggestion.reason}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setTipoServico(suggestion.value)
                      setSuggestionDismissed(true)
                    }}
                    className="text-xs font-medium text-nors-teal hover:underline cursor-pointer shrink-0 ml-auto"
                  >
                    Usar
                  </button>
                </div>
              )}

              <select
                value={tipoServico}
                onChange={(e) => {
                  setTipoServico(e.target.value)
                  if (e.target.value) setSuggestionDismissed(true)
                }}
                className="border border-gray-300 rounded-md px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-nors-teal"
              >
                <option value="">Selecionar...</option>
                {tipoServicoOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">Unidade</label>
              <select
                value={unidade}
                onChange={(e) => setUnidade(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-nors-teal"
              >
                <option value="">Selecionar...</option>
                {UNIDADE_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>

            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">Observações</label>
              <textarea
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                rows={3}
                placeholder="Alguma nota sobre a viatura ou o serviço (opcional)"
                className="border border-gray-300 rounded-md px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-nors-teal"
              />
            </div>

            <button
              onClick={handleSubmitEntrada}
              disabled={!formValid || isSubmitting}
              className="mt-6 rounded-md px-6 py-2 w-full text-white disabled:opacity-50 transition-opacity flex items-center justify-center gap-2"
              style={{ backgroundColor: '#415A67' }}
            >
              {isSubmitting && <Loader2 className="animate-spin" size={16} />}
              {isSubmitting ? 'A registar...' : 'Confirmar Entrada'}
            </button>
          </div>
        )}

        {/* Success state */}
        {successData && (
          <div className="mt-6 bg-white rounded-xl shadow-sm p-8 text-center">
            <CheckCircle2 size={48} style={{ color: '#415A67' }} className="mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-nors-off-black mb-2">Entrada registada com sucesso</h3>
            <p className="text-nors-off-black font-medium mb-3">
              {successData.matricula} — {successData.tipo_servico} — {successData.unidade}
            </p>
            <p className="text-sm text-gray-500 mb-6">
              O Suporte ao Negócio foi notificado. Após abertura da OS no SAP, envie o número da OS por Teams, email ou WhatsApp.
            </p>
            <button
              onClick={resetAll}
              className="rounded-md px-6 py-2 text-white hover:opacity-90 transition-opacity"
              style={{ backgroundColor: '#415A67' }}
            >
              Nova Pesquisa
            </button>
          </div>
        )}

        {!isLoading && hasSearched && !bestContract && vehicleFallback && (
          <NoContractCard
            marca={vehicleFallback.marca}
            modelo={vehicleFallback.modelo}
            matricula={vehicleFallback.matricula}
            clienteNome={vehicleFallback.cliente?.nome}
          />
        )}

        {!isLoading && hasSearched && !bestContract && !vehicleFallback && (
          <VehicleNotFoundCard />
        )}

        {lastSearchTime && !isLoading && !successData && (
          <p className="text-xs text-nors-light-gray-2 text-center mt-4">
            Última consulta: {lastSearchTime.toLocaleTimeString('pt-PT')}
          </p>
        )}
      </div>

      {/* Footer */}
      <footer className="py-6 flex flex-col items-center">
        <img
          src={`${import.meta.env.BASE_URL}nors-tagline-dark.png`}
          alt="Making it work."
          style={{ height: 12, width: 'auto', opacity: 0.4 }}
        />
        <p className="text-xs text-nors-light-gray-2 mt-1">NORS Trucks & Buses Angola VT</p>
      </footer>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Sub-components                                                     */
/* ------------------------------------------------------------------ */

function LoadingState() {
  return (
    <div className="flex flex-col items-center gap-3 py-8">
      <Loader2 className="animate-spin text-nors-teal" size={28} />
      <div className="w-full bg-white rounded-xl p-6 animate-pulse">
        <div className="h-5 bg-nors-light-gray rounded w-1/3 mb-4" />
        <div className="grid grid-cols-2 gap-3">
          <div className="h-4 bg-nors-light-gray rounded" />
          <div className="h-4 bg-nors-light-gray rounded" />
          <div className="h-4 bg-nors-light-gray rounded" />
          <div className="h-4 bg-nors-light-gray rounded" />
        </div>
      </div>
    </div>
  )
}

function ContractCard({ contract }: { contract: EstadoContrato }) {
  const isActive = contract.status_contrato === 'ATIVO' || contract.status_contrato === 'A RENOVAR'
  const isCortesia = contract.status_contrato === 'CORTESIA'

  if (isActive) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6 border-l-4" style={{ borderLeftColor: '#415A67' }}>
        <div className="flex items-center gap-2 mb-4">
          <CheckCircle className="text-green-600" size={24} />
          <span className="text-green-700 font-bold text-lg">CONTRATO ACTIVO</span>
        </div>

        <InfoGrid contract={contract} />

        <div className="mt-4 rounded-lg py-3 px-4 text-center font-medium text-white" style={{ backgroundColor: '#415A67' }}>
          &#10003; Pode receber serviço
        </div>
      </div>
    )
  }

  // Expired or Cortesia
  const title = isCortesia ? 'PERÍODO DE CORTESIA' : 'CONTRATO EXPIRADO'
  const detail = isCortesia
    ? 'Período de cortesia — verificar com APV'
    : `Contrato expirado há ${Math.abs(contract.dias_ate_expiracao)} dias`

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-l-amber-500">
      <div className="flex items-center gap-2 mb-4">
        <AlertTriangle className="text-amber-600" size={24} />
        <span className="text-amber-700 font-bold text-lg">{title}</span>
      </div>

      <InfoGrid contract={contract} />

      <p className="text-sm text-amber-700 mt-3 font-light">{detail}</p>

      <div className="mt-4 bg-amber-50 border border-amber-200 rounded-lg py-3 px-4 text-center font-medium text-amber-700">
        &#9888; Verificar com equipa APV antes de proceder
      </div>
    </div>
  )
}

function InfoGrid({ contract }: { contract: EstadoContrato }) {
  return (
    <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
      <InfoRow label="Cliente" value={contract.cliente_nome} />
      <InfoRow label="Viatura" value={`${contract.marca} ${contract.modelo ?? ''}`} />
      <InfoRow label="Matrícula" value={contract.matricula ?? '—'} />
      <InfoRow
        label="Tipo"
        value={
          <span
            className="inline-block px-2 py-0.5 rounded text-xs font-medium"
            style={{
              backgroundColor: contract.tipo_contrato === 'APV' ? '#415A67' : '#9CC7DE',
              color: contract.tipo_contrato === 'APV' ? '#FFFFFF' : '#2B2B2B',
            }}
          >
            {contract.tipo_contrato}
          </span>
        }
      />
      <InfoRow
        label="Válido até"
        value={
          contract.data_validade
            ? `${formatDate(contract.data_validade)} (${contract.dias_ate_expiracao} dias restantes)`
            : '—'
        }
      />
      <InfoRow label="Próxima revisão" value={contract.proxima_revisao_tipo ?? '—'} />
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <span className="text-nors-medium-gray font-light">{label}: </span>
      <span className="text-nors-off-black font-normal">{typeof value === 'string' ? value : value}</span>
    </div>
  )
}

function NoContractCard({
  marca,
  modelo,
  matricula,
  clienteNome,
}: {
  marca: string
  modelo: string | null
  matricula: string | null
  clienteNome?: string
}) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-l-red-500">
      <div className="flex items-center gap-2 mb-4">
        <XCircle className="text-red-600" size={24} />
        <span className="text-red-700 font-bold text-lg">SEM CONTRATO ACTIVO</span>
      </div>

      <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm mb-3">
        {clienteNome && <InfoRow label="Cliente" value={clienteNome} />}
        <InfoRow label="Viatura" value={`${marca} ${modelo ?? ''}`} />
        <InfoRow label="Matrícula" value={matricula ?? '—'} />
      </div>

      <p className="text-sm text-red-700 font-light">
        Esta viatura não tem contrato de manutenção activo
      </p>

      <div className="mt-4 bg-red-50 border border-red-200 rounded-lg py-3 px-4 text-center font-medium text-red-700">
        &#10007; Contactar equipa APV — Sidney / Tiago
      </div>
    </div>
  )
}

function VehicleNotFoundCard() {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-l-red-500">
      <div className="flex items-center gap-2 mb-4">
        <XCircle className="text-red-600" size={24} />
        <span className="text-red-700 font-bold text-lg">SEM CONTRATO ACTIVO</span>
      </div>

      <p className="text-sm text-red-700 font-light">
        Viatura não encontrada no sistema. Verifique a matrícula ou VIN.
      </p>

      <div className="mt-4 bg-red-50 border border-red-200 rounded-lg py-3 px-4 text-center font-medium text-red-700">
        &#10007; Contactar equipa APV — Sidney / Tiago
      </div>
    </div>
  )
}
