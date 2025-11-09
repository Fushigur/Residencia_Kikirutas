import { defineStore } from 'pinia';
import type { AlertaSeveridad } from './alertas';
import { useAlertasStore } from './alertas';

export type PedidoEstado = 'pendiente' | 'en_ruta' | 'entregado' | 'cancelado';

export interface Pedido {
  id: string;
  folio: string;
  producto: string;
  cantidad: number;
  fechaISO: string;   // yyyy-mm-dd
  estado: PedidoEstado;
  observaciones?: string;
  routeId?: string;   // ← ruta asignada (opcional)
}

type State = { items: Pedido[] };

const STORAGE_KEY = 'pedidos_usuario';

function newId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}
function todayISO() {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}

export const usePedidosStore = defineStore('pedidos', {
  state: (): State => ({ items: [] }),

  getters: {
    ordenados: (s) => [...s.items].sort((a, b) =>
      b.fechaISO.localeCompare(a.fechaISO)
    ),
    nextFolio: (s) => `KIK-${String(s.items.length + 1).padStart(3, '0')}`,
    pendientes: (s) => s.items.filter(p => p.estado === 'pendiente'),
    byId: (s) => (id: string) => s.items.find(p => p.id === id),
  },

  actions: {
    persist() { localStorage.setItem(STORAGE_KEY, JSON.stringify(this.items)); },
    load() {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      try { this.items = JSON.parse(raw) ?? []; } catch {}
    },

    addFromNewOrder(payload: { producto: string; cantidad: number; observaciones?: string; folio?: string }) {
      const pedido: Pedido = {
        id: newId(),
        folio: payload.folio ?? this.nextFolio,
        producto: payload.producto,
        cantidad: payload.cantidad,
        fechaISO: todayISO(),
        estado: 'pendiente',
        observaciones: payload.observaciones?.trim() || undefined,
      };
      this.items.unshift(pedido);
      this.persist();
      return pedido.id;
    },

    setEstado(id: string, estado: PedidoEstado, opts?: { routeId?: string }) {
      const p = this.items.find(i => i.id === id);
      if (!p) return;

      // routeId (puede ser undefined para limpiar)
      if (opts && 'routeId' in opts) p.routeId = opts.routeId;

      p.estado = estado;
      this.persist();

      // Notificación local (demo)
      try {
        const alertas = useAlertasStore();
        const push = (titulo: string, mensaje: string, severidad: AlertaSeveridad = 'info') =>
          alertas.add({
            titulo, mensaje, tipo: 'pedido', severidad,
            ctaPrimaria: { label: 'Ver historial', routeName: 'u.historial' },
          });

        if (estado === 'en_ruta') {
          push('Tu pedido va en ruta', `Tu pedido ${p.folio} fue asignado a ruta y va en camino.`);
        } else if (estado === 'entregado') {
          push('Pedido entregado', `Tu pedido ${p.folio} fue marcado como entregado. ¡Gracias!`);
        } else if (estado === 'cancelado') {
          push('Pedido cancelado', `Tu pedido ${p.folio} fue cancelado.`, 'warning');
        }
      } catch { /* noop en contexto admin separado */ }
    },

    // Helpers para rutas
    assignToRoute(routeId: string, pedidoId: string) {
      const p = this.items.find(i => i.id === pedidoId);
      if (!p || p.estado !== 'pendiente') return false;
      this.setEstado(pedidoId, 'en_ruta', { routeId });
      return true;
    },
    removeFromRoute(pedidoId: string) {
      const p = this.items.find(i => i.id === pedidoId);
      if (!p) return false;
      this.setEstado(pedidoId, 'pendiente', { routeId: undefined });
      return true;
    },
  },
});
