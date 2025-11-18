// src/stores/productos.ts
import { defineStore } from 'pinia'
import api from '@/api'

export interface Producto {
  id: string
  nombre: string
  precio: number
  activo: boolean
  createdAt: string | null
}

type State = {
  items: Producto[]
}

/**
 * Mapea el producto que viene del backend Laravel
 * a la forma que usamos en el front.
 */
function mapFromApi(p: any): Producto {
  const createdStr = p.created_at ?? p.createdAt ?? null

  return {
    id: String(p.id),
    nombre: String(p.nombre ?? p.name ?? ''),
    precio: Number(p.precio ?? p.price ?? 0),
    activo:
      typeof p.activo !== 'undefined'
        ? Boolean(p.activo)
        : (p.estado ?? p.status ?? 'activo') !== 'inactivo',
    createdAt: createdStr ?? null,
  }
}

export const useProductosStore = defineStore('productos', {
  state: (): State => ({
    items: [],
  }),

  getters: {
    // 👈 ESTE es el que debes usar en las vistas: store.ordenados
    ordenados: (s) => [...s.items].sort((a, b) => a.nombre.localeCompare(b.nombre)),
    activos: (s) => s.items.filter((p) => p.activo),
    byId: (s) => (id: string) => s.items.find((p) => p.id === id),
  },

  actions: {
    // ---------- CARGA DESDE LARAVEL ----------
    async load() {
      const res = await api.get('/productos')
      const data = Array.isArray((res.data as any).data)
        ? (res.data as any).data
        : res.data

      this.items = (data as any[]).map(mapFromApi)
    },

    // Antes sembrábamos productos "fake" desde el front.
    // Ahora todos vienen de Laravel, así que aquí no hacemos nada.
    async seedDefaults() {
      // no-op
    },

    // ---------- CREAR PRODUCTO ----------
    async create(payload: { nombre: string; precio: number }) {
      const body = {
        nombre: payload.nombre,
        precio: payload.precio,
        activo: true,
      }

      const res = await api.post('/productos', body)
      const prod = mapFromApi(res.data)
      this.items.push(prod)
    },

    // ---------- EDITAR PRODUCTO ----------
    async update(id: string, payload: { nombre: string; precio: number }) {
      const p = this.byId(id)
      if (!p) throw new Error('Producto no encontrado')

      const body = {
        nombre: payload.nombre,
        precio: payload.precio,
        activo: p.activo,
      }

      const res = await api.put(`/productos/${id}`, body)
      const upd = mapFromApi(res.data)
      Object.assign(p, upd)
    },

    // ---------- ACTIVAR / DESACTIVAR ----------
    async toggleActivo(id: string) {
      const p = this.byId(id)
      if (!p) return

      const res = await api.put(`/productos/${id}`, {
        activo: !p.activo,
      })

      const upd = mapFromApi(res.data)
      Object.assign(p, upd)
    },

    // ---------- ELIMINAR ----------
    async remove(id: string) {
      await api.delete(`/productos/${id}`)
      this.items = this.items.filter((p) => p.id !== id)
    },
  },
})