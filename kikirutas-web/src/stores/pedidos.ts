import { defineStore } from 'pinia';

export type PedidoEstado = 'pendiente' | 'en_ruta' | 'entregado' | 'cancelado';

export interface Pedido {
  id: string;
  folio: string;
  producto: string;
  cantidad: number;
  fechaISO: string;   // yyyy-mm-dd
  estado: PedidoEstado;
  observaciones?: string;
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
  },

  actions: {
    persist() {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.items));
    },
    load() {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      try { this.items = JSON.parse(raw) ?? []; } catch {}
    },

    // Llamar tras éxito del POST a tu API
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

    setEstado(id: string, estado: PedidoEstado) {
      const p = this.items.find(i => i.id === id);
      if (!p) return;
      p.estado = estado;
      this.persist();
    },

    update(id: string, partial: Partial<Pedido>) {
      const p = this.items.find(i => i.id === id);
      if (!p) return;
      Object.assign(p, partial);
      this.persist();
    },
  },
});
