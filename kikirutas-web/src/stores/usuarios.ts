// src/stores/usuarios.ts
import { defineStore } from 'pinia'
import api from '@/api'

export type RolUsuario = 'user' | 'admin' | 'operador'

export interface Usuario {
  id: string
  nombre: string
  email: string
  telefono?: string | null
  comunidad?: string | null
  rol: RolUsuario
  activo: boolean
  createdAt: number
}

type State = {
  items: Usuario[]
}

/**
 * Mapea el usuario que viene del backend Laravel
 * a la forma que usamos en el front.
 */
function mapFromApi(u: any): Usuario {
  // ---- Rol ----
  const rolApi = u.nombreRol ?? u.role?.name ?? u.rol ?? null
  let rol: RolUsuario = 'user'

  if (rolApi) {
    const r = String(rolApi).toLowerCase()
    if (r.includes('admin')) {
      rol = 'admin'
    } else if (r.includes('operador') || r.includes('operator')) {
      rol = 'operador'
    }
  } else if (typeof u.role_id !== 'undefined') {
    // Ajusta estos IDs a tu tabla "roles"
    if (Number(u.role_id) === 1) rol = 'admin'
    else if (Number(u.role_id) === 2) rol = 'operador'
    else rol = 'user'
  }


  // ---- Activo / Inactivo ----
  const activo =
    typeof u.activo !== 'undefined'
      ? Boolean(u.activo)
      : (u.estado ?? u.status ?? 'activo') !== 'inactivo'

  // ---- Fecha de alta ----
  const createdStr = u.created_at ?? u.createdAt ?? null
  const createdAt =
    createdStr && !isNaN(Date.parse(createdStr))
      ? Date.parse(createdStr)
      : Date.now()

  return {
    id: String(u.id),
    nombre: String(u.name ?? u.nombre ?? ''),
    email: String(u.email ?? ''),
    telefono: u.telefono ?? u.phone ?? null,
    comunidad: u.comunidad ?? null,
    rol,
    activo,
    createdAt,
  }
}

export const useUsuariosStore = defineStore('usuarios', {
  state: (): State => ({
    items: [],
  }),

  getters: {
    sorted: (s) => [...s.items].sort((a, b) => b.createdAt - a.createdAt),
    byId: (s) => (id: string) => s.items.find((u) => u.id === id),
  },

  actions: {
    // ---------- CARGA DESDE LARAVEL ----------
    async load() {
      const res = await api.get('/usuarios')
      const data = Array.isArray(res.data?.data) ? res.data.data : res.data
      this.items = (data as any[]).map(mapFromApi)
    },

    // ---------- CREAR USUARIO ----------
    async create(payload: {
      nombre: string
      email: string
      telefono?: string
      comunidad?: string
      rol: RolUsuario
    }) {
      const body: any = {
        name: payload.nombre,
        email: payload.email,
        telefono: payload.telefono ?? null,
        comunidad: payload.comunidad ?? null,
      }

      // Rol → role_id (ajusta estos IDs según tu tabla "roles")
      body.role_id = payload.rol === 'admin' ? 1 : 3

      const res = await api.post('/usuarios', body)
      const user = mapFromApi(res.data)
      this.items.unshift(user)
    },

    // ---------- EDITAR USUARIO ----------
    async update(
      id: string,
      payload: {
        nombre: string
        email: string
        telefono?: string
        comunidad?: string
        rol: RolUsuario
      },
    ) {
      const u = this.byId(id)
      if (!u) throw new Error('Usuario no encontrado')

      const body: any = {
        name: payload.nombre,
        email: payload.email,
        telefono: payload.telefono ?? null,
        comunidad: payload.comunidad ?? null,
      }

      body.role_id = payload.rol === 'admin' ? 1 : 3

      const res = await api.put(`/usuarios/${id}`, body)
      const upd = mapFromApi(res.data)

      Object.assign(u, upd)
    },

    // ---------- ACTIVAR / DESACTIVAR ----------
    async toggleActivo(id: string) {
      const u = this.byId(id)
      if (!u) return

      const nuevoActivo = !u.activo

      const res = await api.put(`/usuarios/${id}`, {
        activo: nuevoActivo,
      })

      const upd = mapFromApi(res.data)
      Object.assign(u, upd)
    },

    // ---------- CAMBIAR ROL ----------
    async setRol(id: string, rol: RolUsuario) {
      const u = this.byId(id)
      if (!u) return

      const body: any = {
        rol,
        role_id: rol === 'admin' ? 1 : 3,
      }

      const res = await api.put(`/usuarios/${id}`, body)
      const upd = mapFromApi(res.data)
      Object.assign(u, upd)
    },

    // ---------- ELIMINAR USUARIO ----------
    async remove(id: string) {
      await api.delete(`/usuarios/${id}`)
      this.items = this.items.filter((u) => u.id !== id)
    },

    // ---------- RESET PASSWORD (solo front, sin backend) ----------
    /**
     * Mantengo esta función síncrona para que siga funcionando
     * con tu componente actual. Genera una contraseña temporal
     * y la devuelve (puedes luego implementar el endpoint real).
     */
    /*     resetPassword(id: string): string | null {
          const u = this.byId(id)
          if (!u) return null
    
          const temp = Math.random().toString(36).slice(2, 10)
          console.warn('Contraseña temporal para usuario', id, temp)
          return temp
        }, */
  },
})
