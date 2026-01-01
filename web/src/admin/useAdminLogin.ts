import { requestAdminLogin } from './AdminLoginApi'

interface adminLoginResponse {
  success: boolean,
  message?: string,
  token?: string
}

const isAdminLoginResponse = (value: unknown): value is { message?: string, token?: string } => {
  return typeof value === 'object' && value !== null
}

interface UseAdminLoginResult {
  submit: () => Promise<adminLoginResponse>
}

export const useAdminLogin = (username: string, password: string): UseAdminLoginResult => {
  const submit = async (): Promise<adminLoginResponse> => {
    try {
      const res = await requestAdminLogin(username, password)
      if (!isAdminLoginResponse(res)) {
        return {success: false, message: 'Unknown error, please try again!'}
      }
      return {success: true, token: res.token}
    } catch (err) {
      if (err instanceof Error) {
        return {success: false, message: err.message}
      }
      return {success: false, message: 'Unknown error'}
    }
  }

  return {
    submit,
  }
}
