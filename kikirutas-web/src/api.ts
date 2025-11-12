// src/api.ts
import axios, {
  AxiosHeaders,
  type AxiosInstance,
  type InternalAxiosRequestConfig,
} from 'axios'

const BASE_URL = import.meta.env.VITE_API_BASE ?? 'http://127.0.0.1:8000/api'

const api: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
  withCredentials: false,
})

/* -------- Request: adjunta Bearer -------- */
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = localStorage.getItem('auth_token')
  if (!token) return config

  // Normaliza a AxiosHeaders (v1) y luego usa .set()
  const headers =
    config.headers instanceof AxiosHeaders
      ? config.headers
      : new AxiosHeaders(config.headers || {})

  headers.set('Authorization', `Bearer ${token}`)
  config.headers = headers
  return config
})

/* -------- Response: si expira, limpia y manda a login -------- */
api.interceptors.response.use(
  (r) => r,
  (error) => {
    const status = error?.response?.status
    if (status === 401 || status === 419) {
      localStorage.removeItem('auth_token')
      localStorage.removeItem('auth_role')
      localStorage.removeItem('auth_user')
      const loginUrl = '/login?expired=1'
      if (location.pathname !== loginUrl) location.assign(loginUrl)
    }
    return Promise.reject(error)
  }
)

export default api
