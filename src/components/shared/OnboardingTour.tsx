import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'

interface TourContextType {
  isTourActive: boolean
  activeStep: number
  startTour: () => void
}

export const TourContext = createContext<TourContextType>({
  isTourActive: false,
  activeStep: 0,
  startTour: () => {},
})

export function useTour() {
  return useContext(TourContext)
}

const STORAGE_KEY = 'nors_tour_seen'

interface TourStep {
  title: string
  body: string
  route?: string
  footerStats?: string
  target: string | null
}

const TOUR_STEPS: TourStep[] = [
  {
    title: 'Sistema de Gestão APV',
    body: 'Bem-vindo ao sistema de gestão de contratos de manutenção da NORS Trucks and Buses Angola VT. Este tour mostra como o sistema te mantém sempre no controlo.',
    target: null,
  },
  {
    title: 'Visão em tempo real',
    body: 'Os indicadores principais mostram contratos activos, receita mensal em USD e alertas pendentes — actualizados automaticamente.',
    route: '/',
    target: 'kpi-cards',
  },
  {
    title: 'Alertas automáticos',
    body: 'O sistema alerta quando um contrato APV está a 30 ou 60 dias de expirar, quando uma revisão está atrasada e quando há oportunidades CM→APV. Nunca perdes um prazo.',
    target: 'alertas-banner',
  },
  {
    title: 'Gestão de contratos',
    body: 'Todos os contratos organizados por cliente. Filtra por estado, tipo ou cliente. O pipeline mostra contratos CM prontos para proposta APV.',
    route: '/contratos',
    target: null,
  },
  {
    title: 'Frota e quilometragem',
    body: 'Cada viatura tem o seu histórico de quilometragem. O sistema compara o ritmo actual com o contratado e alerta quando está acima do previsto.',
    route: '/viaturas',
    target: null,
  },
  {
    title: 'Portal de Recepção',
    body: 'A equipa de recepção tem acesso a um portal dedicado para verificar contratos e registar entradas de viaturas. As entradas aparecem no Dashboard em tempo real.',
    route: '/',
    target: null,
  },
  {
    title: 'Relatório mensal',
    body: 'Com um clique geras o relatório mensal completo — KPIs, contratos a renovar, clientes e alertas — pronto para reunião de gestão.',
    route: '/',
    footerStats: 'Sistema activo · 14 contratos APV · 12 clientes · 51 viaturas',
    target: 'relatorio-btn',
  },
]

function getCardPosition(dataAttr: string | null): { top: number; left: number } {
  if (!dataAttr) return { top: window.innerHeight * 0.6, left: window.innerWidth / 2 - 210 }

  const el = document.querySelector(`[data-tour="${dataAttr}"]`)
  if (!el) return { top: window.innerHeight * 0.6, left: window.innerWidth / 2 - 210 }

  const rect = el.getBoundingClientRect()
  const cardWidth = 420
  const cardHeight = 220
  const padding = 16

  const placement = rect.bottom < window.innerHeight / 2 ? 'below' : 'above'

  const top = placement === 'below'
    ? rect.bottom + padding
    : rect.top - cardHeight - padding

  let left = rect.left + rect.width / 2 - cardWidth / 2
  left = Math.max(16, Math.min(left, window.innerWidth - cardWidth - 16))

  return { top, left }
}

export function TourProvider({ children }: { children: React.ReactNode }) {
  const [isTourActive, setIsTourActive] = useState(false)
  const [activeStep, setActiveStep] = useState(0)

  const startTour = useCallback(() => {
    setActiveStep(0)
    setIsTourActive(true)
  }, [])

  useEffect(() => {
    const seen = localStorage.getItem(STORAGE_KEY)
    if (!seen) {
      const timer = setTimeout(() => {
        startTour()
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [startTour])

  return (
    <TourContext.Provider value={{ isTourActive, activeStep, startTour }}>
      {children}
      {isTourActive && (
        <TourOverlay
          currentStep={activeStep}
          setCurrentStep={setActiveStep}
          isTourActive={isTourActive}
          onClose={() => {
            document.querySelectorAll('[data-tour-active]').forEach(el => {
              const htmlEl = el as HTMLElement
              htmlEl.style.boxShadow = ''
              htmlEl.style.borderRadius = ''
              htmlEl.style.position = ''
              htmlEl.style.zIndex = ''
              htmlEl.style.outline = ''
              htmlEl.style.outlineOffset = ''
              el.removeAttribute('data-tour-active')
            })
            setIsTourActive(false)
            localStorage.setItem(STORAGE_KEY, 'true')
          }}
        />
      )}
    </TourContext.Provider>
  )
}

// Steps that navigate to a new route (0-indexed)
const NAVIGATION_STEPS = [3, 4]

function clearHighlight() {
  const prev = document.querySelector('[data-tour-active]')
  if (prev) {
    const el = prev as HTMLElement
    el.style.boxShadow = ''
    el.style.borderRadius = ''
    el.style.position = ''
    el.style.zIndex = ''
    el.style.outline = ''
    el.style.outlineOffset = ''
    el.removeAttribute('data-tour-active')
  }
}

function TourOverlay({
  currentStep,
  setCurrentStep,
  isTourActive,
  onClose,
}: {
  currentStep: number
  setCurrentStep: (step: number) => void
  isTourActive: boolean
  onClose: () => void
}) {
  const navigate = useNavigate()
  const location = useLocation()
  const [cardVisible, setCardVisible] = useState(false)
  const [cardPos, setCardPos] = useState({ top: 0, left: 0 })

  const step = TOUR_STEPS[currentStep]
  const total = TOUR_STEPS.length
  const hasTarget = !!step.target
  const delay = NAVIGATION_STEPS.includes(currentStep) ? 300 : 50

  // Navigate + position card + highlight target
  useEffect(() => {
    setCardVisible(false)
    clearHighlight()

    const targetRoute = step.route
    const needsNav = targetRoute && location.pathname !== targetRoute
    if (needsNav) {
      navigate(targetRoute)
    }

    const actualDelay = needsNav ? 300 : delay

    const timer = setTimeout(() => {
      // Highlight target element with box-shadow
      const target = TOUR_STEPS[currentStep]?.target
      if (target && isTourActive) {
        const el = document.querySelector(`[data-tour="${target}"]`) as HTMLElement
        if (el) {
          el.style.boxShadow = '0 0 0 9999px rgba(0, 0, 0, 0.55)'
          el.style.borderRadius = '8px'
          el.style.position = 'relative'
          el.style.zIndex = '9998'
          el.setAttribute('data-tour-active', 'true')
        }
      }

      // Position card
      const pos = getCardPosition(TOUR_STEPS[currentStep].target)
      setCardPos({ top: pos.top, left: pos.left })

      // Fade in card
      setTimeout(() => setCardVisible(true), 100)
    }, actualDelay)

    return () => clearTimeout(timer)
  }, [currentStep, step.route, step.target, navigate, location.pathname, isTourActive, delay])

  const goNext = () => {
    if (currentStep < total - 1) {
      setCardVisible(false)
      setTimeout(() => setCurrentStep(currentStep + 1), 150)
    } else {
      onClose()
    }
  }

  const goPrev = () => {
    if (currentStep > 0) {
      setCardVisible(false)
      setTimeout(() => setCurrentStep(currentStep - 1), 150)
    }
  }

  return (
    <>
      {/* Subtle overlay only for steps with no target element */}
      {!hasTarget && (
        <div
          className="fixed inset-0"
          style={{
            backgroundColor: 'rgba(0,0,0,0.3)',
            zIndex: 9997,
          }}
          onClick={onClose}
        />
      )}

      {/* Tour card */}
      <div
        className="bg-white rounded-2xl shadow-2xl p-6"
        style={{
          position: 'fixed',
          top: `${cardPos.top}px`,
          left: `${cardPos.left}px`,
          width: '420px',
          zIndex: 9999,
          opacity: cardVisible ? 1 : 0,
          transition: 'top 300ms cubic-bezier(0.4, 0, 0.2, 1), left 300ms cubic-bezier(0.4, 0, 0.2, 1), opacity 150ms ease',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-medium px-2.5 py-1 rounded-full" style={{ backgroundColor: 'rgba(65,90,103,0.1)', color: '#415A67' }}>
            Passo {currentStep + 1} de {total}
          </span>
          <button
            onClick={onClose}
            className="text-xs text-gray-400 hover:text-gray-600 cursor-pointer transition-colors"
          >
            Saltar Tour
          </button>
        </div>

        {/* Progress bar */}
        <div className="w-full h-[3px] bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full"
            style={{
              width: `${((currentStep + 1) / total) * 100}%`,
              backgroundColor: '#415A67',
              transition: 'width 400ms ease',
            }}
          />
        </div>

        {/* Title */}
        <h2 className="text-xl font-bold text-gray-900 mt-4 mb-2">{step.title}</h2>

        {/* Body */}
        <p className="text-sm text-gray-600 leading-relaxed">{step.body}</p>

        {/* Footer stats (step 7 only) */}
        {step.footerStats && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            <p className="text-xs text-gray-400">{step.footerStats}</p>
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between mt-5">
          <div>
            {currentStep > 0 && (
              <button
                onClick={goPrev}
                className="text-sm text-gray-500 hover:text-gray-700 cursor-pointer transition-colors"
              >
                ← Anterior
              </button>
            )}
          </div>
          <button
            onClick={goNext}
            className="text-white rounded-lg px-4 py-2 text-sm font-medium hover:opacity-90 transition-opacity cursor-pointer"
            style={{ backgroundColor: '#415A67' }}
          >
            {currentStep < total - 1 ? 'Próximo →' : 'Começar a usar →'}
          </button>
        </div>
      </div>
    </>
  )
}
