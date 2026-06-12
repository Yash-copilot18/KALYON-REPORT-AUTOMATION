import React from 'react'
import {
  KpiCard, PageHeader, AsyncButton, DataTable, ProgressBar, Skeleton
} from '../../components/Common'
import { MonthlyEnergyChart } from '../../components/Charts'
import { useFetch } from '../../hooks/useFetch'
import { fetchDGRData, fetchMonthlyEnergy } from '../../services/api'

const MONTHLY_FALLBACK = [
  { label:'Jan', value:4820 },{ label:'Feb', value:5210 },
  { label:'Mar', value:6840 },{ label:'Apr', value:7920 },
  { label:'May', value:8100 },{ label:'Jun', value:7650 },
  { label:'Jul', value:8247 },
]

const DGR_FALLBACK = [
  { date:'2026-08-01', energy:8247, peak:1847, pr:82.4, avail:98.7, alarms:1 },
  { date:'2026-07-31', energy:8012, peak:1801, pr:81.9, avail:99.1, alarms:0 },
  { date:'2026-07-30', energy:7834, peak:1768, pr:80.2, avail:97.8, alarms:2 },
  { date:'2026-07-29', energy:8156, peak:1823, pr:83.1, avail:99.3, alarms:0 },
  { date:'2026-07-28', energy:7990, peak:1789, pr:81.7, avail:98.5, alarms:1 },
  { date:'2026-07-27', energy:8045, peak:1812, pr:82.0, avail:99.0, alarms:0 },
  { date:'2026-07-26', energy:7620, peak:1756, pr:79.8, avail:97.2, alarms:3 },
]

function normalizeDGR(raw) {
  if (!raw) return DGR_FALLBACK
  // API returns { rows: [...], columns: [...], total_records: N }
  const rows = raw.rows || raw.data || (Array.isArray(raw) ? raw : [])
  if (!rows.length) return DGR_FALLBACK
  return rows.map((r, i) => ({
    date:   r.timestamp ? r.timestamp.split('T')[0] : `Row ${i+1}`,
    energy: r.GRAND_TOTAL || Object.values(r).filter(v => typeof v === 'number').reduce((a,b) => a+b, 0) || 0,
    peak:   r.peak   || '—',
    pr:     r.pr     || '—',
    avail:  r.avail  || '—',
    alarms: r.alarms || 0,
  }))
}

function normalizeMonthly(raw) {
  if (!raw) return MONTHLY_FALLBACK
  const rows = raw.rows || raw.data || (Array.isArray(raw) ? raw : [])
  if (!rows.length) return MONTHLY_FALLBACK
  return rows.map(r => ({
    label: r.timestamp ? new Date(r.timestamp).toLocaleString('en', { month: 'short' }) : '—',
    value: r.GRAND_TOTAL || 0,
  }))
}

const DGR_COLS = [
  { key: 'date',   label: 'Date',         className: 'font-mono text-[11px]' },
  { key: 'energy', label: 'Energy (MWh)',  render: v => <span className="font-mono text-ge-accent">{typeof v === 'number' ? v.toLocaleString() : v}</span> },
  { key: 'peak',   label: 'Peak Power (MW)', render: v => <span className="font-mono">{v}</span> },
  { key: 'pr',     label: 'PR (%)',        render: v => <span className="font-mono">{v}</span> },
  { key: 'avail',  label: 'Availability (%)', render: v => <span className="font-mono">{v}</span> },
  { key: 'alarms', label: 'Alarms',
    render: v => <span className={`status-pill ${v === 0 ? 'pill-green' : v > 1 ? 'pill-red' : 'pill-amber'}`}>{v}</span> },
  { key: 'date',   label: 'Report',
    render: (_, row) => (
      <AsyncButton className="btn btn-outline btn-sm" successMsg={`Downloading ${row.date} report...`}>
        ⬇
      </AsyncButton>
    )
  },
]

export default function DGRReports() {
  const { data: rawDGR,     loading: dgrLoading     } = useFetch(fetchDGRData)
  const { data: rawMonthly, loading: monthlyLoading  } = useFetch(fetchMonthlyEnergy)

  const dgrData     = normalizeDGR(rawDGR)
  const monthlyData = normalizeMonthly(rawMonthly)

  return (
    <div>
      <PageHeader
        title="Daily Generation Reports (DGR)"
        subtitle="Monthly and daily energy production analysis"
      >
        <AsyncButton className="btn btn-outline btn-sm" successMsg="DGR Excel downloaded!">
          ⬇ Download DGR Excel
        </AsyncButton>
        <AsyncButton className="btn btn-primary btn-sm" successMsg="DGR PDF generated!">
          📄 Generate DGR PDF
        </AsyncButton>
      </PageHeader>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
        <KpiCard label="Monthly Energy"        value="187,420" unit="MWh"     change="+6.1%" up color="green" />
        <KpiCard label="Avg Daily Generation"  value="6,047"   unit="MWh/day" change="+2.3%" up color="blue"  />
        <KpiCard label="Plant Load Factor"     value="24.7"    unit="%"       change="-0.4%" up={false} color="amber" />
      </div>

      {/* Charts + Targets */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 mb-3">
        <div className="card lg:col-span-2">
          <div className="card-title">Monthly Energy Generation (MWh) — 2026</div>
          {monthlyLoading
            ? <Skeleton h="h-52" />
            : <div className="h-52"><MonthlyEnergyChart data={monthlyData} /></div>
          }
        </div>
        <div className="card">
          <div className="card-title">Generation vs Target</div>
          <ProgressBar label="Jan–Jul Actual"  sublabel="39,540 MWh" value={94}  color="#10b981" />
          <ProgressBar label="Annual Target"   sublabel="42,000 MWh" value={100} color="#334066" />
          <ProgressBar label="Aug Forecast"    sublabel="8,450 MWh"  value={102} color="#0099ff" />
          <div className="mt-4 pt-4 border-t border-ge-border space-y-2">
            {[
              { l:'Specific Yield',    v:'4.12 kWh/kWp' },
              { l:'CO₂ Avoided',       v:'6,198 t'       },
              { l:'Grid Export',       v:'7,984 MWh'     },
              { l:'Inverter Eff. Avg', v:'98.1 %'        },
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
        {dgrLoading
          ? <div className="space-y-1">{[...Array(7)].map((_, i) => <Skeleton key={i} h="h-8" />)}</div>
          : <DataTable columns={DGR_COLS} rows={dgrData} emptyMsg="No DGR data found" />
        }
      </div>
    </div>
  )
}