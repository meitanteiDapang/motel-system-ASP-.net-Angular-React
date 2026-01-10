import { apiUrl } from '../apiClient'

export const requestAdminLogin = async (username: string, password: string): Promise<unknown> => {
  const params = new URLSearchParams({ username, password })
  const res = await fetch(apiUrl(`/admin/session?${params.toString()}`), {
    method: 'POST',
  })

  if (res.ok) {
    return res.json()
  }

  const data = await res.json().catch(() => null)
  // Backend sometimes returns JSON with a status field; surface that message if provided.
  if (data.status == 401) {
    const message = (data as { message: string }).message
    throw new Error(message)
  }
  const message = (data as { message?: string } | null)?.message || `Admin login failed (HTTP ${res.status})`
  throw new Error(message)
}


export const requestCheckAdminToken = async (token: string): Promise<unknown> => {
  const res = await fetch(apiUrl('/admin/session'), {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  const httpStatus = res.status
  if (!res.ok) {
    throw new Error(`Admin token check failed (HTTP ${httpStatus})`)
  }
  return res.json()
}
