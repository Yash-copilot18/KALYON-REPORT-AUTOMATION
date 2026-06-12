import React, { useState } from 'react'
import { PageHeader, AsyncButton, Skeleton } from '../../components/Common'
import { useFetch } from '../../hooks/useFetch'
import { fetchScheduledReports } from '../../services/api'
import { useApp } from '../../utils/AppContext'
import { statusPillClass } from '../../utils/helpers'

function ScheduleForm({ initial = {} }) {
  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-1">
        <label className="form-label">Report Name</label>
        <input className="form-control" defaultValue={initial.name || ''}
          placeholder="e.g. Daily Generation Report" />
      </div>
      <div className="flex flex-col gap-1">
        <label className="form-label">Frequency</label>
        <select className="form-control" defaultValue={initial.freq?.split(' ')[0] || 'Daily'}>
          <option>Daily</option><option>Weekly</option><option>Monthly</option>
        </select>
      </div>
      <div className="flex flex-col gap-1">
        <label className="form-label">Run Time</label>
        <input type="time" className="form-control" defaultValue="06:00" />
      </div>
      <div className="flex flex-col gap-1">
        <label className="form-label">Email Recipients</label>
        <input className="form-control" defaultValue={initial.email || ''}
          placeholder="email@ge.com, email2@ge.com" />
      </div>
      <div className="flex flex-col gap-1">
        <label className="form-label">Report Format</label>
        <select className="form-control" defaultValue="PDF + Excel">
          <option>PDF</option><option>Excel</option><option>PDF + Excel</option>
        </select>
      </div>
      <div className="flex flex-col gap-1">
        <label className="form-label">Equipment Type</label>
        <select className="form-control">
          <option>All Equipment</option>
          <option>Inverter</option>
          <option>String Combiner Box</option>
          <option>Weather Station</option>
          <option>Transformer</option>
        </select>
      </div>
    </div>
  )
}

export default function Scheduled() {
  const { openModal, showToast } = useApp()
  const { data: rawData, loading } = useFetch(fetchScheduledReports)
  const [deleted, setDeleted] = useState(new Set())

  // Normalize — fetchScheduledReports returns array directly
  const allData = Array.isArray(rawData) ? rawData : []
  const rows = allData.filter(r => !deleted.has(r.id))

  const handleDelete = id => {
    setDeleted(prev => new Set([...prev, id]))
    showToast('Schedule deleted')
  }

  const openCreate = (item = null) => {
    openModal(
      item ? `Edit Schedule — ${item.name}` : 'Create New Schedule',
      <ScheduleForm initial={item || {}} />
    )
  }

  return (
    <div>
      <PageHeader title="Scheduled Reports" subtitle="Automate report generation and email delivery">
        <button className="btn btn-success btn-sm" onClick={() => openCreate()}>
          + Create Schedule
        </button>
      </PageHeader>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="card text-center">
          <div className="text-2xl font-mono text-ge-accent">
            {rows.filter(r => r.status === 'Active').length}
          </div>
          <div className="text-[11px] text-ge-text3 mt-1">Active Schedules</div>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-mono text-ge-warn">
            {rows.filter(r => r.status === 'Paused').length}
          </div>
          <div className="text-[11px] text-ge-text3 mt-1">Paused</div>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-mono text-ge-blue">{rows.length}</div>
          <div className="text-[11px] text-ge-text3 mt-1">Total Schedules</div>
        </div>
      </div>

      <div className="card">
        <div className="card-title">Report Schedules</div>
        {loading ? (
          <div className="space-y-1">{[...Array(5)].map((_, i) => <Skeleton key={i} h="h-10" />)}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Report Name</th><th>Frequency</th><th>Next Run</th>
                  <th>Email Recipients</th><th>Status</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center text-ge-text3 py-8">
                      No schedules — click "Create Schedule"
                    </td>
                  </tr>
                ) : rows.map(r => (
                  <tr key={r.id}>
                    <td className="font-medium text-ge-text1">{r.name}</td>
                    <td className="font-mono text-[11px]">{r.freq}</td>
                    <td className="font-mono text-[11px]">{r.next}</td>
                    <td className="text-ge-blue text-[12px]">{r.email}</td>
                    <td><span className={statusPillClass(r.status)}>{r.status}</span></td>
                    <td>
                      <div className="flex items-center gap-1.5">
                        <AsyncButton
                          className="btn btn-outline btn-sm"
                          successMsg={`Running ${r.name}...`}
                        >
                          ▶ Run
                        </AsyncButton>
                        <button className="btn btn-outline btn-sm" onClick={() => openCreate(r)}>
                          ✎ Edit
                        </button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(r.id)}>
                          ✕
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}