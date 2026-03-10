import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  FileText,
  Truck,
  Users,
  Wrench,
  Settings,
  AlertTriangle,
  ChevronRight,
} from 'lucide-react'

const NAV_ITEMS = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/contratos', icon: FileText, label: 'Contratos' },
  { to: '/viaturas', icon: Truck, label: 'Viaturas' },
  { to: '/os', icon: Wrench, label: 'Ordens de Serviço' },
  { to: '/clientes', icon: Users, label: 'Clientes' },
  { to: '/configuracoes', icon: Settings, label: 'Configurações' },
]

interface SidebarProps {
  alertCount?: number
  totalAlerts?: number
  pipelineCount?: number
  onAlertasClick?: () => void
}

export function Sidebar({ alertCount = 0, totalAlerts = 0, pipelineCount = 0, onAlertasClick }: SidebarProps) {
  return (
    <aside className="fixed top-0 left-0 h-screen w-56 bg-nors-black flex flex-col z-30 shadow-lg">
      {/* Logo */}
      <div className="px-4 pt-5 pb-4 border-b border-white/10 mb-2">
        <img
          src={`${import.meta.env.BASE_URL}nors-logo-white.png`}
          alt="NORS"
          style={{ height: 28, width: 'auto' }}
        />
        <p className="text-xs uppercase tracking-widest mt-1" style={{ color: '#ABABAB' }}>
          GESTÃO APV
        </p>
      </div>

      {/* Alert Banner */}
      {alertCount > 0 ? (
        <button
          onClick={onAlertasClick}
          className="mx-3 mb-4 w-[calc(100%-1.5rem)] rounded-md px-3 py-2 text-left transition-colors hover:brightness-110"
          data-tour="alertas-banner"
          style={{ borderLeft: '3px solid #ef4444', backgroundColor: 'rgba(239, 68, 68, 0.1)' }}
        >
          <div className="flex items-center gap-2">
            <AlertTriangle size={14} className="text-red-400 flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-semibold text-red-300">
                {alertCount} alerta{alertCount > 1 ? 's' : ''} urgente{alertCount > 1 ? 's' : ''}
              </p>
              {totalAlerts > alertCount && (
                <p className="text-[9px] text-red-400/70 font-light">
                  {totalAlerts} total
                </p>
              )}
            </div>
            <ChevronRight size={12} className="text-red-400/60 flex-shrink-0" />
          </div>
        </button>
      ) : totalAlerts > 0 ? (
        <button
          onClick={onAlertasClick}
          className="mx-3 mb-4 w-[calc(100%-1.5rem)] rounded-md px-3 py-2 text-left transition-colors hover:brightness-110"
          data-tour="alertas-banner"
          style={{ borderLeft: '3px solid #415A67', backgroundColor: 'rgba(65, 90, 103, 0.15)' }}
        >
          <div className="flex items-center gap-2">
            <AlertTriangle size={14} className="flex-shrink-0" style={{ color: '#9CC7DE' }} />
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-semibold" style={{ color: '#9CC7DE' }}>
                {totalAlerts} alerta{totalAlerts > 1 ? 's' : ''} activo{totalAlerts > 1 ? 's' : ''}
              </p>
            </div>
            <ChevronRight size={12} className="flex-shrink-0" style={{ color: '#9CC7DE', opacity: 0.6 }} />
          </div>
        </button>
      ) : null}

      {/* Navigation */}
      <nav className="flex-1 px-3 mt-2 space-y-0.5">
        {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 h-10 px-3 rounded-md text-sm transition-colors ${
                isActive
                  ? 'bg-nors-teal text-white font-semibold'
                  : 'text-[#ABABAB] hover:bg-white/10 hover:text-white'
              }`
            }
          >
            <Icon size={18} />
            <span>{label}</span>
            {label === 'Dashboard' && alertCount > 0 && (
              <span className="ml-auto bg-red-500 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
                {alertCount > 9 ? '9+' : alertCount}
              </span>
            )}
            {label === 'Dashboard' && alertCount === 0 && totalAlerts > 0 && (
              <span className="ml-auto text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center" style={{ backgroundColor: '#415A67' }}>
                {totalAlerts > 9 ? '9+' : totalAlerts}
              </span>
            )}
            {label === 'Contratos' && pipelineCount > 0 && (
              <span className="ml-auto bg-amber-500 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
                {pipelineCount > 9 ? '9+' : pipelineCount}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="mt-auto p-4 border-t border-white/10">
        <img
          src={`${import.meta.env.BASE_URL}nors-tagline-white.png`}
          alt="Making it work."
          style={{ height: 14, width: 'auto', opacity: 0.6 }}
        />
        <p className="text-xs text-gray-600 mt-1">
          NORS Trucks & Buses Angola VT
        </p>
      </div>
    </aside>
  )
}
