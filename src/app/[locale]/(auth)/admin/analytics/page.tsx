'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts'
import { BarChart2, Eye, Users, MessageSquare, Package } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'

interface Overview {
  totalSolutions: number
  totalViews: number
  activeUsers: number
  openFeedback: number
}

interface ViewPoint { date: string; views: number }
interface TopSolution { rank: number; id: string; slug: string; logo_url: string | null; view_count: number; name: string }
interface SectorView { id: string; slug: string; name: string; views: number }

const SECTOR_COLORS = ['#2B6CB0', '#3182CE', '#4299E1', '#63B3ED', '#90CDF4', '#BEE3F8']

function KPICard({ label, value, icon, color }: { label: string; value: number; icon: React.ReactNode; color: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4">
      <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${color}`}>
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900">{value.toLocaleString()}</p>
        <p className="text-sm text-gray-500">{label}</p>
      </div>
    </div>
  )
}

function formatDateShort(dateStr: string) {
  const [, m, d] = dateStr.split('-')
  return `${d}/${m}`
}

export default function AnalyticsDashboard() {
  const t = useTranslations('admin.analytics')

  const [overview, setOverview] = useState<Overview | null>(null)
  const [viewsOverTime, setViewsOverTime] = useState<ViewPoint[]>([])
  const [topSolutions, setTopSolutions] = useState<TopSolution[]>([])
  const [viewsBySector, setViewsBySector] = useState<SectorView[]>([])
  const [loading, setLoading] = useState(true)
  const [days, setDays] = useState(30)

  async function load(d = days) {
    setLoading(true)
    try {
      const [ov, vot, ts, vbs] = await Promise.all([
        fetch('/api/analytics/overview').then(r => r.json()),
        fetch(`/api/analytics/views-over-time?days=${d}`).then(r => r.json()),
        fetch('/api/analytics/top-solutions?limit=10').then(r => r.json()),
        fetch('/api/analytics/views-by-sector').then(r => r.json()),
      ])
      setOverview(ov.data)
      setViewsOverTime(vot.data ?? [])
      setTopSolutions(ts.data ?? [])
      setViewsBySector(vbs.data ?? [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-gray-900">{t('title')}</h1>

      {/* KPI Cards */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
      ) : overview && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard label={t('totalSolutions')} value={overview.totalSolutions}
            icon={<Package size={22} className="text-white" />} color="bg-brand-600" />
          <KPICard label={t('totalViews')} value={overview.totalViews}
            icon={<Eye size={22} className="text-white" />} color="bg-blue-500" />
          <KPICard label={t('activeUsers')} value={overview.activeUsers}
            icon={<Users size={22} className="text-white" />} color="bg-green-500" />
          <KPICard label={t('openFeedback')} value={overview.openFeedback}
            icon={<MessageSquare size={22} className="text-white" />} color="bg-orange-500" />
        </div>
      )}

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Line chart: views over time */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-800">{t('viewsLast30Days')}</h2>
            <div className="flex gap-1">
              {[7, 14, 30].map((d) => (
                <button key={d} onClick={() => { setDays(d); load(d) }}
                  className={`text-xs px-2.5 py-1 rounded-lg transition-colors ${days === d ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                  {d}d
                </button>
              ))}
            </div>
          </div>
          {loading ? <Skeleton className="h-52 w-full" /> : (
            <ResponsiveContainer width="100%" height={210}>
              <LineChart data={viewsOverTime} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tickFormatter={formatDateShort} tick={{ fontSize: 11 }} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip formatter={(v: number) => [v, 'Lượt xem']} labelFormatter={formatDateShort} />
                <Line type="monotone" dataKey="views" stroke="#2B6CB0" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Pie chart: views by sector */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-800 mb-4">{t('viewsBySector')}</h2>
          {loading ? <Skeleton className="h-52 w-full rounded-full" /> : viewsBySector.length === 0 ? (
            <div className="flex items-center justify-center h-52 text-gray-400 text-sm">Chưa có dữ liệu</div>
          ) : (
            <ResponsiveContainer width="100%" height={210}>
              <PieChart>
                <Pie data={viewsBySector} dataKey="views" nameKey="name" cx="50%" cy="50%" outerRadius={72} innerRadius={36}>
                  {viewsBySector.map((_, i) => (
                    <Cell key={i} fill={SECTOR_COLORS[i % SECTOR_COLORS.length]} />
                  ))}
                </Pie>
                <Legend iconType="circle" iconSize={10} formatter={(v) => <span className="text-xs text-gray-600">{v}</span>} />
                <Tooltip formatter={(v: number) => [v.toLocaleString(), 'Lượt xem']} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Top solutions table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-800">{t('topSolutions')}</h2>
        </div>
        {loading ? (
          <div className="p-4 space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
        ) : topSolutions.length === 0 ? (
          <div className="py-12 text-center text-gray-400 text-sm">Chưa có dữ liệu</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-5 py-2.5 text-xs font-medium text-gray-500">{t('rank')}</th>
                <th className="text-left px-5 py-2.5 text-xs font-medium text-gray-500">{t('solutionName')}</th>
                <th className="text-right px-5 py-2.5 text-xs font-medium text-gray-500">{t('views')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {topSolutions.map((s) => (
                <tr key={s.id} className="hover:bg-gray-50">
                  <td className="px-5 py-3">
                    <span className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${s.rank <= 3 ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
                      {s.rank}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2.5">
                      {s.logo_url ? (
                        <img src={s.logo_url} alt={s.name} className="h-7 w-7 rounded object-contain border border-gray-100" />
                      ) : (
                        <div className="h-7 w-7 rounded bg-brand-100 flex items-center justify-center text-brand-600 font-bold text-xs">
                          {s.name.charAt(0)}
                        </div>
                      )}
                      <span className="font-medium text-gray-900">{s.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-right font-medium text-gray-700">
                    {s.view_count.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
