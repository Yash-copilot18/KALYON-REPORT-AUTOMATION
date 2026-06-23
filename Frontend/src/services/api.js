// src/services/api.js
import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use(cfg => {
  const token = localStorage.getItem('ge_token')
  if (token) cfg.headers.Authorization = `Bearer ${token}`
  return cfg
})

api.interceptors.response.use(
  res => res.data,
  err => {
    const msg = err?.response?.data?.detail || err.message || 'API error'
    console.error(`[API Error] ${err?.config?.url} →`, msg)
    return Promise.reject(new Error(msg))
  }
)

export function safeArray(data, keys = ['items','data','rows','alarms','inverters']) {
  if (!data) return []
  if (Array.isArray(data)) return data
  for (const key of keys) {
    if (Array.isArray(data[key])) return data[key]
  }
  return []
}

// ── Health ─────────────────────────────────────────────────────────────────
export const fetchHealth  = () => api.get('/health')
export const fetchDBTest  = () => api.get('/db-test')

// ── Dashboard ──────────────────────────────────────────────────────────────
export const fetchKPIs              = () => api.get('/api/v1/dashboard/kpis')
export const fetchPowerTrend        = (date)     => api.get('/api/v1/dashboard/power-trend',     { params: date ? { date } : {} })
export const fetchDailyEnergy       = (days = 7) => api.get('/api/v1/dashboard/daily-energy',    { params: { days } })
export const fetchMonthlyEnergy     = (months=12)=> api.get('/api/v1/dashboard/monthly-energy',  { params: { months } })
export const fetchIrradiancePower   = (date)     => api.get('/api/v1/dashboard/irradiance-power',{ params: date ? { date } : {} })
export const fetchDashboardAlarms   = (limit=6)  => api.get('/api/v1/dashboard/alarms',          { params: { limit } })
export const fetchEquipmentSummary  = ()         => api.get('/api/v1/dashboard/equipment-summary')

// ── Equipment ──────────────────────────────────────────────────────────────
export const fetchEquipment         = ()         => api.get('/api/v1/equipment-live/')
export const fetchEquipmentById     = (id)       => api.get(`/api/v1/equipment-live/inverter/${id}`)
export const fetchEquipmentTypes    = ()         => api.get('/api/v1/equipment/', { params: { page:1, page_size:100 } })
export const createEquipment        = (data)     => api.post('/api/v1/equipment/', data)
export const updateEquipment        = (id, data) => api.put(`/api/v1/equipment/${id}`, data)
export const deleteEquipment        = (id)       => api.delete(`/api/v1/equipment/${id}`)

// ── Analytics ──────────────────────────────────────────────────────────────
export const fetchAnalyticsPerformance = (days=7) => api.get('/api/v1/analytics/performance',          { params: { days } })
export const fetchInverterComparison   = (date)   => api.get('/api/v1/analytics/inverter-comparison',  { params: date ? { date } : {} })
export const fetchPRIrradiance         = (date)   => api.get('/api/v1/analytics/pr-irradiance',        { params: date ? { date } : {} })
export const fetchWeeklyEnergy         = (weeks=1)=> api.get('/api/v1/analytics/weekly-energy',        { params: { weeks } })
export const fetchTemperature          = (date)   => api.get('/api/v1/analytics/temperature',          { params: date ? { date } : {} })
export const fetchWMSTrend             = (date)   => api.get('/api/v1/analytics/wms-trend',            { params: date ? { date } : {} })

// ── Reports v2 — Real SQL Server ───────────────────────────────────────────
export const fetchReportEquipmentTypes = () =>
  api.get('/api/v1/reports-v2/equipment-types')

export const fetchReportEquipmentList = (type) =>
  api.get('/api/v1/reports-v2/equipment-list', { params: { type } })

export const fetchReportTags = (equipmentType, equipmentId) =>
  api.get('/api/v1/reports-v2/tags', {
    params: { equipment_type: equipmentType, equipment_id: equipmentId }
  })

export const fetchReportDataV2 = (payload) =>
  api.post('/api/v1/reports-v2/data', payload)

export const exportReportCSVV2 = (payload) =>
  api.post('/api/v1/reports-v2/export/csv', payload, { responseType: 'blob' })

export const exportReportExcelV2 = (payload) =>
  api.post('/api/v1/reports-v2/export/excel', payload, { responseType: 'blob' })

export const exportReportPDFV2 = (payload) =>
  api.post('/api/v1/reports-v2/export/pdf', payload, { responseType: 'blob' })

export const fetchReportSummary = (payload) =>
  api.post('/api/v1/reports-v2/summary', payload)

// ── Reports (legacy aliases) ───────────────────────────────────────────────
export const fetchAvailableTags = () =>
  api.get('/api/v1/reports-v2/tags?equipment_type=Inverter&equipment_id=INVERTER_01')

export const fetchReportData = (payload) =>
  api.post('/api/v1/reports-v2/data', payload || {
    equipment_type: 'PPC',
    equipment_id:   'PPC',
    tags:           ['GRID_ACTIVE_POWER_MEASURED', 'INVERTER_TOTAL_ACTIVE_POWER'],
    from_datetime:  '2024-02-08T00:00:00',
    to_datetime:    '2024-02-08T23:59:59',
    interval:       'hourly',
    agg_function:   'avg',
    page:           1,
    page_size:      50,
  })

export const exportReportCSV   = (payload) => exportReportCSVV2(payload)
export const exportReportExcel = (payload) => exportReportExcelV2(payload)
export const exportReportPDF   = (payload) => exportReportPDFV2(payload)
export const generateReport    = (payload) => fetchReportDataV2(payload)

export const fetchInverterSummary = (inverterNo, fromDt, toDt) =>
  api.get(`/api/v1/reports/inverter/${inverterNo}/summary`, {
    params: { from_dt: fromDt, to_dt: toDt }
  })

// ── WMS / PPC ──────────────────────────────────────────────────────────────
export const fetchWMSLatest = () => api.get('/api/v1/reports/wms/latest')
export const fetchPPCLatest = () => api.get('/api/v1/reports/ppc/latest')

// ── DGR ───────────────────────────────────────────────────────────────────
export const fetchDGRData = () =>
  api.post('/api/v1/reports-v2/data', {
    equipment_type: 'Daily Generation',
    equipment_id:   'INVERTER_DAILY_GEN',
    tags: [
      'INVERTER_01_GEN','INVERTER_02_GEN','INVERTER_03_GEN',
      'INVERTER_04_GEN','INVERTER_05_GEN','INVERTER_06_GEN',
    ],
    from_datetime: '2024-02-08T00:00:00',
    to_datetime:   '2024-05-21T23:59:59',
    interval:      'daily',
    agg_function:  'sum',
    page:          1,
    page_size:     30,
  })

export const fetchDailyGeneration = (fromDt, toDt) =>
  api.post('/api/v1/reports-v2/data', {
    equipment_type: 'Daily Generation',
    equipment_id:   'INVERTER_DAILY_GEN',
    tags: [
      'INVERTER_01_GEN','INVERTER_02_GEN','INVERTER_03_GEN',
      'INVERTER_04_GEN','INVERTER_05_GEN','INVERTER_06_GEN',
    ],
    from_datetime: fromDt || '2024-02-08T00:00:00',
    to_datetime:   toDt   || '2024-05-21T23:59:59',
    interval:      'daily',
    agg_function:  'sum',
    page:          1,
    page_size:     100,
  })

export const fetchMonthlyGeneration = (fromDt, toDt) =>
  api.post('/api/v1/reports-v2/data', {
    equipment_type: 'Monthly Generation',
    equipment_id:   'INVERTER_MONTHLY_GEN',
    tags: [
      'INVERTER_01_GEN','INVERTER_02_GEN','INVERTER_03_GEN',
      'INVERTER_04_GEN','INVERTER_05_GEN','INVERTER_06_GEN',
    ],
    from_datetime: fromDt || '2024-02-08T00:00:00',
    to_datetime:   toDt   || '2024-05-21T23:59:59',
    interval:      'monthly',
    agg_function:  'sum',
    page:          1,
    page_size:     12,
  })

// ── Alarms ─────────────────────────────────────────────────────────────────
export const fetchAlarms = () =>
  api.get('/api/v1/dashboard/alarms', { params: { limit: 50 } })
    .then(res => res?.alarms || [])

// ── Scheduled Reports ──────────────────────────────────────────────────────
export const fetchScheduledReports = () =>
  Promise.resolve([
    { id:1, name:'Daily Generation Report',   freq:'Daily 06:00', next:'2024-02-09', status:'Active', email:'ops@ge.com'        },
    { id:2, name:'Weekly Performance Report', freq:'Mon 07:00',   next:'2024-02-12', status:'Active', email:'management@ge.com' },
    { id:3, name:'Monthly KPI Report',        freq:'1st 08:00',   next:'2024-03-01', status:'Active', email:'ceo@ge.com'        },
    { id:4, name:'Alarm Summary Report',      freq:'Daily 20:00', next:'2024-02-08', status:'Paused', email:'ops@ge.com'        },
    { id:5, name:'Equipment Health Report',   freq:'Weekly Mon',  next:'2024-02-12', status:'Active', email:'eng@ge.com'        },
  ])

export const saveScheduledReport   = (data) => Promise.resolve({ ...data, id: data.id || Date.now() })
export const deleteScheduledReport = (id)   => Promise.resolve({ id })
export const runReport             = (id)   => Promise.resolve({ id, status: 'running' })

// ── Users ──────────────────────────────────────────────────────────────────
export const fetchUsers = () =>
  Promise.resolve([
    { id:1, name:'Ahmad Khalid',     email:'a.khalid@ge.com',      role:'Admin',    dept:'Operations', last:'2 min ago', active:true  },
    { id:2, name:'Sara Al-Rashid',   email:'s.rashid@ge.com',      role:'Engineer', dept:'Maintenance',last:'1 hr ago',  active:true  },
    { id:3, name:'Mohammed Hassan',  email:'m.hassan@ge.com',      role:'Analyst',  dept:'Analytics',  last:'3 hrs ago', active:false },
    { id:4, name:'Emma Clarke',      email:'e.clarke@ge.com',      role:'Manager',  dept:'Management', last:'1 day ago', active:false },
    { id:5, name:'Ravi Subramaniam', email:'r.subramaniam@ge.com', role:'Engineer', dept:'Monitoring', last:'5 hrs ago', active:true  },
  ])

export const createUser = (data)      => Promise.resolve({ ...data, id: Date.now() })
export const updateUser = (id, data)  => Promise.resolve({ id, ...data })
export const deleteUser = (id)        => Promise.resolve({ id })

export const fetchDBHealth  = () => api.get('/db-test')
export const fetchPlantInfo = () => api.get('/health')

export default api