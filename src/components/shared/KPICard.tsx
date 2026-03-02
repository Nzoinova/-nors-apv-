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
    <div className="bg-white rounded-lg border border-nors-light-gray p-4">
      <div className="flex items-start justify-between">
        <div className="space-y-0.5 min-w-0 flex-1">
          <p className="text-[10px] font-light uppercase tracking-wide text-nors-dark-gray truncate">{title}</p>
          <p className={`text-xl font-extrabold tracking-tight ${accent ? 'text-nors-teal' : 'text-nors-black'}`}>
            {value}
          </p>
          {subtitle && (
            <p className="text-[10px] font-light text-nors-light-gray-2 truncate">{subtitle}</p>
          )}
        </div>
        <div className={`p-1.5 rounded-lg flex-shrink-0 ${accent ? 'bg-nors-teal/10' : 'bg-nors-off-white'}`}>
          <Icon size={16} className={accent ? 'text-nors-teal' : 'text-nors-dark-gray'} />
        </div>
      </div>
    </div>
  )
}
