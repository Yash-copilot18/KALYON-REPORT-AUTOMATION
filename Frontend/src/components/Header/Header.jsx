// src/components/Header/Header.jsx
import React, { useState } from 'react'
import { MdRefresh, MdNotifications, MdPerson, MdLightMode, MdDarkMode } from 'react-icons/md'
import { useApp } from '../../utils/AppContext'

export default function Header() {
  const { showToast } = useApp()
  const [darkMode, setDarkMode] = useState(true)

  const toggleTheme = () => {
    setDarkMode(d => !d)
    document.documentElement.classList.toggle('dark')
    showToast(darkMode ? 'Light mode enabled' : 'Dark mode enabled')
  }

  return (
    <header className="h-[52px] bg-ge-dark border-b border-ge-border flex items-center px-4 gap-3 flex-shrink-0">
      {/* Title */}
      <div className="flex-1 min-w-0">
        <h1 className="text-[13px] font-semibold text-ge-text1 leading-tight">
          GE SOLAR MONITORING &amp; REPORT AUTOMATION
        </h1>
      </div>

      {/* Live indicator */}
      <div className="live-chip hidden sm:inline-flex">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse-slow" />
        LIVE
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => showToast('Data refreshed')}
          className="w-8 h-8 bg-ge-surface border border-ge-border rounded-md flex items-center
                     justify-content-center text-ge-text2 hover:bg-ge-elevated hover:text-ge-text1
                     transition-all flex items-center justify-center"
          title="Refresh"
        >
          <MdRefresh className="text-base" />
        </button>

        <button
          onClick={toggleTheme}
          className="w-8 h-8 bg-ge-surface border border-ge-border rounded-md flex items-center
                     justify-center text-ge-text2 hover:bg-ge-elevated hover:text-ge-text1 transition-all"
          title="Toggle theme"
        >
          {darkMode ? <MdLightMode className="text-base" /> : <MdDarkMode className="text-base" />}
        </button>

        <button
          onClick={() => showToast('3 active notifications')}
          className="relative w-8 h-8 bg-ge-surface border border-ge-border rounded-md flex items-center
                     justify-center text-ge-text2 hover:bg-ge-elevated hover:text-ge-text1 transition-all"
          title="Notifications"
        >
          <MdNotifications className="text-base" />
          <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-ge-danger rounded-full
                           text-[8px] text-white flex items-center justify-center font-mono">3</span>
        </button>

        <div className="flex items-center gap-2 bg-ge-surface border border-ge-border rounded-md px-2.5 py-1 cursor-pointer
                        hover:bg-ge-elevated transition-all">
          <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-semibold text-white"
            style={{ background: 'linear-gradient(135deg,#0099ff,#7c3aed)' }}>
            AK
          </div>
          <span className="text-[12px] text-ge-text2 hidden sm:block">Ahmad K.</span>
          <span className="w-1.5 h-1.5 rounded-full bg-ge-success animate-pulse-slow" />
        </div>
      </div>
    </header>
  )
}
