// src/pages/Analytics/Analytics.jsx
import React from 'react'
import { KpiCard, PageHeader, AsyncButton } from '../../components/Common'
import {
  PRIrradianceChart, InverterComparisonChart, WeeklyEnergyChart, DailyEnergyChart
} from '../../components/Charts'
import { DAILY_LABELS, DAILY_ENERGY } from '../../services/mockData'

const CHART_HOURS = ['00','02','04','06','08','10','12','14','16','18','20','22']
const PR_DATA = CHART_HOURS.map((h, i) => ({
  hour: h,
  pr:   [0,0,0,76,79,82,82.4,81.8,80.2,79.1,77,0][i],
  irr:  [0,0,0,180,620,880,1020,950,750,480,180,0][i],
}))

const INV_DATA = [
  { id:'INV-001', power:312 }, { id:'INV-002', power:298 },
  { id:'INV-003', power:287 }, { id:'INV-004', power:305 },
  { id:'INV-005', power:318 }, { id:'INV-006', power:327 },
]

const WEEK_DATA = DAILY_LABELS.map((l, i) => ({ label: l, value: DAILY_ENERGY[i] }))

export default function Analytics() {
  return (
    <div>
      <PageHeader title="Analytics & Performance"
        subtitle="Advanced performance metrics and trend analysis">
        <AsyncButton className="btn btn-outline btn-sm" successMsg="Analytics report exported!">
          ⬇ Export Report
        </AsyncButton>
      </PageHeader>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <KpiCard label="CUF"             value="24.7"  unit="%"          change="+1.2%" up color="green"  />
        <KpiCard label="Specific Yield"  value="4.12"  unit="kWh/kWp"    change="+0.3%" up color="blue"   />
        <KpiCard label="Grid Export"     value="7,984" unit="MWh"        change="+3.1%" up color="amber"  />
        <KpiCard label="CO₂ Avoided"     value="6,198" unit="t/month"    change="+4.0%" up color="purple" />
      </div>

      {/* Chart row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-3">
        <div className="card">
          <div className="card-title">Hourly PR (%) vs Irradiance (W/m²)</div>
          <div className="h-52"><PRIrradianceChart data={PR_DATA} /></div>
          <div className="flex gap-4 mt-2">
            <div className="flex items-center gap-1.5 text-[11px] text-ge-text3">
              <span className="w-5 h-0.5 bg-ge-accent inline-block" /> PR (%)
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-ge-text3">
              <span className="w-5 h-0.5 bg-ge-warn inline-block border-dashed border-b" /> Irradiance
            </div>
          </div>
        </div>
        <div className="card">
          <div className="card-title">Inverter Output Comparison (MW)</div>
          <div className="h-52"><InverterComparisonChart data={INV_DATA} /></div>
        </div>
      </div>

      {/* Chart row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-3">
        <div className="card">
          <div className="card-title">7-Day Energy Generation (MWh)</div>
          <div className="h-48"><WeeklyEnergyChart data={WEEK_DATA} /></div>
          <p className="text-[10px] font-mono text-ge-text3 mt-1">
            — dashed line = 8,000 MWh target
          </p>
        </div>
        <div className="card">
          <div className="card-title">Daily Energy vs Target (MWh)</div>
          <div className="h-48"><DailyEnergyChart data={WEEK_DATA} /></div>
        </div>
      </div>

      {/* Summary table */}
      <div className="card">
        <div className="card-title">Performance Summary — Inverters</div>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Inverter</th><th>Output (MW)</th><th>Efficiency (%)</th>
                <th>Temperature</th><th>PR (%)</th><th>Availability (%)</th><th>Status</th>
              </tr>
            </thead>
            <tbody>
              {[
                ['INV-001',312,98.2,'38°C',82.8,99.2,'Online'],
                ['INV-002',298,97.9,'36°C',81.4,99.1,'Online'],
                ['INV-003',287,96.1,'42°C',79.2,97.8,'Warning'],
                ['INV-004',305,98.0,'37°C',82.3,99.0,'Online'],
                ['INV-005',318,98.4,'35°C',83.1,99.3,'Online'],
                ['INV-006',327,98.6,'34°C',83.7,99.4,'Online'],
              ].map(([id,pwr,eff,tmp,pr,av,st]) => (
                <tr key={id}>
                  <td className="font-medium text-ge-text1">{id}</td>
                  <td className="font-mono text-ge-accent">{pwr}</td>
                  <td className="font-mono">{eff}</td>
                  <td className="font-mono">{tmp}</td>
                  <td className="font-mono">{pr}</td>
                  <td className="font-mono">{av}</td>
                  <td>
                    <span className={`status-pill ${st === 'Online' ? 'pill-green' : 'pill-amber'}`}>{st}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
