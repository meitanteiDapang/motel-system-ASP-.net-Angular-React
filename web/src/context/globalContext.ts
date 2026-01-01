import { createContext, useContext, type Dispatch } from 'react'

export interface GlobalState {
  adminToken: string | null
}

export type GlobalAction =
  | { type: 'setAdminToken', token: string }
  | { type: 'clearAdminToken' }

export const initialState: GlobalState = {
  adminToken: null,
}

export const globalReducer = (state: GlobalState, action: GlobalAction): GlobalState => {
  switch (action.type) {
    case 'setAdminToken':
      return { ...state, adminToken: action.token }
    case 'clearAdminToken':
      return { ...state, adminToken: null }
    default:
      return state
  }
}

export const GlobalContext = createContext<{
  state: GlobalState
  globalDispatch: Dispatch<GlobalAction>
} | null>(null)

export const useGlobalContext = () => {
  const context = useContext(GlobalContext)
  if (!context) {
    throw new Error('useGlobalContext must be used within a GlobalProvider')
  }
  return context
}
