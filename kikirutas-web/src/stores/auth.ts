// src/stores/auth.ts
import { defineStore } from 'pinia'

export type ExplicitRole = 'user' | 'admin' | 'operator'
export type Role = ExplicitRole | null

// Opciones para el <select> del registro (puedes ocultar 'admin' en prod si quieres)
export const ROLE_OPTIONS: Array<{ value: ExplicitRole; label: string }> = [
  { value: 'user',     label: 'Usuaria' },
  { value: 'operator', label: 'Operador' },
  { value: 'admin',    label: 'Administrador' },
]

// Normaliza cualquier string proveniente del backend
export function normalizeRole(input: unknown): ExplicitRole {
  const s = String(input ?? '').toLowerCase().trim()
  if (['admin', 'administrador', 'administrator'].includes(s)) return 'admin'
  if (['operator', 'operador', 'chofer'].includes(s))           return 'operator'
  return 'user'
}

type AuthState = {
  isAuth: boolean
  role: Role
  displayName: string | null
}

const STORAGE_KEY = 'auth_state'

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    isAuth: false,
    role: null,
    displayName: null,
  }),

  getters: {
    isAdmin:    (s) => s.isAuth && s.role === 'admin',
    isUser:     (s) => s.isAuth && s.role === 'user',
    isOperator: (s) => s.isAuth && s.role === 'operator',
  },

  actions: {
    // Para logins "manuales" (demo) o cambio rápido de rol
    loginAs(role: ExplicitRole, displayName?: string) {
      this.isAuth = true
      this.role = role
      this.displayName =
        displayName ??
        (role === 'admin'
          ? 'Administración'
          : role === 'operator'
          ? 'Operador'
          : 'Usuaria')
      this.saveToStorage()
    },

    // Registro: envía el rol elegido y deja la sesión iniciada
    async register(payload: {
      name: string
      email: string
      password: string
      role: ExplicitRole
      // ... otros campos que ya tengas (teléfono, comunidad, etc.)
    }) {
      // Si tienes API real, aquí haces el POST con payload y usas la respuesta.
      // Simulación de éxito:
      this.isAuth = true
      this.role = payload.role
      this.displayName =
        payload.name ||
        (payload.role === 'admin'
          ? 'Administración'
          : payload.role === 'operator'
          ? 'Operador'
          : 'Usuaria')
      this.saveToStorage()
      return true
    },

    // Úsalo cuando el backend devuelva la sesión (login real)
    applyBackendSession(session: {
      role: string
      displayName?: string | null
      // token, email, etc. si los necesitas
    }) {
      this.isAuth = true
      this.role = normalizeRole(session.role)
      this.displayName =
        session.displayName ??
        (this.role === 'admin'
          ? 'Administración'
          : this.role === 'operator'
          ? 'Operador'
          : 'Usuaria')
      this.saveToStorage()
    },

    logout() {
      this.$reset()
      localStorage.removeItem(STORAGE_KEY)
    },

    saveToStorage() {
      const data = {
        isAuth: this.isAuth,
        role: this.role,
        displayName: this.displayName,
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    },

    loadFromStorage() {
      try {
        const raw = localStorage.getItem(STORAGE_KEY)
        if (!raw) return
        const data = JSON.parse(raw)

        this.isAuth = !!data.isAuth

        const storedRole = data.role as string | null | undefined
        this.role =
          storedRole === 'user' ||
          storedRole === 'admin' ||
          storedRole === 'operator'
            ? (storedRole as Role)
            : null

        this.displayName = data.displayName ?? null
      } catch {
        this.$reset()
      }
    },
  },
})
