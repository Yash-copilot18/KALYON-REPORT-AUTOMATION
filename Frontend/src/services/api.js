// src/services/api.js
import axios from 'axios'
import * as mock from './mockData'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api',
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use(cfg => {
  const token = localStorage.getItem('ge_token')
  if (token) cfg.headers.Authorization = `Bearer ${token}`
  return cfg
})

api.interceptors.response.use(
  res => res.data,
  err => Promise.reject(err)
)

const delay = ms => new Promise(r => setTimeout(r, ms))

// ── Plant ──────────────────────────────────────────────────────────────────
export const fetchPlantInfo  = async () => { await delay(300); return mock.PLANT_INFO }
export const fetchKPIs       = async () => { await delay(400); return mock.KPI_DATA   }
export const fetchAlarms     = async () => { await delay(350); return mock.ALARMS     }

// ── Equipment ──────────────────────────────────────────────────────────────
export const fetchEquipment  = async () => { await delay(500); return mock.EQUIPMENT_STATUS }
export const fetchEquipmentTypes = async () => { await delay(200); return mock.EQUIPMENT_TYPES }

// ── Tags ───────────────────────────────────────────────────────────────────
export const fetchTags = async () => { await delay(200); return mock.ALL_TAGS }

// ── Reports ────────────────────────────────────────────────────────────────
export const fetchReportData = async (params) => {
  await delay(800)
  return { data: mock.TABLE_DATA, total: 2847, params }
}

export const fetchScheduledReports = async () => { await delay(300); return mock.SCHEDULED_REPORTS }
export const saveScheduledReport   = async (data) => { await delay(600); return { ...data, id: Date.now() } }
export const deleteScheduledReport = async (id)   => { await delay(400); return { id } }
export const runReport             = async (id)   => { await delay(1000); return { id, status: 'running' } }

// ── Analytics / Chart data ─────────────────────────────────────────────────
export const fetchPowerTrend  = async () => { await delay(400); return { labels: mock.CHART_HOURS, data: mock.POWER_TREND } }
export const fetchDailyEnergy = async () => { await delay(400); return { labels: mock.DAILY_LABELS, data: mock.DAILY_ENERGY } }
export const fetchMonthlyEnergy = async () => { await delay(400); return { labels: mock.MONTHLY_LABELS, data: mock.MONTHLY_ENERGY } }

// ── DGR ───────────────────────────────────────────────────────────────────
export const fetchDGRData = async () => { await delay(500); return mock.DGR_DATA }

// ── Users ─────────────────────────────────────────────────────────────────
export const fetchUsers = async () => { await delay(400); return mock.USERS }

export default api
