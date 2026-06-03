// src/pages/DGRReports/DGRReports.jsx
import React from 'react'
import {
  KpiCard, PageHeader, AsyncButton, DataTable, ProgressBar, Skeleton
} from '../../components/Common'
import { MonthlyEnergyChart } from '../../components/Charts'
import { useFetch } from '../../hooks/useFetch'
import { fetchDGRData, fetchMonthlyEnergy } from '../../services/api'
import { MONTHLY_LABELS, MONTHLY_ENERGY } from '../../services/mockData'
import { statusPillClass } from '../../utils/helpers'

const MONTHLY_DATA = MONTHLY_LABELS.map((l, i) => ({ label: l, value: MONTHLY_ENERGY[i] }))

const DGR_COLS = [
  { key: 'date',   label: 'Date',        className: 'font-mono text-[11px]' },
  { key: 'energy', label: 'Energy (MWh)', render: v => <span className="font-mono text-ge-accent">{v.toLocaleString()}</span> },
  { key: 'peak',   label: 'Peak Power (MW)', render: v => <span className="font-mono">{v}</span> },
  { key: 'pr',     label: 'PR (%)',       render: v => <span className="font-mono">{v}</span> },
  { key: 'avail',  label: 'Availability (%)', render: v => <span className="font-mono">{v}</span> },
  { key: 'alarms', label: 'Alarms',
    render: v => <span className={`status-pill ${v === 0 ? 'pill-green' : v > 1 ? 'pill-red' : 'pill-amber'}`}>{v}</span> },
  { key: '_dl',    label: 'Report',
    render: (_, row) => <AsyncButton className="btn btn-outline btn-sm" successMsg={`Downloading ${row.date} report...`}>⬇</AsyncButton> },
]

export default function DGRReports() {
  const { data: dgrData, loading: dgrLoading } = useFetch(fetchDGRData)

  return (
    <div>
      <PageHeader title="Daily Generation Reports (DGR)"
        subtitle="Monthly and daily energy production analysis">
        <AsyncButton className="btn btn-outline btn-sm" successMsg="DGR Excel downloaded!">
          ⬇ Download DGR Excel
        </AsyncButton>
        <AsyncButton className="btn btn-primary btn-sm" successMsg="DGR PDF generated!">
          📄 Generate DGR PDF
        </AsyncButton>
      </PageHeader>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
        <KpiCard label="Monthly Energy"       value="187,420" unit="MWh"      change="+6.1%" up color="green"  />
        <KpiCard label="Avg Daily Generation" value="6,047"   unit="MWh/day"  change="+2.3%" up color="blue"   />
        <KpiCard label="Plant Load Factor"    value="24.7"    unit="%"        change="-0.4%" up={false} color="amber"  />
      </div>

      {/* Charts + Targets */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 mb-3">
        <div className="card lg:col-span-2">
          <div className="card-title">Monthly Energy Generation (MWh) — 2026</div>
          <div className="h-52"><MonthlyEnergyChart data={MONTHLY_DATA} /></div>
        </div>
        <div className="card">
          <div className="card-title">Generation vs Target</div>
          <ProgressBar label="Jan–Jul Actual"  sublabel="39,540 MWh" value={94}  color="#10b981" />
          <ProgressBar label="Annual Target"   sublabel="42,000 MWh" value={100} color="#334066" />
          <ProgressBar label="Aug Forecast"    sublabel="8,450 MWh"  value={102} color="#0099ff" />
          <div className="mt-4 pt-4 border-t border-ge-border space-y-2">
            {[
              { l: 'Specific Yield',    v: '4.12 kWh/kWp' },
              { l: 'CO₂ Avoided',       v: '6,198 t' },
              { l: 'Grid Export',       v: '7,984 MWh' },
              { l: 'Inverter Eff. Avg', v: '98.1 %' },
            ].map(r => (
              <div key={r.l} className="flex justify-between">
                <span className="text-[11px] text-ge-text2">{r.l}</span>
                <span className="text-[11px] font-mono text-ge-text1">{r.v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* DGR Table */}
      <div className="card">
        <div className="card-title">Daily Report Log</div>
        {dgrLoading ? (
          <div className="space-y-1">{[...Array(7)].map((_, i) => <Skeleton key={i} h="h-8" />)}</div>
        ) : (
          <DataTable
            columns={DGR_COLS}
            rows={(dgrData || []).map(r => ({ ...r, _dl: null }))}
          />
        )}
      </div>
    </div>
  )
}
