// src/components/Sidebar/Sidebar.jsx
import React from 'react'
import { NavLink } from 'react-router-dom'
import {
  MdDashboard, MdBarChart, MdAssignment, MdAnalytics,
  MdBuild, MdNotifications, MdSchedule, MdPeople, MdSettings,
  MdChevronLeft, MdChevronRight,
} from 'react-icons/md'
import { useApp } from '../../utils/AppContext'

const NAV_ITEMS = [
  { label: 'Dashboard',         path: '/dashboard', icon: MdDashboard,     group: 'Operations'  },
  { label: 'Reports',           path: '/reports',   icon: MdBarChart,      group: 'Operations'  },
  { label: 'DGR Reports',       path: '/dgr',       icon: MdAssignment,    group: 'Operations'  },
  { label: 'Analytics',         path: '/analytics', icon: MdAnalytics,     group: 'Operations'  },
  { label: 'Equipment',         path: '/equipment', icon: MdBuild,         group: 'Monitoring'  },
  { label: 'Alarms',            path: '/alarms',    icon: MdNotifications, group: 'Monitoring'  },
  { label: 'Scheduled Reports', path: '/scheduled', icon: MdSchedule,      group: 'Monitoring'  },
  { label: 'User Management',   path: '/users',     icon: MdPeople,        group: 'Admin'       },
  { label: 'Settings',          path: '/settings',  icon: MdSettings,      group: 'Admin'       },
]

const GROUPS = ['Operations', 'Monitoring', 'Admin']

export default function Sidebar() {
  const { sidebarCollapsed, setSidebarCollapsed } = useApp()

  return (
    <aside
      className={`flex flex-col bg-ge-dark border-r border-ge-border flex-shrink-0 z-10 transition-all duration-250 ${
        sidebarCollapsed ? 'w-14' : 'w-[220px]'
      }`}
    >
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-4 border-b border-ge-border min-h-[52px]">
        <div className="flex-shrink-0 w-7 h-7 rounded-md flex items-center justify-center text-xs font-bold text-black"
          style={{ background: 'linear-gradient(135deg,#00d4aa,#0099ff)' }}>
          GE
        </div>
        {!sidebarCollapsed && (
          <div className="overflow-hidden">
            <div className="text-[12px] font-semibold text-ge-text1 whitespace-nowrap">Solar Monitoring</div>
            <div className="text-[10px] font-mono text-ge-text3 whitespace-nowrap">v4.2.1 — VERNOVA</div>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-2">
        {GROUPS.map(group => (
          <div key={group} className="py-1">
            {!sidebarCollapsed && (
              <div className="px-4 py-1.5 text-[9px] font-semibold text-ge-text3 uppercase tracking-widest">
                {group}
              </div>
            )}
            {NAV_ITEMS.filter(i => i.group === group).map(item => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  'nav-item' + (isActive ? ' active' : '') +
                  (sidebarCollapsed ? ' justify-center px-0' : '')
                }
                title={sidebarCollapsed ? item.label : undefined}
              >
                <item.icon className="text-[17px] flex-shrink-0" />
                {!sidebarCollapsed && (
                  <span className="text-[13px] truncate">{item.label}</span>
                )}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      {/* Collapse button */}
      <div className="p-3 border-t border-ge-border">
        <button
          onClick={() => setSidebarCollapsed(s => !s)}
          className="w-full flex items-center justify-center gap-1.5 py-1.5 bg-ge-surface
                     border border-ge-border rounded-md text-ge-text2 text-xs
                     hover:bg-ge-elevated hover:text-ge-text1 transition-all"
        >
          {sidebarCollapsed
            ? <MdChevronRight className="text-base" />
            : <><MdChevronLeft className="text-base" /><span>Collapse</span></>
          }
        </button>
      </div>
    </aside>
  )
}
