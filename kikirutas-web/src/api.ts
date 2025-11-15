// src/api.ts
import axios, {
  AxiosHeaders,
  type AxiosInstance,
  type InternalAxiosRequestConfig,
  AxiosError,
} from 'axios'

/* ───────────────────────── Base URL ───────────────────────── */
const RAW_BASE =
  (import.meta.env.VITE_API_BASE as string | undefined) || 'http://127.0.0.1:8000'

// Normaliza: quita slash final y asegura que termine en /api
function normalizeBase(u: string): string {
  const clean = u.replace(/\/+$/, '')
  return clean.endsWith('/api') ? clean : `${clean}/api`
}

export const BASE_URL = normalizeBase(RAW_BASE)

/* ──────────── Storage keys (sobrescribibles por .env) ──────────── */
export const TOKEN_STORAGE_KEY =
  (import.meta.env.VITE_TOKEN_STORAGE_KEY as string | undefined) || 'auth_token'
export const USER_STORAGE_KEY =
  (import.meta.env.VITE_USER_STORAGE_KEY as string | undefined) || 'auth_user'
export const ROLE_STORAGE_KEY =
  (import.meta.env.VITE_ROLE_STORAGE_KEY as string | undefined) || 'auth_role'

/* ─────────────── Helpers de token / storage ─────────────── */
export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_STORAGE_KEY)
}

export function setApiToken(token: string | null) {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`
    localStorage.setItem(TOKEN_STORAGE_KEY, token)
  } else {
    delete api.defaults.headers.common['Authorization']
    localStorage.removeItem(TOKEN_STORAGE_KEY)
  }
}

export function clearAuthStorage() {
  localStorage.removeItem(TOKEN_STORAGE_KEY)
  localStorage.removeItem(USER_STORAGE_KEY)
  localStorage.removeItem(ROLE_STORAGE_KEY)
}

/* ─────────────── Tipos / helpers de errores ─────────────── */
export type FieldErrors = Record<string, string[]>
type LaravelErrorPayload = { message?: string; error?: string; errors?: FieldErrors }

export function getErrorMessage(err: unknown): string {
  const e = err as AxiosError<LaravelErrorPayload>
  if ((e as any)?._normalizedMessage) return (e as any)._normalizedMessage

  const data = e?.response?.data
  if (data?.message) return String(data.message)
  if (data?.error) return String(data.error)
  if (e?.message?.includes('Network Error')) return 'Error de red'
  return e?.message || 'Ocurrió un error'
}

export function getFieldErrors(err: unknown): FieldErrors {
  const e = err as AxiosError<LaravelErrorPayload>
  if ((e as any)?._fieldErrors) return (e as any)._fieldErrors as FieldErrors
  const data = e?.response?.data
  if (data?.errors && typeof data.errors === 'object') return data.errors
  return {}
}

/* ───────────────────── Axios instance ───────────────────── */
const api: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
  },
  withCredentials: false,
  timeout: 25_000,
})

/* Precarga token si existe al boot */
const bootToken = getStoredToken()
if (bootToken) {
  api.defaults.headers.common['Authorization'] = `Bearer ${bootToken}`
}

/* ───── Request: adjunta Bearer si no viene ya en el request ───── */
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getStoredToken()
  if (!token) return config

  const alreadySet =
    (config.headers as any)?.Authorization ||
    (config.headers instanceof AxiosHeaders &&
      (config.headers as AxiosHeaders).get('Authorization'))

  if (!alreadySet) {
    const headers =
      config.headers instanceof AxiosHeaders
        ? config.headers
        : new AxiosHeaders(config.headers || {})
    headers.set('Authorization', `Bearer ${token}`)
    config.headers = headers
  }
  return config
})

/* ───── Response: normaliza error y maneja expiración/422 ───── */
api.interceptors.response.use(
  (r) => r,
  (error: AxiosError<LaravelErrorPayload>) => {
    const status = error?.response?.status
    const data = error.response?.data

    const normalizedMessage =
      (data && (data.message || data.error)) ||
      (error.message?.includes('Network Error') ? 'Error de red' : error.message) ||
      'Ocurrió un error'
    ;(error as any)._normalizedMessage = normalizedMessage

    if (status === 422 && data?.errors && typeof data.errors === 'object') {
      ;(error as any)._fieldErrors = data.errors as FieldErrors
    }

    if (status === 401 || status === 419) {
      clearAuthStorage()
      const loginUrl = '/login?expired=1'
      if (location.pathname !== loginUrl) location.assign(loginUrl)
    }

    return Promise.reject(error)
  }
)

export default api
