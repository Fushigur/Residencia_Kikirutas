// src/stores/auth.ts
import { defineStore } from 'pinia'
import api from '@/api'

/* -------------------- Tipos y constantes -------------------- */

export type Role = 'user' | 'operator' | 'admin'
export type ExplicitRole = Role

export const ROLE_OPTIONS = [
  { label: 'Usuaria',  value: 'user'      as const },
  { label: 'Operador', value: 'operator'  as const },
  { label: 'Admin',    value: 'admin'     as const },
]

export type User = {
  id: number | string
  idRol?: number | string
  rol?:   { idRol?: number | string; nombre?: string; nombreRol?: string }
  role?:  { id?: number | string; nombre?: string } | string
  nombre?: string
  name?: string
  email?: string
  correo?: string
  nombreRol?: string
}

type AuthState = {
  user: Partial<User>
  token: string
  role: Role | ''
  loading: boolean
  error: string
}

/* ------------------------ Utilidades ------------------------ */

/** Traducción rápida de mensajes típicos de validación Laravel → ES */
function tMsg(msg: string): string {
  const map: Record<string, string> = {
    'These credentials do not match our records.': 'Las credenciales no coinciden.',
    'The email has already been taken.': 'El correo ya está registrado.',
    'The phone has already been taken.': 'El teléfono ya está registrado.',
    'The phone field must be 10 digits.': 'El teléfono debe tener 10 dígitos.',
    'The email field is required.': 'El correo es obligatorio.',
    'The password field is required.': 'La contraseña es obligatoria.',
    'The email must be a valid email address.': 'El correo no tiene un formato válido.',
    'The password field must be at least 8 characters.': 'La contraseña debe tener al menos 8 caracteres.',
    'The password confirmation does not match.': 'La confirmación de contraseña no coincide.',
    'Password confirmation does not match.': 'La confirmación de contraseña no coincide.',
  }
  return map[msg] || msg
}

function tFields(fields: Record<string, string[]>): Record<string, string[]> {
  const out: Record<string, string[]> = {}
  for (const [k, arr] of Object.entries(fields || {})) {
    out[k] = (arr || []).map(tMsg)
  }
  return out
}

/** Normaliza rol a 'user' | 'operator' | 'admin' a partir de diferentes formas del back */
function normalizeRole(u?: Partial<User>): Role {
  if (!u) return 'user'

  // 1) Por ID (si tu back maneja 1=admin, 2=operator, etc.)
  const idRol = Number(
    (u as any).role_id ??
    (u as any).idRol ??
    (u.rol as any)?.idRol ??
    (u.role as any)?.id
  )

  if (idRol === 1) return 'admin'
  if (idRol === 2) return 'operator'

  // 2) Por texto/nombre
  const raw = String(
    (u.rol as any)?.nombreRol ??
    (u.rol as any)?.nombre ??
    (typeof u.role === 'string' ? u.role : (u.role as any)?.nombre) ??
    (u as any).nombreRol ??
    (u as any).role ??
    (u as any).rol ??
    ''
  ).toLowerCase()

  if (/admin|administrad/.test(raw)) return 'admin'
  if (/(operador|operadora|operator|chofer|driver|repartidor)/.test(raw)) return 'operator'
  if (/(beneficiari|usuario|usuaria|user)/.test(raw)) return 'user'

  return 'user'
}

function pickFirstError(d: any): { msg: string; fields: Record<string, string[]> } {
  const fields = (d?.errors ?? {}) as Record<string, string[]>
  const translatedFields = tFields(fields)
  const keys = Object.keys(translatedFields)
  if (keys.length) {
    const k = keys[0]
    return { msg: translatedFields[k][0], fields: translatedFields }
  }
  return { msg: tMsg(d?.message || 'Ocurrió un error. Intenta de nuevo.'), fields: {} }
}

/* -------------------------- Store --------------------------- */

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    user: {},
    token: '',
    role: '',
    loading: false,
    error: '',
  }),

  getters: {
    isAuth: (s) => Boolean(s.token || (s.user as any)?.id),
  },

  actions: {
    /* Persistencia */
    persist() {
      localStorage.setItem('auth_token', this.token ?? '')
      localStorage.setItem('auth_role', String(this.role ?? ''))
      if ((this.user as any)?.id) {
        localStorage.setItem('auth_user', JSON.stringify(this.user))
      }
    },
    loadFromStorage() {
      try {
        this.token = localStorage.getItem('auth_token') || ''
        this.role  = (localStorage.getItem('auth_role') as Role) || ''
        const uraw = localStorage.getItem('auth_user')
        this.user = uraw ? JSON.parse(uraw) : {}
      } catch { /* ignore */ }
    },
    logout() {
      this.user = {}
      this.token = ''
      this.role = ''
      this.error = ''
      localStorage.removeItem('auth_token')
      localStorage.removeItem('auth_role')
      localStorage.removeItem('auth_user')
    },

    /* ------------------------ Login ------------------------ */
    async login(p: { email: string; password: string }) {
      this.loading = true
      this.error = ''
      try {
        // Mandamos email en ambos campos por compatibilidad
        const body = { email: p.email, correo: p.email, password: p.password }
        const { data } = await api.post('/auth/login', body)

        const token: string | undefined = data?.token ?? data?.access_token
        if (token) {
          this.token = token
          localStorage.setItem('auth_token', token)
        }

        const user: User | undefined = data?.user ?? data?.data?.user ?? data?.data
        if (user) {
          this.user = user
          this.role = normalizeRole(user)
          this.persist()
        }

        return { ok: true, data }
      } catch (err: any) {
        const { msg, fields } = pickFirstError(err?.response?.data)
        this.error = String(msg || 'Credenciales inválidas')
        return { ok: false, error: this.error, fieldErrors: fields }
      } finally {
        this.loading = false
      }
    },

    /* ---------------------- Registro ----------------------- */
    async register(p: {
      nombres: string
      apellidos: string
      municipio: string
      comunidad: string
      telefono: string
      email: string
      sexo: string
      edad: number
      password: string
      confirm: string
      role: ExplicitRole
      role_id?: number            // opcional, si ya lo calculas en el view
    }) {
      this.loading = true
      this.error = ''
      try {
        const roleId = p.role_id ?? (p.role === 'operator' ? 2 : 3)

        const body = {
          name: `${p.nombres} ${p.apellidos}`.trim(),
          email: p.email,
          password: p.password,
          password_confirmation: p.confirm,
          role_id: roleId,
          // Persona/beneficiaria
          nombre: p.nombres,
          apellidos: p.apellidos,
          municipio: p.municipio,
          comunidad: p.comunidad,
          telefono: p.telefono,
          sexo: p.sexo,
          edad: p.edad,
          // Credenciales
          correo: p.email,
          // Rol
          nombreRol: p.role,
          role: p.role,
        }

        const { data } = await api.post('/auth/register', body)

        // Si tu API devuelve sesión al registrar, guardamos
        const token: string | undefined = data?.token ?? data?.access_token
        const user: User | undefined = data?.user ?? data?.data?.user ?? data?.data

        if (token) this.token = token
        if (user) {
          this.user = user
          this.role = normalizeRole(user)
        }
        if (token || user) this.persist()

        return { ok: true, data }
      } catch (err: any) {
        const d = err?.response?.data

        const english = String(
        d?.message ||
        (d?.errors && Object.values(d.errors)?.[0]?.[0]) ||
        'No se pudo registrar'
      )
      const dict: Array<[RegExp, string]> = [
        [/the name field is required/i,         'Debes escribir tu nombre.'],
        [/the email field is required/i,        'Debes escribir tu correo.'],
        [/the email has already been taken/i,   'Ese correo ya está registrado.'],
        [/password confirmation/i,              'La confirmación de contraseña no coincide.'],
        [/the password field is required/i,     'Debes escribir tu contraseña.'],
        [/must be at least .* characters/i,     'La contraseña es demasiado corta.'],
      ]
      let msg = english
      for (const [re, es] of dict) if (re.test(english)) { msg = es; break }

      const fields = (d?.errors ?? {}) as Record<string, string[]>
      this.error = msg
      return { ok: false, error: this.error, fieldErrors: fields }
    } finally {
      this.loading = false
    }
  },

    /* Demo / botones de prueba */
    loginAs(role: Role, name = 'Demo') {
      this.user  = { id: 1, nombre: name, nombreRol: role } as any
      this.role  = role
      this.token = 'demo'
      this.persist()
    },
  },
})

export default useAuthStore
