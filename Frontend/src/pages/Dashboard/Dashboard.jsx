import React, { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { KpiCard, PageHeader, AsyncButton, DataTable, Skeleton } from '../../components/Common'
import { PowerTrendChart, DailyEnergyChart, IrradiancePowerChart } from '../../components/Charts'
import { useFetch } from '../../hooks/useFetch'
import {
  fetchKPIs, fetchPowerTrend, fetchDailyEnergy,
  fetchIrradiancePower, fetchDashboardAlarms
} from '../../services/api'
import { severityPillClass } from '../../utils/helpers'

export default function Dashboard() {
  const navigate = useNavigate()

  const { data: kpiData,   loading: kpiLoading   } = useFetch(fetchKPIs)
  const { data: powerData, loading: powerLoading  } = useFetch(fetchPowerTrend)
  const { data: dailyData, loading: dailyLoading  } = useFetch(() => fetchDailyEnergy(7))
  const { data: irrData,   loading: irrLoading    } = useFetch(fetchIrradiancePower)
  const { data: alarmData, loading: alarmLoading  } = useFetch(() => fetchDashboardAlarms(4))

  // ── Normalize power trend ─────────────────────────────────────────────────
  const powerChartData = useMemo(() => {
    const rows = powerData?.data || []
    if (rows.length) return rows.map(r => ({ hour: r.hour, power: r.power }))
    const hours  = ['00:00','02:00','04:00','06:00','08:00','10:00','12:00','14:00','16:00','18:00','20:00','22:00']
    const powers = [0, 0, 0, 120, 580, 1240, 1720, 1847, 1650, 1200, 620, 80]
    return hours.map((h, i) => ({ hour: h, power: powers[i] }))
  }, [powerData])

  // ── Normalize daily energy ─────────────────────────────────────────────────
  const dailyChartData = useMemo(() => {
    const rows = dailyData?.data || []
    if (rows.length) return rows.map(r => ({ label: r.label, value: r.energy }))
    return [
      { label:'Mon', value:7620 },{ label:'Tue', value:8045 },
      { label:'Wed', value:7990 },{ label:'Thu', value:8156 },
      { label:'Fri', value:7834 },{ label:'Sat', value:8012 },
      { label:'Sun', value:8247 },
    ]
  }, [dailyData])

  // ── Normalize irradiance data ──────────────────────────────────────────────
  const irrChartData = useMemo(() => {
    const rows = irrData?.data || []
    if (rows.length) return rows
    return Array.from({ length: 20 }, (_, i) => ({
      irr: i * 50 + 10,
      pwr: i * 90 + 20,
    }))
  }, [irrData])

  // ── Normalize KPIs ─────────────────────────────────────────────────────────
  const kpis = kpiData || {}

  const kpiCards = [
    {
      label: kpis.today_energy?.label      || "Today's Energy",
      value: String(kpis.today_energy?.value    ?? '…'),
      unit:  kpis.today_energy?.unit       || 'MWh',
      change:kpis.today_energy?.change     || '',
      up:    kpis.today_energy?.up         ?? true,
      color: 'green',
    },
    {
      label: kpis.current_power?.label     || 'Current Power',
      value: String(kpis.current_power?.value   ?? '…'),
      unit:  kpis.current_power?.unit      || 'MW',
      change:kpis.current_power?.change    || '',
      up:    kpis.current_power?.up        ?? true,
      color: 'blue',
    },
    {
      label: kpis.performance_ratio?.label || 'Performance Ratio',
      value: String(kpis.performance_ratio?.value ?? '…'),
      unit:  kpis.performance_ratio?.unit  || '%',
      change:kpis.performance_ratio?.change|| '',
      up:    kpis.performance_ratio?.up    ?? false,
      color: 'amber',
    },
    {
      label: kpis.availability?.label      || 'Availability',
      value: String(kpis.availability?.value    ?? '…'),
      unit:  kpis.availability?.unit       || '%',
      change:kpis.availability?.change     || '',
      up:    kpis.availability?.up         ?? true,
      color: 'purple',
    },
  ]

  // ── Normalize alarms ───────────────────────────────────────────────────────
  const alarms = Array.isArray(alarmData?.alarms)
    ? alarmData.alarms
    : Array.isArray(alarmData)
      ? alarmData
      : []

  return (
    <div>
      <PageHeader
        title="Operations Dashboard"
        subtitle={`Real-time plant monitoring · ${new Date().toLocaleString('en-GB', {
          dateStyle: 'medium', timeStyle: 'short'
        })} AST`}
      >
        <div className="live-chip">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse-slow" />
          LIVE TELEMETRY
        </div>
        <AsyncButton successMsg="PDF exported" className="btn btn-outline btn-sm">
          ⬇ Export PDF
        </AsyncButton>
      </PageHeader>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        {kpiCards.map(card =>
          kpiLoading ? (
            <Skeleton key={card.label} h="h-24" className="rounded-lg" />
          ) : (
            <KpiCard key={card.label} {...card} />
          )
        )}
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 mb-3">
        <div className="card lg:col-span-2">
          <div className="card-title">⚡ Power Generation Trend (MW)</div>
          {powerLoading
            ? <Skeleton h="h-44" />
            : <div className="h-44"><PowerTrendChart data={powerChartData} /></div>
          }
        </div>
        <div className="card">
          <div className="card-title">☀ Irradiance vs Power</div>
          {irrLoading
            ? <Skeleton h="h-44" />
            : <div className="h-44"><IrradiancePowerChart data={irrChartData} /></div>
          }
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-3">
        <div className="card">
          <div className="card-title">📊 Daily Energy (MWh) — Last 7 Days</div>
          {dailyLoading
            ? <Skeleton h="h-44" />
            : <div className="h-44"><DailyEnergyChart data={dailyChartData} /></div>
          }
        </div>

        {/* Active Alarms */}
        <div className="card">
          <div className="card-title justify-between">
            <span>🔔 Active Alarms</span>
            <button
              onClick={() => navigate('/alarms')}
              className="text-ge-blue text-[10px] font-mono hover:underline"
            >
              View all →
            </button>
          </div>
          {alarmLoading ? (
            <div className="space-y-2">
              {[1,2,3].map(i => <Skeleton key={i} h="h-10" />)}
            </div>
          ) : alarms.length === 0 ? (
            <div className="text-[12px] text-ge-text3 py-4 text-center">
              No active alarms
            </div>
          ) : (
            alarms.slice(0, 4).map(a => (
              <div key={a.id}
                className="flex items-center gap-3 py-2 border-b border-ge-border last:border-b-0">
                <div className={`w-7 h-7 rounded-md flex items-center justify-center
                                text-sm flex-shrink-0
                                ${a.sev === 'Critical' ? 'bg-red-900/40'
                                  : a.sev === 'Warning' ? 'bg-amber-900/40'
                                  : 'bg-blue-900/40'}`}>
                  {a.sev === 'Critical' ? '🔴' : a.sev === 'Warning' ? '⚠' : 'ℹ'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[12px] font-medium text-ge-text1">{a.eq}</div>
                  <div className="text-[11px] text-ge-text3 truncate">{a.msg}</div>
                </div>
                <div className="text-right flex-shrink-0">
                  <span className={severityPillClass(a.sev)}>{a.sev}</span>
                  <div className="text-[10px] font-mono text-ge-text3 mt-0.5">{a.time}</div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Live Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label:'Monthly Energy',    value: kpis.monthly_energy?.value   ?? '—', unit: kpis.monthly_energy?.unit   ?? 'MWh', color:'blue'   },
          { label:'Inverters Running', value: kpis.inverters_running?.value ?? '—', unit: '',                                   color:'green'  },
          { label:'Grid Frequency',    value: kpis.grid_frequency?.value    ?? '—', unit: kpis.grid_frequency?.unit    ?? 'Hz',  color:'amber'  },
          { label:'Module Temp',       value: kpis.module_temp?.value       ?? '—', unit: kpis.module_temp?.unit       ?? '°C',  color:'purple' },
        ].map(card =>
          kpiLoading
            ? <Skeleton key={card.label} h="h-20" className="rounded-lg" />
            : <KpiCard key={card.label} {...card} />
        )}
      </div>
    </div>
  )
}