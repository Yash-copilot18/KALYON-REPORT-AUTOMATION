// src/pages/Reports/Reports.jsx
import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  PageHeader, AsyncButton, DataTable, Pagination,
  FormRow, FormGroup, SearchInput, Skeleton
} from '../../components/Common'
import TagSelector from '../../components/Filters/TagSelector'
import { useFetch } from '../../hooks/useFetch'
import { fetchReportData } from '../../services/api'
import { EQUIPMENT_TYPES } from '../../services/mockData'
import { statusPillClass } from '../../utils/helpers'

const TABLE_COLS = [
  { key: 'ts',     label: 'Timestamp',  className: 'font-mono text-[11px]' },
  { key: 'eq',     label: 'Equipment',  className: 'font-medium text-ge-text1' },
  { key: 'tag',    label: 'Tag Name' },
  { key: 'val',    label: 'Value',
    render: v => <span className="font-mono text-ge-accent">{v}</span> },
  { key: 'unit',   label: 'Unit',
    render: v => <span className="font-mono text-ge-text3">{v}</span> },
  { key: 'status', label: 'Status',
    render: v => <span className={statusPillClass(v)}>{v}</span> },
]

export default function Reports() {
  const navigate = useNavigate()
  const [eqType,   setEqType]   = useState('')
  const [eqId,     setEqId]     = useState('')
  const [selected, setSelected] = useState(new Set(['AC Power', 'DC Voltage', 'Energy Today']))
  const [fromDate, setFromDate] = useState('2026-08-01T13:37')
  const [toDate,   setToDate]   = useState('2026-08-01T13:37')
  const [interval, setInterval] = useState('Hourly')
  const [func,     setFunc]     = useState('Average')
  const [page,     setPage]     = useState(1)
  const [search,   setSearch]   = useState('')

  const { data: result, loading, refetch } = useFetch(fetchReportData)

  const ids = eqType ? EQUIPMENT_TYPES[eqType] || [] : []
  const rows = (result?.data || []).filter(r =>
    !search || Object.values(r).some(v => String(v).toLowerCase().includes(search.toLowerCase()))
  )

  return (
    <div>
      <PageHeader title="Report Automation" subtitle="Configure and generate reports from plant telemetry" />

      {/* Equipment Selection */}
      <div className="card mb-3">
        <div className="card-title">Equipment Selection</div>
        <FormRow>
          <FormGroup label="Equipment Type">
            <select className="form-control" value={eqType} onChange={e => { setEqType(e.target.value); setEqId('') }}>
              <option value="">— Select Type —</option>
              {Object.keys(EQUIPMENT_TYPES).map(k => <option key={k}>{k}</option>)}
            </select>
          </FormGroup>
          <FormGroup label="Equipment Identifier">
            <select className="form-control" value={eqId} onChange={e => setEqId(e.target.value)} disabled={!eqType}>
              <option value="">— Select Equipment —</option>
              {ids.map(id => <option key={id}>{id}</option>)}
            </select>
          </FormGroup>
        </FormRow>
      </div>

      {/* Tag Selection */}
      <div className="card mb-3">
        <TagSelector selected={selected} setSelected={setSelected} />
      </div>

      {/* Date & Time */}
      <div className="card mb-3">
        <div className="card-title">Date &amp; Time Configuration</div>
        <FormRow>
          <FormGroup label="From Date">
            <input type="datetime-local" className="form-control" value={fromDate}
              onChange={e => setFromDate(e.target.value)} />
          </FormGroup>
          <FormGroup label="To Date">
            <input type="datetime-local" className="form-control" value={toDate}
              onChange={e => setToDate(e.target.value)} />
          </FormGroup>
          <FormGroup label="Time Interval">
            <select className="form-control" value={interval} onChange={e => setInterval(e.target.value)}>
              {['1 Minute','5 Minutes','15 Minutes','30 Minutes','Hourly','Daily','Monthly'].map(v =>
                <option key={v}>{v}</option>)}
            </select>
          </FormGroup>
          <FormGroup label="Function">
            <select className="form-control" value={func} onChange={e => setFunc(e.target.value)}>
              {['Average','Minimum','Maximum','Sum'].map(v => <option key={v}>{v}</option>)}
            </select>
          </FormGroup>
        </FormRow>
      </div>

      {/* Actions */}
      <div className="card mb-3">
        <div className="card-title">Actions</div>
        <div className="flex flex-wrap gap-2">
          <AsyncButton className="btn btn-success btn-sm" successMsg="Selection saved!">
            💾 Save Selection
          </AsyncButton>
          <AsyncButton className="btn btn-primary btn-sm" successMsg="Data loaded successfully!"
            onClick={refetch}>
            📥 Load Data
          </AsyncButton>
          <button className="btn btn-outline btn-sm" onClick={() => navigate('/scheduled')}>
            ⏱ Scheduled Tasks
          </button>
          <AsyncButton className="btn btn-outline btn-sm"
            successMsg={`Report generated — ${selected.size} tags, ${rows.length} records`}>
            📄 Generate Report ({selected.size} tags)
          </AsyncButton>
          <AsyncButton className="btn btn-outline btn-sm" successMsg="PDF exported!">
            ⬇ Export PDF
          </AsyncButton>
          <AsyncButton className="btn btn-outline btn-sm" successMsg="Excel exported!">
            📊 Export Excel
          </AsyncButton>
        </div>
      </div>

      {/* Data Table */}
      <div className="card">
        <div className="card-title justify-between">
          <span>📋 Report Data</span>
          <SearchInput value={search} onChange={setSearch} placeholder="Search data..." className="w-48" />
        </div>
        {loading ? (
          <div className="space-y-1">{[...Array(8)].map((_, i) => <Skeleton key={i} h="h-8" />)}</div>
        ) : (
          <>
            <DataTable columns={TABLE_COLS} rows={rows} emptyMsg="No data — click Load Data" />
            <Pagination page={page} setPage={setPage} total={result?.total || 0} />
          </>
        )}
      </div>
    </div>
  )
}
