import React, { useMemo } from 'react'
import { KpiCard, PageHeader, AsyncButton, Skeleton } from '../../components/Common'
import {
  PRIrradianceChart, InverterComparisonChart,
  WeeklyEnergyChart, DailyEnergyChart,
} from '../../components/Charts'
import { useFetch } from '../../hooks/useFetch'
import {
  fetchKPIs, fetchInverterComparison,
  fetchPRIrradiance, fetchWeeklyEnergy,
} from '../../services/api'

export default function Analytics() {
  const { data: kpiData,  loading: kpiLoading  } = useFetch(fetchKPIs)
  const { data: invData,  loading: invLoading   } = useFetch(fetchInverterComparison)
  const { data: prData,   loading: prLoading    } = useFetch(fetchPRIrradiance)
  const { data: weekData, loading: weekLoading  } = useFetch(fetchWeeklyEnergy)

  const kpis = kpiData || {}

  // ── Inverter comparison chart data ────────────────────────────────────────
  const invChartData = useMemo(() => {
    const items = invData?.inverters || []
    if (items.length) {
      return items.slice(0, 24).map(inv => ({
        id:    inv.id,
        power: inv.avg_power_kw / 1000 || 0,
      }))
    }
    return Array.from({ length: 6 }, (_, i) => ({
      id: `INV-${String(i+1).padStart(3,'0')}`,
      power: [312,298,287,305,318,327][i],
    }))
  }, [invData])

  // ── PR vs Irradiance chart data ───────────────────────────────────────────
  const prChartData = useMemo(() => {
    const rows = prData?.data || []
    if (rows.length) return rows.map(r => ({ hour: r.hour, pr: r.pr, irr: r.irr }))
    const hours = ['00:00','02:00','04:00','06:00','08:00','10:00','12:00','14:00','16:00','18:00','20:00','22:00']
    return hours.map((h, i) => ({
      hour: h,
      pr:   [0,0,0,76,79,82,82.4,81.8,80.2,79.1,77,0][i],
      irr:  [0,0,0,180,620,880,1020,950,750,480,180,0][i],
    }))
  }, [prData])

  // ── Weekly energy chart data ───────────────────────────────────────────────
  const weekChartData = useMemo(() => {
    const rows = weekData?.data || []
    if (rows.length) return rows.map(r => ({ label: r.label, value: r.value }))
    return [
      { label:'Mon', value:7620 },{ label:'Tue', value:8045 },
      { label:'Wed', value:7990 },{ label:'Thu', value:8156 },
      { label:'Fri', value:7834 },{ label:'Sat', value:8012 },
      { label:'Sun', value:8247 },
    ]
  }, [weekData])

  return (
    <div>
      <PageHeader title="Analytics & Performance" subtitle="Advanced performance metrics and trend analysis">
        <AsyncButton className="btn btn-outline btn-sm" successMsg="Analytics exported!">
          ⬇ Export Report
        </AsyncButton>
      </PageHeader>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        {kpiLoading ? (
          [...Array(4)].map((_, i) => <Skeleton key={i} h="h-24" className="rounded-lg" />)
        ) : [
          { label:'GHI Irradiation', value: String(kpis.ghi_irradiation?.value ?? '—'), unit: kpis.ghi_irradiation?.unit ?? 'W/m²', color:'green'  },
          { label:'Module Temp',     value: String(kpis.module_temp?.value      ?? '—'), unit: kpis.module_temp?.unit      ?? '°C',   color:'blue'   },
          { label:'Wind Speed',      value: String(kpis.wind_speed?.value       ?? '—'), unit: kpis.wind_speed?.unit       ?? 'm/s',  color:'amber'  },
          { label:'Soiling Ratio',   value: String(kpis.soiling_ratio?.value    ?? '—'), unit: '',                                   color:'purple' },
        ].map(card => <KpiCard key={card.label} {...card} />)}
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-3">
        <div className="card">
          <div className="card-title">Hourly PR (%) vs Irradiance (W/m²)</div>
          {prLoading ? <Skeleton h="h-52" /> : (
            <div className="h-52"><PRIrradianceChart data={prChartData} /></div>
          )}
          <div className="flex gap-4 mt-2">
            <div className="flex items-center gap-1.5 text-[11px] text-ge-text3">
              <span className="w-5 h-0.5 bg-ge-accent inline-block" /> PR (%)
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-ge-text3">
              <span className="w-5 h-0.5 bg-ge-warn inline-block" /> Irradiance
            </div>
          </div>
        </div>
        <div className="card">
          <div className="card-title">Inverter Output Comparison (MW)</div>
          {invLoading ? <Skeleton h="h-52" /> : (
            <div className="h-52"><InverterComparisonChart data={invChartData} /></div>
          )}
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-3">
        <div className="card">
          <div className="card-title">7-Day Energy Generation (MWh)</div>
          {weekLoading ? <Skeleton h="h-48" /> : (
            <div className="h-48"><WeeklyEnergyChart data={weekChartData} /></div>
          )}
        </div>
        <div className="card">
          <div className="card-title">Daily Energy vs Target</div>
          {weekLoading ? <Skeleton h="h-48" /> : (
            <div className="h-48"><DailyEnergyChart data={weekChartData} /></div>
          )}
        </div>
      </div>

      {/* Inverter Performance Table */}
      <div className="card">
        <div className="card-title">Inverter Performance Summary</div>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Inverter</th><th>Avg Power (kW)</th><th>Max Power (kW)</th>
                <th>DC Voltage (V)</th><th>Daily Energy</th>
                <th>Avg Temp (°C)</th><th>Status</th>
              </tr>
            </thead>
            <tbody>
              {invLoading ? (
                <tr><td colSpan={7} className="py-6 text-center text-ge-text3">Loading...</td></tr>
              ) : invChartData.slice(0, 24).map((inv, i) => {
                const full = invData?.inverters?.[i] || {}
                return (
                  <tr key={inv.id}>
                    <td className="font-medium text-ge-text1">{inv.id}</td>
                    <td className="font-mono text-ge-accent">{full.avg_power_kw ?? inv.power ?? 0}</td>
                    <td className="font-mono">{full.max_power_kw ?? 0}</td>
                    <td className="font-mono">{full.avg_voltage_v ?? 0}</td>
                    <td className="font-mono">{full.daily_energy ?? 0}</td>
                    <td className="font-mono">{full.avg_temp_c ?? 0}</td>
                    <td>
                      <span className={`status-pill ${
                        (full.avg_power_kw || inv.power || 0) > 100
                          ? 'pill-green' : 'pill-amber'
                      }`}>
                        {(full.avg_power_kw || inv.power || 0) > 100 ? 'Online' : 'Low'}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}