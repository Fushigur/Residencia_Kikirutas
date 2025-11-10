// src/stores/pedidos.ts
import { defineStore } from 'pinia';
import type { AlertaSeveridad } from './alertas';
import { useAlertasStore } from './alertas';

export type PedidoEstado = 'pendiente' | 'en_ruta' | 'entregado' | 'cancelado';

export interface Pedido {
  id: string;
  folio: string;
  producto: string;
  cantidad: number;
  fechaISO: string;
  estado: PedidoEstado;
  routeId?: string | null;
  observaciones?: string;

  // Snapshot del solicitante (se usa en Admin/Reportes/Operador)
  solicitanteNombre?: string;
  solicitanteComunidad?: string;
}

type State = { items: Pedido[] };

const STORAGE_KEY = 'pedidos_usuario';

/* Helpers */
function newId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}
function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export const usePedidosStore = defineStore('pedidos', {
  state: (): State => ({ items: [] }),

  getters: {
    ordenados: (s) =>
      [...s.items].sort((a, b) => {
        // fecha desc, luego folio desc
        const byDate = b.fechaISO.localeCompare(a.fechaISO);
        return byDate !== 0 ? byDate : b.folio.localeCompare(a.folio);
      }),
    pendientes: (s) => s.items.filter((p) => p.estado === 'pendiente'),
    byId:      (s) => (id: string) => s.items.find((p) => p.id === id),
  },

  actions: {
    /* Persistencia */
    persist() { localStorage.setItem(STORAGE_KEY, JSON.stringify(this.items)); },
    load() {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      try { this.items = JSON.parse(raw) ?? []; } catch {/* noop */}
    },

    /* Generador de folios KIK-001, KIK-002, ... */
    nextFolio(): string {
      const prefix = 'KIK-';
      const nums = this.items
        .map((p) => {
          const n = parseInt(p.folio.replace(/\D/g, ''), 10);
          return Number.isFinite(n) ? n : NaN;
        })
        .filter((n) => !Number.isNaN(n));
      const next = (nums.length ? Math.max(...nums) : 0) + 1;
      return `${prefix}${String(next).padStart(3, '0')}`;
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
      };
      this.items.push(p);
      this.persist();
      return p.id;
    },

    /* Cambiar estado (y opcionalmente routeId) + alerta local para la usuaria */
    setEstado(id: string, estado: PedidoEstado, opts?: { routeId?: string | null }) {
      const p = this.items.find((i) => i.id === id);
      if (!p) return;

      if (opts && 'routeId' in opts) p.routeId = opts.routeId ?? null;

      p.estado = estado;
      this.persist();

      // Notificaciones locales (si existe el store de alertas)
      try {
        const alertas = useAlertasStore();
        const push = (titulo: string, mensaje: string, severidad: AlertaSeveridad = 'info') =>
          alertas.add({
            titulo,
            mensaje,
            tipo: 'pedido',
            severidad,
            ctaPrimaria: { label: 'Ver historial', routeName: 'u.historial' },
          });

        if (estado === 'en_ruta') {
          push('Tu pedido va en ruta', `Tu pedido ${p.folio} fue puesto en recorrido.`);
        } else if (estado === 'entregado') {
          push('Pedido entregado', `Tu pedido ${p.folio} fue marcado como entregado. ¡Gracias!`);
        } else if (estado === 'cancelado') {
          push('Pedido cancelado', `Tu pedido ${p.folio} fue cancelado.`, 'warning');
        }
      } catch { /* contexto admin sin alertas */ }
    },

    /* --------- Helpers para rutas/admin ---------- */

    // Importante: al asignar a ruta SOLO se fija routeId.
    // El estado permanece "pendiente" hasta que el operador inicia el recorrido.
    assignToRoute(routeId: string, pedidoId: string) {
      const p = this.items.find((i) => i.id === pedidoId);
      if (!p || p.estado !== 'pendiente') return false;
      p.routeId = routeId;
      this.persist();
      return true;
    },

    removeFromRoute(pedidoId: string) {
      const p = this.items.find((i) => i.id === pedidoId);
      if (!p) return false;
      p.routeId = null;
      if (p.estado !== 'entregado') p.estado = 'pendiente';
      this.persist();
      return true;
    },
  },
});
