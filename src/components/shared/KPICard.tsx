import type { LucideIcon } from 'lucide-react'

interface KPICardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: LucideIcon
  accent?: boolean
}

export function KPICard({ title, value, subtitle, icon: Icon, accent }: KPICardProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-5">
      <div className="flex items-start justify-between">
        <div className="space-y-1 min-w-0 flex-1">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-500 truncate">{title}</p>
          <p className={`text-2xl font-bold tracking-tight ${accent ? 'text-nors-teal' : 'text-gray-900'}`}>
            {value}
          </p>
          {subtitle && (
            <p className="text-xs text-slate-500 truncate">{subtitle}</p>
          )}
        </div>
        <div className="p-1.5 rounded-lg flex-shrink-0 bg-gray-50">
          <Icon size={16} className="text-nors-light-gray-2" />
        </div>
      </div>
    </div>
  )
}
