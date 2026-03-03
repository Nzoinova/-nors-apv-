import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  FileText,
  Truck,
  Users,
  Wrench,
  Settings,
  AlertTriangle,
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
}

export function Sidebar({ alertCount = 0, totalAlerts = 0 }: SidebarProps) {
  return (
    <aside className="fixed top-0 left-0 h-screen w-56 bg-nors-black flex flex-col z-30">
      {/* Logo */}
      <div className="p-5 pb-6">
        <h1 className="text-white font-extrabold text-xl tracking-tight">NORS</h1>
        <p className="text-nors-light-gray-2 text-[10px] font-light uppercase tracking-widest mt-0.5">
          GESTÃO APV
        </p>
      </div>

      {/* Alert Banner */}
      {alertCount > 0 ? (
        <div className="mx-3 mb-3 bg-red-500/15 border border-red-500/30 rounded-lg px-3 py-2">
          <div className="flex items-center gap-2">
            <AlertTriangle size={14} className="text-red-400 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-[10px] font-semibold text-red-300">
                {alertCount} alerta{alertCount > 1 ? 's' : ''} urgente{alertCount > 1 ? 's' : ''}
              </p>
              {totalAlerts > alertCount && (
                <p className="text-[9px] text-red-400/70 font-light">
                  {totalAlerts} total
                </p>
              )}
            </div>
          </div>
        </div>
      ) : totalAlerts > 0 ? (
        <div className="mx-3 mb-3 rounded-lg px-3 py-2" style={{ backgroundColor: 'rgba(65, 90, 103, 0.15)', borderWidth: 1, borderColor: 'rgba(65, 90, 103, 0.3)' }}>
          <div className="flex items-center gap-2">
            <AlertTriangle size={14} className="flex-shrink-0" style={{ color: '#9CC7DE' }} />
            <div className="min-w-0">
              <p className="text-[10px] font-semibold" style={{ color: '#9CC7DE' }}>
                {totalAlerts} alerta{totalAlerts > 1 ? 's' : ''} activo{totalAlerts > 1 ? 's' : ''}
              </p>
            </div>
          </div>
        </div>
      ) : null}

      {/* Navigation */}
      <nav className="flex-1 px-3 space-y-0.5">
        {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-colors ${
                isActive
                  ? 'bg-nors-off-black text-white font-semibold'
                  : 'text-nors-light-gray-2 hover:text-white hover:bg-nors-off-black/50'
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
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-nors-off-black">
        <p className="text-nors-medium-gray text-[10px] font-light">
          NORS Trucks & Buses Angola VT
        </p>
        <p className="text-nors-dark-gray text-[10px] font-light mt-0.5">
          Making it work.
        </p>
      </div>
    </aside>
  )
}
