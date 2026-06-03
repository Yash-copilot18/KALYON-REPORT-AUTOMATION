// src/services/mockData.js
// Central mock data store for all pages

export const PLANT_INFO = {
  name: 'Ar-Rass 2 Solar Power Plant',
  location: 'Saudi Arabia',
  capacity: '2,000 MW',
  version: '4.2.1',
  timezone: 'AST (UTC+3)',
  lastSync: '2026-08-01 13:37 AST',
}

export const KPI_DATA = {
  todayEnergy:    { value: '8,247', unit: 'MWh',  change: '+4.2%', up: true,  label: "Today's Energy"  },
  currentPower:   { value: '1,847', unit: 'MW',   change: '+2.1%', up: true,  label: 'Current Power'   },
  performanceRatio:{ value: '82.4', unit: '%',    change: '-0.8%', up: false, label: 'Performance Ratio'},
  availability:   { value: '98.7', unit: '%',     change: '+0.3%', up: true,  label: 'Availability'    },
}

export const EQUIPMENT_TYPES = {
  'Inverter':            ['INV-001','INV-002','INV-003','INV-004','INV-005','INV-006'],
  'String Combiner Box': ['SCB-001','SCB-002','SCB-014','SCB-015','SCB-016'],
  'Weather Station':     ['WS-001','WS-002'],
  'Transformer':         ['TRF-001','TRF-002','TRF-003'],
  'Meter':               ['MTR-001','MTR-002'],
  'Tracker':             ['TRK-001','TRK-002','TRK-003'],
}

export const ALL_TAGS = [
  { name: 'AC Power',          unit: 'kW'    },
  { name: 'DC Voltage',        unit: 'V'     },
  { name: 'DC Current',        unit: 'A'     },
  { name: 'Energy Today',      unit: 'MWh'   },
  { name: 'Irradiance',        unit: 'W/m²'  },
  { name: 'Temperature',       unit: '°C'    },
  { name: 'Frequency',         unit: 'Hz'    },
  { name: 'Grid Voltage',      unit: 'kV'    },
  { name: 'Performance Ratio', unit: '%'     },
  { name: 'Availability',      unit: '%'     },
  { name: 'DC Power',          unit: 'kW'    },
  { name: 'Reactive Power',    unit: 'kVAR'  },
  { name: 'Active Power',      unit: 'MW'    },
  { name: 'Power Factor',      unit: ''      },
  { name: 'Module Temp',       unit: '°C'    },
]

export const TABLE_DATA = [
  { ts:'2026-08-01 13:37', eq:'INV-001', tag:'AC Power',     val:'1847.3', unit:'kW',   status:'Normal'  },
  { ts:'2026-08-01 13:37', eq:'INV-002', tag:'DC Voltage',   val:'756.2',  unit:'V',    status:'Normal'  },
  { ts:'2026-08-01 13:37', eq:'WS-001',  tag:'Irradiance',   val:'923.4',  unit:'W/m²', status:'Normal'  },
  { ts:'2026-08-01 13:37', eq:'INV-003', tag:'Temperature',  val:'42.1',   unit:'°C',   status:'Warning' },
  { ts:'2026-08-01 13:36', eq:'INV-001', tag:'DC Current',   val:'2443.0', unit:'A',    status:'Normal'  },
  { ts:'2026-08-01 13:36', eq:'MTR-001', tag:'Energy Today', val:'8247.6', unit:'MWh',  status:'Normal'  },
  { ts:'2026-08-01 13:36', eq:'TRF-001', tag:'Grid Voltage', val:'33.2',   unit:'kV',   status:'Normal'  },
  { ts:'2026-08-01 13:35', eq:'INV-004', tag:'Frequency',    val:'50.01',  unit:'Hz',   status:'Normal'  },
  { ts:'2026-08-01 13:35', eq:'INV-002', tag:'AC Power',     val:'1792.8', unit:'kW',   status:'Normal'  },
  { ts:'2026-08-01 13:35', eq:'SCB-014', tag:'DC Current',   val:'187.3',  unit:'A',    status:'Fault'   },
  { ts:'2026-08-01 13:34', eq:'INV-005', tag:'DC Voltage',   val:'748.9',  unit:'V',    status:'Normal'  },
  { ts:'2026-08-01 13:34', eq:'WS-002',  tag:'Temperature',  val:'44.2',   unit:'°C',   status:'Normal'  },
]

export const CHART_HOURS = ['00','02','04','06','08','10','12','14','16','18','20','22']
export const POWER_TREND = [0,0,0,120,580,1240,1720,1847,1650,1200,620,80]
export const DAILY_LABELS = ['Jul 26','Jul 27','Jul 28','Jul 29','Jul 30','Jul 31','Aug 1']
export const DAILY_ENERGY = [7620,8045,7990,8156,7834,8012,8247]
export const MONTHLY_LABELS = ['Jan','Feb','Mar','Apr','May','Jun','Jul']
export const MONTHLY_ENERGY = [4820,5210,6840,7920,8100,7650,8247]

export const ALARMS = [
  { id:'ALM-2847', eq:'INV-003', type:'Temperature', sev:'Warning',  msg:'Module temperature exceeded 40°C threshold',           time:'13:24:15', ack:false },
  { id:'ALM-2846', eq:'SCB-014', type:'Fault',       sev:'Critical', msg:'String current below minimum — shading or failure',    time:'12:58:02', ack:false },
  { id:'ALM-2845', eq:'WS-001',  type:'Info',        sev:'Info',     msg:'Irradiance sensor calibration drift detected',          time:'11:30:47', ack:true  },
  { id:'ALM-2844', eq:'INV-001', type:'Warning',     sev:'Warning',  msg:'AC power output variance >5% from expected',           time:'10:15:33', ack:true  },
  { id:'ALM-2843', eq:'TRF-001', type:'Info',        sev:'Info',     msg:'Scheduled maintenance window reminder',                 time:'08:00:00', ack:true  },
  { id:'ALM-2842', eq:'INV-006', type:'Warning',     sev:'Warning',  msg:'DC voltage drop detected — string inspection needed',  time:'07:42:11', ack:true  },
]

export const SCHEDULED_REPORTS = [
  { id:1, name:'Daily Generation Report',   freq:'Daily 06:00',  next:'2026-08-02', status:'Active', email:'ops@ge.com'          },
  { id:2, name:'Weekly Performance Report', freq:'Mon 07:00',    next:'2026-08-05', status:'Active', email:'management@ge.com'   },
  { id:3, name:'Monthly KPI Report',        freq:'1st 08:00',    next:'2026-09-01', status:'Active', email:'ceo@ge.com'          },
  { id:4, name:'Alarm Summary Report',      freq:'Daily 20:00',  next:'2026-08-01', status:'Paused', email:'maintenance@ge.com'  },
  { id:5, name:'Equipment Health Report',   freq:'Weekly Mon',   next:'2026-08-08', status:'Active', email:'engineers@ge.com'    },
]

export const EQUIPMENT_STATUS = [
  { id:'INV-001', type:'Inverter',         power:'312 MW',  status:'Online',  temp:'38°C', eff:'98.2%', hours:'4,821' },
  { id:'INV-002', type:'Inverter',         power:'298 MW',  status:'Online',  temp:'36°C', eff:'97.9%', hours:'4,821' },
  { id:'INV-003', type:'Inverter',         power:'287 MW',  status:'Warning', temp:'42°C', eff:'96.1%', hours:'4,820' },
  { id:'INV-004', type:'Inverter',         power:'305 MW',  status:'Online',  temp:'37°C', eff:'98.0%', hours:'4,821' },
  { id:'INV-005', type:'Inverter',         power:'318 MW',  status:'Online',  temp:'35°C', eff:'98.4%', hours:'4,821' },
  { id:'INV-006', type:'Inverter',         power:'327 MW',  status:'Online',  temp:'34°C', eff:'98.6%', hours:'4,821' },
  { id:'SCB-014', type:'String Combiner',  power:'—',       status:'Fault',   temp:'—',    eff:'—',     hours:'4,802' },
  { id:'WS-001',  type:'Weather Station',  power:'—',       status:'Online',  temp:'44°C', eff:'—',     hours:'8,760' },
  { id:'WS-002',  type:'Weather Station',  power:'—',       status:'Online',  temp:'43°C', eff:'—',     hours:'8,760' },
  { id:'TRF-001', type:'Transformer',      power:'1200 MW', status:'Online',  temp:'61°C', eff:'99.1%', hours:'8,760' },
  { id:'MTR-001', type:'Meter',            power:'—',       status:'Online',  temp:'—',    eff:'—',     hours:'8,760' },
]

export const USERS = [
  { id:1, name:'Ahmad Khalid',     email:'a.khalid@ge.com',    role:'Admin',    dept:'Operations', last:'2 min ago',  active:true  },
  { id:2, name:'Sara Al-Rashid',   email:'s.rashid@ge.com',    role:'Engineer', dept:'Maintenance',last:'1 hr ago',   active:true  },
  { id:3, name:'Mohammed Hassan',  email:'m.hassan@ge.com',    role:'Analyst',  dept:'Analytics',  last:'3 hrs ago',  active:false },
  { id:4, name:'Emma Clarke',      email:'e.clarke@ge.com',    role:'Manager',  dept:'Management', last:'1 day ago',  active:false },
  { id:5, name:'Ravi Subramaniam', email:'r.subramaniam@ge.com',role:'Engineer',dept:'Monitoring', last:'5 hrs ago',  active:true  },
]

export const DGR_DATA = [
  { date:'2026-08-01', energy:8247, peak:1847, pr:82.4, avail:98.7, alarms:1 },
  { date:'2026-07-31', energy:8012, peak:1801, pr:81.9, avail:99.1, alarms:0 },
  { date:'2026-07-30', energy:7834, peak:1768, pr:80.2, avail:97.8, alarms:2 },
  { date:'2026-07-29', energy:8156, peak:1823, pr:83.1, avail:99.3, alarms:0 },
  { date:'2026-07-28', energy:7990, peak:1789, pr:81.7, avail:98.5, alarms:1 },
  { date:'2026-07-27', energy:8045, peak:1812, pr:82.0, avail:99.0, alarms:0 },
  { date:'2026-07-26', energy:7620, peak:1756, pr:79.8, avail:97.2, alarms:3 },
]
