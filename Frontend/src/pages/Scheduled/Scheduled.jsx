// src/pages/Scheduled/Scheduled.jsx
import React, { useState, useMemo } from 'react'
import { PageHeader, Skeleton, Spinner } from '../../components/Common'
import { useApp } from '../../utils/AppContext'
import { statusPillClass } from '../../utils/helpers'

const FREQ_OPTIONS   = ['Daily', 'Weekly', 'Monthly']
const FORMAT_OPTIONS = ['CSV', 'Excel', 'PDF', 'CSV + Excel + PDF']
const INTERVAL_OPTS  = ['raw','1min','5min','15min','30min','hourly','daily','monthly']
const AGG_OPTS       = ['avg','min','max','sum']
const EQ_TYPES       = [
  'Inverter','String Combiner','WMS','PPC','PPC Trend',
  'Power Graph','Daily Generation','Monthly Generation',
  'Inverter Temperature','Temperature Report','Tracker','Alarms',
]

function todayStr() {
  return new Date().toISOString().slice(0, 10)
}

function nextRun(freq) {
  const d = new Date()
  if (freq === 'Daily')   d.setDate(d.getDate() + 1)
  if (freq === 'Weekly')  d.setDate(d.getDate() + 7)
  if (freq === 'Monthly') d.setMonth(d.getMonth() + 1)
  const dd = String(d.getDate()).padStart(2,'0')
  const mm = String(d.getMonth()+1).padStart(2,'0')
  return `${dd}/${mm}/${d.getFullYear()}`
}

const INITIAL_SCHEDULES = [
  {
    id:1, name:'Daily Inverter Report',    eq_type:'Inverter',        eq_id:'INVERTER_01',
    from:'2024-02-08', to:'2024-05-21', interval:'hourly',  agg:'avg',
    format:'Excel', freq:'Daily',   email:'ops@ge.com',         status:'Active',
    last_run:'22/06/2026 06:00:00', created:'08/06/2026',
  },
  {
    id:2, name:'Weekly PPC Summary',       eq_type:'PPC',             eq_id:'PPC',
    from:'2024-02-08', to:'2024-05-21', interval:'daily',   agg:'avg',
    format:'PDF',   freq:'Weekly',  email:'management@ge.com',  status:'Active',
    last_run:'18/06/2026 07:00:00', created:'01/06/2026',
  },
  {
    id:3, name:'Monthly Generation Report',eq_type:'Daily Generation', eq_id:'INVERTER_DAILY_GEN',
    from:'2024-02-08', to:'2024-05-21', interval:'monthly', agg:'sum',
    format:'CSV + Excel + PDF', freq:'Monthly', email:'ceo@ge.com', status:'Active',
    last_run:'01/06/2026 08:00:00', created:'01/01/2026',
  },
  {
    id:4, name:'Alarm Summary',            eq_type:'Alarms',           eq_id:'Alarms',
    from:'2024-02-08', to:'2024-05-21', interval:'daily',   agg:'avg',
    format:'CSV',   freq:'Daily',   email:'ops@ge.com',         status:'Paused',
    last_run:'21/06/2026 20:00:00', created:'15/06/2026',
  },
  {
    id:5, name:'WMS Weather Report',       eq_type:'WMS',              eq_id:'WMS',
    from:'2024-02-08', to:'2024-05-21', interval:'hourly',  agg:'avg',
    format:'Excel', freq:'Weekly',  email:'eng@ge.com',         status:'Active',
    last_run:'16/06/2026 06:30:00', created:'10/06/2026',
  },
]

// ── Schedule Form ──────────────────────────────────────────────────────────────
function ScheduleForm({ initial, onSave, onCancel }) {
  const [form, setForm] = useState(initial || {
    name:'', eq_type:'', eq_id:'', from:todayStr(), to:todayStr(),
    interval:'hourly', agg:'avg', format:'Excel', freq:'Daily', email:'',
  })

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = e => {
    e.preventDefault()
    if (!form.name.trim())     return alert('Report name required')
    if (!form.eq_type.trim())  return alert('Equipment type required')
    if (!form.email.trim())    return alert('Email required')
    onSave(form)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          <label className="form-label">Report Name *</label>
          <input className="form-control" value={form.name}
            onChange={e => set('name', e.target.value)}
            placeholder="e.g. Daily Inverter Report" />
        </div>
        <div className="flex flex-col gap-1">
          <label className="form-label">Schedule Frequency *</label>
          <select className="form-control" value={form.freq}
            onChange={e => set('freq', e.target.value)}>
            {FREQ_OPTIONS.map(f => <option key={f}>{f}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          <label className="form-label">Equipment Type *</label>
          <select className="form-control" value={form.eq_type}
            onChange={e => set('eq_type', e.target.value)}>
            <option value="">— Select —</option>
            {EQ_TYPES.map(t => <option key={t}>{t}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="form-label">Equipment Identifier</label>
          <input className="form-control" value={form.eq_id}
            onChange={e => set('eq_id', e.target.value)}
            placeholder="e.g. INVERTER_01" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          <label className="form-label">From Date</label>
          <input type="date" className="form-control" value={form.from}
            onChange={e => set('from', e.target.value)} />
        </div>
        <div className="flex flex-col gap-1">
          <label className="form-label">To Date</label>
          <input type="date" className="form-control" value={form.to}
            onChange={e => set('to', e.target.value)} />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="flex flex-col gap-1">
          <label className="form-label">Time Interval</label>
          <select className="form-control" value={form.interval}
            onChange={e => set('interval', e.target.value)}>
            {INTERVAL_OPTS.map(v => <option key={v}>{v}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="form-label">Aggregation</label>
          <select className="form-control" value={form.agg}
            onChange={e => set('agg', e.target.value)}>
            {AGG_OPTS.map(v => <option key={v}>{v.toUpperCase()}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="form-label">Report Format *</label>
          <select className="form-control" value={form.format}
            onChange={e => set('format', e.target.value)}>
            {FORMAT_OPTIONS.map(f => <option key={f}>{f}</option>)}
          </select>
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label className="form-label">Email Recipients * (comma-separated)</label>
        <input className="form-control" value={form.email}
          onChange={e => set('email', e.target.value)}
          placeholder="ops@ge.com, management@ge.com" />
      </div>

      <div className="flex gap-2 pt-2 justify-end">
        <button type="button" className="btn btn-outline btn-sm" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary btn-sm">
          {initial?.id ? '💾 Save Changes' : '+ Create Schedule'}
        </button>
      </div>
    </form>
  )
}

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function Scheduled() {
  const { showToast } = useApp()

  const [schedules, setSchedules] = useState(INITIAL_SCHEDULES)
  const [showForm,  setShowForm]  = useState(false)
  const [editItem,  setEditItem]  = useState(null)
  const [running,   setRunning]   = useState(new Set())
  const [filter,    setFilter]    = useState('All')
  const [search,    setSearch]    = useState('')
  const [histItem,  setHistItem]  = useState(null)

  const MOCK_HISTORY = [
    { time:'22/06/2026 06:00:00', status:'Success', size:'245 KB', duration:'12s' },
    { time:'21/06/2026 06:00:00', status:'Success', size:'241 KB', duration:'11s' },
    { time:'20/06/2026 06:00:00', status:'Failed',  size:'—',      duration:'30s' },
    { time:'19/06/2026 06:00:00', status:'Success', size:'238 KB', duration:'13s' },
    { time:'18/06/2026 06:00:00', status:'Success', size:'250 KB', duration:'12s' },
  ]

  const rows = useMemo(() =>
    schedules.filter(s => {
      const matchF = filter === 'All' || s.status === filter || s.freq === filter
      const matchS = !search || [s.name, s.eq_type, s.eq_id, s.email].some(
        v => v && v.toLowerCase().includes(search.toLowerCase())
      )
      return matchF && matchS
    }),
    [schedules, filter, search]
  )

  const handleSave = form => {
    if (form.id) {
      setSchedules(prev => prev.map(s => s.id === form.id ? { ...s, ...form } : s))
      showToast('Schedule updated')
    } else {
      const newItem = {
        ...form,
        id:       Date.now(),
        status:   'Active',
        last_run: '—',
        created:  new Date().toLocaleDateString('en-GB'),
      }
      setSchedules(prev => [...prev, newItem])
      showToast('Schedule created')
    }
    setShowForm(false)
    setEditItem(null)
  }

  const handleDelete = id => {
    setSchedules(prev => prev.filter(s => s.id !== id))
    showToast('Schedule deleted')
  }

  const handleToggle = id => {
    setSchedules(prev => prev.map(s =>
      s.id === id
        ? { ...s, status: s.status === 'Active' ? 'Paused' : 'Active' }
        : s
    ))
  }

  const handleRun = async id => {
    setRunning(prev => new Set([...prev, id]))
    await new Promise(r => setTimeout(r, 2000))
    const now = new Date()
    const ts  = `${String(now.getDate()).padStart(2,'0')}/${String(now.getMonth()+1).padStart(2,'0')}/${now.getFullYear()} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}:${String(now.getSeconds()).padStart(2,'0')}`
    setSchedules(prev => prev.map(s =>
      s.id === id ? { ...s, last_run: ts } : s
    ))
    setRunning(prev => { const s = new Set(prev); s.delete(id); return s })
    showToast('Report generated successfully')
  }

  const counts = {
    total:  schedules.length,
    active: schedules.filter(s => s.status === 'Active').length,
    paused: schedules.filter(s => s.status === 'Paused').length,
  }

  return (
    <div>
      <PageHeader
        title="Scheduled Reports"
        subtitle="Automate report generation and email delivery"
      >
        <button className="btn btn-success btn-sm"
          onClick={() => { setEditItem(null); setShowForm(true) }}>
          + Create Schedule
        </button>
      </PageHeader>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="card text-center py-3">
          <div className="text-2xl font-mono text-ge-blue">{counts.total}</div>
          <div className="text-[11px] text-ge-text3 mt-1">Total Schedules</div>
        </div>
        <div className="card text-center py-3">
          <div className="text-2xl font-mono text-ge-accent">{counts.active}</div>
          <div className="text-[11px] text-ge-text3 mt-1">Active</div>
        </div>
        <div className="card text-center py-3">
          <div className="text-2xl font-mono text-ge-warn">{counts.paused}</div>
          <div className="text-[11px] text-ge-text3 mt-1">Paused</div>
        </div>
      </div>

      {/* Create / Edit Form */}
      {showForm && (
        <div className="card mb-4 border-ge-blue/30">
          <div className="card-title">
            {editItem ? `Edit Schedule — ${editItem.name}` : 'Create New Schedule'}
          </div>
          <ScheduleForm
            initial={editItem}
            onSave={handleSave}
            onCancel={() => { setShowForm(false); setEditItem(null) }}
          />
        </div>
      )}

      {/* Filters */}
      <div className="card mb-3">
        <div className="flex flex-wrap gap-2 items-center">
          {['All','Active','Paused','Daily','Weekly','Monthly'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`btn btn-sm ${filter === f ? 'btn-primary' : 'btn-outline'}`}>
              {f}
            </button>
          ))}
          <div className="ml-auto relative w-48">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-ge-text3 text-sm">
              🔍
            </span>
            <input type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search..." className="form-control pl-7 text-[12px]" />
          </div>
        </div>
      </div>

      {/* Schedule Table */}
      <div className="card mb-4">
        <div className="card-title">Report Schedules</div>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Report Name</th>
                <th>Equipment</th>
                <th>Format</th>
                <th>Frequency</th>
                <th>Next Run</th>
                <th>Last Run</th>
                <th>Recipients</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center text-ge-text3 py-10 text-[12px]">
                    No schedules found — click "Create Schedule" to add one
                  </td>
                </tr>
              ) : rows.map(s => (
                <tr key={s.id}>
                  <td>
                    <div className="font-medium text-ge-text1 text-[12px]">{s.name}</div>
                    <div className="text-[10px] text-ge-text3 mt-0.5">
                      {s.interval} · {s.agg?.toUpperCase()}
                    </div>
                  </td>
                  <td>
                    <div className="text-[12px] text-ge-text1">{s.eq_type}</div>
                    <div className="text-[10px] font-mono text-ge-text3">{s.eq_id}</div>
                  </td>
                  <td>
                    <span className="status-pill pill-blue text-[10px]">{s.format}</span>
                  </td>
                  <td className="font-mono text-[11px]">{s.freq}</td>
                  <td className="font-mono text-[11px] text-ge-accent">{nextRun(s.freq)}</td>
                  <td className="font-mono text-[11px] text-ge-text3">{s.last_run || '—'}</td>
                  <td className="text-[11px] text-ge-blue max-w-[140px] truncate">{s.email}</td>
                  <td>
                    <span className={statusPillClass(s.status)}>{s.status}</span>
                  </td>
                  <td>
                    <div className="flex items-center gap-1.5">
                      {/* Run now */}
                      <button
                        className="btn btn-outline btn-sm"
                        onClick={() => handleRun(s.id)}
                        disabled={running.has(s.id) || s.status === 'Paused'}
                        title="Run now"
                      >
                        {running.has(s.id)
                          ? <Spinner size={10} />
                          : '▶'
                        }
                      </button>

                      {/* Toggle */}
                      <button
                        className={`btn btn-sm ${s.status === 'Active' ? 'btn-outline' : 'btn-success'}`}
                        onClick={() => handleToggle(s.id)}
                        title={s.status === 'Active' ? 'Pause' : 'Enable'}
                      >
                        {s.status === 'Active' ? '⏸' : '▶'}
                      </button>

                      {/* Edit */}
                      <button
                        className="btn btn-outline btn-sm"
                        onClick={() => { setEditItem(s); setShowForm(true) }}
                        title="Edit"
                      >
                        ✎
                      </button>

                      {/* History */}
                      <button
                        className="btn btn-outline btn-sm"
                        onClick={() => setHistItem(histItem?.id === s.id ? null : s)}
                        title="History"
                      >
                        📋
                      </button>

                      {/* Delete */}
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => handleDelete(s.id)}
                        title="Delete"
                      >
                        ✕
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Execution History Panel */}
      {histItem && (
        <div className="card border-ge-blue/30">
          <div className="card-title justify-between">
            <span>📋 Execution History — {histItem.name}</span>
            <button className="btn btn-outline btn-sm" onClick={() => setHistItem(null)}>✕ Close</button>
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>Execution Time</th>
                <th>Status</th>
                <th>File Size</th>
                <th>Duration</th>
              </tr>
            </thead>
            <tbody>
              {MOCK_HISTORY.map((h, i) => (
                <tr key={i}>
                  <td className="font-mono text-[11px]">{h.time}</td>
                  <td>
                    <span className={`status-pill ${h.status === 'Success' ? 'pill-green' : 'pill-red'}`}>
                      {h.status}
                    </span>
                  </td>
                  <td className="font-mono text-[11px]">{h.size}</td>
                  <td className="font-mono text-[11px]">{h.duration}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}