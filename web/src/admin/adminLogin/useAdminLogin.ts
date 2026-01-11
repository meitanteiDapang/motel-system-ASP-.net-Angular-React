import { requestAdminLogin, requestCheckAdminToken } from './AdminLoginApi'

interface AdminLoginResponse {
  success: boolean
  message?: string
  token?: string
}

const isAdminLoginResponse = (value: unknown): value is { message?: string; token?: string } =>
  typeof value === 'object' && value !== null

interface UseAdminLoginResult {
  checkAdminToken: (token: string) => Promise<boolean>
  submit: () => Promise<AdminLoginResponse>
}

export const useAdminLogin = (username: string, password: string): UseAdminLoginResult => {
  const submit = async (): Promise<AdminLoginResponse> => {
    try {
      const res = await requestAdminLogin(username, password)
      // The API can return either an error shape or the token; the guard keeps TS happy without over-asserting.
      if (!isAdminLoginResponse(res)) {
        return { success: false, message: 'Unknown error, please try again!' }
      }
      return { success: true, token: res.token }
    } catch (err) {
      if (err instanceof Error) {
        return { success: false, message: err.message }
      }
      return { success: false, message: 'Unknown error' }
    }
  }

  const checkAdminToken = async (token: string): Promise<boolean> => {
    try {
      if (!token) {
        return false
      }
      await requestCheckAdminToken(token)
      return true
    } catch {
      return false
    }
  }

  return {
    checkAdminToken,
    submit,
  }
}
