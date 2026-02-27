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
    <div className="bg-white rounded-lg border border-nors-light-gray p-5">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs font-light uppercase tracking-wide text-nors-dark-gray">{title}</p>
          <p className={`text-2xl font-extrabold tracking-tight ${accent ? 'text-nors-teal' : 'text-nors-black'}`}>
            {value}
          </p>
          {subtitle && (
            <p className="text-sm font-light text-nors-light-gray-2">{subtitle}</p>
          )}
        </div>
        <div className={`p-2 rounded-lg ${accent ? 'bg-nors-teal/10' : 'bg-nors-off-white'}`}>
          <Icon size={20} className={accent ? 'text-nors-teal' : 'text-nors-dark-gray'} />
        </div>
      </div>
    </div>
  )
}
