// src/utils/AppContext.jsx
import React, { createContext, useContext, useState, useCallback } from 'react'

const AppContext = createContext(null)

export function AppProvider({ children }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [toasts, setToasts] = useState([])
  const [modalState, setModalState] = useState({ open: false, title: '', content: null })

  const showToast = useCallback((msg, type = 'success') => {
    const id = Date.now()
    setToasts(prev => [...prev, { id, msg, type }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000)
  }, [])

  const openModal = useCallback((title, content) => {
    setModalState({ open: true, title, content })
  }, [])

  const closeModal = useCallback(() => {
    setModalState(s => ({ ...s, open: false }))
  }, [])

  return (
    <AppContext.Provider value={{
      sidebarCollapsed, setSidebarCollapsed,
      toasts, showToast,
      modalState, openModal, closeModal,
    }}>
      {children}
    </AppContext.Provider>
  )
}

export const useApp = () => useContext(AppContext)
