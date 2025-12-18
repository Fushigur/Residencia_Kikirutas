// src/stores/pedidos.ts
import { defineStore } from 'pinia'
import api from '@/api'
import type { AlertaSeveridad } from './alertas'
import { useAlertasStore } from './alertas'

export type PedidoEstado = 'pendiente' | 'en_ruta' | 'entregado' | 'cancelado'

export interface Pedido {
  id: string
  folio: string
  producto: string
  cantidad: number
  fechaISO: string
  estado: PedidoEstado
  routeId?: string | null
  observaciones?: string

  // Snapshot del solicitante (se usa en Admin/Reportes/Operador)
  solicitanteNombre?: string
  solicitanteComunidad?: string
  solicitanteMunicipio?: string
  lat?: number | null
  lng?: number | null
}

type State = { items: Pedido[] }

const STORAGE_KEY = 'pedidos_usuario'

/* Helpers */
function newId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

// Mapea el pedido que viene de Laravel al formato de nuestro store
function mapFromApi(p: any): Pedido {
  const fecha = (p.fecha ?? p.created_at ?? new Date().toISOString()).slice(0, 10)

  // DEBUG: Check if 'rutas' is present
  if (p.rutas && Array.isArray(p.rutas) && p.rutas.length > 0) {
    // console.log(`[DEBUG] Pedido ${p.id} tiene ruta:`, p.rutas[0].id)
  } else {
    // console.log(`[DEBUG] Pedido ${p.id} NO trae rutas del API`)
  }

  return {
    id: String(p.id),
    folio: p.folio ? String(p.folio) : `KIK-${String(p.id).padStart(3, '0')}`,
    producto: String(p.producto ?? ''),
    cantidad: Number(p.cantidad ?? 1),
    fechaISO: fecha,
    estado: (p.estado as PedidoEstado) ?? 'pendiente',
    routeId:
      p.rutas && Array.isArray(p.rutas) && p.rutas[0]
        ? String(p.rutas[0].id)
        : null,
    observaciones: p.notas ?? '',
    solicitanteNombre: p.solicitante_nombre ?? '—',
    solicitanteComunidad: p.solicitante_comunidad ?? '—',
    solicitanteMunicipio: p.solicitante_municipio ?? '—',
    lat: p.lat ? Number(p.lat) : null,
    lng: p.lng ? Number(p.lng) : null,
  }
}

export const usePedidosStore = defineStore('pedidos', {
  state: (): State => ({ items: [] }),

  getters: {
    ordenados: (s) =>
      [...s.items].sort((a, b) => {
        // fecha desc, luego folio desc
        const byDate = b.fechaISO.localeCompare(a.fechaISO)
        return byDate !== 0 ? byDate : b.folio.localeCompare(a.folio)
      }),
    pendientes: (s) => s.items.filter((p) => p.estado === 'pendiente' && !p.routeId),
    byId: (s) => (id: string) => s.items.find((p) => p.id === id),
  },

  actions: {
    /* Persistencia en el local */
    persist() {
      try {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(this.items))
      } catch {
        // por si el navegador bloquea sessionStorage
      }
    },

    /* Cargar desde API (con filtro opcional mine) */
    async load(opts?: { estado?: PedidoEstado; mine?: boolean }) {
      const params: Record<string, any> = {}

      if (opts?.estado) params.estado = opts.estado
      if (opts?.mine) params.mine = 1

      try {
        const res = await api.get('/pedidos', { params })
        const payload: any = res.data

        const data = Array.isArray(payload?.data)
          ? payload.data // respuesta paginada { data, links, meta }
          : Array.isArray(payload)
            ? payload // o array plano
            : []

        // console.log('[DEBUG] Pedidos cargados API:', data.length)  
        this.items = data.map(mapFromApi)
        this.persist()
      } catch (error) {
        console.error('Error cargando pedidos desde API', error)
        this.items = []
      }
    },

    /* Eliminar pedido */
    async delete(id: string) {
      try {
        await api.delete(`/pedidos/${id}`)
        this.items = this.items.filter((i) => i.id !== id)
        this.persist()
        return true
      } catch (error) {
        console.error('No se pudo eliminar el pedido', error)
        return false
      }
    },

    /* Generador de folios KIK-001, KIK-002, ... */
    nextFolio(): string {
      const prefix = 'KIK-'
      const nums = this.items
        .map((p) => {
          const n = parseInt(p.folio.replace(/\D/g, ''), 10)
          return Number.isFinite(n) ? n : NaN
        })
        .filter((n) => !Number.isNaN(n))
      const next = (nums.length ? Math.max(...nums) : 0) + 1
      return `${prefix}${String(next).padStart(3, '0')}`
    },

    /* Crear pedido desde el formulario de usuaria */
    addFromNewOrder(
      payload: { producto: string; cantidad: number; observaciones?: string },
      solicitante?: { nombre?: string; comunidad?: string }
    ) {
      const p: Pedido = {
        id: newId(),
        folio: this.nextFolio(),
        producto: payload.producto,
        cantidad: payload.cantidad,
        fechaISO: todayISO(),
        estado: 'pendiente',
        observaciones: payload.observaciones?.trim() ?? '',
        solicitanteNombre: solicitante?.nombre || '—',
        solicitanteComunidad: solicitante?.comunidad || '—',
      }
      this.items.push(p)
      this.persist()
      return p.id
    },

    /* Actualizar estado (y ruta) contra backend */
    async setEstado(id: string, estado: PedidoEstado, opts?: { routeId?: string | null }) {
      // Actualizar en el backend
      try {
        await api.patch(`/pedidos/${id}/estado`, { estado })
      } catch (error) {
        console.error('No se pudo actualizar el estado del pedido en el backend', error)
        return false
      }

      // Actualizar en el store local
      const p = this.items.find((i) => i.id === id)
      if (!p) return false

      if (opts && 'routeId' in opts) p.routeId = opts.routeId ?? null

      p.estado = estado
      this.persist()

      // Notificaciones locales
      try {
        const alertas = useAlertasStore()
        const push = (
          titulo: string,
          mensaje: string,
          severidad: AlertaSeveridad = 'info'
        ) =>
          alertas.addLocal({
            titulo,
            mensaje,
            tipo: 'pedido',
            severidad,
            ctaPrimaria: { label: 'Ver historial', routeName: 'u.historial' },
          })

        if (estado === 'en_ruta') {
          push('Tu pedido va en ruta', `Tu pedido ${p.folio} fue puesto en recorrido.`)
        } else if (estado === 'entregado') {
          push(
            'Pedido entregado',
            `Tu pedido ${p.folio} fue marcado como entregado. ¡Gracias!`
          )
        } else if (estado === 'cancelado') {
          push('Pedido cancelado', `Tu pedido ${p.folio} fue cancelado.`, 'warning')
        }
      } catch {
        // contexto admin sin alertas
      }

      return true
    },

    /* --------- Helpers para rutas/admin ---------- */

    assignToRoute(routeId: string, pedidoId: string) {
      console.log(`[DEBUG] assignToRoute called for pedido ${pedidoId} -> ruta ${routeId}`)
      const p = this.items.find((i) => i.id === pedidoId)
      if (!p) {
        console.warn(`[DEBUG] Pedido ${pedidoId} not found`)
        return false
      }
      if (p.estado !== 'pendiente') {
        console.warn(`[DEBUG] Pedido ${pedidoId} no está pendiente (${p.estado})`)
        return false
      }
      p.routeId = routeId
      console.log(`[DEBUG] Pedido ${pedidoId} assigned cleanly to ${routeId}`)
      this.persist()
      return true
    },

    removeFromRoute(pedidoId: string) {
      const p = this.items.find((i) => i.id === pedidoId)
      if (!p) return false
      p.routeId = null
      if (p.estado !== 'entregado') p.estado = 'pendiente'
      this.persist()
      return true
    },
  },
})
