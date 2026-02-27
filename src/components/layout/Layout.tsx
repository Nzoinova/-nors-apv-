import { Outlet } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Sidebar } from './Sidebar'
import { getAlertas } from '@/services/dashboard'

export function Layout() {
  const { data: alertas } = useQuery({
    queryKey: ['alertas'],
    queryFn: getAlertas,
    staleTime: 5 * 60 * 1000,
  })

  const highPriorityCount = alertas?.filter(a => a.prioridade === 'ALTA').length || 0

  return (
    <div className="min-h-screen bg-nors-off-white">
      <Sidebar alertCount={highPriorityCount} />
      <main className="ml-56 p-6">
        <Outlet />
      </main>
    </div>
  )
}
