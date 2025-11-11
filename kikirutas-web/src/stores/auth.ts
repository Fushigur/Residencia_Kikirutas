// src/stores/auth.ts
import { defineStore } from 'pinia'

type ExplicitRole = 'user' | 'admin' | 'operator'
type Role = ExplicitRole | null

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
    // Ahora acepta 'user' | 'admin' | 'operator'
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

        // Migración segura del rol almacenado
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
