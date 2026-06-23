// src/pages/Reports/Reports.jsx
import React, { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageHeader, FormRow, FormGroup, Skeleton, Spinner } from '../../components/Common'
import { useApp } from '../../utils/AppContext'
import {
  fetchReportEquipmentTypes,
  fetchReportEquipmentList,
  fetchReportTags,
  fetchReportDataV2,
  exportReportCSVV2,
  exportReportExcelV2,
  exportReportPDFV2,
} from '../../services/api'

// ── Helpers ────────────────────────────────────────────────────────────────────
function safeArr(v) {
  if (Array.isArray(v)) return v
  if (v && Array.isArray(v.items)) return v.items
  if (v && Array.isArray(v.data))  return v.data
  return []
}

function fmtTimestamp(val) {
  if (!val) return '—'
  const s = String(val).replace('T', ' ').slice(0, 19)
  const [date, time] = s.split(' ')
  if (!date) return s
  const [y, mo, d] = date.split('-')
  return `${d}/${mo}/${y} ${time || '00:00:00'}`
}

function fmtNum(val) {
  if (val === null || val === undefined) return '—'
  if (typeof val === 'number') {
    return Number.isInteger(val) ? val.toLocaleString() : val.toFixed(3)
  }
  return String(val)
}

function toISO(dtLocal) {
  return dtLocal ? new Date(dtLocal).toISOString() : ''
}

function todayDMY() {
  const d = new Date()
  return `${String(d.getDate()).padStart(2,'0')}-${String(d.getMonth()+1).padStart(2,'0')}-${d.getFullYear()}`
}

const UNIT_MAP = {
  DC_VOLTAGE:'V', DC_CURRENT:'A', DC_POWER:'kW',
  ACTIVE_POWER:'kW', REACTIVE_POWER:'kVAR', APPARENT_POWER:'kVA',
  DAILY_ENERGY:'kWh', MONTHLY_ENERGY:'kWh', YEARLY_ENERGY:'kWh',
  LIFETIME_ENERGY:'kWh', GRID_CURRENT_PHASE1:'A', GRID_CURRENT_PHASE2:'A',
  GRID_CURRENT_PHASE3:'A', GRID_LINE_VOLT_UV:'V', GRID_LINE_VOLT_VW:'V',
  GRID_LINE_VOLT_WU:'V', GRID_FREQUENCY_MEASURED:'Hz',
  GRID_ACTIVE_POWER_MEASURED:'kW', GRID_REACTIVE_POWER_MEASURED:'kVAR',
  GRID_VOLTAGE_L_L_MEASURED:'V', INVERTER_TOTAL_ACTIVE_POWER:'kW',
  PLANT_DAILY_PRODUCTION:'kWh', PLANT_MONTHLY_PRODUCTION:'kWh',
  AVG_GHI_IRRADIATION:'W/m2', AVG_GTI_IRRADIATION:'W/m2',
  TOTAL_IRRADIANCE:'W/m2', AVG_AIR_TEMP:'C', AVG_WIND_SPEED:'m/s',
  AVG_RELATIVE_HUMIDITY:'%', ALL_WMS_AVG_MODULE_TEMP:'C',
  PRIMEPACK_IGBT_HEATSINK_TEMP:'C', MV_TRAFO_TEMP:'C',
  DAILY_RUN_MIN:'min', DOWN_TIME_MIN:'min', DurCol:'s',
}

function colLabel(col) {
  if (col === 'timestamp') return 'Timestamp (DD/MM/YYYY HH:MM:SS)'
  const label = col.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
  const unit  = UNIT_MAP[col] || ''
  return unit ? `${label} (${unit})` : label
}

const INTERVALS  = ['raw','1min','5min','15min','30min','hourly','daily','monthly']
const AGG_FUNCS  = ['avg','min','max','sum']
const AGG_LABELS = { avg:'Average', min:'Minimum', max:'Maximum', sum:'Sum' }

// ── Tag Selector ───────────────────────────────────────────────────────────────
function DynamicTagSelector({ tags, selected, setSelected }) {
  const [query,  setQuery]  = useState('')
  const [sorted, setSorted] = useState(false)

  const displayed = useMemo(() => {
    let list = sorted ? [...tags].sort((a,b) => a.tag.localeCompare(b.tag)) : tags
    return list.filter(t => t.tag.toLowerCase().includes(query.toLowerCase()))
  }, [tags, query, sorted])

  const toggle    = col => setSelected(prev => {
    const s = new Set(prev); s.has(col) ? s.delete(col) : s.add(col); return s
  })
  const addAll    = () => setSelected(new Set(tags.map(t => t.column_name)))
  const removeAll = () => setSelected(new Set())

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-semibold text-ge-text3 uppercase tracking-widest">
          Tag Selection
        </span>
        <span className="text-[10px] font-mono text-ge-accent">{selected.size} selected</span>
      </div>

      <div className="relative mb-2.5">
        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-ge-text3 text-sm">🔍</span>
        <input type="text" value={query} onChange={e => setQuery(e.target.value)}
          placeholder="Search tags..." className="form-control pl-7 text-[12px]" />
      </div>

      <div className="flex items-center gap-2 mb-2.5 flex-wrap">
        <button className="btn btn-outline btn-sm" onClick={addAll}>
          + Add All ({tags.length})
        </button>
        <button className="btn btn-outline btn-sm" onClick={removeAll}>✕ Remove All</button>
        <button className="btn btn-outline btn-sm" onClick={() => setSorted(s => !s)}>
          {sorted ? 'Default' : 'A→Z Sort'}
        </button>
        <span className="ml-auto text-[11px] text-ge-text3 font-mono">
          Available: {displayed.length}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        <div>
          <div className="flex items-center justify-between px-2.5 py-1.5
                          bg-ge-elevated border border-ge-border rounded-t-md border-b-0">
            <span className="text-[10px] font-semibold text-ge-text3 uppercase">Available</span>
            <span className="text-[10px] font-mono text-ge-text3">{displayed.length}</span>
          </div>
          <div className="bg-ge-elevated border border-ge-border rounded-b-md overflow-y-auto max-h-52">
            {displayed.length === 0
              ? <div className="px-3 py-4 text-[12px] text-ge-text3 text-center">No tags found</div>
              : displayed.map(tag => (
                <div key={tag.column_name} onClick={() => toggle(tag.column_name)}
                  className={`flex items-center gap-2 px-2.5 py-1.5 cursor-pointer
                             border-b border-ge-border last:border-b-0 transition-colors
                             hover:bg-ge-surface
                             ${selected.has(tag.column_name) ? 'bg-blue-950/40' : ''}`}>
                  <div className={`w-3.5 h-3.5 rounded flex items-center justify-center
                                  text-[9px] flex-shrink-0 border
                                  ${selected.has(tag.column_name)
                                    ? 'bg-ge-blue border-ge-blue text-white'
                                    : 'border-ge-border2'}`}>
                    {selected.has(tag.column_name) && '✓'}
                  </div>
                  <span className="text-[12px] text-ge-text1 flex-1">{tag.tag}</span>
                  {tag.unit && <span className="text-[10px] font-mono text-ge-text3">{tag.unit}</span>}
                </div>
              ))
            }
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between px-2.5 py-1.5
                          bg-ge-elevated border border-ge-border rounded-t-md border-b-0">
            <span className="text-[10px] font-semibold text-ge-text3 uppercase">Selected</span>
            <span className="text-[10px] font-mono text-ge-accent">{selected.size} tags</span>
          </div>
          <div className="bg-ge-elevated border border-ge-border rounded-b-md overflow-y-auto max-h-52">
            {selected.size === 0
              ? <div className="px-3 py-4 text-[12px] text-ge-text3 text-center">No tags selected</div>
              : [...selected].map(col => {
                const tag = tags.find(t => t.column_name === col) || { tag: col, unit: '' }
                return (
                  <div key={col} onClick={() => toggle(col)}
                    className="flex items-center gap-2 px-2.5 py-1.5 cursor-pointer
                               border-b border-ge-border last:border-b-0 transition-colors
                               hover:bg-ge-surface bg-blue-950/30">
                    <div className="w-3.5 h-3.5 rounded flex items-center justify-center
                                    text-[9px] flex-shrink-0 bg-ge-blue border border-ge-blue text-white">
                      ✓
                    </div>
                    <span className="text-[12px] text-ge-text1 flex-1">{tag.tag}</span>
                    {tag.unit && <span className="text-[10px] font-mono text-ge-text3">{tag.unit}</span>}
                  </div>
                )
              })
            }
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function Reports() {
  const navigate      = useNavigate()
  const { showToast } = useApp()

  const [eqTypes,  setEqTypes]  = useState([])
  const [eqList,   setEqList]   = useState([])
  const [tagList,  setTagList]  = useState([])
  const [eqType,   setEqType]   = useState('')
  const [eqId,     setEqId]     = useState('')
  const [selected, setSelected] = useState(new Set())
  const [fromDate, setFromDate] = useState('2024-02-08T00:00')
  const [toDate,   setToDate]   = useState('2024-05-21T23:59')
  const [interval, setInterval] = useState('hourly')
  const [aggFunc,  setAggFunc]  = useState('avg')
  const [page,     setPage]     = useState(1)
  const [search,   setSearch]   = useState('')

  const [loadingTypes,  setLoadingTypes]  = useState(true)
  const [loadingEqList, setLoadingEqList] = useState(false)
  const [loadingTags,   setLoadingTags]   = useState(false)
  const [loadingData,   setLoadingData]   = useState(false)
  const [loadingExport, setLoadingExport] = useState(false)
  const [exportLabel,   setExportLabel]   = useState('')

  const [result, setResult] = useState(null)
  const [error,  setError]  = useState(null)

  useEffect(() => {
    setLoadingTypes(true)
    fetchReportEquipmentTypes()
      .then(data => setEqTypes(safeArr(data)))
      .catch(() => setEqTypes([]))
      .finally(() => setLoadingTypes(false))
  }, [])

  useEffect(() => {
    if (!eqType) { setEqList([]); setEqId(''); return }
    setLoadingEqList(true)
    setEqId(''); setTagList([]); setSelected(new Set()); setResult(null)
    fetchReportEquipmentList(eqType)
      .then(data => setEqList(safeArr(data)))
      .catch(() => setEqList([]))
      .finally(() => setLoadingEqList(false))
  }, [eqType])

  useEffect(() => {
    if (!eqType) { setTagList([]); return }
    setLoadingTags(true)
    setSelected(new Set())
    fetchReportTags(eqType, eqId || undefined)
      .then(data => {
        const tags = safeArr(data)
        setTagList(tags)
        setSelected(new Set(tags.slice(0, 4).map(t => t.column_name)))
      })
      .catch(() => setTagList([]))
      .finally(() => setLoadingTags(false))
  }, [eqType, eqId])

  const buildPayload = (pageNum = 1, pageSize = 100) => ({
    equipment_type: eqType,
    equipment_id:   eqId,
    tags:           [...selected],
    from_datetime:  toISO(fromDate),
    to_datetime:    toISO(toDate),
    interval,
    agg_function:   aggFunc,
    page:           pageNum,
    page_size:      pageSize,
  })

  const handleLoadData = async () => {
    if (!eqType)           return showToast('Select Equipment Type')
    if (!eqId)             return showToast('Select Equipment Identifier')
    if (selected.size < 1) return showToast('Select at least one tag')
    setLoadingData(true); setError(null); setResult(null); setPage(1)
    try {
      const data = await fetchReportDataV2(buildPayload(1, 100))
      setResult(data)
      showToast(`Loaded successfully`)
    } catch (e) {
      setError(e.message || 'Failed to load data')
    } finally {
      setLoadingData(false)
    }
  }

  const handlePageChange = async (newPage) => {
    if (!eqType || !eqId || selected.size < 1) return
    setLoadingData(true)
    try {
      const data = await fetchReportDataV2(buildPayload(newPage, 100))
      setResult(data); setPage(newPage)
    } catch { showToast('Failed to load page') }
    finally { setLoadingData(false) }
  }

  const handleDownload = async (exportFn, ext, maxRows, label) => {
    if (!result) return showToast('Load data first')
    setLoadingExport(true); setExportLabel(label)
    try {
      const blob = await exportFn(buildPayload(1, maxRows))
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement('a')
      a.href     = url
      a.download = `${eqId}_Report_${todayDMY()}.${ext}`
      a.click()
      URL.revokeObjectURL(url)
      showToast(`${label} downloaded`)
    } catch (e) {
      showToast(`${label} failed: ${e.message}`)
    } finally {
      setLoadingExport(false); setExportLabel('')
    }
  }

  const handleExportCSV   = () => handleDownload(exportReportCSVV2,   'csv',  10000, 'CSV')
  const handleExportExcel = () => handleDownload(exportReportExcelV2, 'xlsx', 10000, 'Excel')
  const handleExportPDF   = () => handleDownload(exportReportPDFV2,   'pdf',  2000,  'PDF')

  const tableCols = useMemo(() => {
    if (!result?.columns) return []
    return result.columns.map(col => ({
      key:   col,
      label: colLabel(col),
      isTs:  col === 'timestamp',
    }))
  }, [result?.columns])

  const tableRows = useMemo(() => {
    const rows = result?.rows || []
    if (!search) return rows
    return rows.filter(r =>
      Object.values(r).some(v => String(v).toLowerCase().includes(search.toLowerCase()))
    )
  }, [result?.rows, search])

  const totalPages = Math.min(Math.ceil((result?.total_records || 0) / 100), 50)

  const ExportBtn = ({ onClick, icon, label }) => (
    <button className="btn btn-outline btn-sm" onClick={onClick}
      disabled={loadingExport || !result}>
      {loadingExport && exportLabel === label
        ? <><Spinner size={12} /> Exporting...</>
        : <>{icon} Export {label}</>
      }
    </button>
  )

  return (
    <div>
      <PageHeader
        title="Report Automation"
      />

      {/* Equipment Selection */}
      <div className="card mb-3">
        <div className="card-title">Equipment Selection</div>
        <FormRow>
          <FormGroup label="Equipment Type">
            {loadingTypes ? (
              <div className="form-control flex items-center gap-2 text-ge-text3 text-[12px]">
                <Spinner size={12} /> Loading...
              </div>
            ) : (
              <select className="form-control" value={eqType}
                onChange={e => setEqType(e.target.value)}>
                <option value="">— Select Type —</option>
                {eqTypes.map(t => (
                  <option key={t.equipment_type} value={t.equipment_type}>
                    {t.equipment_type}
                  </option>
                ))}
              </select>
            )}
          </FormGroup>

          <FormGroup label="Equipment Identifier">
            {loadingEqList ? (
              <div className="form-control flex items-center gap-2 text-ge-text3 text-[12px]">
                <Spinner size={12} /> Loading...
              </div>
            ) : (
              <select className="form-control" value={eqId}
                onChange={e => setEqId(e.target.value)} disabled={!eqType}>
                <option value="">— Select Equipment —</option>
                {eqList.map(e => (
                  <option key={e.equipment_id} value={e.equipment_id}>
                    {e.display_name}
                  </option>
                ))}
              </select>
            )}
          </FormGroup>
        </FormRow>
      </div>

      {/* Tag Selection */}
      <div className="card mb-3">
        {loadingTags ? (
          <div className="flex items-center gap-2 py-6 text-ge-text3 text-[12px]">
            <Spinner size={14} /> Loading tags from database...
          </div>
        ) : tagList.length > 0 ? (
          <DynamicTagSelector tags={tagList} selected={selected} setSelected={setSelected} />
        ) : eqType ? (
          <div className="text-[12px] text-ge-text3 py-4 text-center">
            {eqId ? 'No tags found' : 'Select Equipment Identifier to load tags'}
          </div>
        ) : (
          <div className="text-[12px] text-ge-text3 py-4 text-center">
            Select Equipment Type to see available tags
          </div>
        )}
      </div>

      {/* Date & Time */}
      <div className="card mb-3">
        <div className="card-title">Date &amp; Time Configuration</div>
        <div className="mb-2 px-1 text-[11px] text-ge-accent font-mono">
          📅 Data available: 08/02/2024 → 21/05/2024
        </div>
        <FormRow>
          <FormGroup label="From Date">
            <input type="datetime-local" className="form-control"
              value={fromDate} onChange={e => setFromDate(e.target.value)} />
          </FormGroup>
          <FormGroup label="To Date">
            <input type="datetime-local" className="form-control"
              value={toDate} onChange={e => setToDate(e.target.value)} />
          </FormGroup>
          <FormGroup label="Time Interval">
            <select className="form-control" value={interval}
              onChange={e => setInterval(e.target.value)}>
              {INTERVALS.map(v => (
                <option key={v} value={v}>
                  {v === 'raw' ? 'Raw (No Aggregation)' : v}
                </option>
              ))}
            </select>
          </FormGroup>
          <FormGroup label="Aggregation Function">
            <select className="form-control" value={aggFunc}
              onChange={e => setAggFunc(e.target.value)}
              disabled={interval === 'raw'}>
              {AGG_FUNCS.map(v => (
                <option key={v} value={v}>{AGG_LABELS[v]}</option>
              ))}
            </select>
          </FormGroup>
        </FormRow>
      </div>

      {/* Actions */}
      <div className="card mb-3">
        <div className="card-title">Actions</div>
        <div className="flex flex-wrap gap-2 items-center">
          <button className="btn btn-primary btn-sm" onClick={handleLoadData}
            disabled={loadingData || !eqType || !eqId || selected.size === 0}>
            {loadingData
              ? <><Spinner size={12} /> Loading data...</>
              : <>📥 Load Data ({selected.size} tags)</>
            }
          </button>

          <button className="btn btn-outline btn-sm"
            onClick={() => navigate('/scheduled')}>
            ⏱ Scheduled Tasks
          </button>

          <ExportBtn onClick={handleExportCSV}   icon="📊" label="CSV"   />
          <ExportBtn onClick={handleExportExcel} icon="📗" label="Excel" />
          <ExportBtn onClick={handleExportPDF}   icon="📄" label="PDF"   />

          {result && (
            <div className="ml-auto flex items-center gap-3">
              <span className="text-[11px] font-mono text-ge-text3">
                {result.table_name} · {result.interval} · {result.agg_function}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="card mb-3 bg-red-950/20 border-ge-danger/40">
          <p className="text-[12px] text-ge-danger">⚠ {error}</p>
        </div>
      )}

      {/* Data Table */}
      <div className="card">
        <div className="card-title justify-between">
          <span>📋 Report Data</span>
          <div className="relative w-48">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-ge-text3 text-sm">
              🔍
            </span>
            <input type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search results..."
              className="form-control pl-7 text-[12px]" />
          </div>
        </div>

        {loadingData ? (
          <div className="space-y-1">
            {[...Array(8)].map((_, i) => <Skeleton key={i} h="h-8" />)}
          </div>
        ) : !result ? (
          <div className="py-16 text-center">
            <div className="text-4xl mb-3">📊</div>
            <div className="text-[13px] text-ge-text3 mb-1 font-medium">No data loaded yet</div>
            <div className="text-[11px] text-ge-text3">
              Select equipment → tags → date range → click Load Data
            </div>
          </div>
        ) : tableRows.length === 0 ? (
          <div className="py-12 text-center text-[12px] text-ge-text3">
            No records found for selected filters
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    {tableCols.map(col => (
                      <th key={col.key} className="whitespace-nowrap text-[10px]">
                        {col.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {tableRows.map((row, ri) => (
                    <tr key={ri}>
                      {tableCols.map((col, ci) => {
                        const val = row[col.key]
                        return (
                          <td key={ci}>
                            {col.isTs ? (
                              <span className="font-mono text-[11px] text-ge-text3">
                                {fmtTimestamp(val)}
                              </span>
                            ) : val === null || val === undefined ? (
                              <span className="text-ge-text3 text-[11px]">—</span>
                            ) : typeof val === 'number' ? (
                              <span className="font-mono text-ge-accent text-[11px]">
                                {fmtNum(val)}
                              </span>
                            ) : (
                              <span className="font-mono text-ge-text2 text-[11px]">
                                {String(val)}
                              </span>
                            )}
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center gap-1.5 mt-3 flex-wrap">
              <button onClick={() => handlePageChange(Math.max(1, page - 1))}
                disabled={page <= 1 || loadingData}
                className="px-2.5 py-1 text-[11px] font-mono rounded border
                           bg-ge-elevated border-ge-border text-ge-text2
                           hover:text-ge-text1 disabled:opacity-40">
                ◀ Prev
              </button>

              {Array.from({ length: Math.min(totalPages, 10) }, (_, i) => i + 1).map(p => (
                <button key={p} onClick={() => handlePageChange(p)}
                  className={`px-2.5 py-1 text-[11px] font-mono rounded border transition-all
                    ${p === page
                      ? 'bg-ge-blue text-white border-ge-blue'
                      : 'bg-ge-elevated border-ge-border text-ge-text2 hover:text-ge-text1'}`}>
                  {p}
                </button>
              ))}

              {totalPages > 10 && (
                <span className="text-[11px] text-ge-text3 font-mono">
                  ... {totalPages} pages
                </span>
              )}

              <button onClick={() => handlePageChange(Math.min(totalPages, page + 1))}
                disabled={page >= totalPages || loadingData}
                className="px-2.5 py-1 text-[11px] font-mono rounded border
                           bg-ge-elevated border-ge-border text-ge-text2
                           hover:text-ge-text1 disabled:opacity-40">
                Next ▶
              </button>

              <span className="ml-auto text-[11px] font-mono text-ge-text3">
                Page {page} of {totalPages}
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  )
}