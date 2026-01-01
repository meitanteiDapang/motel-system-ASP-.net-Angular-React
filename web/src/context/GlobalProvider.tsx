import { useEffect, useReducer, type ReactNode } from 'react'
import { GlobalContext, globalReducer, initialState } from './globalContext'

export const GlobalProvider = ({ children }: { children: ReactNode }) => {
  const [state, globalDispatch] = useReducer(
    globalReducer,
    initialState,
    (state) => {
      if (typeof window === 'undefined') return state
      const storedToken = window.localStorage.getItem('adminToken')
      return storedToken ? { ...state, adminToken: storedToken } : state
    },
  )

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (state.adminToken) {
      window.localStorage.setItem('adminToken', state.adminToken)
    } else {
      window.localStorage.removeItem('adminToken')
    }
  }, [state.adminToken])

  return (
    <GlobalContext.Provider value={{ state, globalDispatch }}>
      {children}
    </GlobalContext.Provider>
  )
}
