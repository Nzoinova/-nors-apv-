import { useState, useEffect, useMemo } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Sparkles, X } from 'lucide-react'
import { Sidebar } from './Sidebar'
import { AlertasPanel } from './AlertasPanel'
import { TourProvider } from '@/components/shared/OnboardingTour'
import { getAlertas } from '@/services/dashboard'
import { getPipeline } from '@/services/pipeline'
import { getLatestChangelog } from '@/services/changelog'

const CHANGELOG_SEEN_KEY = 'nors_changelog_seen_version'

export function Layout() {
  const navigate = useNavigate()
  const [alertasOpen, setAlertasOpen] = useState(false)
  const [showUpdateBanner, setShowUpdateBanner] = useState(false)

  const { data: latestChangelog } = useQuery({
    queryKey: ['changelog-latest'],
    queryFn: getLatestChangelog,
    staleTime: 1000 * 60 * 10,
  })

  useEffect(() => {
    if (!latestChangelog) return
    const seenVersion = localStorage.getItem(CHANGELOG_SEEN_KEY)
    if (seenVersion !== latestChangelog.versao) {
      setShowUpdateBanner(true)
    }
  }, [latestChangelog])

  const dismissBanner = () => {
    if (latestChangelog) {
      localStorage.setItem(CHANGELOG_SEEN_KEY, latestChangelog.versao)
    }
    setShowUpdateBanner(false)
  }

  const { data: alertas } = useQuery({
    queryKey: ['alertas'],
    queryFn: getAlertas,
    staleTime: 5 * 60 * 1000,
  })

  const { data: pipelineItems } = useQuery({
    queryKey: ['pipeline'],
    queryFn: getPipeline,
    staleTime: 5 * 60 * 1000,
  })

  const highPriorityCount = alertas?.filter(a => a.prioridade === 'ALTA').length || 0
  const totalAlerts = alertas?.length || 0
  const pipelineCount = pipelineItems?.filter(p => p.status_pipeline === 'PENDENTE_PROPOSTA').length || 0

  const groupedAlertas = useMemo(() => {
    if (!alertas) return { ALTA: [], MEDIA: [], INFO: [] }
    const groups: Record<string, typeof alertas> = { ALTA: [], MEDIA: [], INFO: [] }
    for (const a of alertas) {
      if (groups[a.prioridade]) groups[a.prioridade].push(a)
    }
    return groups
  }, [alertas])

  return (
    <TourProvider>
      <div className="min-h-screen bg-nors-off-white">
        <Sidebar
          alertCount={highPriorityCount}
          totalAlerts={totalAlerts}
          pipelineCount={pipelineCount}
          onAlertasClick={() => setAlertasOpen(true)}
        />
        <main className="ml-56 p-6">
          {showUpdateBanner && latestChangelog && (
            <div className="mx-4 mt-3 mb-4 flex items-center gap-3 px-3 py-2.5 bg-nors-teal/10 border border-nors-teal/30 rounded-lg">
              <Sparkles size={14} className="text-nors-teal shrink-0" />
              <div className="flex-1">
                <p className="text-xs font-medium text-gray-800">
                  Versão {latestChangelog.versao} disponível
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {latestChangelog.titulo}
                </p>
              </div>
              <button
                onClick={() => {
                  dismissBanner()
                  navigate('/configuracoes')
                }}
                className="text-xs font-medium text-nors-teal hover:underline shrink-0"
              >
                Ver
              </button>
              <button
                onClick={dismissBanner}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={13} />
              </button>
            </div>
          )}
          <Outlet />
        </main>
        <AlertasPanel
          open={alertasOpen}
          onClose={() => setAlertasOpen(false)}
          groupedAlertas={groupedAlertas}
          totalAlertas={totalAlerts}
        />
      </div>
    </TourProvider>
  )
}
