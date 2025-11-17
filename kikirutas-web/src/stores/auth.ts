// src/stores/auth.ts
import { defineStore } from 'pinia'
import api, {
  setApiToken,
  clearAuthStorage,
  getStoredToken,
  getErrorMessage,
  USER_STORAGE_KEY,
  ROLE_STORAGE_KEY,
} from '@/api'

export type ExplicitRole = 'admin' | 'operator' | 'user'

export const ROLE_OPTIONS = [
  { label: 'Usuaria',  value: 'user' as ExplicitRole },
  { label: 'Operador', value: 'operator' as ExplicitRole },
  { label: 'Admin',    value: 'admin' as ExplicitRole },
]

// Etiquetas bonitas para mensajes
const ROLE_DISPLAY: Record<ExplicitRole, string> = {
  admin: 'Admin',
  operator: 'Operador',
  user: 'Usuaria',
}

type UserPayload = {
  id: number
  name: string
  email: string
  role: ExplicitRole
  roleText?: string

  // Datos extra que nos manda Laravel (para pedidos, perfil, etc.)
  nombre?: string
  apellido_paterno?: string
  apellido_materno?: string
  comunidad?: string
  municipio?: string
  estado?: string
  telefono?: string
  sexo?: string
  edad?: number | null
}

type State = {
  token: string | null
  user: UserPayload | null
  meLoaded: boolean
  error?: string | null
}

/* ─────────────── Helpers de rol ─────────────── */

function normalizeRole(input: any): ExplicitRole | null {
  if (input === null || input === undefined) return null

  // por id numérico
  const asNum = typeof input === 'number' ? input : Number(String(input))
  if (!Number.isNaN(asNum)) {
    if (asNum === 1) return 'admin'
    if (asNum === 2) return 'operator'
    if (asNum === 3) return 'user'
  }

  // por texto (es/en)
  const s = String(input).trim().toLowerCase()
  if (!s) return null
  if (['admin', 'administrator', 'adm'].includes(s)) return 'admin'
  if (['operator', 'operador', 'operaria', 'operario', 'chofer'].includes(s)) return 'operator'
  if (['user', 'usuario', 'usuaria', 'beneficiario', 'beneficiaria'].includes(s)) return 'user'

  return null
}

function pickRoleFromPayload(payload: any): ExplicitRole | null {
  if (!payload) return null
  const candidates = [
    payload.role,
    payload.rol,
    payload.roleName,
    payload.nombreRol,
    payload.role_id,
    payload.idRol,

    payload.user?.role,
    payload.user?.rol,
    payload.user?.roleName,
    payload.user?.nombreRol,
    payload.user?.role_id,
    payload.user?.idRol,

    payload.role?.id,
    payload.role?.nombre,
    payload.role?.name,
    payload.user?.role?.id,
    payload.user?.role?.nombre,
    payload.user?.role?.name,
  ]
  for (const c of candidates) {
    const n = normalizeRole(c)
    if (n) return n
  }
  return null
}

function buildUserFromMe(data: any): UserPayload | null {
  if (!data) return null
  const src = data.user ?? data

  const role = pickRoleFromPayload(data) ?? pickRoleFromPayload(src)
  if (!role) return null

  const user: UserPayload = {
    id: Number(src?.id ?? 0),
    name: String(src?.name ?? src?.nombre ?? 'Usuario'),
    email: String(src?.email ?? src?.correo ?? ''),
    role,
    roleText: ROLE_DISPLAY[role],

    // Extras que queremos conservar
    nombre: src?.nombre,
    apellido_paterno: src?.apellido_paterno,
    apellido_materno: src?.apellido_materno,
    comunidad: src?.comunidad,
    municipio: src?.municipio,
    estado: src?.estado,
    telefono: src?.telefono,
    sexo: src?.sexo,
    edad:
      typeof src?.edad !== 'undefined' && src?.edad !== null
        ? Number(src.edad)
        : null,
  }

  return user
}


/* ─────────────── Store ─────────────── */

export const useAuthStore = defineStore('auth', {
  state: (): State => ({
    token: getStoredToken(),
    user: JSON.parse(localStorage.getItem(USER_STORAGE_KEY) || 'null'),
    meLoaded: false,
    error: null,
  }),

  getters: {
    isAuth: (s) => !!s.token,
    role:   (s) => s.user?.role ?? null,
  },

  actions: {
    persist() {
      // Token lo gestiona setApiToken; aquí guardamos user/role
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(this.user))
      if (this.user?.role) {
        localStorage.setItem(ROLE_STORAGE_KEY, this.user.role)
      } else {
        localStorage.removeItem(ROLE_STORAGE_KEY)
      }
    },

    /** Limpia sesión y Authorization header */
    clearSession() {
      this.token = null
      this.user  = null
      this.meLoaded = false
      this.error = null
      setApiToken(null)   // quita Authorization de Axios y borra token
      clearAuthStorage()  // borra claves estándar del storage (token/user/role)
    },

    loadFromStorage() {
      const token = getStoredToken()
      if (token) {
        this.token = token
        setApiToken(token) // asegura header al recargar
      }
      this.user = JSON.parse(localStorage.getItem(USER_STORAGE_KEY) || 'null')
    },

    /**
     * Login: guarda token con setApiToken y normaliza rol con /auth/me.
     * Puedes llamar:
     *   login(email, password)  o  login({ email, password, expected })
     */
    async login(
      emailOrPayload:
        | string
        | { email: string; password: string; expected?: ExplicitRole },
      password?: string,
      expected?: ExplicitRole
    ): Promise<ExplicitRole> {
      this.error = null

      const email =
        typeof emailOrPayload === 'string'
          ? emailOrPayload
          : emailOrPayload.email
      const pass =
        typeof emailOrPayload === 'string'
          ? (password || '')
          : emailOrPayload.password
      const exp =
        typeof emailOrPayload === 'string'
          ? expected
          : emailOrPayload.expected

      try {
        const { data } = await api.post('/auth/login', {
          email,
          password: pass,
          expected: exp,
        })

        const token = data?.token || data?.access_token
        if (!token) throw new Error('No se recibió token del servidor')

        this.token = token
        setApiToken(token)   // inyecta en Axios y guarda en storage

        // Construimos user consistente vía /auth/me
        const role = await this.fetchMe()

        if (exp && role !== exp) {
          this.clearSession()
          const realTxt = ROLE_DISPLAY[role]
          throw new Error(`Tu cuenta es "${realTxt}". Debes usar el botón "${realTxt}".`)
        }
        return role
      } catch (err: any) {
        this.error = getErrorMessage(err)
        throw new Error(this.error)
      }
    },

    /** Register: si llega token, setApiToken y luego /auth/me */
    async register(payload: {
    name: string
    email: string
    password: string
    password_confirmation?: string
    role: ExplicitRole // 'user' | 'operator'

    telefono?: string
    sexo?: string
    edad?: number | null
    comunidad?: string
    municipio?: string
  }): Promise<ExplicitRole> {

      this.error = null
      try {
        const { data } = await api.post('/auth/register', payload)
        const token = data?.token || data?.access_token

        if (token) {
          this.token = token
          setApiToken(token)
          const role = await this.fetchMe()
          return role
        }

        // Fallback si backend devolviera user directamente
        const maybe = buildUserFromMe(data)
        if (maybe) {
          this.user = maybe
          this.meLoaded = true
          this.persist()
          return maybe.role
        }

        throw new Error('Registro completado, pero no se recibió token.')
      } catch (err: any) {
        this.error = getErrorMessage(err)
        throw new Error(this.error)
      }
    },

    async fetchMe(): Promise<ExplicitRole> {
      const { data } = await api.get('/auth/me')
      const user = buildUserFromMe(data)
      if (!user) throw new Error('No fue posible determinar el rol del usuario')

      this.user = user
      this.meLoaded = true
      this.persist()
      return user.role
    },

    async logout() {
      try { await api.post('/auth/logout') } catch {}
      this.clearSession()
    },
  },
})
