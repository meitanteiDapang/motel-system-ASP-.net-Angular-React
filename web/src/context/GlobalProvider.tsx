import { useReducer, type ReactNode } from 'react'
import { GlobalContext, globalReducer, initialState } from './globalContext'

export const GlobalProvider = ({ children }: { children: ReactNode }) => {
  const [state, globalDispatch] = useReducer(globalReducer, initialState)

  return (
    <GlobalContext.Provider value={{ state, globalDispatch }}>
      {children}
    </GlobalContext.Provider>
  )
}
