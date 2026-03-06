import { Outlet } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Sidebar } from './Sidebar'
import { TourProvider } from '@/components/shared/OnboardingTour'
import { getAlertas } from '@/services/dashboard'
import { getPipeline } from '@/services/pipeline'

export function Layout() {
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

  return (
    <TourProvider>
      <div className="min-h-screen bg-nors-off-white">
        <Sidebar alertCount={highPriorityCount} totalAlerts={totalAlerts} pipelineCount={pipelineCount} />
        <main className="ml-56 p-6">
          <Outlet />
        </main>
      </div>
    </TourProvider>
  )
}
