// src/pages/Dashboard/Dashboard.jsx
import React, { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  KpiCard, PageHeader, AsyncButton, DataTable, Skeleton
} from '../../components/Common'
import {
  PowerTrendChart, DailyEnergyChart, IrradiancePowerChart
} from '../../components/Charts'
import { useFetch } from '../../hooks/useFetch'
import {
  fetchKPIs, fetchAlarms, fetchPowerTrend,
  fetchDailyEnergy, fetchReportData
} from '../../services/api'
import {
  CHART_HOURS, POWER_TREND, DAILY_LABELS, DAILY_ENERGY
} from '../../services/mockData'
import { statusPillClass, severityPillClass } from '../../utils/helpers'

/* ── Scatter data for irradiance vs power ── */
const IRR_DATA = Array.from({ length: 24 }, (_, i) => ({
  irr: i * 42 + Math.round(Math.random() * 30),
  pwr: i * 76 + Math.round(Math.random() * 60),
}))

const POWER_DATA = CHART_HOURS.map((h, i) => ({ hour: h, power: POWER_TREND[i] }))
const DAILY_DATA = DAILY_LABELS.map((l, i) => ({ label: l, value: DAILY_ENERGY[i] }))

const TABLE_COLS = [
  { key: 'ts',     label: 'Timestamp',  className: 'font-mono text-[11px]' },
  { key: 'eq',     label: 'Equipment',  className: 'font-medium text-ge-text1' },
  { key: 'tag',    label: 'Tag' },
  { key: 'val',    label: 'Value',
    render: v => <span className="font-mono text-ge-accent">{v}</span> },
  { key: 'unit',   label: 'Unit',
    render: v => <span className="font-mono text-ge-text3">{v}</span> },
  { key: 'status', label: 'Status',
    render: v => <span className={statusPillClass(v)}>{v}</span> },
]

export default function Dashboard() {
  const navigate = useNavigate()
  const { data: kpis,     loading: kpiLoading }   = useFetch(fetchKPIs)
  const { data: alarms,   loading: alarmLoading }  = useFetch(fetchAlarms)
  const { data: tableRes, loading: tableLoading }  = useFetch(fetchReportData)

  const kpiCards = [
    { key: 'todayEnergy',     color: 'green'  },
    { key: 'currentPower',    color: 'blue'   },
    { key: 'performanceRatio',color: 'amber'  },
    { key: 'availability',    color: 'purple' },
  ]

  return (
    <div>
      <PageHeader
        title="Operations Dashboard"
        subtitle={`Real-time plant monitoring · ${new Date().toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })} AST`}
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
        {kpiCards.map(({ key, color }) =>
          kpiLoading || !kpis ? (
            <Skeleton key={key} h="h-24" className="rounded-lg" />
          ) : (
            <KpiCard key={key} color={color} {...kpis[key]} />
          )
        )}
      </div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 mb-3">
        <div className="card lg:col-span-2">
          <div className="card-title">⚡ Power Generation Trend (MW)</div>
          <div className="h-44"><PowerTrendChart data={POWER_DATA} /></div>
        </div>
        <div className="card">
          <div className="card-title">☀ Irradiance vs Power</div>
          <div className="h-44"><IrradiancePowerChart data={IRR_DATA} /></div>
        </div>
      </div>

      {/* Charts row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-3">
        <div className="card">
          <div className="card-title">📊 Daily Energy (MWh) — Last 7 Days</div>
          <div className="h-44"><DailyEnergyChart data={DAILY_DATA} /></div>
        </div>

        {/* Active Alarms */}
        <div className="card">
          <div className="card-title flex items-center justify-between w-full">
            <span>🔔 Active Alarms</span>
            <button onClick={() => navigate('/alarms')} className="text-ge-blue text-[10px] font-mono hover:underline">
              View all →
            </button>
          </div>
          {alarmLoading ? (
            <div className="space-y-2">{[1,2,3].map(i => <Skeleton key={i} h="h-10" />)}</div>
          ) : (
            alarms?.slice(0, 4).map(a => (
              <div key={a.id} className="flex items-center gap-3 py-2 border-b border-ge-border last:border-b-0">
                <div className={`w-7 h-7 rounded-md flex items-center justify-center text-sm flex-shrink-0
                               ${a.sev === 'Critical' ? 'bg-red-900/40' : a.sev === 'Warning' ? 'bg-amber-900/40' : 'bg-blue-900/40'}`}>
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

      {/* Recent Data Table */}
      <div className="card">
        <div className="card-title justify-between">
          <span>📋 Recent Telemetry Data</span>
          <div className="flex items-center gap-2">
            <AsyncButton successMsg="Excel exported" className="btn btn-outline btn-sm">⬇ Excel</AsyncButton>
            <button onClick={() => navigate('/reports')} className="btn btn-outline btn-sm">Full Report →</button>
          </div>
        </div>
        {tableLoading ? (
          <div className="space-y-1">{[...Array(6)].map((_, i) => <Skeleton key={i} h="h-8" />)}</div>
        ) : (
          <DataTable columns={TABLE_COLS} rows={tableRes?.data?.slice(0, 6) || []} />
        )}
      </div>
    </div>
  )
}
